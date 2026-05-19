import { useEffect, useRef, useState } from 'react';
import * as Network from 'expo-network';
import { syncNow } from './sync';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const wasOffline = useRef(false);

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable ?? false;
      setNetworkState({
        isConnected: connected,
        isInternetReachable: reachable,
        type: state.type?.toString() ?? 'unknown',
      });

      if (wasOffline.current && connected && reachable) {
        syncNow();
      }
      wasOffline.current = !connected || !reachable;
    });

    Network.getNetworkStateAsync().then((state) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type?.toString() ?? 'unknown',
      });
    });

    return () => subscription.remove();
  }, []);

  return networkState;
}
