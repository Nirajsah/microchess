import React from 'react'
import { ThemeName } from '../components/ChessBoard/theme'
import { storage } from '@/components/ChessBoard/utils'

type MicroChessSettings = {
  enableDrag: boolean
  theme: ThemeName
}

type MicroChessContextType = {
  chessSettings: MicroChessSettings
  setChessSettings: React.Dispatch<React.SetStateAction<MicroChessSettings>>
  userKey: string
  setUserKey: React.Dispatch<React.SetStateAction<string>>
}

export const MicroChessContext =
  React.createContext<MicroChessContextType | null>(null)

const defaultSettings: MicroChessSettings = {
  theme: 'forest',
  enableDrag: true,
}

export default function MicroChessProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [chessSettings, setChessSettings] =
    React.useState<MicroChessSettings>(defaultSettings)
  const [userKey, setUserKey] = React.useState<string>('')

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const dragNdrop = window.sessionStorage.getItem('enableDrag') ?? ''
      const isDragNdrop = parseInt(dragNdrop, 10)
      setChessSettings({
        ...chessSettings,
        enableDrag: Boolean(isDragNdrop),
      })
    }
    setUserKey(() => storage.getPublicKey() || '')
  }, [])

  return (
    <MicroChessContext.Provider
      value={{ chessSettings, setChessSettings, userKey, setUserKey }}
    >
      {children}
    </MicroChessContext.Provider>
  )
}

// exportiong a hook to use the context
export const useMicroChess = (): MicroChessContextType => {
  const microChessContext = React.useContext(MicroChessContext)
  if (!microChessContext) {
    throw new Error('useMicroChess must be used within a MicroChessProvider')
  }
  return microChessContext
}
