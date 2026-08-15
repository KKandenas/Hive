import type { Insect } from '@hive/shared';

export const INSECT_META: Record<Insect, { label: string; emoji: string }> = {
  QUEEN: { label: 'Bidrottning', emoji: '\u{1F41D}' },
  BEETLE: { label: 'Skalbagge', emoji: '\u{1FAB2}' },
  GRASSHOPPER: { label: 'Gräshoppa', emoji: '\u{1F997}' },
  SPIDER: { label: 'Spindel', emoji: '\u{1F577}\u{FE0F}' },
  ANT: { label: 'Soldatmyra', emoji: '\u{1F41C}' },
};

export const INSECT_ORDER: Insect[] = ['QUEEN', 'BEETLE', 'GRASSHOPPER', 'SPIDER', 'ANT'];
