/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#f97316',
        'brand-light': '#fb923c',
        'brand-dark': '#ea580c',
        ink: '#0c0c0f',
        'ink-2': '#18181f',
        'ink-3': '#232330',
        'ink-4': '#2e2e3f',
        chalk: '#f5f0eb',
        mist: '#9090a8',
        success: '#22c55e',
        danger: '#ef4444',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Cabinet Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
