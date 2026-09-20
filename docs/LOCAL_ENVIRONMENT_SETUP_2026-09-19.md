# Árboris — Configuración de entorno local (2026-09-19)

**Fecha:** 2026-09-19
**Estado:** ejecutado y verificado en esta sesión
**Ámbito:** puesta a punto del entorno de desarrollo en una máquina local, contrastado contra los requisitos declarados en `package.json` y `.github/workflows/ci.yml`. No es autoridad de dominio ni afecta contratos, canon o código del proyecto.

## 1. Estado encontrado antes de la intervención

- Node.js `v24.19.0` / npm `11.17.0` ya instalados y conformes con `engines.node` (`>=24.0.0 <25`) declarado en `package.json`.
- Git `2.55.0` instalado.
- `node_modules/` no existía: nunca se había corrido `npm install` / `npm ci` en esta máquina.
- Python no estaba instalado. Solo existían los alias de "App Execution Alias" de Microsoft Store (`python`/`python3` redirigían a la tienda, no a un intérprete real).
- Consecuencia verificada: `npm run verify:botanical` (parte de la cadena `npm test`) fallaba, porque depende de scripts Python en `tools/botanical-data/` que a su vez requieren el paquete `openpyxl`.

## 2. Acciones realizadas

**Estatus de la evidencia: `VERIFIED`** — ejecutadas y confirmadas directamente en esta sesión, no solo planificadas.

1. `npm ci` en la raíz del repositorio → instaló las dependencias declaradas en `package-lock.json` sin modificar el lockfile.
2. Instalación de Python 3.12.10 vía `winget install --id Python.Python.3.12 -e`.
3. `python -m pip install --upgrade pip openpyxl` — replica exactamente el paso "Install Python validation dependency" del job `validate` en `.github/workflows/ci.yml`.

## 3. Resultado verificado

- `python --version` → `3.12.10`, coincide con `python-version: '3.12'` usado en CI.
- `npm run verify:botanical` ya se ejecuta de extremo a extremo (antes fallaba con "Python was not found").
- `git status` se confirmó limpio antes y después de cada paso; ninguna de estas acciones modificó archivos versionados del repositorio ni la rama que estuviera activa en ese momento (`fix/h16-exp001-explicit-photo-manifest`).

## 4. Hallazgo no resuelto, fuera de alcance de esta tarea

Al correr `verify:botanical` ya con el entorno funcional, el validador reportó 12 errores reales de sincronización de datos: fichas `data/species/SP001_*.json` (y equivalentes) no coinciden con el formato/nomenclatura `SP-001_*.json` esperado por el Master actual. Esto se detectó en la rama `fix/h16-exp001-explicit-photo-manifest`.

No se investigó la causa ni se corrigió. Se registra únicamente como hallazgo derivado de dejar el validador operativo, no como parte de la puesta a punto del entorno ni como evaluación del estado de los datos botánicos.

## 5. Alcance de este documento

Documenta la configuración de una máquina de desarrollo local específica. No modifica `package.json`, `.github/workflows/ci.yml`, ni ningún contrato, canon o autoridad normativa del proyecto. No cierra el hallazgo de la sección 4.
