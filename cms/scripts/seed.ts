import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { ensurePostgresRunning } from './start-local-db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function seed() {
  console.log('--- Starting Payload CMS Seed ---')
  await ensurePostgresRunning()

  const payload = await getPayload({ config })

  // 1. Admin User
  console.log('1. Checking admin user...')
  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: 'admin@hikeglobally.com' } },
  })

  if (existingUsers.totalDocs === 0) {
    console.log('Creating default administrator (admin@hikeglobally.com)...')
    await payload.create({
      collection: 'users',
      data: {
        name: 'Hike Globally Admin',
        email: 'admin@hikeglobally.com',
        password: 'password123',
        role: 'admin',
      },
    })
    console.log('Admin user created successfully.')
  } else {
    console.log('Admin user already exists.')
  }

  // 2. Categories
  console.log('2. Seeding categories...')
  const categoriesData = [
    { name: 'Trek', slug: 'trek', type: 'trip', description: 'Classic and remote mountain trails on foot.' },
    { name: 'Expedition', slug: 'expedition', type: 'trip', description: 'Demanding high-pass and high-peak Himalayan routes.' },
    { name: 'Cultural Tour', slug: 'cultural', type: 'trip', description: 'Heritage, temple courtyards and ancient valleys.' },
    { name: 'Family Guides', slug: 'family-guides', type: 'blog', description: 'Practical trekking advice for families and beginners.' },
    { name: 'Travel Guides', slug: 'travel-guides', type: 'blog', description: 'Route planning, packing notes, and preparation.' },
    { name: 'Culture', slug: 'culture', type: 'blog', description: 'Living heritage, architecture, and traditions.' },
    { name: 'Field Notes', slug: 'field-notes', type: 'blog', description: 'Dispatches, porter stories, and high-altitude accounts.' },
  ]

  const categoryMap: Record<string, any> = {}
  for (const cat of categoriesData) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
    })

    if (existing.totalDocs === 0) {
      const created = await payload.create({
        collection: 'categories',
        data: cat as any,
      })
      categoryMap[cat.name] = created.id
      categoryMap[cat.slug] = created.id
    } else {
      categoryMap[cat.name] = existing.docs[0].id
      categoryMap[cat.slug] = existing.docs[0].id
    }
  }

  // 3. Destinations
  console.log('3. Seeding destinations...')
  const destinationsData = [
    {
      name: 'Far West',
      slug: 'far-west',
      number: '01',
      tile: 'far',
      size: 'feature',
      kicker: 'Kanjakali · Api Himal · Khaptad',
      description:
        'Nepal’s wildest edge — sacred peaks along the Mahakali, oak and rhododendron ridges above Khaptad, and villages that still set their week by the market drum. Come for a solitude the trails have never sold.',
      imageUrl: '/images/region-far-west.webp',
      imagePosition: 'center 42%',
      bestTimeToVisit: 'October to May',
      attractions: [
        { title: 'Khaptad National Park', description: 'Rolling moorlands and sacred ashram solitude.' },
        { title: 'Api Himal Base Camp', description: 'Wild untouched valleys rarely visited by tourists.' },
      ],
      _status: 'published',
    },
    {
      name: 'Mid-West',
      slug: 'mid-west',
      number: '02',
      tile: 'mid',
      size: 'standard',
      kicker: 'Rara · Phoksundo · Kanjiroba',
      description:
        'Turquoise Phoksundo and mirror-still Rara, held in the high desert valleys of Dolpo and Mugu.',
      imageUrl: '/images/region-mid-west.webp',
      imagePosition: 'center 48%',
      bestTimeToVisit: 'April to October',
      attractions: [
        { title: 'Shey Phoksundo Lake', description: 'Deepest turquoise alpine lake in Nepal.' },
        { title: 'Rara Lake', description: 'Nepal’s largest lake surrounded by pine and juniper forests.' },
      ],
      _status: 'published',
    },
    {
      name: 'Western',
      slug: 'western',
      number: '03',
      tile: 'west',
      size: 'standard',
      kicker: 'Annapurna · Dhaulagiri · Mustang',
      description:
        'The great ranges rise above Pokhara’s lake; beyond the rain line, wind-carved Mustang waits.',
      imageUrl: '/images/region-western.webp',
      imagePosition: 'center 45%',
      bestTimeToVisit: 'Year-round (Mustang rain shadow in Summer)',
      attractions: [
        { title: 'Annapurna Sanctuary', description: 'Glacial amphitheatre beneath 8,000 m giants.' },
        { title: 'Lo Manthang', description: 'Walled medieval capital of Upper Mustang.' },
      ],
      _status: 'published',
    },
    {
      name: 'Central',
      slug: 'central',
      number: '04',
      tile: 'cent',
      size: 'standard',
      kicker: 'Kathmandu · Langtang · Ganesh Himal',
      description:
        'Temple courtyards, Langtang’s green pastures and the foothills rolling south to the Terai.',
      imageUrl: '/images/region-central.webp',
      imagePosition: '42% 55%',
      bestTimeToVisit: 'March to May & September to November',
      attractions: [
        { title: 'Kyanjin Gompa', description: 'Yaks grazing below Langtang Lirung icefall.' },
        { title: 'Kathmandu Valley UNESCO Sites', description: 'Living courtyards, artisans, and shrines.' },
      ],
      _status: 'published',
    },
    {
      name: 'Eastern',
      slug: 'eastern',
      number: '05',
      tile: 'east',
      size: 'standard',
      kicker: 'Khumbu · Kanchenjunga · Ilam',
      description:
        'The Sherpa high road to Everest, Kanchenjunga’s glacial silence, and first light on the tea gardens of Ilam.',
      imageUrl: '/images/region-eastern.webp',
      imagePosition: 'center 46%',
      bestTimeToVisit: 'March to May & September to November',
      attractions: [
        { title: 'Everest Base Camp & Kala Patthar', description: 'Front-row panoramas of Mount Everest and Nuptse.' },
        { title: 'Gokyo Ri & Emerald Lakes', description: 'Six glacial lakes reflecting Cho Oyu.' },
      ],
      _status: 'published',
    },
  ]

  const destinationMap: Record<string, any> = {}
  for (const dest of destinationsData) {
    const existing = await payload.find({
      collection: 'destinations',
      where: { slug: { equals: dest.slug } },
      draft: true,
    })

    if (existing.totalDocs === 0) {
      const created = await payload.create({
        collection: 'destinations',
        data: dest as any,
      })
      destinationMap[dest.name] = created.id
      destinationMap[dest.slug] = created.id
    } else {
      destinationMap[dest.name] = existing.docs[0].id
      destinationMap[dest.slug] = existing.docs[0].id
    }
  }

  // 4. Trips
  console.log('4. Seeding trips...')
  const tripsData = [
    {
      title: 'Everest Base Camp',
      slug: 'everest-base-camp',
      location: 'Khumbu, Nepal',
      destinationName: 'Everest',
      destination: destinationMap['eastern'] || null,
      duration: '15 days',
      durationDays: 15,
      difficulty: 'Challenging',
      tripType: 'Trek',
      price: 1490,
      currency: 'USD',
      seasons: ['Spring', 'Autumn'],
      primeSeason: 'Autumn',
      departures: 'Mar · Apr · Oct · Nov',
      elevation: '5,364 m',
      highlight: 'First light on the icefall from the ridge above Gorak Shep',
      availability: '4 places in October',
      description: 'Follow the storied Khumbu trail through Sherpa villages to the foot of the world’s highest mountain.',
      shortDescription: 'The classic Khumbu pilgrimage to the foot of the highest peak on Earth.',
      imageUrl: '/images/trip-everest.webp',
      imagePosition: 'center 38%',
      alt: 'A trekker crossing a high Himalayan pass beneath snow-covered peaks',
      featured: true,
      itinerary: [
        { day: 1, title: 'Kathmandu to Lukla & Phakding', description: 'Scenic flight into Lukla airstrip, followed by gentle descent through pine and rhododendron along the Dudh Koshi river.', altitude: '2,610 m', accommodation: 'Local teahouse', meals: 'Lunch, Dinner' },
        { day: 2, title: 'Phakding to Namche Bazaar', description: 'Cross the Hillary suspension bridge and climb the pine-scented path into the bustling Sherpa capital.', altitude: '3,440 m', accommodation: 'Sherpa lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 3, title: 'Acclimatisation Day in Namche Bazaar', description: 'Hike to the Everest View Hotel for the first panorama of Everest, Ama Dablam, and Lhotse.', altitude: '3,880 m', accommodation: 'Sherpa lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 4, title: 'Namche Bazaar to Tengboche', description: 'Descend to Phunki Thenga then climb up through juniper forests to Tengboche Monastery.', altitude: '3,860 m', accommodation: 'Monastery lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 5, title: 'Tengboche to Dingboche', description: 'Walk above the tree line past carved mani stones into the Imja Valley.', altitude: '4,410 m', accommodation: 'Stone teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 6, title: 'Dingboche Acclimatisation Walk', description: 'Climb Nagarjun hill for magnificent vistas of Makalu and Island Peak.', altitude: '5,100 m', accommodation: 'Stone teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 7, title: 'Dingboche to Lobuche', description: 'Pass the poignant memorials at Thokla Pass and trek alongside the Khumbu Glacier moraine.', altitude: '4,940 m', accommodation: 'Glacier lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 8, title: 'Lobuche to Gorak Shep & Everest Base Camp', description: 'Reach Gorak Shep, drop packs, and push onto the Khumbu icefall at Everest Base Camp.', altitude: '5,364 m', accommodation: 'Gorak Shep teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 9, title: 'Kala Patthar Sunrise & Pheriche', description: 'Pre-dawn ascent of Kala Patthar for the unforgettable sunrise over Everest’s summit pyramid.', altitude: '5,545 m', accommodation: 'Valley lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 10, title: 'Pheriche to Namche Bazaar', description: 'Retrace steps with easy downhill breathing back to the warm bakeries of Namche.', altitude: '3,440 m', accommodation: 'Sherpa lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 11, title: 'Namche Bazaar to Lukla', description: 'Final day on trail alongside the river to celebrated finish in Lukla.', altitude: '2,840 m', accommodation: 'Lukla lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 12, title: 'Lukla to Kathmandu', description: 'Morning mountain flight back to Kathmandu and private transfer to heritage hotel.', altitude: '1,400 m', accommodation: 'Heritage hotel', meals: 'Breakfast' },
      ],
      inclusions: [
        { item: 'All domestic flights (Kathmandu - Lukla return)' },
        { item: 'Licensed Himalayan trek leader and porters (1:2 ratio)' },
        { item: 'Sagarmatha National Park permit & Khumbu Pasang Lhamu entry' },
        { item: 'All teahouse accommodation and mountain meals' },
        { item: 'Comprehensive medical kit and pulse oximeter' },
      ],
      exclusions: [
        { item: 'International airfare to Nepal' },
        { item: 'Travel insurance including high-altitude emergency evacuation' },
        { item: 'Personal bar bills and hot shower fees' },
      ],
      _status: 'published',
    },
    {
      title: 'Annapurna Sanctuary',
      slug: 'annapurna-sanctuary',
      location: 'Annapurna, Nepal',
      destinationName: 'Annapurna',
      destination: destinationMap['western'] || null,
      duration: '12 days',
      durationDays: 12,
      difficulty: 'Moderate',
      tripType: 'Trek',
      price: 1180,
      currency: 'USD',
      seasons: ['Spring', 'Autumn', 'Winter'],
      primeSeason: 'Spring',
      departures: 'Feb · Mar · Apr · Oct · Nov',
      elevation: '4,130 m',
      highlight: '360° amphitheatre of 8,000-metre giants at dawn',
      availability: '6 places in November',
      description: 'Journey into the heart of the Annapurnas, surrounded by an amphitheatre of snow-capped peaks.',
      shortDescription: 'Trek into the holy amphitheatre of Machapuchare and Annapurna I.',
      imageUrl: '/images/trip-annapurna.webp',
      imagePosition: 'center 44%',
      alt: 'Snow peaks towering over the Annapurna base camp valley',
      featured: true,
      itinerary: [
        { day: 1, title: 'Pokhara to Ghandruk', description: 'Drive to Nayapul and walk through slate-roofed Gurung villages.', altitude: '1,940 m', accommodation: 'Gurung lodge', meals: 'Lunch, Dinner' },
        { day: 2, title: 'Ghandruk to Chhomrong', description: 'Descend to Kimrong Khola and ascend the terraced steps of Chhomrong.', altitude: '2,170 m', accommodation: 'Valley teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 3, title: 'Chhomrong to Dovan', description: 'Trail winds through deep bamboo and rhododendron canopy.', altitude: '2,600 m', accommodation: 'Forest lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 4, title: 'Dovan to Machapuchare Base Camp', description: 'Emerge above the tree line into the gorge directly beneath Sacred Fish Tail.', altitude: '3,700 m', accommodation: 'Sanctuary lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 5, title: 'Machapuchare to Annapurna Base Camp', description: 'Early morning walk into the inner sanctuary surrounded by a full 360-degree crown of ice.', altitude: '4,130 m', accommodation: 'Base camp teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 6, title: 'Annapurna Base Camp to Bamboo', description: 'Sunrise over Annapurna South and gradual descent through the canyon.', altitude: '2,310 m', accommodation: 'Bamboo teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 7, title: 'Bamboo to Jhinu Danda Hot Springs', description: 'Reach Jhinu and soak tired muscles in the natural thermal river pools.', altitude: '1,780 m', accommodation: 'Riverside lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 8, title: 'Jhinu Danda to Pokhara', description: 'Final short trail to roadhead and lakeside return to Pokhara.', altitude: '820 m', accommodation: 'Lakeside hotel', meals: 'Breakfast, Lunch' },
      ],
      inclusions: [
        { item: 'Private transport Pokhara - trailhead return' },
        { item: 'Annapurna Conservation Area Project (ACAP) & TIMS permit' },
        { item: 'Experienced certified trekking guide and porter team' },
        { item: 'Teahouse accommodation and full board on trek' },
      ],
      exclusions: [
        { item: 'Personal travel insurance' },
        { item: 'Hot showers and Wi-Fi charges at lodges' },
      ],
      _status: 'published',
    },
    {
      title: 'Manaslu Circuit',
      slug: 'manaslu-circuit',
      location: 'Manaslu, Nepal',
      destinationName: 'Manaslu',
      destination: destinationMap['western'] || null,
      duration: '16 days',
      durationDays: 16,
      difficulty: 'Challenging',
      tripType: 'Trek',
      price: 1650,
      currency: 'USD',
      seasons: ['Spring', 'Autumn'],
      primeSeason: 'Autumn',
      departures: 'Apr · May · Sep · Oct',
      elevation: '5,106 m',
      highlight: 'Crossing the high Larkya La beneath the wall of Manaslu',
      availability: '2 places in October',
      description: 'The connoisseur’s circuit: wild river gorges, Tibetan culture, and the crossing of Larkya La.',
      shortDescription: 'Untouched Tibetan villages and the remote high-pass crossing of Larkya La.',
      imageUrl: '/images/trip-manaslu.webp',
      imagePosition: 'center 46%',
      alt: 'Prayer flags on a windswept high-altitude pass',
      featured: true,
      itinerary: [
        { day: 1, title: 'Kathmandu to Machha Khola', description: 'Drive along the Trishuli and steep Budi Gandaki gorge.', altitude: '870 m', accommodation: 'Riverside lodge', meals: 'Dinner' },
        { day: 2, title: 'Machha Khola to Jagat', description: 'Follow stone staircases and natural hot spring banks.', altitude: '1,340 m', accommodation: 'Stone teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 3, title: 'Jagat to Deng', description: 'Enter the restricted area with Tibetan prayer walls.', altitude: '1,860 m', accommodation: 'Village lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 4, title: 'Deng to Namrung', description: 'Climb through lush fir and pine forests with views of Siring Himal.', altitude: '2,630 m', accommodation: 'Alpine lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 5, title: 'Namrung to Samagaon', description: 'Open valley opens up beneath Mount Manaslu’s imposing ice face.', altitude: '3,530 m', accommodation: 'Tibetan teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 6, title: 'Acclimatisation Day at Samagaon', description: 'Visit Pungyen Gompa and Birendra Tal glacial lake.', altitude: '3,870 m', accommodation: 'Tibetan teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 7, title: 'Samagaon to Samdo', description: 'Short scenic walk towards the Tibetan border market route.', altitude: '3,860 m', accommodation: 'High teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 8, title: 'Samdo to Dharamsala', description: 'Climb to the base camp beneath Larkya Glacier.', altitude: '4,460 m', accommodation: 'High camp hut', meals: 'Breakfast, Lunch, Dinner' },
        { day: 9, title: 'Cross Larkya La to Bimthang', description: 'Pre-dawn traverse of Larkya La (5,106 m) into stunning Bimthang meadows.', altitude: '5,106 m', accommodation: 'Meadow lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 10, title: 'Bimthang to Dharapani & Return', description: 'Descent into Annapurna junction and drive to Kathmandu.', altitude: '1,860 m', accommodation: 'Hotel', meals: 'Breakfast, Lunch' },
      ],
      inclusions: [
        { item: 'Restricted Area Permit (RAP), MCAP and ACAP permits' },
        { item: 'Special government licensed guide and mountain crew' },
        { item: 'All teahouse accommodation and 3 meals daily' },
      ],
      exclusions: [
        { item: 'Emergency helicopter insurance' },
        { item: 'Tips and personal expenses' },
      ],
      _status: 'published',
    },
    {
      title: 'Upper Mustang Passage',
      slug: 'upper-mustang-passage',
      location: 'Mustang, Nepal',
      destinationName: 'Mustang',
      destination: destinationMap['western'] || null,
      duration: '14 days',
      durationDays: 14,
      difficulty: 'Moderate',
      tripType: 'Trek',
      price: 2150,
      currency: 'USD',
      seasons: ['Spring', 'Summer', 'Autumn'],
      primeSeason: 'Summer',
      departures: 'May · Jun · Jul · Aug · Sep · Oct',
      elevation: '3,840 m',
      highlight: 'The red clay cliffs and sky caves of the walled kingdom of Lo',
      availability: '3 places in September',
      description: 'Step into the forbidden kingdom of Lo — wind-carved canyons, red cliffs and medieval monasteries.',
      shortDescription: 'Cross into the trans-Himalayan rain shadow to the walled city of Lo Manthang.',
      imageUrl: '/images/trip-mustang.webp',
      imagePosition: 'center 40%',
      alt: 'Red and ochre cliffs of Upper Mustang with ancient cave dwellings',
      featured: true,
      itinerary: [
        { day: 1, title: 'Pokhara to Jomsom & Kagbeni', description: 'Mountain flight between Annapurna and Dhaulagiri into the Kali Gandaki valley.', altitude: '2,810 m', accommodation: 'Fortress lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 2, title: 'Kagbeni to Chele', description: 'Cross into restricted Upper Mustang, walking past red sandstone cliffs.', altitude: '3,050 m', accommodation: 'Traditional teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 3, title: 'Chele to Syangboche', description: 'Cross Taklam La with views of Tilicho and Damodar peaks.', altitude: '3,800 m', accommodation: 'Lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 4, title: 'Syangboche to Ghami', description: 'Pass the longest mani wall in Mustang and bright red cliffs.', altitude: '3,520 m', accommodation: 'Village lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 5, title: 'Ghami to Tsarang', description: 'Visit the 5-story white palace and 14th-century monastery.', altitude: '3,560 m', accommodation: 'Old royal lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 6, title: 'Tsarang to Lo Manthang', description: 'First view of the walled city of Lo across the desert plateau.', altitude: '3,840 m', accommodation: 'Traditional inn', meals: 'Breakfast, Lunch, Dinner' },
        { day: 7, title: 'Explore Lo Manthang & Sky Caves', description: 'Chhoser cave dwellings, Namgyal Gompa, and King’s palace.', altitude: '3,900 m', accommodation: 'Traditional inn', meals: 'Breakfast, Lunch, Dinner' },
        { day: 8, title: 'Lo Manthang to Dhakmar', description: 'Walk past fairy-tale red cliffs carved by wind.', altitude: '3,820 m', accommodation: 'Village teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 9, title: 'Dhakmar to Jomsom & Pokhara', description: 'Complete the loop and fly back to Pokhara.', altitude: '820 m', accommodation: 'Hotel', meals: 'Breakfast, Lunch' },
      ],
      inclusions: [
        { item: 'Upper Mustang Restricted Area Permit ($500 per person value)' },
        { item: 'Return mountain flights Pokhara - Jomsom' },
        { item: 'Experienced cultural guide and luggage transfers' },
        { item: 'All lodge stays and organic trail meals' },
      ],
      exclusions: [
        { item: 'International travel and visas' },
        { item: 'Horse rental if desired' },
      ],
      _status: 'published',
    },
    {
      title: 'Langtang Valley',
      slug: 'langtang-valley',
      location: 'Langtang, Nepal',
      destinationName: 'Langtang',
      destination: destinationMap['central'] || null,
      duration: '10 days',
      durationDays: 10,
      difficulty: 'Moderate',
      tripType: 'Trek',
      price: 990,
      currency: 'USD',
      seasons: ['Spring', 'Autumn', 'Winter'],
      primeSeason: 'Autumn',
      departures: 'Mar · Apr · May · Oct · Nov',
      elevation: '4,773 m',
      highlight: 'Morning prayer bells echoing across the Kyanjin glacial basin',
      availability: 'Open departures',
      description: 'The valley of glaciers — close to Kathmandu, deeply Tibetan, and rebuilt with extraordinary spirit.',
      shortDescription: 'Quiet yak pastures and icefall views close to the capital.',
      imageUrl: '/images/trip-langtang.webp',
      imagePosition: 'center 42%',
      alt: 'Yaks grazing in an alpine valley beneath Langtang Lirung',
      featured: false,
      itinerary: [
        { day: 1, title: 'Kathmandu to Syabrubesi', description: 'Scenic drive through terraced hills and Trishuli valley.', altitude: '1,460 m', accommodation: 'Riverside lodge', meals: 'Dinner' },
        { day: 2, title: 'Syabrubesi to Lama Hotel', description: 'Trail winds through dense bamboo, oak and rhododendron forests.', altitude: '2,470 m', accommodation: 'Forest lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 3, title: 'Lama Hotel to Langtang Village', description: 'Valley opens up with prayer wheels and mani stones.', altitude: '3,430 m', accommodation: 'Rebuilt stone lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 4, title: 'Langtang Village to Kyanjin Gompa', description: 'Reach the high alpine basin under Langtang Lirung icefall.', altitude: '3,870 m', accommodation: 'Monastery lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 5, title: 'Kyanjin Ri or Tsergo Ri Viewpoint', description: 'Climb Kyanjin Ri (4,773 m) for 360-degree panorama of glaciers.', altitude: '4,773 m', accommodation: 'Monastery lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 6, title: 'Kyanjin Gompa to Lama Hotel', description: 'Pleasant downhill through rhododendron forest.', altitude: '2,470 m', accommodation: 'Forest lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 7, title: 'Lama Hotel to Syabrubesi & Kathmandu', description: 'Return walk to roadhead and private vehicle to Kathmandu.', altitude: '1,400 m', accommodation: 'Hotel', meals: 'Breakfast, Lunch' },
      ],
      inclusions: [
        { item: 'Langtang National Park permit & TIMS card' },
        { item: 'All teahouse accommodation and 3 meals daily' },
        { item: 'Certified mountain guide and porter support' },
      ],
      exclusions: [
        { item: 'Tips and personal gear' },
        { item: 'Drinks and hot water charges' },
      ],
      _status: 'published',
    },
    {
      title: 'Kathmandu & the Foothills',
      slug: 'kathmandu-himalayan-foothills',
      location: 'Kathmandu, Nepal',
      destinationName: 'Kathmandu',
      destination: destinationMap['central'] || null,
      duration: '9 days',
      durationDays: 9,
      difficulty: 'Easy',
      tripType: 'Cultural',
      price: 1320,
      currency: 'USD',
      seasons: ['Spring', 'Autumn', 'Winter'],
      primeSeason: 'Winter',
      departures: 'Year-round departures',
      elevation: '2,200 m',
      highlight: 'Private twilight access to the medieval courtyards of Bhaktapur',
      availability: '5 places in October',
      description: 'Ancient Newari architecture, living temple traditions, and gentle walking through quiet ridge villages.',
      shortDescription: 'Ancient courtyards, living traditions and ridge trails of the Kathmandu Valley.',
      imageUrl: '/images/trip-culture.webp',
      imagePosition: 'center 48%',
      alt: 'Ancient carved wooden temple windows in Bhaktapur Durbar Square',
      featured: false,
      itinerary: [
        { day: 1, title: 'Arrival in Kathmandu', description: 'Traditional welcome and transfer to historic boutique hotel in Patan.', altitude: '1,400 m', accommodation: 'Heritage boutique hotel', meals: 'Dinner' },
        { day: 2, title: 'Patan Courtyards & Bronze Masters', description: 'Explore secret Buddhist monasteries and metal craft workshops.', altitude: '1,400 m', accommodation: 'Heritage boutique hotel', meals: 'Breakfast, Lunch' },
        { day: 3, title: 'Bhaktapur Medieval Kingdom', description: 'Pottery squares, Nyatapola pagoda, and artisan woodcarvers.', altitude: '1,400 m', accommodation: 'Bhaktapur guest house', meals: 'Breakfast, Dinner' },
        { day: 4, title: 'Ridge Trail to Nagarkot', description: 'Gentle walk through pine forests with Himalayan views from Ganesh to Everest.', altitude: '2,175 m', accommodation: 'Mountain view resort', meals: 'Breakfast, Lunch, Dinner' },
        { day: 5, title: 'Sunrise over Himalaya & Changu Narayan', description: 'Watch the sunrise paint the peaks; descend to Nepal’s oldest temple.', altitude: '1,540 m', accommodation: 'Heritage boutique hotel', meals: 'Breakfast' },
      ],
      inclusions: [
        { item: 'All heritage monument entrance fees' },
        { item: 'Expert cultural historian guide' },
        { item: 'Charming boutique heritage stays' },
        { item: 'Private comfortable transport throughout' },
      ],
      exclusions: [
        { item: 'Personal shopping and optional activities' },
      ],
      _status: 'published',
    },
    {
      title: 'Gokyo Lakes & Cho La',
      slug: 'gokyo-lakes-cho-la',
      location: 'Khumbu, Nepal',
      destinationName: 'Everest',
      destination: destinationMap['eastern'] || null,
      duration: '18 days',
      durationDays: 18,
      difficulty: 'Challenging',
      tripType: 'Trek',
      price: 1820,
      currency: 'USD',
      seasons: ['Spring', 'Autumn'],
      primeSeason: 'Autumn',
      departures: 'Apr · May · Oct · Nov',
      elevation: '5,420 m',
      highlight: 'Six turquoise glacial lakes reflecting the 8,000 m face of Cho Oyu',
      availability: '3 places in November',
      description: 'The connoisseur’s Everest: six emerald lakes, the Ngozumpa Glacier, and crossing Cho La pass.',
      shortDescription: 'High pass traverse across the Gokyo emerald lakes and Cho La to Base Camp.',
      imageUrl: '/images/trip-gokyo.jpg',
      imagePosition: 'center 40%',
      alt: 'Turquoise Gokyo lake reflecting high Himalayan snow peaks',
      featured: false,
      itinerary: [
        { day: 1, title: 'Lukla to Phakding & Namche', description: 'Acclimatisation and initial trek into the Khumbu.', altitude: '3,440 m', accommodation: 'Lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 2, title: 'Namche to Dole & Machhermo', description: 'Split from the main trail into the tranquil Gokyo valley.', altitude: '4,470 m', accommodation: 'Teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 3, title: 'Machhermo to Gokyo 3rd Lake', description: 'Walk alongside the terminal moraine of Ngozumpa Glacier to the azure lakes.', altitude: '4,790 m', accommodation: 'Lakeside lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 4, title: 'Gokyo Ri Summit & 5th Lake', description: 'Panoramic summit of Gokyo Ri with vistas of 4 eight-thousanders: Everest, Lhotse, Makalu, Cho Oyu.', altitude: '5,357 m', accommodation: 'Lakeside lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 5, title: 'Cross Cho La Pass to Dzongla', description: 'Crampons on for the glacier crossing over Cho La Pass (5,420 m).', altitude: '5,420 m', accommodation: 'High pass refuge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 6, title: 'Dzongla to Gorak Shep & EBC', description: 'Connect with the Everest Base Camp trail for the ultimate double summit.', altitude: '5,364 m', accommodation: 'Lodge', meals: 'Breakfast, Lunch, Dinner' },
      ],
      inclusions: [
        { item: 'Khumbu & Sagarmatha entry permits' },
        { item: 'Return Lukla flights' },
        { item: 'High-pass specialist guide and support team' },
      ],
      exclusions: [
        { item: 'Emergency helicopter evacuation insurance' },
      ],
      _status: 'published',
    },
    {
      title: 'Mardi Himal Ridge',
      slug: 'mardi-himal-ridge',
      location: 'Annapurna, Nepal',
      destinationName: 'Annapurna',
      destination: destinationMap['western'] || null,
      duration: '8 days',
      durationDays: 8,
      difficulty: 'Easy',
      tripType: 'Trek',
      price: 890,
      currency: 'USD',
      seasons: ['Spring', 'Autumn', 'Winter'],
      primeSeason: 'Spring',
      departures: 'Feb · Mar · Apr · Oct · Nov · Dec',
      elevation: '4,500 m',
      highlight: 'Eye-level sunset with Machapuchare from High Camp ridge',
      availability: '8 places in October',
      description: 'A hidden ridge trail directly facing Machapuchare: intimate, quiet, and reachable in a week.',
      shortDescription: 'A ridge trail walking straight towards the sacred spire of Machapuchare.',
      imageUrl: '/images/trip-mardi.jpg',
      imagePosition: 'center 45%',
      alt: 'Mardi Himal ridge leading directly to the dramatic summit of Machapuchare',
      featured: false,
      itinerary: [
        { day: 1, title: 'Pokhara to Kande & Forest Camp', description: 'Walk through ancient mossy oak and rhododendron canopy.', altitude: '2,550 m', accommodation: 'Quiet forest lodge', meals: 'Lunch, Dinner' },
        { day: 2, title: 'Forest Camp to Low Camp', description: 'Emerge onto the narrow ridge with views of Annapurna South.', altitude: '2,970 m', accommodation: 'Ridge teahouse', meals: 'Breakfast, Lunch, Dinner' },
        { day: 3, title: 'Low Camp to High Camp', description: 'Climb above tree line directly facing the dramatic face of Sacred Fish Tail.', altitude: '3,580 m', accommodation: 'High camp lodge', meals: 'Breakfast, Lunch, Dinner' },
        { day: 4, title: 'Mardi Himal Base Camp & Siding', description: 'Pre-dawn ridge hike to Base Camp (4,500 m); descend to traditional village of Siding.', altitude: '4,500 m', accommodation: 'Village homestay', meals: 'Breakfast, Lunch, Dinner' },
        { day: 5, title: 'Siding to Lumre & Pokhara', description: 'Walk along the river bank and jeep return to Pokhara lakeside.', altitude: '820 m', accommodation: 'Lakeside hotel', meals: 'Breakfast, Lunch' },
      ],
      inclusions: [
        { item: 'ACAP and TIMS permits' },
        { item: 'Expert mountain guide and porter' },
        { item: 'All teahouse stays and trail meals' },
        { item: 'Jeep transfers Pokhara - trailhead return' },
      ],
      exclusions: [
        { item: 'Tips and personal equipment' },
      ],
      _status: 'published',
    },
  ]

  const tripIds: any[] = []
  for (const trip of tripsData) {
    const existing = await payload.find({
      collection: 'trips',
      where: { slug: { equals: trip.slug } },
      draft: true,
    })

    if (existing.totalDocs === 0) {
      const created = await payload.create({
        collection: 'trips',
        data: trip as any,
      })
      tripIds.push(created.id)
      console.log(`Created trip: ${trip.title}`)
    } else {
      tripIds.push(existing.docs[0].id)
      console.log(`Trip already exists: ${trip.title}`)
    }
  }

  // 5. Blogs
  console.log('5. Seeding blogs...')
  // Read root family treks markdown if available
  const mdPath = path.resolve(dirname, '../../Best Summer Treks For Family in Nepal For Beginners.md')
  let rawMarkdown = ''
  try {
    rawMarkdown = fs.readFileSync(mdPath, 'utf8')
  } catch {
    // fallback if not readable
  }

  const blogsData = [
    {
      title: 'Best Summer Treks For Family in Nepal For Beginners',
      slug: 'best-summer-treks-family-nepal-beginners',
      categoryName: 'Family Guides',
      category: categoryMap['family-guides'] || null,
      excerpt:
        'Nepal will offer several beginner-friendly summer treks that families can complete safely with proper pacing and preparation. The best options will combine lower altitude, reliable accommodation, manageable walking hours, and strong cultural experiences.',
      rawMarkdown,
      author: 'Hike Globally Editorial Team',
      publishedDate: '2026-09-16T00:00:00.000Z',
      readTime: '10 min read',
      premium: true,
      imageUrl: '/images/blog-family-summer-hero.jpg',
      alt: 'Happy family trekking in Nepal during summer monsoon season with lush green Himalayan backdrop',
      tags: [{ tag: 'Family Trekking' }, { tag: 'Summer in Nepal' }, { tag: 'Beginner Guides' }],
      _status: 'published',
    },
    {
      title: 'Before Nepal: what the mountains wish you knew',
      slug: 'before-nepal',
      categoryName: 'Travel Guides',
      category: categoryMap['travel-guides'] || null,
      excerpt:
        'From trail rhythm to teahouse etiquette, our local leaders share the small details that transform a Himalayan journey.',
      rawMarkdown: `The Himalaya asks for patience before it asks for strength. On the first mornings, walk more slowly than you think you need to. Let the trail, the altitude and the rhythm of your team set the pace.\n\nIn a teahouse, warmth comes from more than the stove. Learn a few words of Nepali, greet your host, refill your bottle instead of buying plastic, and leave space for the everyday life unfolding around you.\n\nThe best preparation is equal parts practical and open-minded: broken-in boots, light layers, honest expectations—and enough curiosity to let the journey surprise you.`,
      author: 'Nima Sherpa',
      publishedDate: '2026-09-08T00:00:00.000Z',
      readTime: '8 min read',
      premium: false,
      imageUrl: '/images/journal-kathmandu.webp',
      alt: 'Colourful prayer flags radiating across a white stupa in Kathmandu',
      tags: [{ tag: 'Preparation' }, { tag: 'Culture' }],
      _status: 'published',
    },
    {
      title: 'Words from the high road: the porters of the Khumbu',
      slug: 'people-who-carry-himalaya',
      categoryName: 'Field Notes',
      category: categoryMap['field-notes'] || null,
      excerpt:
        'Behind every summit photograph is an invisible engine of grit and grace. Meet the people who carry the Himalaya on their backs.',
      rawMarkdown: `A tumline across the brow, sixty kilos of rice, propane, timber, or a trekker's heavy duffel: the mountain economy moves on human foot. Long before the helicopter service, long before the teahouse menus grew to three pages, the trail belonged to the porters.\n\nAt five in the morning, while the frost still glazes the stone steps of Namche, you hear the tap-tap of the tokma—the T-shaped wooden walking stick that doubles as a load rest when standing. No complaints, no self-congratulation.\n\nTraveling with Hike Globally means fair pay, proper load limits capped at 25 kg per porter, full mountain gear, warm lodge accommodation, and emergency medical insurance. When you walk the trail, greet them with Namaste and give way on the mountain side of the trail.`,
      author: 'Pasang Dawa',
      publishedDate: '2026-08-24T00:00:00.000Z',
      readTime: '6 min read',
      premium: false,
      imageUrl: '/images/journal-porters.webp',
      alt: 'A porter carrying a load on a mountain trail with Himalayan peaks behind',
      tags: [{ tag: 'Porters' }, { tag: 'Ethics' }, { tag: 'Khumbu' }],
      _status: 'published',
    },
    {
      title: 'The stillness inside a high monastery at dawn',
      slug: 'stillness-in-monastery',
      categoryName: 'Culture',
      category: categoryMap['culture'] || null,
      excerpt:
        'Butter lamps, juniper smoke and the rumble of the dungchen: why sitting still at Tengboche is the most memorable hour of any trek.',
      rawMarkdown: `Before sunrise, Tengboche is wrapped in freezing cloud. Inside the monastery, the stone floor is cold through thick socks, but the scent of juniper incense and burning yak-butter lamps fills the courtyard.\n\nWhen the monks begin the morning puja, the low drone of the dungchen (long copper horns) vibrates directly in your chest. In this space, the relentless forward push of trekking falls away. You realize the mountain journey is not about conquering an altitude; it is about learning to arrive completely where you are.`,
      author: 'Lhakpa Tenzing',
      publishedDate: '2026-08-12T00:00:00.000Z',
      readTime: '5 min read',
      premium: false,
      imageUrl: '/images/journal-culture.webp',
      alt: 'Interior of a Tibetan Buddhist monastery in Nepal with glowing butter lamps',
      tags: [{ tag: 'Culture' }, { tag: 'Tengboche' }, { tag: 'Monasteries' }],
      _status: 'published',
    },
    {
      title: 'Upper Mustang: beyond the monsoon shadow',
      slug: 'upper-mustang-season',
      categoryName: 'Travel Guides',
      category: categoryMap['travel-guides'] || null,
      excerpt:
        'When rain clouds bury the southern valleys, the high Tibetan plateau of Mustang basks in dry sun, desert canyons, and untouched festivals.',
      rawMarkdown: `Between June and August, while monsoon rains soak Pokhara and the southern foothills, Upper Mustang sits quietly in the trans-Himalayan rain shadow of the Annapurna and Dhaulagiri massifs.\n\nHere, the earth is dry ochre, terracotta, and wind-sculpted sandstone. The Kali Gandaki winds through dramatic canyons under deep blue skies. If you can only travel in summer, Mustang is the premier trekking sanctuary in the entire Himalayan chain.`,
      author: 'Kishor Gurung',
      publishedDate: '2026-07-29T00:00:00.000Z',
      readTime: '7 min read',
      premium: false,
      imageUrl: '/images/journal-mustang.webp',
      alt: 'Desert landscape of Upper Mustang with yellow and red rock cliffs and monastery',
      tags: [{ tag: 'Mustang' }, { tag: 'Summer' }, { tag: 'Seasons' }],
      _status: 'published',
    },
  ]

  for (const blog of blogsData) {
    const existing = await payload.find({
      collection: 'blogs',
      where: { slug: { equals: blog.slug } },
      draft: true,
    })

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'blogs',
        data: blog as any,
      })
      console.log(`Created blog: ${blog.title}`)
    } else {
      console.log(`Blog already exists: ${blog.title}`)
    }
  }

  console.log('--- Payload CMS Seed Finished Successfully! ---')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed script encountered error:', err)
  process.exit(1)
})
