import type { Difficulty } from '@hive/shared';

export const DIFFICULTY_ORDER: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: 'Lätt',
  MEDIUM: 'Medel',
  HARD: 'Svår',
};
