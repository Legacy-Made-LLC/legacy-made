/**
 * English Translations Index
 *
 * Exports all English translations organized by perspective.
 */

import type { Translations } from "../types";
import { familyPastCommon } from "./family-past/common";
import { familyPastLegacy } from "./family-past/legacy";
import { familyPastPages } from "./family-past/pages";
import { familyPastVault } from "./family-past/vault";
import { familyPastWishes } from "./family-past/wishes";
import { familyCommon } from "./family/common";
import { familyLegacy } from "./family/legacy";
import { familyPages } from "./family/pages";
import { familyVault } from "./family/vault";
import { familyWishes } from "./family/wishes";
import { ownerCommon } from "./owner/common";
import { ownerLegacy } from "./owner/legacy";
import { ownerPages } from "./owner/pages";
import { ownerVault } from "./owner/vault";
import { ownerWishes } from "./owner/wishes";

/**
 * Owner perspective translations (you/your)
 */
export const ownerTranslations: Translations = {
  vault: ownerVault,
  wishes: ownerWishes,
  legacy: ownerLegacy,
  pages: ownerPages,
  common: ownerCommon,
};

/**
 * Family perspective translations - present tense (they/their, person is alive)
 */
export const familyTranslations: Translations = {
  vault: familyVault,
  wishes: familyWishes,
  legacy: familyLegacy,
  pages: familyPages,
  common: familyCommon,
};

/**
 * Family perspective translations - past tense (they/their, person has passed)
 */
export const familyPastTranslations: Translations = {
  vault: familyPastVault,
  wishes: familyPastWishes,
  legacy: familyPastLegacy,
  pages: familyPastPages,
  common: familyPastCommon,
};
