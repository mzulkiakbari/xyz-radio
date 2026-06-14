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
    const response = await fetch(`${RADIO_API_URL}/api/nowplaying/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch station info: ${response.statusText}`);
    }

    const data = await response.json();
    const listenUrl = data?.station?.listen_url;

    if (!listenUrl) {
      return new NextResponse("Stream URL not found", { status: 404 });
    }

    // Redirect browser/client langsung ke stream Icecast aslinya
    // Ini penting karena Vercel Serverless Function tidak bisa menahan stream audio berdurasi panjang
    return NextResponse.redirect(listenUrl);

  } catch (error) {
    console.error("Stream Redirect Error:", error);
    return new NextResponse("Error fetching stream info", { status: 500 });
  }
}
