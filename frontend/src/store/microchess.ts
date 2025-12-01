import { storage } from '@/api'
import { ThemeName } from '@/components/theme'
import { create } from 'zustand'

type Profile = {
  id: string
  name: string
  elo: number
  matches: number
  won: number
  lost: number
  ath: number
}

type UserSettings = {
  walletExists: boolean
  theme: ThemeName

  updateTheme: (theme: ThemeName) => void
  updateWalletExists: () => void

  getStarted: boolean
  userProfile: {
    state: Profile | null
    isLoading: boolean
  }

  handleGetStarted: () => void
  setUserProfile: (data: any) => void
  updateName: (name: string) => void
}

export const useUserStore = create<UserSettings>((set, get) => ({
  walletExists: false,
  theme: 'classicWood' as ThemeName,

  updateTheme: (theme) => {
    set({
      theme,
    })
    storage.setTheme(theme)
  },
  updateWalletExists: () =>
    set((state) => ({ walletExists: !state.walletExists })),

  userProfile: {
    state: null,
    name: 'Player',
    isLoading: true,
  },

  getStarted: false,

  handleGetStarted: () => set((state) => ({ getStarted: !state.getStarted })),

  setUserProfile: (data) => {
    set(() => ({
      userProfile: {
        state: data,
        isLoading: false,
      },
    }))
  },

  updateName: (name: string) => {
    set((state) => {
      state.userProfile.state!.name = name
      return state
    })
    console.log('updated state', get().userProfile)
  },
}))
