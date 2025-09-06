import React from 'react'
import { ThemeName } from '../components/ChessBoard/theme'

type MicroChessSettings = {
  enableDrag: boolean
  theme: ThemeName
}

type MicroChessContextType = {
  chessSettings: MicroChessSettings
  setChessSettings: React.Dispatch<React.SetStateAction<MicroChessSettings>>
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

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const dragNdrop = window.sessionStorage.getItem('enableDrag') ?? ''
      const isDragNdrop = parseInt(dragNdrop, 10)
      setChessSettings({
        ...chessSettings,
        enableDrag: Boolean(isDragNdrop),
      })
    }
  }, [])

  return (
    <MicroChessContext.Provider value={{ chessSettings, setChessSettings }}>
      {children}
    </MicroChessContext.Provider>
  )
}

// exportiong a hook to use the context
export const useMicroChess = (): MicroChessContextType => {
  const microChessContext = React.useContext(MicroChessContext)
  console.log('getting', microChessContext)
  if (!microChessContext) {
    throw new Error('useMicroChess must be used within a MicroChessProvider')
  }
  return microChessContext
}
