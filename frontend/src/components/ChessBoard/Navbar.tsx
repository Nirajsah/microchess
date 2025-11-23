import { useChessStore } from '@/store/microchess'
import { useWalletStore } from '@/store/wallet'
import { Link } from 'react-router-dom'
import React from 'react'

export default function Navbar() {
  const updateShowProfile = useChessStore((s) => s.updateShowProfile)
  const checkWalletExistsAsync = useWalletStore((s) => s.checkWalletExistAsync)
  const walletExists = useWalletStore((s) => s.walletExists)
  const initAsync = useWalletStore((s) => s.initAsync)

  React.useEffect(() => {
    checkWalletExistsAsync()
  }, [])

  // React.useEffect(() => {
  //   if (walletExists) {
  //     console.log('wallet exists, calling init')
  //     initAsync()
  //   }
  // }, [walletExists])

  return (
    <div className="w-full h-14 p-3 flex justify-center">
      <div className="w-full max-w-[1280px] flex justify-between items-center">
        <Link to="/">
          <div className="text-xl">MicroChess</div>
        </Link>
        <button onClick={updateShowProfile}>OPen</button>
      </div>
    </div>
  )
}
