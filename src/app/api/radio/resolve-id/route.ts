import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false });

    // Jika id sudah UUID, langsung kembalikan
    if (id.includes("-")) return NextResponse.json({ success: true, uuid: id });

    // Coba load .env dari root folder backend jika belum ada
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) {
        try {
            const rootEnvPath = path.resolve(process.cwd(), '../.env');
            if (fs.existsSync(rootEnvPath)) {
                const envConfig = dotenv.parse(fs.readFileSync(rootEnvPath));
                supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;
            }
        } catch (e) {
            console.error('Gagal membaca root .env', e);
        }
    }

    // Jika bukan UUID (misalnya ID AzuraCast "1"), cari UUID-nya di radio_orders menggunakan SERVICE_ROLE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ success: false, error: 'Missing Supabase Config (Service Role Key tidak ditemukan)' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.from('radio_orders').select('id').eq('azuracast_station_id', id).single();
    
    if (data) {
        return NextResponse.json({ success: true, uuid: data.id });
    }
    
    return NextResponse.json({ success: false, error: error?.message });
}
