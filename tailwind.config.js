/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-in-out',
        'slide-in-left': 'slideInLeft 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'flicker': 'flicker 2s ease-in-out infinite',
        'fire-glow': 'fireGlow 2s ease-in-out infinite',
        'streak-pulse': 'streakPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.6)' },
        },
        flicker: {
          '0%, 100%': { 
            transform: 'scale(1) rotate(-2deg)',
            filter: 'hue-rotate(0deg) brightness(1) drop-shadow(0 0 10px rgba(255, 69, 0, 0.8))',
          },
          '20%': { 
            transform: 'scale(1.15) rotate(2deg)',
            filter: 'hue-rotate(15deg) brightness(1.3) drop-shadow(0 0 15px rgba(255, 140, 0, 0.9))',
          },
          '40%': { 
            transform: 'scale(1.08) rotate(-1deg)',
            filter: 'hue-rotate(-10deg) brightness(0.9) drop-shadow(0 0 8px rgba(255, 69, 0, 0.7))',
          },
          '60%': { 
            transform: 'scale(1.12) rotate(1.5deg)',
            filter: 'hue-rotate(20deg) brightness(1.2) drop-shadow(0 0 12px rgba(255, 165, 0, 0.8))',
          },
          '80%': { 
            transform: 'scale(1.05) rotate(-0.5deg)',
            filter: 'hue-rotate(5deg) brightness(1.1) drop-shadow(0 0 9px rgba(255, 69, 0, 0.6))',
          },
        },
        fireGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(255, 69, 0, 0.6), 0 0 40px rgba(255, 140, 0, 0.4), inset 0 0 20px rgba(255, 69, 0, 0.2)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(255, 69, 0, 0.9), 0 0 80px rgba(255, 140, 0, 0.7), inset 0 0 30px rgba(255, 69, 0, 0.3)',
          },
        },
        streakPulse: {
          '0%, 100%': { 
            transform: 'scale(1)',
            textShadow: '0 0 10px rgba(255, 165, 0, 0.8)',
          },
          '50%': { 
            transform: 'scale(1.1)',
            textShadow: '0 0 20px rgba(255, 165, 0, 1), 0 0 30px rgba(255, 69, 0, 0.8)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        firefly: {
          '0%': { 
            transform: 'translateX(0) translateY(0) scale(0)',
            opacity: '0',
          },
          '10%': {
            opacity: '1',
            transform: 'translateX(10px) translateY(-10px) scale(1)',
          },
          '20%': {
            transform: 'translateX(-10px) translateY(-20px) scale(0.8)',
          },
          '30%': {
            transform: 'translateX(20px) translateY(-10px) scale(1.2)',
          },
          '40%': {
            transform: 'translateX(-5px) translateY(-30px) scale(0.9)',
          },
          '50%': {
            transform: 'translateX(15px) translateY(-25px) scale(1.1)',
          },
          '60%': {
            transform: 'translateX(-15px) translateY(-15px) scale(0.7)',
          },
          '70%': {
            transform: 'translateX(25px) translateY(-35px) scale(1)',
          },
          '80%': {
            transform: 'translateX(-20px) translateY(-40px) scale(0.8)',
          },
          '90%': {
            transform: 'translateX(5px) translateY(-20px) scale(1.3)',
          },
          '100%': { 
            transform: 'translateX(0) translateY(-50px) scale(0)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [],
} 