let wasm

let cachedUint8ArrayMemory0 = null

function getUint8ArrayMemory0() {
  if (
    cachedUint8ArrayMemory0 === null ||
    cachedUint8ArrayMemory0.buffer !== wasm.memory.buffer
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer)
  }
  return cachedUint8ArrayMemory0
}

let cachedTextDecoder =
  typeof TextDecoder !== 'undefined'
    ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true })
    : undefined

if (cachedTextDecoder) cachedTextDecoder.decode()

const MAX_SAFARI_DECODE_BYTES = 2146435072
let numBytesDecoded = 0
function decodeText(ptr, len) {
  numBytesDecoded += len
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder('utf-8', {
      ignoreBOM: true,
      fatal: true,
    })
    cachedTextDecoder.decode()
    numBytesDecoded = len
  }
  return cachedTextDecoder.decode(getUint8ArrayMemory0().slice(ptr, ptr + len))
}

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0
  return decodeText(ptr, len)
}

let WASM_VECTOR_LEN = 0

const cachedTextEncoder =
  typeof TextEncoder !== 'undefined' ? new TextEncoder() : undefined

if (cachedTextEncoder) {
  cachedTextEncoder.encodeInto = function (arg, view) {
    const buf = cachedTextEncoder.encode(arg)
    view.set(buf)
    return {
      read: arg.length,
      written: buf.length,
    }
  }
}

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg)
    const ptr = malloc(buf.length, 1) >>> 0
    getUint8ArrayMemory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf)
    WASM_VECTOR_LEN = buf.length
    return ptr
  }

  let len = arg.length
  let ptr = malloc(len, 1) >>> 0

  const mem = getUint8ArrayMemory0()

  let offset = 0

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset)
    if (code > 0x7f) break
    mem[ptr + offset] = code
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset)
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len)
    const ret = cachedTextEncoder.encodeInto(arg, view)

    offset += ret.written
    ptr = realloc(ptr, len, offset, 1) >>> 0
  }

  WASM_VECTOR_LEN = offset
  return ptr
}

let cachedDataViewMemory0 = null

function getDataViewMemory0() {
  if (
    cachedDataViewMemory0 === null ||
    cachedDataViewMemory0.buffer !== wasm.memory.buffer
  ) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer)
  }
  return cachedDataViewMemory0
}

function isLikeNone(x) {
  return x === undefined || x === null
}

function debugString(val) {
  // primitive types
  const type = typeof val
  if (type == 'number' || type == 'boolean' || val == null) {
    return `${val}`
  }
  if (type == 'string') {
    return `"${val}"`
  }
  if (type == 'symbol') {
    const description = val.description
    if (description == null) {
      return 'Symbol'
    } else {
      return `Symbol(${description})`
    }
  }
  if (type == 'function') {
    const name = val.name
    if (typeof name == 'string' && name.length > 0) {
      return `Function(${name})`
    } else {
      return 'Function'
    }
  }
  // objects
  if (Array.isArray(val)) {
    const length = val.length
    let debug = '['
    if (length > 0) {
      debug += debugString(val[0])
    }
    for (let i = 1; i < length; i++) {
      debug += ', ' + debugString(val[i])
    }
    debug += ']'
    return debug
  }
  // Test for built-in
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val))
  let className
  if (builtInMatches && builtInMatches.length > 1) {
    className = builtInMatches[1]
  } else {
    // Failed to match the standard '[object ClassName]'
    return toString.call(val)
  }
  if (className == 'Object') {
    // we're a user defined class or Object
    // JSON.stringify avoids problems with cycles, and is generally much
    // easier than looping through ownProperties of `val`.
    try {
      return 'Object(' + JSON.stringify(val) + ')'
    } catch (_) {
      return 'Object'
    }
  }
  // errors
  if (val instanceof Error) {
    return `${val.name}: ${val.message}\n${val.stack}`
  }
  // TODO we could test for more things here, like `Set`s and `Map`s.
  return className
}

function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc()
  wasm.__wbindgen_externrefs.set(idx, obj)
  return idx
}

function handleError(f, args) {
  try {
    return f.apply(this, args)
  } catch (e) {
    const idx = addToExternrefTable0(e)
    wasm.__wbindgen_exn_store(idx)
  }
}

function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len)
}

const CLOSURE_DTORS =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((state) => state.dtor(state.a, state.b))

function makeMutClosure(arg0, arg1, dtor, f) {
  const state = { a: arg0, b: arg1, cnt: 1, dtor }
  const real = (...args) => {
    // First up with a closure we increment the internal reference
    // count. This ensures that the Rust closure environment won't
    // be deallocated while we're invoking it.
    state.cnt++
    const a = state.a
    state.a = 0
    try {
      return f(a, state.b, ...args)
    } finally {
      state.a = a
      real._wbg_cb_unref()
    }
  }
  real._wbg_cb_unref = () => {
    if (--state.cnt === 0) {
      state.dtor(state.a, state.b)
      state.a = 0
      CLOSURE_DTORS.unregister(state)
    }
  }
  CLOSURE_DTORS.register(real, state, state)
  return real
}

