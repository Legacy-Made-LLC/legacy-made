/**
 * Family Perspective - Wishes Translations (en)
 *
 * Text content for the Wishes & Guidance from the family's perspective (they/their).
 */

import type { Translations } from "../../types";

export const familyWishes: Translations["wishes"] = {
  carePrefs: {
    title: "Care Preferences",
    description: "What matters when health decisions need to be made",
    tasks: {
      whatMatters: {
        title: "What Matters Most",
        description: "Their priorities for care",
        triggerText: "Understanding their wishes",
        guidanceHeading:
          "When it comes to medical care, this is what matters most to them.",
        guidance:
          "There's no right answer to these questions. This is about understanding what a meaningful life looks like to them.",
        tips: [
          "They've shared what makes a day feel worth living — connection? Comfort? Being present?",
          "Some people prioritize length of life, others prioritize quality. Both are valid.",
          "These are the values they want to guide medical decisions.",
        ],
        pacingNote: "These are profound reflections. Take your time.",
      },
      qualityOfLife: {
        title: "Quality of Life",
        description: "When to shift focus",
        triggerText:
          "Are there circumstances where they'd want to let nature take its course?",
        guidanceHeading:
          "Are there circumstances where they'd want to let nature take its course?",
        guidance:
          "This isn't about giving up — it's about clarity during an impossible time. They've shared guidance to help with these difficult decisions.",
        tips: [
          "Without guidance, families often feel guilty no matter what they decide. These words can lift that weight.",
          "These aren't medical decisions — they're values that can help guide decisions when the time comes.",
          "Even partial guidance helps more than silence.",
        ],
      },
      comfortVsTreatment: {
        title: "Comfort vs Treatment",
        description: "Pain, alertness, dignity",
        triggerText: "How should comfort and treatment be balanced?",
        guidanceHeading: "How should comfort and treatment be balanced?",
        guidance:
          "There's no wrong answer. Some people want every possible treatment; others prioritize peace and comfort. What matters is knowing what they want.",
        tips: [
          "They've shared what matters more to them: more time or better quality time.",
          "Pain medication can make someone drowsy — they've noted how much staying alert matters to them.",
          "They may have said 'I trust my care team to decide.' That's a valid preference.",
        ],
      },
      advanceDirective: {
        title: "Advance Directive",
        description: "Formal documents on file",
        triggerText: "What advance directive documents exist?",
        guidanceHeading:
          "Legal documents provide the authority to act.",
        guidance:
          "An advance directive or healthcare proxy ensures their wishes are followed — and that someone they trust can make decisions if they couldn't.",
        tips: [
          "A healthcare proxy names someone to make medical decisions for them.",
          "A living will states what treatments they did or didn't want.",
          "They may have named a preferred decision-maker even without formal documents.",
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
        triggerText: "Where would they want to be?",
        guidanceHeading: "Where would they want to be?",
        guidance:
          "Home, hospice, hospital — each has trade-offs. They've shared their preference to help honor their wishes when decisions need to be made quickly.",
        tips: [
          "Home care is possible for many situations, but requires family support.",
          "Hospice facilities specialize in comfort care and often allow more visitors.",
          "They may have said 'wherever makes sense at the time' — flexibility is valid.",
        ],
      },
      afterDeath: {
        title: "After-Death Preferences",
        description: "Burial, cremation, other",
        triggerText: "They've shared their preference as a gift.",
        guidanceHeading: "They've shared their preference as a gift.",
        guidance:
          "Burial, cremation, green burial — whatever they chose, stating it removes a heavy decision during an already difficult time.",
        tips: [
          "If they had strong preferences, they've stated them clearly to remove guilt from the decision.",
          "If they were flexible, they've said so. 'Whatever brings comfort' is valid.",
          "They may have made pre-arrangements to save money and stress.",
        ],
      },
      service: {
        title: "Service or Remembrance",
        description: "Ceremony and memorial wishes",
        triggerText: "How would they want to be remembered?",
        guidanceHeading: "How would they want to be remembered?",
        guidance:
          "A quiet gathering, a big celebration, or nothing at all — knowing what they want brings more peace to these decisions.",
        tips: [
          "They've reflected on gatherings they attended — what felt right, and what didn't.",
          "Some people want celebration; others prefer quiet. Both are meaningful.",
          "If there's a song or reading that matters to them, they may have mentioned it here.",
          "Even 'keep it simple' or 'make it a party' gives helpful direction.",
        ],
      },
      organDonation: {
        title: "Organ Donation",
        description: "Their wishes on donation",
        triggerText: "One decision could save several lives.",
        guidanceHeading: "One decision could save several lives.",
        guidance:
          "Organ donation happens quickly after death, so it's important to know their wishes in advance. Stating them clearly removes doubt during an already difficult time.",
        tips: [
          "They may have chosen to donate everything, specific organs only, or nothing at all.",
          "Being on the registry helps, but families still need to know their wishes.",
          "Religious and cultural considerations are respected — they may have shared concerns here.",
        ],
      },
    },
  },

  values: {
    title: "Personal Values & Guidance",
    description: "Emotional and relational guidance for their loved ones",
    tasks: {
      lovedOnesKnow: {
        title: "What Loved Ones Should Know",
        description: "Final words and reminders",
        triggerText: "What they want their loved ones to know",
        guidanceHeading: "What they want their loved ones to know",
        guidance:
          "These words are a gift — to them for saying them, and to their family for receiving them.",
        tips: [
          "They've shared what they'd want someone to say to them if they couldn't say it later.",
          "Gratitude is powerful. Specific moments mean more than general praise.",
          "If there are apologies or regrets, this was a chance for them to release them.",
          "Even one honest paragraph is valuable.",
        ],
      },
      faith: {
        title: "Faith & Spiritual Preferences",
        description: "Beliefs and traditions",
        triggerText: "What traditions or beliefs should be honored?",
        guidanceHeading: "What traditions or beliefs should be honored?",
        guidance:
          "Whether deeply religious, casually spiritual, or secular — they want their beliefs and values to be respected.",
        tips: [
          "They may have included rituals, prayers, or customs that should be observed.",
          "If they had a religious leader or congregation, contact info may be noted.",
          "Even 'no religious service' is helpful guidance.",
        ],
      },
      hardSituations: {
        title: "Hard Situations",
        description: "Guidance for conflict",
        triggerText: "Their guidance for difficult moments",
        guidanceHeading:
          "These words can prevent conflict during an already difficult time.",
        guidance:
          "Grief makes people reactive. They've named who should decide, how to handle disagreements, and what matters most — to give the family a way forward.",
        tips: [
          "They've named a primary decision-maker and explained why they trust them.",
          "They may have acknowledged that people might disagree — and given guidance for how to resolve it.",
          "They've shared what matters more than getting things 'right' — family harmony? Honoring their memory?",
        ],
        pacingNote:
          "This guidance can bring up strong emotions. Take your time.",
      },
    },
  },
};
