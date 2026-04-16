/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Isso diz ao Tailwind para olhar dentro de src e todas as subpastas
  ],
  theme: {
    extend: {
      // Aqui podemos adicionar as cores e arredondamentos específicos do seu projeto
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
        '6xl': '4rem',
      }
    },
  },
  plugins: [],
}