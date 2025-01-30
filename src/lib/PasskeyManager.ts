/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { WalletManager } from "./WalletManager";

const API_URL = "http://localhost:6969";

export class PassKeyManager {
  private static instance: PassKeyManager;
  private walletManager: WalletManager;

  private constructor() {
    this.walletManager = WalletManager.getInstance();
  }

  static getInstance(): PassKeyManager {
    if (!PassKeyManager.instance) {
      PassKeyManager.instance = new PassKeyManager();
    }
    return PassKeyManager.instance;
  }

  async createPassKey(): Promise<boolean> {
    try {
      console.log("Starting PassKey creation...");
      const registrationOptions = await this.getRegistrationOptions();
      console.log("Registration options:", registrationOptions);

      const credential = await startRegistration(registrationOptions);
      console.log("Created credential:", credential);

      const verification = await this.verifyRegistration(credential);
      console.log("Verification result:", verification);

      if (verification.verified) {
        console.log("Deriving main wallet from PassKey...");
        const address = await this.walletManager.deriveMainWallet(
          credential.rawId
        );
        console.log("Main wallet derived with address:", address);
        return true;
      }
      return false;
    } catch (error) {
      console.error("PassKey creation failed:", error);
      return false;
    }
  }

  async authenticatePassKey(): Promise<{
    success: boolean;
    address: string | null;
  }> {
    try {
      const authOptions = await this.getAuthenticationOptions();
      const credential = await startAuthentication(authOptions);
      const verification = await this.verifyAuthentication(credential);

      if (verification.verified) {
        console.log("Re-deriving main wallet from PassKey...");
        const address = await this.walletManager.deriveMainWallet(
          credential.rawId
        );
        console.log("Main wallet derived with address:", address);
        return {
          success: true,
          address,
        };
      }
      return {
        success: false,
        address: null,
      };
    } catch (error) {
      console.error("PassKey authentication failed:", error);
      return {
        success: false,
        address: null,
      };
    }
  }

  async deriveAddressForDapp(dappId: string): Promise<string> {
    return await this.walletManager.deriveGhostWallet(dappId);
  }

  // Mock backend interaction methods
  private async getRegistrationOptions() {
    const response = await fetch(`${API_URL}/register/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return response.json();
  }

  private async verifyRegistration(credential: any) {
    const response = await fetch(`${API_URL}/register/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
    });
    return response.json();
  }

  private async getAuthenticationOptions() {
    const response = await fetch(`${API_URL}/authenticate/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return response.json();
  }

  private async verifyAuthentication(credential: any) {
    const response = await fetch(`${API_URL}/authenticate/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
    });
    return response.json();
  }
}
