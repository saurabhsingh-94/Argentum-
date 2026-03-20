import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

// Initialize with service role for admin privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { action, userId, token: csrfToken } = await request.json();

    // 1. Basic Validation
    if (!action || !userId || !csrfToken) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 2. Auth & Admin Check
    // We use the regular server client to verify the CURRENT session
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) ?? [];
    if (!adminIds.includes(adminUser.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. CSRF Validation
    const secret = process.env.CSRF_SECRET!;
    const today = new Date().toISOString().split('T')[0];
    const expectedToken = createHmac('sha256', secret)
      .update(`${adminUser.id}:${today}`)
      .digest('hex');

    if (csrfToken !== expectedToken) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    // 4. Perform Action
    if (action === 'delete') {
      // Delete from auth.users (this also triggers cascading deletes if configured, 
      // otherwise we delete from public.users first)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;

      // Log the action
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: adminUser.id,
        action: 'delete_account',
        target_type: 'user',
        target_id: userId,
        details: { method: 'admin_api' }
      });

      return NextResponse.json({ success: true, message: 'User identity deleted successfully.' });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });

  } catch (error: any) {
    console.error('Admin API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
