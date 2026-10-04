import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Category from '../models/Category.js';
import Otp from '../models/Otp.js';

const categories = [
  {
    key: 'cow',
    nameEn: 'Cow',
    nameTa: 'பசு',
    icon: '🐄',
    breeds: [
      { key: 'jersey', nameEn: 'Jersey', nameTa: 'ஜெர்சி' },
      { key: 'hf', nameEn: 'Holstein Friesian', nameTa: 'ஹோல்ஸ்டீன்' },
      { key: 'kangayam', nameEn: 'Kangayam', nameTa: 'கங்கையம்' },
      { key: 'tharparkar', nameEn: 'Tharparkar', nameTa: 'தார்பார்க்கர்' },
    ],
  },
  {
    key: 'bull',
    nameEn: 'Bull',
    nameTa: 'காளை',
    icon: '🐂',
    breeds: [
      { key: 'kangayam', nameEn: 'Kangayam', nameTa: 'கங்கையம்' },
      { key: 'umblachery', nameEn: 'Umblachery', nameTa: 'உம்பளாச்சேரி' },
      { key: 'pulikulam', nameEn: 'Pulikulam', nameTa: 'புளிகுளம்' },
    ],
  },
  {
    key: 'goat',
    nameEn: 'Goat',
    nameTa: 'ஆடு',
    icon: '🐐',
    breeds: [
      { key: 'boer', nameEn: 'Boer', nameTa: 'போயர்' },
      { key: 'kodi-aadu', nameEn: 'Kodi Aadu', nameTa: 'கொடி ஆடு' },
      { key: 'tellicherry', nameEn: 'Tellicherry', nameTa: 'தெல்லிச்சேரி' },
    ],
  },
  {
    key: 'sheep',
    nameEn: 'Sheep',
    nameTa: 'செம்மறி ஆடு',
    icon: '🐑',
    breeds: [
      { key: 'madras-red', nameEn: 'Madras Red', nameTa: 'சென்னை சிவப்பு' },
      { key: 'ramnad-white', nameEn: 'Ramnad White', nameTa: 'ராமநாதபுரம் வெள்ளை' },
    ],
  },
  {
    key: 'chicken',
    nameEn: 'Chicken',
    nameTa: 'கோழி',
    icon: '🐓',
    breeds: [
      { key: 'country', nameEn: 'Country Chicken (Nattu Koli)', nameTa: 'நாட்டு கோழி' },
      { key: 'broiler', nameEn: 'Broiler', nameTa: 'பிராய்லர்' },
      { key: 'kadaknath', nameEn: 'Kadaknath', nameTa: 'கடக்நாத்' },
    ],
  },
  {
    key: 'dog',
    nameEn: 'Dog',
    nameTa: 'நாய்',
    icon: '🐕',
    breeds: [
      { key: 'rajapalayam', nameEn: 'Rajapalayam', nameTa: 'ராஜபாளையம்' },
      { key: 'chippiparai', nameEn: 'Chippiparai', nameTa: 'சிப்பிப்பாறை' },
      { key: 'golden-retriever', nameEn: 'Golden Retriever', nameTa: 'கோல்டன் ரிட்ரீவர்' },
      { key: 'german-shepherd', nameEn: 'German Shepherd', nameTa: 'ஜெர்மன் ஷெப்பர்ட்' },
    ],
  },
  {
    key: 'rabbit',
    nameEn: 'Rabbit',
    nameTa: 'முயல்',
    icon: '🐇',
    breeds: [
      { key: 'new-zealand', nameEn: 'New Zealand White', nameTa: 'நியூசிலாந்து வெள்ளை' },
      { key: 'soviet-chinchilla', nameEn: 'Soviet Chinchilla', nameTa: 'சோவியத் சின்சில்லா' },
    ],
  },
  {
    key: 'pigeon',
    nameEn: 'Pigeon',
    nameTa: 'புறா',
    icon: '🕊️',
    breeds: [
      { key: 'fantail', nameEn: 'Fantail', nameTa: 'ஃபேன்டெயில்' },
      { key: 'homer', nameEn: 'Homer', nameTa: 'ஹோமர்' },
    ],
  },
  {
    key: 'lovebird',
    nameEn: 'Love Birds',
    nameTa: 'காதல் பறவைகள்',
    icon: '🦜',
    breeds: [
      { key: 'budgerigar', nameEn: 'Budgerigar', nameTa: 'பட்ஜரிகார்' },
      { key: 'cockatiel', nameEn: 'Cockatiel', nameTa: 'காகடீல்' },
    ],
  },
  {
    key: 'buffalo',
    nameEn: 'Buffalo',
    nameTa: 'எருமை',
    icon: '🐃',
    breeds: [
      { key: 'murrah', nameEn: 'Murrah', nameTa: 'முர்ரா' },
      { key: 'toda', nameEn: 'Toda', nameTa: 'தோடா' },
      { key: 'surti', nameEn: 'Surti', nameTa: 'சுர்தி' },
    ],
  },
  {
    key: 'rooster',
    nameEn: 'Rooster',
    nameTa: 'சேவல்',
    icon: '🐓',
    breeds: [
      { key: 'aseel', nameEn: 'Aseel', nameTa: 'அசீல்' },
      { key: 'nattu-koli-breeder', nameEn: 'Nattu Koli Breeder', nameTa: 'நாட்டு கோழி' },
    ],
  },
  {
    key: 'cat',
    nameEn: 'Cat',
    nameTa: 'பூனை',
    icon: '🐈',
    breeds: [
      { key: 'persian', nameEn: 'Persian', nameTa: 'பெர்ஷியன்' },
      { key: 'indian-mau', nameEn: 'Indian Mau', nameTa: 'இந்தியன் மாவ்' },
      { key: 'siamese', nameEn: 'Siamese', nameTa: 'சயாமீஸ்' },
    ],
  },
  {
    key: 'otherbirds',
    nameEn: 'Other Birds',
    nameTa: 'மற்ற பறவைகள்',
    icon: '🦜',
    breeds: [
      { key: 'cockatiel', nameEn: 'Cockatiel', nameTa: 'காகடீல்' },
      { key: 'budgerigar', nameEn: 'Budgerigar', nameTa: 'பட்ஜரிகார்' },
      { key: 'finch', nameEn: 'Finch', nameTa: 'ஃபிஞ்ச்' },
    ],
  },
  {
    key: 'otheranimals',
    nameEn: 'Other Animals',
    nameTa: 'மற்ற விலங்குகள்',
    icon: '🐾',
    breeds: [{ key: 'other', nameEn: 'Other', nameTa: 'மற்றவை' }],
  },
];


