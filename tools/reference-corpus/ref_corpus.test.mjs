import assert from "node:assert/strict";
import test from "node:test";
import {
  RefCorpusError, addPreservedCopy, changeSourceUrl, incorporateReviewed,
  markDuplicate, resolveRef, validateRefCorpus,
} from "./ref_corpus.mjs";

const empty = () => ({ schemaVersion:"1.0.0", corpusId:"ARBORIS_GRAPHIC_REFERENCES", nextRefNumber:1, references:[] });
const provenance = (n=1) => ({
  collectionProtocol:"GRAPHIC_REFERENCE_COLLECTION_V3",
  collectionSubject:"SYNTHETIC_TEST",
  sourceArtifact:{ artifactId:"SYNTH-V3", sha256:"a".repeat(64) },
  sourceRecordNumber:n,
});
const record = (n=1, url=`https://example.invalid/${n}`) => ({
  title:`Synthetic ${n}`, sourceUrl:url, authorOrganization:null, sourceProvenance:"OTRA",
  contentOrigin:null, unitType:"INDIVIDUAL", resourceNature:[],
  documentaryRelation:"RELACIÓN_DESCONOCIDA", contentAccessibility:"NO_ACCESIBLE",
  provenanceNotes:null, registrationProvenance:provenance(n),
  registeredAt:"2026-09-18T12:00:00Z", updatedAt:"2026-09-18T12:00:00Z",
});
const add = (c,n=1,url) => incorporateReviewed(c,{identityDecision:"new",record:record(n,url)});

test("new identity allocates a unique REF",()=>{ const c=empty(); assert.equal(add(c),"REF-001"); });
test("existing identity reuses REF and consumes no number",()=>{ const c=empty(); const r=add(c); const n=c.nextRefNumber; assert.equal(incorporateReviewed(c,{identityDecision:"existing",existingRefId:r}),r); assert.equal(c.nextRefNumber,n); assert.equal(c.references.length,1); });
test("uncertain identity stops without allocation",()=>{ const c=empty(); assert.throws(()=>incorporateReviewed(c,{identityDecision:"uncertain"}),RefCorpusError); assert.equal(c.nextRefNumber,1); });
test("same URL may identify a later new unit without overwriting old REF",()=>{ const c=empty(); const a=add(c,1,"https://same.invalid/x"); const snapshot=structuredClone(resolveRef(c,a).canonical); const b=add(c,2,"https://same.invalid/x"); assert.notEqual(a,b); assert.deepEqual(resolveRef(c,a).canonical,snapshot); });
test("valid URL migration preserves REF and history",()=>{ const c=empty(); const r=add(c); changeSourceUrl(c,r,"https://example.invalid/new",{previousWasValid:true,changedAt:"2026-09-18T13:00:00Z"}); assert.equal(resolveRef(c,r).canonical.previousUrls.length,1); });
test("administrative URL error is not documentary history",()=>{ const c=empty(); const r=add(c); changeSourceUrl(c,r,"https://correct.invalid",{previousWasValid:false}); assert.deepEqual(resolveRef(c,r).canonical.previousUrls,[]); });
test("duplicate survives and resolves directly to active canonical REF",()=>{ const c=empty(); const a=add(c,1); const b=add(c,2); markDuplicate(c,b,a); assert.equal(resolveRef(c,b).historical.refId,b); assert.equal(resolveRef(c,b).canonical.refId,a); });
test("duplicate chain is rejected",()=>{ const c=empty(); const a=add(c,1), b=add(c,2), d=add(c,3); markDuplicate(c,b,a); assert.throws(()=>markDuplicate(c,d,b),RefCorpusError); });
test("sourceRecordNumber cannot be orphaned",()=>{ const c=empty(); const x=record(); x.registrationProvenance={collectionProtocol:"X",collectionSubject:"Y",sourceArtifact:null,sourceRecordNumber:1}; assert.throws(()=>incorporateReviewed(c,{identityDecision:"new",record:x}),RefCorpusError); });
test("nextRefNumber cannot move to or below existing maximum",()=>{ const c=empty(); add(c); add(c,2); for (const n of [2,1]) { const d=structuredClone(c); d.nextRefNumber=n; assert.throws(()=>validateRefCorpus(d),RefCorpusError); } });
test("historical numbers are not reused",()=>{ const c=empty(); assert.equal(add(c),"REF-001"); assert.equal(add(c,2),"REF-002"); assert.equal(add(c,3),"REF-003"); });
test("preserved copy changes neither REF identity nor ASC boundary",()=>{ const c=empty(); const r=add(c); addPreservedCopy(c,r,{type:"google_drive",providerId:"synthetic",fileName:"x.png",mimeType:"image/png",sha256:"1".repeat(64),preservedAt:"2026-09-18T15:00:00Z"}); const x=resolveRef(c,r).canonical; assert.equal(x.refId,r); assert.equal(x.preservedCopies.length,1); for (const forbidden of ["OBSERVED","RECURRENT","APPROVED_ART_RULE","authorizedSources","structuralContract"]) assert.equal(forbidden in x,false); });
test("REF without preserved copy is valid",()=>{ const c=empty(); const r=add(c); assert.deepEqual(resolveRef(c,r).canonical.preservedCopies,[]); });
