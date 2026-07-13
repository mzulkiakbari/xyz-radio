import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const serverParam = searchParams.get("s");

  if (!id) {
    return new NextResponse("Missing Radio ID", { status: 400 });
  }

  // Tentukan URL Server berdasarkan parameter 's'
  let rawServerUrl = process.env.RADIO_API_URL || "https://radio.xyz-sa.site";

  if (serverParam) {
    if (serverParam === "s1") {
      rawServerUrl = process.env.RADIO2_API_URL || "https://s1.radio.xyz-sa.site";
    } else if (!serverParam.includes(".")) {
      rawServerUrl = `https://${serverParam}.radio.xyz-sa.site`;
    } else {
      rawServerUrl = serverParam;
    }
  }

  if (!rawServerUrl.startsWith("http")) {
    rawServerUrl = `https://${rawServerUrl}`;
  }
  
  const RADIO_API_URL = rawServerUrl.replace(/\/api$/, '');
  const serverHostname = new URL(rawServerUrl).hostname; // e.g. "s1.radio.xyz-sa.site"

  try {
    // Inisialisasi Supabase dengan Service Role Key untuk bypass RLS
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (serviceKey) {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey
        );
        
        // 1. Coba cari UUID di Supabase (V2)
        let query = supabaseAdmin.from('radio_orders').select('id, server_url');
        if (id.includes('-')) {
            query = query.eq('id', id);
        } else {
            query = query.eq('azuracast_station_id', parseInt(id));
            query = query.ilike('server_url', `%${serverHostname}%`);
        }
        
        const { data: radioData, error: dbErr } = await query.limit(1).maybeSingle();
        
        if (dbErr) console.error("DB Error V2:", dbErr);
        
        if (radioData && radioData.id) {
            // Jika radio terdaftar di sistem kita, redirect ke V2 Stream
            // Kita abaikan server_url dari DB karena masih URL Azuracast lama
            let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) {
                backendUrl = "http://187.127.122.199:8999";
            }
            backendUrl = backendUrl.replace(/\/api$/, '');
            return NextResponse.redirect(`${backendUrl}/v2/stream/${radioData.id}`);
        }
    } else {
        console.error("V2 Proxy Error: SUPABASE_KEY is missing from environment variables!");
    }
  } catch (err) {
    console.error("V2 Proxy Error:", err);
  }

  // 2. Fallback ke AzuraCast (V1) jika tidak ditemukan di DB V2
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
