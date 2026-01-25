import express from 'express';
import { createClient } from '@supabase/supabase-js';
// import AdmZip from 'adm-zip'; // Removed in favor of native unzip
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
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
    const targetPath = `${cleanUserId}/${cleanSessionId}`;

    console.log(`🔍 DIAGNOSTIC MODE`);
    console.log(`-- Env Check: Service Key Length: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0}`);
    console.log(`-- Inputs: User='${cleanUserId}', Session='${cleanSessionId}'`);
    console.log(`-- Target Path: '${targetPath}'`);

    if (!cleanSessionId || !cleanUserId) {
        return res.status(400).json({ error: 'Missing sessionId or userId' });
    }

    const workDir = path.join('/tmp', cleanSessionId);
    const imagesDir = path.join(workDir, 'images');
    const outputDir = path.join(workDir, 'output');

    try {
        // Cleanup
        if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
        fs.mkdirSync(imagesDir, { recursive: true });
        fs.mkdirSync(outputDir, { recursive: true });

        // DIAGNOSTIC 1: Check Root of User Folder
        console.log(`\n1. Checking User Folder: ${cleanUserId}`);
        const { data: userLevel, error: userError } = await supabase.storage
            .from('raw-uploads')
            .list(cleanUserId);

        if (userError) throw userError;

        console.log(`   Found ${userLevel?.length || 0} items.`);
        if (!userLevel || userLevel.length === 0) {
            console.log("   [EMPTY] - The worker cannot see ANY session folders.");
            // Fallback: Check root
            const { data: root } = await supabase.storage.from('raw-uploads').list();
            console.log("   Root bucket content:", root?.map(i => i.name));
            throw new Error(`User folder '${cleanUserId}' not found or empty.`);
        }

        // Match session folder?
        // Note: Supabase .list() returns items in the folder. If 'cleanSessionId' is a folder, it should appear here?
        // Actually, sometimes 'list(path)' returns contents OF that path, not the path itself.
        // We listed 'cleanUserId', so we expect to see 'cleanSessionId' as a folder inside it.
        const sessionFolderItem = userLevel.find(item => item.name === cleanSessionId);
        if (!sessionFolderItem) {
            console.log(`   ❌ Session folder '${cleanSessionId}' NOT found in user listing.`);
            console.log(`   Available: ${userLevel.map(i => i.name).join(', ')}`);
            // Proceed anyway? Maybe list() behavior is tricky.
        } else {
            console.log(`   ✅ Session folder found in listing.`);
        }

        // DIAGNOSTIC 2: List Specific Session Folder
        console.log(`\n2. Listing Target Path: ${targetPath}`);
        const { data: sessionLevel, error: sessionError } = await supabase.storage
            .from('raw-uploads')
            .list(targetPath);

        if (sessionError) throw sessionError;

        console.log(`   Found ${sessionLevel?.length || 0} items.`);
        sessionLevel?.forEach(item => console.log(`   - ${item.name} (${item.metadata ? 'FILE' : 'FOLDER'}) Size: ${item.metadata?.size}`));

        // Filter Zips
        const zips = sessionLevel?.filter(item => item.name.toLowerCase().endsWith('.zip')) || [];

        if (zips.length === 0) {
            throw new Error("Folder exists but contains no zip files.");
        }

        console.log(`\n✅ Found ${zips.length} zips. Processing...`);

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
            console.log(`   Saved ${fileData.size} bytes to ${localZipPath}`);

            // Validating Zip (Check header or size)
            const stat = fs.statSync(localZipPath);
            if (stat.size < 100) console.warn("   [WARNING] Zip file is suspiciously small!");

            // Unzip using system command (more robust than adm-zip)
            try {
                console.log(`   Unzipping ${localZipPath} to ${imagesDir}...`);
                await execPromise(`unzip -o "${localZipPath}" -d "${imagesDir}"`);
            } catch (zipErr) {
                console.error(`   Failed to unzip ${zipFile.name}:`, zipErr);
                // If unzip fails, we might still want to see if ANYTHING was extracted or throw
                // throw new Error(`Unzip failed: ${zipErr.message}`);
            }
        }

        // Log Tree
        let tree = "\nExtracted Tree:";
        const buildTree = (dir: string, indent: string) => {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                tree += `\n${indent}- ${item.name}`;
                if (item.isDirectory()) buildTree(path.join(dir, item.name), indent + "  ");
            }
        };
        try { buildTree(imagesDir, ""); } catch (e) { }
        console.log(tree);

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
            throw new Error(`No images found after unzip. Tree: ${tree}`);
        }

        // Move to Flat
        allImages.forEach((absolutePath, index) => {
            const newName = `img_${String(index).padStart(5, '0')}.jpg`;
            const newPath = path.join(imagesDir, newName);
            if (absolutePath !== newPath) fs.renameSync(absolutePath, newPath);
        });

        // FFmpeg
        console.log("Starting FFmpeg...");
        const outputVideo = path.join(outputDir, 'video.mp4');
        const ffmpegCmd = `ffmpeg -y -framerate 20 -i "${imagesDir}/img_%05d.jpg" -c:v libx264 -pix_fmt yuv420p "${outputVideo}"`;
        await execPromise(ffmpegCmd);

        const videoStat = fs.statSync(outputVideo);
        console.log(`Video generated: ${videoStat.size} bytes`);

        // Upload
        const storagePath = `${cleanUserId}/${cleanSessionId}.mp4`;
        const { error: upErr } = await supabase.storage
            .from('timelapses')
            .upload(storagePath, fs.readFileSync(outputVideo), { contentType: 'video/mp4', upsert: true });

        if (upErr) throw upErr;

        // DB Update
        await supabase.from('timelapse_sessions')
            .update({ video_url: storagePath, status: 'completed' })
            .eq('id', cleanSessionId);

        // 7. Cleanup raw uploads
        console.log("Cleaning up raw uploads...");
        // Filter for zips and remove them
        const filesToRemove = zips.map(z => `${targetPath}/${z.name}`);
        if (filesToRemove.length > 0) {
            const { error: rmError } = await supabase.storage.from('raw-uploads').remove(filesToRemove);
            if (rmError) console.error("Failed to cleanup raw uploads:", rmError);
            else console.log("   Deleted raw zips.");
        }

        console.log("✅ Success.");
        res.json({ success: true, video: storagePath, diagnostic: "Passed" });

    } catch (e: any) {
        console.error("Diagnostic Failure:", e);
        // Include full logs in error response
        res.status(500).json({ error: e.message, hint: "Check cloud logs for tree" });
    } finally {
        if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Worker listening on port ${PORT}`);
});
