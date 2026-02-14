/**
 * Owner Perspective - Wishes Translations (en)
 *
 * Text content for the Wishes & Guidance from the owner's perspective (you/your).
 */

import type { Translations } from "../../types";

export const ownerWishes: Translations["wishes"] = {
  carePrefs: {
    title: "Care Preferences",
    description: "What matters when health decisions are being made",
    tasks: {
      whatMatters: {
        title: "What Matters Most",
        description: "Your priorities for care",
        triggerText: "Take your time with this",
        guidanceHeading:
          "When it comes to medical care, what matters most to you?",
        guidance:
          "There's no right answer here. This is about helping your family understand what a meaningful life looks like to you.",
        tips: [
          "Think about what makes a day feel worth living — connection? Comfort? Being present?",
          "Some people prioritize length of life, others prioritize quality. Both are valid.",
          "If you're unsure, imagine your family asking: 'What would they want?' What would you hope they'd say?",
        ],
        pacingNote: "These are big questions. It's okay to come back later.",
      },
      qualityOfLife: {
        title: "Quality of Life",
        description: "When to shift focus",
        triggerText:
          "Are there circumstances where you'd want to let nature take its course?",
        guidanceHeading:
          "Are there circumstances where you'd want to let nature take its course?",
        guidance:
          "This isn't about giving up — it's about giving your family clarity during an impossible time.",
        tips: [
          "Without your guidance, families often feel guilty no matter what they decide. Your words can lift that weight.",
          "You're not making a medical decision right now. You're sharing values that can help guide decisions later.",
          "It's okay to be uncertain. Even partial guidance helps more than silence.",
        ],
      },
      comfortVsTreatment: {
        title: "Comfort vs Treatment",
        description: "Pain, alertness, dignity",
        triggerText: "How should comfort and treatment be balanced?",
        guidanceHeading: "How should comfort and treatment be balanced?",
        guidance:
          "There's no wrong answer. Some people want every possible treatment; others prioritize peace and comfort. What matters is that your family knows what you'd want.",
        tips: [
          "Think about what matters more to you: more time or better quality time?",
          "Pain medication can make you drowsy — how much does staying alert matter?",
          "It's okay to say 'I trust my care team to decide.' That's a valid preference.",
        ],
      },
      advanceDirective: {
        title: "Advance Directive",
        description: "Formal documents on file",
        triggerText: "Do you have advance directive documents?",
        guidanceHeading:
          "Legal documents give your family the authority to act.",
        guidance:
          "An advance directive or healthcare proxy ensures your wishes are followed — and that someone you trust can make decisions if you can't.",
        tips: [
          "A healthcare proxy names someone to make medical decisions for you.",
          "A living will states what treatments you do or don't want.",
          "Even if you don't have documents yet, naming your preferred decision-maker helps.",
        ],
      },
    },
  },

  endOfLife: {
    title: "End-of-Life & After-Death",
    description: "What should happen when life is ending or has ended",
    tasks: {
      setting: {
        title: "End-of-Life Setting",
        description: "Home, hospital, hospice",
        triggerText: "Where would you want to be, if you could choose?",
        guidanceHeading: "Where would you want to be, if you could choose?",
        guidance:
          "Home, hospice, hospital — each has trade-offs. Knowing your preference helps your family honor your wishes when decisions need to be made quickly.",
        tips: [
          "Home care is possible for many situations, but requires family support.",
          "Hospice facilities specialize in comfort care and often allow more visitors.",
          "It's okay to say 'wherever makes sense at the time' — flexibility is valid.",
        ],
      },
      afterDeath: {
        title: "After-Death Preferences",
        description: "Burial, cremation, other",
        triggerText: "Saying this clearly is a gift to your family.",
        guidanceHeading: "Saying this clearly is a gift to your family.",
        guidance:
          "Burial, cremation, green burial — whatever you choose, stating it removes a heavy decision during an already difficult time.",
        tips: [
          "If you have strong preferences, stating them clearly removes guilt from the decision.",
          "If you're flexible, saying so is equally valuable. 'Whatever brings comfort' is valid.",
          "Pre-arrangements can save your family money and stress, but aren't required.",
        ],
      },
      service: {
        title: "Service or Remembrance",
        description: "Ceremony and memorial wishes",
        triggerText: "How would you want to be remembered?",
        guidanceHeading: "How would you want to be remembered?",
        guidance:
          "A quiet gathering, a big celebration, or nothing at all — your family will feel more at peace knowing what you'd want.",
        tips: [
          "Think about gatherings you've attended — what felt right, and what didn't?",
          "Some people want celebration; others prefer quiet. Both are meaningful.",
          "If there's a song or reading that matters to you, mention it — your family may not know.",
          "Even 'keep it simple' or 'make it a party' gives helpful direction.",
        ],
      },
      organDonation: {
        title: "Organ Donation",
        description: "Your wishes on donation",
        triggerText: "One decision could save several lives.",
        guidanceHeading: "One decision could save several lives.",
        guidance:
          "Organ donation happens quickly after death, so your family needs to know your wishes in advance. Stating them clearly removes doubt during an already difficult time.",
        tips: [
          "You can choose to donate everything, specific organs only, or nothing at all.",
          "Being on the registry helps, but your family still needs to know your wishes.",
          "Religious and cultural considerations are respected — share any concerns here.",
        ],
      },
    },
  },

  values: {
    title: "Personal Values & Guidance",
    description: "Emotional and relational guidance for your family",
    tasks: {
      lovedOnesKnow: {
        title: "What Loved Ones Should Know",
        description: "Final words and reminders",
        triggerText: "What would you say if you couldn't say it later?",
        guidanceHeading: "What would you say if you couldn't say it later?",
        guidance:
          "These words are a gift — to you for saying them, and to your family for receiving them.",
        tips: [
          "Think about what you'd want someone to say to you if they couldn't say it later.",
          "Gratitude is powerful. Naming specific moments means more than general praise.",
          "If there are apologies or regrets, this is a chance to release them.",
          "You don't have to fill everything. Even one honest paragraph is valuable.",
        ],
      },
      faith: {
        title: "Faith & Spiritual Preferences",
        description: "Beliefs and traditions",
        triggerText: "What traditions or beliefs should be honored?",
        guidanceHeading: "What traditions or beliefs should be honored?",
        guidance:
          "Whether deeply religious, casually spiritual, or secular — your family will want to respect what matters to you.",
        tips: [
          "Include any rituals, prayers, or customs that should be observed.",
          "If you have a religious leader or congregation, note their contact info.",
          "Even 'no religious service' is helpful guidance.",
        ],
      },
      hardSituations: {
        title: "Hard Situations",
        description: "Guidance for conflict",
        triggerText: "Need help getting started?",
        guidanceHeading:
          "Your words can prevent conflict during an already difficult time.",
        guidance:
          "Grief makes people reactive. If you name who should decide, how to handle disagreements, and what matters most — you give your family a way forward.",
        tips: [
          "Name a primary decision-maker and explain why you trust them.",
          "Acknowledge that people might disagree — and give guidance for how to resolve it.",
          "What matters more than getting things 'right'? Family harmony? Honoring your memory?",
        ],
        pacingNote:
          "This can bring up strong emotions. It's okay to take breaks.",
      },
    },
  },
};
