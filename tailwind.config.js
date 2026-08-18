/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // design-guidelines.md: 아이보리/연한 베이지 기반 + 초록색 주요 액션 컬러
        ivory: {
          50: '#FDFCF8',
          100: '#F8F4E9',
          200: '#F1EAD6',
        },
        leaf: {
          50: '#EEF6EA',
          100: '#D9EBCF',
          300: '#9BCB88',
          500: '#5B9C4D',
          600: '#487D3D',
          700: '#3A6431',
        },
        bark: {
          400: '#B79A73',
          600: '#8B6F4E',
          800: '#5A4632',
        },
        // 등급 컬러 (금/은/동) — 별점 시스템 아님
        rank: {
          gold: '#D9A441',
          silver: '#A7ADB4',
          bronze: '#B0703F',
        },
        ink: {
          700: '#3F3A32',
          900: '#2A2620',
        },
      },
      fontFamily: {
        sans: ['"Pretendard"', '"Apple SD Gothic Neo"', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 10px rgba(90, 70, 50, 0.08)',
        soft: '0 4px 16px rgba(90, 70, 50, 0.10)',
      },
    },
  },
  plugins: [],
}
