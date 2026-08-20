// Check Push Notification Receipts
// This checks if notifications were actually delivered to APNs/FCM

import { serve } from "https://deno.land/std@0.200.0/http/server.ts";

const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN");

if (!EXPO_ACCESS_TOKEN) {
  throw new Error("Missing EXPO_ACCESS_TOKEN");
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { ticketIds } = await req.json();

    if (!ticketIds || !Array.isArray(ticketIds)) {
      return new Response(
        JSON.stringify({ error: "ticketIds array required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking ${ticketIds.length} receipt(s)...`);

    const response = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ ids: ticketIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Expo receipts API error: ${errorText}`);
      throw new Error(`Expo API returned ${response.status}`);
    }

    const receipts = await response.json();
    console.log(`Receipts:`, JSON.stringify(receipts, null, 2));

    // Analyze receipts
    const results = {
      total: ticketIds.length,
      ok: 0,
      error: 0,
      errors: [] as any[],
    };

    for (const ticketId of ticketIds) {
      const receipt = receipts.data[ticketId];
      if (!receipt) {
        console.log(`No receipt for ticket: ${ticketId}`);
        continue;
      }

      if (receipt.status === "ok") {
        results.ok++;
        console.log(`Ticket ${ticketId}: Delivered successfully`);
      } else if (receipt.status === "error") {
        results.error++;
        console.error(`Ticket ${ticketId}: ${receipt.message}`);
        console.error(`Error details:`, receipt.details);
        results.errors.push({
          ticketId,
          message: receipt.message,
          details: receipt.details,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        receipts: receipts.data,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error checking receipts:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
