import { validateEdgeMatch, validateTile } from './validate_tile_grammar_v02.mjs';

const clone = (value) => structuredClone(value);
const dirs = ['grid_up', 'grid_right', 'grid_down', 'grid_left'];

function mkEdge({ content = 'land', profile = 'level', band = [0, 0], traversal = 'open', routePort = false } = {}) {
  return { content, profile, bandEndpoints: [...band], traversal, routePort };
}

function mkTile(id, {
  surface = 'land', walkability = 'walkable', blocker = 'none',
  routeKind = 'none', routePorts = [], elevationMode = 'flat', band = 0,
} = {}) {
  const edges = Object.fromEntries(dirs.map((d) => [d, mkEdge({ band: [band, band] })]));
  const tile = {
    cellId: id,
    surface: { composition: surface },
    walkability,
    blocker,
    route: { kind: routeKind, ports: [...routePorts] },
    elevation: { mode: elevationMode, reference: 'RELATIVE_ONLY' },
    edges,
    visualTreatment: { status: 'ART_PROVISIONAL', hint: 'fixture' },
  };
  for (const d of routePorts) tile.edges[d].routePort = true;
  return tile;
}

function setPathPorts(tile, ports) {
  tile.route = { kind: 'path', ports: [...ports] };
  for (const d of dirs) {
    tile.edges[d].routePort = ports.includes(d);
    if (tile.edges[d].routePort) tile.edges[d].traversal = 'open';
  }
  return tile;
}

function edgeRun(a, dirA, b) {
  try {
    const raw = validateEdgeMatch(a, dirA, b);
    return {
      observedValidatorResult: raw.compatible ? 'PASS' : 'FAIL',
      observedRejectionLayer: raw.compatible ? 'NONE' : 'EDGE_COMPATIBILITY',
      evidence: raw.compatible ? `${raw.edgeA} ↔ ${raw.edgeB}: compatible` : `${raw.edgeA} ↔ ${raw.edgeB}: ${raw.errors.join(', ')}`,
    };
  } catch (error) {
    return { observedValidatorResult: 'ERROR', observedRejectionLayer: 'TILE_INVARIANT', evidence: error.message };
  }
}

function tileRun(tile) {
  try {
    validateTile(tile);
    return { observedValidatorResult: 'PASS', observedRejectionLayer: 'NONE', evidence: `${tile.cellId}: valid tile` };
  } catch (error) {
    return { observedValidatorResult: 'ERROR', observedRejectionLayer: 'TILE_INVARIANT', evidence: error.message };
  }
}

function assess(expectedAssessment, expectedLayer, observed) {
  if (expectedAssessment === 'PASS') return observed.observedValidatorResult === 'PASS' ? 'CORRECT' : 'FALSE_NEGATIVE';
  if (expectedAssessment === 'FAIL') {
    if (observed.observedValidatorResult === 'PASS') return 'FALSE_POSITIVE';
    return observed.observedRejectionLayer === expectedLayer ? 'CORRECT' : 'UNDER_SPECIFIED';
  }
  return 'UNDER_SPECIFIED';
}

function recordEdge(results, fixtureId, purpose, expectedAssessment, expectedLayer, a, dirA, b) {
  const observed = edgeRun(a, dirA, b);
  results.push({ fixtureId, purpose, expectedAssessment, expectedRejectionLayer: expectedLayer, ...observed, grammarAssessment: assess(expectedAssessment, expectedLayer, observed) });
}

function recordTile(results, fixtureId, purpose, expectedAssessment, expectedLayer, tile) {
  const observed = tileRun(tile);
  results.push({ fixtureId, purpose, expectedAssessment, expectedRejectionLayer: expectedLayer, ...observed, grammarAssessment: assess(expectedAssessment, expectedLayer, observed) });
}

const results = [];

recordEdge(results, 'PASS-01', 'land ↔ land compatible', 'PASS', 'NONE', mkTile('P01-A'), 'grid_right', mkTile('P01-B'));

const p02a = mkTile('P02-PLUS1', { band: 1 });
const p02s = mkTile('P02-SLOPE', { elevationMode: 'slope' });
p02s.edges.grid_left.bandEndpoints = [1, 1];
p02s.edges.grid_right.bandEndpoints = [0, 0];
const p02z = mkTile('P02-ZERO', { band: 0 });
const p02r1 = edgeRun(p02a, 'grid_right', p02s);
const p02r2 = edgeRun(p02s, 'grid_right', p02z);
const p02Observed = p02r1.observedValidatorResult === 'PASS' && p02r2.observedValidatorResult === 'PASS'
  ? { observedValidatorResult: 'PASS', observedRejectionLayer: 'NONE', evidence: 'both relative-elevation joins compatible' }
  : { observedValidatorResult: 'FAIL', observedRejectionLayer: 'EDGE_COMPATIBILITY', evidence: `${p02r1.evidence}; ${p02r2.evidence}` };
