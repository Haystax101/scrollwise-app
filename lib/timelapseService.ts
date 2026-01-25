import { File, Directory, Paths } from 'expo-file-system';
import { zip } from 'react-native-zip-archive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

const QUEUE_KEY = 'timelapse_upload_queue';
const BATCH_SIZE = 50;

export interface QueueItem {
    id: string;
    filePath: string; // Path/URI to zip file
    sessionId: string;
    userId: string;
    batchIndex: number;
    status: 'pending' | 'uploading' | 'failed';
    retryCount: number;
}

class TimelapseService {
    private buffer: string[] = []; // Local image paths
    private isUploading = false;

    // --- Capture & Buffer ---

    async addToBuffer(imageUri: string, sessionId: string, userId: string) {
        this.buffer.push(imageUri);

        if (this.buffer.length >= BATCH_SIZE) {
            await this.processBatch(sessionId, userId);
        }
    }

    async flushBuffer(sessionId: string, userId: string) {
        if (this.buffer.length > 0) {
            await this.processBatch(sessionId, userId);
        }
        // Check if queue is empty, if so, trigger finalize
        this.processQueue();
    }

    private async processBatch(sessionId: string, userId: string) {
        const batchImages = [...this.buffer];
        this.buffer = []; // Clear immediate buffer

        const batchIndex = Date.now();
        // Use Paths.cache (Directory) as base
        const cacheDir = Paths.cache;
        const batchDirName = `tl_${sessionId}_${batchIndex}`;
        const batchDir = new Directory(cacheDir, batchDirName);
        const zipFile = new File(cacheDir, `tl_${sessionId}_${batchIndex}.zip`);

        try {
            if (!batchDir.exists) {
                batchDir.create();
            }

            for (let i = 0; i < batchImages.length; i++) {
                const srcPath = batchImages[i];
                // Handle source file
                const srcFile = new File(srcPath);

                // Rename file to ensure sort order (batch timestamp + index)
                // Format: img_{batchIndex}_{i}.jpg
                const ext = srcPath.split('.').pop() || 'jpg';
                const filename = `img_${batchIndex}_${String(i).padStart(4, '0')}.${ext}`;
                const destFile = new File(batchDir, filename);

                if (srcFile.exists) {
                    console.log(`[Batch] Adding image: ${filename} (Size: ${srcFile.size})`);
                    srcFile.copy(destFile);
                } else {
                    console.warn(`[Batch] Source image not found: ${srcPath}`);
                }
            }

            // Zip uses URIs
            // .uri property gives the file:// URI needed by native modules like zip-archive
            await zip(batchDir.uri, zipFile.uri);

            console.log(`[Batch] Zipped batch ${batchIndex} size:`, zipFile.size);

            // Cleanup Raw Images
            if (batchDir.exists) batchDir.delete();

            // Clean up original images
            for (const imgPath of batchImages) {
                const imgFile = new File(imgPath);
                if (imgFile.exists) imgFile.delete();
            }

            // Add to Queue
            await this.addToQueue({
                id: batchIndex.toString(),
                filePath: zipFile.uri,
                sessionId,
                userId,
                batchIndex,
                status: 'pending',
                retryCount: 0
            });

            // Trigger Upload
            this.processQueue();

        } catch (e) {
            console.error('[Batch] Processing failed', e);
        }
    }

    // --- Queue Management ---

    private async getQueue(): Promise<QueueItem[]> {
        const json = await AsyncStorage.getItem(QUEUE_KEY);
        return json ? JSON.parse(json) : [];
    }

    private async saveQueue(queue: QueueItem[]) {
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }

    async addToQueue(item: QueueItem) {
        const queue = await this.getQueue();
        queue.push(item);
        await this.saveQueue(queue);
    }

    async processQueue() {
        if (this.isUploading) return;

        const queue = await this.getQueue();
        const pending = queue.find(i => i.status === 'pending');

        if (!pending) return;

        this.isUploading = true;

        try {
            console.log(`[Queue] Uploading batch ${pending.batchIndex}...`);
            await this.uploadZip(pending);

            // Remove from queue on success
            const updatedQueue = (await this.getQueue()).filter(i => i.id !== pending.id);
            await this.saveQueue(updatedQueue);

            // Delete local zip
            const zipFile = new File(pending.filePath);
            if (zipFile.exists) zipFile.delete();

            console.log(`[Queue] Batch ${pending.batchIndex} uploaded and cleaned up.`);

            const remainingForSession = updatedQueue.filter(i => i.sessionId === pending.sessionId);
            if (remainingForSession.length === 0) {
                console.log(`[Queue] All batches done for session ${pending.sessionId}. Invoking process-timelapse...`);
                // Trigger Edge Function
                const { error } = await supabase.functions.invoke('process-timelapse', {
                    body: {
                        sessionId: pending.sessionId,
                        userId: pending.userId
                    }
                });
                if (error) console.error("[Queue] Failed to invoke function:", error);
                else console.log("[Queue] Invocation successful.");
            }

            this.isUploading = false;
            this.processQueue();

        } catch (e) {
            console.error(`[Queue] Upload failed for batch ${pending.batchIndex}`, e);
            this.isUploading = false;
        }
    }

    private async uploadZip(item: QueueItem) {
        console.log(`[Upload] Starting upload for batch ${item.batchIndex}`);

        const file = new File(item.filePath);
        if (!file.exists) {
            console.warn(`[Upload] File not found at ${item.filePath}, skipping.`);
            return;
        }

        console.log(`[Upload] Reading file ${file.size} bytes...`);

        // Use base64() from new API
        // Note: Expo File System Next methods are often synchronous or async depending on implementation.
        // Assuming base64() returns the content string (or Promise<string>).
        // Since we are inside async function, awaiting it covers both cases.
        const content = await file.base64();

        const path = `${item.userId}/${item.sessionId}/batch_${item.batchIndex}.zip`;
        console.log(`[Upload] Uploading to Storage: ${path}`);

        const { error } = await supabase.storage
            .from('raw-uploads')
            .upload(path, decode(content), {
                contentType: 'application/zip',
                upsert: true
            });

        if (error) {
            console.error(`[Upload] Storage error:`, error);
            throw error;
        }

        console.log(`[Upload] Success: ${path}`);
    }

    // Call this when user stops or app opens to retry stray items
    async checkQueue() {
        this.processQueue();
    }
}

export const timelapseService = new TimelapseService();
