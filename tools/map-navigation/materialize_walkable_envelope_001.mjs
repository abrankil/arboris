import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, '../..');
const DEFAULT_INPUT = 'data/maps/map-001-walkable-envelope-candidate-001.json';
const DEFAULT_AUTHORITY_PATH = 'data/baselines/map001-walkable-envelope-authority-001.json';

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

// ---------------------------------------------------------------------------
// Fail-closed error type for authority/input failures (RECTIFICATION 001).
// This is distinct from a plain thrown Error: callers that expect a
// structured, reportable fail-closed result catch this type specifically
// and turn it into a report object instead of propagating an uncaught
// exception. The exact `code` values are an implementation detail (per
// the correction set §17); the class itself and the fail-closed semantics
// are not.
// ---------------------------------------------------------------------------
export class WalkableEnvelopeAuthorityError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'WalkableEnvelopeAuthorityError';
    this.code = code;
    this.details = details;
  }
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

// ---------------------------------------------------------------------------
// frameBoundaryPolicy = OPEN_PORTS_MAY_CROSS_FRAME (RECTIFICATION 001, §1/§6
// of the correction set). This is an operational invariant checked in code
// against the already-frozen geometry; it is not written into the candidate
// or the authority manifest.
//
// screen_up / screen_down (open ports): envelope ∩ boundary SEGMENT (finite,
// t restricted to [minX,maxX]) must be exactly one connected region, and
// that region must contain the port anchor.
// screen_left / screen_right (closed edges): envelope ∩ boundary SEGMENT
// (finite, t restricted to [minY,maxY]) must be empty.
//
// Implementation: exact closed-form intersection of each polyline_buffer
// capsule (segment + halfWidth) with the axis-aligned boundary line,
// clipped to the finite localFrame edge (not the infinite line — this
// restriction of the *query domain* to the frame's own extent is not
// clipping of the envelope itself, which is never modified or approximated).
// No discrete sampling, no general geometry engine, no portWidth.
//
// A capsule is convex, so its intersection with any line is a single
// interval (or empty); the envelope is the union of per-segment capsules,
// so its boundary-line intersection is the union of those intervals,
// merged with an explicit numeric epsilon (FRAME_BOUNDARY_EPSILON) that
// only closes floating-point seams between adjoining sub-intervals of the
// SAME capsule and merges geometrically-touching/adjacent capsule
// intervals — it never merges across a real, material gap. A degenerate
// zero-width interval [t,t] (exact tangency) is treated as a nonempty
// intersection, consistent with `distance <= halfWidth` being inclusive.
// ---------------------------------------------------------------------------
const FRAME_BOUNDARY_EPSILON = 1e-9;

function intersectIntervals(a, b) {
  if (!a || !b) return null;
  const lo = Math.max(a[0], b[0]);
  const hi = Math.min(a[1], b[1]);
  return lo <= hi + FRAME_BOUNDARY_EPSILON ? [lo, Math.max(lo, hi)] : null;
}

// Merges a list of (possibly overlapping, adjacent, or disjoint) intervals.
// Two intervals merge only if their gap is <= FRAME_BOUNDARY_EPSILON;
// anything wider remains separate, per the explicit gap-vs-epsilon rule.
function mergeIntervals(pieces) {
  const sorted = pieces.filter(Boolean).slice().sort((p, q) => p[0] - q[0]);
  const merged = [];
  for (const [lo, hi] of sorted) {
    const last = merged[merged.length - 1];
    if (last && lo <= last[1] + FRAME_BOUNDARY_EPSILON) {
      last[1] = Math.max(last[1], hi);
    } else {
      merged.push([lo, hi]);
    }
  }
  return merged;
}

