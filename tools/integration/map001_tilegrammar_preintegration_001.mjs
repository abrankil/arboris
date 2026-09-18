import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateTile, validateEdgeMatch } from '../tile-grammar/validate_tile_grammar_v02.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, '../..');
const CONTRACT_PATH = 'data/integration/map001-tilegrammar-preintegration-test-001.contract.json';
const BASELINE_PATH = 'data/baselines/map001-tilegrammar-node24-baseline-001.json';

const DIRECTIONS = [
  { dir: 'grid_up', dr: -1, dc: 0 },
  { dir: 'grid_right', dr: 0, dc: 1 },
  { dir: 'grid_down', dr: 1, dc: 0 },
  { dir: 'grid_left', dr: 0, dc: -1 },
];

function cellKey(cell) {
  return String(cell[0]) + ',' + String(cell[1]);
}

function cellId(cell) {
  return 'MAP001-R' + String(cell[0]).padStart(2, '0') + '-C' + String(cell[1]).padStart(2, '0');
}

function clone(value) {
  return structuredClone(value);
}

export function computeSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function sameCell(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

export function analyzeRaster(mapModel) {
  const cells = mapModel.grid.walkableCells.map((cell) => [cell[0], cell[1]]);
  const byKey = new Map(cells.map((cell) => [cellKey(cell), cell]));
  const adjacencyMap = new Map();

  for (const cell of cells) {
    const [r, c] = cell;
    for (const item of DIRECTIONS) {
      const n = [r + item.dr, c + item.dc];
      if (!byKey.has(cellKey(n))) continue;
      const a = cellKey(cell);
      const b = cellKey(n);
      const pairKey = [a, b].sort().join('|');
      if (!adjacencyMap.has(pairKey)) {
        adjacencyMap.set(pairKey, {
          a: [cell[0], cell[1]],
          b: [n[0], n[1]],
          dirA: item.dir,
        });
      }
    }
  }

  const degrees = new Map(cells.map((cell) => [cellKey(cell), 0]));
  for (const edge of adjacencyMap.values()) {
    degrees.set(cellKey(edge.a), degrees.get(cellKey(edge.a)) + 1);
    degrees.set(cellKey(edge.b), degrees.get(cellKey(edge.b)) + 1);
  }

  let components = 0;
  const visited = new Set();
  for (const start of cells) {
    if (visited.has(cellKey(start))) continue;
    components += 1;
    const queue = [start];
    while (queue.length) {
      const current = queue.shift();
      const key = cellKey(current);
      if (visited.has(key)) continue;
      visited.add(key);
      const [r, c] = current;
      for (const item of DIRECTIONS) {
        const n = [r + item.dr, c + item.dc];
        if (byKey.has(cellKey(n)) && !visited.has(cellKey(n))) queue.push(n);
      }
    }
  }

  const endpoints = cells
    .filter((cell) => degrees.get(cellKey(cell)) === 1)
    .map((cell) => [cell[0], cell[1]])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const branching = cells
    .filter((cell) => degrees.get(cellKey(cell)) > 2)
    .map((cell) => [cell[0], cell[1]]);

  const adjacencies = [...adjacencyMap.values()].sort((x, y) => {
    const ax = cellKey(x.a) + '|' + cellKey(x.b);
    const ay = cellKey(y.a) + '|' + cellKey(y.b);
    return ax.localeCompare(ay);
  });

  return {
    walkableCellCount: cells.length,
    orthogonalSharedAdjacencies: adjacencies.length,
    connectedComponents: components,
    branchingNodes: branching.length,
    endpointCells: endpoints,
    adjacencies,
  };
}

function directionBetween(a, b) {
  const dr = b[0] - a[0];
  const dc = b[1] - a[1];
  const found = DIRECTIONS.find((item) => item.dr === dr && item.dc === dc);
  if (!found) throw new Error('non-orthogonal adjacency: ' + cellKey(a) + ' -> ' + cellKey(b));
  return found.dir;
}

function opposite(dir) {
  return {
    grid_up: 'grid_down',
    grid_right: 'grid_left',
    grid_down: 'grid_up',
    grid_left: 'grid_right',
  }[dir];
}

export function buildExecutableFixture(mapModel, graph) {
  const sharedByCell = new Map();
  for (const cell of mapModel.grid.walkableCells) sharedByCell.set(cellKey(cell), new Set());

  for (const edge of graph.adjacencies) {
    const dirA = directionBetween(edge.a, edge.b);
    const dirB = opposite(dirA);
    sharedByCell.get(cellKey(edge.a)).add(dirA);
    sharedByCell.get(cellKey(edge.b)).add(dirB);
  }

  const fieldProvenance = {};
  const tiles = mapModel.grid.walkableCells
    .map((cell) => [cell[0], cell[1]])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map((cell) => {
      const id = cellId(cell);
      const shared = sharedByCell.get(cellKey(cell));
      const provenance = {
        walkability: 'DERIVED_FROM_TEST_RASTER',
        'surface.composition': 'TEST_SCAFFOLD',
        blocker: 'TEST_SCAFFOLD',
        'route.kind': 'TEST_SCAFFOLD',
        'route.ports': 'TEST_SCAFFOLD',
        'elevation.mode': 'TEST_SCAFFOLD',
        'elevation.reference': 'TEST_SCAFFOLD',
        'visualTreatment.status': 'TEST_SCAFFOLD',
        'visualTreatment.hint': 'TEST_SCAFFOLD',
      };

      const edges = {};
      for (const item of DIRECTIONS) {
        const isShared = shared.has(item.dir);
        edges[item.dir] = {
          content: 'land',
          profile: 'level',
          bandEndpoints: [0, 0],
          traversal: isShared ? 'open' : 'closed',
          routePort: false,
        };
        provenance['edges.' + item.dir + '.content'] = 'TEST_SCAFFOLD';
        provenance['edges.' + item.dir + '.profile'] = 'TEST_SCAFFOLD';
        provenance['edges.' + item.dir + '.bandEndpoints'] = 'TEST_SCAFFOLD';
        provenance['edges.' + item.dir + '.routePort'] = 'TEST_SCAFFOLD';
        provenance['edges.' + item.dir + '.traversal'] = isShared
          ? 'DERIVED_FROM_TEST_RASTER'
          : 'TEST_SCAFFOLD';
      }

      fieldProvenance[id] = provenance;
      return {
        cellId: id,
        sourceCell: cell,
        surface: { composition: 'land' },
        walkability: 'walkable',
        blocker: 'none',
        route: { kind: 'none', ports: [] },
        elevation: { mode: 'flat', reference: 'RELATIVE_ONLY' },
        edges,
        visualTreatment: { status: 'ART_PROVISIONAL', hint: 'preintegration-test-scaffold' },
      };
    });

  const bySource = new Map(tiles.map((tile) => [cellKey(tile.sourceCell), tile]));
  const adjacencyResults = [];
  for (const edge of graph.adjacencies) {
    const tileA = bySource.get(cellKey(edge.a));
    const tileB = bySource.get(cellKey(edge.b));
    const dirA = directionBetween(edge.a, edge.b);
    adjacencyResults.push({
      sourceA: edge.a,
      sourceB: edge.b,
      dirA,
      tileA: tileA.cellId,
      tileB: tileB.cellId,
    });
  }

  return {
    tiles,
    fieldProvenance,
    adjacencies: adjacencyResults,
    normalizations: {
      referenceBandCode: 0,
      provenanceClass: 'NORMALIZED_ENCODING',
      appliedPerCell: false,
      note: 'Conceptual normalization only; fixture bandEndpoints remain TEST_SCAFFOLD.',
    },
  };
}

export function checkProvenanceIntegrity(fixture) {
  const violations = [];
  const allowedDerived = new Set(['walkability']);

  for (const tile of fixture.tiles) {
    const p = fixture.fieldProvenance[tile.cellId];
    for (const [field, provenance] of Object.entries(p)) {
      if (provenance === 'DERIVED_FROM_TEST_RASTER') {
        const isSharedTraversal = field.startsWith('edges.') && field.endsWith('.traversal') && tile.edges[field.split('.')[1]].traversal === 'open';
        if (!allowedDerived.has(field) && !isSharedTraversal) {
          violations.push(tile.cellId + ':' + field + ':unexpected-derived');
        }
      }
      if (provenance === 'TEST_SCAFFOLD' && field === 'walkability') {
        violations.push(tile.cellId + ':walkability:scaffold-leak');
      }
    }

    if (tile.route.kind !== 'none' || tile.route.ports.length !== 0) {
      violations.push(tile.cellId + ':route-overlay-inferred');
    }
  }

  return {
    pass: violations.length === 0,
    violations,
  };
}

function countDerivedWaterBankEdges(fixture) {
  let count = 0;
  for (const tile of fixture.tiles) {
    const provenance = fixture.fieldProvenance[tile.cellId];
    for (const item of DIRECTIONS) {
      const prefix = 'edges.' + item.dir + '.';
      const edge = tile.edges[item.dir];
      const contentDerived = provenance[prefix + 'content'] !== 'TEST_SCAFFOLD';
      const profileDerived = provenance[prefix + 'profile'] !== 'TEST_SCAFFOLD';
      if ((edge.content === 'water' && contentDerived) || (edge.profile === 'bank' && profileDerived)) count += 1;
    }
  }
  return count;
}

function countDerivedBlockerEdges(fixture) {
  let count = 0;
  for (const tile of fixture.tiles) {
    const provenance = fixture.fieldProvenance[tile.cellId];
    if (tile.blocker === 'hard' && provenance.blocker !== 'TEST_SCAFFOLD') count += 1;
    for (const item of DIRECTIONS) {
      const field = 'edges.' + item.dir + '.profile';
      const profile = tile.edges[item.dir].profile;
      if ((profile === 'blocked' || profile === 'cliff') && provenance[field] !== 'TEST_SCAFFOLD') count += 1;
    }
  }
  return count;
}

function preflight(root, contract) {
  const checks = [];
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  checks.push({ check: 'node-major-24', pass: nodeMajor === 24, observed: process.version });

  const baseline = readJson(root, BASELINE_PATH);
  checks.push({
    check: 'baseline-id',
    pass: baseline.baselineId === contract.baseline.baselineId,
    observed: baseline.baselineId,
  });

  const baselineHashExpectations = {
    'data/maps/map-001-blockout-candidate-002.json': baseline.map001.hashes.candidateJson,
    'data/tiles/tile-grammar-candidate-v0.2.json': baseline.tileGrammar.hashes.candidateJson,
    'tools/tile-grammar/validate_tile_grammar_v02.mjs': baseline.tileGrammar.hashes.validator,
  };

  for (const input of contract.authorizedInputs) {
    if (!input.sha256) continue;
    const observed = computeSha256(path.join(root, input.path));
    checks.push({
      check: 'sha256:' + input.path,
      pass: observed === input.sha256,
      observed,
      expected: input.sha256,
    });
    if (baselineHashExpectations[input.path]) {
      checks.push({
        check: 'baseline-manifest:' + input.path,
        pass: baselineHashExpectations[input.path] === input.sha256,
        observed: baselineHashExpectations[input.path],
        expected: input.sha256,
      });
    }
  }

  return {
    fixtureId: 'PI-00-BASELINE-PREFLIGHT',
    status: checks.every((item) => item.pass) ? 'BASELINE_VALID' : 'INVALID_BASELINE',
    checks,
  };
}

function validateFixture(fixture) {
  const tileResults = fixture.tiles.map((tile) => {
    try {
      validateTile(tile);
      return { cellId: tile.cellId, result: 'PASS' };
    } catch (error) {
      return { cellId: tile.cellId, result: 'ERROR', error: error.message };
    }
  });

  const byId = new Map(fixture.tiles.map((tile) => [tile.cellId, tile]));
  const edgeResults = fixture.adjacencies.map((item) => {
    try {
      const raw = validateEdgeMatch(byId.get(item.tileA), item.dirA, byId.get(item.tileB));
      return {
        tileA: item.tileA,
        tileB: item.tileB,
        dirA: item.dirA,
        result: raw.compatible ? 'PASS' : 'FAIL',
        errors: raw.errors,
      };
    } catch (error) {
      return {
        tileA: item.tileA,
        tileB: item.tileB,
        dirA: item.dirA,
        result: 'ERROR',
        errors: [error.message],
      };
    }
  });

  return {
    tileResults,
    edgeResults,
    pass: tileResults.every((item) => item.result === 'PASS') && edgeResults.every((item) => item.result === 'PASS'),
  };
}

function graphMatchesContract(graph, contract) {
  const expected = contract.rasterFacts;
  const endpointPass = expected.expectedEndpointCells.every((cell) => graph.endpointCells.some((actual) => sameCell(actual, cell)))
    && graph.endpointCells.length === expected.expectedEndpointCells.length;
  return {
    pass:
      graph.walkableCellCount === expected.walkableCellCount
      && graph.orthogonalSharedAdjacencies === expected.expectedOrthogonalSharedAdjacencies
      && graph.connectedComponents === expected.expectedConnectedComponents
      && graph.branchingNodes === expected.expectedBranchingNodes
      && endpointPass,
    endpointPass,
  };
}

function mappingRecord(fields) {
  return {
    fixtureId: fields.fixtureId,
    sourcePath: fields.sourcePath,
    sourceValue: fields.sourceValue,
    targetField: fields.targetField,
    provenanceClass: fields.provenanceClass,
    representationAssessment: fields.representationAssessment,
    validatorResult: fields.validatorResult,
    mappingAssessment: fields.mappingAssessment,
    evidence: fields.evidence,
    openOrGapReason: fields.openOrGapReason ?? null,
    scaffoldFields: fields.scaffoldFields ?? [],
  };
}

export function runPreintegration(options = {}) {
  const root = options.root ?? DEFAULT_ROOT;
  const contract = options.contractOverride ?? readJson(root, CONTRACT_PATH);
  const pre = preflight(root, contract);

  const baseReport = {
    testId: contract.testId,
    contractRevision: contract.contractRevision,
    runtime: process.version,
    baselineId: contract.baseline.baselineId,
    preflight: pre,
    productionStandard: contract.productionStandard,
  };

  if (pre.status !== 'BASELINE_VALID') {
    return {
      ...baseReport,
      executionStatus: 'INVALID_BASELINE',
      semanticDecision: null,
      fixtures: [{ fixtureId: pre.fixtureId, status: pre.status }],
      mappingRecords: [],
    };
  }

  const mapModel = readJson(root, 'data/maps/map-001-blockout-candidate-002.json');
  const graph = analyzeRaster(mapModel);
  const graphCheck = graphMatchesContract(graph, contract);
  const fixture = buildExecutableFixture(mapModel, graph);
  const validation = validateFixture(fixture);
  const provenance = checkProvenanceIntegrity(fixture);
  const inferredWaterBankEdges = countDerivedWaterBankEdges(fixture);
  const inferredBlockerEdges = countDerivedBlockerEdges(fixture);

  const boundaryMetadata = {
    screen_up: clone(mapModel.grid.ports.screen_up),
    screen_down: clone(mapModel.grid.ports.screen_down),
  };
  const outOfScope = {
    bridge: clone(mapModel.territorialRelations.bridge),
    gate: clone(mapModel.territorialRelations.gate),
    house: clone(mapModel.territorialRelations.house),
    interactionLearning: clone(mapModel.interactionLearning),
    camera: clone(mapModel.camera),
  };

  const fixtureDigest = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      tiles: fixture.tiles,
      fieldProvenance: fixture.fieldProvenance,
      adjacencies: fixture.adjacencies,
      normalizations: fixture.normalizations,
    }))
    .digest('hex');

  const scaffoldFields = [
    'surface.composition',
    'blocker',
    'route.kind',
    'route.ports',
    'elevation.mode',
    'elevation.reference',
    'visualTreatment.*',
    'edge.content',
    'edge.profile',
    'edge.bandEndpoints',
    'edge.routePort',
    'non-shared edge.traversal',
  ];

  const mappingRecords = [
    mappingRecord({
      fixtureId: 'PI-01-WALKABLE-ADJACENCY',
      sourcePath: 'grid.walkableCells',
      sourceValue: { count: graph.walkableCellCount },
      targetField: 'logicalCell.walkability',
      provenanceClass: 'DERIVED_FROM_TEST_RASTER',
      representationAssessment: 'REPRESENTABLE',
      validatorResult: validation.pass ? 'PASS' : 'FAIL',
      mappingAssessment: graphCheck.pass && validation.pass ? 'REPRESENTABLE' : 'REVISE',
      evidence: {
        walkableCells: graph.walkableCellCount,
        sharedAdjacencies: graph.orthogonalSharedAdjacencies,
        connectedComponents: graph.connectedComponents,
        branchingNodes: graph.branchingNodes,
        endpointCells: graph.endpointCells,
        validatedTiles: validation.tileResults.length,
        validatedSharedEdges: validation.edgeResults.length,
      },
      scaffoldFields,
    }),
    mappingRecord({
      fixtureId: 'PI-02-REFERENCE-BAND',
      sourcePath: 'elevation.path',
      sourceValue: mapModel.elevation.path,
      targetField: 'relative reference band code',
      provenanceClass: 'NORMALIZED_ENCODING',
      representationAssessment: 'REPRESENTABLE_WITH_NORMALIZATION',
      validatorResult: 'NOT_APPLICABLE',
      mappingAssessment: mapModel.elevation.path === 'reference-band' ? 'REPRESENTABLE_WITH_NORMALIZATION' : 'REVISE',
      evidence: {
        normalizedCode: fixture.normalizations.referenceBandCode,
        appliedPerCell: false,
        metricMeaning: 'NONE',
      },
      scaffoldFields: ['elevation.mode', 'edge.bandEndpoints in executable fixture'],
    }),
    mappingRecord({
      fixtureId: 'PI-03-WATER-NO-INFERENCE',
      sourcePath: 'territorialRelations.stream.polylineCells',
      sourceValue: { count: mapModel.territorialRelations.stream.polylineCells.length },
      targetField: 'water/bank edge signatures',
      provenanceClass: 'PROHIBITED_INFERENCE',
      representationAssessment: 'PROHIBITED_INFERENCE',
      validatorResult: 'NOT_APPLICABLE',
      mappingAssessment: inferredWaterBankEdges === 0 ? 'OPEN_PRESERVED' : 'REVISE',
      evidence: { inferredWaterBankEdges },
      openOrGapReason: 'waterEdgeRasterization remains OPEN',
    }),
    mappingRecord({
      fixtureId: 'PI-04-BLOCKER-NO-INFERENCE',
      sourcePath: 'territorialRelations.sideContainment',
      sourceValue: mapModel.territorialRelations.sideContainment,
      targetField: 'blocker/cliff/hard-blocker edge signatures',
      provenanceClass: 'PROHIBITED_INFERENCE',
      representationAssessment: 'PROHIBITED_INFERENCE',
      validatorResult: 'NOT_APPLICABLE',
      mappingAssessment: inferredBlockerEdges === 0 ? 'OPEN_PRESERVED' : 'REVISE',
      evidence: { inferredBlockerEdges },
      openOrGapReason: 'blockerEdgeRasterization remains OPEN',
    }),
    mappingRecord({
      fixtureId: 'PI-05-BOUNDARY-SEMANTICS',
      sourcePath: 'grid.ports.screen_up / grid.ports.screen_down',
      sourceValue: boundaryMetadata,
      targetField: 'external boundary metadata',
      provenanceClass: 'SOURCE_EXPLICIT',
      representationAssessment: 'OUT_OF_SCOPE',
      validatorResult: 'NOT_APPLICABLE',
      mappingAssessment: 'OUT_OF_SCOPE_RECORDED',
      evidence: { progressionRoleRepresentedByTileGrammar: false },
      openOrGapReason: 'Tile Grammar v0.2 does not encode entry/exit progressionRole.',
    }),
    mappingRecord({
      fixtureId: 'PI-06-SEPARATION-OF-CONCERNS',
      sourcePath: 'territorialRelations + interactionLearning + camera',
      sourceValue: {
        bridge: outOfScope.bridge,
        gate: outOfScope.gate,
        house: outOfScope.house,
        interactionLearningStatus: outOfScope.interactionLearning.status,
        cameraProfileId: outOfScope.camera.profileId,
      },
      targetField: 'terrain grammar',
      provenanceClass: 'OUT_OF_SCOPE',
      representationAssessment: 'OUT_OF_SCOPE',
      validatorResult: 'NOT_APPLICABLE',
      mappingAssessment: 'OUT_OF_SCOPE_RECORDED',
      evidence: {
        retainedOutsideTerrainGrammar: ['bridge', 'gate', 'house', 'interactionLearning', 'camera'],
        bridgeCrossLayerOverlapPreserved: sameCell(outOfScope.bridge.cell, [10, 4])
          && mapModel.grid.walkableCells.some((cell) => sameCell(cell, outOfScope.bridge.cell))
          && mapModel.territorialRelations.stream.polylineCells.some((cell) => sameCell(cell, outOfScope.bridge.cell)),
      },
    }),
    mappingRecord({
      fixtureId: 'PI-07-PROVENANCE-INTEGRITY',
      sourcePath: 'executable fixture provenance sidecar',
      sourceValue: { tileCount: fixture.tiles.length },
      targetField: 'mapping conclusions',
      provenanceClass: 'TEST_SCAFFOLD',
      representationAssessment: 'OUT_OF_SCOPE',
      validatorResult: 'NOT_APPLICABLE',
      mappingAssessment: provenance.pass ? 'PASS' : 'REVISE',
      evidence: {
        violations: provenance.violations,
        scaffoldMaySupportTerritorialConclusion: false,
      },
      openOrGapReason: 'TEST_SCAFFOLD is technical only and cannot establish MAP-001 facts.',
    }),
  ];

  const fixtures = [
    { fixtureId: 'PI-00-BASELINE-PREFLIGHT', status: pre.status },
    {
      fixtureId: 'PI-01-WALKABLE-ADJACENCY',
      status: graphCheck.pass && validation.pass ? 'PASS_WITH_SCOPE' : 'REVISE',
    },
    {
      fixtureId: 'PI-02-REFERENCE-BAND',
      status: mapModel.elevation.path === 'reference-band' ? 'PASS_WITH_NORMALIZATION' : 'REVISE',
    },
    {
      fixtureId: 'PI-03-WATER-NO-INFERENCE',
      status: inferredWaterBankEdges === 0 ? 'OPEN_PRESERVED' : 'REVISE',
    },
    {
      fixtureId: 'PI-04-BLOCKER-NO-INFERENCE',
      status: inferredBlockerEdges === 0 ? 'OPEN_PRESERVED' : 'REVISE',
    },
    { fixtureId: 'PI-05-BOUNDARY-SEMANTICS', status: 'OUT_OF_SCOPE_RECORDED' },
    { fixtureId: 'PI-06-SEPARATION-OF-CONCERNS', status: 'OUT_OF_SCOPE_RECORDED' },
    { fixtureId: 'PI-07-PROVENANCE-INTEGRITY', status: provenance.pass ? 'PASS' : 'REVISE' },
  ];

  const hasGap = mappingRecords.some((item) => item.representationAssessment === 'REPRESENTATIONAL_GAP');
  const hasRevise = fixtures.some((item) => item.status === 'REVISE');
  const semanticDecision = hasGap ? 'INSUFFICIENT' : hasRevise ? 'REVISE' : 'PASS';

  return {
    ...baseReport,
    executionStatus: 'COMPLETED',
    semanticDecision,
    graph: {
      walkableCellCount: graph.walkableCellCount,
      orthogonalSharedAdjacencies: graph.orthogonalSharedAdjacencies,
      connectedComponents: graph.connectedComponents,
      branchingNodes: graph.branchingNodes,
      endpointCells: graph.endpointCells,
    },
    executableFixture: {
      tileCount: fixture.tiles.length,
      sharedAdjacencyCount: fixture.adjacencies.length,
      fixtureDigest,
      routeOverlayDerived: false,
      inferredWaterBankEdges,
      inferredBlockerEdges,
      normalizedReferenceBandCode: fixture.normalizations.referenceBandCode,
      normalizationAppliedPerCell: fixture.normalizations.appliedPerCell,
    },
    validation: {
      tilesPassed: validation.tileResults.filter((item) => item.result === 'PASS').length,
      tilesTotal: validation.tileResults.length,
      sharedEdgesPassed: validation.edgeResults.filter((item) => item.result === 'PASS').length,
      sharedEdgesTotal: validation.edgeResults.length,
    },
    provenanceIntegrity: provenance,
    boundaryMetadata,
    outOfScopePreserved: {
      bridge: outOfScope.bridge,
      gate: outOfScope.gate,
      house: outOfScope.house,
      interactionLearningStatus: outOfScope.interactionLearning.status,
      cameraProfileId: outOfScope.camera.profileId,
    },
    fixtures,
    mappingRecords,
    openPreserved: contract.openPreserved,
  };
}

function parseOutputArg(argv) {
  const index = argv.indexOf('--output');
  return index >= 0 ? argv[index + 1] : null;
}

async function main() {
  const report = runPreintegration();
  const output = parseOutputArg(process.argv.slice(2));
  const serialized = JSON.stringify(report, null, 2) + '\n';

  if (output) {
    const target = path.resolve(output);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, serialized);
  }

  process.stdout.write(serialized);

  if (report.executionStatus === 'INVALID_BASELINE') process.exitCode = 2;
  else if (report.semanticDecision !== 'PASS') process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write('pre-integration execution error: ' + error.stack + '\n');
    process.exitCode = 1;
  });
}
