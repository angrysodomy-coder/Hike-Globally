import { getTripBySlug } from './tripDetails'

/* ------------------------------------------------------------------
   Content model for the single trip page (`/trips/<slug>`).

   The page is one template: hero → title → excerpt → byline →
   highlights → overview → itinerary outline → booking calendar →
   full itinerary → includes/excludes → essential information → map →
   packing list → FAQs.

   Every trip record in `content.js` gets a complete page. Flagship
   journeys carry hand-written copy in `overrides`; everything else is
   composed from the trip's own record by `buildDefault()`, so a new
   trip is publishable the moment it is added to the catalogue.
   ------------------------------------------------------------------ */

const GALLERY = [
  '/images/trek-everest.webp',
  '/images/trek-annapurna.webp',
  '/images/trek-manaslu.webp',
  '/images/trek-langtang.webp',
  '/images/trek-mustang.webp',
  '/images/dest-hero-ridge.webp',
  '/images/dest-valley.webp',
  '/images/dest-lodge.webp',
  '/images/dest-craft-guide.webp',
  '/images/journal-porters.webp',
  '/images/journal-culture.webp',
  '/images/journal-mustang.webp',
  '/images/journal-kathmandu.webp',
  '/images/region-central.webp',
  '/images/region-eastern.webp',
  '/images/region-western.webp',
]

/* Deterministic 3-image set per itinerary day, so the auto-slider inside
   an accordion never repeats the same photo twice in a row. */
function galleryFor(index, alt) {
  return [0, 1, 2].map((offset) => {
    const image = GALLERY[(index * 3 + offset * 5) % GALLERY.length]
    return { src: image, alt: `${alt} — trail photography ${offset + 1}` }
  })
}

/* ---------- Authors ---------- */

export const tripAuthors = {
  pemba: {
    name: 'Pemba Dorjee Sherpa',
    role: 'Lead mountain guide · 19 Himalayan seasons',
    initials: 'PS',
  },
  anita: {
    name: 'Anita Gurung',
    role: 'Head of trip design · Kathmandu',
    initials: 'AG',
  },
  james: {
    name: 'James Whitfield',
    role: 'Route editor · Hike Globally Journal',
    initials: 'JW',
  },
}

/* ---------- Shared building blocks ---------- */

const baseIncludes = [
  'Airport pick-up and drop-off in Kathmandu by private vehicle',
  'All national park fees, TIMS cards and restricted-area permits',
  'Two Hike Globally leaders — never more than four travellers per guide',
  'Government-licensed porters (one for every two travellers, insured and fairly paid)',
  'All lodge accommodation on the trail, twin-share, in hand-picked family-run houses',
  'Three meals a day on trek — breakfast, lunch, dinner and unlimited tea',
  'Domestic flights and ground transport inside Nepal as per the itinerary',
  'Daily pulse-oximeter altitude checks and a guide-carried medical kit',
  'Supplementary oxygen and a satellite communicator on every departure',
  'Duffel bag, trekking poles and a down jacket on loan for the trek',
  'Farewell dinner in Kathmandu with your crew',
  'A measured carbon offset for your international and domestic flights',
]

const baseExcludes = [
  'International flights to and from Kathmandu',
  'Nepal entry visa (USD 50 for 30 days, issued on arrival)',
  'Travel and medical insurance — mandatory, and must cover helicopter evacuation',
  'Accommodation in Kathmandu beyond the nights listed in the itinerary',
  'Lunches and dinners in Kathmandu, other than the farewell dinner',
  'Hot showers, battery charging and Wi-Fi in trail lodges (USD 2–6 each)',
  'Bottled or boiled drinking water on the trail',
  'Alcoholic and bottled drinks, snacks and personal shopping',
  'Personal trekking gear and clothing not listed as loan equipment',
  'Emergency evacuation, rescue and any costs arising from early descent',
  'Tips for your guides and porters (we suggest 8–10% of the trip price)',
  'Anything not explicitly listed in the “What’s included” column',
]