// Exact intersection of one capsule (segment a-b buffered by halfWidth) with
// the horizontal line y = fixedY, expressed as x-intervals (0, 1, or more
// pieces before merging — merged by the caller together with every other
// segment's pieces for the same boundary edge).
function capsuleHorizontalLineIntervals(a, b, halfWidth, fixedY) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const h2 = halfWidth * halfWidth;
  const pieces = [];

  if (len2 <= 1e-18) {
    const disc = h2 - (fixedY - ay) * (fixedY - ay);
    if (disc >= 0) {
      const r = Math.sqrt(Math.max(0, disc));
      pieces.push([ax - r, ax + r]);
    }
    return pieces;
  }

  // Projection parameter s(x) along the segment for point (x, fixedY),
  // affine in x: s(x) = s1*x + s0.
  const s1 = dx / len2;
  const s0 = ((fixedY - ay) * dy - ax * dx) / len2;

  if (Math.abs(s1) > 1e-15) {
    const xAt0 = (0 - s0) / s1;
    const xAt1 = (1 - s0) / s1;
    const xLo = Math.min(xAt0, xAt1);
    const xHi = Math.max(xAt0, xAt1);

    // Rectangular region (s(x) in [0,1]): perpendicular distance to the
    // infinite line through a,b. cross(x) = (x-ax)*dy - (fixedY-ay)*dx,
    // affine in x; condition |cross(x)| <= halfWidth * |segment|.
    const c1 = dy;
    const c0 = -ax * dy - (fixedY - ay) * dx;
    const segLen = Math.sqrt(len2);
    const rhs = halfWidth * segLen;
    if (Math.abs(c1) < 1e-15) {
      if (Math.abs(c0) <= rhs + FRAME_BOUNDARY_EPSILON) pieces.push([xLo, xHi]);
    } else {
      let r1 = (-rhs - c0) / c1;
      let r2 = (rhs - c0) / c1;
      if (r1 > r2) [r1, r2] = [r2, r1];
      const clipped = intersectIntervals([xLo, xHi], [r1, r2]);
      if (clipped) pieces.push(clipped);
    }

    // Cap A region (s(x) < 0): distance to endpoint a.
    const discA = h2 - (fixedY - ay) * (fixedY - ay);
    if (discA >= 0) {
      const r = Math.sqrt(Math.max(0, discA));
      const domain = s1 > 0 ? [-Infinity, xLo] : [xLo, Infinity];
      const clipped = intersectIntervals([ax - r, ax + r], domain);
      if (clipped) pieces.push(clipped);
    }

    // Cap B region (s(x) > 1): distance to endpoint b.
    const discB = h2 - (fixedY - by) * (fixedY - by);
    if (discB >= 0) {
      const r = Math.sqrt(Math.max(0, discB));
      const domain = s1 > 0 ? [xHi, Infinity] : [-Infinity, xHi];
      const clipped = intersectIntervals([bx - r, bx + r], domain);
      if (clipped) pieces.push(clipped);
    }
  } else {
    // s(x) is constant (dx === 0): the perpendicular foot does not depend
    // on x, so the whole line is a single region (rect, cap A, or cap B).
    if (s0 >= 0 && s0 <= 1) {
      pieces.push([ax - halfWidth, ax + halfWidth]);
    } else if (s0 < 0) {
      const discA = h2 - (fixedY - ay) * (fixedY - ay);
      if (discA >= 0) {
        const r = Math.sqrt(Math.max(0, discA));
        pieces.push([ax - r, ax + r]);
      }
    } else {
      const discB = h2 - (fixedY - by) * (fixedY - by);
      if (discB >= 0) {
        const r = Math.sqrt(Math.max(0, discB));
        pieces.push([bx - r, bx + r]);
      }
    }
  }

  return pieces;
}

