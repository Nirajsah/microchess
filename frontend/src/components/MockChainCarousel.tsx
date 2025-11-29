import { useWalletStore } from '@/store/wallet'
import { ChevronLeft, ChevronRight, Copy, RefreshCw } from 'lucide-react'
import { useRef } from 'react'

export function MockChainCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const chains = useWalletStore((s) => s.chains)
  const defaultChain = useWalletStore((s) => s.defaultChain)
  const balance = useWalletStore((s) => s.chainBalance)
  const setRefetch = useWalletStore((s) => s.setRefetch)
  const setDefault = useWalletStore((s) => s.setDefaultAsync)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    console.log('Copied:', text)
  }

  const handleSetDefault = async (chainId: string) => {
    await setDefault(chainId).then(() => setRefetch())
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

  // 3. Loading State: Show Skeleton Card
  if (!chains || !chains.length) {
    return (
      <div className="w-full h-full max-w-full flex items-center justify-center p-2">
        {/* Skeleton Card */}
        <div className="relative w-full min-w-[94%] h-full flex items-center justify-center">
          <svg
            className="w-full h-full animate-pulse"
            viewBox="0 0 312 210"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Base Shape (Skeleton Color) */}
            <path
              d="M185.145 0.5C205.689 2.14145 203.803 36.6772 221.796 38.5643H258.91C294.532 39.0776 305.428 35.3866 311.07 61.6314L311.335 62.9044V185.086C311.335 198.333 301.752 209.071 289.93 209.071H21.9052C10.0837 209.071 0.5 198.333 0.5 185.086V24.4857C0.500001 11.2388 10.0837 0.5 21.9052 0.5H185.145Z"
              fill="#27272a" /* zinc-800 */
            />
            {/* Stroke (Subtle) */}
            <path
              d="M185.145 0.5C205.689 2.14145 203.803 36.6772 221.796 38.5643H258.91C294.532 39.0776 305.428 35.3866 311.07 61.6314L311.335 62.9044V185.086C311.335 198.333 301.752 209.071 289.93 209.071H21.9052C10.0837 209.071 0.5 198.333 0.5 185.086V24.4857C0.500001 11.2388 10.0837 0.5 21.9052 0.5H185.145Z"
              stroke="#3f3f46" /* zinc-700 */
              strokeWidth="1"
            />
          </svg>

          {/* Optional: Inner content skeletons to mimic text placement */}
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-3 w-16 bg-zinc-700/50 rounded animate-pulse" />
              <div className="h-10 w-32 bg-zinc-700/50 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-full bg-zinc-700/50 rounded-full animate-pulse" />
              <div className="h-6 w-full bg-zinc-700/50 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative max-w-full group">
      <button
        onClick={() => scroll('left')}
        className="absolute left-12 -bottom-2 -translate-y-1/2 bg-gray-700/40 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={() => scroll('right')}
        className="absolute right-12 -bottom-2 -translate-y-1/2 bg-gray-700/40 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <ChevronRight size={20} />
      </button>
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
        }}
        className="flex w-full h-full overflow-y-hidden overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar gap-2"
      >
        {chains?.map((chain, i) => (
          <div
            key={i}
            className="relative w-full min-w-[94%] bg-transparent flex items-center justify-center snap-center"
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 312 210"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M185.145 0.5C205.689 2.14145 203.803 36.6772 221.796 38.5643H258.91C294.532 39.0776 305.428 35.3866 311.07 61.6314L311.335 62.9044V185.086C311.335 198.333 301.752 209.071 289.93 209.071H21.9052C10.0837 209.071 0.5 198.333 0.5 185.086V24.4857C0.500001 11.2388 10.0837 0.5 21.9052 0.5H185.145Z"
                fill="#242424"
              />
              <path
                d="M185.145 0.5C205.689 2.14145 203.803 36.6772 221.796 38.5643H258.91C294.532 39.0776 305.428 35.3866 311.07 61.6314L311.335 62.9044V185.086C311.335 198.333 301.752 209.071 289.93 209.071H21.9052C10.0837 209.071 0.5 198.333 0.5 185.086V24.4857C0.500001 11.2388 10.0837 0.5 21.9052 0.5H185.145Z"
                stroke="url(#paint0_linear_2126_202)"
              />
              <mask
                id="mask0_2126_202"
                style={{ maskType: 'alpha' }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="312"
                height="210"
              >
                <path
                  d="M185.64 0.499023C206.184 2.14048 204.298 36.6762 222.291 38.5633H259.405C295.026 39.0766 305.923 35.3856 311.565 61.6304L311.83 62.9034V185.085C311.83 198.332 302.247 209.07 290.425 209.07H22.4001C10.5786 209.07 0.994873 198.332 0.994873 185.085V24.4847C0.994874 11.2378 10.5786 0.499023 22.4001 0.499023H185.64Z"
                  fill="#353535"
                />
                <path
                  d="M22.4001 0.999023H185.621C190.584 1.40139 194.199 3.78083 197.124 7.19922C200.068 10.6398 202.294 15.1105 204.47 19.6553C206.634 24.1733 208.751 28.7738 211.464 32.3525C214.188 35.9478 217.556 38.5694 222.238 39.0605L222.264 39.0635H259.398L262.677 39.1006C270.15 39.1629 276.411 39.0739 281.778 39.1934C287.892 39.3295 292.711 39.7366 296.581 40.9258C300.428 42.1081 303.335 44.0629 305.635 47.3154C307.95 50.587 309.671 55.1999 311.076 61.7354V61.7344L311.33 62.957V185.085C311.33 198.111 301.919 208.57 290.426 208.57H22.4001C10.9068 208.57 1.49498 198.111 1.49487 185.085V24.4844L1.50171 23.876C1.78494 11.3367 10.7935 1.32155 21.863 1.00684L22.4001 0.999023Z"
                  stroke="url(#paint1_linear_2126_202)"
                />
              </mask>
              <g mask="url(#mask0_2126_202)">
                <g filter="url(#filter0_f_2126_202)">
                  <path
                    d="M144.387 78.7248C164.908 78.457 191.402 83.3485 219.114 93.282C246.832 103.218 270.928 116.462 287.479 129.999C295.738 136.754 302.331 143.753 306.502 150.651C310.64 157.496 312.789 164.94 310.767 172.063C308.724 179.263 303.02 184.052 295.983 186.997C288.936 189.946 279.882 191.365 269.648 191.499C249.127 191.767 222.635 186.875 194.923 176.942C167.205 167.006 143.109 153.762 126.557 140.225C118.299 133.47 111.706 126.47 107.535 119.572C103.396 112.728 101.248 105.284 103.269 98.1612C105.313 90.9601 111.016 86.1711 118.054 83.2262C125.101 80.2772 134.154 78.8584 144.387 78.7248Z"
                    fill="#4D4D4D"
                  />
                  <path
                    d="M144.394 79.2251C164.839 78.9583 191.273 83.8331 218.945 93.7524C246.622 103.673 270.665 116.893 287.163 130.386C295.396 137.12 301.943 144.078 306.074 150.91C310.176 157.694 312.254 164.99 310.286 171.926C308.299 178.929 302.745 183.625 295.79 186.536C288.824 189.451 279.84 190.866 269.642 191C249.196 191.266 222.764 186.39 195.092 176.471C167.415 166.55 143.372 153.331 126.874 139.837C118.641 133.104 112.094 126.146 107.963 119.314C103.861 112.53 101.782 105.233 103.75 98.2974C105.737 91.2944 111.291 86.5975 118.246 83.687C125.212 80.772 134.195 79.3583 144.394 79.2251Z"
                    stroke="url(#paint2_linear_2126_202)"
                  />
                </g>
              </g>
              <path
                d="M24.4985 13.499C17.8711 13.499 12.4985 19.1018 12.4985 26.0133C12.4985 32.9248 17.8711 38.5276 24.4985 38.5276C31.126 38.5276 36.4985 32.9248 36.4985 26.0133C36.4985 19.1018 31.126 13.499 24.4985 13.499ZM21.1204 19.9132H27.8767L28.8053 21.5918H20.1918L21.1204 19.9132ZM27.9386 26.0133L26.2219 29.114H22.7769L21.0602 26.0133L22.7802 22.9074H26.2203L27.9403 26.0133H27.9386ZM17.5934 31.3613L14.6318 26.0133L17.595 20.6617L18.3931 22.103L16.2281 26.0133L18.3915 29.92L17.5934 31.3613ZM17.744 26.0133L19.464 22.9074H21.3229L19.6028 26.0133L21.3195 29.114H19.4606L17.744 26.0133ZM27.8784 32.1134H21.1221L20.1901 30.4296H22.049L22.0524 30.4348H26.9481L26.9514 30.4296H28.8103L27.8784 32.1134ZM27.6759 29.114L29.3926 26.0133L27.6726 22.9074H29.5315L31.2515 26.0133L29.5348 29.114H27.6759ZM31.4021 31.3614L30.604 29.9201L32.7674 26.0133L30.6023 22.1031L31.4004 20.6618L34.3636 26.0134L31.4021 31.3614Z"
                fill="#B0B0B0"
              />
              <path
                d="M24.4985 13.999C30.8303 13.999 35.9985 19.3584 35.9985 26.0137C35.9983 32.6688 30.8301 38.0273 24.4985 38.0273C18.1669 38.0273 12.9987 32.6688 12.9985 26.0137C12.9985 19.3584 18.1668 13.999 24.4985 13.999ZM19.7524 30.6719L20.6851 32.3555L20.8276 32.6133H28.1733L28.3159 32.3555L29.2476 30.6719L29.6587 29.9297H26.6782L26.6753 29.9346H22.3247L22.3218 29.9297H19.3423L19.7524 30.6719ZM17.1577 20.4199L14.1948 25.7715L14.0601 26.0137L14.1948 26.2559L17.1558 31.6035L17.5933 32.3936L18.0308 31.6035L18.8286 30.1621L18.9634 29.9199L18.8286 29.6777L16.7993 26.0127L18.8306 22.3447L18.9644 22.1025L18.8306 21.8604L18.0327 20.4199L17.5952 19.6299L17.1577 20.4199ZM30.9634 20.4199L30.1646 21.8604L30.0308 22.1035L30.1646 22.3457L32.1948 26.0127L30.1665 29.6777L30.0327 29.9199L30.1665 30.1621L30.9644 31.6035L31.4019 32.3936L31.8394 31.6035L34.8013 26.2559L34.9351 26.0137L34.8013 25.7715L31.8374 20.4199L31.4009 19.6299L30.9634 20.4199ZM19.0269 22.665L17.3062 25.7715L17.1724 26.0137L17.3062 26.2559L19.0229 29.3564L19.1655 29.6143H22.1675L21.7573 28.8721L20.1743 26.0127L21.7603 23.1494L22.1714 22.4072H19.1694L19.0269 22.665ZM22.3433 22.665L20.6226 25.7715L20.4888 26.0137L20.6226 26.2559L22.3394 29.3564L22.4819 29.6143H26.5171L26.6597 29.3564L28.2339 26.5137H28.5444L27.2388 28.8721L26.8276 29.6143H29.8296L29.9722 29.3564L31.689 26.2559L31.8228 26.0137L31.689 25.7715L29.9692 22.665L29.8257 22.4072H26.8237L27.2349 23.1494L28.8208 26.0137L28.6665 26.293L28.3774 25.7715L26.6577 22.665L26.5151 22.4072H22.4858L22.3433 22.665ZM20.6831 19.6709L19.7544 21.3496L19.3442 22.0918H29.6528L29.2427 21.3496L28.314 19.6709L28.1714 19.4131H20.8257L20.6831 19.6709Z"
                stroke="url(#paint3_linear_2126_202)"
              />
              <defs>
                <filter
                  id="filter0_f_2126_202"
                  x="2.5"
                  y="-21.2856"
                  width="409.037"
                  height="312.795"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    result="shape"
                  />
                  <feGaussianBlur
                    stdDeviation="50"
                    result="effect1_foregroundBlur_2126_202"
                  />
                </filter>
                <linearGradient
                  id="paint0_linear_2126_202"
                  x1="-14.5015"
                  y1="18.999"
                  x2="311.499"
                  y2="190.499"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.0240385" stopColor="#595757" />
                  <stop offset="1" stopColor="#575656" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_2126_202"
                  x1="155.918"
                  y1="0.499993"
                  x2="155.918"
                  y2="209.071"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.0240385" stopColor="#CDCDCD" />
                  <stop offset="1" stopColor="#1F1F1F" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_2126_202"
                  x1="207.018"
                  y1="78.7144"
                  x2="207.018"
                  y2="191.509"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.0240385" stopColor="#CDCDCD" />
                  <stop offset="1" stopColor="#1F1F1F" />
                </linearGradient>
                <linearGradient
                  id="paint3_linear_2126_202"
                  x1="155.916"
                  y1="0.98462"
                  x2="155.916"
                  y2="209.556"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.0240385" stopColor="#CDCDCD" />
                  <stop offset="1" stopColor="#1F1F1F" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute font-sansation w-full top-0 inset-0 flex flex-col justify-between z-10 text-white">
              <div className="bottom-0 absolute top-10 w-full py-4 mb-4 px-5">
                <div className="flex mb-2">
                  <div className="text-[40px] font-bold">{balance}</div>
                </div>

                <div className="flex w-full space-y-2 flex-col justify-between items-start">
                  <span className="flex items-center gap-2 rounded-full text-sm w-full min-w-0">
                    <span className="flex w-full gap-1 items-center">
                      ChainId:
                      <p className="truncate text-xs bg-[#454545] px-2 py-0.5 rounded-xl">
                        {chain.chainId}
                      </p>
                      <Copy
                        size={20}
                        className="cursor-pointer text-gray-500 hover:text-gray-300"
                        onClick={() => handleCopy(chain.chainId)}
                      />
                    </span>
                  </span>
                  <span className="flex items-center gap-2 rounded-full text-sm w-full min-w-0">
                    <span className="flex w-full gap-1 items-center">
                      Account:
                      <p className="truncate text-xs bg-[#454545] px-2 py-0.5 rounded-xl">
                        {chain.owner}
                      </p>
                      <Copy
                        size={20}
                        className="cursor-pointer text-gray-500 hover:text-gray-300"
                        onClick={() => handleCopy(chain.owner)}
                      />
                    </span>
                  </span>
                </div>
              </div>

              <div className="absolute w-full h-10 flex justify-end items-center">
                {defaultChain === chain.chainId ? (
                  <button
                    disabled
                    className="text-black text-xs border mr-4 mb-0.5 px-4 py-0.5 rounded-3xl flex gap-1 items-center bg-white/90"
                  >
                    <RefreshCw width={15} />
                    Default
                  </button>
                ) : (
                  <button
                    onClick={() => handleSetDefault(chain.chainId)}
                    className="text-black text-xs border mr-1.5 mb-0.5 px-2 py-0.5 rounded-3xl flex gap-1 items-center bg-white/90"
                  >
                    <RefreshCw width={15} />
                    Set Default
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