const basePacking = [
  {
    title: 'Layering system',
    note: 'Three layers, worn in rotation',
    items: [
      'Two merino or synthetic base layers (long sleeve)',
      'Lightweight fleece or grid-fleece mid layer',
      '600–800 fill down jacket (loaned free of charge)',
      'Waterproof, breathable shell jacket and over-trousers',
      'Two pairs of trekking trousers, one softshell',
    ],
  },
  {
    title: 'Footwear & traction',
    note: 'Break everything in before you fly',
    items: [
      'Mid-weight waterproof boots with ankle support',
      'Four pairs of merino trekking socks, one thick pair for lodges',
      'Camp shoes or down booties for the evenings',
      'Microspikes for early-spring and late-autumn departures',
      'Gaiters for the higher, dustier sections',
    ],
  },
  {
    title: 'Sleep, sun & safety',
    note: 'The five things people forget',
    items: [
      'Sleeping bag rated to −10 °C (hire available in Kathmandu)',
      'Category 4 glacier sunglasses and a spare pair',
      'SPF 50 sunscreen and SPF lip balm',
      'Headtorch with fresh batteries and a power bank (20,000 mAh)',
      'Personal medication, blister kit and rehydration salts',
    ],
  },
  {
    title: 'Documents & small kit',
    note: 'Keep these in your daypack, not your duffel',
    items: [
      'Passport with six months validity and four passport photos',
      'Insurance certificate with helicopter-evacuation cover',
      'USD in small notes for tips, showers and charging',
      '1 L bottle plus a 2 L bladder, and water purification tablets',
      'Quick-dry towel, wet wipes and a reusable cup',
    ],
  },
]

const baseFaqs = [
  {
    q: 'Do I need previous trekking experience?',
    a: 'No technical experience is required — this is a walking journey, not a climb. What matters is that you can walk for five to six hours on consecutive days over uneven ground. We recommend three months of preparation: two long hill walks a week with a loaded daypack, plus regular cardio. Your leaders set the pace to the slowest comfortable walker in the group, always.',
  },
  {
    q: 'How do you handle altitude and acclimatisation?',
    a: 'Every itinerary is built around the “climb high, sleep low” principle, with dedicated acclimatisation days written into the route rather than bolted on. Your guides take pulse-oximeter readings each morning and evening, carry supplementary oxygen and a satellite communicator, and have the authority to change the plan the moment a reading or a symptom says so.',
  },
  {
    q: 'What is the group size and who will I be walking with?',
    a: 'A maximum of eight travellers with two leaders — a guide-to-traveller ratio of one to four. Most departures run with four to six people, typically aged between 28 and 65, from six or seven different countries. Solo travellers make up roughly half of every group, and there is no single supplement on the trail.',
  },
  {
    q: 'What happens if the weather closes in or a flight is cancelled?',
    a: 'Mountain flights are weather-dependent, so we build a contingency day into every Himalayan itinerary. If the window stays shut, we re-route by helicopter or by road at our cost where the itinerary allows. Your leaders make that call with the operations desk in Kathmandu, and you will always be told what is happening and why.',
  },
  {
    q: 'Can I book privately, or as a family?',
    a: 'Yes. Any departure on the calendar can be taken privately on your own dates with the same leaders and the same inclusions — private journeys are typically 15–20% more per person for a group of four. Families are very welcome; we adjust daily distances and add rest days for younger walkers.',
  },
  {
    q: 'What is your cancellation and deposit policy?',
    a: 'A 20% deposit confirms your place, and the balance is due 45 days before departure. Cancel more than 60 days out and the deposit converts to a credit valid for two years. Inside 60 days we refund on a sliding scale, and if we cancel a departure for any reason you receive a full refund or a free transfer.',
  },
  {
    q: 'Is drinking water safe, and what about food on the trail?',
    a: 'Never drink untreated water. We provide purification tablets and every lodge sells boiled water; the trail also has filtered refill stations at most villages. Food is ordered from the lodge menu and is included — dal bhat, noodles, soups, eggs, porridge and pasta. Vegetarian, vegan, gluten-free and halal diets are all straightforward with notice.',
  },
]

/* ---------- Default page content, composed from the trip record ---------- */

