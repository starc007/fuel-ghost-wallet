export interface DappConnection {
  id: string;
  origin: string;
  connected: boolean;
}

export interface DappMessage {
  type: "WALLET_CONNECTED" | "WALLET_DISCONNECTED" | "WALLET_ERROR";
  data?: {
    address: string;
    error?: string;
  };
}
