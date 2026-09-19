import fs from 'node:fs';
import { validateEdgeMatch, validateTile } from './validate_tile_grammar.mjs';

const grammar = JSON.parse(
  fs.readFileSync(
    new URL('../../data/tiles/tile-grammar-candidate-v0.1.json', import.meta.url),
    'utf8',
  ),
);
const byId = new Map(grammar.tiles.map((tile) => [tile.cellId, tile]));
const clone = (value) => structuredClone(value);

function baseLand(id) {
  const tile = clone(byId.get('C07'));
  tile.cellId = id;
  return tile;
}

function setPathPorts(tile, ports) {
  tile.route = { kind: 'path', ports: [...ports] };
  for (const [dir, edge] of Object.entries(tile.edges)) {
    edge.routePort = ports.includes(dir);
    if (edge.routePort) edge.traversal = 'open';
  }
  return tile;
}

function correctPass({ observedValidatorResult }) {
  return observedValidatorResult === 'PASS' ? 'CORRECT' : 'FALSE_NEGATIVE';
}

function correctFail(expectedLayer) {
  return ({ observedValidatorResult, observedRejectionLayer }) => {
    if (observedValidatorResult === 'PASS') return 'FALSE_POSITIVE';
    if (observedRejectionLayer !== expectedLayer) return 'UNDER_SPECIFIED';
    return 'CORRECT';
  };
}

function edgeFixture({
  fixtureId,
  purpose,
  expectedAssessment,
  expectedRejectionLayer = 'NONE',
  a,
  dirA,
  b,
  assess,
}) {
  let observedValidatorResult;
  let observedRejectionLayer = 'NONE';
  let evidence;
  let raw;

  try {
    raw = validateEdgeMatch(a, dirA, b);
    if (raw.compatible) {
      observedValidatorResult = 'PASS';
      evidence = `${raw.edgeA} ↔ ${raw.edgeB}: compatible`;
    } else {
      observedValidatorResult = 'FAIL';
      observedRejectionLayer = 'EDGE_COMPATIBILITY';
      evidence = `${raw.edgeA} ↔ ${raw.edgeB}: ${raw.errors.join(', ')}`;
    }
  } catch (error) {
    observedValidatorResult = 'ERROR';
    observedRejectionLayer = 'TILE_INVARIANT';
    evidence = error.message;
  }

  return {
    fixtureId,
    purpose,
    expectedAssessment,
    expectedRejectionLayer,
    observedValidatorResult,
    observedRejectionLayer,
    grammarAssessment: assess({
      observedValidatorResult,
      observedRejectionLayer,
      evidence,
      raw,
    }),
    evidence,
  };
}

function tileFixture({
  fixtureId,
  purpose,
  expectedAssessment,
  expectedRejectionLayer = 'TILE_INVARIANT',
  tile,
  assess,
}) {
  let observedValidatorResult;
  let observedRejectionLayer = 'NONE';
  let evidence;

  try {
    validateTile(tile);
    observedValidatorResult = 'PASS';
    evidence = `${tile.cellId}: tile invariant validation passed`;
  } catch (error) {
    observedValidatorResult = 'ERROR';
    observedRejectionLayer = 'TILE_INVARIANT';
    evidence = error.message;
  }

  return {
    fixtureId,
    purpose,
    expectedAssessment,
    expectedRejectionLayer,
    observedValidatorResult,
    observedRejectionLayer,
    grammarAssessment: assess({
      observedValidatorResult,
      observedRejectionLayer,
      evidence,
    }),
    evidence,
  };
}

const results = [];

results.push(edgeFixture({
  fixtureId: 'PASS-01',
  purpose: 'land ↔ land with compatible endpoints, traversal, profile and routePort',
  expectedAssessment: 'PASS',
  a: baseLand('P01-A'),
  dirA: 'grid_right',
  b: baseLand('P01-B'),
  assess: correctPass,
}));

const p02a = clone(byId.get('C01')); p02a.cellId = 'P02-PLUS1';
const p02s = clone(byId.get('C04')); p02s.cellId = 'P02-SLOPE';
const p02z = clone(byId.get('C07')); p02z.cellId = 'P02-ZERO';
const p02r1 = validateEdgeMatch(p02a, 'grid_down', p02s);
const p02r2 = validateEdgeMatch(p02s, 'grid_down', p02z);
results.push({
  fixtureId: 'PASS-02',
  purpose: 'relative elevation sequence +1 → slope → 0 through compatible bandEndpoints',
  expectedAssessment: 'PASS',
  expectedRejectionLayer: 'NONE',
  observedValidatorResult: p02r1.compatible && p02r2.compatible ? 'PASS' : 'FAIL',
  observedRejectionLayer: p02r1.compatible && p02r2.compatible ? 'NONE' : 'EDGE_COMPATIBILITY',
  grammarAssessment: p02r1.compatible && p02r2.compatible ? 'CORRECT' : 'FALSE_NEGATIVE',
  evidence: `edge1=${p02r1.compatible ? 'PASS' : p02r1.errors.join(', ')}; edge2=${p02r2.compatible ? 'PASS' : p02r2.errors.join(', ')}`,
});

