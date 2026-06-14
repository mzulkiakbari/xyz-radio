import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing Radio ID", { status: 400 });
  }

  // Ambil RADIO_API_URL dari environment
  const RADIO_API_URL = process.env.RADIO_API_URL || "https://xyz-radio.pokonime.com";

  try {
    // Ambil detail stasiun radio dari public API Azuracast
    const infoResponse = await fetch(`${RADIO_API_URL}/api/nowplaying/${id}`);
    
    if (!infoResponse.ok) {
      throw new Error(`Failed to fetch station info: ${infoResponse.statusText}`);
    }

    const data = await infoResponse.json();
    const listenUrl = data?.station?.listen_url;

    if (!listenUrl) {
      return new NextResponse("Stream URL not found", { status: 404 });
    }

    // Ambil stream Icecast secara langsung
    const streamResponse = await fetch(listenUrl);

    if (!streamResponse.ok) {
      throw new Error(`Failed to fetch stream: ${streamResponse.statusText}`);
    }

    // Pipe response stream directly ke client (sebagai Proxy)
    return new NextResponse(streamResponse.body, {
      headers: {
        "Content-Type": streamResponse.headers.get("Content-Type") || "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Stream Proxy Error:", error);
    return new NextResponse("Error fetching stream", { status: 500 });
  }
}
