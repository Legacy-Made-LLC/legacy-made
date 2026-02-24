/**
 * English Translations Index
 *
 * Exports all English translations organized by perspective.
 */

import type { Translations } from "../types";
import { familyCommon } from "./family/common";
import { familyVault } from "./family/vault";
import { familyWishes } from "./family/wishes";
import { ownerCommon } from "./owner/common";
import { ownerVault } from "./owner/vault";
import { ownerWishes } from "./owner/wishes";

/**
 * Owner perspective translations (you/your)
 */
export const ownerTranslations: Translations = {
  vault: ownerVault,
  wishes: ownerWishes,
  common: ownerCommon,
};

/**
 * Family perspective translations (they/their)
 */
export const familyTranslations: Translations = {
  vault: familyVault,
  wishes: familyWishes,
  common: familyCommon,
};
