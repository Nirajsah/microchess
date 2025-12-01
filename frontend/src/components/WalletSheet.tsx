import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { MockChainCarousel } from './MockChainCarousel'
import { PlayerProfile } from './PlayerProfile'
import { useUserStore } from '@/store/microchess'
import { useWalletStore } from '@/store/wallet'
import React, { useEffect, useState } from 'react'
import { getProfile } from '@/api'
import { Loader2, ShieldCheck, Wallet } from 'lucide-react'

export default function WalletSheet() {
  const isOpen = useUserStore((s) => s.getStarted)
  const toggle = useUserStore((s) => s.handleGetStarted)
  const setProfile = useUserStore((s) => s.setUserProfile)
  const walletExists = useWalletStore((s) => s.walletExists)
  const ready = useWalletStore((s) => s.ready)
  const refetch = useWalletStore((s) => s.refetch)
  const JsWallet = useWalletStore((s) => s.getJsWalletAsync)

  React.useEffect(() => {
    if (!walletExists) return
    const fetchWallet = async () => {
      await JsWallet()
    }
    const fetchProfile = async () => {
      const res = await getProfile()
      setProfile(JSON.parse(res.result).data.profile)
    }

    fetchWallet()
    if (ready) {
      fetchProfile()
    }
  }, [walletExists, ready, refetch])

  return (
    <Sheet open={isOpen} onOpenChange={toggle}>
      <SheetHeader className="hidden">
        <SheetTitle>Title Here</SheetTitle>
        <SheetDescription>This sheet lets you do XYZ.</SheetDescription>
      </SheetHeader>
      <SheetContent className="text-white h-full outline-none focus:outline-none focus:ring-0 border-l-zinc-800">
        {!walletExists ? (
          <div className="w-full h-full flex justify-center items-center">
            <GetStarted />
          </div>
        ) : (
          <div className="flex w-full h-full flex-col">
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

const LoadingState = () => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1000)
    const t2 = setTimeout(() => setStep(2), 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const steps = [
    { label: 'Crating Wallet', icon: Loader2, spin: true },
    { label: 'Initializing Client...', icon: Wallet, spin: false },
    { label: 'Syncing Chain...', icon: ShieldCheck, spin: false },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6 animate-in fade-in duration-500">
      {/* Central Animated Icon */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-zinc-500/20 blur-2xl rounded-full animate-pulse" />
        <div className="relative w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center shadow-2xl">
          {step < 2 ? (
            <Loader2 className="w-8 h-8 text-zinc-200 animate-spin" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-green-400 animate-in zoom-in duration-300" />
          )}
        </div>
      </div>

      {/* Steps List */}
      <div className="flex flex-col gap-3 w-full max-w-[240px] px-4">
        {steps.map((s, i) => {
          const isActive = i === step
          const isDone = i < step

          return (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                isActive || isDone ? 'opacity-100' : 'opacity-30 blur-[1px]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors duration-500 ${
                  isDone
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : isActive
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                    : 'border-zinc-800'
                }`}
              >
                {isDone ? (
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : isActive ? (
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                ) : null}
              </div>
              <span className={`${isDone ? 'text-zinc-500' : 'text-zinc-200'}`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const GetStarted = () => {
  const toggle = useUserStore((s) => s.handleGetStarted)
  const create = useWalletStore((s) => s.createWalletAsync)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    const minDelay = new Promise((resolve) => setTimeout(resolve, 2000))
    try {
      await Promise.all([create(), minDelay])
    } catch (error) {
      console.error('Failed', error)
      setIsCreating(false)
    }
  }

  if (isCreating) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6 p-6 text-white animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 shadow-inner border border-zinc-700/50">
          <Wallet className="w-6 h-6 text-zinc-300" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Create Wallet</h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-[260px] mx-auto">
          Securely store your game assets and track your chess ELO on-chain.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <button
          onClick={handleCreate}
          className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-lg shadow-white/5"
        >
          Start Now
        </button>
        <button
          onClick={toggle}
          className="w-full py-3 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
