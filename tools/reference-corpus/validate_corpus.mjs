import fs from "node:fs";
import { validateRefCorpus } from "./ref_corpus.mjs";

const path = process.argv[2] ?? "data/references/graphic_references.json";
const corpus = JSON.parse(fs.readFileSync(path, "utf8"));
validateRefCorpus(corpus);
console.log(`REF corpus valid: ${corpus.references.length} reference(s), nextRefNumber=${corpus.nextRefNumber}`);
