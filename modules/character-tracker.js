/**
 * Character Tracker & Visual Dossier Engine
 * 
 * Recognizes character introductions and physical descriptions on book pages,
 * maintains a persistent Dramatis Personae dossier per book, and strictly substitutes
 * character proper names with rich, grounded physical visual descriptions in all
 * image generation prompts to prevent model confusion, text distortions, and pop-culture caricatures.
 */

import { storage } from './storage.js';

/**
 * Pre-seeded canonical character dossiers for sample classical works
 */
export const PRESEEDED_CHARACTERS = {
  sample_harry_potter: [
    {
      id: 'hp_harry',
      name: 'Harry Potter',
      aliases: ['Harry Potter', 'Harry', 'Potter'],
      shortReference: 'the skinny dark-haired youth',
      description: 'a skinny young boy with untidy pitch-black hair that sticks up at the back, bright green almond-shaped eyes behind round wire-rimmed glasses, and a thin faint lightning-bolt scar on his forehead, dressed in an oversized baggy shirt and trousers',
      introducedAtPage: 2,
      eras: [
        {
          startPage: 1,
          endPage: 2,
          context: 'Infant arrival at Privet Drive',
          description: 'a sleeping baby boy wrapped snugly in knitted blankets with a tuft of jet-black hair and a faint lightning-bolt scar on his forehead'
        },
        {
          startPage: 3,
          endPage: 3,
          context: 'Night in the disused classroom',
          description: 'a skinny young schoolboy in striped flannel pyjamas draped beneath a shimmering fluid Invisibility Cloak, with untidy black hair and bright green eyes behind round spectacles'
        },
        {
          startPage: 4,
          endPage: null,
          context: 'Diagon Alley and Hogwarts school robes',
          description: 'a slender young wizard with messy jet-black hair, round wire-rimmed glasses, vivid green eyes, wearing black Hogwarts school robes with crisp white collar'
        }
      ]
    },
    {
      id: 'hp_dumbledore',
      name: 'Albus Dumbledore',
      aliases: ['Albus Dumbledore', 'Dumbledore', 'Professor Dumbledore'],
      shortReference: 'the tall silver-bearded wizard',
      description: 'a tall, thin elderly wizard with sweeping silver hair and long silver beard tucked neatly into his belt, sparkling light-blue eyes behind half-moon spectacles, a long crooked nose, dressed in flowing purple robes and a sweeping midnight-blue cloak with high-heeled buckled boots',
      introducedAtPage: 2
    },
    {
      id: 'hp_mcgonagall',
      name: 'Professor McGonagall',
      aliases: ['Professor McGonagall', 'Minerva McGonagall', 'McGonagall'],
      shortReference: 'the severe emerald-cloaked witch',
      description: 'a severe-looking woman with dark hair scraped back into a tight bun, sharp square spectacles perched on her nose, wearing an emerald-green wool cloak with a high tartan collar',
      introducedAtPage: 2
    },
    {
      id: 'hp_hagrid',
      name: 'Rubeus Hagrid',
      aliases: ['Rubeus Hagrid', 'Hagrid'],
      shortReference: 'the colossal half-giant',
      description: 'a colossal half-giant twice as tall and five times as wide as a normal man, with a wild bushy mane of tangled black hair and thick beard hiding most of his face, crinkling beetle-black eyes, wearing an enormous heavy moleskin overcoat with voluminous pockets and massive leather boots',
      introducedAtPage: 2
    },
    {
      id: 'hp_ollivander',
      name: 'Mr. Ollivander',
      aliases: ['Mr. Ollivander', 'Ollivander'],
      shortReference: 'the silvery-eyed wandmaker',
      description: 'an ancient, pale gentleman with wide silvery luminous eyes that shine like pale moons through the gloom, soft white hair, wearing a dark velvet waistcoat with chalk marks and measuring tape',
      introducedAtPage: 4
    }
  ],

  sample_magicians_nephew: [
    {
      id: 'mn_digory',
      name: 'Digory Kirke',
      aliases: ['Digory Kirke', 'Digory'],
      shortReference: 'the earnest young boy',
      description: 'an earnest, thoughtful young Edwardian boy in grey wool knickerbockers and an Eton collar jacket with wind-tossed brown hair, resolute grey eyes, wearing a shiny yellow or green magic ring on his finger',
      introducedAtPage: 2
    },
    {
      id: 'mn_polly',
      name: 'Polly Plummer',
      aliases: ['Polly Plummer', 'Polly'],
      shortReference: 'the sensible young girl',
      description: 'a sensible, observant young schoolgirl in an Edwardian linen pinafore and wool skirt with braided dark brown hair and bright hazel eyes, carrying a small magic ring',
      introducedAtPage: 2
    },
    {
      id: 'mn_uncle_andrew',
      name: 'Uncle Andrew',
      aliases: ['Uncle Andrew', 'Mr. Ketterley', 'Andrew Ketterley'],
      shortReference: 'the eccentric elderly gentleman',
      description: 'a tall, very thin, elderly eccentric gentleman with a sharp pointed nose, untidy mop of greying hair, dressed in a faded silk-lapel velvet smoking jacket with gold rings glinting on his long bony fingers',
      introducedAtPage: 2
    },
    {
      id: 'mn_jadis',
      name: 'Queen Jadis',
      aliases: ['Queen Jadis', 'Jadis', 'the Queen'],
      shortReference: 'the towering magnificent queen',
      description: 'a woman of dazzling and terrible beauty of towering seven-foot stature, with skin as white as snow, curved scarlet lips, flashing dark eyes, swept in heavy royal robes of deep crimson silk and ermine, wearing a crown of beaten gold',
      introducedAtPage: 3
    },
    {
      id: 'mn_aslan',
      name: 'Aslan',
      aliases: ['Aslan', 'the Great Lion', 'the Lion'],
      shortReference: 'the colossal golden Lion',
      description: 'a colossal, magnificent golden Lion of supernatural majesty, with a glorious rippling deep-amber mane glowing like liquid sunlight, warm luminous golden eyes, noble radiant countenance, and massive silent paws',
      introducedAtPage: 4
    }
  ],

  sample_hobbit: [
    {
      id: 'hob_bilbo',
      name: 'Bilbo Baggins',
      aliases: ['Bilbo Baggins', 'Bilbo', 'Mr. Baggins'],
      shortReference: 'the cheerful curly-haired hobbit',
      description: 'a small, stout hobbit about three feet tall with curly brown hair, a round cheerful face, bright hazel eyes, dressed in a bright yellow waistcoat, dark green velvet breeches, and bare leathery feet with warm brown fur',
      introducedAtPage: 2
    },
    {
      id: 'hob_gandalf',
      name: 'Gandalf',
      aliases: ['Gandalf', 'Gandalf the Grey'],
      shortReference: 'the tall pointed-hat wizard',
      description: 'a tall, venerable wizard with a tall pointed blue hat, a long grey wool cloak with a silver scarf, an immense snow-white beard falling down below his waist, bushy eyebrows that stick out beyond the brim of his hat, carrying a thorny wooden staff',
      introducedAtPage: 2
    },
    {
      id: 'hob_gollum',
      name: 'Gollum',
      aliases: ['Gollum', 'Smeagol'],
      shortReference: 'the pale-eyed cavern dweller',
      description: 'a small, slimy subterranean creature with thin webbed fingers and long feet, large round pale eyes that gleam like lanterns in the shadowy gloom, gaunt skeletal limbs, crouching in his little boat made of hide',
      introducedAtPage: 3
    },
    {
      id: 'hob_smaug',
      name: 'Smaug',
      aliases: ['Smaug', 'Smaug the Magnificent', 'the Dragon'],
      shortReference: 'the colossal red-golden dragon',
      description: 'a vast, dreadful red-golden dragon with colossal bat-like wings, impenetrable scales of polished gold and ruby gems encrusted into his belly, glowing fiery eyes, and smoke smoldering from his nostrils',
      introducedAtPage: 4
    }
  ],

  sample_frankenstein: [
    {
      id: 'frankenstein_victor',
      name: 'Victor Frankenstein',
      aliases: ['Victor Frankenstein', 'Frankenstein', 'Victor'],
      shortReference: 'the gaunt young Swiss scholar',
      description: 'a gaunt, pale young Swiss scholar in his early twenties with disheveled dark brown hair, feverish sunken dark eyes, and an intense expression, wearing an early 19th-century linen cravat and dark wool frock coat',
      introducedAtPage: 2
    },
    {
      id: 'frankenstein_creature',
      name: 'The Creature',
      aliases: ['The Creature', 'The Monster', 'The Daemon', 'The Fiend', 'the creature', 'the monster'],
      shortReference: 'the towering eight-foot-tall figure',
      description: 'a towering eight-foot-tall figure of superhuman stature with dull yellow watery eyes, shriveled yellowish skin scarcely covering muscles and arteries, lustrous black flowing hair, pearly white teeth, and watery sockets, draped in coarse dark garments',
      introducedAtPage: 2
    },
    {
      id: 'frankenstein_elizabeth',
      name: 'Elizabeth Lavenza',
      aliases: ['Elizabeth Lavenza', 'Elizabeth'],
      shortReference: 'the gentle fair-haired young woman',
      description: 'a gentle, slender young woman of graceful bearing with fair golden hair, clear blue expressive eyes, and a serene, benevolent countenance, attired in an early 19th-century muslin gown',
      introducedAtPage: 3
    },
    {
      id: 'frankenstein_walton',
      name: 'Robert Walton',
      aliases: ['Captain Walton', 'Robert Walton', 'Walton'],
      shortReference: 'the determined English ship captain',
      description: 'a determined English seafaring explorer in his late twenties with wind-tousled brown hair, weather-tanned features, and resolute grey eyes, wearing a heavy seafaring wool coat with a high collar',
      introducedAtPage: 1
    },
    {
      id: 'frankenstein_clerval',
      name: 'Henry Clerval',
      aliases: ['Henry Clerval', 'Clerval'],
      shortReference: 'the lively young companion',
      description: 'a spirited young gentleman with warm hazel eyes, wavy brown hair, an open thoughtful brow, dressed in tailored early 19th-century travel attire with a silk neckerchief',
      introducedAtPage: 3
    },
    {
      id: 'frankenstein_justine',
      name: 'Justine Moritz',
      aliases: ['Justine Moritz', 'Justine'],
      shortReference: 'the sorrowful young Swiss woman',
      description: 'a graceful, sorrowful young Swiss woman with braided dark hair, quiet gentle eyes, wearing a modest grey linen period dress and white apron',
      introducedAtPage: 4
    }
  ],

  sample_dorian_gray: [
    {
      id: 'dorian_dorian_gray',
      name: 'Dorian Gray',
      aliases: ['Dorian Gray', 'Dorian', 'Mr. Gray'],
      shortReference: 'the handsome gold-curled youth',
      description: 'an extraordinarily handsome, youthful English gentleman in his early twenties with finely curved scarlet lips, frank blue eyes, and crisp gold-tinted curls, impeccably dressed in a Victorian tailored silk-lapel morning coat',
      introducedAtPage: 2
    },
    {
      id: 'dorian_lord_henry',
      name: 'Lord Henry Wotton',
      aliases: ['Lord Henry Wotton', 'Lord Henry', 'Harry', 'Wotton'],
      shortReference: 'the languid aristocratic gentleman',
      description: 'a tall, languid aristocratic gentleman in his thirties with a pointed brown beard, drooped heavy-lidded hazel eyes, romantic aristocratic features, and an elegant Victorian wool morning coat holding an amber cigarette holder',
      introducedAtPage: 2
    },
    {
      id: 'dorian_basil_hallward',
      name: 'Basil Hallward',
      aliases: ['Basil Hallward', 'Basil'],
      shortReference: 'the rugged Victorian artist',
      description: 'a serious, ruggedly handsome Victorian painter with dark rugged hair, earnest brow, focused artistic gaze, wearing a dark velvet artist smock and tailored trousers',
      introducedAtPage: 2
    },
    {
      id: 'dorian_sibyl_vane',
      name: 'Sibyl Vane',
      aliases: ['Sibyl Vane', 'Sibyl'],
      shortReference: 'the slender young actress',
      description: 'a slender, lovely young Victorian actress of seventeen with delicate features, dark hair coiled loosely, large luminous eyes, in theatrical stage dress',
      introducedAtPage: 4
    }
  ],

  sample_time_machine: [
    {
      id: 'time_traveller',
      name: 'The Time Traveller',
      aliases: ['The Time Traveller', 'Time Traveller', 'The Traveller', 'the Time Traveller'],
      shortReference: 'the pale intellectual inventor',
      description: 'an eccentric Victorian scientific inventor with pale, intellectual features, alert grey eyes, rumpled greying brown hair, wearing a loose tweed jacket, spectacles, and work-stained linen shirt',
      introducedAtPage: 2
    },
    {
      id: 'time_weena',
      name: 'Weena',
      aliases: ['Weena'],
      shortReference: 'the petite Eloi maiden',
      description: 'a delicate, petite Eloi maiden barely four feet tall with large gentle dark eyes, curly brown hair adorned with flowers, porcelain pale skin, and a loose draped pastel tunic with sandals',
      introducedAtPage: 3
    },
    {
      id: 'time_morlocks',
      name: 'The Morlocks',
      aliases: ['The Morlocks', 'The Morlock', 'Morlocks', 'Morlock'],
      shortReference: 'the pale subterranean humanoid',
      description: 'a subterranean humanoid creature with bleached white skin, large reflective grey-red luminous eyes, a flaxen mane on its back, chinless ape-like face, and cold clawed hands',
      introducedAtPage: 4
    }
  ]
};

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts a concise short reference from a full physical description
 */
