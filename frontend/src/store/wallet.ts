import { create } from 'zustand'
import { Result, Server } from '@/croissant/wallet'
import { checkWalletExists } from '@/lib/checkWalletExist'
import { ChainEntry, ChainId, Convert } from '@/lib/chainsType'
import { Application, Chain, NotificationHandle } from '@/croissant/wasm'

type Request = {
  type: 'QUERY'
  applicationId: string
  query: string
}

type WalletStore = {
  /** Chain Manager */
  chainClients: Map<ChainId, Chain>
  // activeChainId: ChainId | null
  activeClient: Chain | null
  activeApplication: Application | null

  setInUseAsync: (chain: ChainId) => Promise<void>
  getBalanceAsync: (chain?: ChainId) => Promise<string>
  abortNotificationHandler: () => void

  notificationHandler: NotificationHandle | null

  /** Foundational Setup */
  server: Server | null
  ready: boolean
  notification: any
  walletExists: boolean
  refetch: boolean

  initAsync: () => Promise<void>
  createWalletAsync: () => Promise<void>
  checkWalletExistAsync: () => Promise<void>
  getJsWalletAsync: () => Promise<void>

  /** Basic UI/UX Setup */
  chainBalance: string
  pubKey: string | null
  defaultChain: string | null
  chains: ChainEntry[] | null
  setRefetch: () => void

  /** User methods */
  requestAsync: (req: Request) => Promise<string>
  assignChainAsync: (chainId: string) => Promise<Result<string>>
  setDefaultAsync: (chainId: string) => Promise<Result<string>>
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  server: null,
  ready: false,
  notification: null,
  walletExists: false,
  chainBalance: '0',
  refetch: false,

  activeApplication: null,

  notificationHandler: null,

  chainClients: new Map(),

  activeClient: null,

  pubKey: null,
  defaultChain: null,
  chains: null,

  setRefetch: () => {
    const { refetch } = get()
    set({
      refetch: !refetch,
    })
  },

  getJsWalletAsync: async () => {
    const { walletExists, server } = get()

    if (!walletExists || !server) return

    try {
      const res = await server.JsWallet()
      const wallet = Convert.chainsAsList(res)
      const defaultChain = wallet.default
      const chains = Object.values(wallet.chains)
      const id = chains[0].chainInfo.owner
      set({ chains, pubKey: id, defaultChain })
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
      const activeClient = await server.initClient()
      activeClient.onNotification((data: any) => {
        set((state) => (state.notification = data))
      })

      set({ server, ready: true, activeClient })
    } catch {
      return
    }
  },

  createWalletAsync: async () => {
    const { walletExists } = get()
    const server = await Server.init() // returns existing instance, else creates new (here it will create a new instance)
    if (!server || walletExists) return // this means the wasm instance is ready, but we don't have a wallet yet.
    try {
      const res = await server.create() // this creates a new wallet and starts the client
      if (res.success) {
        const chain = res.result
        chain.onNotification((data: any) => {
          set((state) => (state.notification = data))
        })
        set({ server, ready: true, walletExists: true, activeClient: chain })
      } else {
        console.error(res.error)
      }
    } catch (error) {
      console.error(error)
    }
  },

  requestAsync: async (req: Request): Promise<string> => {
    const { activeClient, activeApplication } = get()
    if (!activeClient) throw new Error('failed server does not exist')
    if (!activeApplication) {
      const app = await activeClient.application(req.applicationId)
      const res = await app.query(req.query)
      set({ activeApplication: app })
      return res
    } else {
      return await activeApplication.query(req.query)
    }
  },

  getBalanceAsync: async (chain?: string): Promise<string> => {
    const { chainClients, activeClient } = get()
    if (chain) {
      const chainClient = chainClients.get(chain as ChainId)
      if (chainClient) {
        return await chainClient.balance()
      }
    }

    if (!activeClient) throw new Error('ActiveClient does not exist')
    return await activeClient.balance()
  },

  assignChainAsync: async (chainId: string): Promise<Result<string>> => {
    const { server, ready, refetch, abortNotificationHandler, chainClients } =
      get()

    if (!server || !ready)
      return { success: false, error: 'Server is not ready..' }
    const chain = await server.assign(chainId)
    abortNotificationHandler()
    const aborter = chain.onNotification((data: any) => {
      set((state) => (state.notification = data))
    })
    set({
      activeClient: chain,
      refetch: !refetch,
      notificationHandler: aborter,
      activeApplication: null,
      chainClients: chainClients.set(chainId as ChainId, chain),
    })

    return { success: true, result: 'Chain Assigned' }
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

  setInUseAsync: async (chain: string) => {
    const { server, chainClients, refetch, abortNotificationHandler } = get()

    const chainClient = chainClients.get(chain as ChainId)
    if (!chainClient) {
      if (!server) throw new Error('Something is wrong..., Server is missing')
      abortNotificationHandler()
      const chainClient = await server.initChainClient(chain as ChainId)
      const aborter = chainClient.onNotification((data: any) => {
        set((state) => (state.notification = data))
      })
      set({
        activeClient: chainClient,
        chainClients: chainClients.set(chain as ChainId, chainClient),
        refetch: !refetch,
        notificationHandler: aborter,
        activeApplication: null,
      })
    } else {
      abortNotificationHandler()
      const aborter = chainClient.onNotification((data: any) => {
        set((state) => (state.notification = data))
      })
      set({
        activeClient: chainClient,
        refetch: !refetch,
        notificationHandler: aborter,
        activeApplication: null,
      })
    }
  },

  abortNotificationHandler: () => {
    const { notificationHandler } = get()
    if (notificationHandler) {
      notificationHandler.unsubscribe()
    }
    set({ notificationHandler: null })
  },
}))
