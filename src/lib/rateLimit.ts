import { createClient } from '@supabase/supabase-js';

// Use service role for rate limiting (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkRateLimit(
  identifier: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const { data } = await adminSupabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .single();

  if (!data) {
    await adminSupabase.from('rate_limits').insert({
      identifier,
      action: identifier.split(':')[0],
      attempts: 1,
      window_start: now.toISOString(),
    });
    return false;
  }

  // Reset window if expired
  if (new Date(data.window_start) < windowStart) {
    await adminSupabase.from('rate_limits').update({
      attempts: 1,
      window_start: now.toISOString(),
      blocked_until: null,
    }).eq('identifier', identifier);
    return false;
  }

  // Check if blocked
  if (data.blocked_until && new Date(data.blocked_until) > now) {
    return true;
  }

  // Increment attempts
  const newAttempts = (data.attempts || 0) + 1;
  const blocked = newAttempts >= maxAttempts;

  await adminSupabase.from('rate_limits').update({
    attempts: newAttempts,
    blocked_until: blocked 
      ? new Date(now.getTime() + windowSeconds * 1000).toISOString() 
      : null,
  }).eq('identifier', identifier);

  return blocked;
}
