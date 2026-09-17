#!/usr/bin/env node
/**
 * audit-check.js
 *
 * Verifica que el cuerpo de un Pull Request contenga las 4 secciones
 * obligatorias del protocolo auditor de Árboris, con contenido real
 * (no vacío, no genérico tipo "N/A" sin justificación, no solo "ninguna").
 *
 * Uso local:
 *   node tools/audit-check.js path/to/pr-body.md
 *
 * Uso en CI (GitHub Actions), pasando el body del PR vía variable de entorno:
 *   PR_BODY="$(cat pr_body.txt)" node tools/audit-check.js --stdin-env PR_BODY
 *
 * Exit code 0 = OK, 1 = falla (bloquea el merge si se usa como check requerido).
 */

const fs = require("fs");

const REQUIRED_SECTIONS = [
  { key: "AUDITORÍA", heading: /###\s*AUDITOR[IÍ]A/i },
  { key: "INCONSISTENCIAS", heading: /###\s*INCONSISTENCIAS/i },
  { key: "VACÍOS / OMISIONES", heading: /###\s*VAC[IÍ]OS\s*\/\s*OMISIONES/i },
  { key: "REDUNDANCIAS", heading: /###\s*REDUNDANCIAS/i },
];

const MIN_CONTENT_LENGTH = 15; // caracteres mínimos de contenido real por sección
const LAZY_PATTERNS = [
  /^ninguna\.?$/i,
  /^n\/a\.?$/i,
  /^no aplica\.?$/i,
  /^no se detectan bloqueos\.?$/i,
  /^sin novedad\.?$/i,
];

function fail(msg) {
  console.error(`❌ audit-check: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✅ audit-check: ${msg}`);
}

function getInput() {
  const args = process.argv.slice(2);

  if (args[0] === "--stdin-env") {
    const varName = args[1];
    const value = process.env[varName];
    if (!value) {
      console.error(`No se encontró la variable de entorno ${varName} o está vacía.`);
      process.exit(1);
    }
    return value;
  }

  const filePath = args[0];
  if (!filePath) {
    console.error("Uso: node tools/audit-check.js <archivo.md>  |  node tools/audit-check.js --stdin-env VAR_NAME");
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error(`Archivo no encontrado: ${filePath}`);
    process.exit(1);
  }
  return fs.readFileSync(filePath, "utf8");
}

function extractSectionContent(body, headingRegex, allHeadingRegexes) {
  const lines = body.split("\n");
  let capturing = false;
  let content = [];

  for (const line of lines) {
    if (headingRegex.test(line)) {
      capturing = true;
      continue;
    }
    if (capturing) {
      // Detener ante cualquier heading de nivel ### o ante un heading superior (##).
      const hitsAnotherSection = allHeadingRegexes.some((re) => re.test(line));
      const hitsAnyLevelThreeHeading = /^###\s+/.test(line);
      const hitsHigherHeading = /^##\s+/.test(line) && !/^###/.test(line);
      if (hitsAnotherSection || hitsAnyLevelThreeHeading || hitsHigherHeading) break;
      content.push(line);
    }
  }

  return content
    .join("\n")
    .replace(/<!--[\s\S]*?-->/g, "") // quitar comentarios HTML/plantilla
    .trim();
}

function isLazyContent(text) {
  const normalized = text.trim();
  if (normalized.length === 0) return true;
  return LAZY_PATTERNS.some((pattern) => pattern.test(normalized));
}

function main() {
  const body = getInput();
  const allHeadingRegexes = REQUIRED_SECTIONS.map((s) => s.heading);

  let allPassed = true;

  for (const section of REQUIRED_SECTIONS) {
    if (!section.heading.test(body)) {
      fail(`Falta la sección "${section.key}" en el bloque de auditoría.`);
      allPassed = false;
      continue;
    }

    const content = extractSectionContent(body, section.heading, allHeadingRegexes);

    if (isLazyContent(content)) {
      fail(
        `Sección "${section.key}" está vacía o usa una respuesta genérica ` +
        `("ninguna", "N/A", etc.) sin justificación. Se requiere contenido real.`
      );
      allPassed = false;
      continue;
    }

    if (content.length < MIN_CONTENT_LENGTH) {
      fail(
        `Sección "${section.key}" tiene contenido demasiado corto ` +
        `(${content.length} caracteres). Mínimo esperado: ${MIN_CONTENT_LENGTH}.`
      );
      allPassed = false;
      continue;
    }

    ok(`Sección "${section.key}" OK (${content.length} caracteres).`);
  }

  // Checks adicionales: checkboxes de confirmación deben estar marcados
  const requiredCheckboxes = [
    /- \[x\] Confirmo que ninguna decisión `OPEN`/i,
    /- \[x\] Confirmo que no se hardcode[oó] conocimiento botánico/i,
    /- \[x\] Confirmo que las 4 secciones de auditoría/i,
  ];

  for (const checkbox of requiredCheckboxes) {
    if (!checkbox.test(body)) {
      fail(`Falta marcar un checkbox de confirmación obligatorio: ${checkbox}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    ok("Protocolo auditor cumplido. PR listo para revisión de merge.");
    process.exit(0);
  } else {
    console.error("\n❌ El PR no cumple el protocolo auditor de Árboris (AGENTS.md / DEVELOPMENT_MANUAL.md).");
    process.exit(1);
  }
}

main();