function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`)
  }
}

export function main() {
  wasm.main()
}

/**
 * Entry point for web workers
 * @param {number} ptr
 * @returns {Promise<void>}
 */
export function wasm_thread_entry_point(ptr) {
  const ret = wasm.wasm_thread_entry_point(ptr)
  return ret
}

function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_externrefs.get(idx)
  wasm.__externref_table_dealloc(idx)
  return value
}
function wasm_bindgen__convert__closures_____invoke__h1ce2b27b008b48cb(
  arg0,
  arg1,
  arg2
) {
  const ret =
    wasm.wasm_bindgen__convert__closures_____invoke__h1ce2b27b008b48cb(
      arg0,
      arg1,
      arg2
    )
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0])
  }
}

function wasm_bindgen__convert__closures_____invoke__h9b1c12fe6996ed5f(
  arg0,
  arg1
) {
  const ret =
    wasm.wasm_bindgen__convert__closures_____invoke__h9b1c12fe6996ed5f(
      arg0,
      arg1
    )
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0])
  }
}

function wasm_bindgen__convert__closures________invoke__h4c206a50ca792112(
  arg0,
  arg1,
  arg2
) {
  wasm.wasm_bindgen__convert__closures________invoke__h4c206a50ca792112(
    arg0,
    arg1,
    arg2
  )
}

function wasm_bindgen__convert__closures_____invoke__h0a68803ec1253ff3(
  arg0,
  arg1,
  arg2
) {
  wasm.wasm_bindgen__convert__closures_____invoke__h0a68803ec1253ff3(
    arg0,
    arg1,
    arg2
  )
}

function wasm_bindgen__convert__closures_____invoke__ha964f0d767020168(
  arg0,
  arg1,
  arg2
) {
  wasm.wasm_bindgen__convert__closures_____invoke__ha964f0d767020168(
    arg0,
    arg1,
    arg2
  )
}

function wasm_bindgen__convert__closures_____invoke__h95a07b32c214fca9(
  arg0,
  arg1,
  arg2
) {
  wasm.wasm_bindgen__convert__closures_____invoke__h95a07b32c214fca9(
    arg0,
    arg1,
    arg2
  )
}

function wasm_bindgen__convert__closures_____invoke__h2f64b99bf954916b(
  arg0,
  arg1,
  arg2,
  arg3
) {
  wasm.wasm_bindgen__convert__closures_____invoke__h2f64b99bf954916b(
    arg0,
    arg1,
    arg2,
    arg3
  )
}

/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 9}
 */
export const SignerError = Object.freeze({
  MissingKey: 0,
  0: 'MissingKey',
  SigningError: 1,
  1: 'SigningError',
  PublicKeyParse: 2,
  2: 'PublicKeyParse',
  JsConversion: 3,
  3: 'JsConversion',
  UnexpectedSignatureFormat: 4,
  4: 'UnexpectedSignatureFormat',
  InvalidAccountOwnerType: 5,
  5: 'InvalidAccountOwnerType',
  Unknown: 9,
  9: 'Unknown',
})

const __wbindgen_enum_IdbTransactionMode = [
  'readonly',
  'readwrite',
  'versionchange',
  'readwriteflush',
  'cleanup',
]

const __wbindgen_enum_ReadableStreamType = ['bytes']

const __wbindgen_enum_ReferrerPolicy = [
  '',
  'no-referrer',
  'no-referrer-when-downgrade',
  'origin',
  'origin-when-cross-origin',
  'unsafe-url',
  'same-origin',
  'strict-origin',
  'strict-origin-when-cross-origin',
]

const __wbindgen_enum_RequestCache = [
  'default',
  'no-store',
  'reload',
  'no-cache',
  'force-cache',
  'only-if-cached',
]

const __wbindgen_enum_RequestCredentials = ['omit', 'same-origin', 'include']

const __wbindgen_enum_RequestMode = [
  'same-origin',
  'no-cors',
  'cors',
  'navigate',
]

const __wbindgen_enum_RequestRedirect = ['follow', 'error', 'manual']

const __wbindgen_enum_WorkerType = ['classic', 'module']

const ApplicationFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
        wasm.__wbg_application_free(ptr >>> 0, 1)
      )

export class Application {
  static __wrap(ptr) {
    ptr = ptr >>> 0
    const obj = Object.create(Application.prototype)
    obj.__wbg_ptr = ptr
    ApplicationFinalization.register(obj, obj.__wbg_ptr, obj)
    return obj
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    ApplicationFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_application_free(ptr, 0)
  }
  /**
   * Performs a query against an application's service.
   *
   * # Errors
   * If the application ID is invalid, the query is incorrect, or
   * the response isn't valid UTF-8.
   *
   * # Panics
   * On internal protocol errors.
   * @param {string} query
   * @returns {Promise<string>}
   */
  query(query) {
    const ptr0 = passStringToWasm0(
      query,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.application_query(this.__wbg_ptr, ptr0, len0)
    return ret
  }
}
if (Symbol.dispose)
  Application.prototype[Symbol.dispose] = Application.prototype.free

const ClientFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) => wasm.__wbg_client_free(ptr >>> 0, 1))
/**
 * The full client API, exposed to the wallet implementation. Calls
 * to this API can be trusted to have originated from the user's
 * request. This struct is the backend for the extension itself
 * (side panel, option page, et cetera).
 */
export class Client {
  static __wrap(ptr) {
    ptr = ptr >>> 0
    const obj = Object.create(Client.prototype)
    obj.__wbg_ptr = ptr
    ClientFinalization.register(obj, obj.__wbg_ptr, obj)
    return obj
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    ClientFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_client_free(ptr, 0)
  }
  /**
   * Creates a new client and connects to the network.
   *
   * # Errors
   * On transport or protocol error, or if persistent storage is
   * unavailable.
   * @param {Wallet} wallet
   * @param {Signer} signer
   * @param {boolean} skip_process_inbox
   */
  constructor(wallet, signer, skip_process_inbox) {
    _assertClass(wallet, Wallet)
    var ptr0 = wallet.__destroy_into_raw()
    const ret = wasm.client_new(ptr0, signer, skip_process_inbox)
    return ret
  }
  stop() {
    wasm.client_stop(this.__wbg_ptr)
  }
  /**
   * Assigns a chain to the provided wallet key using only the ChainId (string).
   * `RESERVED` might need in the future
   * @param {Wallet} wallet
   * @param {any} owner
   * @param {string} chain_id
   * @returns {Promise<void>}
   */
  assignChain(wallet, owner, chain_id) {
    _assertClass(wallet, Wallet)
    const ptr0 = passStringToWasm0(
      chain_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.client_assignChain(
      this.__wbg_ptr,
      wallet.__wbg_ptr,
      owner,
      ptr0,
      len0
    )
    return ret
  }
  /**
   * Sets a callback to be called when a notification is received
   * from the network.
   *
   * # Panics
   * If the handler function fails or we fail to subscribe to the
   * notification stream.
   * @param {Function} handler
   */
  onNotification(handler) {
    wasm.client_onNotification(this.__wbg_ptr, handler)
  }
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
   * @param {any} options
   * @returns {Promise<void>}
   */
  transfer(options) {
    const ret = wasm.client_transfer(this.__wbg_ptr, options)
    return ret
  }
  /**
   * Gets the balance of the default chain.
   *
   * # Errors
   * If the chain couldn't be established.
   * @returns {Promise<string>}
   */
  balance() {
    const ret = wasm.client_balance(this.__wbg_ptr)
    return ret
  }
  /**
   * Gets the identity of the default chain.
   *
   * # Errors
   * If the chain couldn't be established.
   * @returns {Promise<any>}
   */
  identity() {
    const ret = wasm.client_identity(this.__wbg_ptr)
    return ret
  }
  /**
   * Gets an object implementing the API for Web frontends.
   * @returns {Frontend}
   */
  frontend() {
    const ret = wasm.client_frontend(this.__wbg_ptr)
    return Frontend.__wrap(ret)
  }
}
if (Symbol.dispose) Client.prototype[Symbol.dispose] = Client.prototype.free

const FaucetFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) => wasm.__wbg_faucet_free(ptr >>> 0, 1))

export class Faucet {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    FaucetFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_faucet_free(ptr, 0)
  }
  /**
   * @param {string} url
   */
  constructor(url) {
    const ptr0 = passStringToWasm0(
      url,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.faucet_new(ptr0, len0)
    this.__wbg_ptr = ret >>> 0
    FaucetFinalization.register(this, this.__wbg_ptr, this)
    return this
  }
  /**
   * Creates a new wallet from the faucet.
   *
   * # Errors
   * If we couldn't retrieve the genesis config from the faucet.
   * @returns {Promise<Wallet>}
   */
  createWallet() {
    const ret = wasm.faucet_createWallet(this.__wbg_ptr)
    return ret
  }
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
   * @param {Wallet} wallet
   * @param {any} owner
   * @returns {Promise<string>}
   */
  claimChain(wallet, owner) {
    _assertClass(wallet, Wallet)
    const ret = wasm.faucet_claimChain(this.__wbg_ptr, wallet.__wbg_ptr, owner)
    return ret
  }
}
if (Symbol.dispose) Faucet.prototype[Symbol.dispose] = Faucet.prototype.free

const FrontendFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) => wasm.__wbg_frontend_free(ptr >>> 0, 1))
/**
 * The subset of the client API that should be exposed to application
 * frontends. Any function exported here with `wasm_bindgen` can be
 * called by untrusted Web pages, and so inputs must be verified and
 * outputs must not leak sensitive information without user
 * confirmation.
 */
export class Frontend {
  static __wrap(ptr) {
    ptr = ptr >>> 0
    const obj = Object.create(Frontend.prototype)
    obj.__wbg_ptr = ptr
    FrontendFinalization.register(obj, obj.__wbg_ptr, obj)
    return obj
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    FrontendFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_frontend_free(ptr, 0)
  }
  /**
   * Gets the version information of the validators of the current network.
   *
   * # Errors
   * If a validator is unreachable.
   *
   * # Panics
   * If no default chain is set for the current wallet.
   * @returns {Promise<any>}
   */
  validatorVersionInfo() {
    const ret = wasm.frontend_validatorVersionInfo(this.__wbg_ptr)
    return ret
  }
  /**
   * Retrieves an application for querying.
   *
   * # Errors
   * If the application ID is invalid.
   * @param {string} id
   * @returns {Promise<Application>}
   */
  application(id) {
    const ptr0 = passStringToWasm0(
      id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.frontend_application(this.__wbg_ptr, ptr0, len0)
    return ret
  }
}
if (Symbol.dispose) Frontend.prototype[Symbol.dispose] = Frontend.prototype.free

const IntoUnderlyingByteSourceFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
        wasm.__wbg_intounderlyingbytesource_free(ptr >>> 0, 1)
      )

export class IntoUnderlyingByteSource {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    IntoUnderlyingByteSourceFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_intounderlyingbytesource_free(ptr, 0)
  }
  /**
   * @returns {ReadableStreamType}
   */
  get type() {
    const ret = wasm.intounderlyingbytesource_type(this.__wbg_ptr)
    return __wbindgen_enum_ReadableStreamType[ret]
  }
  /**
   * @returns {number}
   */
  get autoAllocateChunkSize() {
    const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(
      this.__wbg_ptr
    )
    return ret >>> 0
  }
  /**
   * @param {ReadableByteStreamController} controller
   */
  start(controller) {
    wasm.intounderlyingbytesource_start(this.__wbg_ptr, controller)
  }
  /**
   * @param {ReadableByteStreamController} controller
   * @returns {Promise<any>}
   */
  pull(controller) {
    const ret = wasm.intounderlyingbytesource_pull(this.__wbg_ptr, controller)
    return ret
  }
  cancel() {
    const ptr = this.__destroy_into_raw()
    wasm.intounderlyingbytesource_cancel(ptr)
  }
}
if (Symbol.dispose)
  IntoUnderlyingByteSource.prototype[Symbol.dispose] =
    IntoUnderlyingByteSource.prototype.free

const IntoUnderlyingSinkFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
        wasm.__wbg_intounderlyingsink_free(ptr >>> 0, 1)
      )

export class IntoUnderlyingSink {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    IntoUnderlyingSinkFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_intounderlyingsink_free(ptr, 0)
  }
  /**
   * @param {any} chunk
   * @returns {Promise<any>}
   */
  write(chunk) {
    const ret = wasm.intounderlyingsink_write(this.__wbg_ptr, chunk)
    return ret
  }
  /**
   * @returns {Promise<any>}
   */
  close() {
    const ptr = this.__destroy_into_raw()
    const ret = wasm.intounderlyingsink_close(ptr)
    return ret
  }
  /**
   * @param {any} reason
   * @returns {Promise<any>}
   */
  abort(reason) {
    const ptr = this.__destroy_into_raw()
    const ret = wasm.intounderlyingsink_abort(ptr, reason)
    return ret
  }
}
if (Symbol.dispose)
  IntoUnderlyingSink.prototype[Symbol.dispose] =
    IntoUnderlyingSink.prototype.free

const IntoUnderlyingSourceFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
        wasm.__wbg_intounderlyingsource_free(ptr >>> 0, 1)
      )

export class IntoUnderlyingSource {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    IntoUnderlyingSourceFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_intounderlyingsource_free(ptr, 0)
  }
  /**
   * @param {ReadableStreamDefaultController} controller
   * @returns {Promise<any>}
   */
  pull(controller) {
    const ret = wasm.intounderlyingsource_pull(this.__wbg_ptr, controller)
    return ret
  }
  cancel() {
    const ptr = this.__destroy_into_raw()
    wasm.intounderlyingsource_cancel(ptr)
  }
}
if (Symbol.dispose)
  IntoUnderlyingSource.prototype[Symbol.dispose] =
    IntoUnderlyingSource.prototype.free

const SecretFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) => wasm.__wbg_secret_free(ptr >>> 0, 1))

export class Secret {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    SecretFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_secret_free(ptr, 0)
  }
  /**
   * Creates a new SecretVault instance.
   */
  constructor() {
    const ret = wasm.secret_new()
    this.__wbg_ptr = ret >>> 0
    SecretFinalization.register(this, this.__wbg_ptr, this)
    return this
  }
  /**
   * Stores a secret value under the provided field name.
   * Returns a JS Promise that resolves when the value has been written.
   * @param {string} field
   * @param {any} value
   * @returns {Promise<void>}
   */
  set(field, value) {
    const ptr0 = passStringToWasm0(
      field,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.secret_set(this.__wbg_ptr, ptr0, len0, value)
    return ret
  }
  /**
   * Retrieves a secret value for the provided field name.
   * Returns `undefined` if the key is not present.
   * @param {string} field
   * @returns {Promise<any>}
   */
  get(field) {
    const ptr0 = passStringToWasm0(
      field,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.secret_get(this.__wbg_ptr, ptr0, len0)
    return ret
  }
}
if (Symbol.dispose) Secret.prototype[Symbol.dispose] = Secret.prototype.free

const TrapFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) => wasm.__wbg_trap_free(ptr >>> 0, 1))
/**
 * A struct representing a Trap
 */
export class Trap {
  static __wrap(ptr) {
    ptr = ptr >>> 0
    const obj = Object.create(Trap.prototype)
    obj.__wbg_ptr = ptr
    TrapFinalization.register(obj, obj.__wbg_ptr, obj)
    return obj
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    TrapFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_trap_free(ptr, 0)
  }
  /**
   * A marker method to indicate that an object is an instance of the `Trap`
   * class.
   */
  static __wbg_wasmer_trap() {
    wasm.trap___wbg_wasmer_trap()
  }
}
if (Symbol.dispose) Trap.prototype[Symbol.dispose] = Trap.prototype.free

const WalletFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) => wasm.__wbg_wallet_free(ptr >>> 0, 1))
/**
 * A wallet that stores the user's chains and keys in memory.
 */
export class Wallet {
  static __wrap(ptr) {
    ptr = ptr >>> 0
    const obj = Object.create(Wallet.prototype)
    obj.__wbg_ptr = ptr
    WalletFinalization.register(obj, obj.__wbg_ptr, obj)
    return obj
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    WalletFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_wallet_free(ptr, 0)
  }
  /**
   * Attempts to read the wallet from persistent storage.
   *
   * # Errors
   * If storage is inaccessible.
   * @returns {Promise<Wallet | undefined>}
   */
  static get() {
    const ret = wasm.wallet_get()
    return ret
  }
  /**
   * This methods returns the Wallet stored in string format, that could be parsed into json.
   * @returns {Promise<string>}
   */
  static readJsWallet() {
    const ret = wasm.wallet_readJsWallet()
    return ret
  }
  /**
   * Takes wallet in string format parses it and updates the Store
   * @param {string} wallet_json
   * @returns {Promise<Wallet>}
   */
  static setJsWallet(wallet_json) {
    const ptr0 = passStringToWasm0(
      wallet_json,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.wallet_setJsWallet(ptr0, len0)
    return ret
  }
  /**
   * @param {boolean} gn_flag
   * @returns {Promise<void>}
   */
  save_to_storage(gn_flag) {
    const ret = wasm.wallet_save_to_storage(this.__wbg_ptr, gn_flag)
    return ret
  }
  /**
   * @param {any} owner
   * @param {string} chain_id
   * @param {any} timestamp
   * @returns {Promise<void>}
   */
  assignChain(owner, chain_id, timestamp) {
    const ptr0 = passStringToWasm0(
      chain_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.wallet_assignChain(
      this.__wbg_ptr,
      owner,
      ptr0,
      len0,
      timestamp
    )
    return ret
  }
  /**
   * Use to update default chain with new chain
   * @param {string} chain_id
   * @returns {Promise<void>}
   */
  setDefault(chain_id) {
    const ptr0 = passStringToWasm0(
      chain_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.wallet_setDefault(this.__wbg_ptr, ptr0, len0)
    return ret
  }
}
if (Symbol.dispose) Wallet.prototype[Symbol.dispose] = Wallet.prototype.free

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default'])

async function __wbg_load(module, imports) {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        return await WebAssembly.instantiateStreaming(module, imports)
      } catch (e) {
        const validResponse =
          module.ok && EXPECTED_RESPONSE_TYPES.has(module.type)

        if (
          validResponse &&
          module.headers.get('Content-Type') !== 'application/wasm'
        ) {
          console.warn(
            '`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n',
            e
          )
        } else {
          throw e
        }
      }
    }

    const bytes = await module.arrayBuffer()
    return await WebAssembly.instantiate(bytes, imports)
  } else {
    const instance = await WebAssembly.instantiate(module, imports)

    if (instance instanceof WebAssembly.Instance) {
      return { instance, module }
    } else {
      return instance
    }
  }
}

