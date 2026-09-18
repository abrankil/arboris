import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, '../..');
const DEFAULT_INPUT = 'data/maps/map-001-walkable-envelope-candidate-001.json';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function samePoint(a, b, eps = 1e-9) {
  return Array.isArray(a) && Array.isArray(b)
    && a.length === 2 && b.length === 2
    && Math.abs(a[0] - b[0]) <= eps
    && Math.abs(a[1] - b[1]) <= eps;
}

function pointSegmentDistance(point, a, b) {
  const [px, py] = point;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

export function distanceToCenterline(point, centerline) {
  let best = Infinity;
  for (let i = 0; i < centerline.length - 1; i += 1) {
    best = Math.min(best, pointSegmentDistance(point, centerline[i], centerline[i + 1]));
  }
  return best;
}

function key(cell) {
  return cell[0] + ',' + cell[1];
}

function sortCells(cells) {
  return cells.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function validateEnvelopeModel(model) {
  invariant(model && typeof model === 'object' && !Array.isArray(model), 'model must be an object');
  invariant(model.schemaVersion === '0.1', 'schemaVersion must be 0.1');
  invariant(model.id === 'MAP-001-WALKABLE-ENVELOPE-CANDIDATE-001', 'unexpected envelope id');
  invariant(model.status === 'CANDIDATE_PENDING_NODE24_AND_AUDIT', 'candidate status mismatch');
  invariant(model.scope === 'NAVIGATION_ONLY', 'scope must remain NAVIGATION_ONLY');
  invariant(model.territorialGeometryClaim === false, 'territorialGeometryClaim must remain false');

  const frame = model.localFrame ?? {};
  invariant(frame.origin === 'screen_up_left', 'local frame origin mismatch');
  invariant(frame.xAxis === 'screen_right', 'xAxis must be screen_right');
  invariant(frame.yAxis === 'screen_down', 'yAxis must be screen_down');
  invariant(frame.unit === 'NAVIGATION_UNIT', 'unit must remain NAVIGATION_UNIT');
  invariant(frame.metricScale === 'OPEN', 'metric scale must remain OPEN');
  invariant(frame.worldBearing === 'OPEN', 'world bearing must remain OPEN');
  invariant(frame.bounds?.minX === 0 && frame.bounds?.maxX === 9, 'x bounds must be 0..9');
  invariant(frame.bounds?.minY === 0 && frame.bounds?.maxY === 15, 'y bounds must be 0..15');

  const geometry = model.geometry ?? {};
  invariant(geometry.type === 'polyline_buffer', 'geometry type must be polyline_buffer');
  invariant(Array.isArray(geometry.centerline) && geometry.centerline.length >= 2, 'centerline requires at least two points');
  for (const point of geometry.centerline) {
    invariant(Array.isArray(point) && point.length === 2 && point.every(Number.isFinite), 'centerline points must be finite [x,y]');
    invariant(point[0] >= 0 && point[0] <= 9 && point[1] >= 0 && point[1] <= 15, 'centerline point outside local bounds');
  }
  for (let i = 0; i < geometry.centerline.length - 1; i += 1) {
    invariant(!samePoint(geometry.centerline[i], geometry.centerline[i + 1]), 'consecutive centerline points must differ');
  }
  invariant(Number.isFinite(geometry.halfWidth) && geometry.halfWidth > 0, 'halfWidth must be positive');
  invariant(geometry.capStyle === 'round', 'capStyle must remain round');
  invariant(geometry.joinStyle === 'round', 'joinStyle must remain round');

  const ports = model.ports ?? [];
  invariant(Array.isArray(ports) && ports.length === 2, 'exactly two open ports are required');
  const entry = ports.find((p) => p.id === 'P-IN');
  const exit = ports.find((p) => p.id === 'P-OUT');
  invariant(entry?.localEdge === 'screen_down' && entry?.state === 'open' && entry?.progressionRole === 'entry', 'P-IN mismatch');
  invariant(exit?.localEdge === 'screen_up' && exit?.state === 'open' && exit?.progressionRole === 'exit', 'P-OUT mismatch');
  invariant(entry?.directionality === 'bidirectional' && exit?.directionality === 'bidirectional', 'ports must remain bidirectional');
  invariant(entry?.worldBearing === 'OPEN' && exit?.worldBearing === 'OPEN', 'port world bearings must remain OPEN');
  invariant(samePoint(entry.anchor, geometry.centerline[0]), 'P-IN anchor must equal centerline start');
  invariant(samePoint(exit.anchor, geometry.centerline[geometry.centerline.length - 1]), 'P-OUT anchor must equal centerline end');
  invariant(Math.abs(entry.anchor[1] - 15) <= 1e-9, 'P-IN must touch screen_down boundary');
  invariant(Math.abs(exit.anchor[1] - 0) <= 1e-9, 'P-OUT must touch screen_up boundary');

  invariant(JSON.stringify(model.closedLocalEdges) === JSON.stringify(['screen_left','screen_right']), 'left/right edges must remain closed');
  const minCenterX = Math.min(...geometry.centerline.map((p) => p[0]));
  const maxCenterX = Math.max(...geometry.centerline.map((p) => p[0]));
  invariant(minCenterX - geometry.halfWidth > 0, 'envelope must not touch screen_left');
  invariant(maxCenterX + geometry.halfWidth < 9, 'envelope must not touch screen_right');

  const raster = model.rasterization ?? {};
  invariant(raster.method === 'CELL_CENTER_DISTANCE_TO_CENTERLINE_LEQ_HALF_WIDTH', 'unexpected rasterization method');
  invariant(raster.grid?.rows === 15 && raster.grid?.cols === 9, 'raster grid must be 15x9');
  invariant(raster.outputRole === 'DERIVED_VERIFICATION_RASTER', 'raster output role mismatch');

  const migration = model.migrationCompatibility ?? {};
  invariant(migration.expectedRelation === 'EXACT_CELL_SET_MATCH', 'migration comparison must be exact cell set');
  invariant(migration.authorityAfterFreeze === 'LEGACY_RASTER_BECOMES_MIGRATION_COMPATIBILITY_ONLY', 'legacy authority transition missing');

  invariant(Array.isArray(model.open) && model.open.includes('metric scale'), 'metric scale must remain listed OPEN');
  invariant(model.open.includes('surveyed route geometry'), 'surveyed route geometry must remain OPEN');
  invariant(model.productionStandard === 'NOT_ESTABLISHED', 'production standard must remain NOT_ESTABLISHED');

  return true;
}

export function rasterizeEnvelope(model) {
  validateEnvelopeModel(model);
  const { rows, cols } = model.rasterization.grid;
  const { centerline, halfWidth } = model.geometry;
  const epsilon = 1e-12;
  const walkableCells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const center = [col + 0.5, row + 0.5];
      if (distanceToCenterline(center, centerline) <= halfWidth + epsilon) {
        walkableCells.push([row, col]);
      }
    }
  }
  return sortCells(walkableCells);
}

