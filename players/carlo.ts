import { Board, Move } from '../board.ts';
import { Player } from './player.ts';

// Assuming Player uses 1 or 2; Board uses PlayerIdx = 0 | 1 | 2.
type PlayerIdx = 0 | 1 | 2;

export class CarloPlayer extends Player {
  override name: string;
  private iterations: number;

  constructor(playerNumber: number, param?: number) {
    param ||= 500;
    super(playerNumber, param);
    this.name = 'carlo' + param;
    this.iterations = param;
  }

  override getMove(board: Board): Move {
    const legalMoves = board.getLegalMoves();
    if (legalMoves.length === 0) throw new Error('No legal moves available');

    const rootPlayer = this.playerNumber as PlayerIdx;

    // Root node: use the board's currentPlayer as playerToMove
    const root = new MctsNode(board, board.currentPlayer, rootPlayer);

    for (let i = 0; i < this.iterations; i++) {
      const node = root.select();
      node.simulate();
    }

    // Debug if you want
    // root.toString();

    // Choose move whose child was visited the most
    let maxVisits = -1;
    let bestIdx = 0;

    for (const [i, child] of root.children.entries()) {
      if (!child) continue;
      if (child.visits > maxVisits) {
        maxVisits = child.visits;
        bestIdx = i;
      }
    }

    return root.moves[bestIdx];
  }
}

const C = Math.SQRT2;

class MctsNode {
  visits = 0;
  wins = 0; // cumulative score from the root player's perspective
  moves: Move[];
  terminal: boolean;
  children: Array<MctsNode | undefined>;

  constructor(
    public board: Board,
    /** player to move at this node (should match board.currentPlayer) */
    public playerToMove: PlayerIdx,
    /** fixed: the MCTS root player (Carlo) */
    public rootPlayer: PlayerIdx,
    public parent?: MctsNode
  ) {
    this.moves = board.getLegalMoves();
    this.terminal = board.isGameOver();
    this.children = Array(this.moves.length);
  }

  toString() {
    console.log(
      `Node: playerToMove=${this.playerToMove}, rootPlayer=${this.rootPlayer}, n=${this.visits}, w=${this.wins.toFixed(
        3
      )}`
    );
    for (const [i, child] of this.children.entries()) {
      if (!child) {
        console.log(` - [${i}]: ${JSON.stringify(this.moves[i])}, n=0, w=0, UCB=Infinity (unexpanded)`);
      } else {
        console.log(
          ` - [${i}]: ${JSON.stringify(this.moves[i])}, n=${child.visits}, w=${child.wins.toFixed(
            3
          )}, UCB=${child.upperBound(this.visits).toFixed(3)}`
        );
      }
    }
  }

  upperBound(parentVisits: number): number {
    if (this.visits === 0) return Infinity;
    if (parentVisits <= 1) return Infinity; // guard against log(0) or log(1)
    const exploitation = this.wins / this.visits;
    const exploration = C * Math.sqrt(Math.log(parentVisits) / this.visits);
    return exploitation + exploration;
  }

  select(): MctsNode {
    // If terminal, just simulate from here
    if (this.terminal) {
      return this;
    }

    // 1. Expansion: if there is an unexpanded child, expand and return it
    for (const [i, m] of this.moves.entries()) {
      if (!this.children[i]) {
        const newBoard = this.board.clone();
        newBoard.move(m);
        this.children[i] = new MctsNode(newBoard, newBoard.currentPlayer, this.rootPlayer, this);
        return this.children[i]!;
      }
    }

    // 2. Selection: all children expanded, pick best UCB
    let bestIdx: number | null = null;
    let bestUb = -Infinity;

    for (const [i, child] of this.children.entries()) {
      if (!child) continue; // should not happen after expansion loop
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
    // We will evaluate from the root player's perspective based on final scores
    let finalBoard: Board;

    if (this.board.isGameOver()) {
      // Terminal node: just use this.board
      finalBoard = this.board;
    } else {
      // Rollout: random playout to the end from a clone
      const rolloutBoard = this.board.clone();
      while (!rolloutBoard.isGameOver()) {
        const moves = rolloutBoard.getLegalMoves();
        const move = moves[Math.floor(Math.random() * moves.length)];
        rolloutBoard.move(move);
      }
      finalBoard = rolloutBoard;
    }

    const totalBoxes = finalBoard.rows * finalBoard.cols;
    const root = this.rootPlayer;
    const opp: PlayerIdx = root === 1 ? 2 : 1;

    const rootScore = finalBoard.score[root];
    const oppScore = finalBoard.score[opp];

    // Normalized score difference in [-1, 1]
    const result = (rootScore - oppScore) / totalBoxes;

    // Backprop from this node up to root
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