// Mirror of capsuleHorizontalLineIntervals for the vertical line x = fixedX,
// expressed as y-intervals. Same derivation with x/y roles swapped.
function capsuleVerticalLineIntervals(a, b, halfWidth, fixedX) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const h2 = halfWidth * halfWidth;
  const pieces = [];

  if (len2 <= 1e-18) {
    const disc = h2 - (fixedX - ax) * (fixedX - ax);
    if (disc >= 0) {
      const r = Math.sqrt(Math.max(0, disc));
      pieces.push([ay - r, ay + r]);
    }
    return pieces;
  }

  const s1 = dy / len2;
  const s0 = ((fixedX - ax) * dx - ay * dy) / len2;

  if (Math.abs(s1) > 1e-15) {
    const yAt0 = (0 - s0) / s1;
    const yAt1 = (1 - s0) / s1;
    const yLo = Math.min(yAt0, yAt1);
    const yHi = Math.max(yAt0, yAt1);

    const c1 = -dx;
    const c0 = (fixedX - ax) * dy + ay * dx;
    const segLen = Math.sqrt(len2);
    const rhs = halfWidth * segLen;
    if (Math.abs(c1) < 1e-15) {
      if (Math.abs(c0) <= rhs + FRAME_BOUNDARY_EPSILON) pieces.push([yLo, yHi]);
    } else {
      let r1 = (-rhs - c0) / c1;
      let r2 = (rhs - c0) / c1;
      if (r1 > r2) [r1, r2] = [r2, r1];
      const clipped = intersectIntervals([yLo, yHi], [r1, r2]);
      if (clipped) pieces.push(clipped);
    }

    const discA = h2 - (fixedX - ax) * (fixedX - ax);
    if (discA >= 0) {
      const r = Math.sqrt(Math.max(0, discA));
      const domain = s1 > 0 ? [-Infinity, yLo] : [yLo, Infinity];
      const clipped = intersectIntervals([ay - r, ay + r], domain);
      if (clipped) pieces.push(clipped);
    }

    const discB = h2 - (fixedX - bx) * (fixedX - bx);
    if (discB >= 0) {
      const r = Math.sqrt(Math.max(0, discB));
      const domain = s1 > 0 ? [yHi, Infinity] : [-Infinity, yHi];
      const clipped = intersectIntervals([by - r, by + r], domain);
      if (clipped) pieces.push(clipped);
    }
  } else {
    if (s0 >= 0 && s0 <= 1) {
      pieces.push([ay - halfWidth, ay + halfWidth]);
    } else if (s0 < 0) {
      const discA = h2 - (fixedX - ax) * (fixedX - ax);
      if (discA >= 0) {
        const r = Math.sqrt(Math.max(0, discA));
        pieces.push([ay - r, ay + r]);
      }
    } else {
      const discB = h2 - (fixedX - bx) * (fixedX - bx);
      if (discB >= 0) {
        const r = Math.sqrt(Math.max(0, discB));
        pieces.push([by - r, by + r]);
      }
    }
  }

  return pieces;
}

// Exact envelope ∩ boundary-SEGMENT regions for one localFrame edge: unions
// the per-centerline-segment capsule intervals, clips each to the finite
// edge extent ([minX,maxX] or [minY,maxY] — the frame's own boundary
// segment, not the envelope), and merges within FRAME_BOUNDARY_EPSILON.
function frameBoundaryRegions(centerline, halfWidth, edge, bounds) {
  const { minX, maxX, minY, maxY } = bounds;
  const isHorizontal = edge === 'screen_up' || edge === 'screen_down';
  const fixedValue =
    edge === 'screen_up' ? minY
    : edge === 'screen_down' ? maxY
    : edge === 'screen_left' ? minX
    : maxX;
  const domain = isHorizontal ? [minX, maxX] : [minY, maxY];

  const pieces = [];
  for (let i = 0; i < centerline.length - 1; i += 1) {
    const rawIntervals = isHorizontal
      ? capsuleHorizontalLineIntervals(centerline[i], centerline[i + 1], halfWidth, fixedValue)
      : capsuleVerticalLineIntervals(centerline[i], centerline[i + 1], halfWidth, fixedValue);
    for (const interval of rawIntervals) {
      const clipped = intersectIntervals(interval, domain);
      if (clipped) pieces.push(clipped);
    }
  }

  return mergeIntervals(pieces);
}

