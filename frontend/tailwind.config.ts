/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat'],
        fira: ['Fira Sans'],
        silkscreen: ['Silkscreen'],
        jolly: ['Jolly Lodger'],
        homenaje: ['Homenaje'],
      },
      animation: {
        'pulse-and-move-inward': 'pulseAndMoveInward 3s infinite',
        'border-trace': 'borderTrace 4s linear forwards',
        'train-top-to-center': 'trainTopToCenter 8s linear forwards',
        'train-right-to-center': 'trainRightToCenter 8s linear forwards',
        'train-bottom-to-center': 'trainBottomToCenter 8s linear forwards',
        'train-left-to-center': 'trainLeftToCenter 8s linear forwards',
      },
      keyframes: {
        pulseAndMoveInward: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(0.85)', opacity: '0.5' },
          '100%': { transform: 'scale(0.7)', opacity: '0' },
        },
        borderTrace: {
          '0%': { transform: 'translate(0, 0)', opacity: '1' },
          '85%': { opacity: '0.5' },
          '100%': {
            transform: 'translate(calc(-50vw + 50%), calc(-50vh + 50%))',
            opacity: '0',
          },
        },
        moveDownRight: {
          '0%': { transform: 'translate(0, 0)', opacity: '1' },
          '100%': { transform: 'translate(50px, 50px)', opacity: '0' },
        },
        moveLeftDown: {
          '0%': { transform: 'translate(0, 0)', opacity: '1' },
          '100%': { transform: 'translate(-50px, 50px)', opacity: '0' },
        },
        moveUpLeft: {
          '0%': { transform: 'translate(0, 0)', opacity: '1' },
          '100%': { transform: 'translate(-50px, -50px)', opacity: '0' },
        },
        moveRightUp: {
          '0%': { transform: 'translate(0, 0)', opacity: '1' },
          '100%': { transform: 'translate(50px, -50px)', opacity: '0' },
        },
        trainTopToCenter: {
          '0%': { top: '0%', left: 'var(--start-x, 50%)', opacity: 1 },
          '100%': { top: '50%', left: '50%', opacity: 0 },
        },
        trainRightToCenter: {
          '0%': { top: 'var(--start-y, 50%)', right: '0%', opacity: 1 },
          '100%': { top: '50%', right: '50%', opacity: 0 },
        },
        trainBottomToCenter: {
          '0%': { bottom: '0%', left: 'var(--start-x, 50%)', opacity: 1 },
          '100%': { bottom: '50%', left: '50%', opacity: 0 },
        },
        trainLeftToCenter: {
          '0%': { top: 'var(--start-y, 50%)', left: '0%', opacity: 1 },
          '100%': { top: '50%', left: '50%', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}
