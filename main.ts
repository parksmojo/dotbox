import { program } from 'npm:commander';
import { z } from 'npm:zod';
import { run } from './run.ts';
import { PlayerMap, PlayerType } from './players/types.ts';

const PlayerSchema = z.enum(['random', 'human', 'alpha', 'carlo']);
const optionalInt = z.preprocess(
  val => (typeof val === 'number' && Number.isNaN(val) ? undefined : val),
  z.number().int().optional()
);
const OptionsSchema = z.object({
  p1: optionalInt.default(0),
  p2: optionalInt.default(0),
  number: optionalInt.default(1).transform(v => (v && v > 0 ? v : 1)),
  interactive: z.boolean().optional().default(false),
  verbose: z.boolean().optional().default(false),
  size: z
    .string()
    .optional()
    .transform(val => {
      if (!val) return undefined;
      const parts = val.split(',').map(n => Number(n));
      if (parts.length !== 2 || parts.some(n => !Number.isInteger(n) || n <= 0)) {
        throw new Error('Size must be two positive integers separated by a comma, e.g. 5,5');
      }
      return { rows: parts[0], cols: parts[1] };
    })
    .default({ rows: 5, cols: 5 }),
});

program
  .argument('<player1>')
  .argument('<player2>')
  .option('--p1 <number>', 'param', parseInt)
  .option('--p2 <number>', 'param', parseInt)
  .option('-n, --number <number>', 'simulations to run', parseInt)
  .option('-i, --interactive', 'step through each move', false)
  .option('-s, --size <rows,cols>', 'board size, e.g. 5,5')
  .option('-v, --verbose')
  .action((player1Input, player2Input, options) => {
    const player1: PlayerType = PlayerSchema.parse(player1Input);
    const player2: PlayerType = PlayerSchema.parse(player2Input);
    const { p1, p2, number, interactive, size, verbose } = OptionsSchema.parse(options);
    const shouldStep = interactive;

    const nameA = new PlayerMap[player1](1, p1).name;
    const nameB = new PlayerMap[player2](2, p2).name;
    const labelA = nameA + (nameA === nameB ? 'A' : '');
    const labelB = nameB + (nameA === nameB ? 'B' : '');

    if (interactive && ([player1, player2].includes('human') || number > 1)) {
      throw 'you cant do that';
    }

    const roundCount = number === 1 ? 1 : number * 2;

    let p1Wins = 0;
    let p2Wins = 0;
    let ties = 0;

    for (let i = 0; i < roundCount; i++) {
      const swap = roundCount > 1 && i % 2 === 1;
      const firstType = swap ? player2 : player1;
      const secondType = swap ? player1 : player2;
      const firstParam = swap ? p2 : p1;
      const secondParam = swap ? p1 : p2;
      const labelsForGame = swap ? { 1: labelB, 2: labelA } : { 1: labelA, 2: labelB };

      const { winner, scores } = run(
        firstType,
        secondType,
        firstParam,
        secondParam,
        size.rows,
        size.cols,
        shouldStep,
        labelsForGame
      );

      const mappedWinner = winner === 0 ? 0 : swap ? (winner === 1 ? 2 : 1) : winner;

      const p1Score = swap ? scores[2] : scores[1];
      const p2Score = swap ? scores[1] : scores[2];
      const starterLabel = swap ? labelB : labelA;

      if (mappedWinner === 1) p1Wins++;
      else if (mappedWinner === 2) p2Wins++;
      else ties++;

      if (roundCount === 1 || verbose)
        console.log(
          `Game ${i + 1} (P1: ${starterLabel}): ${labelA} ${p1Score} - ${labelB} ${p2Score} (${
            mappedWinner === 0 ? 'tie' : `winner: ${mappedWinner === 1 ? labelA : labelB}`
          })`
        );
    }

    if (roundCount > 1) {
      console.log(`Totals -> ${labelA} wins: ${p1Wins}, ${labelB} wins: ${p2Wins}, ties: ${ties}`);
    }
  });

program.parse();
