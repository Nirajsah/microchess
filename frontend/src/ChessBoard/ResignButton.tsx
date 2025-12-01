import { resign } from '@/api'
import { FlagIcon } from 'lucide-react'
import { useState } from 'react'

export function ResignButton() {
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
    } else {
      setConfirming(false)
      resign().then(() => console.log('resigned'))
    }
  }

  return (
    <div className="relative z-50 flex flex-col items-center max-w-[100px] p-3 rounded-xl bg-[#242424]">
      {confirming ? (
        <button
          onClick={handleClick}
          className="w-full rounded-lg flex items-center justify-center font-bold p-1 text-center"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      ) : (
        <button
          className={`transition-colors w-full rounded-lg flex items-center justify-center outline-none`}
          onClick={handleClick}
          tabIndex={0}
        >
          <FlagIcon width={30} height={30} color="#fff" />
        </button>
      )}
    </div>
  )
}
