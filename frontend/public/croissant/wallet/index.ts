import * as wasm from '../linera_web'
import { WasmManager } from './wasmManager'
import { ClientManager } from './clientManager'
import { WalletManager } from './walletManager'

export type Result<T> =
  | { success: true; result: T }
  | { success: false; error: string }

type OpType = 'CREATE_WALLET' | 'CLAIM_CHAIN'
type FaucetHandler = (faucet: wasm.Faucet) => Promise<Result<string>>

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

  public onNotification: ((data: any) => void) | null = null

  constructor() {}

  faucetHandlers: Record<OpType, FaucetHandler> = {
    CREATE_WALLET: async (faucet) => {
      const wallet = await faucet.createWallet()

      this.wallet.setWasmInstance(this.wasmInstance!) // Now wallet manager can safely load or create wallets
      this.wallet.create(wallet)

      let chainId = await faucet.claimChain(
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

  private async _faucetAction(op: OpType): Promise<Result<string>> {
    // const FAUCET_URL = 'http://localhost:8079'
    const FAUCET_URL = 'https://faucet.testnet-conway.linera.net/'
    const faucet = new wasm.Faucet(FAUCET_URL)
    const handler = this.faucetHandlers[op]
    if (!handler) return { success: false, error: 'Invalid operation' }
    try {
      const result = await handler.call(this, faucet)
      await this._initClient() // Initialize client after faucet action
      return result
    } catch (err) {
      return { success: false, error: `${err}` }
    }
  }

  private async _initClient() {
    if (!this.wallet.getWallet() || !this.wallet.getSigner()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 300)) // just for a small delay, might not have any impact.
    try {
      // Initialize a fresh one
      await this.client.init(
        this.wasmInstance!,
        this.wallet.getWallet(),
        this.wallet.getSigner()
      )

      await this.wallet.reInitWallet() // reinitialize wallet after client init
      this.client.onNotificationCallback = this.onNotification
    } catch (error) {
      await this.wallet.reInitWallet() // reinitialize wallet after client init
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
  private async _handleAssignment(body: any) {
    try {
      const result = await this.wallet.assign(body) // assign chain in wallet manager, this will also reinitialize wallet
      // reinitialize client after assignment
      await this.client.cleanup()
      await this._initClient()
      return result
    } catch (err) {
      console.error(err)
    }
  }

  async JsWallet(): Promise<string> {
    try {
      return await this.wallet.getJsWallet()
    } catch {
      return 'Failed to get wallet'
    }
  }

  async create(fn: (data: any) => void): Promise<void> {
    this.onNotification = fn
    await this._faucetAction('CREATE_WALLET')
  }

  async initClient(fn: (data: any) => void): Promise<void> {
    this.onNotification = fn
    await this._initWallet()
    await this._initClient()
  }

  async request(req: Request): Promise<Result<string>> {
    const res = await this._handleQueryApplicationRequest(req)
    return { success: true, result: res as string }
  }

  async assign(data: {
    chainId: string
    timestamp: number
  }): Promise<Result<string>> {
    const res = await this._handleAssignment(data)
    return { success: true, result: res as string }
  }

  async setDefault(chainId: string): Promise<Result<string>> {
    const res = await this._handleSetDefaultChain(chainId)
    return { success: true, result: res as string }
  }

  async getBalance(): Promise<string> {
    const res = await this.client.getBalance()
    return res as string
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
