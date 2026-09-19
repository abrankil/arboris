import assert from "node:assert/strict";
import test from "node:test";
import {
  RefCorpusError, addPreservedCopy, changeSourceUrl, incorporateReviewed,
  markDuplicate, resolveRef, validateRefCorpus,
} from "./ref_corpus.mjs";

const empty=()=>({schemaVersion:"1.0.0",corpusId:"ARBORIS_GRAPHIC_REFERENCES",nextRefNumber:1,references:[]});
const provenance=(n=1)=>({collectionProtocol:"GRAPHIC_REFERENCE_COLLECTION_V3",collectionSubject:"SYNTHETIC_TEST",sourceArtifact:{artifactId:"SYNTH-V3",sha256:"a".repeat(64)},sourceRecordNumber:n});
const record=(n=1,url=`https://example.invalid/${n}`)=>({
  title:`Synthetic ${n}`,sourceUrl:url,authorOrganization:null,sourceProvenance:"OTRA",contentOrigin:null,
  unitType:"INDIVIDUAL",resourceNature:[],documentaryRelation:"RELACIÓN_DESCONOCIDA",contentAccessibility:"NO_ACCESIBLE",
  provenanceNotes:null,registrationProvenance:provenance(n),registeredAt:"2026-09-18T12:00:00Z",updatedAt:"2026-09-18T12:00:00Z",
});
const add=(c,n=1,url)=>incorporateReviewed(c,{identityDecision:"new",record:record(n,url)});
const unchangedAfterThrow=(c,fn)=>{const before=structuredClone(c);assert.throws(fn,RefCorpusError);assert.deepEqual(c,before);};

