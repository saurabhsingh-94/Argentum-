import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Initialize with service role for admin privileges
const getAdminClient = () => createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (error) throw error;

    const settingsObj = (settings || []).reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json(settingsObj);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, value, token: csrfToken } = await request.json();

    if (!key || value === undefined || !csrfToken) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Diagnostics: Log headers and cookies for debugging
    console.log(`[API] Settings POST Request: ${key}=${value}`);
    console.log(`[API] Headers:`, Object.fromEntries(request.headers.entries()));
    const cookieHeader = request.headers.get('cookie');
    console.log(`[API] Cookies present:`, !!cookieHeader);

    // 2. CSRF & Auth Check
    const tokenFromHeader = request.headers.get('x-csrf-token');
    const token = csrfToken || tokenFromHeader;

    if (!token && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) {
      console.warn(`[API] Unauthorized access attempt to settings`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) ?? [];
    if (!adminIds.includes(adminUser.id)) {
      console.warn(`[API] Forbidden access attempt by ${adminUser.email}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. CSRF Validation Logic
    const secret = process.env.CSRF_SECRET!;
    const today = new Date().toISOString().split('T')[0];
    const expectedToken = createHmac('sha256', secret)
      .update(`${adminUser.id}:${today}`)
      .digest('hex');

    if (token && token !== expectedToken) {
       console.error(`[API] CSRF mismatch for user ${adminUser.id}`);
       if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Invalid security token' }, { status: 403 });
       }
    }

    // 3. Update settings table using admin client to bypass RLS
    const supabaseAdmin = getAdminClient();
    const { error } = await supabaseAdmin
      .from('platform_settings')
      .upsert({ 
        key, 
        value, 
        updated_at: new Date().toISOString() 
      } as any);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Setting "${key}" updated.` });

  } catch (error: any) {
    console.error('Settings API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
