import fs from 'node:fs';
import { validatePatch } from './validate_tile_grammar_v02.mjs';

const input = process.argv[2] ?? 'data/tiles/tile-grammar-candidate-v0.2.json';

try {
  const grammar = JSON.parse(fs.readFileSync(input, 'utf8'));
  const report = validatePatch(grammar);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`tile grammar v0.2 validation error: ${error.message}\n`);
  process.exitCode = 1;
}
