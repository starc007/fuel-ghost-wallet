import { useState } from "react";
import { PassKeyManager } from "../lib/PasskeyManager";
import DappConnectionsList from "./DappConnectionsList";

const WalletComponent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dappAddress, setDappAddress] = useState("");
  const [mainWalletAddress, setMainWalletAddress] = useState("");
  const [connections, setConnections] = useState<
    Array<{
      dappId: string;
      address: string;
      lastUsed: Date;
    }>
  >([]);

  const passKeyManager = PassKeyManager.getInstance();

  const handleCreatePassKey = async () => {
    try {
      await passKeyManager.createPassKey();
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to create PassKey:", error);
    }
  };

  const handleAuthenticate = async () => {
    const { success, address } = await passKeyManager.authenticatePassKey();
    if (success && address) {
      setMainWalletAddress(address);
      setIsAuthenticated(true);
    }
  };

  const handleDisconnect = (dappId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.dappId !== dappId));
    if (
      connections.find((conn) => conn.dappId === dappId)?.address ===
      dappAddress
    ) {
      setDappAddress("");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-gray-900 rounded-xl shadow-lg border border-gray-800">
      {!isAuthenticated ? (
        <div className="space-y-4">
          <button
            onClick={handleCreatePassKey}
            className="w-full cursor-pointer px-4 py-2 bg-[#00E182] text-black font-medium rounded hover:bg-[#00c974] transition-colors"
          >
            Create New Wallet with PassKey
          </button>
          <button
            onClick={handleAuthenticate}
            className="w-full cursor-pointer px-4 py-2 border border-[#00E182] text-[#00E182] rounded hover:bg-[#00E182]/10 transition-colors"
          >
            Login with PassKey
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Wallet Connected</h2>
          <p className="text-sm text-gray-400 whitespace-pre">
            Main Wallet Address:
          </p>
          <p className="text-sm break-all text-white">{mainWalletAddress}</p>
          <div className="p-4 bg-gray-800 rounded">
            <p className="text-sm break-all text-gray-300">
              Current dApp Address: {dappAddress || "No dApp connected"}
            </p>
          </div>

          <DappConnectionsList
            connections={connections}
            onDisconnect={handleDisconnect}
          />
        </div>
      )}
    </div>
  );
};

export default WalletComponent;
