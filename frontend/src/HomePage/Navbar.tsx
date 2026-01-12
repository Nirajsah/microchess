import { Notifications } from '@/components/Notifications'
import { useUserStore } from '@/store/microchess'
import { useWalletStore } from '@/store/wallet'
import { BellIcon } from 'lucide-react'
import React from 'react'

export default function Navbar() {
  const handleGetStarted = useUserStore((s) => s.handleGetStarted)
  const checkWalletExistsAsync = useWalletStore((s) => s.checkWalletExistAsync)
  const walletExists = useWalletStore((s) => s.walletExists)
  const pubKey = useWalletStore((s) => s.pubKey)
  const initAsync = useWalletStore((s) => s.initAsync)

  const [notificationCount, setNotificationCount] = React.useState(0)
  const [showNotificationMenu, setShowNotificationMenu] = React.useState(false)

  const notificationRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!showNotificationMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotificationMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotificationMenu])

  React.useEffect(() => {
    checkWalletExistsAsync()
  })

  React.useEffect(() => {
    if (walletExists) {
      initAsync()
    }
  }, [walletExists, initAsync])

  return (
    <div className="fixed z-20 bg-transparent backdrop-blur-lg w-full gap-2 px-3 py-2 lg:h-[60px] lg:px-14 lg:py-6 flex items-center justify-between max-w-[1440px]">
      <div className="text-2xl p-2 flex justify-center items-center w-fit h-full">
        MicroChess
      </div>

      <div className="flex">
        {/* Notification Bell */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => setShowNotificationMenu((prev) => !prev)}
            className="relative p-2"
          >
            <BellIcon />

            {notificationCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1
                text-[10px] font-semibold text-white bg-red-600 rounded-full
                flex items-center justify-center"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <Notifications onReadAll={() => setNotificationCount(0)} />
          )}
        </div>

        <button
          onClick={handleGetStarted}
          className="px-6 py-2 rounded-3xl truncate lg:w-full lg:max-w-fit cursor-pointer text-end hover:scale-105 duration-300 transition-all"
        >
          {pubKey ? pubKey : 'Get Started'}
        </button>
      </div>
    </div>
  )
}
