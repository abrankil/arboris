import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { incorporateReviewed, resolveRef, validateRefCorpus } from "./ref_corpus.mjs";

export const COMMAND_VERSION = "1.0.0";
export const CANONICAL_CORPUS_PATH = "data/references/graphic_references.json";
const TOP_LEVEL_KEYS = new Set(["commandVersion", "identityDecision", "existingRefId", "record"]);
const MANAGED_FIELDS = ["refId", "identityStatus", "canonicalRefId"];

export class RefIncorporationCommandError extends Error {}

function fail(message) {
  throw new RefIncorporationCommandError(message);
}

export function validateCommandInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("Input must be a JSON object");
  for (const key of Object.keys(input)) {
    if (!TOP_LEVEL_KEYS.has(key)) fail(`Unknown top-level key: ${key}`);
  }
  if (input.commandVersion !== COMMAND_VERSION) fail(`Unsupported commandVersion: ${input.commandVersion}`);
  const decision = input.identityDecision;
  if (!["new", "existing", "uncertain"].includes(decision)) fail("identityDecision must be new, existing, or uncertain");

  if (decision === "new") {
    if (input.existingRefId !== null) fail("new identity requires existingRefId=null");
    if (!input.record || typeof input.record !== "object" || Array.isArray(input.record)) fail("new identity requires record object");
    for (const field of MANAGED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(input.record, field)) fail(`record must not provide managed field: ${field}`);
    }
  } else if (decision === "existing") {
    if (typeof input.existingRefId !== "string" || input.existingRefId.trim() === "") fail("existing identity requires existingRefId");
    if (input.record !== null) fail("existing identity requires record=null");
  } else {
    if (input.existingRefId !== null || input.record !== null) fail("uncertain identity requires existingRefId=null and record=null");
  }
  return true;
}

export function serializeCorpus(corpus) {
  return JSON.stringify(corpus, null, 2) + "\n";
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function tempPathFor(corpusPath) {
  const dir = path.dirname(corpusPath);
  const base = path.basename(corpusPath);
  return path.join(dir, `.${base}.${process.pid}.tmp`);
}

export function runIncorporation({ inputPath, corpusPath = CANONICAL_CORPUS_PATH, hooks = {} }) {
  const input = readJson(inputPath);
  validateCommandInput(input);

  const corpus = readJson(corpusPath);
  validateRefCorpus(corpus);

  if (input.identityDecision === "uncertain") {
    return { exitCode: 2, message: "UNCERTAIN — no REF allocated", changed: false };
  }

  if (input.identityDecision === "existing") {
    const refId = incorporateReviewed(corpus, {
      identityDecision: "existing",
      existingRefId: input.existingRefId,
    });
    return { exitCode: 0, message: `EXISTING ${refId}`, changed: false };
  }

  const refId = incorporateReviewed(corpus, {
    identityDecision: "new",
    record: input.record,
  });
  validateRefCorpus(corpus);

  const serialized = serializeCorpus(corpus);
  const tempPath = tempPathFor(corpusPath);
  let replaced = false;
  try {
    fs.writeFileSync(tempPath, serialized, { encoding: "utf8", flag: "wx" });
    validateRefCorpus(readJson(tempPath));
    hooks.beforeReplace?.({ tempPath, corpusPath, refId });
    fs.renameSync(tempPath, corpusPath);
    replaced = true;
    hooks.afterReplace?.({ corpusPath, refId });
    validateRefCorpus(readJson(corpusPath));
    return { exitCode: 0, message: `INCORPORATED ${refId}`, changed: true };
  } finally {
    if (!replaced && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

function main(argv) {
  if (argv.length !== 1) fail("Usage: incorporate_ref.mjs <input.json>");
  const result = runIncorporation({ inputPath: argv[0] });
  console.log(result.message);
  return result.exitCode;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
