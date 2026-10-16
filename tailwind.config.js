/** @type {import('tailwindcss').Config} */
// ElevatePFS brand palette.
// Core values (Marketing visual identity guide):
//   Summit Blue      #006dad  -> summit-700
//   Advocacy Green   #009f4a  -> advocacy-500
//   Foundation Gray  #767676  -> foundation-500
// The other shades are computed tints/shades of those core values. If Marketing
// supplies the official tint/shade ramps, paste them in here and nothing else
// needs to change.
export default {
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Avenir for design materials, Calibri as the fallback (Avenir is not
        // a free web font, so Windows/Android visitors will see Calibri/Arial).
        sans: ['Avenir', '"Avenir Next"', '"Avenir LT Std"', 'Calibri', 'Carlito', 'Arial', 'sans-serif'],
      },
      colors: {
        summit: {
          '50': '#edf5f9', '100': '#d9e9f3', '200': '#b2d3e6', '300': '#80b6d6',
          '400': '#4796c4', '500': '#2481b8', '600': '#0a74b2', '700': '#006dad',
          '800': '#005d93', '900': '#004c79', '950': '#003c5f',
        },
        advocacy: {
          '50': '#edf8f2', '100': '#d9f1e4', '200': '#b2e2c9', '300': '#80cfa4',
          '400': '#47ba7d', '500': '#009f4a', '600': '#00873f', '700': '#006f34',
          '800': '#005729', '900': '#00401e', '950': '#002812',
        },
        foundation: {
          '50': '#f5f5f5', '100': '#eaeaea', '200': '#d6d6d6', '300': '#bababa',
          '400': '#9c9c9c', '500': '#767676', '600': '#646464', '700': '#535353',
          '800': '#414141', '900': '#2f2f2f', '950': '#1e1e1e',
        },
      },
    },
  },
  plugins: [],
}
