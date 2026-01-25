// supabase/functions/process-timelapse/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    try {
        const { sessionId, userId } = await req.json()

        // Validate Auth (Optional but recommended: Verify JWT)
        // const authHeader = req.headers.get('Authorization')
        // ... verify user ...

        // Trigger Cloud Run Worker
        // We use fire-and-forget logic if we don't want to wait, 
        // OR await it to propagate errors. 
        // Since Cloud Run can create cold starts > 2s, better to await so we know it started,
        // but not wait for full processing (unless using async invocation).
        // For simplicity, we just call the HTTP endpoint.

        const WORKER_URL = Deno.env.get('WORKER_URL'); // e.g. https://timelapse-worker-xyz-uc.a.run.app
        const WORKER_SECRET = Deno.env.get('WORKER_SECRET'); // Shared secret for security

        if (!WORKER_URL) {
            throw new Error("WORKER_URL not configured");
        }

        console.log(`Forwarding job ${sessionId} to ${WORKER_URL}`);

        const response = await fetch(`${WORKER_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authentication': `Bearer ${WORKER_SECRET}`,
                // Pass through Supabase keys if needed? 
                // The worker has its own service key, so just data is enough.
            },
            body: JSON.stringify({ sessionId, userId })
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Worker failed: ${txt}`);
        }

        const result = await response.json();
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } })

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
