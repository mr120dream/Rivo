import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type WelcomeBackContextValue = {
  showWelcomeBack: boolean;
  setShowWelcomeBack: (value: boolean) => void;
  dismissWelcomeBack: () => void;
};

const WelcomeBackContext = createContext<WelcomeBackContextValue | null>(null);

export function WelcomeBackProvider({ children }: { children: ReactNode }) {
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  const dismissWelcomeBack = useCallback(() => {
    setShowWelcomeBack(false);
  }, []);

  const value = useMemo(
    () => ({
      showWelcomeBack,
      setShowWelcomeBack,
      dismissWelcomeBack,
    }),
    [showWelcomeBack, dismissWelcomeBack],
  );

  return <WelcomeBackContext.Provider value={value}>{children}</WelcomeBackContext.Provider>;
}

export function useWelcomeBack() {
  const context = useContext(WelcomeBackContext);
  if (!context) {
    throw new Error('useWelcomeBack must be used within WelcomeBackProvider');
  }
  return context;
}