export function compareLegacyRaster(model, root = DEFAULT_ROOT) {
  const migration = model.migrationCompatibility;
  const legacyPath = path.join(root, migration.legacyRasterPath);
  const observedHash = sha256File(legacyPath);
  const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  const derived = rasterizeEnvelope(model);
  const legacyCells = sortCells(legacy.grid.walkableCells);
  const derivedSet = new Set(derived.map(key));
  const legacySet = new Set(legacyCells.map(key));
  const onlyDerived = derived.filter((cell) => !legacySet.has(key(cell)));
  const onlyLegacy = legacyCells.filter((cell) => !derivedSet.has(key(cell)));
  return {
    legacyRasterPath: migration.legacyRasterPath,
    legacyHashExpected: migration.legacyRasterSha256,
    legacyHashObserved: observedHash,
    legacyHashMatches: observedHash === migration.legacyRasterSha256,
    derivedWalkableCellCount: derived.length,
    legacyWalkableCellCount: legacyCells.length,
    exactCellSetMatch: onlyDerived.length === 0 && onlyLegacy.length === 0,
    onlyDerived,
    onlyLegacy,
  };
}

function orderedNeighbors(cell) {
  const [r, c] = cell;
  return [[r - 1, c],[r, c + 1],[r + 1, c],[r, c - 1]];
}

