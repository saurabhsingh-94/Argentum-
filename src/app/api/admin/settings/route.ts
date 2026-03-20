import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (error) throw error;

    // Convert to a cleaner object { maintenance_mode: false, ... }
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

    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) ?? [];
    if (!adminIds.includes(adminUser.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // CSRF Validation
    const secret = process.env.CSRF_SECRET!;
    const today = new Date().toISOString().split('T')[0];
    const expectedToken = createHmac('sha256', secret)
      .update(`${adminUser.id}:${today}`)
      .digest('hex');

    if (csrfToken !== expectedToken) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    // Update settings table
    const { error } = await supabase
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
