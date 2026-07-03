import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing Radio ID", { status: 400 });
  }

  const serverParam = searchParams.get("s");

  // Ambil RADIO_API_URL dari environment atau parameter s
  let rawServerUrl = serverParam || process.env.RADIO_API_URL || "https://radio.xyz-sa.site";
  if (!rawServerUrl.startsWith("http")) {
    rawServerUrl = `https://${rawServerUrl}`;
  }
  const RADIO_API_URL = rawServerUrl.replace(/\/api$/, '');

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

    // Jangan pipe response stream ke client melalui Next.js (sebagai Proxy)
    // karena Next.js memiliki limit timeout 5 menit (300 detik) untuk request!
    // Sebaiknya langsung redirect URL icecast ke client agar browser yang memutar.
    const secureListenUrl = listenUrl.replace('http://', 'https://');
    return NextResponse.redirect(secureListenUrl);

  } catch (error) {
    console.error("Stream Proxy Error:", error);
    return new NextResponse("Error fetching stream", { status: 500 });
  }
}
