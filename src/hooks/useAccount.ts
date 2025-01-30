import { useEffect, useState } from "react";
import { WalletManager } from "../lib/WalletManager";

interface Account {
  address: string | null;
  isUnlocked: boolean;
  ghostWallets: Array<{ dappId: string; address: string }>;
}

export const useAccount = () => {
  const [account, setAccount] = useState<Account>({
    address: null,
    isUnlocked: true, // For now, always unlocked
    ghostWallets: [],
  });

  useEffect(() => {
    const walletManager = WalletManager.getInstance();

    const loadWallet = async () => {
      const mainAddress = await walletManager.loadMainWallet();
      const ghostWallets = walletManager.getAllGhostAddresses();

      setAccount((prev) => ({
        ...prev,
        address: mainAddress,
        ghostWallets,
      }));
    };

    loadWallet();
  }, []);

  return {
    ...account,
    getGhostWallet: (dappId: string) => {
      const walletManager = WalletManager.getInstance();
      return walletManager.deriveGhostWallet(dappId);
    },
  };
};