function buildDefault(trip) {
  const region = trip.destination
  const days = trip.durationDays

  /* An honest six-stage arc for any journey: arrive, ascend, acclimatise,
     the high point, the descent, and the return. */
  const stages = [
    {
      day: 'Day 01',
      title: 'Arrive in Kathmandu',
      altitude: '1,400 m / 4,593 ft',
      trekDuration: 'No walking — transfer only',
      accommodation: 'Boutique heritage hotel, Kathmandu',
      meals: 'Welcome dinner',
      body: [
        'Your guide meets you in the arrivals hall at Tribhuvan International and drives you through the late-afternoon traffic to a quiet courtyard hotel a few streets back from the noise of Thamel. There is nothing to do today but sleep off the flight.',
        `In the evening we run the trip briefing over dinner: the route, the weather picture for your dates, the altitude plan, and a gear check that quietly sorts out anything missing. Whatever you are short of, it can be bought or hired within a ten-minute walk.`,
      ],
    },
    {
      day: 'Day 02',
      title: `Transfer to the ${region} trailhead`,
      altitude: '2,600 m / 8,530 ft',
      trekDuration: '3–4 hours walking',
      accommodation: 'Family-run mountain lodge',
      meals: 'Breakfast, lunch, dinner',
      body: [
        `An early start gets us out of the valley and into the ${region} approach before the cloud builds. The first walking day is deliberately short — a stone path through terraced fields and pine, a suspension bridge or two, and a river running loud below you.`,
        'You arrive at the lodge with daylight to spare. Tea on the terrace, an hour to sort your duffel, and the first of many plates of dal bhat.',
      ],
    },
    {
      day: `Day ${String(Math.max(3, Math.round(days * 0.28))).padStart(2, '0')}`,
      title: 'The climb into the high country',
      altitude: '3,450 m / 11,318 ft',
      trekDuration: '5–6 hours walking',
      accommodation: 'Family-run mountain lodge',
      meals: 'Breakfast, lunch, dinner',
      body: [
        'Today the trail earns its altitude. A long, steady staircase of stone and root lifts you out of the forest belt, and the vegetation thins with every switchback until you are walking in juniper and open rock.',
        `The reward is the first full horizon of the ${region} range — peaks that were rumours this morning are now a wall across the north. Your leaders will stop you often, not because the pace is hard, but because arriving slowly is how you arrive at all.`,
      ],
    },
    {
      day: `Day ${String(Math.round(days * 0.45)).padStart(2, '0')}`,
      title: 'Acclimatisation day',
      altitude: '3,900 m / 12,795 ft',
      trekDuration: '3 hours, climb high and sleep low',
      accommodation: 'Family-run mountain lodge',
      meals: 'Breakfast, lunch, dinner',
      body: [
        'A rest day that is not a day off. We climb 400 metres above the village after breakfast, spend an hour on a ridge with the whole valley underneath, and walk back down to sleep at the altitude we slept at last night. It is the single most effective thing we do for your summit day.',
        'The afternoon is yours: a bakery, a monastery courtyard, a hot shower, or a long, uninterrupted nap. Your guide takes oximeter readings before dinner and talks each one through with you.',
      ],
    },
    {
      day: `Day ${String(Math.round(days * 0.66)).padStart(2, '0')}`,
      title: trip.highlight,
      altitude: trip.elevation,
      trekDuration: '6–8 hours, the big day',
      accommodation: 'High mountain lodge',
      meals: 'Breakfast, packed lunch, dinner',
      body: [
        `This is the day the trip is built around. ${trip.highlight} — and everything before it has been preparation for standing here with enough breath left to take it in.`,
        'We start in the dark to be in position for first light, walk slowly and deliberately, and keep the group together. Expect it to be cold, bright and completely silent except for your own breathing and the wind moving over the ridge.',
      ],
    },
    {
      day: `Day ${String(days - 1).padStart(2, '0')}`,
      title: 'Descend and return to Kathmandu',
      altitude: '1,400 m / 4,593 ft',
      trekDuration: '4–5 hours, then transfer',
      accommodation: 'Boutique heritage hotel, Kathmandu',
      meals: 'Breakfast, farewell dinner',
      body: [
        'Going down is faster and stranger than you expect. Colour comes back into the landscape, the air thickens, and by mid-morning you are walking in a t-shirt through villages that felt impossibly high a week ago.',
        'Back in Kathmandu there is a hot shower, a change of clothes, and a farewell dinner with your leaders and the crew who carried the trip. Certificates, photographs, and the beginning of the conversation about where you go next.',
      ],
    },
  ]

  return {
    author: tripAuthors.pemba,
    published: 'March 4, 2026',
    updated: 'September 18, 2026',
    readingTime: '12 min read',
    excerpt: `${trip.description} Over ${trip.duration.toLowerCase()} you will walk between ${trip.seasons.join(', ').toLowerCase()} skies with two local leaders, a group of never more than eight, and every permit, lodge and altitude check already handled. This is the complete, honest guide to the route — what each day asks of you, what it gives back, and exactly what you are paying for.`,
    highlights: [
      `${trip.highlight} — the single image everyone carries home`,
      `${trip.duration} on the trail, topping out at ${trip.elevation}`,
      `Graded ${trip.difficulty.toLowerCase()}, with acclimatisation days built into the route`,
      'Two Hike Globally leaders and a maximum of eight travellers per departure',
      'Hand-picked family-run lodges, chosen on foot and revisited every season',
      'Every permit, park fee and internal transfer handled before you arrive',
      `Best walked in ${trip.prime.toLowerCase()} — departures from ${trip.departures}`,
      'Daily oximeter checks, supplementary oxygen and a satellite communicator carried',
    ],
    overview: [
      `${trip.title} is ${trip.description.charAt(0).toLowerCase()}${trip.description.slice(1, -1)} — and it remains one of the ${region} region's most complete walking journeys. Over ${trip.duration.toLowerCase()} the route climbs from valley farmland to ${trip.elevation}, crossing four distinct ecological bands in the space of a week: terraced rice, rhododendron and oak forest, juniper and yak pasture, and finally the bare moraine and ice of the high Himalaya.`,
      `We grade it ${trip.difficulty.toLowerCase()}. In practice that means five to seven hours of walking on most days, on stone paths and glacial moraine rather than technical ground, with two dedicated acclimatisation days written into the schedule. No ropes, no crampons, no prior mountaineering — but real, sustained days at altitude that reward anyone who trains for them.`,
      `What separates this departure from the same line drawn on any other map is who walks it with you. Our leaders are from these valleys. They know which lodge has the warm room, which pass holds ice into May, and which family serves the best dal bhat between the trailhead and the top. They are paid year-round, insured, and have walked this route dozens of times in every kind of weather.`,
      `The ${trip.prime.toLowerCase()} window is the prime season, with stable mornings, long visibility and cold, clear nights. Shoulder departures are quieter and often more beautiful, at the cost of shorter weather windows. Whichever dates you choose, the group stays small, the pace stays yours, and the mountain sets the timetable.`,
    ],
    essentialInfo: [
      {
        title: 'Fitness and preparation',
        body: [
          `A ${trip.difficulty.toLowerCase()} grade means consecutive days of five to seven hours on foot, carrying only a daypack of five to seven kilograms. Start preparing twelve weeks out: two hill walks a week building to four hours with a loaded pack, plus two cardio sessions and one strength session focused on legs, core and ankles.`,
          'If you can walk for six hours in the hills, sleep, and do it again the next morning without dread, you are ready for this route. Age is a poor predictor — our oldest traveller on this trip was 74, and finished it strongly.',
        ],
      },
      {
        title: 'Altitude and health',
        body: [
          `The route tops out at ${trip.elevation}. Mild headaches, broken sleep and a reduced appetite are normal at these heights; persistent vomiting, breathlessness at rest, or loss of coordination are not, and mean immediate descent. Your leaders take oximeter readings twice daily and log them.`,
          'Talk to your doctor about acetazolamide before you travel, bring any personal medication in your hand luggage, and tell us about every condition on your booking form — asthma, diabetes, heart conditions and recent surgery are all manageable with notice, and dangerous without it.',
        ],
      },
      {
        title: 'Visas, permits and insurance',
        body: [
          'Most nationalities receive a Nepal visa on arrival at Kathmandu: USD 50 for 30 days, payable in cash, with a passport valid for six months and one photograph. We arrange every trekking permit, national park fee and restricted-area document for you.',
          'Travel insurance covering trekking to at least 6,000 m and helicopter evacuation is mandatory — no exceptions, and we check the certificate before you fly. We will send a list of insurers our travellers rate highly when you book.',
        ],
      },
      {
        title: 'Money, connectivity and tipping',
        body: [
          'Carry USD 250–400 in small notes for tips, hot showers, charging, snacks and drinks on the trail. ATMs stop at the last road-head town, so draw cash in Kathmandu. Cards are useless above the trailhead.',
          'A local SIM covers much of the lower route; above that, lodges sell Wi-Fi vouchers of variable quality and your guide carries a satellite communicator for anything urgent. We suggest tipping 8–10% of the trip price, pooled and shared with the whole crew at the farewell dinner.',
        ],
      },
      {
        title: 'Responsible travel on this route',
        body: [
          'We cap group size at eight, carry out every piece of non-biodegradable waste, use refill stations instead of bottled water, and keep porter loads within the 20 kg limit set by the International Porter Protection Group. Our crews are insured for altitude, equipped with the same jackets and boots we lend you, and paid above the regional standard.',
          'Roughly 2% of every booking funds the schools and health posts in the valleys this trail passes through, and each flight on your itinerary is carbon-offset through a verified Nepali cookstove programme.',
        ],
      },
    ],
    map: {
      image: '/images/trip-route-map.jpg',
      alt: `Illustrated route map of the ${trip.title} trek showing villages, altitudes and the daily trail`,
      caption: `${trip.title} — full route, overnight villages and altitude profile.`,
      legend: [
        { label: 'Trekking route', value: 'Dashed red line, walked daily' },
        { label: 'Overnight stops', value: 'Circled villages, all lodge-based' },
        { label: 'High point', value: trip.elevation },
        { label: 'Total distance', value: `${Math.round(days * 9.5)} km on foot` },
      ],
    },
    stages,
  }
}

