import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAccount } from "../hooks/useAccount";
import type { DappConnection, DappMessage } from "../types/dapp";
import { PassKeyManager } from "../lib/PasskeyManager";

export const DappConnector = () => {
  const [searchParams] = useSearchParams();
  const { isUnlocked, getGhostWallet } = useAccount();
  const [dapp, setDapp] = useState<DappConnection | null>(null);
  const [status, setStatus] = useState<
    "initial" | "authenticating" | "connecting" | "connected"
  >("initial");

  useEffect(() => {
    const dappId = searchParams.get("dappId");
    const origin = searchParams.get("origin");

    if (!dappId || !origin) {
      console.log("❌ Missing dapp connection params");
      return;
    }

    console.log("🔄 Processing dapp connection request:", { dappId, origin });
    setDapp({
      id: dappId,
      origin: decodeURIComponent(origin),
      connected: false,
    });
  }, [searchParams]);

  useEffect(() => {
    if (!dapp || !isUnlocked) return;

    const connectToDapp = async () => {
      try {
        setStatus("authenticating");
        const passKeyManager = PassKeyManager.getInstance();
        const authenticated = await passKeyManager.authenticatePassKey();

        if (!authenticated) {
          throw new Error("Authentication failed");
        }

        setStatus("connecting");
        const ghostAddress = await getGhostWallet(dapp.id);
        console.log("👻 Using ghost wallet:", ghostAddress);

        if (window.opener && dapp.origin) {
          window.opener.postMessage(
            {
              type: "WALLET_CONNECTED",
              data: { address: ghostAddress },
            } as DappMessage,
            dapp.origin
          );
        }

        setStatus("connected");
        setDapp((prev) => (prev ? { ...prev, connected: true } : null));

        // Close after successful connection
        setTimeout(() => window.close(), 1000);
      } catch (error) {
        console.error("Connection error:", error);
        if (window.opener && dapp.origin) {
          window.opener.postMessage(
            {
              type: "WALLET_ERROR",
              data: { error: "Connection failed" },
            } as DappMessage,
            dapp.origin
          );
        }
      }
    };

    connectToDapp();
  }, [dapp, getGhostWallet, isUnlocked]);

  const getStatusMessage = () => {
    switch (status) {
      case "authenticating":
        return "Authenticating...";
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Connected!";
      default:
        return "Initializing...";
    }
  };

  if (!dapp) return null;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Connect to Dapp</h2>
      <div className="bg-[#1A1A1A] rounded-xl p-4">
        <p className="mb-2">Dapp ID: {dapp.id}</p>
        <p className="mb-2">Origin: {dapp.origin}</p>
        <p>Status: {getStatusMessage()}</p>
      </div>
    </div>
  );
};
