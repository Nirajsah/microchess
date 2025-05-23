import React from 'react'
import { themes } from './theme'

type ThemeKey = keyof typeof themes

interface ThemePreviewProps {
  onSelect?: (theme: ThemeKey) => void
  selected?: ThemeKey
}

const ThemePreviewGrid: React.FC<ThemePreviewProps> = ({
  onSelect,
  selected,
}) => {
  const board = Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, col) =>
      (row + col) % 2 === 0 ? 'light' : 'dark'
    )
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Object.entries(themes).map(([name, { light, dark }]) => (
        <button
          key={name}
          onClick={() => onSelect?.(name as ThemeKey)}
          className={`p-1 w-fit rounded-lg ${
            selected === name ? 'bg-[#ffffff24]' : 'hover:bg-[#ffffff24]'
          } transition`}
          title={name}
        >
          <div className="grid grid-cols-4 grid-rows-4 w-20 h-20">
            {board.flat().map((color, idx) => (
              <div
                key={idx}
                style={{ backgroundColor: color === 'light' ? light : dark }}
              />
            ))}
          </div>
          <div className="text-xs text-center mt-1 capitalize text-white truncate w-20">
            {name}
          </div>
        </button>
      ))}
    </div>
  )
}

export default ThemePreviewGrid
