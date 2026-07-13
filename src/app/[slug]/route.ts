import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function slugify(text: string) {
    if (!text) return 'radio';
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function GET(request: Request, context: any) {
  const params = await context.params;
  const slug = params?.slug;

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!serviceKey) {
        return new NextResponse("Server configuration error (missing Supabase key)", { status: 500 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
    );
    
    // Ambil semua radio aktif untuk dihitung slug-nya
    const { data: radios, error } = await supabaseAdmin
        .from('radio_orders')
        .select('id, radio_name, azuracast_station_id, server_url, start_date')
        .order('start_date', { ascending: true }); // Penting: urutkan agar penomoran konsisten
        
    if (error) {
        return new NextResponse(`Gagal memuat data radio (DB Error): ${error.message}`, { status: 500 });
    }
    if (!radios) {
        return new NextResponse("Gagal memuat data radio (Tidak ada data)", { status: 500 });
    }

    const usedSlugs = new Set();
    let targetRadio = null;

    for (const r of radios) {
        let baseSlug = slugify(r.radio_name || "radio");
        let finalSlug = baseSlug;
        let counter = 1;
        while (usedSlugs.has(finalSlug)) {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        }
        usedSlugs.add(finalSlug);
        
        if (finalSlug === slug) {
            targetRadio = r;
            break; // slug ditemukan
        }
    }

    if (!targetRadio) {
        return new NextResponse(`Radio dengan link ${slug} tidak ditemukan.`, { status: 404 });
    }

    // Redirect ke V2 Stream
    // Karena sudah tidak pakai Azuracast, kita abaikan server_url dari DB yang mengarah ke s1.radio dll.
    // Kita gunakan NEXT_PUBLIC_BACKEND_URL dari env Vercel.
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (!backendUrl) {
        // Fallback sementara jika NEXT_PUBLIC_BACKEND_URL belum diatur di Vercel
        backendUrl = "http://187.127.122.199:8999"; 
    }
    
    // Pastikan backendUrl tidak berakhiran /api
    backendUrl = backendUrl.replace(/\/api$/, '');

    return NextResponse.redirect(`${backendUrl}/v2/stream/${targetRadio.id}`);

  } catch (err) {
    console.error("Slug Proxy Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
