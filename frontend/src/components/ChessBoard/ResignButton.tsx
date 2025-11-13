import { FlagIcon } from 'lucide-react'
import { useState } from 'react'

export function ResignButton({ onResign }: { onResign: () => void }) {
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
    } else {
      setConfirming(false)
      onResign()
    }
  }

  return (
    <div className="relative flex flex-col items-center max-w-lg mx-auto">
      {confirming ? (
        <button
          onClick={handleClick}
          className="w-full bg-red-400/10 text-red-500 rounded-lg flex items-center justify-center font-bold p-2 text-center"
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
          <FlagIcon width={40} height={40} color="#ef4444" />
        </button>
      )}
    </div>
  )
}
