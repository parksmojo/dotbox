import { Board, Move } from '../board.ts';

export abstract class Player {
  abstract name: string;

  constructor(
    public playerNumber: number,
    public param?: number
  ) {}

  abstract getMove(board: Board): Move;
}