const sampleListings = [
  {
    category: 'cow',
    breed: 'Jersey',
    title: 'Healthy Jersey Cow - 2nd Lactation',
    description:
      'Healthy Jersey cow, second lactation, giving 14 litres of milk per day. Well vaccinated and dewormed. Calm temperament, good for family dairy.',
    gender: 'Female',
    age: { years: 4, months: 2 },
    price: 55000,
    isNegotiable: true,
    location: { district: 'Tirunelveli', taluk: 'Palayamkottai', village: 'Sivanthipatti' },
    photos: ['https://placehold.co/800x600?text=Jersey+Cow'],
    categorySpecificDetails: {
      milkProductionLitersPerDay: 14,
      lactation: 'Second',
      calfAvailable: true,
      vaccination: 'FMD & HS vaccinated',
    },
    healthInfo: 'Regularly checked by local veterinarian',
    vaccinationInfo: 'FMD, HS, BQ done',
    status: 'APPROVED',
  },
  {
    category: 'goat',
    breed: 'Boer',
    title: 'Boer Goat Pair - Good Weight',
    description:
      'Boer goat pair, 8 months old, average weight 28 kg each. Healthy and active. Ideal for breeding stock.',
    gender: 'Other',
    age: { years: 0, months: 8 },
    price: 22000,
    isNegotiable: true,
    location: { district: 'Thoothukudi', taluk: 'Kovilpatti', village: 'Iluppaiyurani' },
    photos: ['https://placehold.co/800x600?text=Boer+Goat'],
    categorySpecificDetails: { weightKg: 28, pregnant: false, vaccination: 'PPR vaccinated' },
    status: 'APPROVED',
  },
  {
    category: 'dog',
    breed: 'Rajapalayam',
    title: 'Rajapalayam Puppies - 45 Days',
    description:
      'Healthy Rajapalayam puppies, 45 days old, first vaccination done. Bred from good native bloodline.',
    gender: 'Male',
    age: { years: 0, months: 1 },
    price: 12000,
    isNegotiable: false,
    location: { district: 'Madurai', taluk: 'Melur', village: 'Alanganallur' },
    photos: ['https://placehold.co/800x600?text=Rajapalayam+Puppy'],
    categorySpecificDetails: { pedigree: false, training: 'None', vaccination: 'First dose done' },
    status: 'APPROVED',
  },
  {
    category: 'chicken',
    breed: 'Country Chicken (Nattu Koli)',
    title: 'Nattu Koli - 1 Kg Average',
    description:
      'Country chicken raised free-range on natural feed. Average weight 1 kg. Healthy and disease free.',
    gender: 'Other',
    age: { years: 0, months: 5 },
    price: 450,
    isNegotiable: true,
    location: { district: 'Tenkasi', taluk: 'Sankarankovil', village: 'Karisalpatti' },
    photos: ['https://placehold.co/800x600?text=Nattu+Koli'],
    categorySpecificDetails: { weightKg: 1 },
    status: 'PENDING',
  },
];

