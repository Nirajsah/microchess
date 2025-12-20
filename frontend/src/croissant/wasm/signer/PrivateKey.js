import { Wallet, ethers } from 'ethers';
/**
 * A signer implementation that holds the private key in memory.
 *
 * ⚠️ WARNING: This class is intended **only for testing or development** purposes.
 * It stores the private key directly in memory, which makes it unsuitable for
 * production environments due to security risks.
 *
 * The `PrivateKey` signer uses an in-memory `ethers.Wallet` to sign messages following
 * the EIP-191 scheme. It verifies that the provided owner matches the wallet
 * address before signing.
 *
 * Supports key creation from both a raw private key and a mnemonic phrase.
 */
export default class PrivateKey {
    wallet;
    constructor(privateKeyHex) {
        this.wallet = new Wallet(privateKeyHex);
    }
    /**
     * Generate a new random mnemonic phrase.
     * User should save this securely before creating the signer.
     */
    static mnemonic() {
        const wallet = ethers.Wallet.createRandom();
        if (!wallet.mnemonic?.phrase) {
            throw new Error('Failed to generate mnemonic');
        }
        return wallet.mnemonic.phrase;
    }
    /**
     * Create a signer with a randomly generated wallet.
     */
    static createRandom() {
        const mnemonic = PrivateKey.mnemonic();
        return PrivateKey.fromMnemonic(mnemonic);
    }
    /**
     * Create a signer from an existing mnemonic phrase.
     */
    static fromMnemonic(mnemonic) {
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        return new PrivateKey(wallet.privateKey);
    }
    address() {
        return this.wallet.address;
    }
    async sign(owner, value) {
        if (typeof owner !== 'string' ||
            !ethers.isAddress(owner) ||
            this.wallet.address.toLowerCase() !== owner.toLowerCase()) {
            throw new Error('Invalid owner address');
        }
        // ethers expects a string or Bytes for EIP-191
        const signature = await this.wallet.signMessage(value);
        return signature;
    }
    async getPublicKey(owner) {
        if (typeof owner !== 'string' ||
            !ethers.isAddress(owner) ||
            this.wallet.address.toLowerCase() !== owner.toLowerCase()) {
            throw new Error('Invalid owner address');
        }
        return this.wallet.signingKey.publicKey;
    }
    async containsKey(owner) {
        // The owner for Linera's EIP-191 wallet is the wallet address.
        if (typeof owner !== 'string' || !ethers.isAddress(owner)) {
            throw new Error('Invalid owner address');
        }
        if (this.wallet.address.toLowerCase() !== owner.toLowerCase()) {
            return false; // The wallet does not contain the key for this owner
        }
        return true;
    }
}
//# sourceMappingURL=PrivateKey.js.map