const p03a = clone(byId.get('C08')); p03a.cellId = 'P03-LAND';
const p03b = clone(byId.get('C09')); p03b.cellId = 'P03-WATER';
results.push(edgeFixture({
  fixtureId: 'PASS-03',
  purpose: 'land ↔ water through closed bank ↔ bank interface',
  expectedAssessment: 'PASS',
  a: p03a,
  dirA: 'grid_right',
  b: p03b,
  assess: correctPass,
}));

const p04a = setPathPorts(baseLand('P04-A'), ['grid_right']);
const p04b = setPathPorts(baseLand('P04-B'), ['grid_left', 'grid_right']);
const p04c = setPathPorts(baseLand('P04-C'), ['grid_left']);
const p04r1 = validateEdgeMatch(p04a, 'grid_right', p04b);
const p04r2 = validateEdgeMatch(p04b, 'grid_right', p04c);
results.push({
  fixtureId: 'PASS-04',
  purpose: 'declarative routePort continuity across three cells; does not claim interior route geometry',
  expectedAssessment: 'PASS',
  expectedRejectionLayer: 'NONE',
  observedValidatorResult: p04r1.compatible && p04r2.compatible ? 'PASS' : 'FAIL',
  observedRejectionLayer: p04r1.compatible && p04r2.compatible ? 'NONE' : 'EDGE_COMPATIBILITY',
  grammarAssessment: p04r1.compatible && p04r2.compatible ? 'CORRECT' : 'FALSE_NEGATIVE',
  evidence: `A↔B=${p04r1.compatible ? 'PASS' : p04r1.errors.join(', ')}; B↔C=${p04r2.compatible ? 'PASS' : p04r2.errors.join(', ')}; scope=EDGE_PORT_CONNECTIVITY_ONLY`,
});

const f01a = setPathPorts(baseLand('F01-A'), ['grid_right']);
const f01b = baseLand('F01-B');
results.push(edgeFixture({
  fixtureId: 'FAIL-01',
  purpose: 'routePort true ↔ false must fail at EDGE_COMPATIBILITY',
  expectedAssessment: 'FAIL',
  expectedRejectionLayer: 'EDGE_COMPATIBILITY',
  a: f01a,
  dirA: 'grid_right',
  b: f01b,
  assess: correctFail('EDGE_COMPATIBILITY'),
}));

const f02a = baseLand('F02-A');
const f02b = baseLand('F02-B');
f02b.edges.grid_left.traversal = 'closed';
results.push(edgeFixture({
  fixtureId: 'FAIL-02',
  purpose: 'traversal open ↔ closed must fail at EDGE_COMPATIBILITY',
  expectedAssessment: 'FAIL',
  expectedRejectionLayer: 'EDGE_COMPATIBILITY',
  a: f02a,
  dirA: 'grid_right',
  b: f02b,
  assess: correctFail('EDGE_COMPATIBILITY'),
}));

const f03a = baseLand('F03-A');
const f03b = baseLand('F03-B');
f03b.edges.grid_left.bandEndpoints = [1, 1];
results.push(edgeFixture({
  fixtureId: 'FAIL-03',
  purpose: 'incompatible bandEndpoints must fail at EDGE_COMPATIBILITY',
  expectedAssessment: 'FAIL',
  expectedRejectionLayer: 'EDGE_COMPATIBILITY',
  a: f03a,
  dirA: 'grid_right',
  b: f03b,
  assess: correctFail('EDGE_COMPATIBILITY'),
}));

const f04a = baseLand('F04-LAND');
f04a.edges.grid_right.traversal = 'closed';
const f04b = clone(byId.get('C09')); f04b.cellId = 'F04-WATER';
f04b.edges.grid_left.profile = 'level';
f04b.edges.grid_left.bandEndpoints = [0, 0];
f04b.edges.grid_left.traversal = 'closed';
results.push(edgeFixture({
  fixtureId: 'FAIL-04',
  purpose: 'land ↔ water without bank ↔ bank closed must fail at EDGE_COMPATIBILITY',
  expectedAssessment: 'FAIL',
  expectedRejectionLayer: 'EDGE_COMPATIBILITY',
  a: f04a,
  dirA: 'grid_right',
  b: f04b,
  assess: correctFail('EDGE_COMPATIBILITY'),
}));

