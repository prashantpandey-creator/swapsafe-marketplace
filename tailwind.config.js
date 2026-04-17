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
                    bg: '#0C0D14', // Deep void
                    card: '#111827', // Elevated surface
                    text: '#F8FAFC', // Near-white
                    gold: '#F5C542', // Legion gold
                    goldHover: '#E0A93B', // Warm hover
                    accent: '#22D3EE', // Trust cyan
                }
            },
            fontFamily: {
                sans: ['Manrope', 'Inter', 'sans-serif'],
                serif: ['Cinzel', 'serif'],
                heading: ['Cinzel', 'serif'], // Primary Heading Font
                mono: ['JetBrains Mono', 'monospace'],
                tactical: ['Chakra Petch', 'sans-serif'], // For UI numbers/stats
            }
        },
    },
    plugins: [],
}
