import { useState } from 'react'
import { useChess } from '../context/ChessProvider'
import ThemePreviewGrid from './ChessBoard/ThemeGrid'

type Menu = 'Themes' | 'Misc'

const Settings = () => {
  const { chessSettings, setChessSettings } = useChess()
  const [settingMenu, setSettingMenu] = useState<Menu>('Themes')
  const themeSelected = chessSettings.theme
  function changeTheme(themeKey: string) {
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
        className="px-3 py-2 w-full text-start rounded-xl text-purple-400/80 hover:bg-purple-700/20"
        onClick={() => handleMenuChange(name)}
      >
        {name}
      </button>
    )
  }
  return (
    <div className="font-fira rounded-xl bg-[#0a0a0a] border border-[#ffffff24] w-[650px] h-[600px] p-5 flex justify-between">
      <div className="w-[30%]">
        <div className="flex flex-col w-full h-full gap-2">
          <Button name={'Themes'} />
          <Button name={'Misc'} />
        </div>
      </div>
      {settingMenu === 'Themes' && (
        <div className="max-w-full h-full">
          <ThemePreviewGrid
            selected={themeSelected}
            onSelect={(themeKey) => {
              changeTheme(themeKey)
            }}
          />
        </div>
      )}

      {settingMenu === 'Misc' && (
        <div className="max-w-full h-full">showing misc setting</div>
      )}
    </div>
  )
}

export default Settings
