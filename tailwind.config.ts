import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#141929',
        foreground: '#FFFFFF',
        card: { DEFAULT: '#1B2036', foreground: '#FFFFFF' },
        primary: { DEFAULT: '#00E5C8', foreground: '#141929' },
        secondary: { DEFAULT: '#7B61FF', foreground: '#FFFFFF' },
        muted: { DEFAULT: '#242B45', foreground: '#555E7E' },
        accent: { DEFAULT: '#00E5C8', foreground: '#141929' },
        destructive: { DEFAULT: '#FF6B6B', foreground: '#FFFFFF' },
        border: '#2E3650',
        input: '#2A3150',
        ring: '#00E5C8',
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '6px',
      },
    },
  },
  plugins: [],
};
export default config;
