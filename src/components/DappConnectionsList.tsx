import React from "react";

interface DappConnection {
  dappId: string;
  address: string;
  lastUsed: Date;
}

interface DappConnectionsListProps {
  connections: DappConnection[];
  onDisconnect: (dappId: string) => void;
}

const DappConnectionsList: React.FC<DappConnectionsListProps> = ({
  connections,
  onDisconnect,
}) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-white">Connected dApps</h3>
      <div className="mt-4 divide-y divide-gray-800">
        {connections.map((connection) => (
          <div key={connection.dappId} className="py-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-white">
                  {connection.dappId}
                </p>
                <p className="text-sm text-gray-400 break-all">
                  {connection.address}
                </p>
                <p className="text-xs text-gray-500">
                  Last used: {connection.lastUsed.toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => onDisconnect(connection.dappId)}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ))}
        {connections.length === 0 && (
          <p className="py-4 text-sm text-gray-500">No dApps connected yet</p>
        )}
      </div>
    </div>
  );
};

export default DappConnectionsList;