export function deriveShortReference(description, fallbackName = 'the figure') {
  if (!description) return fallbackName;
  // Match key visual phrases like "the gaunt young scholar", "the handsome gentleman", "the fair-haired woman"
  const nounMatch = description.match(/(scholar|gentleman|lady|maiden|youth|man|woman|inventor|artist|captain|figure|creature|explorer|boy|girl)/i);
  const adjMatch = description.match(/(gaunt|pale|young|handsome|fair-haired|dark-haired|tall|slender|eccentric|rugged|elderly|delicate)/i);

  if (adjMatch && nounMatch) {
    return `the ${adjMatch[1].toLowerCase()} ${nounMatch[1].toLowerCase()}`;
  }
  if (nounMatch) {
    return `the ${nounMatch[1].toLowerCase()}`;
  }
  return fallbackName;
}

/**
 * Strict stopword set for character aliases.
 * Common nouns, adjectives, titles, and generic terms must NEVER be treated as character aliases
 * to prevent corrupting prompts and replacing common words in prose.
 */
export const ALIAS_STOPWORDS = new Set([
  'a', 'an', 'the', 'man', 'men', 'woman', 'women', 'boy', 'boys', 'girl', 'girls',
  'person', 'people', 'figure', 'figures', 'creature', 'stranger', 'strangers', 'fellow',
  'gentleman', 'gentlemen', 'lady', 'ladies', 'one', 'he', 'him', 'his', 'she', 'her',
  'they', 'them', 'their', 'older', 'young', 'old', 'middle-aged', 'tall', 'short',
  'small', 'big', 'mr', 'mrs', 'ms', 'miss', 'dr', 'doctor', 'sir', 'lord', 'lady',
  'captain', 'professor', 'count', 'master', 'past', 'standing', 'huddle', 'street',
  'corner', 'green', 'cloak', 'suit', 'eyes', 'hair', 'face', 'someone', 'anyone',
  'everyone', 'nobody', 'character', 'characters', 'author', 'reader', 'book'
]);

