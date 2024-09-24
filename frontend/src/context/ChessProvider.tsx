import React from 'react'

export const ChessContext = React.createContext<any | null>(null)

export default function ChessProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [chessSettings, setChessSettings] = React.useState({
    dragNdrop: false,
  })

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const dragNdrop = window.sessionStorage.getItem('dragNdrop') ?? ''
      const isDragNdrop = parseInt(dragNdrop, 10)
      setChessSettings({
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
