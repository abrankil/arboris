import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runIncorporation, serializeCorpus, validateCommandInput } from "./incorporate_ref.mjs";

const empty=()=>({schemaVersion:"1.0.0",corpusId:"ARBORIS_GRAPHIC_REFERENCES",nextRefNumber:2,references:[{
  refId:"REF-001",identityStatus:"active",canonicalRefId:null,title:"Existing",sourceUrl:"https://example.invalid/1",
  previousUrls:[],authorOrganization:null,sourceProvenance:"OTRA",contentOrigin:null,unitType:"INDIVIDUAL",
  resourceNature:[],documentaryRelation:"RELACIÓN_DESCONOCIDA",contentAccessibility:"NO_ACCESIBLE",provenanceNotes:null,
  preservedCopies:[],registrationProvenance:{collectionProtocol:"GRAPHIC_REFERENCE_COLLECTION_V3",collectionSubject:"TEST",sourceArtifact:null,sourceRecordNumber:null},
  registeredAt:"2026-09-19T03:00:00-03:00",updatedAt:"2026-09-19T03:00:00-03:00"
}]});
const record=(n=2)=>({title:`New ${n}`,sourceUrl:`https://example.invalid/${n}`,authorOrganization:null,sourceProvenance:"OTRA",contentOrigin:null,
  unitType:"INDIVIDUAL",resourceNature:[],documentaryRelation:"RELACIÓN_DESCONOCIDA",contentAccessibility:"NO_ACCESIBLE",provenanceNotes:null,
  registrationProvenance:{collectionProtocol:"GRAPHIC_REFERENCE_COLLECTION_V3",collectionSubject:"TEST",sourceArtifact:null,sourceRecordNumber:null},
  registeredAt:"2026-09-19T03:00:00-03:00",updatedAt:"2026-09-19T03:00:00-03:00"});
const input=(decision="new",rec=record())=>({commandVersion:"1.0.0",identityDecision:decision,existingRefId:decision==="existing"?"REF-001":null,record:decision==="new"?rec:null});
function fixture(command=input(), corpus=empty()){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"arboris-ref-"));
  const inputPath=path.join(dir,"input.json"), corpusPath=path.join(dir,"corpus.json");
  fs.writeFileSync(inputPath,JSON.stringify(command)); fs.writeFileSync(corpusPath,serializeCorpus(corpus));
  return {dir,inputPath,corpusPath,cleanup:()=>fs.rmSync(dir,{recursive:true,force:true})};
}
function run(f, hooks){return runIncorporation({inputPath:f.inputPath,corpusPath:f.corpusPath,hooks});}

