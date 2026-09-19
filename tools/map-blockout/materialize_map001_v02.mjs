import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_VIEWPORTS = [[360, 640], [360, 800]];

function key(cell) {
  return `${cell[0]},${cell[1]}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isCell(cell) {
  return Array.isArray(cell)
    && cell.length === 2
    && Number.isInteger(cell[0])
    && Number.isInteger(cell[1]);
}

function neighbors(cell) {
  const [r, c] = cell;
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
}

export function validateMap001Blockout(model) {
  assert(model && typeof model === 'object' && !Array.isArray(model), 'model must be an object');
  assert(model.schemaVersion === '0.2', 'schemaVersion must be 0.2');
  assert(model.id === 'MAP-001-BLOCKOUT-CANDIDATE-002', 'unexpected blockout id');
  assert(model.status === 'provisional-test-geometry', 'geometry must remain provisional');
  assert(model.coordinateSystem?.worldBearing === 'OPEN', 'world bearing must remain OPEN');

  const { rows, cols, walkableCells, ports } = model.grid ?? {};
  assert(Number.isInteger(rows) && rows > 0, 'grid.rows must be a positive integer');
  assert(Number.isInteger(cols) && cols > 0, 'grid.cols must be a positive integer');
  assert(Array.isArray(walkableCells) && walkableCells.length > 1, 'walkableCells must be non-empty');

  const walk = new Map();
  for (const cell of walkableCells) {
    assert(isCell(cell), 'every walkable cell must be [row,col] integers');
    assert(cell[0] >= 0 && cell[0] < rows && cell[1] >= 0 && cell[1] < cols, `walkable cell out of bounds: ${key(cell)}`);
    assert(!walk.has(key(cell)), `duplicate walkable cell: ${key(cell)}`);
    walk.set(key(cell), cell);
  }

  const top = ports?.screen_up;
  const bottom = ports?.screen_down;
  assert(top?.state === 'open' && top?.priority === 'primary' && top?.progressionRole === 'exit', 'screen_up must be primary open exit');
  assert(bottom?.state === 'open' && bottom?.priority === 'primary' && bottom?.progressionRole === 'entry', 'screen_down must be primary open entry');
  assert(ports?.screen_left?.state === 'closed', 'screen_left must remain closed');
  assert(ports?.screen_right?.state === 'closed', 'screen_right must remain closed');
  assert(isCell(top.cell) && top.cell[0] === 0 && walk.has(key(top.cell)), 'screen_up port must be a walkable top-edge cell');
  assert(isCell(bottom.cell) && bottom.cell[0] === rows - 1 && walk.has(key(bottom.cell)), 'screen_down port must be a walkable bottom-edge cell');

  for (const cell of walk.values()) {
    if (cell[1] === 0) assert(key(cell) === key(top.cell) || key(cell) === key(bottom.cell), 'left edge must remain closed');
    if (cell[1] === cols - 1) assert(key(cell) === key(top.cell) || key(cell) === key(bottom.cell), 'right edge must remain closed');
  }

  const visited = new Set();
  const queue = [bottom.cell];
  while (queue.length) {
    const current = queue.shift();
    const k = key(current);
    if (visited.has(k)) continue;
    visited.add(k);
    for (const n of neighbors(current)) {
      if (walk.has(key(n)) && !visited.has(key(n))) queue.push(n);
    }
  }
  assert(visited.size === walk.size, 'walkable region must be a single connected component');
  assert(visited.has(key(top.cell)), 'bottom entry must connect to top exit');

  const endpoints = [];
  for (const cell of walk.values()) {
    const degree = neighbors(cell).filter((n) => walk.has(key(n))).length;
    assert(degree >= 1 && degree <= 2, `walkable branch or isolated cell detected at ${key(cell)} (degree ${degree})`);
    if (degree === 1) endpoints.push(key(cell));
  }
  assert(endpoints.length === 2, 'walkable path must have exactly two endpoints');
  assert(endpoints.includes(key(top.cell)) && endpoints.includes(key(bottom.cell)), 'path endpoints must be the two open ports');

  const rel = model.territorialRelations ?? {};
  for (const name of ['bridge', 'gate', 'house']) {
    assert(isCell(rel[name]?.cell), `${name}.cell must be defined`);
  }
  assert(walk.has(key(rel.bridge.cell)), 'bridge must sit on the walkable route');
  assert(walk.has(key(rel.gate.cell)), 'gate must sit on the walkable route');
  assert(rel.house.cell[1] < rel.gate.cell[1], 'house must be left of route after threshold');

  const stream = rel.stream;
  assert(Array.isArray(stream?.polylineCells) && stream.polylineCells.length >= 4, 'stream polyline is required');
  assert(stream.polylineCells.some((c) => key(c) === key(rel.bridge.cell)), 'bridge must cross the stream');
  assert(stream.relativeElevation === 'lower-than-adjacent-path', 'stream must remain lower than adjacent path');

  const order = orderedPath(walk, bottom.cell);
  const index = new Map(order.map((cell, i) => [key(cell), i]));
  assert(index.get(key(rel.bridge.cell)) < index.get(key(rel.gate.cell)), 'bridge must precede gate from entry toward interior');
  assert(rel.house.cell[0] < rel.gate.cell[0], 'house must occur after threshold toward screen_up');

  const postThresholdStream = stream.polylineCells.filter((c) => c[0] < rel.gate.cell[0]);
  assert(postThresholdStream.length > 0, 'stream must continue after threshold');
  assert(postThresholdStream.every((c) => c[1] > rel.gate.cell[1]), 'post-threshold stream must remain right of route');

  const turns = [];
  for (let i = 1; i < stream.polylineCells.length - 1; i += 1) {
    const a = stream.polylineCells[i - 1];
    const b = stream.polylineCells[i];
    const c = stream.polylineCells[i + 1];
    const d1 = [b[0] - a[0], b[1] - a[1]];
    const d2 = [c[0] - b[0], c[1] - b[1]];
    if (d1[0] !== d2[0] || d1[1] !== d2[1]) turns.push(b);
  }
  assert(turns.some((c) => Math.abs(c[0] - rel.bridge.cell[0]) <= 1 && Math.abs(c[1] - rel.bridge.cell[1]) <= 1), 'stream must turn near the bridge/threshold');

  assert(model.elevation?.globalAscentDescent === 'OPEN', 'global ascent/descent must remain OPEN');
  assert(model.elevation?.meters === 'OPEN', 'metric elevation must remain OPEN');

  const camera = model.camera ?? {};
  assert(camera.profileId === 'PILOT_FIXED_ISOMETRIC', 'camera profile mismatch');
  assert(camera.orientationPolicy === 'fixed', 'camera orientation must be fixed');
  assert(camera.rotationPolicy === 'disabled', 'camera rotation must be disabled');
  assert(camera.zoomPolicy === 'OPEN', 'camera zoom must remain OPEN');
  assert(JSON.stringify(camera.viewports) === JSON.stringify(REQUIRED_VIEWPORTS), 'required viewports must be exactly 360x640 and 360x800');

  const navigationGeometry = model.navigationGeometry ?? {};
  assert(navigationGeometry.walkableEnvelope?.status === 'NOT_MATERIALIZED', 'walkableEnvelope must remain NOT_MATERIALIZED');
  assert(navigationGeometry.walkableEnvelope?.exactGeometry === 'OPEN', 'walkableEnvelope exact geometry must remain OPEN');
  assert(navigationGeometry.walkableEnvelope?.authority === 'UPSTREAM_NAVIGATION_CONTRACT', 'walkableEnvelope authority must remain upstream');
  assert(navigationGeometry.testRaster?.status === 'PROVISIONAL_TEST_RASTER', 'grid must remain a provisional test raster');
  assert(navigationGeometry.testRaster?.authority === 'TEST_ONLY', 'test raster must remain TEST_ONLY');
  assert(navigationGeometry.testRaster?.derivationFromEnvelope === 'NOT_YET_REGENERABLE', 'test raster must not claim regeneration from a materialized envelope');

  const interaction = model.interactionLearning ?? {};
  assert(interaction.status === 'STRUCTURAL_CONTRACT_DEFINED', 'interaction/learning structural contract must be defined');
  assert(interaction.spatialBinding === 'OPEN', 'interaction spatial binding must remain OPEN');
  assert(JSON.stringify(interaction.sequence) === JSON.stringify(['orient', 'notice', 'observe']), 'interaction sequence must remain orient → notice → observe');

  const units = interaction.units ?? {};
  assert(JSON.stringify(units['UE-001']?.roles) === JSON.stringify(['orient', 'establish_place']), 'UE-001 roles mismatch');
  assert(units['UE-001']?.spatialBinding === 'OPEN', 'UE-001 spatial binding must remain OPEN');
  assert(!('cell' in (units['UE-001'] ?? {})) && !('cells' in (units['UE-001'] ?? {})), 'UE-001 must not invent cell binding');

  assert(JSON.stringify(units['UE-002']?.roles) === JSON.stringify(['exploration']), 'UE-002 roles mismatch');
  assert(units['UE-002']?.observationOpportunity === 'required', 'UE-002 observation opportunity must remain required');
  assert(units['UE-002']?.contentBinding === 'OPEN', 'UE-002 content binding must remain OPEN');
  assert(units['UE-002']?.species === 'OPEN', 'UE-002 species must remain OPEN');
  assert(units['UE-002']?.microhabitat === 'OPEN', 'UE-002 microhabitat must remain OPEN');
  assert(units['UE-002']?.spatialBinding === 'OPEN', 'UE-002 spatial binding must remain OPEN');
  assert(!('cell' in (units['UE-002'] ?? {})) && !('cells' in (units['UE-002'] ?? {})), 'UE-002 must not invent cell binding');

  assert(JSON.stringify(units['UE-003']?.roles) === JSON.stringify(['pause', 'reflection', 'progression']), 'UE-003 roles mismatch');
  assert(units['UE-003']?.contentBinding === 'OPEN', 'UE-003 content binding must remain OPEN');
  assert(units['UE-003']?.spatialBinding === 'OPEN', 'UE-003 spatial binding must remain OPEN');
  assert(!('cell' in (units['UE-003'] ?? {})) && !('cells' in (units['UE-003'] ?? {})), 'UE-003 must not invent cell binding');

  const preIntegration = model.preIntegration ?? {};
  assert(preIntegration.tileGrammarUse === 'PROVISIONAL_FIXTURE_ONLY', 'tile grammar use must remain provisional fixture only');
  assert(preIntegration.walkableRasterAuthority === 'TEST_ONLY', 'walkable raster authority must remain TEST_ONLY');
  assert(preIntegration.waterEdgeRasterization === 'OPEN', 'water edge rasterization must remain OPEN');
  assert(preIntegration.blockerEdgeRasterization === 'OPEN', 'blocker edge rasterization must remain OPEN');
  assert(preIntegration.interactionSpatialBinding === 'OPEN', 'interaction spatial binding must remain OPEN');

  return {
    singleConnectedComponent: true,
    bottomEntryConnected: true,
    topExitConnected: true,
    leftEdgeClosed: true,
    rightEdgeClosed: true,
    noInventedBranches: true,
    mainRouteDominant: true,
    bridgeCrossesStream: true,
    bridgePrecedesGate: true,
    gatePrecedesMainPath: true,
    houseLeftAfterThreshold: true,
    streamTurnsAtThreshold: true,
    streamRightAfterThreshold: true,
    streamLowerThanPath: true,
    cameraInvariantsPreserved: true,
    interactionContractStructural: true,
    interactionSpatialBinding: 'OPEN',
    requiredInteractionSlotVisibleOrReachable: 'NOT TESTED',
    walkableEnvelopeMaterialized: false,
    rasterAuthority: 'TEST_ONLY',
    geometryAuthority: 'PROVISIONAL / TEST ONLY',
  };
}

function orderedPath(walk, start) {
  const result = [];
  let previous = null;
  let current = start;
  while (current) {
    result.push(current);
    const next = neighbors(current)
      .filter((n) => walk.has(key(n)))
      .filter((n) => !previous || key(n) !== key(previous))[0] ?? null;
    previous = current;
    current = next;
  }
  return result;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderBlockoutSvg(model, width, height) {
  validateMap001Blockout(model);
  assert(REQUIRED_VIEWPORTS.some(([w, h]) => w === width && h === height), `unsupported viewport ${width}x${height}`);

  const marginX = 28;
  const marginTop = 74;
  const marginBottom = 42;
  const usableWidth = width - marginX * 2;
  const usableHeight = height - marginTop - marginBottom;
  const cell = Math.min(usableWidth / model.grid.cols, usableHeight / model.grid.rows);
  const gridWidth = cell * model.grid.cols;
  const gridHeight = cell * model.grid.rows;
  const ox = (width - gridWidth) / 2;
  const oy = marginTop + (usableHeight - gridHeight) / 2;
  const center = ([r, c]) => [ox + (c + 0.5) * cell, oy + (r + 0.5) * cell];

  const rects = model.grid.walkableCells.map(([r, c]) => {
    const x = ox + c * cell;
    const y = oy + r * cell;
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="${(cell * 0.16).toFixed(2)}" fill="#ded8c6" stroke="#3b3b35" stroke-width="1"/>`;
  }).join('\n');

  const streamPoints = model.territorialRelations.stream.polylineCells
    .map((c) => center(c).map((v) => v.toFixed(2)).join(','))
    .join(' ');

  const bridge = center(model.territorialRelations.bridge.cell);
  const gate = center(model.territorialRelations.gate.cell);
  const house = center(model.territorialRelations.house.cell);
  const entry = center(model.grid.ports.screen_down.cell);
  const exit = center(model.grid.ports.screen_up.cell);

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <rect width="100%" height="100%" fill="#f5f2e8"/>\n  <text x="18" y="28" font-family="monospace" font-size="13" fill="#222">MAP-001 BLOCKOUT CANDIDATE 002</text>\n  <text x="18" y="47" font-family="monospace" font-size="10" fill="#555">PROVISIONAL TEST GEOMETRY · ${width}×${height}</text>\n  <g aria-label="walkable-envelope-test-raster">\n${rects}\n  </g>\n  <polyline points="${streamPoints}" fill="none" stroke="#5088a0" stroke-width="${Math.max(4, cell * 0.22).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.82"/>\n  <line x1="${(bridge[0] - cell * 0.42).toFixed(2)}" y1="${bridge[1].toFixed(2)}" x2="${(bridge[0] + cell * 0.42).toFixed(2)}" y2="${bridge[1].toFixed(2)}" stroke="#76553d" stroke-width="${Math.max(5, cell * 0.18).toFixed(2)}"/>\n  <rect x="${(gate[0] - cell * 0.30).toFixed(2)}" y="${(gate[1] - cell * 0.18).toFixed(2)}" width="${(cell * 0.60).toFixed(2)}" height="${(cell * 0.36).toFixed(2)}" fill="none" stroke="#7b5a3e" stroke-width="2"/>\n  <rect x="${(house[0] - cell * 0.32).toFixed(2)}" y="${(house[1] - cell * 0.25).toFixed(2)}" width="${(cell * 0.64).toFixed(2)}" height="${(cell * 0.50).toFixed(2)}" fill="#c8b89a" stroke="#5a4a38" stroke-width="1.5"/>\n  <circle cx="${entry[0].toFixed(2)}" cy="${entry[1].toFixed(2)}" r="${(cell * 0.18).toFixed(2)}" fill="#3f6d46"/>\n  <circle cx="${exit[0].toFixed(2)}" cy="${exit[1].toFixed(2)}" r="${(cell * 0.18).toFixed(2)}" fill="#3f6d46"/>\n  <text x="${(entry[0] + cell * 0.30).toFixed(2)}" y="${(entry[1] + 4).toFixed(2)}" font-family="monospace" font-size="9" fill="#333">ENTRY</text>\n  <text x="${(exit[0] + cell * 0.30).toFixed(2)}" y="${(exit[1] + 4).toFixed(2)}" font-family="monospace" font-size="9" fill="#333">EXIT</text>\n  <text x="18" y="${height - 18}" font-family="monospace" font-size="9" fill="#555">walkable raster = TEST ONLY · envelope/metrics/cardinals = OPEN · interaction spatial binding = OPEN</text>\n</svg>\n`;
}

function parseArgs(argv) {
  if (argv.length < 1) throw new Error('usage: materialize_map001.mjs <model.json> [--out-dir <dir>]');
  const input = argv[0];
  let outDir = 'build/map001-blockout';
  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] === '--out-dir' && i + 1 < argv.length) {
      outDir = argv[++i];
    } else {
      throw new Error(`unknown argument: ${argv[i]}`);
    }
  }
  return { input, outDir };
}

function runCli(argv) {
  const { input, outDir } = parseArgs(argv);
  const model = JSON.parse(fs.readFileSync(input, 'utf8'));
  const report = validateMap001Blockout(model);
  fs.mkdirSync(outDir, { recursive: true });
  for (const [width, height] of REQUIRED_VIEWPORTS) {
    const svg = renderBlockoutSvg(model, width, height);
    fs.writeFileSync(path.join(outDir, `map001-blockout-${width}x${height}.svg`), svg, 'utf8');
  }
  fs.writeFileSync(path.join(outDir, 'validation.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedAsScript) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`MAP-001 blockout error: ${error.message}\n`);
    process.exitCode = 1;
  }
}
