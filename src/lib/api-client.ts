/**
 * Argentum Unified API Client
 * Handles CSRF tokens, credentials, and common error patterns.
 */

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiClient(url: string, options: RequestOptions = {}) {
  const { token, headers: customHeaders, ...rest } = options;

  const headers = new Headers(customHeaders);
  headers.set('Content-Type', 'application/json');
  
  // Attach CSRF token if provided
  if (token) {
    headers.set('x-csrf-token', token);
  }

  const config: RequestInit = {
    ...rest,
    headers,
    // CRITICAL: Ensure cookies are sent with every request
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 403 && data.error === 'CSRF token missing') {
        throw new Error('Security session expired. Please refresh the page.');
      }
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`[apiClient] Error fetching ${url}:`, error);
    throw error;
  }
}