/* ---------- Hand-written flagship copy ---------- */

const overrides = {
  'everest-base-camp': {
    author: tripAuthors.pemba,
    published: 'February 11, 2026',
    updated: 'September 22, 2026',
    readingTime: '14 min read',
    excerpt:
      'Fifteen days on the most storied trail in the Himalaya — from the airstrip at Lukla through the Sherpa capital of Namche Bazaar, past Tengboche monastery, and up the Khumbu glacier to 5,364 m at the foot of Everest. This is the complete route guide: every day, every altitude, every night’s lodge, and exactly what your money buys.',
    highlights: [
      'Stand at 5,364 m at Everest Base Camp, with the Khumbu Icefall breaking directly above you',
      'Sunrise from Kala Patthar (5,545 m) — Everest, Nuptse and Pumori lit from the side in ten unforgettable minutes',
      'Two nights in Namche Bazaar, the Sherpa capital hanging in cloud at 3,440 m',
      'Dawn puja at Tengboche monastery beneath the fluted summit of Ama Dablam',
      'The Hillary–Tenzing airstrip at Lukla, one of the great arrivals in mountaineering',
      'Two full acclimatisation days written into the route — not sold as an optional extra',
      'Maximum eight travellers, two leaders, one guide for every four walkers',
      'Every permit, lodge, internal flight and daily altitude check handled end to end',
    ],
    overview: [
      'Everest Base Camp is the trail everything else is measured against. It is not the hardest walk in Nepal, nor the most remote — the Manaslu Circuit is both — but nowhere else puts you inside the machinery of the world’s highest mountain the way this route does. You walk up a valley that has been a trading corridor for six hundred years, through villages that produced the greatest high-altitude climbers alive, and stop at the exact patch of moraine where every Everest expedition since 1953 has pitched its tents.',
      'The route follows the Dudh Koshi north from the airstrip at Lukla (2,840 m), climbing through pine and rhododendron to Namche Bazaar (3,440 m), then east along the flank of the valley to Tengboche (3,867 m) and up into the dry, thin country above the treeline: Dingboche (4,410 m), Lobuche (4,940 m), Gorak Shep (5,164 m). Base Camp itself sits at 5,364 m, a two-hour walk over the lateral moraine of the Khumbu glacier. Most people find the walk to Kala Patthar the following morning harder and more rewarding than Base Camp itself.',
      'We grade it challenging, and we mean it. There is nothing technical — no ropes, no crampons, no exposure worth the name — but you will spend eight consecutive nights above 3,400 m and walk five to seven hours a day on stone. Altitude, not gradient, is the difficulty. That is why our itinerary is fifteen days and not eleven: two dedicated acclimatisation days at Namche and Dingboche, and a contingency day built in before the Lukla flight home.',
      'What you are actually buying is the team. Our Khumbu leaders grew up between Lukla and Pheriche; several have summited Everest, and all of them are paid year-round rather than per trip. They know which lodges heat their rooms, which stretch of the moraine ices over first, and how to tell the difference between someone who is tired and someone who needs to go down. On a trail this busy, that knowledge is the entire difference between a queue and a journey.',
    ],
    stages: [
      {
        day: 'Day 01',
        title: 'Arrive in Kathmandu (1,400 m)',
        altitude: '1,400 m / 4,593 ft',
        trekDuration: 'No walking — airport transfer only',
        accommodation: 'Hotel Shanker or Dwarika’s, Kathmandu',
        meals: 'Welcome dinner',
        body: [
          'Your guide meets you inside the arrivals hall at Tribhuvan International and drives you to a quiet courtyard hotel three streets back from Thamel. The rest of the afternoon is deliberately empty — jet lag is the first altitude you have to deal with.',
          'At six we run the trip briefing over dinner: the weather picture for your specific dates, the altitude plan day by day, the Lukla flight schedule, and a gear check. Anything you are missing can be bought or hired within a ten-minute walk, and your guide will come with you.',
        ],
      },
      {
        day: 'Day 02',
        title: 'Fly to Lukla, trek to Phakding',
        altitude: '2,610 m / 8,563 ft',
        trekDuration: '3–4 hours walking',
        accommodation: 'Sunrise Lodge, Phakding',
        meals: 'Breakfast, lunch, dinner',
        body: [
          'A pre-dawn drive to the airport and a 35-minute flight over the foothills, with the whole eastern range filling the left-hand windows. The landing at Lukla — uphill, onto a 527-metre strip cut into the mountainside — is the most memorable thirty seconds of the trip.',
          'From the airstrip the trail drops gently north through Chaurikharka and Ghat, following the Dudh Koshi downstream. It is an easy first day on purpose: stone paths, mani walls, the first suspension bridge, and prayer flags strung across the river. You reach Phakding by mid-afternoon with time for tea on the terrace.',
        ],
      },
      {
        day: 'Day 03',
        title: 'Phakding to Namche Bazaar',
        altitude: '3,440 m / 11,286 ft',
        trekDuration: '6 hours walking',
        accommodation: 'Panorama Lodge, Namche Bazaar',
        meals: 'Breakfast, lunch, dinner',
        body: [
          'The day the trek begins properly. Five river crossings lead to the Sagarmatha National Park checkpoint at Monjo, then the high Hillary Bridge — a 125-metre span strung with flags above the confluence — and immediately after it, the Namche hill.',
          'That climb is 600 metres of relentless switchbacks through pine forest, and it takes most people two and a half hours. Halfway up, if the cloud allows, you get your first sight of Everest itself: a dark triangle of rock behind the Lhotse–Nuptse wall. Namche appears suddenly, a horseshoe of blue roofs built into the bowl of the mountain.',
        ],
      },
      {
        day: 'Day 04',
        title: 'Acclimatisation day in Namche',
        altitude: '3,880 m high point, sleep at 3,440 m',
        trekDuration: '3–4 hours, climb high sleep low',
        accommodation: 'Panorama Lodge, Namche Bazaar',
        meals: 'Breakfast, lunch, dinner',
        body: [
          'A rest day that involves walking, because that is what actually works. After breakfast we climb to the Everest View Hotel at 3,880 m — an hour of steady uphill for one of the finest breakfast terraces on earth, with Everest, Lhotse and Ama Dablam laid out in a single frame.',
          'We come back down through Khumjung village, where Hillary built the first school in the Khumbu in 1961, and drop into the monastery there. The afternoon is yours: the Saturday market, the Sherpa Culture Museum, a bakery, or a very long nap. Oximeter readings before dinner, and your guide talks each one through with you.',
        ],
      },
      {
        day: 'Day 05',
        title: 'Namche to Tengboche',
        altitude: '3,867 m / 12,687 ft',
        trekDuration: '5–6 hours walking',
        accommodation: 'Tashi Delek Lodge, Tengboche',
        meals: 'Breakfast, lunch, dinner',
        body: [
          'A contouring trail along the valley wall with Ama Dablam directly ahead for two hours — arguably the most beautiful stretch of the entire route. The path then drops 600 metres to the river at Phunki Tenga, and climbs the same again through rhododendron to the monastery.',
          'Tengboche is the spiritual centre of the Khumbu, rebuilt after the 1989 fire, and you can attend the late-afternoon puja: drums, horns, butter lamps and forty monks chanting in a room that smells of juniper smoke. Outside, the last light goes up Ama Dablam’s south-west face.',
        ],
      },
      {
        day: 'Day 07',
        title: 'Dingboche and the Chhukung ridge',
        altitude: '4,410 m / 14,468 ft',
        trekDuration: '5 hours walking, plus a 2-hour acclimatisation climb',
        accommodation: 'Snow Lion Lodge, Dingboche',
        meals: 'Breakfast, lunch, dinner',
        body: [
          'Above Pangboche the last trees give up and the valley opens into a wide, dry, stone-walled basin. Dingboche sits in the middle of it at 4,410 m, a village of potato fields and windbreaks with Island Peak closing the far end of the valley.',
          'The second acclimatisation day is here. We climb the ridge above the village to 4,900 m — ninety minutes up, thirty down — and come back to sleep low. From the top you see Makalu, the world’s fifth-highest peak, appear over the eastern skyline. Nights here are genuinely cold: −10 °C inside an unheated room is normal.',
        ],
      },
      {
        day: 'Day 09',
        title: 'Lobuche to Gorak Shep',
        altitude: '5,164 m / 16,942 ft',
        trekDuration: '4–5 hours walking',
        accommodation: 'Buddha Lodge, Gorak Shep',
        meals: 'Breakfast, lunch, dinner',
        body: [
          'A short day by distance and a hard one by altitude. The trail climbs onto the lateral moraine of the Khumbu glacier and follows it north, the ice creaking and shifting somewhere underneath the rubble beside you.',
          'We pass the Thukla memorials — stone cairns and plaques for climbers lost on Everest, including Scott Fischer and Babu Chiri Sherpa — and the tone of the walk changes there. Gorak Shep is the last settlement: five lodges on the sand of a frozen lakebed at 5,164 m, with Pumori standing directly over it.',
        ],
      },
      {
        day: 'Day 10',
        title: 'Everest Base Camp (5,364 m)',
        altitude: '5,364 m / 17,598 ft',
        trekDuration: '7–8 hours return',
        accommodation: 'Buddha Lodge, Gorak Shep',
        meals: 'Breakfast, packed lunch, dinner',
        body: [
          'Three hours over the moraine, boulder to boulder, with the Khumbu glacier on your right the whole way. In spring the tent city appears long before you reach it, a scatter of yellow and orange on the ice below the icefall; in autumn the site is empty and the silence is total.',
          'You stand at 5,364 metres with the Khumbu Icefall breaking directly above you — a frozen cataract of seracs the size of buildings, audible as it moves. Everest’s summit is not visible from here, and it does not matter in the slightest. We spend forty minutes at the boulder, take the photographs that will be on your wall for the next twenty years, and walk back to Gorak Shep in the afternoon light.',
        ],
      },
      {
        day: 'Day 11',
        title: 'Sunrise on Kala Patthar, descend to Pheriche',
        altitude: '5,545 m / 18,192 ft high point',
        trekDuration: '8 hours, starting at 4 a.m.',
        accommodation: 'Himalayan Lodge, Pheriche',
        meals: 'Breakfast, lunch, dinner',
        body: [
          'A 4 a.m. start in the dark and the cold for the best viewpoint in the Khumbu. Kala Patthar is a black rock shoulder of Pumori, 400 metres above Gorak Shep, and it takes between ninety minutes and two and a half hours depending on how the altitude is treating you.',
          'At the top, at 5,545 m, you get the whole south face of Everest with the sun coming across it — the one angle where the mountain reads as the highest thing on earth rather than just another peak in the wall. Ten minutes later the light flattens and it is gone. Then a long, steady, oxygen-rich descent to Pheriche, where you will sleep better than you have in a week.',
        ],
      },
      {
        day: 'Day 14',
        title: 'Fly to Kathmandu, farewell dinner',
        altitude: '1,400 m / 4,593 ft',
        trekDuration: 'Morning flight, then free time',
        accommodation: 'Hotel Shanker or Dwarika’s, Kathmandu',
        meals: 'Breakfast, farewell dinner',
        body: [
          'The early flight out of Lukla, back over the foothills, and into a city that will feel loud, warm and impossibly full of oxygen. A hot shower, clean clothes, and an afternoon to wander Patan Durbar Square or simply sit still.',
          'In the evening we eat together with the guides and porters who carried the trip: certificates, a slideshow of the week, and the inevitable conversation about which trail you are walking next. Day 15 is your departure day, with a transfer to the airport whenever your flight leaves.',
        ],
      },
    ],
  },
}

