/* eslint-disable @typescript-eslint/no-explicit-any */
import { Wallet, WalletUnlocked, hashMessage } from "fuels";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes } from "ethereum-cryptography/utils";

interface Connection {
  dappId: string;
  ghostIndex: number;
  address: string;
  lastUsed: Date;
}

interface StoredGhostWallet {
  index: number;
  address: string;
}

export class WalletManager {
  private static instance: WalletManager;
  private mainWallet: WalletUnlocked | null = null;
  private ghostWallets: Map<number, string> = new Map();
  private connections: Connection[] = [];
  private nextGhostIndex: number = 0;

  private constructor() {
    this.loadState();
    this.loadConnections();
    this.loadGhostWallets();
  }

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  async deriveMainWallet(
    passKeyCredential: ArrayBuffer | string
  ): Promise<string> {
    console.log("Deriving main wallet from PassKey...");
    const credentialBytes =
      typeof passKeyCredential === "string"
        ? new TextEncoder().encode(passKeyCredential)
        : new Uint8Array(passKeyCredential);

    const hexString = Array.from(credentialBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const seed = await hashMessage(hexString);
    this.mainWallet = Wallet.fromPrivateKey(seed);

    console.log("Main wallet derived:", {
      address: this.mainWallet.address.toString(),
    });
    return this.mainWallet.address.toString();
  }

  async createMainWallet(): Promise<string> {
    console.log("Generating new main wallet...");
    this.mainWallet = Wallet.generate();
    const address = this.mainWallet.address.toString();

    // Store wallet info
    const walletInfo = {
      address,
      privateKey: this.mainWallet.privateKey,
    };
    localStorage.setItem("mainWallet", JSON.stringify(walletInfo));

    console.log("Main wallet generated:", walletInfo);
    return address;
  }

  async loadMainWallet(): Promise<string | null> {
    const storedWallet = localStorage.getItem("mainWallet");
    if (!storedWallet) {
      console.log("No stored wallet found");
      return null;
    }

    try {
      const walletInfo = JSON.parse(storedWallet);
      console.log("Loading stored wallet:", walletInfo.address);
      this.mainWallet = Wallet.fromPrivateKey(walletInfo.privateKey);
      return walletInfo.address;
    } catch (error) {
      console.error("Failed to load wallet:", error);
      return null;
    }
  }

  async deriveGhostWallet(dappId: string): Promise<string> {
    if (!this.mainWallet) {
      throw new Error("Main wallet not initialized");
    }

    // Use the next available index
    const ghostIndex = this.nextGhostIndex++;

    // Derive ghost wallet using index
    const ghostWallet = await this.deriveGhostWalletByIndex(ghostIndex);

    // Store wallet and create connection
    this.ghostWallets.set(ghostIndex, ghostWallet.address.toString());
    this.addConnection({
      dappId,
      ghostIndex,
      address: ghostWallet.address.toString(),
      lastUsed: new Date(),
    });

    return ghostWallet.address.toString();
  }

  async deriveGhostWalletByIndex(index: number): Promise<WalletUnlocked> {
    if (!this.mainWallet) {
      throw new Error("Main wallet not initialized");
    }

    // Create deterministic path using index
    const indexBytes = new Uint8Array(32);
    new DataView(indexBytes.buffer).setUint32(28, index, true); // Last 4 bytes for index

    // Convert indexBytes to hex string
    const indexHex = Array.from(indexBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Derive ghost wallet private key
    const derivationMaterial = this.mainWallet.privateKey + indexHex;
    const ghostPrivateKey = keccak256(utf8ToBytes(derivationMaterial));
    const ghostPrivateKeyHex = Array.from(ghostPrivateKey)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return Wallet.fromPrivateKey(ghostPrivateKeyHex);
  }

  // Method to recover any ghost wallet by index
  async recoverGhostWallet(
    mainPrivateKey: string,
    index: number
  ): Promise<WalletUnlocked> {
    const mainWallet = Wallet.fromPrivateKey(mainPrivateKey);
    const indexBytes = new Uint8Array(32);
    new DataView(indexBytes.buffer).setUint32(28, index, true);

    const indexHex = Array.from(indexBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const derivationMaterial = mainWallet.privateKey + indexHex;
    const ghostPrivateKey = keccak256(utf8ToBytes(derivationMaterial));
    const ghostPrivateKeyHex = Array.from(ghostPrivateKey)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return Wallet.fromPrivateKey(ghostPrivateKeyHex);
  }

  private loadState() {
    const state = localStorage.getItem("wallet_state");
    if (state) {
      const { nextGhostIndex } = JSON.parse(state);
      this.nextGhostIndex = nextGhostIndex;
    }
  }

  getGhostWallet(dappId: string): string | undefined {
    const connection = this.connections.find((c) => c.dappId === dappId);
    return connection
      ? this.ghostWallets.get(connection.ghostIndex)
      : undefined;
  }

  getMainWalletAddress(): string | null {
    return this.mainWallet?.address.toString() || null;
  }

  getAllGhostAddresses(): Array<{ index: number; address: string }> {
    const ghostWallets = Array.from(this.ghostWallets.entries()).map(
      ([index, wallet]) => ({
        index,
        address: wallet,
      })
    );
    return ghostWallets;
  }

  private loadConnections() {
    const stored = localStorage.getItem("wallet_connections");
    if (stored) {
      this.connections = JSON.parse(stored);
    }
  }

  private saveConnections() {
    localStorage.setItem(
      "wallet_connections",
      JSON.stringify(this.connections)
    );
    // Dispatch storage event for real-time updates
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "wallet_connections",
        newValue: JSON.stringify(this.connections),
      })
    );
  }

  private saveGhostWallets() {
    const storedWallets: StoredGhostWallet[] = Array.from(
      this.ghostWallets.entries()
    ).map(([index, wallet]) => ({
      index,
      address: wallet,
    }));

    localStorage.setItem("ghost_wallets", JSON.stringify(storedWallets));
  }

  private loadGhostWallets() {
    const stored = localStorage.getItem("ghost_wallets");
    if (stored) {
      const wallets: StoredGhostWallet[] = JSON.parse(stored);

      wallets.forEach(({ index, address }) => {
        this.ghostWallets.set(index, address);
      });
    }
  }

  addConnection(connection: Connection) {
    this.connections.push(connection);
    this.saveConnections();
    this.saveGhostWallets();
  }

  removeConnection(dappId: string) {
    const connection = this.connections.find((c) => c.dappId === dappId);
    this.connections = this.connections.filter((c) => c.dappId !== dappId);
    this.saveConnections();
    this.saveGhostWallets();

    // Notify dapp about disconnection
    if (connection) {
      const message = {
        type: "WALLET_DISCONNECTED",
        data: { address: connection.address },
      };

      // Try window.opener
      if (window.opener) {
        window.opener.postMessage(message, "*");
      }

      // Dispatch custom event for all windows
      const disconnectEvent = new CustomEvent("wallet_disconnect", {
        detail: message,
      });
      window.dispatchEvent(disconnectEvent);
    }
  }

  getConnections(): Connection[] {
    this.loadConnections(); // Load latest connections before returning
    return [...this.connections];
  }

  clear() {
    this.mainWallet = null;
    this.ghostWallets.clear();
    this.connections = [];
    this.saveConnections();
    this.saveGhostWallets();
    localStorage.removeItem("ghost_wallets");
  }
}
