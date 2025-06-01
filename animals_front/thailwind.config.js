module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',     // Indigo-600 (main brand color)
        secondary: '#EEF2FF',   // Light indigo background
        accent: '#818CF8',      // Lighter indigo for accents
        dark: '#1F2937',        // Gray-800 for text
      },
      fontFamily: {
        sans: ['Nunito_400Regular', 'Nunito_700Bold'],
      },
    },
  },
  plugins: [],
};