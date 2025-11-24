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
  showProfile: boolean
  walletExists: boolean
  updateShowProfile: () => void
  updateWalletExists: () => void

  userProfile: Profile | null
  setUserProfile: (data: any) => void
}

export const useUserStore = create<UserSettings>((set) => ({
  showProfile: false,
  walletExists: false,
  userProfile: null,

  setUserProfile: (data: any) => {
    set(() => ({
      userProfile: data,
    }))
  },

  updateShowProfile: () => {
    set((state) => ({
      showProfile: !state.showProfile,
    }))
  },

  updateWalletExists: () => {
    set((state) => ({
      walletExists: !state.walletExists,
    }))
  },
}))