export function analyzeDerivedRaster(cells) {
  const walk = new Set(cells.map(key));
  const degreeByCell = {};
  for (const cell of cells) {
    degreeByCell[key(cell)] = orderedNeighbors(cell).filter((n) => walk.has(key(n))).length;
  }

  let components = 0;
  const visited = new Set();
  for (const start of cells) {
    if (visited.has(key(start))) continue;
    components += 1;
    const queue = [start];
    while (queue.length) {
      const current = queue.shift();
      const k = key(current);
      if (visited.has(k)) continue;
      visited.add(k);
      for (const n of orderedNeighbors(current)) {
        if (walk.has(key(n)) && !visited.has(key(n))) queue.push(n);
      }
    }
  }

  const endpoints = cells.filter((cell) => degreeByCell[key(cell)] === 1);
  const branching = cells.filter((cell) => degreeByCell[key(cell)] > 2);

  return {
    connectedComponents: components,
    endpoints: sortCells(endpoints),
    branchingNodes: sortCells(branching),
    degreeByCell,
  };
}

function renderSvg(model, derivedCells) {
  const scale = 48;
  const width = 9 * scale;
  const height = 15 * scale;
  const half = model.geometry.halfWidth * scale;
  const points = model.geometry.centerline.map(([x,y]) => (x * scale) + ',' + (y * scale)).join(' ');
  const cells = derivedCells.map(([row,col]) => {
    const x = col * scale;
    const y = row * scale;
    return '<rect x="' + x + '" y="' + y + '" width="' + scale + '" height="' + scale + '" fill="none" stroke="currentColor" stroke-opacity="0.22"/>';
  }).join('');
  const centers = derivedCells.map(([row,col]) => {
    const x = (col + 0.5) * scale;
    const y = (row + 0.5) * scale;
    return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="currentColor"/>';
  }).join('');
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '">',
    '<rect width="100%" height="100%" fill="white"/>',
    '<g color="#111">',
    cells,
    '<polyline points="' + points + '" fill="none" stroke="#b8d5b0" stroke-width="' + (2 * half) + '" stroke-linecap="round" stroke-linejoin="round"/>',
    '<polyline points="' + points + '" fill="none" stroke="#202020" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    centers,
    '</g>',
    '</svg>',
    ''
  ].join('\n');
}

export function materializeEnvelope(model, root = DEFAULT_ROOT) {
  validateEnvelopeModel(model);
  const derivedCells = rasterizeEnvelope(model);
  const graph = analyzeDerivedRaster(derivedCells);
  const migration = compareLegacyRaster(model, root);
  const status =
    migration.legacyHashMatches
    && migration.exactCellSetMatch
    && derivedCells.length === model.rasterization.expectedDerivedWalkableCellCount
    && graph.connectedComponents === 1
    && graph.branchingNodes.length === 0
    && graph.endpoints.length === 2
      ? 'PASS'
      : 'REVISE';

  const report = {
    envelopeId: model.id,
    status,
    authorityState: model.status,
    territorialGeometryClaim: false,
    localFrameUnit: model.localFrame.unit,
    metricScale: model.localFrame.metricScale,
    worldBearing: model.localFrame.worldBearing,
    derivedRaster: {
      rows: model.rasterization.grid.rows,
      cols: model.rasterization.grid.cols,
      walkableCells: derivedCells,
      walkableCellCount: derivedCells.length,
      connectedComponents: graph.connectedComponents,
      branchingNodes: graph.branchingNodes,
      endpoints: graph.endpoints
    },
    migrationCompatibility: migration,
    futureRasterAuthority: 'WALKABLE_ENVELOPE_AFTER_FREEZE',
    productionStandard: model.productionStandard
  };

  return { report, svg: renderSvg(model, derivedCells) };
}

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT, outDir: 'build/map001-walkable-envelope' };
  if (argv[0] && !argv[0].startsWith('--')) args.input = argv[0];
  const idx = argv.indexOf('--out-dir');
  if (idx >= 0 && argv[idx + 1]) args.outDir = argv[idx + 1];
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = DEFAULT_ROOT;
  const inputPath = path.resolve(root, args.input);
  const outDir = path.resolve(root, args.outDir);
  const model = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const { report, svg } = materializeEnvelope(model, root);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'derived-raster.json'), JSON.stringify(report.derivedRaster, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'validation.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'walkable-envelope.svg'), svg);
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (report.status !== 'PASS') process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(error.stack + '\n');
    process.exitCode = 1;
  });
}
