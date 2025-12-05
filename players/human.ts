import { Board, Move } from '../board.ts';
import { Player } from './player.ts';

export class HumanPlayer extends Player {
  name = 'human';

  override getMove(board: Board): Move {
    const legalMoves = board.getLegalMoves();
    const { labeledBoard, labelToMove } = this.renderLabeledBoard(board, legalMoves);

    while (true) {
      console.log(labeledBoard);

      const input = prompt(`Player ${this.playerNumber} move (enter letter, or q to quit):`);
      if (input === null) continue;
      const trimmed = input.trim();
      if (trimmed === '') continue;

      if (trimmed.toLowerCase() === 'q') {
        console.log('Input cancelled, exiting.');
        Deno.exit(0);
      }

      const chosen = labelToMove.get(trimmed);
      if (!chosen) {
        console.log('Unknown move label, try again.');
        continue;
      }
      return chosen;
    }
  }

  private renderLabeledBoard(board: Board, moves: Move[]) {
    const symbols = 'abcdefghijklmnoprstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const labelToMove = new Map<string, Move>();
    const hLabels = new Map<string, string>();
    const vLabels = new Map<string, string>();

    moves.forEach((move, idx) => {
      const label = symbols[idx] ?? '?';
      labelToMove.set(label, move);
      const key = `${move.o}-${move.r}-${move.c}`;
      if (move.o === 'H') hLabels.set(key, label);
      else vLabels.set(key, label);
    });

    const lines: string[] = [];
    const hSeg = (r: number, c: number) => {
      const key = `H-${r}-${c}`;
      if (board.horizontalLines[r][c]) return '---';
      const label = hLabels.get(key) ?? ' ';
      return ` ${label} `;
    };
    const vSeg = (r: number, c: number) => {
      const key = `V-${r}-${c}`;
      if (board.verticalLines[r][c]) return '|';
      return vLabels.get(key) ?? ' ';
    };

    for (let r = 0; r < board.rows; r++) {
      let top = '';
      for (let c = 0; c < board.cols; c++) {
        top += `+${hSeg(r, c)}`;
      }
      top += '+';
      lines.push(top);

      let mid = '';
      for (let c = 0; c < board.cols; c++) {
        const owner = board.boxOwner[r][c] === 0 ? ' ' : String(board.boxOwner[r][c]);
        mid += `${vSeg(r, c)} ${owner} `;
      }
      mid += vSeg(r, board.cols);
      lines.push(mid);
    }

    let bottom = '';
    for (let c = 0; c < board.cols; c++) {
      bottom += `+${hSeg(board.rows, c)}`;
    }
    bottom += '+';
    lines.push(bottom);

    return { labeledBoard: lines.join('\n'), labelToMove };
  }
}
