import React from "react";
import WalletComponent from "./components/WalletComponent";

const App = () => {
  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-semibold text-white">
            Fuel Ghost Wallet
          </h1>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <WalletComponent />
      </main>
      <footer className="fixed bottom-0 w-full bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-400">
          <p>Privacy-First Fuel Network Wallet</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
