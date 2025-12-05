import { Board, Move } from '../board.ts';
import { Player } from './player.ts';

export class RandomPlayer extends Player {
  name = 'random';

  override getMove(board: Board): Move {
    const possibleMoves = board.getLegalMoves();
    const choice = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[choice];
  }
}
