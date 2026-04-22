/**
 * UpgradePromptContext - Global context for showing upgrade prompts
 *
 * This allows the UpgradePrompt to be rendered at the root level,
 * above all other modals, while being triggered from anywhere in the app.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

interface UpgradePromptOptions {
  title?: string;
  message?: string;
  onUpgrade?: () => void;
  /**
   * RC Targeting placement identifier (e.g. "info_limit_reached",
   * "pillar_locked_wishes"). Passed through to the paywall route so the
   * right offering + variant is fetched.
   */
  placement?: string;
}

interface UpgradePromptContextType {
  showUpgradePrompt: (options?: UpgradePromptOptions) => void;
  hideUpgradePrompt: () => void;
  isVisible: boolean;
  options: UpgradePromptOptions;
}

const UpgradePromptContext = createContext<UpgradePromptContextType | null>(null);

export function UpgradePromptProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [options, setOptions] = useState<UpgradePromptOptions>({});

  const showUpgradePrompt = useCallback((opts?: UpgradePromptOptions) => {
    setOptions(opts ?? {});
    setIsVisible(true);
  }, []);

  const hideUpgradePrompt = useCallback(() => {
    setIsVisible(false);
    setOptions({});
  }, []);

  return (
    <UpgradePromptContext.Provider
      value={{ showUpgradePrompt, hideUpgradePrompt, isVisible, options }}
    >
      {children}
    </UpgradePromptContext.Provider>
  );
}

export function useUpgradePrompt() {
  const context = useContext(UpgradePromptContext);
  if (!context) {
    throw new Error('useUpgradePrompt must be used within UpgradePromptProvider');
  }
  return context;
}
