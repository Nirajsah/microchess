import { useUserStore } from '@/store/microchess'
import { useWalletStore } from '@/store/wallet'
import React from 'react'

export default function Navbar() {
  const handleGetStarted = useUserStore((s) => s.handleGetStarted)
  const checkWalletExistsAsync = useWalletStore((s) => s.checkWalletExistAsync)
  const walletExists = useWalletStore((s) => s.walletExists)
  const pubKey = useWalletStore((s) => s.pubKey)
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

      <button
        onClick={handleGetStarted}
        className="px-6 py-2 rounded-3xl truncate lg:w-full lg:max-w-fit cursor-pointer text-end hover:scale-105 duration-300 transition-all"
      >
        {pubKey ? pubKey : 'Get Started'}
      </button>
    </div>
  )
}
