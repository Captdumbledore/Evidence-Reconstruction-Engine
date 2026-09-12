export default {
  content: ['./src/**/*.{ts,tsx,html}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'inv-bg': '#070708',
        'inv-surface': '#101114',
        'inv-surface2': '#17181c',
        'inv-border': '#292a30',
        'inv-border2': '#3d3e45',
        'inv-red': '#e11d2e',
        'inv-red-deep': '#7f101b',
        'inv-red-bright': '#ff3347',
        'inv-text': '#f4f4f5',
        'inv-muted': '#8b8d94',
        'inv-subtle': '#6e7681',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'count-up': 'countUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(20px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
}
