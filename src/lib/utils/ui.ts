export const getGradientFromUsername = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%) 0%, hsl(${hue2}, 80%, 40%) 100%)`;
};

export const getInitials = (display_name: string | null, username: string) => {
  const name = display_name || username;
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
