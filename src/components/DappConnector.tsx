import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PassKeyManager } from "../lib/PasskeyManager";
import type { DappConnection, DappMessage } from "../types/dapp";
import { WalletManager } from "../lib/WalletManager";

export const DappConnector = () => {
  const [searchParams] = useSearchParams();
  const [dapp, setDapp] = useState<DappConnection | null>(null);
  const [status, setStatus] = useState<
    "initial" | "authenticating" | "connecting" | "connected"
  >("initial");
  const passKeyManager = PassKeyManager.getInstance();
  const mounted = useRef(false);
  const connectionAttempted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const dappId = searchParams.get("dappId");
    const action = searchParams.get("action");
    const origin = searchParams.get("origin");

    if (!dappId) {
      console.log("❌ Missing dapp ID");
      return;
    }

    if (action === "disconnect") {
      console.log("🔌 Processing disconnect request for:", dappId);
      const walletManager = WalletManager.getInstance();
      walletManager.removeConnection(dappId);
      window.close();
      return;
    }

    if (!origin) {
      console.log("❌ Missing origin");
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
    if (!dapp || !mounted.current || connectionAttempted.current) return;

    const connectToDapp = async () => {
      connectionAttempted.current = true;

      try {
        setStatus("authenticating");
        console.log("Starting authentication...");
        const { success, address } = await passKeyManager.authenticatePassKey();
        console.log("Authentication result:", { success, address });

        if (!success || !address) {
          throw new Error("Authentication failed");
        }

        if (!mounted.current) return;
        setStatus("connecting");
        console.log("Deriving ghost wallet...");

        try {
          const ghostAddress = await passKeyManager.deriveAddressForDapp(
            dapp.id
          );
          console.log("Ghost wallet derived:", ghostAddress);

          if (!mounted.current) return;
          if (window.opener && dapp.origin) {
            console.log("Sending connection message to dapp...");
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

          setTimeout(() => {
            if (mounted.current) {
              window.close();
            }
          }, 1000);
        } catch (error) {
          console.error("Ghost wallet derivation error:", error);
          throw error;
        }
      } catch (error) {
        console.error("Connection error:", error);
        if (mounted.current && window.opener && dapp.origin) {
          window.opener.postMessage(
            {
              type: "WALLET_ERROR",
              data: {
                error:
                  error instanceof Error ? error.message : "Connection failed",
              },
            } as DappMessage,
            dapp.origin
          );
        }
      }
    };

    connectToDapp();
  }, [dapp]);

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
