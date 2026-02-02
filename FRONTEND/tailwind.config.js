/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.js",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        brandNavy: "#003566",
        brandOrange: "#FF8500",
        brandBlue: "#E0F2FE", // New soft sky blue background
        brandRed: "#C92A2A", // Deep wedding red
        brandGold: "#D4AF37", // Metallic gold
      },
    },
  },
  plugins: [],
};