results.push({ fixtureId: 'PASS-02', purpose: '+1 → slope → 0', expectedAssessment: 'PASS', expectedRejectionLayer: 'NONE', ...p02Observed, grammarAssessment: assess('PASS', 'NONE', p02Observed) });

const p03land = mkTile('P03-LAND');
p03land.edges.grid_right = mkEdge({ content: 'land', profile: 'bank', band: [0, 0], traversal: 'closed' });
const p03water = mkTile('P03-WATER', { surface: 'water', walkability: 'non_walkable' });
p03water.edges.grid_left = mkEdge({ content: 'water', profile: 'bank', band: [0, 0], traversal: 'closed' });
recordEdge(results, 'PASS-03', 'land ↔ water closed bank', 'PASS', 'NONE', p03land, 'grid_right', p03water);

const p04a = setPathPorts(mkTile('P04-A'), ['grid_right']);
const p04b = setPathPorts(mkTile('P04-B'), ['grid_left', 'grid_right']);
const p04c = setPathPorts(mkTile('P04-C'), ['grid_left']);
const p04r1 = edgeRun(p04a, 'grid_right', p04b);
const p04r2 = edgeRun(p04b, 'grid_right', p04c);
const p04Observed = p04r1.observedValidatorResult === 'PASS' && p04r2.observedValidatorResult === 'PASS'
  ? { observedValidatorResult: 'PASS', observedRejectionLayer: 'NONE', evidence: 'three-cell routePort chain compatible; scope=EDGE_PORT_CONNECTIVITY_ONLY' }
  : { observedValidatorResult: 'FAIL', observedRejectionLayer: 'EDGE_COMPATIBILITY', evidence: `${p04r1.evidence}; ${p04r2.evidence}` };
results.push({ fixtureId: 'PASS-04', purpose: 'declarative routePort continuity', expectedAssessment: 'PASS', expectedRejectionLayer: 'NONE', ...p04Observed, grammarAssessment: assess('PASS', 'NONE', p04Observed) });

const p05a = mkTile('P05-A'); const p05b = mkTile('P05-B'); const p05c = mkTile('P05-C');
const p05r1 = edgeRun(p05a, 'grid_right', p05b); const p05r2 = edgeRun(p05b, 'grid_right', p05c);
const p05Observed = p05r1.observedValidatorResult === 'PASS' && p05r2.observedValidatorResult === 'PASS'
  ? { observedValidatorResult: 'PASS', observedRejectionLayer: 'NONE', evidence: 'pairwiseEdges=PASS; navigationClaim=NOT_TESTED' }
  : { observedValidatorResult: 'FAIL', observedRejectionLayer: 'EDGE_COMPATIBILITY', evidence: `${p05r1.evidence}; ${p05r2.evidence}` };
results.push({ fixtureId: 'PASS-05-MULTICELL-LOCAL', purpose: 'pairwise local compatibility without global navigation claim', expectedAssessment: 'PASS', expectedRejectionLayer: 'NONE', ...p05Observed, grammarAssessment: assess('PASS', 'NONE', p05Observed) });

const f01a = setPathPorts(mkTile('F01-A'), ['grid_right']);
recordEdge(results, 'FAIL-01', 'routePort true ↔ false', 'FAIL', 'EDGE_COMPATIBILITY', f01a, 'grid_right', mkTile('F01-B'));

const f02a = mkTile('F02-A'); const f02b = mkTile('F02-B'); f02b.edges.grid_left.traversal = 'closed';
recordEdge(results, 'FAIL-02', 'traversal open ↔ closed', 'FAIL', 'EDGE_COMPATIBILITY', f02a, 'grid_right', f02b);

const f03a = mkTile('F03-A'); const f03b = mkTile('F03-B'); f03b.edges.grid_left.bandEndpoints = [1, 1];
recordEdge(results, 'FAIL-03', 'bandEndpoints mismatch', 'FAIL', 'EDGE_COMPATIBILITY', f03a, 'grid_right', f03b);

const f04a = mkTile('F04-LAND'); f04a.edges.grid_right.traversal = 'closed';
const f04b = mkTile('F04-WATER', { surface: 'water', walkability: 'non_walkable' });
f04b.edges.grid_left.content = 'water'; f04b.edges.grid_left.traversal = 'closed';
recordEdge(results, 'FAIL-04', 'land ↔ water without bank', 'FAIL', 'EDGE_COMPATIBILITY', f04a, 'grid_right', f04b);

