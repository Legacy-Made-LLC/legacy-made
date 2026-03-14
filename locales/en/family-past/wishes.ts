/**
 * Family Perspective (Past Tense) - Wishes Translations (en)
 *
 * Text content for the Wishes & Guidance from the family's perspective
 * when the plan owner has passed (past tense).
 */

import type { Translations } from "../../types";

export const familyPastWishes: Translations["wishes"] = {
  carePrefs: {
    title: "Care Preferences",
    description: "What mattered when health decisions needed to be made",
    tasks: {
      whatMatters: {
        title: "What Mattered Most",
        description: "Their priorities for care",
        triggerText: "Understanding their wishes",
        guidanceHeading:
          "When it came to medical care, this is what mattered most to them.",
        guidance:
          "There was no right answer to these questions. This was about understanding what a meaningful life looked like to them.",
        tips: [
          "They shared what made a day feel worth living — connection? Comfort? Being present?",
          "Some people prioritize length of life, others prioritize quality. Both are valid.",
          "These were the values they wanted to guide medical decisions.",
        ],
        pacingNote: "These are profound reflections. Take your time.",
      },
      qualityOfLife: {
        title: "Quality of Life",
        description: "When to shift focus",
        triggerText:
          "Were there circumstances where they wanted to let nature take its course?",
        guidanceHeading:
          "Were there circumstances where they wanted to let nature take its course?",
        guidance:
          "This wasn't about giving up — it was about clarity during an impossible time. They shared guidance to help with these difficult decisions.",
        tips: [
          "Without guidance, families often feel guilty no matter what they decide. These words can lift that weight.",
          "These weren't medical decisions — they were values that could help guide decisions when the time came.",
          "Even partial guidance helps more than silence.",
        ],
      },
      comfortVsTreatment: {
        title: "Comfort vs Treatment",
        description: "Pain, alertness, dignity",
        triggerText: "How did they want comfort and treatment balanced?",
        guidanceHeading: "How did they want comfort and treatment balanced?",
        guidance:
          "There was no wrong answer. Some people want every possible treatment; others prioritize peace and comfort. What mattered was knowing what they wanted.",
        tips: [
          "They shared what mattered more to them: more time or better quality time.",
          "Pain medication can make someone drowsy — they noted how much staying alert mattered to them.",
          "They may have said 'I trust my care team to decide.' That was a valid preference.",
        ],
      },
      advanceDirective: {
        title: "Advance Directive",
        description: "Formal documents on file",
        triggerText: "What advance directive documents existed?",
        guidanceHeading:
          "Legal documents provided the authority to act.",
        guidance:
          "An advance directive or healthcare proxy ensured their wishes were followed — and that someone they trusted could make decisions if they couldn't.",
        tips: [
          "A healthcare proxy named someone to make medical decisions for them.",
          "A living will stated what treatments they did or didn't want.",
          "They may have named a preferred decision-maker even without formal documents.",
        ],
      },
    },
  },

  endOfLife: {
    title: "End-of-Life & After-Death",
    description: "What they wanted to happen",
    tasks: {
      setting: {
        title: "End-of-Life Setting",
        description: "Home, hospital, hospice",
        triggerText: "Where did they want to be?",
        guidanceHeading: "Where did they want to be?",
        guidance:
          "Home, hospice, hospital — each had trade-offs. They shared their preference to help honor their wishes.",
        tips: [
          "Home care was possible for many situations, but required family support.",
          "Hospice facilities specialize in comfort care and often allow more visitors.",
          "They may have said 'wherever makes sense at the time' — flexibility was valid.",
        ],
      },
      afterDeath: {
        title: "After-Death Preferences",
        description: "Burial, cremation, other",
        triggerText: "They shared their preference as a gift.",
        guidanceHeading: "They shared their preference as a gift.",
        guidance:
          "Burial, cremation, green burial — whatever they chose, stating it removed a heavy decision during an already difficult time.",
        tips: [
          "They had strong preferences and stated them clearly to remove guilt from the decision.",
          "If they were flexible, they said so. 'Whatever brings comfort' was valid.",
          "They may have made pre-arrangements to save money and stress.",
        ],
      },
      service: {
        title: "Service or Remembrance",
        description: "Ceremony and memorial wishes",
        triggerText: "How did they want to be remembered?",
        guidanceHeading: "How did they want to be remembered?",
        guidance:
          "A quiet gathering, a big celebration, or nothing at all — knowing what they wanted brings more peace to these decisions.",
        tips: [
          "They reflected on gatherings they attended — what felt right, and what didn't.",
          "Some people want celebration; others prefer quiet. Both are meaningful.",
          "If there was a song or reading that mattered to them, they may have mentioned it here.",
          "Even 'keep it simple' or 'make it a party' gives helpful direction.",
        ],
      },
      organDonation: {
        title: "Organ Donation",
        description: "Their wishes on donation",
        triggerText: "One decision could save several lives.",
        guidanceHeading: "One decision could save several lives.",
        guidance:
          "Organ donation happens quickly after death, so it was important to know their wishes in advance. Stating them clearly removed doubt during an already difficult time.",
        tips: [
          "They may have chosen to donate everything, specific organs only, or nothing at all.",
          "Being on the registry helped, but families still needed to know their wishes.",
          "Religious and cultural considerations were respected — they may have shared concerns here.",
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
        triggerText: "What they wanted their loved ones to know",
        guidanceHeading: "What they wanted their loved ones to know",
        guidance:
          "These words were a gift — to them for saying them, and to those closest to them for receiving them.",
        tips: [
          "They shared what they'd want someone to say if they couldn't say it later.",
          "Gratitude is powerful. Specific moments mean more than general praise.",
          "If there were apologies or regrets, this was their chance to release them.",
          "Even one honest paragraph is valuable.",
        ],
      },
      faith: {
        title: "Faith & Spiritual Preferences",
        description: "Beliefs and traditions",
        triggerText: "What traditions or beliefs should be honored?",
        guidanceHeading: "What traditions or beliefs should be honored?",
        guidance:
          "Whether deeply religious, casually spiritual, or secular — they wanted their beliefs and values to be respected.",
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
          "Grief makes people reactive. They named who should decide, how to handle disagreements, and what mattered most — to give the family a way forward.",
        tips: [
          "They named a primary decision-maker and explained why they trusted them.",
          "They may have acknowledged that people might disagree — and gave guidance for how to resolve it.",
          "They shared what mattered more than getting things 'right' — family harmony? Honoring their memory?",
        ],
        pacingNote:
          "This guidance can bring up strong emotions. Take your time.",
      },
    },
  },
};
