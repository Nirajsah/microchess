import { useState } from 'react'
import { useMicroChess } from '../context/MicroChessProvider'
import ThemePreviewGrid from './ChessBoard/ThemeGrid'
import { ThemeName } from './ChessBoard/theme'

type Menu = 'Themes' | 'Misc'

const Settings = () => {
  const { chessSettings, setChessSettings } = useMicroChess()
  const [settingMenu, setSettingMenu] = useState<Menu>('Themes')
  const themeSelected = chessSettings.theme
  function changeTheme(themeKey: ThemeName) {
    setChessSettings({
      ...chessSettings,
      theme: themeKey,
    })
  }
  function handleMenuChange(name: string) {
    setSettingMenu(name as Menu)
  }
  const Button = ({ name }: { name: string }) => {
    return (
      <button
        className="px-3 py-2 w-full text-start rounded-xl bg-gray-700/20"
        onClick={() => handleMenuChange(name)}
      >
        {name}
      </button>
    )
  }
  return (
    <div className="font-fira rounded-xl bg-[#0a0a0a] border border-[#ffffff24] w-[650px] h-[600px] p-3 flex justify-between">
      <div className="w-[30%]">
        <div className="flex flex-col w-full h-full gap-2">
          <Button name={'Themes'} />
        </div>
      </div>
      {settingMenu === 'Themes' && (
        <div className="max-w-full h-full border-l border-[#ffffff24] px-3">
          <ThemePreviewGrid
            selected={themeSelected}
            onSelect={(themeKey) => {
              changeTheme(themeKey)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Settings
