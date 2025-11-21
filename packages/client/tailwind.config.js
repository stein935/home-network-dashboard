/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'col-span-1',
    'col-span-2',
    'col-span-3',
    'col-span-4',
    'col-span-full',
    'row-span-1',
    'row-span-2',
    'row-span-3',
    'grid-flow-dense',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f5f5f5',
        surface: '#ffffff',
        text: '#000000',
        border: '#ff0000',
        accent1: '#0000ff',
        accent2: '#ff00ff',
        accent3: '#00ff00',
        error: '#ff0000',
      },
      fontFamily: {
        display: ['"Bowlby One"', 'Impact', 'Arial Black', 'sans-serif'],
        body: ['"Carrois Gothic"', 'Arial', 'Helvetica', 'sans-serif'],
        accent: ['"VT323"', 'Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['4rem', { lineHeight: '1', fontWeight: '900' }],
        'display-md': ['3rem', { lineHeight: '1.1', fontWeight: '900' }],
        'display-sm': ['2rem', { lineHeight: '1.2', fontWeight: '900' }],
        'accent-lg': ['4rem', { lineHeight: '1', fontWeight: '400' }],
        'accent-md': ['3rem', { lineHeight: '1.1', fontWeight: '400' }],
        'accent-sm': ['2rem', { lineHeight: '1.2', fontWeight: '400' }],
      },
      borderWidth: {
        3: '3px',
        5: '5px',
      },
      boxShadow: {
        brutal: '8px 8px 0px 0px rgba(0,0,0,0.8)',
        'brutal-sm': '4px 4px 0px 0px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