const f05a = clone(byId.get('C03')); f05a.cellId = 'F05A';
f05a.walkability = 'walkable';
results.push(tileFixture({
  fixtureId: 'FAIL-05A',
  purpose: 'hard blocker marked walkable must fail at TILE_INVARIANT',
  expectedAssessment: 'FAIL',
  tile: f05a,
  assess: correctFail('TILE_INVARIANT'),
}));

const f05b = clone(byId.get('C03')); f05b.cellId = 'F05B';
f05b.route = { kind: 'path', ports: ['grid_right'] };
f05b.edges.grid_right.routePort = true;
f05b.edges.grid_right.traversal = 'open';
results.push(tileFixture({
  fixtureId: 'FAIL-05B',
  purpose: 'hard blocker carrying a route must fail at TILE_INVARIANT',
  expectedAssessment: 'FAIL',
  tile: f05b,
  assess: correctFail('TILE_INVARIANT'),
}));

const f06 = clone(byId.get('C02')); f06.cellId = 'F06';
f06.edges.grid_right.traversal = 'open';
results.push(tileFixture({
  fixtureId: 'FAIL-06',
  purpose: 'cliff/blocked edge declared open must fail at TILE_INVARIANT',
  expectedAssessment: 'FAIL',
  tile: f06,
  assess: correctFail('TILE_INVARIANT'),
}));

const r01a = baseLand('R01-MIXED');
r01a.edges.grid_right.content = 'mixed';
const r01b = baseLand('R01-WATER');
r01b.surface.composition = 'water';
r01b.walkability = 'non_walkable';
r01b.edges.grid_left.content = 'water';
const r01raw = validateEdgeMatch(r01a, 'grid_right', r01b);
results.push({
  fixtureId: 'REVIEW-01',
  purpose: 'probe whether edgeContent=mixed is accepted as an unjustified wildcard',
  expectedAssessment: 'REVIEW',
  expectedRejectionLayer: 'NONE',
  observedValidatorResult: r01raw.compatible ? 'PASS' : 'FAIL',
  observedRejectionLayer: r01raw.compatible ? 'NONE' : 'EDGE_COMPATIBILITY',
  grammarAssessment: r01raw.compatible ? 'UNDER_SPECIFIED' : 'CORRECT',
  evidence: r01raw.compatible
    ? 'mixed ↔ water accepted with level/open edge solely because current content matcher treats mixed as universally compatible'
    : r01raw.errors.join(', '),
});

const p05a = baseLand('P05-A');
const p05b = baseLand('P05-B');
const p05c = baseLand('P05-C');
const p05r1 = validateEdgeMatch(p05a, 'grid_right', p05b);
const p05r2 = validateEdgeMatch(p05b, 'grid_right', p05c);
results.push({
  fixtureId: 'PASS-05-MULTICELL-LOCAL',
  purpose: 'confirm that pairwise-compatible cells can be validated without claiming pathfinding or global navigability',
  expectedAssessment: 'PASS',
  expectedRejectionLayer: 'NONE',
  observedValidatorResult: p05r1.compatible && p05r2.compatible ? 'PASS' : 'FAIL',
  observedRejectionLayer: p05r1.compatible && p05r2.compatible ? 'NONE' : 'EDGE_COMPATIBILITY',
  grammarAssessment: p05r1.compatible && p05r2.compatible ? 'CORRECT' : 'FALSE_NEGATIVE',
  evidence: `pairwiseEdges=${p05r1.compatible && p05r2.compatible ? 'PASS' : 'FAIL'}; navigationClaim=NOT_TESTED`,
});

const counts = results.reduce((acc, item) => {
  acc[item.grammarAssessment] = (acc[item.grammarAssessment] ?? 0) + 1;
  return acc;
}, {});

let decision = 'KEEP';
if ((counts.REPRESENTATIONAL_GAP ?? 0) > 0) decision = 'INSUFFICIENT';
else if (
  (counts.FALSE_POSITIVE ?? 0) > 0
  || (counts.FALSE_NEGATIVE ?? 0) > 0
  || (counts.UNDER_SPECIFIED ?? 0) > 0
) decision = 'REVISE';

const report = {
  testId: 'TILE-GRAMMAR-STRESS-TEST-007',
  runtime: process.version,
  candidate: grammar.grammarId,
  fixtureCount: results.length,
  results,
  summary: {
    counts,
    decision,
    productionStandard: 'NOT_ESTABLISHED',
    openPreserved: {
      tileSize: grammar.authority.tileSize,
      metricScale: grammar.authority.metricScale,
      renderer: grammar.authority.renderer,
    },
  },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
