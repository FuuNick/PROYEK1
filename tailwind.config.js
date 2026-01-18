/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#5e35b1', // Deep Purple
                    light: '#ede7f6',
                    dark: '#4527a0',
                },
                secondary: {
                    DEFAULT: '#ede7f6',
                    dark: '#d1c4e9',
                },
                berry: {
                    purple: '#673ab7',
                    blue: '#2196f3',
                    orange: '#ff9800',
                    darkBlue: '#1e88e5',
                },
                success: 'var(--success)',
                error: 'var(--error)',
                warning: 'var(--warning)',
                info: 'var(--info)',
                background: '#eef2f6', // Berry background is usually slightly off-white/blueish
                paper: '#ffffff',
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
            }
        },
    },
    plugins: [],
}
