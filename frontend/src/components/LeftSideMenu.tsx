import { Menu, Settings, Timer } from 'lucide-react'
import React from 'react'
import Themes from './Themes'

// Left side sliding menu that toggles in/out with smooth animation.
// Width: 300px, Height: 100vh. Includes Settings and Timer buttons.

export const LeftSideMenu = () => {
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
    <div className="w-full h-full absolute">
      {/* Toggle button - fixed on the left side */}
      {!showMenu && (
        <button
          aria-label="Toggle left menu"
          onClick={() => setShowMenu((v) => !v)}
          aria-keyshortcuts="ctrl+b"
          className="fixed left-10 bg-[#0f0f0f] bottom-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-white hover:bg-black/80 transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sliding panel */}
      <div
        className={`fixed top-3 left-3 bottom-3 w-[300px] bg-[#0f0f0f] text-white shadow-2xl rounded-2xl border border-white/10 z-[90] transform transition-transform duration-300 ease-in-out ${
          showMenu ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
            <span className="font-semibold">Menu</span>
            <button
              onClick={() => setShowMenu(false)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10"
              aria-label="Close menu"
            >
              <Menu size={18} />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <button className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition-colors">
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button
              onClick={() => {
                setShowThemes(true)
              }}
              className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition-colors"
            >
              <Timer size={18} />
              <span>Theme</span>
            </button>
          </div>

          {showThemes && (
            <div className="absolute rounded-2xl top-0 left-0 w-full h-full backdrop-blur-md flex flex-col">
              <div className="px-4 py-4 flex items-center justify-between">
                <span className="font-semibold">Themes</span>
                <button
                  onClick={() => setShowThemes(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10"
                  aria-label="Close themes"
                >
                  <Menu size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-hidden">
                <Themes />
              </div>
            </div>
          )}

          <div className="mt-auto p-4 text-xs text-white/60">© MicroChess</div>
        </div>
      </div>
    </div>
  )
}
