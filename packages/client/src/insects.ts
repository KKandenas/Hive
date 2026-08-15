import type { Insect } from '@hive/shared';

export const INSECT_META: Record<Insect, { label: string; emoji: string }> = {
  QUEEN: { label: 'Queen Bee', emoji: '\u{1F41D}' },
  BEETLE: { label: 'Beetle', emoji: '\u{1FAB2}' },
  GRASSHOPPER: { label: 'Grasshopper', emoji: '\u{1F997}' },
  SPIDER: { label: 'Spider', emoji: '\u{1F577}\u{FE0F}' },
  ANT: { label: 'Soldier Ant', emoji: '\u{1F41C}' },
};

export const INSECT_ORDER: Insect[] = ['QUEEN', 'BEETLE', 'GRASSHOPPER', 'SPIDER', 'ANT'];
