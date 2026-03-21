export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const d = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  
  // If more than 24h, check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // If older than yesterday, show the date
  if (now.getFullYear() === d.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatLastSeen(isOnline: boolean, lastSeen: string | null): string {
  if (isOnline) return 'Online now';
  if (!lastSeen) return 'Offline';
  
  return `Last seen ${formatRelativeTime(lastSeen)}`;
}
