import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEdgeMatch, validateTile, TILE_GRAMMAR_CONSTANTS } from './validate_tile_grammar_v02.mjs';

const dirs = ['grid_up', 'grid_right', 'grid_down', 'grid_left'];
const edge = ({content='land', profile='level', band=[0,0], traversal='open', routePort=false}={}) => ({content, profile, bandEndpoints:[...band], traversal, routePort});
function tile(id, {surface='land', walkability='walkable', blocker='none'}={}) {
  return {
    cellId:id,
    surface:{composition:surface},
    walkability,
    blocker,
    route:{kind:'none',ports:[]},
    elevation:{mode: surface==='mixed' ? 'mixed' : 'flat', reference:'RELATIVE_ONLY'},
    edges:Object.fromEntries(dirs.map(d=>[d,edge()])),
    visualTreatment:{status:'ART_PROVISIONAL',hint:'test'},
  };
}

test('v0.2 exposes fail-closed mixed edge policy', () => {
  assert.equal(TILE_GRAMMAR_CONSTANTS.MIXED_EDGE_POLICY, 'UNRESOLVED_NON_CONNECTABLE');
});

test('mixed surface may connect through a concrete land edge', () => {
  const a=tile('A',{surface:'mixed',walkability:'mixed'}); const b=tile('B');
  const r=validateEdgeMatch(a,'grid_right',b); assert.equal(r.compatible,true);
});

test('mixed edge does not connect to land', () => {
  const a=tile('A'); a.edges.grid_right.content='mixed'; const b=tile('B');
  const r=validateEdgeMatch(a,'grid_right',b); assert.equal(r.compatible,false); assert.match(r.errors.join(' '),/unresolved mixed/);
});

test('mixed edge does not connect to water', () => {
  const a=tile('A'); a.edges.grid_right.content='mixed'; const b=tile('B',{surface:'water',walkability:'non_walkable'}); b.edges.grid_left.content='water';
  const r=validateEdgeMatch(a,'grid_right',b); assert.equal(r.compatible,false); assert.match(r.errors.join(' '),/unresolved mixed/);
});

test('mixed edge does not connect to mixed without segmentation semantics', () => {
  const a=tile('A'); a.edges.grid_right.content='mixed'; const b=tile('B'); b.edges.grid_left.content='mixed';
  const r=validateEdgeMatch(a,'grid_right',b); assert.equal(r.compatible,false); assert.match(r.errors.join(' '),/unresolved mixed/);
});

test('land-water bank rule remains valid', () => {
  const a=tile('A'); a.edges.grid_right=edge({content:'land',profile:'bank',traversal:'closed'});
  const b=tile('B',{surface:'water',walkability:'non_walkable'}); b.edges.grid_left=edge({content:'water',profile:'bank',traversal:'closed'});
  const r=validateEdgeMatch(a,'grid_right',b); assert.equal(r.compatible,true);
});

test('hard blocker invariant remains fail-closed', () => {
  const a=tile('A',{walkability:'non_walkable',blocker:'hard'}); for(const d of dirs){a.edges[d].profile='blocked';a.edges[d].traversal='closed';}
  a.walkability='walkable'; assert.throws(()=>validateTile(a),/hard blocker must be non_walkable/);
});
