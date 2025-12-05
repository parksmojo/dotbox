import { HumanPlayer } from './human.ts';
import { Player } from './player.ts';
import { RandomPlayer } from './random.ts';

type PlayerCtor = new (playerNumber: number, param?: number) => Player;

export type PlayerType = 'random' | 'human';

export const PlayerMap: Record<PlayerType, PlayerCtor> = {
  random: RandomPlayer,
  human: HumanPlayer,
};