const f05a = mkTile('F05A', { walkability: 'non_walkable', blocker: 'hard' });
for (const d of dirs) { f05a.edges[d].profile = 'blocked'; f05a.edges[d].traversal = 'closed'; }
f05a.walkability = 'walkable';
recordTile(results, 'FAIL-05A', 'hard blocker walkable', 'FAIL', 'TILE_INVARIANT', f05a);

const f05b = mkTile('F05B', { walkability: 'non_walkable', blocker: 'hard' });
for (const d of dirs) { f05b.edges[d].profile = 'blocked'; f05b.edges[d].traversal = 'closed'; }
f05b.route = { kind: 'path', ports: ['grid_right'] }; f05b.edges.grid_right.routePort = true; f05b.edges.grid_right.traversal = 'open';
recordTile(results, 'FAIL-05B', 'hard blocker carrying route', 'FAIL', 'TILE_INVARIANT', f05b);

const f06 = mkTile('F06'); f06.edges.grid_right.profile = 'cliff'; f06.edges.grid_right.traversal = 'open';
recordTile(results, 'FAIL-06', 'open cliff', 'FAIL', 'TILE_INVARIANT', f06);

const mp01 = mkTile('MIXED-PASS-01-A', { surface: 'mixed', walkability: 'mixed', elevationMode: 'mixed' });
recordEdge(results, 'MIXED-PASS-01', 'surface.composition=mixed may expose a concrete land edge', 'PASS', 'NONE', mp01, 'grid_right', mkTile('MIXED-PASS-01-B'));

const mp02 = mkTile('MIXED-PASS-02-A', { surface: 'mixed', walkability: 'mixed', elevationMode: 'mixed' });
mp02.edges.grid_right = mkEdge({ content: 'water', profile: 'bank', band: [0, 0], traversal: 'closed' });
const mp02w = mkTile('MIXED-PASS-02-B', { surface: 'water', walkability: 'non_walkable' });
mp02w.edges.grid_left = mkEdge({ content: 'water', profile: 'bank', band: [0, 0], traversal: 'closed' });
recordEdge(results, 'MIXED-PASS-02', 'mixed surface may expose a concrete water bank edge', 'PASS', 'NONE', mp02, 'grid_right', mp02w);

const mf01a = mkTile('MIXED-FAIL-01-A'); mf01a.edges.grid_right.content = 'mixed';
recordEdge(results, 'MIXED-FAIL-01', 'edgeContent=mixed ↔ land is unresolved and non-connectable', 'FAIL', 'EDGE_COMPATIBILITY', mf01a, 'grid_right', mkTile('MIXED-FAIL-01-B'));

const mf02a = mkTile('MIXED-FAIL-02-A'); mf02a.edges.grid_right.content = 'mixed';
const mf02b = mkTile('MIXED-FAIL-02-B', { surface: 'water', walkability: 'non_walkable' }); mf02b.edges.grid_left.content = 'water';
recordEdge(results, 'MIXED-FAIL-02', 'edgeContent=mixed ↔ water is unresolved and non-connectable', 'FAIL', 'EDGE_COMPATIBILITY', mf02a, 'grid_right', mf02b);

const mf03a = mkTile('MIXED-FAIL-03-A'); mf03a.edges.grid_right.content = 'mixed';
const mf03b = mkTile('MIXED-FAIL-03-B'); mf03b.edges.grid_left.content = 'mixed';
recordEdge(results, 'MIXED-FAIL-03', 'edgeContent=mixed ↔ mixed remains unresolved without edge segmentation', 'FAIL', 'EDGE_COMPATIBILITY', mf03a, 'grid_right', mf03b);

const counts = results.reduce((acc, item) => { acc[item.grammarAssessment] = (acc[item.grammarAssessment] ?? 0) + 1; return acc; }, {});
let decision = 'KEEP';
if ((counts.REPRESENTATIONAL_GAP ?? 0) > 0) decision = 'INSUFFICIENT';
else if ((counts.FALSE_POSITIVE ?? 0) > 0 || (counts.FALSE_NEGATIVE ?? 0) > 0 || (counts.UNDER_SPECIFIED ?? 0) > 0) decision = 'REVISE';

const report = {
  testId: 'TILE-GRAMMAR-MIXED-SEMANTICS-TEST-008',
  runtime: process.version,
  candidate: 'TILE-GRAMMAR-CANDIDATE-v0.2',
  mixedEdgePolicy: 'UNRESOLVED_NON_CONNECTABLE',
  fixtureCount: results.length,
  results,
  summary: { counts, decision, productionStandard: 'NOT_ESTABLISHED', openPreserved: { tileSize: 'OPEN', metricScale: 'OPEN', renderer: 'OPEN', pathfinding: 'OPEN' } },
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
