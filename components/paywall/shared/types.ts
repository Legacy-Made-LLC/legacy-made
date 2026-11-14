export type PaywallVariant = "editorial" | "comparison" | "pillars";

export interface PaywallVariantProps {
  /** Plan name and billing period shown above the CTA, e.g. "Legacy Made Individual · annual". */
  subscriptionLabel: string;
  ctaCopy: string;
  disclosure: string;
  loading: boolean;
  purchasing: boolean;
  restoring: boolean;
  error: string | null;
  onPurchase: () => void;
  onRestore: () => void;
  onDismiss: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}
