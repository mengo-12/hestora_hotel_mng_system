/** @type {import('tailwindcss').Config} */

const rtl = require('tailwindcss-rtl');

module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        './node_modules/flowbite-react/**/*.js',
        "./page/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],

    safelist: [
        "keen-slider",
        "keen-slider__slide"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                cairo: ['Cairo', 'sans-serif'],
                roboto: ['Roboto', 'sans-serif'],
            },
            colors: {
                purpleLinear: '#6B0CB2',
                pinkLinear: '#A317B2',
            },
        },
    },
    plugins: [
        rtl()
    ],
}