/**
 * Validates that an entity is a specific NAMED character (with an actual proper name)
 * rather than a generic or unnamed background figure (e.g. "an older man", "the stranger").
 */
export function isNamedCharacter(name) {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim();
  if (clean.length < 2) return false;

  // Reject generic or unnamed phrases (e.g. "An older man", "The stranger", "A woman past middle age")
  const genericPattern = /^(an?|the|some|that|this)\s+(older|young|elderly|tall|short|middle-aged|strange|cloaked|eccentric|mysterious|dapper|quaint)?\s*(man|woman|boy|girl|person|figure|passerby|stranger|fellow|crowd|gentleman|lady)\b/i;
  if (genericPattern.test(clean)) return false;

  // Must contain at least one capitalized proper word that is NOT in the stopword list
  const words = clean.split(/\s+/);
  const properWords = words.filter(w => {
    const raw = w.replace(/[^a-zA-Z]/g, '');
    return raw.length >= 2 && /^[A-Z][a-z]+$/.test(raw) && !ALIAS_STOPWORDS.has(raw.toLowerCase());
  });

  return properWords.length > 0;
}

/**
 * Validates whether a candidate alias is a safe proper name.
 * Rejects common words, short tokens, and generic descriptors.
 */
export function isValidAlias(alias) {
  if (!alias || typeof alias !== 'string') return false;
  const clean = alias.trim();
  if (clean.length < 3) return false;
  if (ALIAS_STOPWORDS.has(clean.toLowerCase())) return false;

  // For single-word aliases, require capitalized proper noun format
  if (!clean.includes(' ')) {
    if (!/^[A-Z][a-zA-Z\-]+$/.test(clean)) return false;
  }
  return true;
}

