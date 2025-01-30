import { useState, useEffect } from "react";
import type { WalletMessage } from "./types";

interface WalletState {
  connected: boolean;
  address: string | null;
  isConnecting: boolean;
}

const App = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    address: null,
    isConnecting: false,
  });

  useEffect(() => {
    // Setup message listener
    const handleWalletMessage = (event: MessageEvent<WalletMessage>) => {
      if (event.origin !== "http://localhost:5173") return;

      const { type, data } = event.data;
      console.log("📩 Received wallet message:", { type, data });

      switch (type) {
        case "WALLET_CONNECTED":
          if (data?.address) {
            console.log("🔗 Wallet connected:", data.address);
            setWalletState({
              connected: true,
              address: data.address,
              isConnecting: false,
            });
          }
          break;

        case "WALLET_DISCONNECTED":
          console.log("Wallet disconnected");
          setWalletState({
            connected: false,
            address: null,
            isConnecting: false,
          });
          break;

        case "WALLET_ERROR":
          console.log("Wallet error:", data?.error);
          setWalletState((prev) => ({
            ...prev,
            isConnecting: false,
          }));
          break;
      }
    };

    window.addEventListener("message", handleWalletMessage);
    return () => window.removeEventListener("message", handleWalletMessage);
  }, []);

  const connectWallet = async () => {
    try {
      console.log("Initiating wallet connection...");
      setWalletState((prev) => ({
        ...prev,
        isConnecting: true,
      }));

      const walletWindow = window.open(
        `http://localhost:5173?dappId=test-dapp-1&origin=${encodeURIComponent(
          window.location.origin
        )}`,
        "Fuel Ghost Wallet",
        "width=400,height=600"
      );

      if (!walletWindow) {
        throw new Error("Popup blocked. Please allow popups and try again.");
      }
      console.log("🪟 Wallet window opened");
    } catch (error) {
      console.log("❌ Connection error:", error);
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
      }));
    }
  };

  return (
    <div className="min-h-screen text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Dapp</h1>

        <div className="bg-[#1A1A1A] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>

          <div
            className={`p-3 rounded-xl mb-4 ${
              walletState.connected
                ? "bg-[#15FF7E]/10 text-[#15FF7E]"
                : "bg-[#FF1515]/10 text-[#FF1515]"
            }`}
          >
            Status: {walletState.connected ? "Connected" : "Disconnected"}
          </div>

          {walletState.address && (
            <div className="bg-[#2A2A2A] p-3 rounded-xl mb-4 text-sm break-all">
              {walletState.address}
            </div>
          )}

          <button
            onClick={connectWallet}
            disabled={walletState.connected || walletState.isConnecting}
            className={`w-full cursor-pointer px-4 py-2 rounded-xl font-medium transition-colors text-black
              ${
                walletState.connected || walletState.isConnecting
                  ? "bg-[#2A2A2A] cursor-not-allowed"
                  : "bg-[#00E182] hover:bg-[#00E182]/80"
              }`}
          >
            {walletState.isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
