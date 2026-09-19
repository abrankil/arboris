const DIRECTIONS = ['grid_up', 'grid_right', 'grid_down', 'grid_left'];
const OPPOSITE = {
  grid_up: 'grid_down',
  grid_right: 'grid_left',
  grid_down: 'grid_up',
  grid_left: 'grid_right',
};

const SURFACE_COMPOSITIONS = new Set(['land', 'water', 'mixed']);
const WALKABILITY = new Set(['walkable', 'non_walkable', 'mixed']);
const BLOCKERS = new Set(['none', 'hard']);
const ROUTE_KINDS = new Set(['none', 'path']);
const ELEVATION_MODES = new Set(['flat', 'slope', 'mixed']);
const EDGE_CONTENT = new Set(['land', 'water', 'mixed']);
const EDGE_PROFILES = new Set(['level', 'slope', 'bank', 'cliff', 'blocked']);
const TRAVERSAL = new Set(['open', 'closed']);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isBandEndpoints(value) {
  return Array.isArray(value)
    && value.length === 2
    && value.every(Number.isInteger);
}

export function validateTile(tile) {
  invariant(tile && typeof tile === 'object' && !Array.isArray(tile), 'tile must be an object');
  invariant(typeof tile.cellId === 'string' && tile.cellId.length > 0, 'cellId is required');
  invariant(SURFACE_COMPOSITIONS.has(tile.surface?.composition), `${tile.cellId}: invalid surface.composition`);
  invariant(WALKABILITY.has(tile.walkability), `${tile.cellId}: invalid walkability`);
  invariant(BLOCKERS.has(tile.blocker), `${tile.cellId}: invalid blocker`);
  invariant(ROUTE_KINDS.has(tile.route?.kind), `${tile.cellId}: invalid route.kind`);
  invariant(Array.isArray(tile.route?.ports), `${tile.cellId}: route.ports must be an array`);
  invariant(new Set(tile.route.ports).size === tile.route.ports.length, `${tile.cellId}: duplicate route port`);
  for (const port of tile.route.ports) invariant(DIRECTIONS.includes(port), `${tile.cellId}: invalid route port ${port}`);
  invariant(tile.route.kind === 'path' || tile.route.ports.length === 0, `${tile.cellId}: route ports require route.kind=path`);
  invariant(tile.route.kind !== 'path' || tile.route.ports.length >= 1, `${tile.cellId}: path requires at least one route port`);

  invariant(ELEVATION_MODES.has(tile.elevation?.mode), `${tile.cellId}: invalid elevation.mode`);
  invariant(tile.elevation?.reference === 'RELATIVE_ONLY', `${tile.cellId}: elevation.reference must be RELATIVE_ONLY`);
  invariant(tile.visualTreatment?.status === 'ART_PROVISIONAL', `${tile.cellId}: visual treatment must remain ART_PROVISIONAL`);

  invariant(tile.edges && typeof tile.edges === 'object', `${tile.cellId}: edges are required`);
  for (const dir of DIRECTIONS) {
    const edge = tile.edges[dir];
    invariant(edge && typeof edge === 'object', `${tile.cellId}: missing edge ${dir}`);
    invariant(EDGE_CONTENT.has(edge.content), `${tile.cellId}.${dir}: invalid content`);
    invariant(EDGE_PROFILES.has(edge.profile), `${tile.cellId}.${dir}: invalid profile`);
    invariant(isBandEndpoints(edge.bandEndpoints), `${tile.cellId}.${dir}: bandEndpoints must be two integers`);
    invariant(TRAVERSAL.has(edge.traversal), `${tile.cellId}.${dir}: invalid traversal`);
    invariant(typeof edge.routePort === 'boolean', `${tile.cellId}.${dir}: routePort must be boolean`);
    invariant(edge.routePort === tile.route.ports.includes(dir), `${tile.cellId}.${dir}: routePort must match route.ports`);
    if (edge.profile === 'cliff' || edge.profile === 'blocked') {
      invariant(edge.traversal === 'closed', `${tile.cellId}.${dir}: ${edge.profile} edge must be closed`);
    }
    if (edge.routePort) invariant(edge.traversal === 'open', `${tile.cellId}.${dir}: route port must be open`);
  }

  if (tile.blocker === 'hard') {
    invariant(tile.walkability === 'non_walkable', `${tile.cellId}: hard blocker must be non_walkable`);
    invariant(DIRECTIONS.every((dir) => tile.edges[dir].traversal === 'closed'), `${tile.cellId}: hard blocker edges must be closed`);
    invariant(tile.route.kind === 'none', `${tile.cellId}: hard blocker cannot carry a route`);
  }

  return true;
}

