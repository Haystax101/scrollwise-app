1. In the people page, the top right icon should be a mail icon (rather than an add people icon) and instead of just taking us to friend requests, it should be an inbox which displays sent friend requests, received friend requests, and also (new) notifications when people like or comment on one of your insights.
2. In the profile section, we need to add a "tagline" section. This should display their tagline (if they have one) and should be located below their username and above their voltz level. If they don't have a tagline, they should have the option to add one. If they do have a tagline, they should be able to edit their tagline. you should check databaseOverview.sql to see if there's already a way of storing taglines, either in profiles table or otherwise, and if not you should create a field in the appropriate place.
3. Users' tagline should be displayed below their names in the leaderboard, as well as below their names on insights they post. The leaderboard should also be redesigned to look more like the one in leaderboard.png (though the users' number of voltz should still be displayed).
4. Tapping on someones name / profile picture on either the leaderboard, people like you, your team, inbox, or insights they post, should bring up a profile detail modal with a bit more information about that user. We may already have such a modal, so you should search the codebase to see if we can repurpose this and attach in all the above places.
5. When the user taps on a piece of content in the vault, they are currently taken to that piece of content in the feed. Instead, they should be taken to that piece of content in isolation in the vault page. Use the same article / paper cards, but don't render it in the mainfeed, rather just separately. We already have logic to add a back button to the cards when coming from the vault, so we should ensure this remains to enable them to return to their vault. Ensure "vault" is the tab highlighted whilst they're viewing the content, rather than "home".
6. When moving between tabs, we should keep the feed at the same point the user was at so when they return the article they were viewing is still there. This will involve removing automatic feed reloading when navigating back to the home page, and may also involve inclusion of some kind of cache (though ensure this doesn't break the feed logic). The only way someone should be able to reload their feed is restarting the app OR manually swiping downwards when at the top of the feed to cause the manual reload (we already have this in place)
7. We should load more profiles into the "people like you" scrollview - there should be at least 6. Then obviously on "See more" they're able to scroll through more.
8. On the industry interests scrollview in the profile, we should remove the text labels (so just have the icons). This ensures the text doesn't run onto two lines and makes it look cleaner.
9. Currently streak isn't working properly. For now, we should replace the "day streak" tracker in "your progress" section in profile with the number of connections that each user has (e.g. how many friends). Refer to databaseOverview.sql to help with what you should query to track this.
10. In the profile section, we should replace the work experience, education and skills section with a simpler approach: instead we should have a "what you're passionate about" section and a "what you're working on" section. Each should be simple to enter details for - a simple text input field will suffice. You will also need to create the necessary table(s) or fields in supabase to account for this. We should limit each input to 400 characters for now. This will make the profile a lot cleaner, simpler and suited to our stakeholders.
11. We need to bring back in the ability to add profile photos in profile. They should either be able to remove their profile photo, add a new one from library or take on using camera. Expo has a specific component facilitating this. However the key for bringing in profile photo logic is that we don't have very much storage so when they upload a photo we need to heavily compress it before adding it to a supabase bucket. Since the profile photo is small, we can get a probably 10x size reduction in the file. Here's some more specifics from earlier research which may help inform you:

## Image Compression for Profile Pictures in Supabase

You're spot on—profile pics are a great candidate for aggressive optimization since they're small UI elements (e.g., thumbnails in a feed or sidebar). With Supabase Storage, you can handle compression on the client-side (e.g., via JavaScript in your app) before uploading, or use server-side processing if you integrate something like a Cloud Function. This way, you avoid storing bloated originals. Let's break down how much you can compress a 1-3MB image (typical JPEG from a phone camera) to something like 200x200px, and what that means for your 1GB free tier (~500 users at current sizes).
Key Compression Strategies
To minimize size while keeping the image recognizable and usable:

Resize to 200x200px: This alone drops dimensions by ~10-20x (assuming originals are 4000x3000px), slashing file size proportionally.
Format Choice:

JPEG: Good for photos (lossy, balances quality/size).
WebP or AVIF: Better compression (20-50% smaller than JPEG at same quality). Supabase supports these natively.

Quality Setting: Aim for 60-80% (perceptually lossless for small thumbs). Higher = bigger files.
Additional Tweaks: Strip metadata (EXIF), avoid unnecessary color profiles.

Expected File Size Reductions
Based on typical real-world tests (e.g., compressing phone camera JPEGs with tools like ImageMagick or browser APIs), here's what you can expect. These are averages—exact results vary by image content (e.g., busy photos compress less than simple portraits).

Original SizeAfter Resize (200x200px) + JPEG (80% quality)After Resize + WebP (80% quality)After Resize + AVIF (80% quality)Notes1MB~20-40KB~15-30KB~10-25KB50-90% reduction overall.2MB~30-60KB~25-45KB~20-35KBSimilar ratios; busier images hit the higher end.3MB~40-80KB~30-60KB~25-50KBWorst-case for high-detail shots.

Average per user: ~25-50KB with WebP/AVIF. This gets you 20,000-40,000 users on 1GB (factoring in ~10% overhead for metadata/folders).
Why so small? At 200x200px, even a full-color image needs far fewer pixels (~40K total). Compression algorithms discard imperceptible details, especially at low res.

How to Implement Client-Side Compression (JavaScript Example)
Use the Canvas API in the browser—it's free, fast, and works before upload. Here's a simple function to resize/compress and upload to Supabase. (Assumes you have the Supabase JS client set up.)
javascriptimport { createClient } from '@supabase/supabase-js';

const supabase = createClient('your-url', 'your-key');

async function uploadCompressedProfilePic(file, userId) {
// Step 1: Create canvas and resize
const img = new Image();
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

img.onload = async () => {
// Resize to 200x200, maintaining aspect ratio (crop if needed)
const size = 200;
canvas.width = size;
canvas.height = size;
ctx.drawImage(img, 0, 0, size, size);

    // Step 2: Compress to WebP (or 'image/jpeg' for JPEG)
    canvas.toBlob(async (blob) => {
      // Step 3: Upload to bucket (e.g., 'profile-pics')
      const { data, error } = await supabase.storage
        .from('profile-pics')
        .upload(`${userId}/avatar.webp`, blob, {
          contentType: 'image/webp',
          upsert: true, // Overwrite if exists
        });

      if (error) console.error('Upload failed:', error);
      else console.log('Uploaded:', data.path, 'Size:', blob.size); // Log size for debugging
    }, 'image/webp', 0.8); // 80% quality

};

img.src = URL.createObjectURL(file); // Load the input file
}

// Usage: Call on file input change
document.getElementById('fileInput').addEventListener('change', (e) => {
const file = e.target.files[0];
if (file) uploadCompressedProfilePic(file, 'user-123'); // Replace with actual user ID
});

Output: A ~20-40KB WebP blob ready for upload.
Tips:

Test with blob.size to monitor.
For AVIF, change to 'image/avif' (browser support is ~90% now; fallback to WebP).
If server-side: Use Supabase Edge Functions with Sharp (Node.js lib) for batch processing.

Potential Trade-offs

Quality: At 200x200px and 80% quality, it'll look sharp on screens (retina displays handle it fine). Below 60% might pixelate skin tones.
Storage Math: 1GB = 1,048,576KB. At 50KB/user: ~20K users. Add 10-20% buffer for non-image files.
Edge Cases: Vector logos/SVGs compress to <5KB—bonus if users upload those.

This should stretch your free tier way further. If you hit limits, Supabase's paid tiers scale affordably. Let me know if you need tweaks for React/Vue or server-side code!
