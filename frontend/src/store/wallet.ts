import { create } from 'zustand'
import { Result, Server } from 'croissant/wallet'
import { checkWalletExists } from '@/lib/checkWalletExist'
import { Convert } from '@/lib/chainsType'

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
  JsWallet: string | null
  chainBalance: string
  pubKey: string | null

  initAsync: () => Promise<void>
  requestAsync: (req: Request) => Promise<void>
  checkWalletExistAsync: () => Promise<void>

  createWalletAsync: () => Promise<void>
  assignChainAsync: (data: {
    chainId: string
    timestamp: number
  }) => Promise<Result<string>>
  setDefaultAsync: (chainId: string) => Promise<Result<string>>
  getJsWalletAsync: () => Promise<void>
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  server: null,
  ready: false,
  notification: null,
  walletExists: false,
  JsWallet: null,
  chainBalance: '',
  pubKey: null,

  getJsWalletAsync: async () => {
    const { walletExists, server } = get()

    if (!walletExists || !server) return
    try {
      const wallet = await server.JsWallet()
      const id = Object.values(Convert.toWallet(wallet).chains)[0].owner
      set({ JsWallet: wallet, pubKey: id })
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
      const bal = (await server.getBalance()) || '0'
      set({ server, ready: true, chainBalance: bal })
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
    return await server.request(req)
  },

  assignChainAsync: async (data: {
    chainId: string
    timestamp: number
  }): Promise<Result<string>> => {
    const { server, ready } = get()
    if (!server || !ready)
      return { success: false, error: 'Server is not ready..' }
    return await server.assign(data)
  },

  setDefaultAsync: async (chainId: string): Promise<Result<string>> => {
    const { server, ready } = get()
    if (!server || !ready)
      return { success: false, error: 'Server is not ready..' }
    try {
      let res = await server.setDefault(chainId)
      return res
    } catch (e) {
      return { success: false, error: 'Failed to set Default chain..' }
    }
  },
}))
