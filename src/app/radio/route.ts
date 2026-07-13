import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Pastikan path ini benar jika file tsconfig.json menggunakan @/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing Radio ID", { status: 400 });
  }

  try {
    // 1. Coba cari UUID di Supabase (V2)
    let query = supabase.from('radio_orders').select('id');
    if (id.includes('-')) {
        query = query.eq('id', id);
    } else {
        query = query.eq('azuracast_station_id', parseInt(id));
    }
    
    const { data: radioData } = await query.single();
    
    if (radioData && radioData.id) {
        // Jika radio terdaftar di sistem kita, redirect ke V2 Stream
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.RADIO_API_URL || "https://radio.xyz-sa.site";
        return NextResponse.redirect(`${backendUrl}/v2/stream/${radioData.id}`);
    }

  } catch (err) {
    console.error("V2 Proxy Error:", err);
  }

  // 2. Fallback ke AzuraCast (V1) jika tidak ditemukan di DB V2
  const serverParam = searchParams.get("s");
  let rawServerUrl = process.env.RADIO_API_URL || "https://radio.xyz-sa.site";

  if (serverParam) {
    if (serverParam === "s1") {
      rawServerUrl = process.env.RADIO2_API_URL || "https://s1.radio.xyz-sa.site";
    } else if (!serverParam.includes(".")) {
      rawServerUrl = `${serverParam}.radio.xyz-sa.site`;
    } else {
      rawServerUrl = serverParam;
    }
  }

  if (!rawServerUrl.startsWith("http")) {
    rawServerUrl = `https://${rawServerUrl}`;
  }
  const RADIO_API_URL = rawServerUrl.replace(/\/api$/, '');

  try {
    const infoResponse = await fetch(`${RADIO_API_URL}/api/nowplaying/${id}`);

    if (!infoResponse.ok) {
      throw new Error(`Failed to fetch station info: ${infoResponse.statusText}`);
    }

    const data = await infoResponse.json();
    const listenUrl = data?.station?.listen_url;

    if (!listenUrl) {
      return new NextResponse("Stream URL not found", { status: 404 });
    }

    const secureListenUrl = listenUrl.replace('http://', 'https://');
    return NextResponse.redirect(secureListenUrl);

  } catch (error) {
    console.error("Stream Proxy Error:", error);
    return new NextResponse("Error fetching stream", { status: 500 });
  }
}
