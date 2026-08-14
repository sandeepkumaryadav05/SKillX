export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:          'var(--bg)',
        panel:       'var(--panel)',
        surface:     'var(--surface)',
        surface2:    'var(--surface2)',
        accent:      'var(--accent)',
        'accent-light': 'var(--accent-light)',
        'accent-dim': 'var(--accent-dim)',
        border:      'var(--border)',
        'text-base': 'var(--text)',
        'text-muted':'var(--text-muted)',
        'text-dim':  'var(--text-dim)',
        green:       'var(--green)',
        'green-bg':  'var(--green-bg)',
        red:         'var(--red)',
        'red-bg':    'var(--red-bg)',
        amber:       'var(--amber)',
        'amber-bg':  'var(--amber-bg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '0.5': '0.5px',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      boxShadow: {
        'accent': '0 4px 20px rgba(124, 111, 224, 0.25)',
      },
    },
  },
  plugins: [],
}
