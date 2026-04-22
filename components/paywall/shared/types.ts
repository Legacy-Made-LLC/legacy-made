export type PaywallVariant = "editorial" | "comparison" | "pillars";

export interface PaywallVariantProps {
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
