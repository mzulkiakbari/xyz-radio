import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function slugify(text: string) {
    if (!text) return 'radio';
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return new NextResponse("Missing id", { status: 400 });
    
    try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!serviceKey) return new NextResponse("Server configuration error", { status: 500 });
        
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey
        );
        
        const { data: radios, error } = await supabaseAdmin
            .from('radio_orders')
            .select('id, radio_name')
            .order('start_date', { ascending: true });
            
        if (error) {
            console.error("DB Error in slug route:", error);
            return new NextResponse("DB Error", { status: 500 });
        }
            
        let finalSlug = "radio";
        if (radios) {
            const usedSlugs = new Set();
            for (const r of radios) {
                let baseSlug = slugify(r.radio_name || "radio");
                let slug = baseSlug;
                let counter = 1;
                while (usedSlugs.has(slug)) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
                usedSlugs.add(slug);
                if (r.id === id) {
                    finalSlug = slug;
                    break;
                }
            }
        }
        
        return NextResponse.json({ slug: finalSlug });
    } catch (e) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
