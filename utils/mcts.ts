import { Move, Board, PlayerIdx } from '../board.ts';

export class MctsNode {
  visits = 0;
  wins = 0;
  moves: Move[];
  terminal: boolean;
  children: Array<MctsNode | undefined>;

  constructor(
    public board: Board,
    public playerToMove: PlayerIdx,
    public rootPlayer: PlayerIdx,
    private chooseMove: (board: Board) => Move,
    public parent?: MctsNode,
    public C: number = Math.SQRT2
  ) {
    this.moves = board.getLegalMoves();
    this.terminal = board.isGameOver();
    this.children = Array(this.moves.length);
  }

  upperBound(parentVisits: number): number {
    if (this.visits === 0) return Infinity;
    if (parentVisits <= 1) return Infinity;
    const exploitation = this.wins / this.visits;
    const exploration = this.C * Math.sqrt(Math.log(parentVisits) / this.visits);
    return exploitation + exploration;
  }

  select(): MctsNode {
    if (this.terminal) {
      return this;
    }

    for (const [i, m] of this.moves.entries()) {
      if (!this.children[i]) {
        const newBoard = this.board.clone();
        newBoard.move(m);
        this.children[i] = new MctsNode(
          newBoard,
          newBoard.currentPlayer,
          this.rootPlayer,
          this.chooseMove,
          this,
          this.C
        );
        return this.children[i]!;
      }
    }

    let bestIdx: number | null = null;
    let bestUb = -Infinity;

    for (const [i, child] of this.children.entries()) {
      if (!child) continue;
      const ub = child.upperBound(this.visits);
      if (ub > bestUb) {
        bestUb = ub;
        bestIdx = i;
      }
    }

    if (bestIdx === null) {
      throw new Error('MCTS select: no child found');
    }

    return this.children[bestIdx]!.select();
  }

  simulate() {
    let finalBoard: Board;

    if (this.board.isGameOver()) {
      finalBoard = this.board;
    } else {
      const rolloutBoard = this.board.clone();
      while (!rolloutBoard.isGameOver()) {
        const move = this.chooseMove(rolloutBoard);
        rolloutBoard.move(move);
      }
      finalBoard = rolloutBoard;
    }

    const totalBoxes = finalBoard.rows * finalBoard.cols;
    const root = this.rootPlayer;
    const opp: PlayerIdx = root === 1 ? 2 : 1;

    const rootScore = finalBoard.score[root];
    const oppScore = finalBoard.score[opp];

    const result = (rootScore - oppScore) / totalBoxes;

    this.visits += 1;
    this.wins += result;
    this.parent?.back(result);
  }

  back(score: number) {
    this.visits += 1;
    this.wins += score;
    this.parent?.back(score);
  }
}