function reverseEndpoints([a, b]) {
  return [b, a];
}

function samePair(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function profilesCompatible(a, b) {
  if (a === b) return true;
  return (a === 'cliff' && b === 'blocked') || (a === 'blocked' && b === 'cliff');
}

function contentsCompatible(a, b, profileA, profileB, traversal) {
  if (a === b) return true;
  if (a === 'mixed' || b === 'mixed') return true;
  const landWater = (a === 'land' && b === 'water') || (a === 'water' && b === 'land');
  return landWater && profileA === 'bank' && profileB === 'bank' && traversal === 'closed';
}

export function validateEdgeMatch(tileA, dirA, tileB) {
  validateTile(tileA);
  validateTile(tileB);
  invariant(DIRECTIONS.includes(dirA), `invalid direction ${dirA}`);
  const dirB = OPPOSITE[dirA];
  const a = tileA.edges[dirA];
  const b = tileB.edges[dirB];

  const errors = [];
  if (!samePair(a.bandEndpoints, reverseEndpoints(b.bandEndpoints))) errors.push('bandEndpoints mismatch');
  if (a.routePort !== b.routePort) errors.push('routePort mismatch');
  if (a.traversal !== b.traversal) errors.push('traversal mismatch');
  if (!profilesCompatible(a.profile, b.profile)) errors.push('edgeProfile mismatch');
  if (!contentsCompatible(a.content, b.content, a.profile, b.profile, a.traversal)) errors.push('edgeContent mismatch');

  return {
    compatible: errors.length === 0,
    edgeA: `${tileA.cellId}.${dirA}`,
    edgeB: `${tileB.cellId}.${dirB}`,
    errors,
  };
}

export function assertEdgeMatch(tileA, dirA, tileB) {
  const result = validateEdgeMatch(tileA, dirA, tileB);
  invariant(result.compatible, `${result.edgeA} ↔ ${result.edgeB}: ${result.errors.join(', ')}`);
  return result;
}

export function validatePatch(grammar) {
  invariant(grammar?.schemaVersion === '0.1', 'schemaVersion must be 0.1');
  invariant(grammar?.grammarId === 'TILE-GRAMMAR-CANDIDATE-v0.1', 'unexpected grammarId');
  invariant(grammar?.authority?.metricScale === 'OPEN', 'metric scale must remain OPEN');
  invariant(grammar?.authority?.tileSize === 'OPEN', 'tile size must remain OPEN');
  invariant(grammar?.authority?.renderer === 'OPEN', 'renderer must remain OPEN');
  invariant(grammar?.authority?.territorialVoxel === false, 'prisms must not be territorial voxels');
  invariant(Array.isArray(grammar.tiles) && grammar.tiles.length > 0, 'tiles are required');
  invariant(Array.isArray(grammar.patch) && grammar.patch.length === 3, 'patch must have 3 rows');
  invariant(grammar.patch.every((row) => Array.isArray(row) && row.length === 3), 'patch must be 3x3');

  const tiles = new Map();
  for (const tile of grammar.tiles) {
    validateTile(tile);
    invariant(!tiles.has(tile.cellId), `duplicate tile id ${tile.cellId}`);
    tiles.set(tile.cellId, tile);
  }

  const patchIds = grammar.patch.flat();
  invariant(patchIds.length === 9, 'patch must contain exactly nine cells');
  invariant(new Set(patchIds).size === 9, 'patch cells must be unique');
  for (const id of patchIds) invariant(tiles.has(id), `patch references unknown tile ${id}`);

  const matches = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const tile = tiles.get(grammar.patch[r][c]);
      if (c < 2) matches.push(assertEdgeMatch(tile, 'grid_right', tiles.get(grammar.patch[r][c + 1])));
      if (r < 2) matches.push(assertEdgeMatch(tile, 'grid_down', tiles.get(grammar.patch[r + 1][c])));
    }
  }

  return {
    grammarId: grammar.grammarId,
    tilesValidated: grammar.tiles.length,
    patchCells: 9,
    internalEdgesValidated: matches.length,
    compatibleInternalEdges: matches.length,
    status: 'PASS',
    productionStandard: 'NOT_ESTABLISHED',
  };
}

export const TILE_GRAMMAR_CONSTANTS = {
  DIRECTIONS,
  OPPOSITE,
};
