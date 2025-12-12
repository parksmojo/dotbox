import { Board, Move } from '../board.ts';
import { Player } from './player.ts';

type SearchResult = { score: number; move?: Move };

export class AlphaPlayer extends Player {
  override name: string;
  private static weights = {
    score: 20,
    capture: 15,
    danger: 8,
    safe: 0.1,
  };

  constructor(playerNumber: number, param?: number) {
    param ||= 3;
    super(playerNumber, param);
    this.name = 'alpha' + param;
  }

  private simpleEvaluation(board: Board): number {
    const me = this.playerNumber;
    const opp = me === 1 ? 2 : 1;
    return board.score[me] - board.score[opp];
  }

  private expertEval(board: Board): number {
    const me = this.playerNumber;
    const opp = me === 1 ? 2 : 1;
    const w = AlphaPlayer.weights;
    const rows = board.rows;
    const cols = board.cols;

    const boxSides: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
    let threes = 0;
    let twos = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const owner = board.boxOwner[r][c];
        const sides =
          (board.horizontalLines[r][c] ? 1 : 0) +
          (board.horizontalLines[r + 1][c] ? 1 : 0) +
          (board.verticalLines[r][c] ? 1 : 0) +
          (board.verticalLines[r][c + 1] ? 1 : 0);
        boxSides[r][c] = sides;
        if (owner === 0 && sides === 3) threes += 1;
        else if (owner === 0 && sides === 2) twos += 1;
      }
    }

    let safeMoves = 0;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board.horizontalLines[r][c]) continue;
        const upperRisk = r > 0 && boxSides[r - 1][c] === 2;
        const lowerRisk = r < rows && boxSides[r][c] === 2;
        if (!upperRisk && !lowerRisk) safeMoves++;
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (board.verticalLines[r][c]) continue;
        const leftRisk = c > 0 && boxSides[r][c - 1] === 2;
        const rightRisk = c < cols && boxSides[r][c] === 2;
        if (!leftRisk && !rightRisk) safeMoves++;
      }
    }

    const scoreDiff = board.score[me] - board.score[opp];
    const capturePressure = (board.currentPlayer === me ? 1 : -1) * threes;
    const forcedRisk = Math.max(0, twos - safeMoves);
    const dangerPressure = (board.currentPlayer === me ? -1 : 1) * forcedRisk;
    const safeWeighted = (board.currentPlayer === me ? 1 : -1) * safeMoves;

    const scoreTerm = w.score * scoreDiff;
    const captureTerm = w.capture * capturePressure;
    const dangerTerm = w.danger * dangerPressure;
    const safeTerm = w.safe * safeWeighted;

    return scoreTerm + captureTerm + dangerTerm + safeTerm;
  }

  private evaluate(board: Board): number {
    const expert = false;
    return expert ? this.expertEval(board) : this.simpleEvaluation(board);
  }

  override getMove(board: Board): Move {
    const depth = this.param && this.param > 0 ? this.param : 3;
    const { move } = this.alphabeta(board, depth, -Infinity, Infinity);

    if (move) return move;

    const fallback = board.getLegalMoves()[0];
    if (fallback) throw new Error('No legal moves available');
    return fallback;
  }

  private alphabeta(board: Board, depth: number, alpha: number, beta: number): SearchResult {
    if (depth === 0 || board.isGameOver()) {
      return { score: this.evaluate(board) };
    }

    const moves = board.getLegalMoves();
    for (let i = moves.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      if (j !== i) [moves[i], moves[j]] = [moves[j], moves[i]];
    }
    const maximizing = board.currentPlayer === this.playerNumber;

    let bestMove: Move | undefined;
    let value = maximizing ? -Infinity : Infinity;

    for (const move of moves) {
      const next = board.clone();
      next.move(move);
      const { score } = this.alphabeta(next, depth - 1, alpha, beta);

      if (maximizing ? score > value : score < value) {
        value = score;
        bestMove = move;
      }

      if (maximizing) {
        alpha = Math.max(alpha, value);
      } else {
        beta = Math.min(beta, value);
      }

      if (beta <= alpha) break;
    }

    return { score: value, move: bestMove };
  }
}
