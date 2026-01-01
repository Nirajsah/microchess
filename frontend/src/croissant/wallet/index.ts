import { WasmManager } from './wasmManager'
import { ClientManager } from './clientManager'
import { WalletManager } from './walletManager'
import { Chain, Faucet } from '@client'
import { ChainId } from '@/lib/chainsType'

const wasm = await import('@client')

export type Result<T> =
  | { success: true; result: T }
  | { success: false; error: string }

type OpType = 'CREATE_WALLET' | 'CLAIM_CHAIN'
type FaucetHandler = (faucet: Faucet) => Promise<Result<string>>

export type Request = {
  type: 'QUERY'
  applicationId: string
  query: string
}

export class Server {
  wasmInstance: typeof wasm | null = null
  static instance: Server | null = null

  private client: ClientManager = ClientManager.instance
  private wallet: WalletManager = WalletManager.instance

  constructor() {}

  faucetHandlers: Record<OpType, FaucetHandler> = {
    CREATE_WALLET: async (faucet) => {
      const wallet = await faucet.createWallet()

      this.wallet.setWasmInstance(this.wasmInstance!) // Now wallet manager can safely load or create wallets
      this.wallet.create(wallet)

      const chainId = await faucet.claimChain(
        wallet,
        this.wallet.getSigner().address()
      )

      return { success: true, result: chainId }
    },
    CLAIM_CHAIN: async (faucet) => {
      return {
        success: true,
        result: await faucet.claimChain(
          this.wallet.getWallet(),
          this.wallet.getSigner().address()
        ),
      }
    },
  }

  private async _faucetAction(op: OpType): Promise<Result<Chain>> {
    const FAUCET_URL = 'http://localhost:8079'
    // const FAUCET_URL = 'https://faucet.testnet-conway.linera.net/'
    const faucet = new wasm.Faucet(FAUCET_URL)
    const handler = this.faucetHandlers[op]
    if (!handler) return { success: false, error: 'Invalid operation' }
    try {
      await handler.call(this, faucet)
      return { success: true, result: await this._initClient() }
    } catch (err) {
      return { success: false, error: `${err}` }
    }
  }

  private async _initClient(): Promise<Chain> {
    if (!this.wallet.getWallet() || !this.wallet.getSigner()) {
      throw new Error('Missing wallet, or signer')
    }
    try {
      // Initialize a fresh one, default chain is returned
      const chain = await this.client.init(
        this.wasmInstance!,
        this.wallet.getWallet(),
        this.wallet.getSigner()
      )

      return chain
    } catch (error) {
      // await this.wallet.reInitWallet() // reinitialize wallet after client init
      console.warn('Failed to initialize client:', error)
      throw error
    }
  }

  private async _initWallet() {
    // Inject the wasm instance into wallet manager
    this.wallet.setWasmInstance(this.wasmInstance!)
    // Now wallet manager can safely load or create wallets
    try {
      await this.wallet.load()
    } catch (err) {
      return // we don't need to return error here
    }
  }

  private async setup() {
    await WasmManager.init()
    this.wasmInstance = WasmManager.instance
  }

  private async _handleQueryApplicationRequest(query: any) {
    try {
      const result = await this.client.query(query)
      return result
    } catch (err) {
      return err
    }
  }

  private async _handleSetDefaultChain(chainId: string) {
    try {
      const result = await this.wallet.setDefaultChain(chainId)
      // reinitialize client after setting default chain
      await this.client.cleanup()
      await this._initClient()
      return result
    } catch (err) {
      console.error(err)
    }
  }

  // TODO: use wallet manager to assign chain
  private async _handleAssignment(chainId: string): Promise<Chain> {
    return await this.client.assign(chainId, this.wallet.getSigner().address())
  }

  async JsWallet(): Promise<string> {
    try {
      const w = await this.wallet.getJsWallet()
      return w
    } catch {
      return 'Failed to get wallet'
    }
  }

  async create(): Promise<Result<Chain>> {
    return await this._faucetAction('CREATE_WALLET')
  }

  async initClient(): Promise<Chain> {
    await this._initWallet()
    return await this._initClient()
  }

  async initChainClient(chainId: ChainId): Promise<Chain> {
    return await this.client.initChainClient(chainId)
  }

  async request(req: Request): Promise<Result<string>> {
    const res = await this._handleQueryApplicationRequest(req)
    return { success: true, result: res as string }
  }

  async assign(chainId: string): Promise<Chain> {
    return await this._handleAssignment(chainId)
  }

  async setDefault(chainId: string): Promise<Result<string>> {
    const res = await this._handleSetDefaultChain(chainId)
    return { success: true, result: res as string }
  }

  static async init(): Promise<Server> {
    if (!Server.instance) {
      const server = new Server()
      await server.setup()
      Server.instance = server
    }
    return Server.instance
  }
}