/**
 * Extracts valid proper sub-aliases from a full character name (e.g. "Vernon", "Dursley" from "Mr. Vernon Dursley")
 */
export function extractProperAliases(fullName) {
  if (!fullName || typeof fullName !== 'string') return [];
  const aliases = [fullName.trim()];
  const tokens = fullName.trim().split(/\s+/);

  if (tokens.length > 1) {
    tokens.forEach(t => {
      const clean = t.replace(/[^a-zA-Z]/g, '');
      if (clean.length >= 3 && /^[A-Z]/.test(clean) && !ALIAS_STOPWORDS.has(clean.toLowerCase())) {
        aliases.push(clean);
      }
    });

    const withoutTitle = tokens.filter(t => !/^(Mr|Mrs|Ms|Miss|Dr|Sir|Lord|Lady|Professor|Captain|Master)\.?$/i.test(t)).join(' ');
    if (withoutTitle && withoutTitle !== fullName && withoutTitle.length >= 3) {
      aliases.push(withoutTitle);
    }
  }

  return Array.from(new Set(aliases)).filter(a => isValidAlias(a));
}

/**
 * Strips out transitory actions, momentary activities, and personality adjectives
 * from physical descriptions to keep them strictly grounded in permanent visual traits.
 */
export function sanitizePhysicalDescription(desc) {
  if (!desc || typeof desc !== 'string') return '';
  let clean = desc.trim();

  // Strip common actions and temporary activity clauses
  const actionPatterns = [
    /\b(?:standing|sitting|walking|running|whispering|stepping|talking|speaking|looking|glancing|staring|shivering|gazing|huddled|touching)\s+[^,;.]+/gi,
    /\b(?:in a huddle|on a street corner|through the glass doors|onto a grey city pavement|at dusk|in thought)\b/gi,
    /\b(?:he wears a preoccupied expression|his hand touching his mustache in thought)\b/gi,
    /\b(?:steps out through the glass doors of a nineth-floor office building onto a grey city pavement at dusk)\b/gi,
    /\b(?:stepping out through the glass doors onto a pavement)\b/gi
  ];

  for (const pat of actionPatterns) {
    clean = clean.replace(pat, '');
  }

  // Strip personality and psychological disposition adjectives
  const personalityPatterns = [
    /\b(?:easily enraged|conventional and rigid bearing|stern, easily enraged|preoccupied expression|wicked and cruel|kind-hearted|cheerful and jolly|eccentric appearance highlighted by)\b/gi
  ];

  for (const pat of personalityPatterns) {
    clean = clean.replace(pat, '');
  }

  // Clean up punctuation artifacts, double commas, dangling 'with', 'and', 'wearing'
  clean = clean
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/,\s*(?:and\s*)?$/i, '')
    .replace(/^\s*(?:and|,)\s*/i, '')
    .trim();

  // Strip any cinematic or pop-culture tropes so data remains strictly textual
  clean = sanitizePopCultureTropes(clean);

  return clean;
}

/**
 * Sanitizes prompts and descriptions to eliminate pop-culture, cinematic, or Hollywood tropes
 * ensuring that character appearance strictly reflects the extracted book data.
 *
 * @param {string} text
 * @returns {string}
 */
