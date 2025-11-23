import { create } from 'zustand'

type Settings = {
  showProfile: boolean
  walletExists: boolean
  updateShowProfile: () => void
  updateWalletExists: () => void
}

export const useChessStore = create<Settings>((set) => ({
  showProfile: false,
  walletExists: false,

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
