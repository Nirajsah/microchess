import { Convert } from '@/lib/chainsType'
import { useWalletStore } from '@/store/wallet'
import { ChevronLeft, ChevronRight, Copy, RefreshCw } from 'lucide-react'
import React, { useRef } from 'react'

export function MockChainCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const rawWallet = useWalletStore((s) => s.JsWallet)

  const walletData = React.useMemo(() => {
    if (!rawWallet) return null
    try {
      const wallet = Convert.toWallet(rawWallet)
      return {
        chains: Object.values(wallet.chains),
        defaultChain: wallet.defaultChain,
      }
    } catch (e) {
      console.error('Failed to parse wallet:', e)
      return null
    }
  }, [rawWallet])

  const chains = walletData?.chains || null
  const defaultChain = walletData?.defaultChain || ''

  const balance = 123.45

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    console.log('Copied:', text)
  }

  const handleSetDefault = (chainId: string) => {
    console.log('Setting default:', chainId)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = current.clientWidth * 0.95
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // 3. Loading State: If no chains data, show Loading immediately
  if (!chains) {
    return (
      <div className="w-full h-[250px] flex items-center justify-center text-white">
        <span className="animate-pulse">Loading Wallet...</span>
      </div>
    )
  }

  // 4. Render Carousel
  return (
    <div className="relative w-full h-[250px] max-w-full group">
      {/* Navigation Buttons (Absolute Positioned) */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 m-2"
        aria-label="Scroll left"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 m-2"
        aria-label="Scroll right"
      >
        <ChevronRight size={20} />
      </button>

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="flex w-full h-full overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar gap-2"
      >
        {chains.map((chain, i) => (
          <div
            key={i}
            className="relative snap-center min-w-[95%] w-full h-full text-white overflow-hidden rounded-xl shrink-0"
          >
            {/* Background Card Shape */}
            <svg
              viewBox="0 0 335 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-0 left-0 w-full h-full z-0"
            >
              <path
                d="M199 0C221.141 1.57401 219.108 34.6909 238.5 36.5H278.5C314 36.5 330 40 335 60V177C335 189.7 324.7 200 312 200H23C10.3 200 0 189.7 0 177V23C0 10.3 10.3 0 23 0H199Z"
                fill="#191e1c"
              />
            </svg>

            {/* Content */}
            <div className="absolute w-full min-h-[200px] inset-0 flex flex-col justify-between z-10 text-white">
              <div className="px-5 py-4">
                <div className="text-xs text-rose-300">Linera</div>
                <div className="text-[40px] font-bold">{balance}</div>
              </div>

              <div className="flex w-full mt-4 p-2 flex-col justify-between items-start text-xs">
                <span className="flex items-center gap-2 px-2 py-1 rounded-full text-sm w-full min-w-0">
                  <span className="truncate">ChainId: {chain.chainId}</span>
                  <Copy
                    size={14}
                    className="cursor-pointer text-gray-500 hover:text-gray-300"
                    onClick={() => handleCopy(chain.chainId)}
                  />
                </span>
                <span className="flex items-center gap-2 px-2 py-1 rounded-full text-sm w-full min-w-0">
                  <span className="truncate">Account: {chain.owner}</span>
                  <Copy
                    size={14}
                    className="cursor-pointer text-gray-500 hover:text-gray-300"
                    onClick={() => handleCopy(chain.owner)}
                  />
                </span>
              </div>

              {defaultChain === chain.chainId ? (
                <button
                  disabled
                  className="text-white bg-black text-xs absolute top-2 right-4 px-4 py-1 rounded-3xl flex gap-1 items-center"
                >
                  <RefreshCw width={15} />
                  Default
                </button>
              ) : (
                <button
                  onClick={() => handleSetDefault(chain.chainId)}
                  className="text-black text-xs absolute top-2 right-4 border px-3 py-0.5 rounded-3xl flex gap-1 items-center bg-white/90"
                >
                  <RefreshCw width={15} />
                  Set Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
