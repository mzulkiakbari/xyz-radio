import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing Radio ID", { status: 400 });
  }

  // TODO: Validasi ID radio ini di database Supabase
  // const { data } = await supabase.from('radios').select('endpoint').eq('id', id).single();
  // if (!data) return new NextResponse("Radio Not Found", { status: 404 });

  // Karena ini prototype, kita akan mem-proxy langsung dari URL environment atau mock
  // Pastikan URL tujuan adalah audio stream (misal: radio.mp3 / listen)
  const RADIO_API_URL = process.env.RADIO_API_URL || "https://xyz-radio.pokonime.com/listen/xyz/radio.mp3";

  try {
    const response = await fetch(RADIO_API_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stream: ${response.statusText}`);
    }

    // Pipe response stream directly ke client
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Stream Proxy Error:", error);
    return new NextResponse("Error fetching stream", { status: 500 });
  }
}
