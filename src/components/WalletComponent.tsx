import { useState, useEffect } from "react";
import { PassKeyManager } from "../lib/PasskeyManager";
import DappConnectionsList from "./DappConnectionsList";
import { WalletManager } from "../lib/WalletManager";

interface GhostWalletInfo {
  index: number;
  address: string;
  privateKey: string;
}

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
  const [ghostWallets, setGhostWallets] = useState<GhostWalletInfo[]>([]);

  const passKeyManager = PassKeyManager.getInstance();
  const walletManager = WalletManager.getInstance();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial load
    const loadConnections = () => {
      const savedConnections = walletManager.getConnections();
      setConnections(savedConnections);
    };

    loadConnections();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "wallet_connections") {
        console.log("Connections updated:", e.newValue);
        loadConnections();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isAuthenticated]);

  const loadGhostWallets = async () => {
    if (!isAuthenticated) return;

    walletManager.loadGhostWallets();
    const storedWallets = walletManager.getAllGhostAddresses();

    // Derive private keys for each wallet
    const walletsWithKeys = await Promise.all(
      storedWallets.map(async ({ index, address }) => {
        const wallet = await walletManager.deriveGhostWalletByIndex(index);
        return {
          index,
          address,
          privateKey: wallet.privateKey,
        };
      })
    );

    setGhostWallets(walletsWithKeys);
  };

  useEffect(() => {
    loadGhostWallets();
  }, [isAuthenticated, connections]);

  const handleCreatePassKey = async () => {
    try {
      const { success, address } = await passKeyManager.createPassKey();
      if (success && address) {
        setMainWalletAddress(address);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to create PassKey:", error);
    }
  };

  const handleAuthenticate = async () => {
    const { success, address } = await passKeyManager.authenticatePassKey();
    if (success && address) {
      setMainWalletAddress(address);
      setIsAuthenticated(true);
      // Load existing connections after authentication
      const savedConnections = walletManager.getConnections();
      console.log("Loading saved connections:", savedConnections);
      setConnections(savedConnections);
    }
  };

  const handleDisconnect = (dappId: string) => {
    walletManager.removeConnection(dappId);
    setConnections(walletManager.getConnections());
    if (
      connections.find((conn) => conn.dappId === dappId)?.address ===
      dappAddress
    ) {
      setDappAddress("");
    }
  };

  console.log("ghostWallets", ghostWallets);
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

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Ghost Wallets</h3>
              <button
                onClick={loadGhostWallets}
                className="px-3 cursor-pointer py-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {ghostWallets.map((wallet) => (
                <div key={wallet.index} className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Index: {wallet.index}</p>
                  <p className="text-sm text-white break-all">
                    Address: {wallet.address}
                  </p>
                  <p className="text-sm text-gray-400 break-all">
                    Private Key: {wallet.privateKey}
                  </p>
                </div>
              ))}
            </div>
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
