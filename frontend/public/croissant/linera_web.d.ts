/* tslint:disable */
/* eslint-disable */
export function main(): void;
/**
 * Entry point for web workers
 */
export function wasm_thread_entry_point(ptr: number): Promise<void>;
export enum SignerError {
  MissingKey = 0,
  SigningError = 1,
  PublicKeyParse = 2,
  JsConversion = 3,
  UnexpectedSignatureFormat = 4,
  InvalidAccountOwnerType = 5,
  Unknown = 9,
}
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */
type ReadableStreamType = "bytes";
export class Application {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Performs a query against an application's service.
   *
   * # Errors
   * If the application ID is invalid, the query is incorrect, or
   * the response isn't valid UTF-8.
   *
   * # Panics
   * On internal protocol errors.
   */
  query(query: string): Promise<string>;
}
/**
 * The full client API, exposed to the wallet implementation. Calls
 * to this API can be trusted to have originated from the user's
 * request. This struct is the backend for the extension itself
 * (side panel, option page, et cetera).
 */
export class Client {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Creates a new client and connects to the network.
   *
   * # Errors
   * On transport or protocol error, or if persistent storage is
   * unavailable.
   */
  constructor(wallet: Wallet, signer: Signer, skip_process_inbox: boolean);
  stop(): void;
  /**
   * Assigns a chain to the provided wallet key using only the ChainId (string).
   * `RESERVED` might need in the future
   */
  assignChain(wallet: Wallet, owner: any, chain_id: string): Promise<void>;
  /**
   * Sets a callback to be called when a notification is received
   * from the network.
   *
   * # Panics
   * If the handler function fails or we fail to subscribe to the
   * notification stream.
   */
  onNotification(handler: Function): void;
  /**
   * Transfers funds from one account to another.
   *
   * `options` should be an options object of the form `{ donor,
   * recipient, amount }`; omitting `donor` will cause the funds to
   * come from the chain balance.
   *
   * # Errors
   * - if the options object is of the wrong form
   * - if the transfer fails
   */
  transfer(options: any): Promise<void>;
  /**
   * Gets the balance of the default chain.
   *
   * # Errors
   * If the chain couldn't be established.
   */
  balance(): Promise<string>;
  /**
   * Gets the identity of the default chain.
   *
   * # Errors
   * If the chain couldn't be established.
   */
  identity(): Promise<any>;
  /**
   * Gets an object implementing the API for Web frontends.
   */
  frontend(): Frontend;
}
export class Faucet {
  free(): void;
  [Symbol.dispose](): void;
  constructor(url: string);
  /**
   * Creates a new wallet from the faucet.
   *
   * # Errors
   * If we couldn't retrieve the genesis config from the faucet.
   */
  createWallet(): Promise<Wallet>;
  /**
   * Claims a new chain from the faucet, with a new keypair and some tokens.
   *
   * # Errors
   * - if we fail to get the list of current validators from the faucet
   * - if we fail to claim the chain from the faucet
   * - if we fail to persist the new chain or keypair to the wallet
   *
   * # Panics
   * If an error occurs in the chain listener task.
   */
  claimChain(wallet: Wallet, owner: any): Promise<string>;
}
/**
 * The subset of the client API that should be exposed to application
 * frontends. Any function exported here with `wasm_bindgen` can be
 * called by untrusted Web pages, and so inputs must be verified and
 * outputs must not leak sensitive information without user
 * confirmation.
 */
export class Frontend {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Gets the version information of the validators of the current network.
   *
   * # Errors
   * If a validator is unreachable.
   *
   * # Panics
   * If no default chain is set for the current wallet.
   */
  validatorVersionInfo(): Promise<any>;
  /**
   * Retrieves an application for querying.
   *
   * # Errors
   * If the application ID is invalid.
   */
  application(id: string): Promise<Application>;
}
export class IntoUnderlyingByteSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  start(controller: ReadableByteStreamController): void;
  pull(controller: ReadableByteStreamController): Promise<any>;
  cancel(): void;
  readonly type: ReadableStreamType;
  readonly autoAllocateChunkSize: number;
}
export class IntoUnderlyingSink {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  write(chunk: any): Promise<any>;
  close(): Promise<any>;
  abort(reason: any): Promise<any>;
}
export class IntoUnderlyingSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  pull(controller: ReadableStreamDefaultController): Promise<any>;
  cancel(): void;
}
export class Secret {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Creates a new SecretVault instance.
   */
  constructor();
  /**
   * Stores a secret value under the provided field name.
   * Returns a JS Promise that resolves when the value has been written.
   */
  set(field: string, value: any): Promise<void>;
  /**
   * Retrieves a secret value for the provided field name.
   * Returns `undefined` if the key is not present.
   */
  get(field: string): Promise<any>;
}
/**
 * A wallet that stores the user's chains and keys in memory.
 */
