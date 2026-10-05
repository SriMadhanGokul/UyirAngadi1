/**
 * Stable icon fallbacks for category badges and media placeholders.
 * These use vector icons so they render consistently across browsers and OSes.
 */
import { createElement, type ReactNode } from 'react';
import {
  FiActivity,
  FiAward,
  FiCircle,
  FiCloud,
  FiCompass,
  FiDroplet,
  FiFeather,
  FiGift,
  FiHeart,
  FiShield,
  FiTag,
  FiWind,
} from 'react-icons/fi';

const ICONS: Record<string, ReactNode> = {
  cow: createElement(FiActivity),
  bull: createElement(FiShield),
  buffalo: createElement(FiDroplet),
  goat: createElement(FiGift),
  sheep: createElement(FiHeart),
  chicken: createElement(FiFeather),
  rooster: createElement(FiFeather),
  dog: createElement(FiCompass),
  cat: createElement(FiCircle),
  rabbit: createElement(FiAward),
  pigeon: createElement(FiWind),
  lovebird: createElement(FiCloud),
  otherbirds: createElement(FiCloud),
  otheranimals: createElement(FiTag),
  horse: createElement(FiActivity),
  duck: createElement(FiWind),
  quail: createElement(FiWind),
  turkey: createElement(FiFeather),
  donkey: createElement(FiShield),
};

export function getCategoryIcon(category?: string): ReactNode {
  if (!category) return createElement(FiTag);
  return ICONS[category.toLowerCase()] ?? createElement(FiTag);
}

export default getCategoryIcon;
