export type Player = 0 | 1 | 2;

export type Orientation = 'H' | 'V';

export interface Move {
  o: Orientation;
  r: number;
  c: number;
}

export class Board {
  readonly rows: number;
  readonly cols: number;

  horizontalLines: boolean[][];
  verticalLines: boolean[][];
  boxOwner: Player[][];

  currentPlayer: Player;
  score: number[];

  constructor(rows: number, cols: number) {
    if (rows <= 0 || cols <= 0) throw new Error('rows and cols must be positive');
    this.rows = rows;
    this.cols = cols;

    this.horizontalLines = Array.from({ length: rows + 1 }, () => Array<boolean>(cols).fill(false));
    this.verticalLines = Array.from({ length: rows }, () => Array<boolean>(cols + 1).fill(false));
    this.boxOwner = Array.from({ length: rows }, () => Array<Player>(cols).fill(0));

    this.currentPlayer = 1;
    this.score = [0, 0, 0];
  }

  clone(): Board {
    const b = new Board(this.rows, this.cols);

    b.horizontalLines = this.horizontalLines.map(row => [...row]);
    b.verticalLines = this.verticalLines.map(row => [...row]);
    b.boxOwner = this.boxOwner.map(row => [...row]);
    b.currentPlayer = this.currentPlayer;
    b.score = [...this.score];

    return b;
  }

  isLegal({ o, r, c }: Move): boolean {
    if (o === 'H') {
      if (r < 0 || r > this.rows) return false;
      if (c < 0 || c >= this.cols) return false;
      return !this.horizontalLines[r][c];
    } else {
      if (r < 0 || r >= this.rows) return false;
      if (c < 0 || c > this.cols) return false;
      return !this.verticalLines[r][c];
    }
  }

  getLegalMoves(): Move[] {
    const moves: Move[] = [];

    for (let r = 0; r <= this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.horizontalLines[r][c]) {
          moves.push({ o: 'H', r, c });
        }
      }
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= this.cols; c++) {
        if (!this.verticalLines[r][c]) {
          moves.push({ o: 'V', r, c });
        }
      }
    }

    return moves;
  }

  move(move: Move) {
    if (!this.isLegal(move)) throw new Error('Illegal move');

    const { o, r, c } = move;
    const player = this.currentPlayer;
    let boxesCaptured = 0;

    if (o === 'H') {
      this.horizontalLines[r][c] = true;

      if (r > 0 && this.isBoxCompleted(r - 1, c)) {
        this.captureBox(r - 1, c, player);
        boxesCaptured += 1;
      }
      if (r < this.rows && this.isBoxCompleted(r, c)) {
        this.captureBox(r, c, player);
        boxesCaptured += 1;
      }
    } else {
      this.verticalLines[r][c] = true;

      if (c > 0 && this.isBoxCompleted(r, c - 1)) {
        this.captureBox(r, c - 1, player);
        boxesCaptured += 1;
      }
      if (c < this.cols && this.isBoxCompleted(r, c)) {
        this.captureBox(r, c, player);
        boxesCaptured += 1;
      }
    }

    this.score[player] += boxesCaptured;
    if (boxesCaptured === 0) {
      this.currentPlayer = player === 1 ? 2 : 1;
    }
  }

  isBoxCompleted(br: number, bc: number): boolean {
    if (this.boxOwner[br][bc] !== 0) {
      return false;
    }

    const top = this.horizontalLines[br][bc];
    const bottom = this.horizontalLines[br + 1][bc];
    const left = this.verticalLines[br][bc];
    const right = this.verticalLines[br][bc + 1];

    return top && bottom && left && right;
  }

  captureBox(br: number, bc: number, player: Player): void {
    if (this.boxOwner[br][bc] === 0) {
      this.boxOwner[br][bc] = player;
    }
  }

  isGameOver(): boolean {
    for (let r = 0; r <= this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.horizontalLines[r][c]) return false;
      }
    }
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= this.cols; c++) {
        if (!this.verticalLines[r][c]) return false;
      }
    }
    return true;
  }
}
