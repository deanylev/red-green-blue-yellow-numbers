// constants
export const COLOURS = [
  'blue',
  'green',
  'red',
  'yellow'
] as const;
export const NUMBERS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9'
] as const;
export const SPECIALS = [
  'draw-2',
  'reverse',
  'skip'
] as const;
export const STANDARDS = [
  ...NUMBERS,
  ...SPECIALS
];
export const WILDS = [
  'draw-4',
  'wild'
] as const;
export const ALL_TYPES = [
  ...STANDARDS,
  ...WILDS
] as const;

export const ID_LENGTH = 6;
export const MAX_NAME_LENGTH = 100;
export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 2;

// enums
export enum FailureReason {
  ALREADY_IN_GAME = 'already_in_game',
  CARD_NOT_PLAYABLE = 'card_not_playable',
  GAME_EMPTY = 'game_empty',
  GAME_FULL = 'game_full',
  GAME_NOT_FOUND = 'game_not_found',
  GAME_NOT_STARTED = 'game_not_started',
  GAME_STARTED = 'game_started',
  NAME_INVALID = 'name_invalid',
  NAME_TAKEN = 'name_taken',
  NOT_IN_GAME = 'not_in_game',
  NOT_PLAYER_TURN = 'not_player_turn',
  PARAMS = 'params',
  PLAYER_MISSING_CARD = 'player_missing_card',
  PLAYER_NOT_HOST = 'player_not_host'
}

// types
export type Colour = typeof COLOURS[number];
export type Number = typeof NUMBERS[number];
export type Special = typeof SPECIALS[number];
export type Standard = typeof STANDARDS[number];
export type Wild = typeof WILDS[number];
export type CardType = Number | Special | Wild;

export interface SerializedCard {
  colour: Colour | null;
  type: CardType;
}

export interface SerializedPlayer {
  cards: SerializedCard[];
  current: boolean;
  host: boolean;
  name: string;
  points: number;
  winner: boolean;
}

export interface SerializedGame {
  id: string;
  lastCardPlayed: SerializedCard | null;
  players: SerializedPlayer[];
  playing: boolean;
}