async function run() {
  await connectDB();

  // Normalize legacy uppercase categories to lowercase
  try {
    await Listing.updateMany({}, [{$set:{category:{$toLower:'$category'}}}]);
  } catch {
    await Listing.collection.updateMany({}, [{ $set: { category: { $toLower: '$category' } } }]);
  }

  // Categories
  for (const cat of categories) {
    await Category.findOneAndUpdate({ key: cat.key }, cat, { upsert: true, returnDocument: 'after' });
  }
  console.log(`[seed] Categories seeded: ${categories.length}`);

  if (process.argv.includes('--categories-only')) {
    await mongoose.connection.close();
    console.log('[seed] Categories-only mode complete.');
    return;
  }

  // Admin user
  const adminPhone = process.env.ADMIN_PHONE || '9000000001';
  const adminName = process.env.ADMIN_NAME || 'Admin';
  const admin = await User.findOneAndUpdate(
    { phone: adminPhone },
    { phone: adminPhone, name: adminName, role: 'ADMIN', isVerified: true },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  console.log(`[seed] Admin ready: ${admin.phone} (${admin.role})`);

  // Demo seller
  const seller = await User.findOneAndUpdate(
    { phone: '9000000002' },
    {
      phone: '9000000002',
      name: 'Muthu Kumar',
      role: 'USER',
      isVerified: true,
      location: { district: 'Tirunelveli', taluk: 'Palayamkottai', village: 'Sivanthipatti' },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  console.log(`[seed] Demo seller ready: ${seller.phone}`);

  // Sample listings (only if none exist for the demo seller)
  const existing = await Listing.countDocuments({ seller: seller._id });
  if (existing === 0) {
    for (const item of sampleListings) {
      await Listing.create({
        ...item,
        seller: seller._id,
        phone: seller.phone,
        whatsapp: seller.phone,
      });
    }
    console.log(`[seed] Sample listings created: ${sampleListings.length}`);
  } else {
    console.log(`[seed] Seller already has ${existing} listings, skipping samples`);
  }

  await Otp.deleteMany({});
  console.log('[seed] Cleared stale OTP records');

  await mongoose.connection.close();
  console.log('[seed] Done.');
}

run().catch(async (err) => {
  console.error('[seed] Failed:', err);
  await mongoose.connection.close();
  process.exit(1);
});

