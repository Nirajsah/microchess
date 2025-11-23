import { create } from 'zustand'
import { Server } from 'croissant/wallet'
import { checkWalletExists } from '@/lib/checkWalletExist'

type Request = {
  type: 'QUERY'
  applicationId: string
  query: string
}

type WalletStore = {
  server: Server | null
  ready: boolean
  notification: any
  walletExists: boolean

  initAsync: () => Promise<void>
  requestAsync: (req: Request) => Promise<void>
  checkWalletExistAsync: () => Promise<void>

  createWalletAsync: () => Promise<void>
  assignChainAsync: (data: {
    chainId: string
    timestamp: string
  }) => Promise<void>
  setDefaultAsync: (chainId: string) => Promise<void>
  getJsWalletAsync: () => Promise<string>
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  server: null,
  ready: false,
  notification: null,
  walletExists: false,

  getJsWalletAsync: async () => {
    const { walletExists, server } = get()

    if (!walletExists || !server) return
    try {
      const wallet = await server.JsWallet()
      return wallet
    } catch (e: any) {
      return e
    }
  },

  checkWalletExistAsync: async () => {
    const res = await checkWalletExists()
    set({ walletExists: res })
  },

  initAsync: async () => {
    const { walletExists, ready } = get()
    if (!walletExists || ready) return

    try {
      const server = await Server.init() // returns existing instance, else creates new
      await server.initClient((data) => {
        set((state) => (state.notification = data))
      })
      set({ server, ready: true })
    } catch {
      return
    }
  },

  createWalletAsync: async () => {
    const { walletExists } = get()
    const server = await Server.init() // returns existing instance, else creates new (here it will create a new instance)
    if (!server || walletExists) return // this means the wasm instance is ready, but we don't have a wallet yet.
    try {
      await server.create((data) => {
        set((state) => (state.notification = data))
      }) // this creates a new wallet and starts the client

      set({ server, ready: true, walletExists: true })
    } catch (error) {
      console.error(error)
    }
  },

  requestAsync: async (req: Request): Promise<any> => {
    const server = get().server
    if (!server) throw new Error('failed server does not exist')
    return server.request(req)
  },

  assignChainAsync: async (data: { chainId: string; timestamp: string }) => {
    const { server, ready } = get()
    if (!server || !ready) return
    server.assign(data)
  },

  setDefaultAsync: async (chainId: string) => {
    const { server, ready } = get()
    if (!server || !ready) return
    server.setDefault(chainId)
  },
}))
