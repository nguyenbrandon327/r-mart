/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'gt-america': ['Inter', 'system-ui', 'sans-serif'],
        'gt-america-expanded': ['GT-America-Expanded', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "primary": "#003DA5",   // Deep blue
          "secondary": "#FFB81C", // Gold
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "primary": "#003DA5",   // Deep blue
          "secondary": "#FFB81C", // Gold
        }
      }
    ],
  },
} 