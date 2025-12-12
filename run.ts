import { Board } from './board.ts';
import { PlayerMap, PlayerType } from './players/types.ts';

export type GameResult = {
  winner: 0 | 1 | 2;
  scores: Record<1 | 2, number>;
  board: Board;
};

export function run(
  player1Type: PlayerType,
  player2Type: PlayerType,
  player1Param = 0,
  player2Param = 0,
  rows: number = 5,
  cols: number = 5,
  interactive = false,
  labels?: Record<1 | 2, string>
): GameResult {
  const player1 = new PlayerMap[player1Type](1, player1Param);
  const player2 = new PlayerMap[player2Type](2, player2Param);

  const board = new Board(rows, cols);
  const label1 = labels?.[1] ?? 'P1';
  const label2 = labels?.[2] ?? 'P2';

  while (!board.isGameOver()) {
    if (interactive) {
      console.log(board.toString());
      console.log(
        `Scores -> ${label1}: ${board.score[1]}  ${label2}: ${board.score[2]}  Current: ${
          board.currentPlayer === 1 ? label1 : label2
        }`
      );
      prompt('Press enter for next move...');
    }
    const currentPlayer = board.currentPlayer === 1 ? player1 : player2;
    const move = currentPlayer.getMove(board.clone());
    board.move(move);
  }
  if (interactive || [player1Type, player2Type].includes('human')) console.log(board.toString());

  const p1Score = board.score[1];
  const p2Score = board.score[2];
  const winner: 0 | 1 | 2 = p1Score === p2Score ? 0 : p1Score > p2Score ? 1 : 2;

  return {
    winner,
    scores: { 1: p1Score, 2: p2Score },
    board,
  };
}
