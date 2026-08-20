import express from 'express';
import { createClient } from '@supabase/supabase-js';
// import AdmZip from 'adm-zip'; // Removed in favor of native unzip
import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const app = express();
app.use(express.json());

// Init Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

import { Request, Response } from 'express';

app.post('/process', async (req: Request, res: Response) => {
    const { sessionId, userId } = req.body;

    // 1. Sanitize Inputs
    const cleanUserId = userId?.trim();
    const cleanSessionId = sessionId?.trim();

    console.log(`REQ: Processing Request Received`);
    console.log(`-- Inputs: User='${cleanUserId}', Session='${cleanSessionId}'`);

    if (!cleanSessionId || !cleanUserId) {
        return res.status(400).json({ error: 'Missing sessionId or userId' });
    }

    // 2. Fire and Forget (Async Processing)
    // We do NOT await this. It runs in the background.
    // Cloud Run Gen 2 with "CPU always allocated"recommended.
    processSessionBackground(cleanSessionId, cleanUserId).catch(err => {
        console.error(`Background Process Failed for ${cleanSessionId}:`, err);
    });

    // 3. Return accepted immediately
    return res.status(202).json({
        success: true,
        message: 'Processing started in background.',
        sessionId: cleanSessionId
    });
});

// Background Processing Function
async function processSessionBackground(sessionId: string, userId: string) {
    const targetPath = `${userId}/${sessionId}`;
    const workDir = path.join('/tmp', sessionId);
    const imagesDir = path.join(workDir, 'images');
    const outputDir = path.join(workDir, 'output');

    console.log(`[Background] Starting job for ${sessionId}`);

    try {
        // Cleanup
        if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
        fs.mkdirSync(imagesDir, { recursive: true });
        fs.mkdirSync(outputDir, { recursive: true });

        // DIAGNOSTIC 1: Check Root of User Folder
        console.log(`\n1. Checking User Folder: ${userId}`);
        const { data: userLevel, error: userError } = await supabase.storage
            .from('raw-uploads')
            .list(userId);

        if (userError) throw userError;

        console.log(`Found ${userLevel?.length || 0} items.`);
        if (!userLevel || userLevel.length === 0) {
            console.log("[EMPTY] - The worker cannot see ANY session folders.");
            // Fallback check omitted for brevity in background mode, but could add back
            throw new Error(`User folder '${userId}' not found or empty.`);
        }

        const sessionFolderItem = userLevel.find(item => item.name === sessionId);
        if (!sessionFolderItem) {
            console.log(`Session folder '${sessionId}'NOT found in user listing.`);
            console.log(`Available: ${userLevel.map(i => i.name).join(', ')}`);
        } else {
            console.log(`Session folder found in listing.`);
        }

        // DIAGNOSTIC 2: List Specific Session Folder
        console.log(`\n2. Listing Target Path: ${targetPath}`);
        const { data: sessionLevel, error: sessionError } = await supabase.storage
            .from('raw-uploads')
            .list(targetPath);

        if (sessionError) throw sessionError;

        // Filter Zips
        const zips = sessionLevel?.filter(item => item.name.toLowerCase().endsWith('.zip')) || [];

        if (zips.length === 0) {
            throw new Error("Folder exists but contains no zip files.");
        }

        console.log(`\n Found ${zips.length} zips. Processing...`);

        // --- PROCESSING LOGIC ---
        for (const zipFile of zips) {
            console.log(`Downloading ${zipFile.name}...`);
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('raw-uploads')
                .download(`${targetPath}/${zipFile.name}`);

            if (downloadError) throw downloadError;

            const localZipPath = path.join(workDir, zipFile.name);
            const arrayBuffer = await fileData.arrayBuffer();
            fs.writeFileSync(localZipPath, Buffer.from(arrayBuffer));
            console.log(`Saved ${fileData.size} bytes to ${localZipPath}`);

            // Unzip using system command
            try {
                console.log(`Unzipping ${localZipPath} to ${imagesDir}...`);
                await execPromise(`unzip -o "${localZipPath}" -d "${imagesDir}"`);
            } catch (zipErr) {
                console.error(`Failed to unzip ${zipFile.name}:`, zipErr);
            }
        }

        // Files
        const getAllFiles = (dir: string, arr: string[] = []) => {
            fs.readdirSync(dir).forEach(f => {
                const full = path.join(dir, f);
                if (fs.statSync(full).isDirectory()) getAllFiles(full, arr);
                else arr.push(full);
            });
            return arr;
        }
        const allImages = getAllFiles(imagesDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        allImages.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

        console.log(`Extracted ${allImages.length} images for FFmpeg.`);

        if (allImages.length === 0) {
            throw new Error(`No images found after unzip.`);
        }

        // Move to Flat
        allImages.forEach((absolutePath, index) => {
            const newName = `img_${String(index).padStart(5, '0')}.jpg`;
            const newPath = path.join(imagesDir, newName);
            if (absolutePath !== newPath) fs.renameSync(absolutePath, newPath);
        });

        // FFmpeg Streaming
        console.log("Starting FFmpeg Stream...");

        // Spawn FFmpeg with pipe:1 (stdout)
        const ffmpegArgs = [
            '-y',
            '-framerate', '20',
            '-i', path.join(imagesDir, 'img_%05d.jpg'),
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-movflags', 'frag_keyframe+empty_moov', // Critical for streaming MP4 container
            '-f', 'mp4',
            'pipe:1'
        ];

        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

        // Optional: log stderr if needed, but keep it quiet for perf unless error
        ffmpegProcess.stderr.on('data', (data) => {
            // console.log(`[FFmpeg]: ${data}`);
        });

        const storagePath = `${userId}/${sessionId}.mp4`;

        console.log(`Piping FFmpeg stdout to Supabase Storage: ${storagePath}`);

        // Upload Stream
        // duplex: 'half'is required for Node.js fetch streaming in some environments
        const uploadPromise = supabase.storage
            .from('timelapses')
            .upload(storagePath, ffmpegProcess.stdout, {
                contentType: 'video/mp4',
                upsert: true,
                duplex: 'half'
            } as any);

        // Wait for FFmpeg to finish
        const ffmpegPromise = new Promise((resolve, reject) => {
            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });
            ffmpegProcess.on('error', (err) => reject(err));
        });

        // Wait for both to complete
        const [uploadResult, _ffmpegResult] = await Promise.all([
            uploadPromise,
            ffmpegPromise
        ]);

        if (uploadResult.error) throw uploadResult.error;

        console.log("Stream Upload complete.");

        console.log("Upload complete. Updating DB...");

        // DB Update
        const { error: dbErr } = await supabase.from('timelapse_sessions')
            .update({ video_url: storagePath, status: 'completed' })
            .eq('id', sessionId);

        if (dbErr) {
            console.error("DB Update Failed:", dbErr);
        } else {
            console.log("DB Updated. Job Complete.");
        }

        // 7. Cleanup raw uploads
        console.log("Cleaning up raw uploads...");
        const filesToRemove = zips.map(z => `${targetPath}/${z.name}`);
        if (filesToRemove.length > 0) {
            const { error: rmError } = await supabase.storage.from('raw-uploads').remove(filesToRemove);
            if (rmError) console.error("Failed to cleanup raw uploads:", rmError);
            else console.log("Deleted raw zips.");
        }

    } catch (e: any) {
        console.error("Background Processing Error:", e);
        // update DB to failed?
        await supabase.from('timelapse_sessions')
            .update({ status: 'failed' }) // Assuming 'failed' is a valid status
            .eq('id', sessionId);
    } finally {
        if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
        console.log(`[Background] Cleanup finished for ${sessionId}`);
    }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Worker listening on port ${PORT}`);
});
