import fs from 'node:fs';
import { validatePatch } from './validate_tile_grammar.mjs';

const input = process.argv[2] ?? 'data/tiles/tile-grammar-candidate-v0.1.json';

try {
  const grammar = JSON.parse(fs.readFileSync(input, 'utf8'));
  const report = validatePatch(grammar);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`tile grammar validation error: ${error.message}\n`);
  process.exitCode = 1;
}
