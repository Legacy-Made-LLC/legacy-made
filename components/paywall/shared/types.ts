export type PaywallVariant =
  | "editorial"
  | "comparison"
  | "pillars"
  | "letter";

export interface PaywallVariantProps {
  priceString: string;
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
