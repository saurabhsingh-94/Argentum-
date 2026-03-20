import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper to initialize with service role only at runtime
const getAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { action, userId, token: csrfToken } = await request.json();

    // 1. Diagnostics: Log headers and cookies for debugging
    console.log(`[API] Users Action: ${action} for ${userId}`);
    console.log(`[API] Headers:`, Object.fromEntries(request.headers.entries()));
    const cookieHeader = request.headers.get('cookie');
    console.log(`[API] Cookies present:`, !!cookieHeader);

    // 2. CSRF & Auth Check
    const tokenFromHeader = request.headers.get('x-csrf-token');
    const token = csrfToken || tokenFromHeader;

    if (!token && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
    }

    // We use the regular server client to verify the CURRENT session
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) {
      console.warn(`[API] Unauthorized access attempt to users/action`);
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

    // 4. Perform Action using Admin Client (initialized at runtime)
    const supabaseAdmin = getAdminClient();

    if (action === 'delete') {
      // Delete from auth.users
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
