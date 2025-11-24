import { useUserStore } from '@/store/microchess'
import { useWalletStore } from '@/store/wallet'
import React from 'react'

export default function Navbar() {
  const updateShowProfile = useUserStore((s) => s.updateShowProfile)
  const checkWalletExistsAsync = useWalletStore((s) => s.checkWalletExistAsync)
  const walletExists = useWalletStore((s) => s.walletExists)
  const initAsync = useWalletStore((s) => s.initAsync)

  React.useEffect(() => {
    checkWalletExistsAsync()
  }, [])

  React.useEffect(() => {
    if (walletExists) {
      initAsync()
    }
  }, [walletExists])

  return (
    <div className="fixed z-20 bg-transparent backdrop-blur-lg w-full gap-2 px-3 py-2 lg:h-[60px] lg:px-14 lg:py-6 flex items-center justify-between max-w-[1440px]">
      <div className="text-2xl p-2 flex justify-center items-center w-fit h-full">
        MicroChess
      </div>

      <button onClick={updateShowProfile}>Open</button>
    </div>
  )
}
