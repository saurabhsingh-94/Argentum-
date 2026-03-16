import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        card: '#111111',
        silver: '#C0C0C0',
        accent: {
          DEFAULT: '#22c55e',
          glow: 'rgba(34,197,94,0.2)',
        },
      },
      boxShadow: {
        glow: '0 0 10px 1px rgba(34,197,94,0.2)',
        silver: '0 0 10px 1px rgba(192,192,192,0.15)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
