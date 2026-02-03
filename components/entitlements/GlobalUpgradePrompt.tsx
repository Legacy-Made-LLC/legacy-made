/**
 * GlobalUpgradePrompt - Root-level upgrade prompt component
 *
 * Renders the UpgradePrompt at the root level using context state.
 * This ensures it appears above all other modals.
 */

import React from 'react';

import { useUpgradePrompt } from '@/data/UpgradePromptContext';
import { UpgradePrompt } from './UpgradePrompt';

export function GlobalUpgradePrompt() {
  const { isVisible, hideUpgradePrompt, options } = useUpgradePrompt();

  return (
    <UpgradePrompt
      visible={isVisible}
      onClose={hideUpgradePrompt}
      title={options.title}
      message={options.message}
      onUpgrade={options.onUpgrade}
    />
  );
}
