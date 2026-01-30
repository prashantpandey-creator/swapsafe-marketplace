/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                legion: {
                    bg: '#0f172a', // Slate 900
                    card: '#1e293b', // Slate 800
                    text: '#f8fafc', // Slate 50
                    gold: '#fbbf24', // Amber 400
                    goldHover: '#d97706', // Amber 600
                    accent: '#0ea5e9', // Sky 500
                }
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
                heading: ['Manrope', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
