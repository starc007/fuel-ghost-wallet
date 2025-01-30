/* eslint-disable @typescript-eslint/no-explicit-any */
import { Wallet, WalletUnlocked, hashMessage } from "fuels";

interface Connection {
  dappId: string;
  address: string;
  lastUsed: Date;
}

export class WalletManager {
  private static instance: WalletManager;
  private mainWallet: WalletUnlocked | null = null;
  private ghostWallets: Map<string, WalletUnlocked> = new Map();
  private connections: Connection[] = [];
  private eventTarget = new EventTarget();

  private constructor() {}

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

    console.log("Deriving ghost wallet for dApp:", dappId);
    console.log("Using main wallet:", {
      address: this.mainWallet.address.toString(),
      privateKey: this.mainWallet.privateKey,
    });

    const seed = await hashMessage(this.mainWallet.privateKey + dappId);
    console.log("Generated seed:", seed);

    const ghostWallet = Wallet.fromPrivateKey(seed);
    console.log("Created ghost wallet:", {
      dappId,
      address: ghostWallet.address.toString(),
      privateKey: ghostWallet.privateKey,
    });

    this.ghostWallets.set(dappId, ghostWallet);
    return ghostWallet.address.toString();
  }

  getGhostWallet(dappId: string): WalletUnlocked | undefined {
    return this.ghostWallets.get(dappId);
  }

  async signTransaction(dappId: string, transaction: any) {
    const wallet = this.ghostWallets.get(dappId);
    if (!wallet) {
      throw new Error("No ghost wallet found for this dApp");
    }
    return await wallet.signTransaction(transaction);
  }

  getMainWalletAddress(): string | null {
    return this.mainWallet?.address.toString() || null;
  }

  getAllGhostAddresses(): Array<{ dappId: string; address: string }> {
    return Array.from(this.ghostWallets.entries()).map(([dappId, wallet]) => ({
      dappId,
      address: wallet.address.toString(),
    }));
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
  }

  addConnection(connection: Connection) {
    this.connections.push(connection);
    this.saveConnections();
  }

  removeConnection(dappId: string) {
    this.connections = this.connections.filter((c) => c.dappId !== dappId);
    this.saveConnections();

    // Notify dapp about disconnection
    if (window.opener) {
      const connection = this.connections.find((c) => c.dappId === dappId);
      if (connection) {
        window.opener.postMessage(
          {
            type: "WALLET_DISCONNECTED",
            data: { address: connection.address },
          },
          "*"
        );
      }
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
  }
}
