export interface WalletMessage {
  type: "WALLET_CONNECTED" | "WALLET_DISCONNECTED" | "WALLET_ERROR";
  data?: {
    address: string;
    error?: string;
  };
}
