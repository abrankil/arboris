import test from "node:test";
import assert from "node:assert/strict";
import { validateCommandInput } from "./incorporate_ref.mjs";
import { adaptV344Source } from "./v344_ref_adapter.mjs";

const base = {
  artifact:{artifactId:"artifact-v344-001",sha256:"a".repeat(64)},
  sourceRecordNumber:1,
  collectionSubject:"Laysara: Summit Kingdom",
  src:{
    srcId:"SRC-001", title:"Official press kit", sourceUrl:"https://example.com/press",
    sourceLocation:"SUFICIENTE", identity:"VERIFICADA",
    authorOrganization:"Example Studio", sourceProvenance:"OFICIAL",
    unitType:"COLECCIÓN", resourceNature:["MEDIA_KIT"],
    documentaryRelation:"FUENTE_PRIMARIA", contentAccessibility:"CONTENIDO_COMPLETO",
    provenanceNotes:"Verified from the source.", blockingUnknowns:[]
  }
};

test("eligible strong provenance produces valid incorporation input",()=>{
  const out=adaptV344Source(base);
  assert.equal(out.eligibility,"ELIGIBLE");
  assert.equal(out.provenanceStrength,"STRONG");
  assert.equal(validateCommandInput(out.incorporationInput),true);
  assert.equal(out.incorporationInput.record.registrationProvenance.sourceRecordNumber,1);
});

test("insufficient source location blocks",()=>{
  assert.throws(()=>adaptV344Source({...base,src:{...base.src,sourceLocation:"INSUFICIENTE"}}),/SOURCE_LOCATION/);
});

test("unverified identity never becomes new automatically",()=>{
  const out=adaptV344Source({...base,src:{...base.src,identity:"NO_INDIVIDUALIZADA"}});
  assert.equal(out.eligibility,"UNCERTAIN");
  assert.equal(out.incorporationInput.identityDecision,"uncertain");
});

test("blocking unknown blocks transfer",()=>{
  assert.throws(()=>adaptV344Source({...base,src:{...base.src,blockingUnknowns:["title"]}}),/BLOCK_TRANSFER/);
});

test("weak provenance remains explicit",()=>{
  const out=adaptV344Source({...base,artifact:null,sourceRecordNumber:null});
  assert.equal(out.provenanceStrength,"WEAK");
  assert.equal(out.incorporationInput.record.registrationProvenance.sourceArtifact,null);
  assert.equal(out.incorporationInput.record.registrationProvenance.sourceRecordNumber,null);
});

test("adapter never supplies REF managed fields",()=>{
  const record=adaptV344Source(base).incorporationInput.record;
  for(const key of ["refId","identityStatus","canonicalRefId"]) assert.equal(Object.hasOwn(record,key),false);
});

test("existing and uncertain never write a record",()=>{
  const existing=adaptV344Source({...base,identityDecision:"existing",existingRefId:"REF-001"});
  assert.equal(existing.incorporationInput.record,null);
  const uncertain=adaptV344Source({...base,identityDecision:"uncertain"});
  assert.equal(uncertain.incorporationInput.record,null);
});

test("unmapped controlled value fails explicitly",()=>{
  assert.throws(()=>adaptV344Source({...base,src:{...base.src,sourceProvenance:"UNMAPPED"}}),/MAPPING_STATUS = UNRESOLVED/);
});

test("V3.44-only epistemic fields are provenance-preserved, not flattened",()=>{
  const out=adaptV344Source({...base,src:{...base.src,epistemic:{audiovisualReviewStatus:"NO_VISIONABLE",contents:[{id:"CONT-01"}]}}});
  assert.equal(Object.hasOwn(out.incorporationInput.record,"epistemic"),false);
  assert.ok(out.transferLedger.some(x=>x.classification==="PRESERVE_BY_PROVENANCE"));
});