export class Wallet {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Attempts to read the wallet from persistent storage.
   *
   * # Errors
   * If storage is inaccessible.
   */
  static get(): Promise<Wallet | undefined>;
  /**
   * This methods returns the Wallet stored in string format, that could be parsed into json.
   */
  static readJsWallet(): Promise<string>;
  /**
   * Takes wallet in string format parses it and updates the Store
   */
  static setJsWallet(wallet_json: string): Promise<Wallet>;
  save_to_storage(gn_flag: boolean): Promise<void>;
  assignChain(owner: any, chain_id: string, timestamp: any): Promise<void>;
  /**
   * Use to update default chain with new chain
   */
  setDefault(chain_id: string): Promise<void>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly __wbg_wallet_free: (a: number, b: number) => void;
  readonly __wbg_faucet_free: (a: number, b: number) => void;
  readonly faucet_new: (a: number, b: number) => number;
  readonly faucet_createWallet: (a: number) => any;
  readonly faucet_claimChain: (a: number, b: number, c: any) => any;
  readonly wallet_get: () => any;
  readonly wallet_readJsWallet: () => any;
  readonly wallet_setJsWallet: (a: number, b: number) => any;
  readonly wallet_save_to_storage: (a: number, b: number) => any;
  readonly wallet_assignChain: (a: number, b: any, c: number, d: number, e: any) => any;
  readonly wallet_setDefault: (a: number, b: number, c: number) => any;
  readonly __wbg_client_free: (a: number, b: number) => void;
  readonly __wbg_frontend_free: (a: number, b: number) => void;
  readonly client_new: (a: number, b: any, c: number) => any;
  readonly client_stop: (a: number) => void;
  readonly client_assignChain: (a: number, b: number, c: any, d: number, e: number) => any;
  readonly client_onNotification: (a: number, b: any) => void;
  readonly client_transfer: (a: number, b: any) => any;
  readonly client_balance: (a: number) => any;
  readonly client_identity: (a: number) => any;
  readonly client_frontend: (a: number) => number;
  readonly __wbg_application_free: (a: number, b: number) => void;
  readonly frontend_validatorVersionInfo: (a: number) => any;
  readonly frontend_application: (a: number, b: number, c: number) => any;
  readonly application_query: (a: number, b: number, c: number) => any;
  readonly main: () => void;
  readonly __wbg_secret_free: (a: number, b: number) => void;
  readonly secret_set: (a: number, b: number, c: number, d: any) => any;
  readonly secret_get: (a: number, b: number, c: number) => any;
  readonly secret_new: () => number;
  readonly wasm_thread_entry_point: (a: number) => any;
  readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
  readonly intounderlyingsink_write: (a: number, b: any) => any;
  readonly intounderlyingsink_close: (a: number) => any;
  readonly intounderlyingsink_abort: (a: number, b: any) => any;
  readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
  readonly intounderlyingsource_pull: (a: number, b: any) => any;
  readonly intounderlyingsource_cancel: (a: number) => void;
  readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
  readonly intounderlyingbytesource_type: (a: number) => number;
  readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
  readonly intounderlyingbytesource_start: (a: number, b: any) => void;
  readonly intounderlyingbytesource_pull: (a: number, b: any) => any;
  readonly intounderlyingbytesource_cancel: (a: number) => void;
  readonly __wbg_trap_free: (a: number, b: number) => void;
  readonly trap___wbg_wasmer_trap: () => void;
  readonly wasm_bindgen__convert__closures_____invoke__h1ce2b27b008b48cb: (a: number, b: number, c: any) => [number, number];
  readonly wasm_bindgen__closure__destroy__h5018753241d3f6c1: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h9b1c12fe6996ed5f: (a: number, b: number) => [number, number];
  readonly wasm_bindgen__closure__destroy__h3cd335803398cd16: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures________invoke__h4c206a50ca792112: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__hfa35261824995fa6: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h0a68803ec1253ff3: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__h61ac152e8c219c64: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__ha964f0d767020168: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__h4d400c7f7eba9116: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h95a07b32c214fca9: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h2f64b99bf954916b: (a: number, b: number, c: any, d: any) => void;
  readonly memory: WebAssembly.Memory;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export: WebAssembly.Table;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_thread_destroy: (a?: number, b?: number, c?: number) => void;
  readonly __wbindgen_start: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number }} module - Passing `SyncInitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number } | SyncInitInput, memory?: WebAssembly.Memory): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number }} module_or_path - Passing `InitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number } | InitInput | Promise<InitInput>, memory?: WebAssembly.Memory): Promise<InitOutput>;
