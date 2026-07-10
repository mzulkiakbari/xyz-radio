import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const stationId = (await params).id;
  const RADIO_API_URL = process.env.RADIO_API_URL || "https://radio.xyz-sa.site/api";
  const AZURACAST_API_KEY = process.env.AZURACAST_API_KEY;

  try {
    const res = await fetch(`${RADIO_API_URL}/station/${stationId}/streamers`, {
      headers: {
        "X-API-Key": AZURACAST_API_KEY || "",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Gagal memuat streamer dari Azuracast" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
