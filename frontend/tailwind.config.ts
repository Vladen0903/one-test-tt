import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: '#24282C',
        input: '#24282C',
        ring: '#15D8F5',
        background: '#111315',
        foreground: '#FFFFFF',
        primary: {
          DEFAULT: '#15D8F5',
          foreground: '#111315',
          hover: '#10BFD8',
        },
        secondary: {
          DEFAULT: '#16191C',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#16191C',
          foreground: '#9CA3AF',
        },
        accent: {
          DEFAULT: '#16191C',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: '#16191C',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#16191C',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
