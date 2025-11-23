import { Copy, RefreshCw } from 'lucide-react'
import { useRef } from 'react'

export function MockChainCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mock chain data
  const chains = [
    { chainId: 'CHAIN-001', owner: '0x1234567890abcdef' },
    { chainId: 'CHAIN-002', owner: '0xaabbccddeeff1122' },
  ]

  const balance = 123.45
  const defaultChain = 'CHAIN-001'

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    console.log('Copied:', text)
  }

  const handleSetDefault = (chainId: string) => {
    console.log('Setting default:', chainId)
  }

  return (
    <div className="w-full h-[220px] max-w-full">
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
        }}
        className="flex h-full overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar gap-2"
      >
        {chains.map((chain, i) => (
          <div
            key={i}
            className="relative snap-center min-w-[95%] w-full h-full text-white overflow-hidden rounded-xl"
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
              {/* Top content */}
              <div className="px-6 pt-6">
                <div className="text-xs text-rose-300">Linera</div>
                <div className="text-[40px] font-bold">{balance}</div>
              </div>

              {/* Chain details */}
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

              {/* Default button */}
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
