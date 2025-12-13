import { HumanPlayer } from './human.ts';
import { Player } from './player.ts';
import { RandomPlayer } from './random.ts';
import { AlphaPlayer } from './alpha.ts';
import { CarloPlayer } from './carlo.ts';
import { MontyPlayer } from './monty.ts';

type PlayerCtor = new (playerNumber: number, param?: number) => Player;

export type PlayerType = 'random' | 'human' | 'alpha' | 'carlo' | 'monty';

export const PlayerMap: Record<PlayerType, PlayerCtor> = {
  random: RandomPlayer,
  human: HumanPlayer,
  alpha: AlphaPlayer,
  carlo: CarloPlayer,
  monty: MontyPlayer,
};
