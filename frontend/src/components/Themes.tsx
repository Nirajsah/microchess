import { useMicroChess } from '../context/MicroChessProvider'
import ThemePreviewGrid from './ChessBoard/ThemeGrid'
import { ThemeName } from './ChessBoard/theme'

const Themes = () => {
  const { chessSettings, setChessSettings } = useMicroChess()
  const themeSelected = chessSettings.theme
  function changeTheme(themeKey: ThemeName) {
    setChessSettings({
      ...chessSettings,
      theme: themeKey,
    })
  }

  return (
    <div className="font-fira rounded-xl h-[600px] flex justify-between">
      <div className="max-w-full h-full">
        <ThemePreviewGrid
          selected={themeSelected}
          onSelect={(themeKey) => {
            changeTheme(themeKey)
          }}
        />
      </div>
    </div>
  )
}

export default Themes