test("IC01 NEW persists REF-002 and advances counter",()=>{const f=fixture();try{const r=run(f);const c=JSON.parse(fs.readFileSync(f.corpusPath));assert.equal(r.message,"INCORPORATED REF-002");assert.equal(c.nextRefNumber,3);assert.equal(c.references.at(-1).refId,"REF-002");}finally{f.cleanup();}});
test("IC02 second sequential NEW produces REF-003",()=>{const f=fixture();try{run(f);fs.writeFileSync(f.inputPath,JSON.stringify(input("new",record(3))));const r=run(f);assert.equal(r.message,"INCORPORATED REF-003");assert.equal(JSON.parse(fs.readFileSync(f.corpusPath)).nextRefNumber,4);}finally{f.cleanup();}});
test("IC03 EXISTING leaves corpus byte-identical",()=>{const f=fixture(input("existing"));try{const before=fs.readFileSync(f.corpusPath,"utf8");const r=run(f);assert.equal(r.message,"EXISTING REF-001");assert.equal(fs.readFileSync(f.corpusPath,"utf8"),before);}finally{f.cleanup();}});
test("IC04 EXISTING duplicate resolves active canonical without write",()=>{const c=empty();c.references.push({...structuredClone(c.references[0]),refId:"REF-002",identityStatus:"duplicate",canonicalRefId:"REF-001",title:"Dup",sourceUrl:"https://example.invalid/dup"});c.nextRefNumber=3;const cmd={...input("existing"),existingRefId:"REF-002"};const f=fixture(cmd,c);try{const before=fs.readFileSync(f.corpusPath,"utf8");assert.equal(run(f).message,"EXISTING REF-001");assert.equal(fs.readFileSync(f.corpusPath,"utf8"),before);}finally{f.cleanup();}});
test("IC05 UNCERTAIN exits 2 without write",()=>{const f=fixture(input("uncertain"));try{const before=fs.readFileSync(f.corpusPath,"utf8");const r=run(f);assert.equal(r.exitCode,2);assert.equal(fs.readFileSync(f.corpusPath,"utf8"),before);}finally{f.cleanup();}});
test("IC06 invalid input JSON leaves corpus intact",()=>{const f=fixture();try{const before=fs.readFileSync(f.corpusPath,"utf8");fs.writeFileSync(f.inputPath,"{");assert.throws(()=>run(f));assert.equal(fs.readFileSync(f.corpusPath,"utf8"),before);}finally{f.cleanup();}});
test("IC07 invalid decision rejected",()=>assert.throws(()=>validateCommandInput({...input(),identityDecision:"bad"})));
test("IC08 managed refId rejected",()=>assert.throws(()=>validateCommandInput(input("new",{...record(),refId:"REF-999"}))));
test("IC09 managed identity fields rejected",()=>{for(const field of ["identityStatus","canonicalRefId"])assert.throws(()=>validateCommandInput(input("new",{...record(),[field]:null})));});
test("IC10 invalid REF record leaves corpus intact",()=>{const bad=record();bad.unitType="BAD";const f=fixture(input("new",bad));try{const before=fs.readFileSync(f.corpusPath,"utf8");assert.throws(()=>run(f));assert.equal(fs.readFileSync(f.corpusPath,"utf8"),before);}finally{f.cleanup();}});
test("IC11 incorporation exception leaves canonical file intact",()=>{const bad=record();delete bad.title;const f=fixture(input("new",bad));try{const before=fs.readFileSync(f.corpusPath,"utf8");assert.throws(()=>run(f));assert.equal(fs.readFileSync(f.corpusPath,"utf8"),before);}finally{f.cleanup();}});
test("IC12 invalid initial corpus rejected before write",()=>{const c=empty();c.nextRefNumber=1;const f=fixture(input(),c);try{const before=fs.readFileSync(f.corpusPath,"utf8");assert.throws(()=>run(f));assert.equal(fs.readFileSync(f.corpusPath,"utf8"),before);}finally{f.cleanup();}});
test("IC13 temporary file is valid before replacement",()=>{const f=fixture();try{let checked=false;run(f,{beforeReplace:({tempPath})=>{const c=JSON.parse(fs.readFileSync(tempPath));assert.equal(c.references.at(-1).refId,"REF-002");checked=true;}});assert.equal(checked,true);}finally{f.cleanup();}});
test("IC14 controlled failure before replacement preserves original",()=>{const f=fixture();try{const before=fs.readFileSync(f.corpusPath,"utf8");assert.throws(()=>run(f,{beforeReplace:()=>{throw new Error("stop");}}));assert.equal(fs.readFileSync(f.corpusPath,"utf8"),before);}finally{f.cleanup();}});
test("IC15 null artifact and record number accepted",()=>{const f=fixture();try{assert.equal(run(f).exitCode,0);}finally{f.cleanup();}});
test("IC16 record number without artifact rejected",()=>{const r=record();r.registrationProvenance.sourceRecordNumber=1;const f=fixture(input("new",r));try{assert.throws(()=>run(f));}finally{f.cleanup();}});
test("IC17 sequential IDs are monotonic",()=>{const f=fixture();try{run(f);fs.writeFileSync(f.inputPath,JSON.stringify(input("new",record(3))));run(f);assert.deepEqual(JSON.parse(fs.readFileSync(f.corpusPath)).references.map(x=>x.refId),["REF-001","REF-002","REF-003"]);}finally{f.cleanup();}});
test("IC18 unknown top-level key rejected",()=>assert.throws(()=>validateCommandInput({...input(),extra:true})));
test("IC19 EXISTING with record rejected",()=>assert.throws(()=>validateCommandInput({...input("existing"),record:record()})));
test("IC20 UNCERTAIN with incorporation data rejected",()=>assert.throws(()=>validateCommandInput({...input("uncertain"),existingRefId:"REF-001"})));
test("IC21 failure before replacement cleans temporary file",()=>{const f=fixture();try{assert.throws(()=>run(f,{beforeReplace:()=>{throw new Error("stop");}}));assert.deepEqual(fs.readdirSync(f.dir).sort(),["corpus.json","input.json"]);}finally{f.cleanup();}});
test("IC22 successful NEW uses canonical serialization",()=>{const f=fixture();try{run(f);const parsed=JSON.parse(fs.readFileSync(f.corpusPath));assert.equal(fs.readFileSync(f.corpusPath,"utf8"),serializeCorpus(parsed));}finally{f.cleanup();}});
test("IC23 success is returned only after final validation path",()=>{const f=fixture();try{let after=false;const r=run(f,{afterReplace:()=>{after=true;}});assert.equal(after,true);assert.equal(r.message,"INCORPORATED REF-002");}finally{f.cleanup();}});
test("IC24 failure after replacement never returns INCORPORATED",()=>{const f=fixture();try{assert.throws(()=>run(f,{afterReplace:({corpusPath})=>fs.writeFileSync(corpusPath,"{}")}));assert.equal(fs.readFileSync(f.corpusPath,"utf8"),"{}");}finally{f.cleanup();}});
