import { validateCommandInput } from "./incorporate_ref.mjs";

const SOURCE_PROVENANCE=new Set(["OFICIAL","ARTISTA","EDITORIAL","PROFESIONAL","PRENSA","GALERÍA","COMUNIDAD","OTRA"]);
const UNIT_TYPE=new Set(["INDIVIDUAL","COLECCIÓN","PUBLICACIÓN","DOCUMENTAL"]);
const DOCUMENTARY_RELATION=new Set(["FUENTE_PRIMARIA","REPRODUCCIÓN_AUTORIZADA","REPRODUCCIÓN","DERIVADO","POSIBLE_DUPLICADO","RELACIÓN_DESCONOCIDA"]);
const CONTENT_ACCESSIBILITY=new Set(["CONTENIDO_COMPLETO","CONTENIDO_PARCIAL","SOLO_DESCRIPCIÓN","NO_ACCESIBLE"]);

function requireMapped(value,set,field){
  if(!set.has(value)) throw new Error(`MAPPING_STATUS = UNRESOLVED: ${field}`);
  return value;
}
function requireText(value,field){
  if(typeof value!=="string"||!value.trim()) throw new Error(`BLOCK_TRANSFER: ${field}`);
  return value;
}
function provenance(input){
  if(input.artifact===null||input.artifact===undefined){
    if(input.sourceRecordNumber!==null&&input.sourceRecordNumber!==undefined) throw new Error("BLOCK_TRANSFER: sourceRecordNumber requires artifact");
    return {strength:"WEAK",sourceArtifact:null,sourceRecordNumber:null};
  }
  const {artifactId,sha256}=input.artifact;
  requireText(artifactId,"artifactId"); requireText(sha256,"sha256");
  if(!/^[a-fA-F0-9]{64}$/.test(sha256)) throw new Error("BLOCK_TRANSFER: sha256");
  if(!Number.isInteger(input.sourceRecordNumber)||input.sourceRecordNumber<1) throw new Error("BLOCK_TRANSFER: sourceRecordNumber");
  return {strength:"STRONG",sourceArtifact:{artifactId,sha256},sourceRecordNumber:input.sourceRecordNumber};
}
export function adaptV344Source(input){
  const src=input?.src??{};
  requireText(src.srcId,"srcId");
  if(src.sourceLocation!=="SUFICIENTE") throw new Error("BLOCK_TRANSFER: SOURCE_LOCATION must be SUFICIENTE");
  if(Array.isArray(src.blockingUnknowns)&&src.blockingUnknowns.length) throw new Error("BLOCK_TRANSFER: blocking NO_VERIFICADO");

  const decision=input.identityDecision ?? (src.identity==="VERIFICADA"?"new":"uncertain");
  if(!["new","existing","uncertain"].includes(decision)) throw new Error("identityDecision invalid");
  if(src.identity!=="VERIFICADA" && decision==="new") throw new Error("BLOCK_TRANSFER: identity not verified");

  if(decision==="uncertain" || src.identity!=="VERIFICADA"){
    const incorporationInput={commandVersion:"1.0.0",identityDecision:"uncertain",existingRefId:null,record:null};
    validateCommandInput(incorporationInput);
    return {adapterVersion:"0.1.0",eligibility:"UNCERTAIN",provenanceStrength:"WEAK",transferLedger:[],incorporationInput};
  }
  if(decision==="existing"){
    requireText(input.existingRefId,"existingRefId");
    const incorporationInput={commandVersion:"1.0.0",identityDecision:"existing",existingRefId:input.existingRefId,record:null};
    validateCommandInput(incorporationInput);
    return {adapterVersion:"0.1.0",eligibility:"ELIGIBLE",provenanceStrength:"N/A",transferLedger:[],incorporationInput};
  }

  const p=provenance(input);
  const record={
    title:requireText(src.title,"title"),
    sourceUrl:requireText(src.sourceUrl,"sourceUrl"),
    previousUrls:[],
    authorOrganization:requireText(src.authorOrganization,"authorOrganization"),
    sourceProvenance:requireMapped(src.sourceProvenance,SOURCE_PROVENANCE,"sourceProvenance"),
    contentOrigin:requireText(src.contentOrigin??src.authorOrganization,"contentOrigin"),
    unitType:requireMapped(src.unitType,UNIT_TYPE,"unitType"),
    resourceNature:Array.isArray(src.resourceNature)?src.resourceNature:[],
    documentaryRelation:requireMapped(src.documentaryRelation,DOCUMENTARY_RELATION,"documentaryRelation"),
    contentAccessibility:requireMapped(src.contentAccessibility,CONTENT_ACCESSIBILITY,"contentAccessibility"),
    provenanceNotes:requireText(src.provenanceNotes,"provenanceNotes"),
    preservedCopies:[],
    registrationProvenance:{
      collectionProtocol:"GRAPHIC_REFERENCE_COLLECTION_V3_44",
      collectionSubject:requireText(input.collectionSubject,"collectionSubject"),
      sourceArtifact:p.sourceArtifact,
      sourceRecordNumber:p.sourceRecordNumber
    },
    registeredAt:input.registeredAt??"1970-01-01T00:00:00Z",
    updatedAt:input.updatedAt??"1970-01-01T00:00:00Z"
  };
  const incorporationInput={commandVersion:"1.0.0",identityDecision:"new",existingRefId:null,record};
  validateCommandInput(incorporationInput);
  const transferLedger=[
    {field:"title",classification:"PERSIST"},
    {field:"sourceUrl",classification:"PERSIST"},
    {field:"controlledVocabularies",classification:"DERIVE"},
    {field:"V3.44 epistemic state",classification:"PRESERVE_BY_PROVENANCE"}
  ];
  return {adapterVersion:"0.1.0",source:{artifactId:p.sourceArtifact?.artifactId??null,sha256:p.sourceArtifact?.sha256??null,srcId:src.srcId,sourceRecordNumber:p.sourceRecordNumber},eligibility:"ELIGIBLE",provenanceStrength:p.strength,identityDecision:"new",existingRefId:null,transferLedger,incorporationInput};
}
