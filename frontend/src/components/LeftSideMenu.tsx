import { Menu, Palette, X } from 'lucide-react'
import React from 'react'
import Themes from './Themes'

export default function LeftMenu() {
  const [showMenu, setShowMenu] = React.useState(false)
  const [showThemes, setShowThemes] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        setShowMenu((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="w-full absolute h-full pointer-events-none">
      {/* Toggle Button */}
      {!showMenu && (
        <button
          aria-label="Toggle left menu"
          onClick={() => setShowMenu(true)}
          aria-keyshortcuts="ctrl+b"
          className="pointer-events-auto fixed left-6 bottom-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-white hover:from-zinc-700 hover:to-zinc-800 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/20 z-50"
        >
          <Menu size={24} />
        </button>
      )}

      {/* SLIDING PANEL */}
      <div
        className={`
          pointer-events-auto fixed top-4 left-4 bottom-4 w-[340px]
          bg-[#161616] rounded-3xl border border-zinc-800/50 z-[90]
          shadow-2xl text-white transform transition-all duration-500
          ${
            showMenu
              ? 'translate-x-0 opacity-100'
              : '-translate-x-[calc(100%+2rem)] opacity-0'
          }
        `}
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            MicroChess
          </h1>

          <button
            onClick={() => {
              setShowMenu(false)
              setShowThemes(false)
            }}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-zinc-800/50 transition-all hover:scale-110"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* MAIN CONTENT (only shown when Themes is NOT open) */}
        {!showThemes && (
          <div className="p-4 space-y-3">
            <button
              onClick={() => setShowThemes(true)}
              className="group w-full flex items-center gap-3 p-3 rounded-xl 
              bg-zinc-800/40 border border-zinc-700/50 
              hover:bg-zinc-800/70 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Palette size={20} className="text-purple-400" />
              </div>
              <span className="font-medium">Themes</span>
            </button>
          </div>
        )}

        {/* THEMES PANEL (replaces whole content) */}
        {showThemes && (
          <div className="absolute inset-0 bg-[#161616] rounded-3xl flex flex-col animate-in fade-in duration-300">
            {/* Themes Header */}
            <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Palette size={20} />
                </div>
                <span className="text-xl font-bold">Themes</span>
              </div>

              <button
                onClick={() => {
                  setShowThemes(false)
                }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-zinc-800/50 transition-all hover:scale-110"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Themes Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <Themes />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
