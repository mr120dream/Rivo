import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PaywallSheet } from '../components/PaywallSheet';

type PaywallContextValue = {
  showPaywall: () => void;
  hidePaywall: () => void;
};

const PaywallContext = createContext<PaywallContextValue | null>(null);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const showPaywall = useCallback(() => {
    setVisible(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setVisible(false);
  }, []);

  const value = useMemo(() => ({ showPaywall, hidePaywall }), [showPaywall, hidePaywall]);

  return (
    <PaywallContext.Provider value={value}>
      {children}
      <PaywallSheet visible={visible} onClose={hidePaywall} />
    </PaywallContext.Provider>
  );
}

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error('usePaywall must be used within PaywallProvider');
  }
  return context;
}
