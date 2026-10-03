/** Districts of Tamil Nadu — used for browsing and the sell form. */
export const TAMIL_NADU_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
] as const;

/** Districts highlighted on the home page (focused launch regions). */
export const FEATURED_DISTRICTS = [
  'Tirunelveli',
  'Thoothukudi',
  'Tenkasi',
  'Madurai',
  'Coimbatore',
  'Salem',
  'Tiruchirappalli',
  'Erode',
  'Kanyakumari',
  'Virudhunagar',
  'Dindigul',
  'Theni',
] as const;

export type DetailFieldType = 'number' | 'text' | 'boolean';

export interface CategoryDetailField {
  name: string;
  labelEn: string;
  labelTa: string;
  type: DetailFieldType;
  placeholderEn?: string;
  placeholderTa?: string;
}

/**
 * Category-specific fields shown dynamically in the sell form and rendered on
 * the listing detail page. Keys must match what the backend stores in
 * `categorySpecificDetails`.
 */
export const CATEGORY_DETAIL_FIELDS: Record<string, CategoryDetailField[]> = {
  cow: [
    {
      name: 'milkProductionLitersPerDay',
      labelEn: 'Milk production (litres/day)',
      labelTa: 'பால் உற்பத்தி (லிட்டர்/நாள்)',
      type: 'number',
      placeholderEn: 'e.g. 12',
      placeholderTa: 'உ.ம். 12',
    },
    { name: 'lactation', labelEn: 'Lactation', labelTa: 'பால் காலம்', type: 'text', placeholderEn: 'e.g. Second' },
    { name: 'calfAvailable', labelEn: 'Calf available with mother?', labelTa: 'கன்று தாயுடன் உள்ளதா?', type: 'boolean' },
  ],
  buffalo: [
    {
      name: 'milkProductionLitersPerDay',
      labelEn: 'Milk production (litres/day)',
      labelTa: 'பால் உற்பத்தி (லிட்டர்/நாள்)',
      type: 'number',
      placeholderEn: 'e.g. 12',
      placeholderTa: 'உ.ம். 12',
    },
    { name: 'lactation', labelEn: 'Lactation', labelTa: 'பால் காலம்', type: 'text', placeholderEn: 'e.g. Second' },
    { name: 'calfAvailable', labelEn: 'Calf available with mother?', labelTa: 'கன்று தாயுடன் உள்ளதா?', type: 'boolean' },
  ],
  rooster: [
    { name: 'purpose', labelEn: 'Purpose', labelTa: 'பயன்பாடு', type: 'text', placeholderEn: 'e.g. Breeding / Fighting / Meat' },
    { name: 'vaccination', labelEn: 'Vaccination', labelTa: 'தடுப்பூசி', type: 'text' },
  ],
  cat: [
    { name: 'pedigree', labelEn: 'Pedigree certificate available?', labelTa: 'வம்சாவளி சான்றிதழ் உள்ளதா?', type: 'boolean' },
    { name: 'training', labelEn: 'Training', labelTa: 'பயிற்சி', type: 'text', placeholderEn: 'e.g. Litter trained' },
    { name: 'vaccination', labelEn: 'Vaccination', labelTa: 'தடுப்பூசி', type: 'text' },
    { name: 'neutered', labelEn: 'Neutered?', labelTa: 'கருத்தடை செய்யப்பட்டதா?', type: 'boolean' },
  ],
  bull: [
    { name: 'weightKg', labelEn: 'Weight (kg)', labelTa: 'எடை (கிலோ)', type: 'number' },
    { name: 'purpose', labelEn: 'Purpose', labelTa: 'பயன்பாடு', type: 'text', placeholderEn: 'e.g. Breeding / Agriculture' },
  ],
  goat: [
    { name: 'weightKg', labelEn: 'Weight (kg)', labelTa: 'எடை (கிலோ)', type: 'number' },
    { name: 'pregnant', labelEn: 'Pregnant?', labelTa: 'கர்ப்பமா?', type: 'boolean' },
    { name: 'count', labelEn: 'Number of animals', labelTa: 'உயிரினங்களின் எண்ணிக்கை', type: 'number' },
  ],
  sheep: [
    { name: 'weightKg', labelEn: 'Weight (kg)', labelTa: 'எடை (கிலோ)', type: 'number' },
    { name: 'pregnant', labelEn: 'Pregnant?', labelTa: 'கர்ப்பமா?', type: 'boolean' },
    { name: 'count', labelEn: 'Number of animals', labelTa: 'உயிரினங்களின் எண்ணிக்கை', type: 'number' },
  ],
  chicken: [
    { name: 'weightKg', labelEn: 'Average weight (kg)', labelTa: 'சராசரி எடை (கிலோ)', type: 'number' },
    { name: 'count', labelEn: 'Number of birds', labelTa: 'பறவைகளின் எண்ணிக்கை', type: 'number' },
    { name: 'eggsPerWeek', labelEn: 'Eggs per week', labelTa: 'வாரத்திற்கு முட்டைகள்', type: 'number' },
  ],
  dog: [
    { name: 'ageInWeeks', labelEn: 'Age (weeks, for puppies)', labelTa: 'வயது (வாரங்கள், நாய்க்குட்டிகளுக்கு)', type: 'number' },
    { name: 'pedigree', labelEn: 'Pedigree certificate available?', labelTa: 'வம்சாவளி சான்றிதழ் உள்ளதா?', type: 'boolean' },
    { name: 'training', labelEn: 'Training', labelTa: 'பயிற்சி', type: 'text', placeholderEn: 'e.g. Basic obedience' },
    { name: 'vaccination', labelEn: 'Vaccination', labelTa: 'தடுப்பூசி', type: 'text' },
    { name: 'neutered', labelEn: 'Neutered?', labelTa: 'கருத்தடை செய்யப்பட்டதா?', type: 'boolean' },
  ],
  rabbit: [
    { name: 'weightKg', labelEn: 'Weight (kg)', labelTa: 'எடை (கிலோ)', type: 'number' },
    { name: 'pregnant', labelEn: 'Pregnant?', labelTa: 'கர்ப்பமா?', type: 'boolean' },
  ],
  pigeon: [
    { name: 'pairAvailable', labelEn: 'Pair available?', labelTa: 'ஜோடி கிடைக்குமா?', type: 'boolean' },
  ],
  lovebird: [
    { name: 'pairAvailable', labelEn: 'Pair available?', labelTa: 'ஜோடி கிடைக்குமா?', type: 'boolean' },
  ],
  otherbirds: [
    { name: 'pairAvailable', labelEn: 'Pair available?', labelTa: 'ஜோடி கிடைக்குமா?', type: 'boolean' },
    { name: 'ageMonths', labelEn: 'Age (months)', labelTa: 'வயது (மாதங்கள்)', type: 'number' },
    { name: 'colorMarkings', labelEn: 'Colour / markings', labelTa: 'நிறம் / அடையாளங்கள்', type: 'text' },
  ],
  otheranimals: [
    { name: 'ageMonths', labelEn: 'Age (months)', labelTa: 'வயது (மாதங்கள்)', type: 'number' },
    { name: 'colorMarkings', labelEn: 'Colour / markings', labelTa: 'நிறம் / அடையாளங்கள்', type: 'text' },
  ],
};

/** Looks up a localised label for any stored categorySpecificDetails key. */
export function getDetailFieldLabel(key: string, language: string): string {
  for (const fields of Object.values(CATEGORY_DETAIL_FIELDS)) {
    const match = fields.find((f) => f.name === key);
    if (match) return language.startsWith('ta') ? match.labelTa : match.labelEn;
  }
  // Fall back to a humanised version of the raw key
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export const GENDERS = ['Male', 'Female', 'Other'] as const;

export const SORT_OPTIONS = [
  { value: 'random', labelKey: 'search.sortRandom' },
  { value: 'newest', labelKey: 'search.sortNewest' },
  { value: 'price_asc', labelKey: 'search.sortPriceAsc' },
  { value: 'price_desc', labelKey: 'search.sortPriceDesc' },
] as const;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 12 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
