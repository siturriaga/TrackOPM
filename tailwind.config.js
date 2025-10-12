/** @type {import('tailwindcss').Config} */
export default {
content: ["./index.html", "./src/**/*.{ts,tsx}"],
theme: {
extend: {
colors: {
brandBlue: "#1e40af",
brandGold: "#d4af37"
},
boxShadow: {
soft: "0 8px 30px rgba(0,0,0,0.08)"
},
borderRadius: {
'2xl': '1rem'
}
}
},
plugins: []
}