test("T01 new identity allocates REF-001",()=>{const c=empty();assert.equal(add(c),"REF-001");});
test("T02 sequential allocation is monotonic",()=>{const c=empty();assert.equal(add(c),"REF-001");assert.equal(add(c,2),"REF-002");assert.equal(c.nextRefNumber,3);});
test("T03 same URL may be a later new documentary unit",()=>{const c=empty();const a=add(c,1,"https://same.invalid/x");const snap=structuredClone(resolveRef(c,a).canonical);const b=add(c,2,"https://same.invalid/x");assert.notEqual(a,b);assert.deepEqual(resolveRef(c,a).canonical,snap);});
test("T04 existing identity reuses canonical REF without allocation",()=>{const c=empty();const r=add(c);const n=c.nextRefNumber;assert.equal(incorporateReviewed(c,{identityDecision:"existing",existingRefId:r}),r);assert.equal(c.nextRefNumber,n);});
test("T04b uncertain identity stops without allocation or mutation",()=>{const c=empty();unchangedAfterThrow(c,()=>incorporateReviewed(c,{identityDecision:"uncertain"}));});
test("T05 existing duplicate resolves to active canonical REF",()=>{const c=empty();const a=add(c),b=add(c,2);markDuplicate(c,b,a,"2026-09-18T13:00:00Z");assert.equal(incorporateReviewed(c,{identityDecision:"existing",existingRefId:b}),a);});
test("T06 valid URL migration preserves REF and previous URL",()=>{const c=empty();const r=add(c);changeSourceUrl(c,r,"https://example.invalid/new",{changedAt:"2026-09-18T13:00:00Z"});const x=resolveRef(c,r).canonical;assert.equal(x.refId,r);assert.equal(x.previousUrls.length,1);});
test("T07 administrative URL correction does not create documentary history",()=>{const c=empty();const r=add(c);changeSourceUrl(c,r,"https://correct.invalid",{previousWasValid:false,changedAt:"2026-09-18T13:00:00Z"});assert.deepEqual(resolveRef(c,r).canonical.previousUrls,[]);});
test("T08 duplicate historical REF remains resolvable",()=>{const c=empty();const a=add(c),b=add(c,2);markDuplicate(c,b,a,"2026-09-18T13:00:00Z");assert.equal(resolveRef(c,b).historical.refId,b);assert.equal(resolveRef(c,b).canonical.refId,a);});
test("T09 duplicate chain is rejected without mutation",()=>{const c=empty();const a=add(c),b=add(c,2),d=add(c,3);markDuplicate(c,b,a,"2026-09-18T13:00:00Z");unchangedAfterThrow(c,()=>markDuplicate(c,d,b,"2026-09-18T14:00:00Z"));});
test("T10 self duplicate is rejected without mutation",()=>{const c=empty();const a=add(c);unchangedAfterThrow(c,()=>markDuplicate(c,a,a));});
test("T11 duplicate target must exist",()=>{const c=empty();const a=add(c);unchangedAfterThrow(c,()=>markDuplicate(c,a,"REF-999"));});
test("T12 sourceRecordNumber cannot exist without sourceArtifact",()=>{const c=empty();const x=record();x.registrationProvenance={collectionProtocol:"X",collectionSubject:"Y",sourceArtifact:null,sourceRecordNumber:1};unchangedAfterThrow(c,()=>incorporateReviewed(c,{identityDecision:"new",record:x}));});
test("T13 sourceArtifact requires sourceRecordNumber",()=>{const c=empty();const x=record();x.registrationProvenance.sourceRecordNumber=null;unchangedAfterThrow(c,()=>incorporateReviewed(c,{identityDecision:"new",record:x}));});
test("T14 nextRefNumber must remain greater than historical maximum",()=>{const c=empty();add(c);add(c,2);for(const n of [2,1]){const d=structuredClone(c);d.nextRefNumber=n;assert.throws(()=>validateRefCorpus(d),RefCorpusError);}});
test("T15 historical numbers are never reused",()=>{const c=empty();assert.equal(add(c),"REF-001");assert.equal(add(c,2),"REF-002");assert.equal(add(c,3),"REF-003");});
test("T16 active REF requires canonicalRefId null",()=>{const c=empty();add(c);const d=structuredClone(c);d.references[0].canonicalRefId="REF-001";assert.throws(()=>validateRefCorpus(d),RefCorpusError);});
test("T17 required D2 field omission is rejected atomically",()=>{const c=empty();const x=record();delete x.title;unchangedAfterThrow(c,()=>incorporateReviewed(c,{identityDecision:"new",record:x}));});
test("T18 D4 enum violations are rejected atomically",()=>{const c=empty();for(const [field,value] of [["sourceProvenance","BAD"],["unitType","BAD"],["documentaryRelation","BAD"],["contentAccessibility","BAD"]]){const x=record();x[field]=value;unchangedAfterThrow(c,()=>incorporateReviewed(c,{identityDecision:"new",record:x}));}});
test("T19 D10 timestamps require ISO 8601 timezone",()=>{const c=empty();for(const field of ["registeredAt","updatedAt"]){const x=record();x[field]="2026-09-18";unchangedAfterThrow(c,()=>incorporateReviewed(c,{identityDecision:"new",record:x}));}});
test("T20 preserved copy does not alter identity or create ASC authority",()=>{const c=empty();const r=add(c);addPreservedCopy(c,r,{type:"google_drive",providerId:"synthetic",fileName:"x.png",mimeType:"image/png",sha256:"1".repeat(64),preservedAt:"2026-09-18T15:00:00Z"},"2026-09-18T15:00:00Z");const x=resolveRef(c,r).canonical;assert.equal(x.refId,r);for(const k of ["OBSERVED","RECURRENT","APPROVED_ART_RULE","authorizedSources","structuralContract"])assert.equal(k in x,false);});
test("T21 REF without preserved copy is valid",()=>{const c=empty();const r=add(c);assert.deepEqual(resolveRef(c,r).canonical.preservedCopies,[]);});
test("T22 failed URL mutation leaves corpus unchanged",()=>{const c=empty();const r=add(c);unchangedAfterThrow(c,()=>changeSourceUrl(c,r,"https://new.invalid",{changedAt:"bad-date"}));});
test("T23 failed preserved-copy mutation leaves corpus unchanged",()=>{const c=empty();const r=add(c);const bad=structuredClone(c);bad.references[0].preservedCopies="bad";assert.throws(()=>validateRefCorpus(bad),RefCorpusError);unchangedAfterThrow(c,()=>addPreservedCopy(c,r,{type:"drive"},"bad-date"));});
