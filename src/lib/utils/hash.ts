export async function hashContent(content: string) {
  const buf = await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(content))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2,'0')).join('')
}
