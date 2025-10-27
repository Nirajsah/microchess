import { storage } from '@/components/ChessBoard/utils'
import { useMicroChess } from '@/context/MicroChessProvider'
import { connect_wallet } from '@/wallet/walletConnection'
import { useState } from 'react'

export default function Navbar() {
  const { userKey, setUserKey } = useMicroChess()
  const [showDis, setShowDis] = useState(false)

  const handleDisconnect = () => {
    storage.setPublicKey('')
    setUserKey('')
    setShowDis(false)
  }

  const handleConnect = () => {
    connect_wallet().then((res) => {
      storage.setPublicKey(res.result)
      setUserKey(res.result)
    })
  }

  const handleClick = () => {
    setShowDis(true)
  }

  return (
    <div className="fixed z-20 bg-transparent backdrop-blur-lg w-full gap-2 px-3 py-2 lg:h-[80px] lg:px-14 lg:py-6 flex items-center justify-between max-w-[1440px]">
      <div className="text-2xl p-2 flex justify-center items-center w-fit h-full">
        MicroChess
      </div>
      {showDis && userKey && (
        <div className="absolute hover:scale-105 right-0 top-[50px] text-md rounded-3xl px-4 py-2 flex justify-center items-center">
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      )}
      {userKey ? (
        <div className="text-md rounded-3xl px-4 py-2 flex justify-center items-center">
          <button onClick={handleClick}>{userKey}</button>
        </div>
      ) : (
        <div className="text-lg rounded-3xl px-4 py-2 flex justify-center items-center hover:bg-[#0a0a0a] hover:scale-105 transition-all duration-300">
          <button onClick={handleConnect}>Connect</button>
        </div>
      )}
    </div>
  )
}