function __wbg_get_imports(memory) {
  const imports = {}
  imports.wbg = {}
  imports.wbg.__wbg_BigInt_77ad2fe9a1c378c1 = function (arg0) {
    const ret = BigInt(arg0)
    return ret
  }
  imports.wbg.__wbg_Error_e83987f665cf5504 = function (arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1))
    return ret
  }
  imports.wbg.__wbg_Number_bb48ca12f395cd08 = function (arg0) {
    const ret = Number(arg0)
    return ret
  }
  imports.wbg.__wbg_String_8f0eb39a4a4c2f66 = function (arg0, arg1) {
    const ret = String(arg1)
    const ptr1 = passStringToWasm0(
      ret,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.__wbg___wbindgen_bigint_get_as_i64_f3ebc5a755000afd = function (
    arg0,
    arg1
  ) {
    const v = arg1
    const ret = typeof v === 'bigint' ? v : undefined
    getDataViewMemory0().setBigInt64(
      arg0 + 8 * 1,
      isLikeNone(ret) ? BigInt(0) : ret,
      true
    )
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true)
  }
  imports.wbg.__wbg___wbindgen_boolean_get_6d5a1ee65bab5f68 = function (arg0) {
    const v = arg0
    const ret = typeof v === 'boolean' ? v : undefined
    return isLikeNone(ret) ? 0xffffff : ret ? 1 : 0
  }
  imports.wbg.__wbg___wbindgen_debug_string_df47ffb5e35e6763 = function (
    arg0,
    arg1
  ) {
    const ret = debugString(arg1)
    const ptr1 = passStringToWasm0(
      ret,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.__wbg___wbindgen_function_table_cc7e33c00e7c1206 = function () {
    const ret = wasm.__wbindgen_export
    return ret
  }
  imports.wbg.__wbg___wbindgen_in_bb933bd9e1b3bc0f = function (arg0, arg1) {
    const ret = arg0 in arg1
    return ret
  }
  imports.wbg.__wbg___wbindgen_is_bigint_cb320707dcd35f0b = function (arg0) {
    const ret = typeof arg0 === 'bigint'
    return ret
  }
  imports.wbg.__wbg___wbindgen_is_function_ee8a6c5833c90377 = function (arg0) {
    const ret = typeof arg0 === 'function'
    return ret
  }
  imports.wbg.__wbg___wbindgen_is_null_5e69f72e906cc57c = function (arg0) {
    const ret = arg0 === null
    return ret
  }
  imports.wbg.__wbg___wbindgen_is_object_c818261d21f283a4 = function (arg0) {
    const val = arg0
    const ret = typeof val === 'object' && val !== null
    return ret
  }
  imports.wbg.__wbg___wbindgen_is_string_fbb76cb2940daafd = function (arg0) {
    const ret = typeof arg0 === 'string'
    return ret
  }
  imports.wbg.__wbg___wbindgen_is_undefined_2d472862bd29a478 = function (arg0) {
    const ret = arg0 === undefined
    return ret
  }
  imports.wbg.__wbg___wbindgen_jsval_eq_6b13ab83478b1c50 = function (
    arg0,
    arg1
  ) {
    const ret = arg0 === arg1
    return ret
  }
  imports.wbg.__wbg___wbindgen_jsval_loose_eq_b664b38a2f582147 = function (
    arg0,
    arg1
  ) {
    const ret = arg0 == arg1
    return ret
  }
  imports.wbg.__wbg___wbindgen_lt_6594d884e1c6a1ab = function (arg0, arg1) {
    const ret = arg0 < arg1
    return ret
  }
  imports.wbg.__wbg___wbindgen_memory_27faa6e0e73716bd = function () {
    const ret = wasm.memory
    return ret
  }
  imports.wbg.__wbg___wbindgen_module_66f1f22805762dd9 = function () {
    const ret = __wbg_init.__wbindgen_wasm_module
    return ret
  }
  imports.wbg.__wbg___wbindgen_neg_9b61844910d27670 = function (arg0) {
    const ret = -arg0
    return ret
  }
  imports.wbg.__wbg___wbindgen_number_get_a20bf9b85341449d = function (
    arg0,
    arg1
  ) {
    const obj = arg1
    const ret = typeof obj === 'number' ? obj : undefined
    getDataViewMemory0().setFloat64(
      arg0 + 8 * 1,
      isLikeNone(ret) ? 0 : ret,
      true
    )
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true)
  }
  imports.wbg.__wbg___wbindgen_rethrow_ea38273dafc473e6 = function (arg0) {
    throw arg0
  }
  imports.wbg.__wbg___wbindgen_shr_5fb5dd3acf2615de = function (arg0, arg1) {
    const ret = arg0 >> arg1
    return ret
  }
  imports.wbg.__wbg___wbindgen_string_get_e4f06c90489ad01b = function (
    arg0,
    arg1
  ) {
    const obj = arg1
    const ret = typeof obj === 'string' ? obj : undefined
    var ptr1 = isLikeNone(ret)
      ? 0
      : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc)
    var len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.__wbg___wbindgen_throw_b855445ff6a94295 = function (arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1))
  }
  imports.wbg.__wbg__wbg_cb_unref_2454a539ea5790d9 = function (arg0) {
    arg0._wbg_cb_unref()
  }
  imports.wbg.__wbg_abort_e7eb059f72f9ed0c = function (arg0) {
    arg0.abort()
  }
  imports.wbg.__wbg_append_b577eb3a177bc0fa = function () {
    return handleError(function (arg0, arg1, arg2, arg3, arg4) {
      arg0.append(
        getStringFromWasm0(arg1, arg2),
        getStringFromWasm0(arg3, arg4)
      )
    }, arguments)
  }
  imports.wbg.__wbg_application_new = function (arg0) {
    const ret = Application.__wrap(arg0)
    return ret
  }
  imports.wbg.__wbg_apply_04097a755e1e4a1e = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = arg0.apply(arg1, arg2)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_arrayBuffer_b375eccb84b4ddf3 = function () {
    return handleError(function (arg0) {
      const ret = arg0.arrayBuffer()
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_async_e87317718510d1c4 = function (arg0) {
    const ret = arg0.async
    return ret
  }
  imports.wbg.__wbg_bind_724567e5ec7afc84 = function (arg0, arg1, arg2, arg3) {
    const ret = arg0.bind(arg1, arg2, arg3)
    return ret
  }
  imports.wbg.__wbg_body_587542b2fd8e06c0 = function (arg0) {
    const ret = arg0.body
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_buffer_83ef46cd84885a60 = function (arg0) {
    const ret = arg0.buffer
    return ret
  }
  imports.wbg.__wbg_buffer_ccc4520b36d3ccf4 = function (arg0) {
    const ret = arg0.buffer
    return ret
  }
  imports.wbg.__wbg_byobRequest_2344e6975f27456e = function (arg0) {
    const ret = arg0.byobRequest
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_byteLength_bcd42e4025299788 = function (arg0) {
    const ret = arg0.byteLength
    return ret
  }
  imports.wbg.__wbg_byteLength_eb3438154e05658e = function (arg0) {
    const ret = arg0.byteLength
    return ret
  }
  imports.wbg.__wbg_byteOffset_ca3a6cf7944b364b = function (arg0) {
    const ret = arg0.byteOffset
    return ret
  }
  imports.wbg.__wbg_call_525440f72fbfc0ea = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = arg0.call(arg1, arg2)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_call_e762c39fa8ea36bf = function () {
    return handleError(function (arg0, arg1) {
      const ret = arg0.call(arg1)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_cancel_48ab6f9dc366e369 = function (arg0) {
    const ret = arg0.cancel()
    return ret
  }
  imports.wbg.__wbg_catch_943836faa5d29bfb = function (arg0, arg1) {
    const ret = arg0.catch(arg1)
    return ret
  }
  imports.wbg.__wbg_clearTimeout_e2c164dca9ff176f = function () {
    return handleError(function (arg0, arg1) {
      arg0.clearTimeout(arg1)
    }, arguments)
  }
  imports.wbg.__wbg_client_new = function (arg0) {
    const ret = Client.__wrap(arg0)
    return ret
  }
  imports.wbg.__wbg_close_5a6caed3231b68cd = function () {
    return handleError(function (arg0) {
      arg0.close()
    }, arguments)
  }
  imports.wbg.__wbg_close_6956df845478561a = function () {
    return handleError(function (arg0) {
      arg0.close()
    }, arguments)
  }
  imports.wbg.__wbg_close_74386af11ef5ae35 = function (arg0) {
    arg0.close()
  }
  imports.wbg.__wbg_constructor_43c608587565cd11 = function (arg0) {
    const ret = arg0.constructor
    return ret
  }
  imports.wbg.__wbg_containsKey_a4b69df73be3b02e = function () {
    return handleError(function (arg0, arg1) {
      const ret = arg0.containsKey(arg1)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_createIndex_bf0bba749e8ae929 = function () {
    return handleError(function (arg0, arg1, arg2, arg3, arg4) {
      const ret = arg0.createIndex(getStringFromWasm0(arg1, arg2), arg3, arg4)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_createObjectStore_283a43a822bf49ca = function () {
    return handleError(function (arg0, arg1, arg2, arg3) {
      const ret = arg0.createObjectStore(getStringFromWasm0(arg1, arg2), arg3)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_create_f2b6bfa66a83e88e = function (arg0) {
    const ret = Object.create(arg0)
    return ret
  }
  imports.wbg.__wbg_crypto_574e78ad8b13b65f = function (arg0) {
    const ret = arg0.crypto
    return ret
  }
  imports.wbg.__wbg_data_ee4306d069f24f2d = function (arg0) {
    const ret = arg0.data
    return ret
  }
  imports.wbg.__wbg_debug_e55e1461940eb14d = function (arg0, arg1, arg2, arg3) {
    console.debug(arg0, arg1, arg2, arg3)
  }
  imports.wbg.__wbg_debug_f4b0c59db649db48 = function (arg0) {
    console.debug(arg0)
  }
  imports.wbg.__wbg_deleteIndex_34dd22a93e8c22c2 = function () {
    return handleError(function (arg0, arg1, arg2) {
      arg0.deleteIndex(getStringFromWasm0(arg1, arg2))
    }, arguments)
  }
  imports.wbg.__wbg_deleteObjectStore_444a266b213fafcf = function () {
    return handleError(function (arg0, arg1, arg2) {
      arg0.deleteObjectStore(getStringFromWasm0(arg1, arg2))
    }, arguments)
  }
  imports.wbg.__wbg_done_2042aa2670fb1db1 = function (arg0) {
    const ret = arg0.done
    return ret
  }
  imports.wbg.__wbg_enqueue_7b18a650aec77898 = function () {
    return handleError(function (arg0, arg1) {
      arg0.enqueue(arg1)
    }, arguments)
  }
  imports.wbg.__wbg_entries_e171b586f8f6bdbf = function (arg0) {
    const ret = Object.entries(arg0)
    return ret
  }
  imports.wbg.__wbg_error_3e929987fcd3e155 = function () {
    return handleError(function (arg0) {
      const ret = arg0.error
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
    }, arguments)
  }
  imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function (arg0, arg1) {
    let deferred0_0
    let deferred0_1
    try {
      deferred0_0 = arg0
      deferred0_1 = arg1
      console.error(getStringFromWasm0(arg0, arg1))
    } finally {
      wasm.__wbindgen_free(deferred0_0, deferred0_1, 1)
    }
  }
  imports.wbg.__wbg_error_87b9cee2628b207f = function (arg0) {
    const ret = arg0.error
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_error_a7f8fbb0523dae15 = function (arg0) {
    console.error(arg0)
  }
  imports.wbg.__wbg_error_d8b22cf4e59a6791 = function (arg0, arg1, arg2, arg3) {
    console.error(arg0, arg1, arg2, arg3)
  }
  imports.wbg.__wbg_exports_2304a3ebce53581f = function (arg0) {
    const ret = WebAssembly.Module.exports(arg0)
    return ret
  }
  imports.wbg.__wbg_exports_28be6b3ce5245aee = function (arg0) {
    const ret = arg0.exports
    return ret
  }
  imports.wbg.__wbg_fetch_769f3df592e37b75 = function (arg0, arg1) {
    const ret = fetch(arg0, arg1)
    return ret
  }
  imports.wbg.__wbg_fetch_8725865ff47e7fcc = function (arg0, arg1, arg2) {
    const ret = arg0.fetch(arg1, arg2)
    return ret
  }
  imports.wbg.__wbg_fetch_f1856afdb49415d1 = function (arg0) {
    const ret = fetch(arg0)
    return ret
  }
  imports.wbg.__wbg_fetch_f8ba0e29a9d6de0d = function (arg0, arg1) {
    const ret = arg0.fetch(arg1)
    return ret
  }
  imports.wbg.__wbg_from_a4ad7cbddd0d7135 = function (arg0) {
    const ret = Array.from(arg0)
    return ret
  }
  imports.wbg.__wbg_getPrototypeOf_1dc579cfe9cfdc88 = function () {
    return handleError(function (arg0) {
      const ret = Reflect.getPrototypeOf(arg0)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function () {
    return handleError(function (arg0, arg1) {
      arg0.getRandomValues(arg1)
    }, arguments)
  }
  imports.wbg.__wbg_getReader_48e00749fe3f6089 = function () {
    return handleError(function (arg0) {
      const ret = arg0.getReader()
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_get_338e1ff0c2787b76 = function () {
    return handleError(function (arg0, arg1) {
      const ret = arg0.get(arg1 >>> 0)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_get_7bed016f185add81 = function (arg0, arg1) {
    const ret = arg0[arg1 >>> 0]
    return ret
  }
  imports.wbg.__wbg_get_done_a0463af43a1fc764 = function (arg0) {
    const ret = arg0.done
    return isLikeNone(ret) ? 0xffffff : ret ? 1 : 0
  }
  imports.wbg.__wbg_get_e7f29cbc382cd519 = function (arg0, arg1, arg2) {
    const ret = arg1[arg2 >>> 0]
    var ptr1 = isLikeNone(ret)
      ? 0
      : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc)
    var len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.__wbg_get_efcb449f58ec27c2 = function () {
    return handleError(function (arg0, arg1) {
      const ret = Reflect.get(arg0, arg1)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_get_fb1fa70beb44a754 = function () {
    return handleError(function (arg0, arg1) {
      const ret = arg0.get(arg1)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_get_value_5ce96c9f81ce7398 = function (arg0) {
    const ret = arg0.value
    return ret
  }
  imports.wbg.__wbg_get_with_ref_key_1dc361bd10053bfe = function (arg0, arg1) {
    const ret = arg0[arg1]
    return ret
  }
  imports.wbg.__wbg_get_with_ref_key_bb8f74a92cb2e784 = function (arg0, arg1) {
    const ret = arg0[arg1]
    return ret
  }
  imports.wbg.__wbg_has_787fafc980c3ccdb = function () {
    return handleError(function (arg0, arg1) {
      const ret = Reflect.has(arg0, arg1)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_headers_b87d7eaba61c3278 = function (arg0) {
    const ret = arg0.headers
    return ret
  }
  imports.wbg.__wbg_imports_17a30af781c4b27a = function (arg0) {
    const ret = WebAssembly.Module.imports(arg0)
    return ret
  }
  imports.wbg.__wbg_indexNames_4f8580e380a5e4d1 = function (arg0) {
    const ret = arg0.indexNames
    return ret
  }
  imports.wbg.__wbg_index_ed05511cfa2e8920 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = arg0.index(getStringFromWasm0(arg1, arg2))
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_info_68cd5b51ef7e5137 = function (arg0, arg1, arg2, arg3) {
    console.info(arg0, arg1, arg2, arg3)
  }
  imports.wbg.__wbg_info_e674a11f4f50cc0c = function (arg0) {
    console.info(arg0)
  }
  imports.wbg.__wbg_instanceof_ArrayBuffer_70beb1189ca63b38 = function (arg0) {
    let result
    try {
      result = arg0 instanceof ArrayBuffer
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_DedicatedWorkerGlobalScope_d61efa8df8d9f04f =
    function (arg0) {
      let result
      try {
        result = arg0 instanceof DedicatedWorkerGlobalScope
      } catch (_) {
        result = false
      }
      const ret = result
      return ret
    }
  imports.wbg.__wbg_instanceof_Error_a944ec10920129e2 = function (arg0) {
    let result
    try {
      result = arg0 instanceof Error
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_Function_9a84fba63c8caf28 = function (arg0) {
    let result
    try {
      result = arg0 instanceof Function
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_Global_9ffa24a61f970d55 = function (arg0) {
    let result
    try {
      result = arg0 instanceof WebAssembly.Global
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_IdbDatabase_fcf75ffeeec3ec8c = function (arg0) {
    let result
    try {
      result = arg0 instanceof IDBDatabase
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_IdbFactory_b39cfd3ab00cea49 = function (arg0) {
    let result
    try {
      result = arg0 instanceof IDBFactory
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_IdbOpenDbRequest_08e4929084e51476 = function (
    arg0
  ) {
    let result
    try {
      result = arg0 instanceof IDBOpenDBRequest
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_IdbRequest_26754883a3cc8f81 = function (arg0) {
    let result
    try {
      result = arg0 instanceof IDBRequest
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_IdbTransaction_ab2777580e1cb04c = function (
    arg0
  ) {
    let result
    try {
      result = arg0 instanceof IDBTransaction
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_Map_8579b5e2ab5437c7 = function (arg0) {
    let result
    try {
      result = arg0 instanceof Map
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_Memory_e903cd01d101b9a1 = function (arg0) {
    let result
    try {
      result = arg0 instanceof WebAssembly.Memory
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_Module_9f7f08986cf01061 = function (arg0) {
    let result
    try {
      result = arg0 instanceof WebAssembly.Module
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_Object_10bb762262230c68 = function (arg0) {
    let result
    try {
      result = arg0 instanceof Object
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_Response_f4f3e87e07f3135c = function (arg0) {
    let result
    try {
      result = arg0 instanceof Response
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_Table_e1ef28f29a8ee281 = function (arg0) {
    let result
    try {
      result = arg0 instanceof WebAssembly.Table
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_instanceof_Uint8Array_20c8e73002f7af98 = function (arg0) {
    let result
    try {
      result = arg0 instanceof Uint8Array
    } catch (_) {
      result = false
    }
    const ret = result
    return ret
  }
  imports.wbg.__wbg_isArray_96e0af9891d0945d = function (arg0) {
    const ret = Array.isArray(arg0)
    return ret
  }
  imports.wbg.__wbg_isSafeInteger_d216eda7911dde36 = function (arg0) {
    const ret = Number.isSafeInteger(arg0)
    return ret
  }
  imports.wbg.__wbg_iterator_e5822695327a3c39 = function () {
    const ret = Symbol.iterator
    return ret
  }
  imports.wbg.__wbg_keyPath_2f184befdd449bb5 = function () {
    return handleError(function (arg0) {
      const ret = arg0.keyPath
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_length_69bca3cb64fc8748 = function (arg0) {
    const ret = arg0.length
    return ret
  }
  imports.wbg.__wbg_length_cdd215e10d9dd507 = function (arg0) {
    const ret = arg0.length
    return ret
  }
  imports.wbg.__wbg_length_efec72473f10bc42 = function (arg0) {
    const ret = arg0.length
    return ret
  }
  imports.wbg.__wbg_mark_05056c522bddc362 = function () {
    return handleError(function (arg0, arg1, arg2) {
      arg0.mark(getStringFromWasm0(arg1, arg2))
    }, arguments)
  }
  imports.wbg.__wbg_mark_24a1a597f4f00679 = function () {
    return handleError(function (arg0, arg1, arg2, arg3) {
      arg0.mark(getStringFromWasm0(arg1, arg2), arg3)
    }, arguments)
  }
  imports.wbg.__wbg_measure_0b7379f5cfacac6d = function () {
    return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      arg0.measure(
        getStringFromWasm0(arg1, arg2),
        getStringFromWasm0(arg3, arg4),
        getStringFromWasm0(arg5, arg6)
      )
    }, arguments)
  }
  imports.wbg.__wbg_measure_7728846525e2cced = function () {
    return handleError(function (arg0, arg1, arg2, arg3) {
      arg0.measure(getStringFromWasm0(arg1, arg2), arg3)
    }, arguments)
  }
  imports.wbg.__wbg_message_1ee258909d7264fd = function (arg0) {
    const ret = arg0.message
    return ret
  }
  imports.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function (arg0) {
    const ret = arg0.msCrypto
    return ret
  }
  imports.wbg.__wbg_multiEntry_27455fc52480478f = function (arg0) {
    const ret = arg0.multiEntry
    return ret
  }
  imports.wbg.__wbg_new_1acc0b6eea89d040 = function () {
    const ret = new Object()
    return ret
  }
  imports.wbg.__wbg_new_2531773dac38ebb3 = function () {
    return handleError(function () {
      const ret = new AbortController()
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_new_3c3d849046688a66 = function (arg0, arg1) {
    try {
      var state0 = { a: arg0, b: arg1 }
      var cb0 = (arg0, arg1) => {
        const a = state0.a
        state0.a = 0
        try {
          return wasm_bindgen__convert__closures_____invoke__h2f64b99bf954916b(
            a,
            state0.b,
            arg0,
            arg1
          )
        } finally {
          state0.a = a
        }
      }
      const ret = new Promise(cb0)
      return ret
    } finally {
      state0.a = state0.b = 0
    }
  }
  imports.wbg.__wbg_new_4768a01acc2de787 = function () {
    return handleError(function (arg0, arg1) {
      const ret = new Worker(getStringFromWasm0(arg0, arg1))
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_new_5a31e31cecd06444 = function () {
    return handleError(function (arg0) {
      const ret = new WebAssembly.Module(arg0)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_new_5a79be3ab53b8aa5 = function (arg0) {
    const ret = new Uint8Array(arg0)
    return ret
  }
  imports.wbg.__wbg_new_5ba52b09fc4fece0 = function () {
    return handleError(function (arg0, arg1) {
      const ret = new WebAssembly.Instance(arg0, arg1)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_new_68651c719dcda04e = function () {
    const ret = new Map()
    return ret
  }
  imports.wbg.__wbg_new_76221876a34390ff = function (arg0) {
    const ret = new Int32Array(arg0)
    return ret
  }
  imports.wbg.__wbg_new_8a6f238a6ece86ea = function () {
    const ret = new Error()
    return ret
  }
  imports.wbg.__wbg_new_9edf9838a2def39c = function () {
    return handleError(function () {
      const ret = new Headers()
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_new_a7442b4b19c1a356 = function (arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1))
    return ret
  }
  imports.wbg.__wbg_new_e17d9f43105b08be = function () {
    const ret = new Array()
    return ret
  }
  imports.wbg.__wbg_new_from_slice_92f4d78ca282a2d2 = function (arg0, arg1) {
    const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1))
    return ret
  }
  imports.wbg.__wbg_new_no_args_ee98eee5275000a4 = function (arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1))
    return ret
  }
  imports.wbg.__wbg_new_with_byte_offset_and_length_46e3e6a5e9f9e89b =
    function (arg0, arg1, arg2) {
      const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0)
      return ret
    }
  imports.wbg.__wbg_new_with_length_01aa0dc35aa13543 = function (arg0) {
    const ret = new Uint8Array(arg0 >>> 0)
    return ret
  }
  imports.wbg.__wbg_new_with_options_7df315271b021948 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = new Worker(getStringFromWasm0(arg0, arg1), arg2)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_new_with_str_and_init_0ae7728b6ec367b1 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = new Request(getStringFromWasm0(arg0, arg1), arg2)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_next_020810e0ae8ebcb0 = function () {
    return handleError(function (arg0) {
      const ret = arg0.next()
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_next_2c826fe5dfec6b6a = function (arg0) {
    const ret = arg0.next
    return ret
  }
  imports.wbg.__wbg_node_905d3e251edff8a2 = function (arg0) {
    const ret = arg0.node
    return ret
  }
  imports.wbg.__wbg_now_2c95c9de01293173 = function (arg0) {
    const ret = arg0.now()
    return ret
  }
  imports.wbg.__wbg_now_793306c526e2e3b6 = function () {
    const ret = Date.now()
    return ret
  }
  imports.wbg.__wbg_now_838d8dc44aa3b3f8 = function (arg0) {
    const ret = arg0.now()
    return ret
  }
  imports.wbg.__wbg_objectStoreNames_cfcd75f76eff34e4 = function (arg0) {
    const ret = arg0.objectStoreNames
    return ret
  }
  imports.wbg.__wbg_objectStore_2aab1d8b165c62a6 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = arg0.objectStore(getStringFromWasm0(arg1, arg2))
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_of_3192b3b018b8f660 = function (arg0, arg1, arg2) {
    const ret = Array.of(arg0, arg1, arg2)
    return ret
  }
  imports.wbg.__wbg_open_9d8c51d122a5a6ea = function () {
    return handleError(function (arg0, arg1, arg2, arg3) {
      const ret = arg0.open(getStringFromWasm0(arg1, arg2), arg3 >>> 0)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_open_a36354e60d7255fb = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = arg0.open(getStringFromWasm0(arg1, arg2))
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_performance_121b9855d716e029 = function () {
    const ret = globalThis.performance
    return ret
  }
  imports.wbg.__wbg_performance_7a3ffd0b17f663ad = function (arg0) {
    const ret = arg0.performance
    return ret
  }
  imports.wbg.__wbg_performance_d7303ee66a8cc5eb = function (arg0) {
    const ret = arg0.performance
    return ret
  }
  imports.wbg.__wbg_postMessage_de7175726e2c1bc7 = function () {
    return handleError(function (arg0, arg1) {
      arg0.postMessage(arg1)
    }, arguments)
  }
  imports.wbg.__wbg_postMessage_f34857ca078c8536 = function () {
    return handleError(function (arg0, arg1) {
      arg0.postMessage(arg1)
    }, arguments)
  }
  imports.wbg.__wbg_process_dc0fbacc7c1c06f7 = function (arg0) {
    const ret = arg0.process
    return ret
  }
  imports.wbg.__wbg_prototypesetcall_2a6620b6922694b2 = function (
    arg0,
    arg1,
    arg2
  ) {
    Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2)
  }
  imports.wbg.__wbg_push_df81a39d04db858c = function (arg0, arg1) {
    const ret = arg0.push(arg1)
    return ret
  }
  imports.wbg.__wbg_put_88678dd575c85637 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = arg0.put(arg1, arg2)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_put_fe0fdaf42663469b = function () {
    return handleError(function (arg0, arg1) {
      const ret = arg0.put(arg1)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_queueMicrotask_34d692c25c47d05b = function (arg0) {
    const ret = arg0.queueMicrotask
    return ret
  }
  imports.wbg.__wbg_queueMicrotask_9d76cacb20c84d58 = function (arg0) {
    queueMicrotask(arg0)
  }
  imports.wbg.__wbg_randomFillSync_ac0988aba3254290 = function () {
    return handleError(function (arg0, arg1) {
      arg0.randomFillSync(arg1)
    }, arguments)
  }
  imports.wbg.__wbg_random_babe96ffc73e60a2 = function () {
    const ret = Math.random()
    return ret
  }
  imports.wbg.__wbg_read_48f1593df542f968 = function (arg0) {
    const ret = arg0.read()
    return ret
  }
  imports.wbg.__wbg_releaseLock_5d0b5a68887b891d = function (arg0) {
    arg0.releaseLock()
  }
  imports.wbg.__wbg_require_60cc747a6bc5215a = function () {
    return handleError(function () {
      const ret = module.require
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_resolve_caf97c30b83f7053 = function (arg0) {
    const ret = Promise.resolve(arg0)
    return ret
  }
  imports.wbg.__wbg_respond_0f4dbf5386f5c73e = function () {
    return handleError(function (arg0, arg1) {
      arg0.respond(arg1 >>> 0)
    }, arguments)
  }
  imports.wbg.__wbg_result_25e75004b82b9830 = function () {
    return handleError(function (arg0) {
      const ret = arg0.result
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_setTimeout_8d8796d65cec2386 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = arg0.setTimeout(arg1, arg2)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_set_3f1d0b984ed272ed = function (arg0, arg1, arg2) {
    arg0[arg1] = arg2
  }
  imports.wbg.__wbg_set_3fda3bac07393de4 = function (arg0, arg1, arg2) {
    arg0[arg1] = arg2
  }
  imports.wbg.__wbg_set_907fb406c34a251d = function (arg0, arg1, arg2) {
    const ret = arg0.set(arg1, arg2)
    return ret
  }
  imports.wbg.__wbg_set_9e6516df7b7d0f19 = function (arg0, arg1, arg2) {
    arg0.set(getArrayU8FromWasm0(arg1, arg2))
  }
  imports.wbg.__wbg_set_auto_increment_f44ca0bef52b71d4 = function (
    arg0,
    arg1
  ) {
    arg0.autoIncrement = arg1 !== 0
  }
  imports.wbg.__wbg_set_body_3c365989753d61f4 = function (arg0, arg1) {
    arg0.body = arg1
  }
  imports.wbg.__wbg_set_c213c871859d6500 = function (arg0, arg1, arg2) {
    arg0[arg1 >>> 0] = arg2
  }
  imports.wbg.__wbg_set_c2abbebe8b9ebee1 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = Reflect.set(arg0, arg1, arg2)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_set_cache_2f9deb19b92b81e3 = function (arg0, arg1) {
    arg0.cache = __wbindgen_enum_RequestCache[arg1]
  }
  imports.wbg.__wbg_set_credentials_f621cd2d85c0c228 = function (arg0, arg1) {
    arg0.credentials = __wbindgen_enum_RequestCredentials[arg1]
  }
  imports.wbg.__wbg_set_headers_6926da238cd32ee4 = function (arg0, arg1) {
    arg0.headers = arg1
  }
  imports.wbg.__wbg_set_integrity_62a46fc792832f41 = function (
    arg0,
    arg1,
    arg2
  ) {
    arg0.integrity = getStringFromWasm0(arg1, arg2)
  }
  imports.wbg.__wbg_set_key_path_ff2217f4e8c2caba = function (arg0, arg1) {
    arg0.keyPath = arg1
  }
  imports.wbg.__wbg_set_method_c02d8cbbe204ac2d = function (arg0, arg1, arg2) {
    arg0.method = getStringFromWasm0(arg1, arg2)
  }
  imports.wbg.__wbg_set_mode_52ef73cfa79639cb = function (arg0, arg1) {
    arg0.mode = __wbindgen_enum_RequestMode[arg1]
  }
  imports.wbg.__wbg_set_multi_entry_cc0730b244e411bc = function (arg0, arg1) {
    arg0.multiEntry = arg1 !== 0
  }
  imports.wbg.__wbg_set_name_87cd9db9169f6b39 = function (arg0, arg1, arg2) {
    arg0.name = getStringFromWasm0(arg1, arg2)
  }
  imports.wbg.__wbg_set_onabort_6957ef4f3e5c91eb = function (arg0, arg1) {
    arg0.onabort = arg1
  }
  imports.wbg.__wbg_set_oncomplete_71dbeb19a31158ae = function (arg0, arg1) {
    arg0.oncomplete = arg1
  }
  imports.wbg.__wbg_set_onerror_2a8ad6135dc1ec74 = function (arg0, arg1) {
    arg0.onerror = arg1
  }
  imports.wbg.__wbg_set_onerror_dc82fea584ffccaa = function (arg0, arg1) {
    arg0.onerror = arg1
  }
  imports.wbg.__wbg_set_onmessage_18753458c9c0974c = function (arg0, arg1) {
    arg0.onmessage = arg1
  }
  imports.wbg.__wbg_set_onmessage_d57c4b653d57594f = function (arg0, arg1) {
    arg0.onmessage = arg1
  }
  imports.wbg.__wbg_set_onsuccess_f367d002b462109e = function (arg0, arg1) {
    arg0.onsuccess = arg1
  }
  imports.wbg.__wbg_set_onupgradeneeded_0a519a73284a1418 = function (
    arg0,
    arg1
  ) {
    arg0.onupgradeneeded = arg1
  }
  imports.wbg.__wbg_set_onversionchange_c3ea916c1b523b14 = function (
    arg0,
    arg1
  ) {
    arg0.onversionchange = arg1
  }
  imports.wbg.__wbg_set_redirect_df0285496ec45ff8 = function (arg0, arg1) {
    arg0.redirect = __wbindgen_enum_RequestRedirect[arg1]
  }
  imports.wbg.__wbg_set_referrer_ec9cf8a8a315d50c = function (
    arg0,
    arg1,
    arg2
  ) {
    arg0.referrer = getStringFromWasm0(arg1, arg2)
  }
  imports.wbg.__wbg_set_referrer_policy_99c1f299b4e37446 = function (
    arg0,
    arg1
  ) {
    arg0.referrerPolicy = __wbindgen_enum_ReferrerPolicy[arg1]
  }
  imports.wbg.__wbg_set_signal_dda2cf7ccb6bee0f = function (arg0, arg1) {
    arg0.signal = arg1
  }
  imports.wbg.__wbg_set_type_d9bafab6e52a50e4 = function (arg0, arg1) {
    arg0.type = __wbindgen_enum_WorkerType[arg1]
  }
  imports.wbg.__wbg_set_unique_ddf37f59b6c8fc8c = function (arg0, arg1) {
    arg0.unique = arg1 !== 0
  }
  imports.wbg.__wbg_sign_c4f17f19f4cbdd1d = function () {
    return handleError(function (arg0, arg1, arg2, arg3) {
      var v0 = getArrayU8FromWasm0(arg2, arg3).slice()
      wasm.__wbindgen_free(arg2, arg3 * 1, 1)
      const ret = arg0.sign(arg1, v0)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_signal_4db5aa055bf9eb9a = function (arg0) {
    const ret = arg0.signal
    return ret
  }
  imports.wbg.__wbg_stack_0ed75d68575b0f3c = function (arg0, arg1) {
    const ret = arg1.stack
    const ptr1 = passStringToWasm0(
      ret,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.__wbg_static_accessor_GLOBAL_89e1d9ac6a1b250e = function () {
    const ret = typeof global === 'undefined' ? null : global
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_static_accessor_GLOBAL_THIS_8b530f326a9e48ac = function () {
    const ret = typeof globalThis === 'undefined' ? null : globalThis
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_static_accessor_IMPORT_META_URL_13171993f95ebebe =
    function (arg0) {
      const ret = '/croissant/linera_web.js'
      const ptr1 = passStringToWasm0(
        ret,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc
      )
      const len1 = WASM_VECTOR_LEN
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
    }
  imports.wbg.__wbg_static_accessor_SELF_6fdf4b64710cc91b = function () {
    const ret = typeof self === 'undefined' ? null : self
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_static_accessor_WINDOW_b45bfc5a37f6cfa2 = function () {
    const ret = typeof window === 'undefined' ? null : window
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_status_de7eed5a7a5bfd5d = function (arg0) {
    const ret = arg0.status
    return ret
  }
  imports.wbg.__wbg_stringify_b5fb28f6465d9c3e = function () {
    return handleError(function (arg0) {
      const ret = JSON.stringify(arg0)
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_subarray_480600f3d6a9f26c = function (arg0, arg1, arg2) {
    const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0)
    return ret
  }
  imports.wbg.__wbg_target_1447f5d3a6fa6fe0 = function (arg0) {
    const ret = arg0.target
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_then_4f46f6544e6b4a28 = function (arg0, arg1) {
    const ret = arg0.then(arg1)
    return ret
  }
  imports.wbg.__wbg_then_70d05cf780a18d77 = function (arg0, arg1, arg2) {
    const ret = arg0.then(arg1, arg2)
    return ret
  }
  imports.wbg.__wbg_timeOrigin_5ff7de9d729d4835 = function (arg0) {
    const ret = arg0.timeOrigin
    return ret
  }
  imports.wbg.__wbg_timeOrigin_9f29a08704a944d0 = function (arg0) {
    const ret = arg0.timeOrigin
    return ret
  }
  imports.wbg.__wbg_toString_7da7c8dbec78fcb8 = function (arg0) {
    const ret = arg0.toString()
    return ret
  }
  imports.wbg.__wbg_toString_b4979eaf8b235b54 = function (arg0, arg1, arg2) {
    const ret = arg1.toString(arg2)
    const ptr1 = passStringToWasm0(
      ret,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.__wbg_transaction_9fb8349a0a81725c = function (arg0) {
    const ret = arg0.transaction
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_transaction_cd940bd89781f616 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = arg0.transaction(
        arg1,
        __wbindgen_enum_IdbTransactionMode[arg2]
      )
      return ret
    }, arguments)
  }
  imports.wbg.__wbg_trap_new = function (arg0) {
    const ret = Trap.__wrap(arg0)
    return ret
  }
  imports.wbg.__wbg_unique_7f25ceceee9051db = function (arg0) {
    const ret = arg0.unique
    return ret
  }
  imports.wbg.__wbg_url_b36d2a5008eb056f = function (arg0, arg1) {
    const ret = arg1.url
    const ptr1 = passStringToWasm0(
      ret,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.__wbg_value_692627309814bb8c = function (arg0) {
    const ret = arg0.value
    return ret
  }
  imports.wbg.__wbg_value_e323024c868b5146 = function (arg0) {
    const ret = arg0.value
    return ret
  }
  imports.wbg.__wbg_versions_c01dfd4722a88165 = function (arg0) {
    const ret = arg0.versions
    return ret
  }
  imports.wbg.__wbg_view_f6c15ac9fed63bbd = function (arg0) {
    const ret = arg0.view
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret)
  }
  imports.wbg.__wbg_waitAsync_2c4b633ebb554615 = function () {
    const ret = Atomics.waitAsync
    return ret
  }
  imports.wbg.__wbg_waitAsync_95332bf1b4fe4c52 = function (arg0, arg1, arg2) {
    const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2)
    return ret
  }
  imports.wbg.__wbg_wallet_new = function (arg0) {
    const ret = Wallet.__wrap(arg0)
    return ret
  }
  imports.wbg.__wbg_warn_1d74dddbe2fd1dbb = function (arg0) {
    console.warn(arg0)
  }
  imports.wbg.__wbg_warn_8f5b5437666d0885 = function (arg0, arg1, arg2, arg3) {
    console.warn(arg0, arg1, arg2, arg3)
  }
  imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function (arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1)
    return ret
  }
  imports.wbg.__wbindgen_cast_38f82d1f49d5010f = function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 778, function: Function { arguments: [NamedExternref("IDBVersionChangeEvent")], shim_idx: 781, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(
      arg0,
      arg1,
      wasm.wasm_bindgen__closure__destroy__h5018753241d3f6c1,
      wasm_bindgen__convert__closures_____invoke__h95a07b32c214fca9
    )
    return ret
  }
  imports.wbg.__wbindgen_cast_3a1d8fc1e755e5f8 = function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 2447, function: Function { arguments: [NamedExternref("Event")], shim_idx: 2448, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(
      arg0,
      arg1,
      wasm.wasm_bindgen__closure__destroy__h4d400c7f7eba9116,
      wasm_bindgen__convert__closures_____invoke__ha964f0d767020168
    )
    return ret
  }
  imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function (arg0) {
    // Cast intrinsic for `U64 -> Externref`.
    const ret = BigInt.asUintN(64, arg0)
    return ret
  }
  imports.wbg.__wbindgen_cast_72fe3238e30b9817 = function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 778, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 779, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(
      arg0,
      arg1,
      wasm.wasm_bindgen__closure__destroy__h5018753241d3f6c1,
      wasm_bindgen__convert__closures_____invoke__h1ce2b27b008b48cb
    )
    return ret
  }
  imports.wbg.__wbindgen_cast_9ae0607507abb057 = function (arg0) {
    // Cast intrinsic for `I64 -> Externref`.
    const ret = arg0
    return ret
  }
  imports.wbg.__wbindgen_cast_b608b4c7a39a243c = function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 3108, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 3109, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(
      arg0,
      arg1,
      wasm.wasm_bindgen__closure__destroy__h61ac152e8c219c64,
      wasm_bindgen__convert__closures_____invoke__h0a68803ec1253ff3
    )
    return ret
  }
  imports.wbg.__wbindgen_cast_cb9088102bce6b30 = function (arg0, arg1) {
    // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
    const ret = getArrayU8FromWasm0(arg0, arg1)
    return ret
  }
  imports.wbg.__wbindgen_cast_cc2ffe7a88863288 = function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 3108, function: Function { arguments: [Externref], shim_idx: 3109, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(
      arg0,
      arg1,
      wasm.wasm_bindgen__closure__destroy__h61ac152e8c219c64,
      wasm_bindgen__convert__closures_____invoke__h0a68803ec1253ff3
    )
    return ret
  }
  imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function (arg0) {
    // Cast intrinsic for `F64 -> Externref`.
    const ret = arg0
    return ret
  }
  imports.wbg.__wbindgen_cast_dbdaba0b42e70a29 = function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 2958, function: Function { arguments: [Ref(NamedExternref("MessageEvent"))], shim_idx: 2959, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(
      arg0,
      arg1,
      wasm.wasm_bindgen__closure__destroy__hfa35261824995fa6,
      wasm_bindgen__convert__closures________invoke__h4c206a50ca792112
    )
    return ret
  }
  imports.wbg.__wbindgen_cast_e400c1b3a6109e35 = function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 3097, function: Function { arguments: [], shim_idx: 3098, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(
      arg0,
      arg1,
      wasm.wasm_bindgen__closure__destroy__h3cd335803398cd16,
      wasm_bindgen__convert__closures_____invoke__h9b1c12fe6996ed5f
    )
    return ret
  }
  imports.wbg.__wbindgen_cast_e7b45dd881f38ce3 = function (arg0, arg1) {
    // Cast intrinsic for `U128 -> Externref`.
    const ret =
      BigInt.asUintN(64, arg0) | (BigInt.asUintN(64, arg1) << BigInt(64))
    return ret
  }
  imports.wbg.__wbindgen_init_externref_table = function () {
    const table = wasm.__wbindgen_externrefs
    const offset = table.grow(4)
    table.set(0, undefined)
    table.set(offset + 0, undefined)
    table.set(offset + 1, null)
    table.set(offset + 2, true)
    table.set(offset + 3, false)
  }
  imports.wbg.__wbindgen_link_87c6db35c91e89c3 = function (arg0) {
    const ret =
      '/croissant/snippets/wasm_thread-8ee53d0673203880/src/wasm32/js/web_worker_module.js'
    const ptr1 = passStringToWasm0(
      ret,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.__wbindgen_link_b9f45ffe079ef2c1 = function (arg0) {
    const ret =
      '/croissant/snippets/wasm-bindgen-futures-49baab82d127f137/src/task/worker.js'

    const ptr1 = passStringToWasm0(
      ret,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    )
    const len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.memory =
    memory ||
    new WebAssembly.Memory({ initial: 28, maximum: 16384, shared: true })

  return imports
}

function __wbg_finalize_init(instance, module, thread_stack_size) {
  wasm = instance.exports
  __wbg_init.__wbindgen_wasm_module = module
  cachedDataViewMemory0 = null
  cachedUint8ArrayMemory0 = null

  if (
    typeof thread_stack_size !== 'undefined' &&
    (typeof thread_stack_size !== 'number' ||
      thread_stack_size === 0 ||
      thread_stack_size % 65536 !== 0)
  ) {
    throw 'invalid stack size'
  }
  wasm.__wbindgen_start(thread_stack_size)
  return wasm
}

function initSync(module, memory) {
  if (wasm !== undefined) return wasm

  let thread_stack_size
  if (typeof module !== 'undefined') {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ;({ module, memory, thread_stack_size } = module)
    } else {
      console.warn(
        'using deprecated parameters for `initSync()`; pass a single object instead'
      )
    }
  }

  const imports = __wbg_get_imports(memory)

  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module)
  }

  const instance = new WebAssembly.Instance(module, imports)

  return __wbg_finalize_init(instance, module, thread_stack_size)
}

async function __wbg_init(module_or_path, memory) {
  if (wasm !== undefined) return wasm

  let thread_stack_size
  if (typeof module_or_path !== 'undefined') {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ;({ module_or_path, memory, thread_stack_size } = module_or_path)
    } else {
      console.warn(
        'using deprecated parameters for the initialization function; pass a single object instead'
      )
    }
  }

  if (typeof module_or_path === 'undefined') {
    module_or_path = 'croissant/linera_web_bg.wasm'
  }
  const imports = __wbg_get_imports(memory)

  if (
    typeof module_or_path === 'string' ||
    (typeof Request === 'function' && module_or_path instanceof Request) ||
    (typeof URL === 'function' && module_or_path instanceof URL)
  ) {
    module_or_path = fetch(module_or_path)
  }

  const { instance, module } = await __wbg_load(await module_or_path, imports)

  return __wbg_finalize_init(instance, module, thread_stack_size)
}

export { initSync }
export default __wbg_init
