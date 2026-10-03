/**
 * Emoji icons per category key. Used as a zero-dependency fallback when a
 * category has no photo, and in the home page category tiles.
 */
const ICONS: Record<string, string> = {
  cow: '🐄',
  bull: '🐂',
  buffalo: '🐃',
  goat: '🐐',
  sheep: '🐑',
  chicken: '🐔',
  rooster: '🐓',
  dog: '🐕',
  cat: '🐈',
  rabbit: '🐇',
  pigeon: '🕊️',
  lovebird: '🦜',
  otherbirds: '🦜',
  otheranimals: '🐾',
  horse: '🐎',
  duck: '🦆',
  quail: '🐦',
  turkey: '🦃',
  donkey: '🫏',
};

export function getCategoryIcon(category?: string): string {
  if (!category) return '🐾';
  return ICONS[category.toLowerCase()] ?? '🐾';
}

export default getCategoryIcon;
