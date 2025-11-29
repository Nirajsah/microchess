import { useUserStore } from '@/store/microchess'
import { useWalletStore } from '@/store/wallet'
import { Link } from 'react-router-dom'
import React from 'react'
import { storage } from '@/api'
import { ThemeName } from '../components/theme'

export default function Navbar() {
  const handleGetStarted = useUserStore((s) => s.handleGetStarted)
  const checkWalletExistsAsync = useWalletStore((s) => s.checkWalletExistAsync)
  const walletExists = useWalletStore((s) => s.walletExists)
  const pubKey = useWalletStore((s) => s.pubKey)
  const initAsync = useWalletStore((s) => s.initAsync)
  const ready = useWalletStore((s) => s.ready)
  const updateTheme = useUserStore((s) => s.updateTheme)

  React.useEffect(() => {
    checkWalletExistsAsync()
    const stroage_theme = storage.getTheme()
    updateTheme(stroage_theme as ThemeName)
  }, [])

  React.useEffect(() => {
    if (walletExists && !ready) {
      initAsync()
    }
  }, [walletExists])

  return (
    <div className="w-full h-14 p-3 flex justify-center">
      <div className="w-full max-w-[1280px] flex justify-between items-center">
        <Link to="/">
          <div className="text-xl">MicroChess</div>
        </Link>
        <button className="text-md" onClick={handleGetStarted}>
          {pubKey ? pubKey : 'Get Started'}
        </button>
      </div>
    </div>
  )
}
