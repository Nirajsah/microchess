import {
  Menu,
  Settings,
  Palette,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
  Edit2,
  Check,
  X,
  ThumbsUpIcon,
} from 'lucide-react'
import React from 'react'
import Themes from './Themes'
import { getProfile, updateProfile } from '@/api'

export const LeftSideMenu = () => {
  const [showMenu, setShowMenu] = React.useState(false)
  const [showThemes, setShowThemes] = React.useState(false)
  const [showProfile, setShowProfile] = React.useState(false)
  const [isEditingName, setIsEditingName] = React.useState(false)
  const [tempName, setTempName] = React.useState('')
  const [user, setUser] = React.useState({
    name: '',
    elo: 0,
    matches: 0,
    won: 0,
    lost: 0,
    ath: 0,
  })

  const getUserProfile = async () => {
    try {
      const res = await getProfile()
      const check = JSON.parse(res.result).data.profile
      if (!check) {
        return
      }
      setUser(check)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        setShowMenu((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    getUserProfile()
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleEditName = () => {
    setTempName(user.name)
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    try {
      await updateProfile(tempName.trim())
    } catch (e) {
      console.log(e)
    }
    setIsEditingName(false)
  }

  const handleCancelEdit = () => {
    setTempName('')
    setIsEditingName(false)
  }

  return (
    <div className="w-full h-full absolute pointer-events-none">
      {/* Toggle button - fixed on the left side */}
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

      {/* Sliding panel */}
      <div
        className={`pointer-events-auto fixed top-4 left-4 bottom-4 w-[340px] bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] text-white shadow-2xl rounded-3xl border border-zinc-800/50 z-[90] transform transition-all duration-500 ease-out ${
          showMenu
            ? 'translate-x-0 opacity-100'
            : '-translate-x-[calc(100%+2rem)] opacity-0'
        }`}
      >
        <div className="h-full flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="relative rounded-3xl px-6 py-5 border-b border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  MicroChess
                </span>
              </div>
              <button
                onClick={() => {
                  setShowMenu(false)
                  setShowThemes(false)
                  setShowProfile(false)
                }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-zinc-800/50 transition-all hover:scale-110"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Menu Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3">
            {/* Settings Button */}
            {/* <button className="group w-full flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 hover:from-zinc-800 hover:to-zinc-900 border border-zinc-700/50 hover:border-zinc-600 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings size={20} className="text-blue-400" />
              </div>
              <span className="font-medium">Settings</span>
            </button> */}

            {/* Theme Button */}
            <button
              onClick={() => setShowThemes(true)}
              className="group w-full flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 hover:from-zinc-800 hover:to-zinc-900 border border-zinc-700/50 hover:border-zinc-600 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Palette size={20} className="text-purple-400" />
              </div>
              <span className="font-medium">Theme</span>
            </button>
          </div>

          {/* Profile Section at Bottom */}
          <div className="relative border-t border-zinc-800/50 mt-auto">
            {/* Profile Toggle Button */}
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user.name
                  ? user.name.charAt(0).toUpperCase()
                  : 'Guest'.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">
                  {user.name || 'Guest'}
                </p>
                <p className="text-sm text-zinc-400">ELO: {user.elo}</p>
              </div>
              <div className="text-zinc-400 group-hover:text-white transition-colors">
                {showProfile ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronUp size={20} />
                )}
              </div>
            </button>

            {/* Expanded Profile View */}
            <div
              className={`absolute bottom-full left-0 right-0 bg-gradient-to-b from-zinc-900 to-zinc-950 border-t border-zinc-800/50 transition-all duration-500 ease-out overflow-hidden ${
                showProfile ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-4 space-y-4">
                {/* Profile Header */}
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-3xl shadow-xl mx-auto">
                    {user.name
                      ? user.name.charAt(0).toUpperCase()
                      : 'Guest'.charAt(0).toUpperCase()}
                  </div>

                  {/* Editable Name */}
                  {isEditingName ? (
                    <div className="flex items-center gap-2 justify-center">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-blue-500 transition-all w-40"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                      />
                      <button
                        onClick={handleSaveName}
                        className="w-8 h-8 rounded-lg bg-green-500/20 hover:bg-green-500/30 flex items-center justify-center transition-all"
                      >
                        <Check size={16} className="text-green-400" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-all"
                      >
                        <X size={16} className="text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-center">
                      <h3 className="text-xl font-bold text-white">
                        {user.name || 'Guest'}
                      </h3>
                      <button
                        onClick={handleEditName}
                        className="w-4 h-4 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-all group"
                      >
                        <Edit2
                          size={14}
                          className="text-zinc-500 group-hover:text-blue-400 transition-colors"
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* ELO Rating */}
                <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 py-2 px-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span className="text-zinc-400 text-sm">Rating</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-400">
                      {user.elo}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 py-2 px-3.5 text-center">
                    <Target className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">
                      {user.matches}
                    </p>
                    <p className="text-xs text-zinc-400">Games Played</p>
                  </div>
                  <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 py-2 px-3.5 text-center">
                    <div className="w-5 h-5 mx-auto mb-2 text-green-400 font-bold">
                      <ThumbsUpIcon size={20} />
                    </div>
                    <p className="text-2xl font-bold text-white">{user.ath}</p>
                    <p className="text-xs text-zinc-400">ATH</p>
                  </div>
                </div>

                {/* Win/Loss/Draw Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-sm text-zinc-300">Wins</span>
                    <span className="font-bold text-green-400">{user.won}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-sm text-zinc-300">Losses</span>
                    <span className="font-bold text-red-400">{user.lost}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-500/10 border border-zinc-500/20">
                    <span className="text-sm text-zinc-300">Draws</span>
                    <span className="font-bold text-zinc-400">{0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Themes Overlay */}
          {showThemes && (
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] backdrop-blur-md flex flex-col animate-in fade-in duration-300 z-10">
              <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Palette size={20} />
                  </div>
                  <span className="text-xl font-bold">Themes</span>
                </div>
                <button
                  onClick={() => setShowThemes(false)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-zinc-800/50 transition-all hover:scale-110"
                  aria-label="Close themes"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <Themes />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