export function validateFrameBoundaryPolicy(model) {
  invariant(model?.geometry?.centerline && model?.localFrame?.bounds, 'frameBoundaryPolicy check requires geometry and localFrame.bounds');
  const bounds = model.localFrame.bounds;
  const halfWidth = model.geometry.halfWidth;
  const centerline = model.geometry.centerline;
  const eps = FRAME_BOUNDARY_EPSILON;

  for (const edge of ['screen_left', 'screen_right']) {
    const regions = frameBoundaryRegions(centerline, halfWidth, edge, bounds);
    if (regions.length !== 0) {
      throw new WalkableEnvelopeAuthorityError(
        'FRAME_BOUNDARY_LATERAL_INTERSECTION',
        `frameBoundaryPolicy violation: envelope intersects closed edge ${edge}`,
        { edge, regions }
      );
    }
  }

  const ports = model.ports ?? [];
  const portByEdge = {
    screen_up: ports.find((p) => p.localEdge === 'screen_up'),
    screen_down: ports.find((p) => p.localEdge === 'screen_down'),
  };

  for (const edge of ['screen_up', 'screen_down']) {
    const port = portByEdge[edge];
    invariant(port && Array.isArray(port.anchor), `frameBoundaryPolicy check requires a port anchor on ${edge}`);
    const regions = frameBoundaryRegions(centerline, halfWidth, edge, bounds);
    if (regions.length !== 1) {
      throw new WalkableEnvelopeAuthorityError(
        'FRAME_BOUNDARY_OPEN_PORT_NOT_SINGLE_REGION',
        `frameBoundaryPolicy violation: expected exactly one connected crossing region on ${edge}, found ${regions.length}`,
        { edge, regions }
      );
    }
    const anchorT = port.anchor[0];
    const [run] = regions;
    if (anchorT < run[0] - eps || anchorT > run[1] + eps) {
      throw new WalkableEnvelopeAuthorityError(
        'FRAME_BOUNDARY_ANCHOR_NOT_IN_REGION',
        `frameBoundaryPolicy violation: port anchor is not contained in the crossing region on ${edge}`,
        { edge, anchorT, run }
      );
    }
  }

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

// ---------------------------------------------------------------------------
// Authority manifest handling (RECTIFICATION 001).
//
// The authority manifest was previously only a documental declaration: no
// code read it. This is the normal entry point now: authority manifest →
// authorized candidate (path + id + SHA-256 verified) → envelope → derived
// raster. Candidate 002 (legacy) is never read on this path.
// ---------------------------------------------------------------------------

export function loadAuthorityManifest(root = DEFAULT_ROOT, authorityPath = DEFAULT_AUTHORITY_PATH) {
  const resolved = path.isAbsolute(authorityPath) ? authorityPath : path.join(root, authorityPath);
  let raw;
  try {
    raw = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    throw new WalkableEnvelopeAuthorityError(
      'AUTHORITY_MANIFEST_UNREADABLE',
      'authority manifest could not be read: ' + authorityPath,
      { cause: err.message }
    );
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new WalkableEnvelopeAuthorityError(
      'AUTHORITY_MANIFEST_INVALID_JSON',
      'authority manifest is not valid JSON: ' + authorityPath,
      { cause: err.message }
    );
  }
}

function requireExact(actual, expected, label) {
  if (actual !== expected) {
    throw new WalkableEnvelopeAuthorityError(
      'AUTHORITY_INVARIANT_MISMATCH',
      `${label} mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      { label, expected, actual }
    );
  }
}

// Validates the authority manifest by exact value (correction set §11/§12).
// Any discrepancy fails closed — no warning-and-continue path exists here.
export function validateAuthorityManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new WalkableEnvelopeAuthorityError('AUTHORITY_MANIFEST_INVALID_SHAPE', 'authority manifest must be an object');
  }

  requireExact(manifest.schemaVersion, '0.1', 'schemaVersion');
  requireExact(manifest.authorityId, 'MAP-001-WALKABLE-ENVELOPE-AUTHORITY-001', 'authorityId');
  requireExact(manifest.status, 'FROZEN_NAVIGATION_AUTHORITY', 'status');
  requireExact(manifest.scope, 'MAP-001 LOCAL NAVIGATION GEOMETRY ONLY', 'scope');

  const src = manifest.sourceCandidate ?? {};
  requireExact(src.id, 'MAP-001-WALKABLE-ENVELOPE-CANDIDATE-001', 'sourceCandidate.id');
  requireExact(src.path, 'data/maps/map-001-walkable-envelope-candidate-001.json', 'sourceCandidate.path');
  if (typeof src.sha256 !== 'string' || src.sha256.length === 0) {
    throw new WalkableEnvelopeAuthorityError('AUTHORITY_INVARIANT_MISMATCH', 'sourceCandidate.sha256 must be a non-empty string');
  }

  const rule = manifest.authorityRule ?? {};
  requireExact(rule.canonicalNavigationGeometry, src.path, 'authorityRule.canonicalNavigationGeometry');
  requireExact(rule.legacyRasterRole, 'MIGRATION_COMPATIBILITY_ONLY', 'authorityRule.legacyRasterRole');
  requireExact(rule.legacyRasterPath, 'data/maps/map-001-blockout-candidate-002.json', 'authorityRule.legacyRasterPath');
  requireExact(rule.reverseAuthorityProhibited, true, 'authorityRule.reverseAuthorityProhibited');

  const interpretation = manifest.interpretation ?? {};
  requireExact(interpretation.unit, 'NAVIGATION_UNIT', 'interpretation.unit');
  requireExact(interpretation.territorialGeometryClaim, false, 'interpretation.territorialGeometryClaim');
  requireExact(interpretation.metricScale, 'OPEN', 'interpretation.metricScale');
  requireExact(interpretation.worldBearing, 'OPEN', 'interpretation.worldBearing');
  requireExact(interpretation.surveyedRouteGeometry, 'OPEN', 'interpretation.surveyedRouteGeometry');

  requireExact(manifest.productionStandard, 'NOT_ESTABLISHED', 'productionStandard');

  return true;
}

// Resolves and verifies the candidate authorized by the manifest: reads it
// from sourceCandidate.path, checks its SHA-256 against sourceCandidate.sha256,
// and checks candidate.id against sourceCandidate.id. Fails closed on any
// mismatch or unreadable/invalid file. Never touches Candidate 002.
export function verifyAuthorizedCandidate(manifest, root = DEFAULT_ROOT) {
  const src = manifest.sourceCandidate;
  const candidatePath = path.join(root, src.path);

  let raw;
  try {
    raw = fs.readFileSync(candidatePath);
  } catch (err) {
    throw new WalkableEnvelopeAuthorityError(
      'CANDIDATE_UNREADABLE',
      'authorized candidate could not be read: ' + src.path,
      { cause: err.message }
    );
  }

  const observedSha = crypto.createHash('sha256').update(raw).digest('hex');
  if (observedSha !== src.sha256) {
    throw new WalkableEnvelopeAuthorityError(
      'CANDIDATE_SHA_MISMATCH',
      'candidate SHA-256 does not match authority manifest sourceCandidate.sha256',
      { expected: src.sha256, observed: observedSha, path: src.path }
    );
  }

  let candidate;
  try {
    candidate = JSON.parse(raw.toString('utf8'));
  } catch (err) {
    throw new WalkableEnvelopeAuthorityError(
      'CANDIDATE_INVALID_JSON',
      'authorized candidate is not valid JSON: ' + src.path,
      { cause: err.message }
    );
  }

  if (candidate.id !== src.id) {
    throw new WalkableEnvelopeAuthorityError(
      'CANDIDATE_ID_MISMATCH',
      'candidate.id does not match authority manifest sourceCandidate.id',
      { expected: src.id, observed: candidate.id }
    );
  }

  return candidate;
}

// ---------------------------------------------------------------------------
// authority-runtime: the operational gate. Never reads Candidate 002, never
// depends on migration-evidence, and its PASS never incorporates
// legacyHashMatches / exactCellSetMatch.
// ---------------------------------------------------------------------------
export function materializeWalkableEnvelopeAuthority(root = DEFAULT_ROOT, authorityPath = DEFAULT_AUTHORITY_PATH) {
  let manifest;
  let candidate;
  try {
    manifest = loadAuthorityManifest(root, authorityPath);
    validateAuthorityManifest(manifest);
    candidate = verifyAuthorizedCandidate(manifest, root);
    validateEnvelopeModel(candidate);
    validateFrameBoundaryPolicy(candidate);
  } catch (err) {
    if (err instanceof WalkableEnvelopeAuthorityError) {
      return {
        report: {
          status: 'FAIL_CLOSED',
          failureClass: 'AUTHORITY_INPUT_FAILURE',
          code: err.code,
          message: err.message,
          details: err.details,
          candidate002Dependency: false
        },
        svg: null
      };
    }
    throw err;
  }

  const derivedCells = rasterizeEnvelope(candidate);
  const graph = analyzeDerivedRaster(derivedCells);
  const geometryOk =
    derivedCells.length === candidate.rasterization.expectedDerivedWalkableCellCount
    && graph.connectedComponents === 1
    && graph.branchingNodes.length === 0
    && graph.endpoints.length === 2;

  const status = geometryOk ? 'PASS' : 'REVISE';

  const report = {
    authorityId: manifest.authorityId,
    envelopeId: candidate.id,
    status,
    failureClass: geometryOk ? null : 'GEOMETRY_NAVIGATION_FAILURE',
    authorityState: manifest.status,
    frameBoundaryPolicy: 'OPEN_PORTS_MAY_CROSS_FRAME',
    territorialGeometryClaim: false,
    localFrameUnit: candidate.localFrame.unit,
    metricScale: candidate.localFrame.metricScale,
    worldBearing: candidate.localFrame.worldBearing,
    derivedRaster: {
      rows: candidate.rasterization.grid.rows,
      cols: candidate.rasterization.grid.cols,
      walkableCells: derivedCells,
      walkableCellCount: derivedCells.length,
      connectedComponents: graph.connectedComponents,
      branchingNodes: graph.branchingNodes,
      endpoints: graph.endpoints
    },
    futureRasterAuthority: 'WALKABLE_ENVELOPE_AFTER_FREEZE',
    productionStandard: candidate.productionStandard,
    candidate002Dependency: false
  };

  return { report, svg: renderSvg(candidate, derivedCells) };
}

// ---------------------------------------------------------------------------
// migration-evidence: historical compatibility check against Candidate 002.
// Entirely separate entry point from authority-runtime. If Candidate 002 is
// absent, this returns a structured missing-input result — never a PASS/
// REVISE migration verdict, never an uncaught I/O exception.
// ---------------------------------------------------------------------------
export function validateWalkableEnvelopeMigration(root = DEFAULT_ROOT, authorityPath = DEFAULT_AUTHORITY_PATH) {
  let manifest;
  let candidate;
  try {
    manifest = loadAuthorityManifest(root, authorityPath);
    validateAuthorityManifest(manifest);
    candidate = verifyAuthorizedCandidate(manifest, root);
    validateEnvelopeModel(candidate);
  } catch (err) {
    if (err instanceof WalkableEnvelopeAuthorityError) {
      return {
        status: 'MIGRATION_INPUT_MISSING',
        failureClass: 'AUTHORITY_INPUT_FAILURE',
        code: err.code,
        message: err.message
      };
    }
    throw err;
  }

  const migration = candidate.migrationCompatibility;
  const legacyPath = path.join(root, migration.legacyRasterPath);

  if (!fs.existsSync(legacyPath)) {
    return {
      status: 'MIGRATION_INPUT_MISSING',
      failureClass: 'MIGRATION_INPUT_FAILURE',
      code: 'LEGACY_CANDIDATE_ABSENT',
      message: 'Candidate 002 (legacy raster) is absent; no migration verdict emitted',
      candidateId: candidate.id
    };
  }

  const comparison = compareLegacyRaster(candidate, root);
  const status = comparison.legacyHashMatches && comparison.exactCellSetMatch ? 'MIGRATION_PASS' : 'MIGRATION_REVISE';

  return {
    status,
    failureClass: status === 'MIGRATION_PASS' ? null : 'MIGRATION_COMPATIBILITY_FAILURE',
    candidateId: candidate.id,
    comparison
  };
}

function parseArgs(argv) {
  const args = { mode: 'authority', authorityPath: DEFAULT_AUTHORITY_PATH, outDir: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--mode') {
      args.mode = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--out-dir') {
      args.outDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (!token.startsWith('--')) {
      args.authorityPath = token;
    }
  }
  if (!args.outDir) {
    args.outDir = args.mode === 'migration'
      ? 'build/map001-walkable-envelope-migration'
      : 'build/map001-walkable-envelope';
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = DEFAULT_ROOT;
  const outDir = path.resolve(root, args.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  if (args.mode === 'migration') {
    const result = validateWalkableEnvelopeMigration(root, args.authorityPath);
    fs.writeFileSync(path.join(outDir, 'migration-validation.json'), JSON.stringify(result, null, 2) + '\n');
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (result.status !== 'MIGRATION_PASS') process.exitCode = 1;
    return;
  }

  const { report, svg } = materializeWalkableEnvelopeAuthority(root, args.authorityPath);
  fs.writeFileSync(path.join(outDir, 'validation.json'), JSON.stringify(report, null, 2) + '\n');
  if (report.derivedRaster) {
    fs.writeFileSync(path.join(outDir, 'derived-raster.json'), JSON.stringify(report.derivedRaster, null, 2) + '\n');
  }
  if (svg) {
    fs.writeFileSync(path.join(outDir, 'walkable-envelope.svg'), svg);
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (report.status !== 'PASS') process.exitCode = 1;
}

// DEFAULT_INPUT is kept for tooling/tests that need the raw candidate path
// independent of the authority manifest indirection (e.g. building negative
// fixtures in memory).
export { DEFAULT_INPUT, DEFAULT_AUTHORITY_PATH, DEFAULT_ROOT };

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(error.stack + '\n');
    process.exitCode = 1;
  });
}
