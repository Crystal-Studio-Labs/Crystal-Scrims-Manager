export interface GamePreset {
  id: string;
  name: string;
  defaultSlots: number;
  teamSize: number;
  format: 'BR' | '5V5' | 'CUSTOM';
  description: string;
  defaultPointSystem?: {
    placements: Record<number, number>;
    killPoints: number;
  };
}

export const GAME_PRESETS: Record<string, GamePreset> = {
  BGMI: {
    id: 'BGMI',
    name: 'BGMI / PUBG Mobile (Squad)',
    defaultSlots: 25,
    teamSize: 4,
    format: 'BR',
    description: 'Official 25 Squad Battle Royale format',
    defaultPointSystem: {
      placements: { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 },
      killPoints: 1,
    },
  },
  FREEFIRE: {
    id: 'FREEFIRE',
    name: 'Free Fire (Squad)',
    defaultSlots: 12,
    teamSize: 4,
    format: 'BR',
    description: 'Official 12 Squad FFWS Battle Royale format',
    defaultPointSystem: {
      placements: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 },
      killPoints: 1,
    },
  },
  VALORANT: {
    id: 'VALORANT',
    name: 'Valorant (Custom 5v5 / 10-Man)',
    defaultSlots: 2,
    teamSize: 5,
    format: '5V5',
    description: 'Tactical 5v5 custom lobby with map veto and captain drafts',
  },
  CODM: {
    id: 'CODM',
    name: 'Call of Duty: Mobile (BR)',
    defaultSlots: 25,
    teamSize: 4,
    format: 'BR',
    description: 'Battle Royale 25 Squad format',
    defaultPointSystem: {
      placements: { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1 },
      killPoints: 1,
    },
  },
  APEX: {
    id: 'APEX',
    name: 'Apex Legends (Trios)',
    defaultSlots: 20,
    teamSize: 3,
    format: 'BR',
    description: '20 Squad Trios competitive format',
    defaultPointSystem: {
      placements: { 1: 12, 2: 9, 3: 7, 4: 5, 5: 4, 6: 3, 7: 3, 8: 2, 9: 2, 10: 2 },
      killPoints: 1,
    },
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Game / Custom Slots',
    defaultSlots: 20,
    teamSize: 4,
    format: 'CUSTOM',
    description: 'Custom community rules with arbitrary slot counts and team sizes',
  },
};
