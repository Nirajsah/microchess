import { useUserStore } from '@/store/microchess'
import ThemePreviewGrid from './ThemeGrid'
import { ThemeName } from './theme'

const Themes = () => {
  const updateTheme = useUserStore((s) => s.updateTheme)
  const theme = useUserStore((s) => s.theme)
  function changeTheme(themeKey: ThemeName) {
    updateTheme(themeKey)
  }
  return (
    <div className="font-fira rounded-xl h-[600px] flex justify-between">
      <div className="max-w-full h-full">
        <ThemePreviewGrid
          selected={theme}
          onSelect={(themeKey) => {
            changeTheme(themeKey as ThemeName)
          }}
        />
      </div>
    </div>
  )
}

export default Themes