export function sanitizePopCultureTropes(text) {
  if (!text || typeof text !== 'string') return '';
  let clean = text;

  const popCultureReplacements = [
    // Hollywood Frankenstein adaptations (Boris Karloff 1931 Universal tropes vs Mary Shelley's yellow skin/black hair)
    { pattern: /\b(?:green[- ]skinned|olive[- ]green skin|green skin|green flesh|pale green skin)\b/gi, replacement: 'shriveled yellowish skin' },
    { pattern: /\b(?:neck[- ]bolts?|bolts? in (?:the|his|its) neck|metal bolts? in neck|electrodes? on (?:the|his) neck|neck electrodes?|metal neck electrodes?)\b/gi, replacement: '' },
    { pattern: /\b(?:flat[- ]top head|flat square (?:head|skull)|square flat head|metal staples? on forehead)\b/gi, replacement: '' },

    // Cinematic Dracula / Vampire tropes (Bela Lugosi / movie cliches)
    { pattern: /\b(?:red[- ]lined satin cape|red silk lined cape|bela lugosi|dracula cape with high red collar)\b/gi, replacement: 'dark Victorian travelling cloak' },
    { pattern: /\b(?:black tuxedo with (?:a )?cape)\b/gi, replacement: 'somber black wool Victorian evening attire' },

    // Stage / Cinematic Sherlock Holmes tropes
    { pattern: /\b(?:curved calabash pipe)\b/gi, replacement: 'straight briar pipe' },

    // Meta pop-culture / Hollywood keywords
    { pattern: /\b(?:movie adaptation|hollywood adaptation|film adaptation|movie version|cinematic version|hollywood depiction|pop[- ]culture tropes?|actor likeness|disney style|disney adaptation)\b/gi, replacement: '' }
  ];

  for (const { pattern, replacement } of popCultureReplacements) {
    clean = clean.replace(pattern, replacement);
  }

  return clean
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

/**
 * Detects and decomposes compound multi-scene wardrobe summaries like:
 * "A young boy with untidy black hair... wearing Hogwarts student robes in the underground chambers and hospital pajamas in the infirmary bed."
 * into distinct scene-specific visual eras with page numbers.
 *
 * @param {string} desc
 * @param {number} [startPage=1]
 * @returns {Object|null}
 */
export function splitCompoundWardrobe(desc, startPage = 1) {
  if (!desc || typeof desc !== 'string') return null;
  const compoundRegex = /^(.*?),?\s*(?:wearing|dressed in|clad in)\s+(.+?)\s+(?:in|at|during)\s+(?:the\s+)?(.+?)\s+and\s+(?:wearing\s+|dressed in\s+|clad in\s+)?(.+?)\s+(?:in|at|during)\s+(?:the\s+)?(.+?)\.?$/i;
  const match = desc.match(compoundRegex);
  if (!match) return null;

  const basePhysical = match[1].trim();
  const outfit1 = match[2].trim();
  const scene1 = match[3].trim();
  const outfit2 = match[4].trim();
  const scene2 = match[5].trim();

  const scene1Label = scene1.charAt(0).toUpperCase() + scene1.slice(1);
  const scene2Label = scene2.charAt(0).toUpperCase() + scene2.slice(1);

  return {
    baseDescription: `${basePhysical}, wearing ${outfit1}`,
    corePhysicalOnly: basePhysical,
    eras: [
      {
        startPage: startPage,
        endPage: null,
        context: `${scene1Label} - ${outfit1}`,
        description: `${basePhysical}, wearing ${outfit1} in the ${scene1}`
      },
      {
        startPage: startPage + 1,
        endPage: null,
        context: `${scene2Label} - ${outfit2}`,
        description: `${basePhysical}, wearing ${outfit2} in the ${scene2}`
      }
    ]
  };
}

/**
 * Robust JSON and structured text extractor for Gemini's dedicated character gathering response
 * @param {string} rawText
 * @param {number} [pageNumber=1]
 * @returns {Array<Object>}
 */
export function parseCharacterCodexJson(rawText, pageNumber = 1) {
  if (!rawText || typeof rawText !== 'string') return [];

  let candidates = [];

  // 1. Try markdown code block or direct JSON
  const jsonBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonCandidate = jsonBlock ? jsonBlock[1].trim() : rawText.trim();

  // Try parsing object with "characters" array
  try {
    const braceMatch = jsonCandidate.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      const parsed = JSON.parse(braceMatch[0]);
      if (Array.isArray(parsed.characters)) {
        candidates = parsed.characters;
      } else if (Array.isArray(parsed)) {
        candidates = parsed;
      }
    }
  } catch (_) { }

  // If still empty, try direct array match [ ... ]
  if (candidates.length === 0) {
    try {
      const arrayMatch = jsonCandidate.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          candidates = parsed;
        }
      }
    } catch (_) { }
  }

  // Sanitize, normalize, and strictly filter for named characters
  const validCharacters = [];
  const processedKeys = new Set();

  for (const c of candidates) {
    if (!c || typeof c !== 'object') continue;
    const rawName = (c.name || c.character || '').trim();
    if (!isNamedCharacter(rawName)) continue; // Strictly ignore unnamed/generic figures

    // Parse multi-era timeline (aging, wardrobe changes, flashbacks)
    let eras = [];
    if (Array.isArray(c.eras) && c.eras.length > 0) {
      eras = c.eras.map(e => {
        if (!e) return null;
        const eDesc = sanitizePhysicalDescription((e.description || e.physicalDescription || e.desc || '').trim());
        if (!eDesc || eDesc.length < 10) return null;
        const sPage = typeof e.startPage === 'number' ? e.startPage : (typeof e.fromPage === 'number' ? e.fromPage : pageNumber);
        const ePage = typeof e.endPage === 'number' ? e.endPage : (typeof e.toPage === 'number' ? e.toPage : null);
        const ctx = (e.context || e.era || e.wardrobe || e.style || e.label || '').trim() || `Page ${sPage}+`;
        return {
          startPage: sPage,
          endPage: ePage,
          context: ctx,
          description: eDesc
        };
      }).filter(Boolean);
    }

    const rawDesc = (c.description || c.physicalDescription || c.visualDescription || '').trim();
    let cleanDesc = sanitizePhysicalDescription(rawDesc);

    // Decompose compound multi-scene wardrobe summaries into scene-specific eras
    const compound = splitCompoundWardrobe(cleanDesc, pageNumber);
    if (compound) {
      cleanDesc = compound.baseDescription;
      if (eras.length === 0) {
        eras = compound.eras;
      } else {
        for (const de of compound.eras) {
          if (!eras.some(e => e.context === de.context)) {
            eras.push(de);
          }
        }
      }
    }

    // Also unpack any eras that themselves contain compound summaries
    const unpackedEras = [];
    for (const era of eras) {
      const eraDecomp = splitCompoundWardrobe(era.description, era.startPage || pageNumber);
      if (eraDecomp) {
        unpackedEras.push(...eraDecomp.eras);
      } else {
        unpackedEras.push(era);
      }
    }
    eras = unpackedEras;
    eras.sort((a, b) => (a.startPage || 1) - (b.startPage || 1));

    // If no eras parsed yet, but cleanDesc exists, create initial era
    if (eras.length === 0 && cleanDesc && cleanDesc.length >= 10) {
      eras.push({
        startPage: pageNumber,
        endPage: null,
        context: 'Introduced',
        description: cleanDesc
      });
    }

    const primaryDesc = cleanDesc || eras[eras.length - 1]?.description || eras[0]?.description || '';
    if (!primaryDesc || primaryDesc.length < 10) continue; // Must contain actual physical traits

    const key = rawName.toLowerCase();
    if (processedKeys.has(key)) continue;
    processedKeys.add(key);

    const aliases = (Array.isArray(c.aliases) ? c.aliases : [rawName])
      .concat(extractProperAliases(rawName))
      .filter(a => isValidAlias(a));

    validCharacters.push({
      id: `char_${rawName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: rawName,
      aliases: Array.from(new Set(aliases)),
      shortReference: deriveShortReference(primaryDesc, 'the figure'),
      description: primaryDesc,
      eras,
      introducedAtPage: pageNumber
    });
  }

  return validCharacters;
}

/**
 * Resolves the page-accurate physical appearance, wardrobe, and age description
 * for a character based on the current page number and any timeline eras/flashbacks.
 *
 * @param {Object} character
 * @param {number} [pageNumber=1]
 * @returns {string} The active physical visual description for that specific page
 */
export function getCharacterDescriptionForPage(character, pageNumber = 1) {
  if (!character) return '';
  const page = typeof pageNumber === 'number' && pageNumber > 0 ? pageNumber : 1;

  if (Array.isArray(character.eras) && character.eras.length > 0) {
    // 1. Look for bounded temporary/flashback ranges: startPage <= page <= endPage
    const boundedEras = character.eras.filter(e =>
      typeof e.startPage === 'number' && e.startPage <= page &&
      typeof e.endPage === 'number' && e.endPage >= page &&
      e.description && e.description.trim().length >= 10
    );

    if (boundedEras.length > 0) {
      // Pick the most specific (highest startPage or narrowest span)
      boundedEras.sort((a, b) => b.startPage - a.startPage);
      return boundedEras[0].description.trim();
    }

    // 2. Look for progressive open-ended eras: startPage <= page
    const progressiveEras = character.eras.filter(e =>
      typeof e.startPage === 'number' && e.startPage <= page &&
      (!e.endPage || e.endPage >= page) &&
      e.description && e.description.trim().length >= 10
    );

    if (progressiveEras.length > 0) {
      progressiveEras.sort((a, b) => b.startPage - a.startPage);
      return progressiveEras[0].description.trim();
    }

    // 3. If reading prior to first era, pick earliest era
    const sortedEras = [...character.eras].sort((a, b) => (a.startPage || 1) - (b.startPage || 1));
    if (sortedEras[0]?.description) {
      return sortedEras[0].description.trim();
    }
  }

  return character.description || '';
}

/**
 * Retrieves the active era metadata object (context, startPage, endPage, description)
 * for a character at a specific page number.
 *
 * @param {Object} character
 * @param {number} [pageNumber=1]
 * @returns {Object|null}
 */
export function getActiveEraForPage(character, pageNumber = 1) {
  if (!character || !Array.isArray(character.eras) || character.eras.length === 0) return null;
  const page = typeof pageNumber === 'number' && pageNumber > 0 ? pageNumber : 1;

  const bounded = character.eras.filter(e =>
    typeof e.startPage === 'number' && e.startPage <= page &&
    typeof e.endPage === 'number' && e.endPage >= page
  );
  if (bounded.length > 0) {
    bounded.sort((a, b) => b.startPage - a.startPage);
    return bounded[0];
  }

  const progressive = character.eras.filter(e =>
    typeof e.startPage === 'number' && e.startPage <= page &&
    (!e.endPage || e.endPage >= page)
  );
  if (progressive.length > 0) {
    progressive.sort((a, b) => b.startPage - a.startPage);
    return progressive[0];
  }

  return character.eras[0] || null;
}

/**
 * Replaces all occurrences of character proper names with their physical visual descriptions
 * resolved specifically for the active page number (reflecting aging, wardrobe, and flashbacks).
 * Guarantees that no character proper name remains in the image generation prompt.
 * 
 * @param {string} promptText
 * @param {Array<Object>} characters
 * @param {number} [pageNumber=1]
 * @returns {string} The transformed prompt with all names replaced by page-accurate physical descriptions
 */
export function substituteNamesWithDescriptions(promptText, characters, pageNumber = 1) {
  if (!promptText || typeof promptText !== 'string') return promptText;
  if (!Array.isArray(characters) || characters.length === 0) return promptText;

  // Flatten all valid character aliases and associate with character for this specific page
  const aliasRules = [];
  characters.forEach(char => {
    if (!char) return;
    const pageDesc = getCharacterDescriptionForPage(char, pageNumber);
    if (!pageDesc) return;

    const nameList = Array.from(new Set([char.name, ...(char.aliases || [])]))
      .filter(n => isValidAlias(n));

    nameList.forEach(alias => {
      aliasRules.push({
        alias: alias.trim(),
        charId: char.id || char.name,
        description: pageDesc,
        shortReference: char.shortReference || deriveShortReference(pageDesc, 'the figure')
      });
    });
  });

  if (aliasRules.length === 0) return promptText;

  // Sort aliases by length descending (longest first: "Victor Frankenstein" before "Victor")
  aliasRules.sort((a, b) => b.alias.length - a.alias.length);

  let result = promptText;
  const substitutedCharIds = new Set();
  const tokenMap = new Map();
  let tokenCounter = 0;

  // Pass 1: Replace names with temporary tokens
  for (const rule of aliasRules) {
    const isSingleWord = !rule.alias.includes(' ');
    // Match single-word aliases with case-sensitivity (proper nouns), multi-words case-insensitively
    const flags = isSingleWord ? 'g' : 'gi';
    const regex = new RegExp(`\\b${escapeRegex(rule.alias)}(?:'s|’s)?\\b`, flags);

    result = result.replace(regex, (match) => {
      if (match.startsWith('__CHAR_TOKEN_')) return match;

      const isPossessive = match.endsWith("'s") || match.endsWith("’s");
      const alreadySubstituted = substitutedCharIds.has(rule.charId);

      let replacement = '';
      if (!alreadySubstituted) {
        replacement = rule.description;
        substitutedCharIds.add(rule.charId);
      } else {
        replacement = rule.shortReference;
      }

      if (isPossessive) {
        replacement = `${replacement}'s`;
      }

      const token = `__CHAR_TOKEN_${tokenCounter++}__`;
      tokenMap.set(token, replacement);
      return token;
    });
  }

  // Pass 2: Substitute temporary tokens with actual visual descriptions
  tokenMap.forEach((replacement, token) => {
    result = result.split(token).join(replacement);
  });

  // Clean up any double spaces, comma splices, or awkward punctuation
  result = result
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();

  // Strip pop-culture / cinematic tropes to ensure only extracted character data informs appearance
  result = sanitizePopCultureTropes(result);

  return result;
}

/**
 * Checks if a prompt or text contains any known character name or alias
 * @param {string} text
 * @param {Array<Object>} characters
 * @returns {boolean}
 */
export function containsAnyCharacterName(text, characters) {
  if (!text || !Array.isArray(characters)) return false;
  return characters.some(char => {
    const aliases = [char.name, ...(char.aliases || [])];
    return aliases.some(alias => {
      if (!alias || alias.length < 2) return false;
      const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
      return regex.test(text);
    });
  });
}

/**
 * Character Tracker Service Manager
 */
export class CharacterTracker {
  constructor(storageManager = storage) {
    this.storage = storageManager;
    this.activeCharactersCache = new Map(); // bookId -> Array<Character>
  }

  /**
   * Initializes or retrieves the character list for a book.
   * If empty and the book matches a canonical pre-seeded classic, populates canonical characters.
   * @param {string} bookId
   * @returns {Promise<Array<Object>>}
   */
  async loadBookCharacters(bookId) {
    if (!bookId) return [];

    let characters = await this.storage.getCharacters(bookId);

    // If no characters exist yet, check pre-seeded classics
    if ((!characters || characters.length === 0) && PRESEEDED_CHARACTERS[bookId]) {
      characters = PRESEEDED_CHARACTERS[bookId];
      await this.storage.saveCharacters(bookId, characters);
    }

    this.activeCharactersCache.set(bookId, characters || []);
    return characters || [];
  }

  /**
   * Retrieves active in-memory characters for a book
   * @param {string} bookId
   * @returns {Array<Object>}
   */
  getCharactersForBook(bookId) {
    return this.activeCharactersCache.get(bookId) || [];
  }

  /**
   * Adds or updates a character in the book's dossier
   * @param {string} bookId
   * @param {Object} character
   * @returns {Promise<Array<Object>>}
   */
  async addOrUpdateCharacter(bookId, character) {
    const updatedList = await this.storage.addOrUpdateCharacter(bookId, character);
    this.activeCharactersCache.set(bookId, updatedList);
    return updatedList;
  }

  /**
   * Merges characters gathered by Gemini's dedicated character extraction prompt
   * and saves them persistently to the book's dossier.
   * @param {string} bookId
   * @param {Array<Object>} newCharacters
   * @param {number} [pageNumber=1]
   * @returns {Promise<Array<Object>>}
   */
  async mergeCharacters(bookId, newCharacters, pageNumber = 1) {
    if (!bookId || !Array.isArray(newCharacters) || newCharacters.length === 0) {
      return this.getCharactersForBook(bookId);
    }

    const existing = await this.loadBookCharacters(bookId);

    for (const char of newCharacters) {
      if (!char || !char.name || (!char.description && (!Array.isArray(char.eras) || char.eras.length === 0))) continue;

      const cleanName = char.name.trim();
      const isPreseeded = PRESEEDED_CHARACTERS[bookId]?.some(p => p.name.toLowerCase() === cleanName.toLowerCase());
      if (!isNamedCharacter(cleanName) && !isPreseeded) continue;

      const incomingDescRaw = (char.description || char.eras?.[char.eras.length - 1]?.description || char.eras?.[0]?.description || '').trim();
      const cleanIncomingDesc = sanitizePhysicalDescription(incomingDescRaw);
      if (!cleanIncomingDesc || cleanIncomingDesc.length < 10) continue;

      const nameLower = cleanName.toLowerCase();
      const existingChar = existing.find(e =>
        e.name.toLowerCase() === nameLower ||
        (Array.isArray(e.aliases) && e.aliases.some(a => a.toLowerCase() === nameLower))
      );

      if (existingChar) {
        // Merge timeline visual eras (aging, wardrobe changes, flashbacks)
        const currentEras = Array.isArray(existingChar.eras) && existingChar.eras.length > 0
          ? [...existingChar.eras]
          : (existingChar.description ? [{
              startPage: existingChar.introducedAtPage || 1,
              endPage: null,
              context: 'Introduced',
              description: existingChar.description
            }] : []);

        if (Array.isArray(char.eras) && char.eras.length > 0) {
          for (const inEra of char.eras) {
            if (!inEra || !inEra.description) continue;
            // Decompose any compound era summaries
            const decomp = splitCompoundWardrobe(inEra.description, inEra.startPage || pageNumber);
            const erasToInsert = decomp ? decomp.eras : [inEra];
            for (const eraItem of erasToInsert) {
              const matchIdx = currentEras.findIndex(e =>
                Math.abs((e.startPage || 1) - (eraItem.startPage || 1)) <= 1 &&
                (e.context === eraItem.context || (!e.endPage && !eraItem.endPage))
              );
              if (matchIdx >= 0) {
                if (eraItem.description.length > currentEras[matchIdx].description.length) {
                  currentEras[matchIdx].description = eraItem.description;
                }
                if (eraItem.context) currentEras[matchIdx].context = eraItem.context;
                if (typeof eraItem.endPage === 'number') currentEras[matchIdx].endPage = eraItem.endPage;
              } else {
                currentEras.push(eraItem);
              }
            }
          }
        }
        currentEras.sort((a, b) => (a.startPage || 1) - (b.startPage || 1));

        // Only update if there is new physical appearance information
        const currentDescLower = (existingChar.description || '').toLowerCase();
        const incomingDescLower = cleanIncomingDesc.toLowerCase();

        let combinedDesc = existingChar.description;
        // If current description already contains incoming details, keep existing
        if (!currentDescLower.includes(incomingDescLower)) {
          // If incoming already incorporates existing description
          if (incomingDescLower.includes(currentDescLower)) {
            combinedDesc = cleanIncomingDesc;
          } else {
            // Identify newly added physical appearance details and append them in addition to existing description
            const existingWords = new Set(currentDescLower.split(/[\s,;.]+/).filter(w => w.length > 3));
            const incomingClauses = cleanIncomingDesc.split(/,\s*/);
            const newClauses = incomingClauses.filter(clause => {
              const clauseLower = clause.toLowerCase();
              // Prevent multi-scene location summaries from contaminating base physical description
              if (/\b(in the|at the)\s+(underground|chambers|infirmary|hospital|bed|dungeon)\b/i.test(clauseLower)) {
                return false;
              }
              const clauseWords = clauseLower.split(/\s+/).filter(w => w.length > 3);
              const matches = clauseWords.filter(w => existingWords.has(w));
              return matches.length < clauseWords.length * 0.7; // Keep if majority of words are new details
            });

            if (newClauses.length > 0) {
              combinedDesc = `${existingChar.description}, ${newClauses.join(', ')}`;
            }
          }
        }

        // Clean combined description and decompose if compound wardrobe summary exists
        const compDesc = splitCompoundWardrobe(combinedDesc, pageNumber);
        if (compDesc) {
          combinedDesc = compDesc.baseDescription;
          for (const de of compDesc.eras) {
            if (!currentEras.some(e => e.context === de.context)) {
              currentEras.push(de);
            }
          }
          currentEras.sort((a, b) => (a.startPage || 1) - (b.startPage || 1));
        }

        combinedDesc = combinedDesc
          .replace(/,\s*,/g, ',')
          .replace(/\s{2,}/g, ' ')
          .replace(/\s+([.,;:])/g, '$1')
          .trim();

        const combinedAliases = Array.from(new Set([
          ...(existingChar.aliases || []),
          ...(Array.isArray(char.aliases) ? char.aliases : [cleanName]),
          ...extractProperAliases(cleanName)
        ])).filter(a => isValidAlias(a));

        await this.addOrUpdateCharacter(bookId, {
          ...existingChar,
          aliases: combinedAliases,
          description: combinedDesc,
          eras: currentEras,
          shortReference: deriveShortReference(combinedDesc, existingChar.shortReference || 'the figure')
        });
      } else {
        // Newly introduced named character
        const aliases = Array.from(new Set([
          ...(Array.isArray(char.aliases) ? char.aliases : [cleanName]),
          ...extractProperAliases(cleanName)
        ])).filter(a => isValidAlias(a));

        const initialEras = Array.isArray(char.eras) && char.eras.length > 0
          ? char.eras
          : [{
              startPage: pageNumber,
              endPage: null,
              context: 'Introduced',
              description: cleanIncomingDesc
            }];

        await this.addOrUpdateCharacter(bookId, {
          id: char.id || `char_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: cleanName,
          aliases,
          eras: initialEras,
          shortReference: char.shortReference || deriveShortReference(cleanIncomingDesc, 'the figure'),
          description: cleanIncomingDesc,
          introducedAtPage: pageNumber
        });
      }
    }

    return this.getCharactersForBook(bookId);
  }

  /**
   * Backward-compatible alias for mergeCharacters
   */
  async mergeGeminiCharacters(bookId, geminiCharacters, pageNumber = 1) {
    return this.mergeCharacters(bookId, geminiCharacters, pageNumber);
  }

  /**
   * Deprecated legacy scanner: delegates directly to mergeCharacters
   */
  async scanAndRecordFromPage(bookId, pageText, pageNumber = 1) {
    return [];
  }

  /**
   * Substitutes all character proper names with physical visual descriptions in a prompt
   * @param {string} promptText
   * @param {string|Array<Object>} bookIdOrCharacters
   * @param {number} [pageNumber=1]
   * @returns {string}
   */
  substituteNames(promptText, bookIdOrCharacters, pageNumber = 1) {
    const characters = Array.isArray(bookIdOrCharacters)
      ? bookIdOrCharacters
      : this.getCharactersForBook(bookIdOrCharacters);

    return substituteNamesWithDescriptions(promptText, characters, pageNumber);
  }
}

export const characterTracker = new CharacterTracker();