/* ---------- Public API ---------- */

export function getTripPageContent(slug) {
  const trip = getTripBySlug(slug)
  if (!trip) return null

  const base = buildDefault(trip)
  const override = overrides[slug] || {}
  const content = {
    ...base,
    ...override,
    includes: override.includes || baseIncludes,
    excludes: override.excludes || baseExcludes,
    packing: override.packing || basePacking,
    faqs: override.faqs || baseFaqs,
  }

  /* Attach the deterministic 3-image slider set to every itinerary day. */
  content.itinerary = content.stages.map((stage, index) => ({
    ...stage,
    id: `${slug}-day-${index}`,
    images: galleryFor(index, `${trip.title}, ${stage.title}`),
  }))

  content.outline = content.itinerary.map((stage) => ({
    id: stage.id,
    day: stage.day,
    title: stage.title,
    altitude: stage.altitude,
    trekDuration: stage.trekDuration,
  }))

  return { trip, ...content }
}

/* ---------- Departure calendar ---------- */

const MONTH_INDEX = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/* Tiny deterministic hash so a given trip + date always resolves to the same
   status and price — no random re-renders between paints. */
function hash(input) {
  let value = 0
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) >>> 0
  }
  return value
}

export function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Departure dates for a trip, keyed by ISO date, for 24 months from today.
 * Departure months come from the trip record (`departures: 'Mar · Apr · Oct · Nov'`).
 */
