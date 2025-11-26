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

  getStarted: boolean
  userProfile: {
    state: Profile | null
    isLoading: boolean
  }

  handleGetStarted: () => void
  setUserProfile: (data: any) => void
  updateName: (name: string) => void
}

export const useUserStore = create<UserSettings>((set) => ({
  showProfile: false,
  walletExists: false,

  updateShowProfile: () =>
    set((state) => ({ showProfile: !state.showProfile })),

  updateWalletExists: () =>
    set((state) => ({ walletExists: !state.walletExists })),

  userProfile: {
    state: null,
    isLoading: true,
  },

  getStarted: false,

  handleGetStarted: () => set((state) => ({ getStarted: !state.getStarted })),

  setUserProfile: (data) =>
    set(() => ({
      userProfile: {
        state: data,
        isLoading: false,
      },
    })),

  updateName: (name: string) => {
    set((state) => {
      state.userProfile.state!.name = name
      return state
    })
  },
}))
