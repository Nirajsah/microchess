import React from 'react'
import { ThemeName } from '../components/ChessBoard/theme'

export const ChessContext = React.createContext<any | null>(null)

interface ChessSettings {
  dragNdrop: boolean
  theme: ThemeName
}

export default function ChessProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [chessSettings, setChessSettings] = React.useState<ChessSettings>({
    dragNdrop: true,
    theme: 'default',
  })

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const dragNdrop = window.sessionStorage.getItem('dragNdrop') ?? ''
      const isDragNdrop = parseInt(dragNdrop, 10)
      setChessSettings({
        ...chessSettings,
        dragNdrop: Boolean(isDragNdrop),
      })
    }
  }, [])

  return (
    <ChessContext.Provider value={{ chessSettings, setChessSettings }}>
      {children}
    </ChessContext.Provider>
  )
}

// exportiong a hook to use the context
export const useChess = () => {
  const chessContext = React.useContext(ChessContext)
  if (!chessContext) {
    return {}
  }
  return chessContext
}
