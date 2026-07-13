import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false });

    // Jika id sudah UUID, langsung kembalikan
    if (id.includes("-")) return NextResponse.json({ success: true, uuid: id });

    // Jika bukan UUID (misalnya ID AzuraCast "1"), cari UUID-nya di radio_orders menggunakan SERVICE_ROLE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ success: false, error: 'Missing Supabase Config' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.from('radio_orders').select('id').eq('azuracast_station_id', id).single();
    
    if (data) {
        return NextResponse.json({ success: true, uuid: data.id });
    }
    
    return NextResponse.json({ success: false, error: error?.message });
}
