import React from 'react'
import { ThemeName } from '../components/ChessBoard/theme'
import { storage } from '@/api'

type MicroChessSettings = {
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
    const theme = storage.getTheme()
    const publicKey = storage.getPublicKey()

    setChessSettings((prev: MicroChessSettings) => ({
      ...prev,
      theme: (theme as ThemeName) ?? ('forest' as ThemeName),
    }))

    if (publicKey) {
      setUserKey(publicKey)
    }
  }, [])

  // 🔹 Sync theme changes back to storage
  React.useEffect(() => {
    if (chessSettings?.theme) {
      storage.setTheme(chessSettings.theme)
    }
  }, [chessSettings.theme])

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
