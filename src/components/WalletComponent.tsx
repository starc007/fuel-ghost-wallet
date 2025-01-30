import { useState } from "react";
import { PassKeyManager } from "../lib/PasskeyManager";
import DappConnectionsList from "./DappConnectionsList";

const WalletComponent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dappAddress, setDappAddress] = useState("");
  const [connections, setConnections] = useState<
    Array<{
      dappId: string;
      address: string;
      lastUsed: Date;
    }>
  >([]);
  const [testGhostWallet, setTestGhostWallet] = useState<string>("");
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
    const success = await passKeyManager.authenticatePassKey();
    setIsAuthenticated(success);
  };

  const handleDappConnect = async (dappId: string) => {
    try {
      const address = await passKeyManager.deriveAddressForDapp(dappId);
      setDappAddress(address);
      setConnections((prev) => [
        ...prev,
        {
          dappId,
          address,
          lastUsed: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to connect to dApp:", error);
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

  const handleTestGhostWallet = async () => {
    try {
      console.log("Generating test ghost wallet...");
      const testDappId = `test-dapp-${Date.now()}`;
      console.log("Using test dappId:", testDappId);

      const ghostAddress = await passKeyManager.deriveAddressForDapp(
        testDappId
      );
      console.log("Generated ghost address:", ghostAddress);

      setTestGhostWallet(ghostAddress);
      setConnections((prev) => {
        const newConnections = [
          ...prev,
          {
            dappId: testDappId,
            address: ghostAddress,
            lastUsed: new Date(),
          },
        ];
        console.log("Updated connections:", newConnections);
        return newConnections;
      });
    } catch (error) {
      console.error("Failed to generate ghost wallet:", error);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-gray-900 rounded-xl shadow-lg border border-gray-800">
      {!isAuthenticated ? (
        <div className="space-y-4">
          <button
            onClick={handleCreatePassKey}
            className="w-full px-4 py-2 bg-[#00E182] text-black font-medium rounded hover:bg-[#00c974] transition-colors"
          >
            Create New Wallet with PassKey
          </button>
          <button
            onClick={handleAuthenticate}
            className="w-full px-4 py-2 border border-[#00E182] text-[#00E182] rounded hover:bg-[#00E182]/10 transition-colors"
          >
            Login with PassKey
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Wallet Connected</h2>
          <button
            onClick={handleTestGhostWallet}
            className="w-full px-4 py-2 bg-[#00E182] text-black font-medium rounded hover:bg-[#00c974] transition-colors"
          >
            Generate Test Ghost Wallet
          </button>
          {testGhostWallet && (
            <div className="p-4 bg-gray-800 rounded">
              <p className="text-sm text-gray-400">Latest Ghost Wallet:</p>
              <p className="text-sm break-all text-white">{testGhostWallet}</p>
            </div>
          )}
          <div className="p-4 bg-gray-800 rounded">
            <p className="text-sm break-all text-gray-300">
              Current dApp Address: {dappAddress || "No dApp connected"}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter dApp ID"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-[#00E182] focus:outline-none"
              id="dappIdInput"
            />
            <button
              onClick={() => {
                const input = document.getElementById(
                  "dappIdInput"
                ) as HTMLInputElement;
                handleDappConnect(input.value);
              }}
              className="px-4 py-2 bg-[#00E182] text-black font-medium rounded hover:bg-[#00c974] transition-colors"
            >
              Connect
            </button>
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
