import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { MockChainCarousel } from './MockChainCarousel'
import { PlayerProfile } from './PlayerProfile'
import { useChessStore } from '@/store/microchess'
import { useWalletStore } from '@/store/wallet'
import React from 'react'

export default function WalletSheet() {
  const isOpen = useChessStore((s) => s.showProfile)
  const toggle = useChessStore((s) => s.updateShowProfile)
  const walletExists = useWalletStore((s) => s.walletExists)
  const JsWallet = useWalletStore((s) => s.getJsWalletAsync)

  React.useEffect(() => {
    if (!walletExists) return

    const fetchWallet = async () => {
      const wallet = await JsWallet()
      console.log('WALLET:', wallet)
    }

    fetchWallet()
  }, [walletExists])

  return (
    <Sheet open={isOpen} onOpenChange={toggle}>
      <SheetHeader className="hidden">
        <SheetTitle>Title Here</SheetTitle>
        <SheetDescription>This sheet lets you do XYZ.</SheetDescription>
      </SheetHeader>
      <SheetContent className="text-white h-full">
        {!walletExists ? (
          <div className="w-full h-full flex justify-center items-center">
            <GetStarted />
          </div>
        ) : (
          <div className="flex w-full h-full flex-col overflow-scroll">
            <PlayerProfile />
            <div className="flex-1" />
            <div className="w-full">
              <MockChainCarousel />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

const GetStarted = () => {
  const toggle = useChessStore((s) => s.updateShowProfile)
  const create = useWalletStore((s) => s.createWalletAsync)

  return (
    <div className="w-full flex flex-col gap-4 p-4 text-white">
      <h1 className="text-lg font-semibold">Welcome to MicroChess</h1>

      <p className="text-sm text-zinc-400 leading-relaxed">
        To get started, please create a wallet.
        <br />
        For the best experience, we recommend using a Chromium-based browser.
      </p>

      <div className="flex gap-3 pt-2">
        <button
          onClick={create}
          className="flex-1 py-2 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition"
        >
          Create Wallet
        </button>

        <button
          onClick={toggle}
          className="flex-1 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
