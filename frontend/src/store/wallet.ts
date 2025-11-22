import { create } from 'zustand'
import { Server } from 'croissant/wallet'

type Request = {
  type: 'QUERY'
  applicationId: string
  query: string
}

type WalletStore = {
  server: Server | null
  ready: boolean
  notification: any

  initAsync: () => Promise<void>
  requestAsync: (req: Request) => Promise<void>

  createWalletAsync: () => Promise<void>
  assignChainAsync: (data: {
    chainId: string
    timestamp: string
  }) => Promise<void>
  setDefaultAsync: (chainId: string) => Promise<void>
}

export const useWalletStore = create<WalletStore>((set) => ({
  server: null,
  ready: false,
  notification: null,

  initAsync: async () => {
    const server = await Server.init((data) => {
      set((state) => (state.notification = data))
    })
    set({ server, ready: true })
  },

  createWalletAsync: async () => {
    const { server, ready } = useWalletStore.getState()
    if (!server || !ready) return
    server.create()
  },

  requestAsync: async (req: Request): Promise<any> => {
    const server = useWalletStore.getState().server
    if (!server) throw new Error('failed server does not exist')
    return server.request(req)
  },

  assignChainAsync: async (data: { chainId: string; timestamp: string }) => {
    const { server, ready } = useWalletStore.getState()
    if (!server || !ready) return
    server.assign(data)
  },

  setDefaultAsync: async (chainId: string) => {
    const { server, ready } = useWalletStore.getState()
    if (!server || !ready) return
    server.setDefault(chainId)
  },
}))