export function buildDepartures(trip, from = new Date()) {
  if (!trip) return {}
  const months = trip.departures
    .split(/[·,/]/)
    .map((part) => MONTH_INDEX[part.trim().slice(0, 3).toLowerCase()])
    .filter((month) => month !== undefined)

  const departures = {}
  const startYear = from.getFullYear()

  for (let yearOffset = 0; yearOffset <= 2; yearOffset += 1) {
    const year = startYear + yearOffset
    months.forEach((month) => {
      /* Two or three departures a month, spaced across it. */
      const seed = hash(`${trip.id}-${year}-${month}`)
      const anchors = [3 + (seed % 5), 12 + (seed % 6), 21 + (seed % 6)]
      anchors.forEach((day, slot) => {
        const date = new Date(year, month, day)
        if (date < new Date(from.getFullYear(), from.getMonth(), from.getDate())) return
        const spotSeed = hash(`${trip.id}-${year}-${month}-${day}`)
        const spots = spotSeed % 9
        const status = spots === 0 ? 'sold-out' : spots <= 3 ? 'limited' : 'available'
        const premium = slot === 2 && month >= 8 && month <= 10
        departures[isoDate(year, month, day)] = {
          date: isoDate(year, month, day),
          status,
          spots: status === 'sold-out' ? 0 : spots + 1,
          price: premium ? Math.round(trip.price * 1.08) : trip.price,
          guaranteed: spots >= 6,
        }
      })
    })
  }

  return departures
}

export const COUNTRIES = [
  'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Czechia',
  'Denmark', 'Finland', 'France', 'Germany', 'Greece', 'Hong Kong SAR', 'Hungary',
  'India', 'Indonesia', 'Ireland', 'Israel', 'Italy', 'Japan', 'Malaysia', 'Mexico',
  'Nepal', 'Netherlands', 'New Zealand', 'Norway', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'Thailand', 'Türkiye', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam',
]
