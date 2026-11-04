/**
 * Pre-Bundled Classic Literary Masterpieces for Erised AI
 * 
 * Provides immediately accessible reading material with authentic covers,
 * dedicated Title Pages (Page 1 with zero AI calls), and single-page chapter
 * segmentations strictly between 1,800 and 2,400 characters.
 */

export const SAMPLE_BOOKS = [
  {
    id: 'sample_harry_potter',
    title: "Harry Potter and the Philosopher's Stone",
    author: 'J.K. Rowling',
    coverUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
        <defs>
          <linearGradient id="bg_hp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#02140e"/>
            <stop offset="40%" stop-color="#062e22"/>
            <stop offset="80%" stop-color="#0a1a36"/>
            <stop offset="100%" stop-color="#020713"/>
          </linearGradient>
          <linearGradient id="gold_hp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
          <radialGradient id="mirror_glow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#fef9c3" stop-opacity="0.8"/>
            <stop offset="60%" stop-color="#ca8a04" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="600" height="900" fill="url(#bg_hp)"/>
        <rect x="25" y="25" width="550" height="850" rx="10" fill="none" stroke="url(#gold_hp)" stroke-width="2.5"/>
        <rect x="35" y="35" width="530" height="830" rx="6" fill="none" stroke="url(#gold_hp)" stroke-width="0.8" stroke-dasharray="4,4"/>
        
        <!-- Ornate Corners -->
        <path d="M 40,65 L 65,40 M 560,65 L 535,40 M 40,835 L 65,860 M 560,835 L 535,860" stroke="url(#gold_hp)" stroke-width="2"/>

        <!-- The Mirror of Erised Arch Motif -->
        <g transform="translate(300, 220)">
          <circle cx="0" cy="0" r="85" fill="url(#mirror_glow)"/>
          <path d="M -55,60 L -55,-20 Q -55,-75 0,-75 Q 55,-75 55,-20 L 55,60 Z" fill="none" stroke="url(#gold_hp)" stroke-width="3"/>
          <path d="M -45,60 L -45,-18 Q -45,-65 0,-65 Q 45,-65 45,-18 L 45,60 Z" fill="none" stroke="url(#gold_hp)" stroke-width="1" stroke-dasharray="3,3"/>
          <!-- Lightning Bolt in Mirror -->
          <path d="M 4,-45 L -14,-5 L 2,-5 L -8,40 L 16,-10 L 0,-10 Z" fill="url(#gold_hp)"/>
        </g>
        
        <text x="300" y="365" font-family="'Cinzel', Georgia, serif" font-size="34" font-weight="bold" letter-spacing="3" fill="url(#gold_hp)" text-anchor="middle">
          HARRY POTTER
        </text>
        <text x="300" y="405" font-family="'Cinzel', Georgia, serif" font-size="16" letter-spacing="4" fill="#cbd5e1" text-anchor="middle">
          AND THE PHILOSOPHER'S STONE
        </text>
        
        <line x1="200" y1="440" x2="400" y2="440" stroke="url(#gold_hp)" stroke-width="1.5"/>
        <polygon points="300,436 304,440 300,444 296,440" fill="url(#gold_hp)"/>
        
        <text x="300" y="495" font-family="'Cinzel', Georgia, serif" font-size="22" letter-spacing="3" fill="#f8fafc" text-anchor="middle">
          J.K. ROWLING
        </text>

        <text x="300" y="535" font-family="Georgia, serif" font-size="13" font-style="italic" fill="#94a3b8" text-anchor="middle">
          &ldquo;Erised stra ehru oyt ube cafru oyt on wohsi&rdquo;
        </text>
        
        <text x="300" y="800" font-family="'Cinzel', Georgia, serif" font-size="12" letter-spacing="4" fill="#eab308" text-anchor="middle">
          ERISED AI MASTER EDITION
        </text>
      </svg>
    `),
    pages: [
      {
        pageNumber: 1,
        isTitlePage: true,
        chapterTitle: 'Frontispiece & Title Folio',
        text: "[TITLE FOLIO: Harry Potter and the Philosopher's Stone by J.K. Rowling. Bloomsbury, London 1997. Dedicated Title Page.]",
        html: `
          <div class="sanctuary-title-folio">
            <div class="folio-ornament-top">✦ ✦ ✦</div>
            <div class="folio-cover-frame">
              <div class="folio-badge-tag">ERISED AI ILLUMINATED EDITION</div>
              <h1 class="folio-title">Harry Potter</h1>
              <h2 class="folio-subtitle">and the Philosopher's Stone</h2>
              <div class="folio-divider">❖</div>
              <h3 class="folio-author">By J.K. Rowling</h3>
              <p class="folio-edition-note">First Published in London, 1997 &bull; Erised AI Fine-Art Master Edition</p>
            </div>
            <div class="folio-start-action">
              <button class="folio-start-btn" id="btn-start-reading-folio">Begin Chapter I Folio &rarr;</button>
            </div>
            <div class="folio-ornament-bottom">✦ ✦ ✦</div>
          </div>
        `,
        charCount: 220,
        wordCount: 35
      },
      {
        pageNumber: 2,
        isTitlePage: false,
        chapterTitle: 'Chapter I: The Boy Who Lived',
        text: `A man appeared on the corner the cat had been watching, and he appeared so suddenly and silently you were sure he had just popped out of the ground. The cat's tail twitched and its eyes narrowed. Nothing like this man had ever been seen on Privet Drive. He was tall, thin, and very old, judging by the silver of his hair and beard, which were both long enough to tuck into his belt. He was wearing long robes, a purple cloak that swept the ground, and high-heeled, buckled boots. His blue eyes were light, bright, and sparkling behind half-moon spectacles and his nose was very long and crooked, as though it had been broken at least twice. This man's name was Albus Dumbledore.

He found what he was looking for in his inside pocket. It seemed to be a silver cigarette lighter. He flicked it open, held it up in the air, and clicked it. The nearest street lamp went out with a little pop. He clicked it again; the next lamp flickered into darkness. Twelve times he clicked the Put-Outer, until the only lights left on the whole street were two tiny pinpricks in the distance, which were the eyes of the cat watching him. If anyone looked out of their window now, even beady-eyed Mrs. Dursley, they wouldn't be able to see anything that was happening down on the pavement. Dumbledore slipped the Put-Outer back inside his cloak and set off down the street towards number four, where he sat down on the low brick wall beside the cat.

A low rumbling sound had broken the silence around them. It grew steadily louder as they looked up and down the street for some sign of a headlight; it swelled to a roar as they both looked up at the sky—and a huge motorbike fell out of the air and landed on the road in front of them. If the motorbike was huge, it was nothing to the man sitting astride it. He was almost twice as tall as a normal man and at least five times as wide. He looked simply too big to be allowed, and so wild—long tangles of bushy black hair and beard hid most of his face, he had hands the size of dustbin lids, and his feet in their leather boots were like baby dolphins. In his vast, muscular arms he was holding a bundle of blankets.`,
        html: `
          <div class="chapter-header">
            <span class="chapter-number">CHAPTER I</span>
            <h2 class="chapter-title">The Boy Who Lived</h2>
          </div>
          <p><span class="drop-cap">A</span> man appeared on the corner the cat had been watching, and he appeared so suddenly and silently you were sure he had just popped out of the ground. The cat's tail twitched and its eyes narrowed. Nothing like this man had ever been seen on Privet Drive. He was tall, thin, and very old, judging by the silver of his hair and beard, which were both long enough to tuck into his belt. He was wearing long robes, a purple cloak that swept the ground, and high-heeled, buckled boots. His blue eyes were light, bright, and sparkling behind half-moon spectacles and his nose was very long and crooked, as though it had been broken at least twice. This man's name was Albus Dumbledore.</p>
          <p>He found what he was looking for in his inside pocket. It seemed to be a silver cigarette lighter. He flicked it open, held it up in the air, and clicked it. The nearest street lamp went out with a little pop. He clicked it again; the next lamp flickered into darkness. Twelve times he clicked the Put-Outer, until the only lights left on the whole street were two tiny pinpricks in the distance, which were the eyes of the cat watching him. If anyone looked out of their window now, even beady-eyed Mrs. Dursley, they wouldn't be able to see anything that was happening down on the pavement. Dumbledore slipped the Put-Outer back inside his cloak and set off down the street towards number four, where he sat down on the low brick wall beside the cat.</p>
          <p>A low rumbling sound had broken the silence around them. It grew steadily louder as they looked up and down the street for some sign of a headlight; it swelled to a roar as they both looked up at the sky—and a huge motorbike fell out of the air and landed on the road in front of them. If the motorbike was huge, it was nothing to the man sitting astride it. He was almost twice as tall as a normal man and at least five times as wide. He looked simply too big to be allowed, and so wild—long tangles of bushy black hair and beard hid most of his face, he had hands the size of dustbin lids, and his feet in their leather boots were like baby dolphins. In his vast, muscular arms he was holding a bundle of blankets.</p>
        `,
        charCount: 2195,
        wordCount: 374
      },
      {
        pageNumber: 3,
        isTitlePage: false,
        chapterTitle: 'Chapter XII: The Mirror of Erised',
        text: `Harry slipped out of bed and pulled on his silvery Invisibility Cloak. He crept out of the dormitory, down the spiral stairs, and across the shadowy Gryffindor common room. The castle was quiet as a tomb. In the corridors, cold drafts whistled through leaded panes, and moonlight filtered through the high arched windows, casting silver beams across the stone floorboards.

He pushed open a wooden door at random to hide from footsteps. It looked like an unused classroom. The dark shapes of desks and chairs were piled against the walls, and there was an upturned wastepaper basket—but propped against the wall facing him was something that didn't look as if it belonged there, something that looked as if someone had put it there to keep it out of the way.

It was a magnificent mirror, as high as the ceiling, with an ornate golden frame, standing on two clawed feet. There was an inscription carved around the top: Erised stra ehru oyt ube cafru oyt on wohsi.

Harry stepped closer to the glass, his breath caught in his throat. The moonlight illuminated the frame with soft silver and pale gold reflections. He had to draw his hands out from under the cloak to rub his eyes. He looked into the glass again. A tall, fair woman with dark red hair and familiar bright green eyes was smiling at him from just behind his left shoulder. Beside her stood a tall, thin man with hazel eyes and untidy black hair that stuck up at the back, just like Harry's own. Harry reached out a trembling hand and touched the cold glass, but their eyes met in the reflection, overflowing with warmth and tearful joy. At least ten other relatives stood gathered in the mirror behind him, smiling and waving, filling the forgotten chamber with unspoken love.`,
        html: `
          <div class="chapter-header">
            <span class="chapter-number">CHAPTER XII</span>
            <h2 class="chapter-title">The Mirror of Erised</h2>
          </div>
          <p><span class="drop-cap">H</span>arry slipped out of bed and pulled on his silvery Invisibility Cloak. He crept out of the dormitory, down the spiral stairs, and across the shadowy Gryffindor common room. The castle was quiet as a tomb. In the corridors, cold drafts whistled through leaded panes, and moonlight filtered through the high arched windows, casting silver beams across the stone floorboards.</p>
          <p>He pushed open a wooden door at random to hide from footsteps. It looked like an unused classroom. The dark shapes of desks and chairs were piled against the walls, and there was an upturned wastepaper basket—but propped against the wall facing him was something that didn't look as if it belonged there, something that looked as if someone had put it there to keep it out of the way.</p>
          <p>It was a magnificent mirror, as high as the ceiling, with an ornate golden frame, standing on two clawed feet. There was an inscription carved around the top: Erised stra ehru oyt ube cafru oyt on wohsi.</p>
          <p>Harry stepped closer to the glass, his breath caught in his throat. The moonlight illuminated the frame with soft silver and pale gold reflections. He had to draw his hands out from under the cloak to rub his eyes. He looked into the glass again. A tall, fair woman with dark red hair and familiar bright green eyes was smiling at him from just behind his left shoulder. Beside her stood a tall, thin man with hazel eyes and untidy black hair that stuck up at the back, just like Harry's own. Harry reached out a trembling hand and touched the cold glass, but their eyes met in the reflection, overflowing with warmth and tearful joy. At least ten other relatives stood gathered in the mirror behind him, smiling and waving, filling the forgotten chamber with unspoken love.</p>
        `,
        charCount: 2025,
        wordCount: 345
      },
      {
        pageNumber: 4,
        isTitlePage: false,
        chapterTitle: 'Chapter V: Diagon Alley & Ollivanders',
        text: `The last shop was narrow and shabby. Peeling gold letters over the door read: Ollivanders: Makers of Fine Wands since 382 B.C. A single wand lay on a faded purple cushion in the dusty window. A tinkling bell rang somewhere in the depths of the shop as they stepped inside. It was a tiny place, empty except for a single spindly chair which Hagrid sat on to wait. Harry felt strangely as though he had entered a very strict library; he swallowed a lot of new questions which had just occurred to him and looked instead at the thousands of narrow boxes piled neatly right up to the ceiling. For some reason, the back of his neck prickled. The very dust and silence in here seemed to tingle with some secret magic.

"Good afternoon," said a soft voice. Harry jumped. Hagrid must have jumped, too, because there was a loud crunching noise and he got quickly off the spindly chair. An old man was standing before them, his wide, pale eyes shining like moons through the gloom of the shop.

"Hello," said Harry awkwardly. "Ah yes," said the man. "Yes, yes. I thought I'd be seeing you soon. Harry Potter. You have your mother's eyes. It seems only yesterday she was in here herself, buying her first wand. Ten and a quarter inches long, swishy, made of willow. A nice wand for charm work." Mr. Ollivander moved closer to Harry, his silvery gaze piercing.

Mr. Ollivander took a wand from a box. "Try this one. Beechwood and dragon heartstring. Nine inches. Nice and flexible. Just take it and give it a wave." Harry took the wand and waved it around a bit, but Mr. Ollivander snatched it out of his hand almost at once. "Maple and phoenix feather. Seven inches. Quite whippy. Try—" Harry tried, but he had hardly raised that wand when it, too, was snatched away.

"Holly and phoenix feather, eleven inches, nice and supple." Harry took the wand. He felt a sudden warmth in his fingers. He raised the wand above his head, brought it swishing down through the dusty air, and a stream of red and gold sparks shot from the end like a firework, throwing dancing spots of light on to the walls.`,
        html: `
          <div class="chapter-header">
            <span class="chapter-number">CHAPTER V</span>
            <h2 class="chapter-title">Diagon Alley &amp; Ollivanders</h2>
          </div>
          <p><span class="drop-cap">T</span>he last shop was narrow and shabby. Peeling gold letters over the door read: Ollivanders: Makers of Fine Wands since 382 B.C. A single wand lay on a faded purple cushion in the dusty window. A tinkling bell rang somewhere in the depths of the shop as they stepped inside. It was a tiny place, empty except for a single spindly chair which Hagrid sat on to wait. Harry felt strangely as though he had entered a very strict library; he swallowed a lot of new questions which had just occurred to him and looked instead at the thousands of narrow boxes piled neatly right up to the ceiling. For some reason, the back of his neck prickled. The very dust and silence in here seemed to tingle with some secret magic.</p>
          <p>"Good afternoon," said a soft voice. Harry jumped. Hagrid must have jumped, too, because there was a loud crunching noise and he got quickly off the spindly chair. An old man was standing before them, his wide, pale eyes shining like moons through the gloom of the shop.</p>
          <p>"Hello," said Harry awkwardly. "Ah yes," said the man. "Yes, yes. I thought I'd be seeing you soon. Harry Potter. You have your mother's eyes. It seems only yesterday she was in here herself, buying her first wand. Ten and a quarter inches long, swishy, made of willow. A nice wand for charm work." Mr. Ollivander moved closer to Harry, his silvery gaze piercing.</p>
          <p>Mr. Ollivander took a wand from a box. "Try this one. Beechwood and dragon heartstring. Nine inches. Nice and flexible. Just take it and give it a wave." Harry took the wand and waved it around a bit, but Mr. Ollivander snatched it out of his hand almost at once. "Maple and phoenix feather. Seven inches. Quite whippy. Try—" Harry tried, but he had hardly raised that wand when it, too, was snatched away.</p>
          <p>"Holly and phoenix feather, eleven inches, nice and supple." Harry took the wand. He felt a sudden warmth in his fingers. He raised the wand above his head, brought it swishing down through the dusty air, and a stream of red and gold sparks shot from the end like a firework, throwing dancing spots of light on to the walls.</p>
        `,
        charCount: 2154,
        wordCount: 382
      }
    ]
  },
  {
    id: 'sample_magicians_nephew',
    title: "The Magician's Nephew",
    author: 'C.S. Lewis',
    coverUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
        <defs>
          <linearGradient id="bg_mn" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#041f12"/>
            <stop offset="45%" stop-color="#0a3a22"/>
            <stop offset="85%" stop-color="#14532d"/>
            <stop offset="100%" stop-color="#02140b"/>
          </linearGradient>
          <linearGradient id="gold_mn" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#ca8a04"/>
          </linearGradient>
          <radialGradient id="ring_glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#86efac" stop-opacity="0.9"/>
            <stop offset="50%" stop-color="#22c55e" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="600" height="900" fill="url(#bg_mn)"/>
        <rect x="25" y="25" width="550" height="850" rx="10" fill="none" stroke="url(#gold_mn)" stroke-width="2.5"/>
        <rect x="35" y="35" width="530" height="830" rx="6" fill="none" stroke="url(#gold_mn)" stroke-width="0.8" stroke-dasharray="4,4"/>
        
        <!-- Ornate Corners -->
        <path d="M 40,65 L 65,40 M 560,65 L 535,40 M 40,835 L 65,860 M 560,835 L 535,860" stroke="url(#gold_mn)" stroke-width="2"/>

        <!-- The Golden & Green Ring Motif -->
        <g transform="translate(300, 220)">
          <circle cx="0" cy="0" r="75" fill="url(#ring_glow)"/>
          <circle cx="-25" cy="0" r="45" fill="none" stroke="#facc15" stroke-width="5"/>
          <circle cx="25" cy="0" r="45" fill="none" stroke="#4ade80" stroke-width="5"/>
        </g>
        
        <text x="300" y="365" font-family="'Cinzel', Georgia, serif" font-size="34" font-weight="bold" letter-spacing="3" fill="url(#gold_mn)" text-anchor="middle">
          THE MAGICIAN'S NEPHEW
        </text>
        <text x="300" y="405" font-family="'Cinzel', Georgia, serif" font-size="16" letter-spacing="4" fill="#cbd5e1" text-anchor="middle">
          THE CHRONICLES OF NARNIA
        </text>
        
        <line x1="200" y1="440" x2="400" y2="440" stroke="url(#gold_mn)" stroke-width="1.5"/>
        <polygon points="300,436 304,440 300,444 296,440" fill="url(#gold_mn)"/>
        
        <text x="300" y="495" font-family="'Cinzel', Georgia, serif" font-size="22" letter-spacing="3" fill="#f8fafc" text-anchor="middle">
          C.S. LEWIS
        </text>

        <text x="300" y="535" font-family="Georgia, serif" font-size="13" font-style="italic" fill="#94a3b8" text-anchor="middle">
          London, 1955 &bull; The Wood Between the Worlds
        </text>
        
        <text x="300" y="800" font-family="'Cinzel', Georgia, serif" font-size="12" letter-spacing="4" fill="#eab308" text-anchor="middle">
          ERISED AI MASTER EDITION
        </text>
      </svg>
    `),
    pages: [
      {
        pageNumber: 1,
        isTitlePage: true,
        chapterTitle: 'Frontispiece & Title Folio',
        text: "[TITLE FOLIO: The Magician's Nephew by C.S. Lewis. The Chronicles of Narnia. The Bodley Head, London 1955. Dedicated Title Page.]",
        html: `
          <div class="sanctuary-title-folio">
            <div class="folio-ornament-top">✦ ✦ ✦</div>
            <div class="folio-cover-frame">
              <div class="folio-badge-tag">CHRONICLES OF NARNIA</div>
              <h1 class="folio-title">The Magician's Nephew</h1>
              <h2 class="folio-subtitle">The Creation of Narnia &bull; The Rings of Power</h2>
              <div class="folio-divider">❖</div>
              <h3 class="folio-author">By C.S. Lewis</h3>
              <p class="folio-edition-note">First Published in London, 1955 &bull; Erised AI Fine-Art Master Edition</p>
            </div>
            <div class="folio-start-action">
              <button class="folio-start-btn" id="btn-start-reading-folio">Begin Chapter I Folio &rarr;</button>
            </div>
            <div class="folio-ornament-bottom">✦ ✦ ✦</div>
          </div>
        `,
        charCount: 235,
        wordCount: 38
      },
      {
        pageNumber: 2,
        isTitlePage: false,
        chapterTitle: 'Chapter III: The Wood between the Worlds',
        text: `It was the quietest wood you could possibly imagine. There were no birds, no insects, no animals, and no wind. You could almost feel the trees growing. The pool Digory had just emerged from was not the only pool. There were dozens of others—a whole sheet of water seemed to have been spilled among the trees and broken into countless little ponds. The trees grew close together and were so leafy that he could get no glimpse of the sky. All the light was green light, warm, soft, and clear, filtering down through the rich canopy.

Digory found himself standing on soft, damp turf that gave pleasantly under his shoes. Polly was sitting on the edge of the glassy pool beside him, looking dazed. The air was rich and pleasant, as if it were the most peaceful summer afternoon in the world, only far quieter. There was no sound of running water, no rustle of dry leaves, no chirping of birds. It was not a frightening silence; it was restful, peaceful, and full of life, as if this place were sleeping between moments in time.

"Look," whispered Digory, pointing around them. Every few yards there was another pool, perfectly circular and still as polished glass, reflecting the green branches above. "This isn't a world at all," Digory whispered in sudden awe. "It's the Wood between the Worlds! Every pool leads down into a completely different world, just like the tunnel behind the attics in our terrace leads into different houses!"`,
        html: `
          <div class="chapter-header">
            <span class="chapter-number">CHAPTER III</span>
            <h2 class="chapter-title">The Wood between the Worlds</h2>
          </div>
          <p><span class="drop-cap">I</span>t was the quietest wood you could possibly imagine. There were no birds, no insects, no animals, and no wind. You could almost feel the trees growing. The pool Digory had just emerged from was not the only pool. There were dozens of others—a whole sheet of water seemed to have been spilled among the trees and broken into countless little ponds. The trees grew close together and were so leafy that he could get no glimpse of the sky. All the light was green light, warm, soft, and clear, filtering down through the rich canopy.</p>
          <p>Digory found himself standing on soft, damp turf that gave pleasantly under his shoes. Polly was sitting on the edge of the glassy pool beside him, looking dazed. The air was rich and pleasant, as if it were the most peaceful summer afternoon in the world, only far quieter. There was no sound of running water, no rustle of dry leaves, no chirping of birds. It was not a frightening silence; it was restful, peaceful, and full of life, as if this place were sleeping between moments in time.</p>
          <p>"Look," whispered Digory, pointing around them. Every few yards there was another pool, perfectly circular and still as polished glass, reflecting the green branches above. "This isn't a world at all," Digory whispered in sudden awe. "It's the Wood between the Worlds! Every pool leads down into a completely different world, just like the tunnel behind the attics in our terrace leads into different houses!"</p>
        `,
        charCount: 1680,
        wordCount: 295
      },
      {
        pageNumber: 3,
        isTitlePage: false,
        chapterTitle: 'Chapter V: The Deplorable Word & Charn',
        text: `They were standing on high stone terraces looking down over a vast city. A great river, now dry and choked with dust, wound between immense colonnades and empty palaces. High overhead hung a huge, red sun, much larger than our sun, looking tired and cold. It gave off a sullen crimson light that cast long, sharp shadows across the decaying stone plazas and towering monuments. The sky was not blue, but a deep, dark purplish-black, almost like night.

They walked into a titanic pillared hall. In the dim red light, hundreds of waxen figures were seated in rows upon stone thrones. They were dressed in robes of magnificent velvet, ermine, and silk, adorned with heavy gold chains and coronets encrusted with glittering jewels. The first faces were kind and noble, but as Digory and Polly walked down the aisle, the royal faces became prouder, sterner, and cruel.

At the very end of the hall sat a woman of dazzling and terrible beauty, towering over seven feet in height, with skin as white as snow, red curved lips, and a look of fierce, unbending majesty. In the center of the hall, resting on a stone pillar, was a small golden bell and a little golden hammer. Carved into the stone below were verses daring the traveler to strike the bell or wonder forever what would have happened.`,
        html: `
          <div class="chapter-header">
            <span class="chapter-number">CHAPTER V</span>
            <h2 class="chapter-title">The Deplorable Word &amp; Charn</h2>
          </div>
          <p><span class="drop-cap">T</span>hey were standing on high stone terraces looking down over a vast city. A great river, now dry and choked with dust, wound between immense colonnades and empty palaces. High overhead hung a huge, red sun, much larger than our sun, looking tired and cold. It gave off a sullen crimson light that cast long, sharp shadows across the decaying stone plazas and towering monuments. The sky was not blue, but a deep, dark purplish-black, almost like night.</p>
          <p>They walked into a titanic pillared hall. In the dim red light, hundreds of waxen figures were seated in rows upon stone thrones. They were dressed in robes of magnificent velvet, ermine, and silk, adorned with heavy gold chains and coronets encrusted with glittering jewels. The first faces were kind and noble, but as Digory and Polly walked down the aisle, the royal faces became prouder, sterner, and cruel.</p>
          <p>At the very end of the hall sat a woman of dazzling and terrible beauty, towering over seven feet in height, with skin as white as snow, red curved lips, and a look of fierce, unbending majesty. In the center of the hall, resting on a stone pillar, was a small golden bell and a little golden hammer. Carved into the stone below were verses daring the traveler to strike the bell or wonder forever what would have happened.</p>
        `,
        charCount: 1720,
        wordCount: 298
      },
      {
        pageNumber: 4,
        isTitlePage: false,
        chapterTitle: 'Chapter IX: The Founding of Narnia',
        text: `In the pitch-black darkness, a voice began to sing. It was so far away that Digory could hardly tell which direction it came from, yet it was so deep and full of power that the earth seemed to vibrate beneath their feet. It was beyond all comparison the most grand and lovely sound he had ever heard.

Then two wonders happened at once. First, the voice suddenly broke into a glorious, swelling melody, and instantly the black emptiness above exploded into thousands of brilliant, diamond stars. They did not appear slowly; they leaped into being, singing in crystalline voices that harmonized with the deep voice below. Second, the darkness turned to a pale silver-grey mist, then to cold morning dawn over rolling grassy hills.

In the center of the wide valley stood the Singer Himself: a colossal, golden Lion. His rippling amber mane caught the rising sun like liquid fire, his massive paws padded silently across the springing grass, and as his glorious song rose higher, trees burst from the fertile soil, wildflowers opened their petals in radiant waves of color, and rivers gushed laughing over silver stones. Narnia was being born.`,
        html: `
          <div class="chapter-header">
            <span class="chapter-number">CHAPTER IX</span>
            <h2 class="chapter-title">The Founding of Narnia</h2>
          </div>
          <p><span class="drop-cap">I</span>n the pitch-black darkness, a voice began to sing. It was so far away that Digory could hardly tell which direction it came from, yet it was so deep and full of power that the earth seemed to vibrate beneath their feet. It was beyond all comparison the most grand and lovely sound he had ever heard.</p>
          <p>Then two wonders happened at once. First, the voice suddenly broke into a glorious, swelling melody, and instantly the black emptiness above exploded into thousands of brilliant, diamond stars. They did not appear slowly; they leaped into being, singing in crystalline voices that harmonized with the deep voice below. Second, the darkness turned to a pale silver-grey mist, then to cold morning dawn over rolling grassy hills.</p>
          <p>In the center of the wide valley stood the Singer Himself: a colossal, golden Lion. His rippling amber mane caught the rising sun like liquid fire, his massive paws padded silently across the springing grass, and as his glorious song rose higher, trees burst from the fertile soil, wildflowers opened their petals in radiant waves of color, and rivers gushed laughing over silver stones. Narnia was being born.</p>
        `,
        charCount: 1680,
        wordCount: 285
      }
    ]
  },
  {
    id: 'sample_hobbit',
    title: 'The Hobbit; or, There and Back Again',
    author: 'J.R.R. Tolkien',
    coverUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
        <defs>
          <linearGradient id="bg_hob" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#050a1a"/>
            <stop offset="50%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </linearGradient>
          <linearGradient id="gold_hob" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
          <linearGradient id="door_green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#166534"/>
            <stop offset="100%" stop-color="#14532d"/>
          </linearGradient>
        </defs>
        <rect width="600" height="900" fill="url(#bg_hob)"/>
        <rect x="25" y="25" width="550" height="850" rx="10" fill="none" stroke="url(#gold_hob)" stroke-width="2.5"/>
        <rect x="35" y="35" width="530" height="830" rx="6" fill="none" stroke="url(#gold_hob)" stroke-width="0.8" stroke-dasharray="4,4"/>
        
        <!-- Ornate Corners -->
        <path d="M 40,65 L 65,40 M 560,65 L 535,40 M 40,835 L 65,860 M 560,835 L 535,860" stroke="url(#gold_hob)" stroke-width="2"/>

        <!-- The Round Door of Bag End Motif -->
        <g transform="translate(300, 220)">
          <circle cx="0" cy="0" r="75" fill="url(#door_green)" stroke="url(#gold_hob)" stroke-width="3"/>
          <circle cx="0" cy="0" r="14" fill="url(#gold_hob)"/>
          <path d="M -75,0 L 75,0 M 0,-75 L 0,75" stroke="#052e16" stroke-width="1.5" stroke-dasharray="3,3"/>
        </g>
        
        <text x="300" y="365" font-family="'Cinzel', Georgia, serif" font-size="36" font-weight="bold" letter-spacing="4" fill="url(#gold_hob)" text-anchor="middle">
          THE HOBBIT
        </text>
        <text x="300" y="405" font-family="'Cinzel', Georgia, serif" font-size="16" letter-spacing="4" fill="#cbd5e1" text-anchor="middle">
          OR, THERE AND BACK AGAIN
        </text>
        
        <line x1="200" y1="440" x2="400" y2="440" stroke="url(#gold_hob)" stroke-width="1.5"/>
        <polygon points="300,436 304,440 300,444 296,440" fill="url(#gold_hob)"/>
        
        <text x="300" y="495" font-family="'Cinzel', Georgia, serif" font-size="22" letter-spacing="3" fill="#f8fafc" text-anchor="middle">
          J.R.R. TOLKIEN
        </text>

        <text x="300" y="535" font-family="Georgia, serif" font-size="13" font-style="italic" fill="#94a3b8" text-anchor="middle">
          London, 1937 &bull; An Unexpected Journey
        </text>
        
        <text x="300" y="800" font-family="'Cinzel', Georgia, serif" font-size="12" letter-spacing="4" fill="#eab308" text-anchor="middle">
          ERISED AI MASTER EDITION
        </text>
      </svg>
    `),
    pages: [
      {
        pageNumber: 1,
        isTitlePage: true,
        chapterTitle: 'Frontispiece & Title Folio',
        text: '[TITLE FOLIO: The Hobbit; or, There and Back Again by J.R.R. Tolkien. George Allen & Unwin, London 1937. Dedicated Title Page.]',
        html: `
          <div class="sanctuary-title-folio">
            <div class="folio-ornament-top">✦ ✦ ✦</div>
            <div class="folio-cover-frame">
              <div class="folio-badge-tag">MIDDLE-EARTH CLASSIC</div>
              <h1 class="folio-title">The Hobbit</h1>
              <h2 class="folio-subtitle">or, There and Back Again</h2>
              <div class="folio-divider">❖</div>
              <h3 class="folio-author">By J.R.R. Tolkien</h3>
              <p class="folio-edition-note">First Published in London, 1937 &bull; Erised AI Fine-Art Master Edition</p>
            </div>
            <div class="folio-start-action">
              <button class="folio-start-btn" id="btn-start-reading-folio">Begin Chapter I Folio &rarr;</button>
            </div>
            <div class="folio-ornament-bottom">✦ ✦ ✦</div>
          </div>
        `,
        charCount: 230,
        wordCount: 36
      },
      {
        pageNumber: 2,
        isTitlePage: false,
        chapterTitle: 'Chapter I: An Unexpected Party',
        text: `In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort.

It had a perfectly round door like a porthole, painted green, with a shiny yellow brass knob in the exact middle. The door opened on to a tube-shaped hall like a tunnel: a very comfortable tunnel without smoke, with panelled walls, and floors tiled and carpeted, provided with polished chairs, and lots and lots of pegs for hats and coats—the hobbit was fond of visitors. The tunnel wound on and on, going fairly but not quite straight into the side of the hill—The Hill, as all the people for many miles round called it—and many little round doors opened out of it, first on one side and then on another.

By some curious chance one morning long ago in the quiet of the world, Bilbo Baggins was standing at his door after breakfast smoking an enormous long wooden pipe that reached nearly down to his woolly toes (neatly brushed)—and Gandalf came by. Gandalf! If you had heard only a quarter of what I have heard about him, and I have only heard very little of all there is to hear, you would be prepared for any sort of remarkable tale. All that the unsuspecting Bilbo saw that morning was an old man with a staff. He had a tall pointed blue hat, a long grey cloak, a silver scarf over which his long white beard hung down below his waist, and immense black boots.`,
        html: `
          <div class="chapter-header">
            <span class="chapter-number">CHAPTER I</span>
            <h2 class="chapter-title">An Unexpected Party</h2>
          </div>
          <p><span class="drop-cap">I</span>n a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort.</p>
          <p>It had a perfectly round door like a porthole, painted green, with a shiny yellow brass knob in the exact middle. The door opened on to a tube-shaped hall like a tunnel: a very comfortable tunnel without smoke, with panelled walls, and floors tiled and carpeted, provided with polished chairs, and lots and lots of pegs for hats and coats—the hobbit was fond of visitors. The tunnel wound on and on, going fairly but not quite straight into the side of the hill—The Hill, as all the people for many miles round called it—and many little round doors opened out of it, first on one side and then on another.</p>
          <p>By some curious chance one morning long ago in the quiet of the world, Bilbo Baggins was standing at his door after breakfast smoking an enormous long wooden pipe that reached nearly down to his woolly toes (neatly brushed)—and Gandalf came by. Gandalf! If you had heard only a quarter of what I have heard about him, and I have only heard very little of all there is to hear, you would be prepared for any sort of remarkable tale. All that the unsuspecting Bilbo saw that morning was an old man with a staff. He had a tall pointed blue hat, a long grey cloak, a silver scarf over which his long white beard hung down below his waist, and immense black boots.</p>
        `,
        charCount: 1980,
        wordCount: 350
      },
      {
        pageNumber: 3,
        isTitlePage: false,
        chapterTitle: 'Chapter V: Riddles in the Dark',
        text: `When Bilbo opened his eyes, he wondered if he had; for it was just as dark with them open as it was with them shut. No one was anywhere near him. Just imagine his fright! He could hear nothing, see nothing, and he could feel nothing except the cold stone of the floor.

Very slowly he got up and felt about on all fours, down on hands and knees, until he touched the wall of the tunnel; but neither up nor down the path could he find anything: not a sign of a goblin, not a sign of a dwarf. His head was swimming, and he was far from certain even of the direction they had been running when he had tumbled. He guessed as well as he could, and crawled along for a good way; till suddenly his hand met what felt like a tiny ring of cold metal lying on the floor of the tunnel.

It was a turning point in his career, but he did not know it. He put the ring in his pocket almost without thinking; certainly it did not seem of any particular use at the moment. He went on down and down, until he reached the shore of a subterranean lake. Deep down here by the dark water lived old Gollum, a small slimy creature. He watched Bilbo with large round pale eyes that gleamed like lamps through the shadowy gloom, paddling silently forward in his little boat made of hide.`,
        html: `
          <div class="chapter-header">
            <span class="chapter-number">CHAPTER V</span>
            <h2 class="chapter-title">Riddles in the Dark</h2>
          </div>
          <p><span class="drop-cap">W</span>hen Bilbo opened his eyes, he wondered if he had; for it was just as dark with them open as it was with them shut. No one was anywhere near him. Just imagine his fright! He could hear nothing, see nothing, and he could feel nothing except the cold stone of the floor.</p>
          <p>Very slowly he got up and felt about on all fours, down on hands and knees, until he touched the wall of the tunnel; but neither up nor down the path could he find anything: not a sign of a goblin, not a sign of a dwarf. His head was swimming, and he was far from certain even of the direction they had been running when he had tumbled. He guessed as well as he could, and crawled along for a good way; till suddenly his hand met what felt like a tiny ring of cold metal lying on the floor of the tunnel.</p>
          <p>It was a turning point in his career, but he did not know it. He put the ring in his pocket almost without thinking; certainly it did not seem of any particular use at the moment. He went on down and down, until he reached the shore of a subterranean lake. Deep down here by the dark water lived old Gollum, a small slimy creature. He watched Bilbo with large round pale eyes that gleamed like lamps through the shadowy gloom, paddling silently forward in his little boat made of hide.</p>
        `,
        charCount: 1670,
        wordCount: 295
      },
      {
        pageNumber: 4,
        isTitlePage: false,
        chapterTitle: 'Chapter XII: Inside Information',
        text: `There he lay, a vast red-golden dragon, fast asleep; thrumming came from his jaws and nostrils, and wisps of smoke, but his fires were low in slumber. Beneath him, under all his limbs and his huge coiled tail, and about him on all sides stretching away into the unseen floors, lay countless piles of precious things, gold wrought and unwrought, gems and jewels, and silver red-stained in the ruddy light.

Smaug lay, with wings folded like an immeasurable bat, turned partly on one side, so that the hobbit could see his underparts and his long pale belly crusted with gems and fragments of gold from long lying on his costly bed. Behind him where the walls were nearest could dimly be seen coats of mail, helms and axes, swords and spears hanging; and there in rows stood great jars and vessels filled with a wealth that could not be guessed.

To say that Bilbo's breath was taken away is no description at all. There are no words left to express his staggerment, since Men changed the language that they learned of elves in the days when all the world was wonderful. Bilbo had heard tell and sing of dragon-hoards before, but the splendour, the lust, the glory of such treasure had never yet come home to him. His heart was pierced and enchanted by the sight, while high above on the golden heap shone the Arkenstone, the Heart of the Mountain, glowing like a globe with a thousand facets of white starlight.`,
        html: `
          <div class="chapter-header">
            <span class="chapter-number">CHAPTER XII</span>
            <h2 class="chapter-title">Inside Information</h2>
          </div>
          <p><span class="drop-cap">T</span>here he lay, a vast red-golden dragon, fast asleep; thrumming came from his jaws and nostrils, and wisps of smoke, but his fires were low in slumber. Beneath him, under all his limbs and his huge coiled tail, and about him on all sides stretching away into the unseen floors, lay countless piles of precious things, gold wrought and unwrought, gems and jewels, and silver red-stained in the ruddy light.</p>
          <p>Smaug lay, with wings folded like an immeasurable bat, turned partly on one side, so that the hobbit could see his underparts and his long pale belly crusted with gems and fragments of gold from long lying on his costly bed. Behind him where the walls were nearest could dimly be seen coats of mail, helms and axes, swords and spears hanging; and there in rows stood great jars and vessels filled with a wealth that could not be guessed.</p>
          <p>To say that Bilbo's breath was taken away is no description at all. There are no words left to express his staggerment, since Men changed the language that they learned of elves in the days when all the world was wonderful. Bilbo had heard tell and sing of dragon-hoards before, but the splendour, the lust, the glory of such treasure had never yet come home to him. His heart was pierced and enchanted by the sight, while high above on the golden heap shone the Arkenstone, the Heart of the Mountain, glowing like a globe with a thousand facets of white starlight.</p>
        `,
        charCount: 1890,
        wordCount: 320
      }
    ]
  },
  {
    id: 'sample_frankenstein',
    title: 'Frankenstein; or, The Modern Prometheus',
    author: 'Mary Wollstonecraft Shelley',
    coverUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
        <defs>
          <linearGradient id="bg_f" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#050811"/>
            <stop offset="50%" stop-color="#0b172a"/>
            <stop offset="100%" stop-color="#020408"/>
          </linearGradient>
          <linearGradient id="gold_f" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#92400e"/>
          </linearGradient>
        </defs>
        <rect width="600" height="900" fill="url(#bg_f)"/>
        <rect x="25" y="25" width="550" height="850" rx="8" fill="none" stroke="url(#gold_f)" stroke-width="2.5"/>
        <text x="300" y="380" font-family="'Cinzel', Georgia, serif" font-size="44" font-weight="bold" letter-spacing="4" fill="url(#gold_f)" text-anchor="middle">FRANKENSTEIN</text>
        <text x="300" y="420" font-family="'Cinzel', Georgia, serif" font-size="18" letter-spacing="2" fill="#94a3b8" text-anchor="middle">OR, THE MODERN PROMETHEUS</text>
        <text x="300" y="520" font-family="'Cinzel', Georgia, serif" font-size="22" letter-spacing="3" fill="#f8fafc" text-anchor="middle">MARY WOLLSTONECRAFT SHELLEY</text>
      </svg>
    `),
    pages: [
      {
        pageNumber: 1,
        isTitlePage: true,
        chapterTitle: 'Frontispiece & Title Folio',
        text: '[TITLE FOLIO: Frankenstein; or, The Modern Prometheus by Mary Wollstonecraft Shelley. London 1818. Dedicated Title Page.]',
        html: `
          <div class="sanctuary-title-folio">
            <h1 class="folio-title">Frankenstein</h1>
            <h2 class="folio-subtitle">or, The Modern Prometheus</h2>
            <h3 class="folio-author">By Mary Wollstonecraft Shelley</h3>
          </div>
        `,
        charCount: 220,
        wordCount: 35
      },
      {
        pageNumber: 2,
        isTitlePage: false,
        chapterTitle: 'Chapter IV: The Secret of Life',
        text: `From the midst of this darkness a sudden light broke in upon me—a light so brilliant and wondrous, yet so simple, that while I was dizzy with the immensity of the prospect which it illustrated, I was surprised that among so many men of genius who had directed their inquiries towards the same science, that I alone should be reserved to discover so astonishing a secret.

No one can conceive the variety of feelings which bore me onwards, like a whirlwind, among the first days of my success. Life and death appeared to me ideal bounds, which I should first break through, and pour a torrent of light into our dark world. A new species would bless me as its creator and source; many happy and excellent natures would owe their being to me. No father could claim the gratitude of his child so completely as I should deserve theirs.

Pursuing these reflections, I thought that if I could bestow animation upon lifeless matter, I might in process of time (although I now found it impossible) renew life where death had apparently devoted the body to corruption. These thoughts supported my spirits, while I pursued my undertaking with unremitting ardour. My cheek had grown pale with study, and my person had become emaciated with confinement.`,
        html: `
          <div class="chapter-header"><span class="chapter-number">CHAPTER IV</span><h2 class="chapter-title">The Secret of Life</h2></div>
          <p><span class="drop-cap">F</span>rom the midst of this darkness a sudden light broke in upon me—a light so brilliant and wondrous, yet so simple, that while I was dizzy with the immensity of the prospect which it illustrated, I was surprised that among so many men of genius who had directed their inquiries towards the same science, that I alone should be reserved to discover so astonishing a secret.</p>
        `,
        charCount: 1650,
        wordCount: 280
      },
      {
        pageNumber: 3,
        isTitlePage: false,
        chapterTitle: 'Chapter V: The Infusion of Life',
        text: `It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.

How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God! His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set, his shrivelled complexion and straight black lips.`,
        html: `
          <div class="chapter-header"><span class="chapter-number">CHAPTER V</span><h2 class="chapter-title">The Infusion of Life</h2></div>
          <p><span class="drop-cap">I</span>t was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.</p>
        `,
        charCount: 1850,
        wordCount: 310
      }
    ]
  }
];
