# Árboris — APC I12 Single-Screen UI Contract

**ID:** `ARBORIS_APC_I12_UI_CONTRACT_R1`  
**Estado:** CANDIDATO A AUDITORÍA CON ASC.  
**Ámbito:** Hito 16 / APC I12.  
**Base canónica:** `main@54824efea9ec5806eef720fc07b6bdd44339d609`.  
**Prerequisito:** I1–I11 integrados en `main`.  
**No autoriza:** merge a `main`, Gate B, cierre del Hito 16 ni integración runtime/producto H17.

## 1. Objetivo

I12 materializa una interfaz de revisión APC orientada a procesar muchas fotografías dentro de una misma sesión, minimizando la interacción repetitiva sin degradar la trazabilidad epistemológica de I1–I11.

La unidad de trabajo visible es una **sesión APC con múltiples fotografías**, pero la revisión botánica se realiza **una fotografía activa a la vez en una única pantalla de trabajo**.

El objetivo operativo es:

```text
muchas fotografías
→ una sesión APC
→ clasificación/atribución progresiva
→ evaluación por fotografía
→ DRAFT autosaved
→ confirmación humana explícita
→ APC_EVIDENCE CONFIRMED
→ JSON APC trazable
```

I12 es un **verification/prototyping UI harness de H16**. No constituye la interfaz final de producto de H17.

## 2. Superficie de implementación

La referencia I12 se implementará como una interfaz HTML/JavaScript local de una sola vista principal.

Debe permitir cargar varias fotografías en una única interacción de ingreso y trabajar sobre ellas dentro de una misma sesión.

La interfaz no necesita backend remoto para cumplir I12. La persistencia, exportación o reimportación necesarias para demostrar el flujo pueden resolverse localmente siempre que produzcan y consuman el contrato APC canónico sin crear una segunda fuente de verdad.

I12 no modifica el Master Botánico ni `data/botanical/*.json`.

## 3. Modelo de interacción

La pantalla principal debe exponer simultáneamente, sin convertir el flujo en un wizard obligatorio:

1. contexto mínimo de sesión;
2. inbox / conjunto de fotografías;
3. fotografía activa;
4. individuos asociados a la fotografía activa;
5. caracteres/estructuras a revisar;
6. estado DRAFT/CONFIRMED de la evidencia;
7. contexto diagnóstico relevante;
8. estado de completitud/exportación de la sesión.

Cambiar de fotografía no debe exigir cerrar o confirmar obligatoriamente la fotografía anterior. Los cambios DRAFT deben poder persistirse localmente.

## 4. Ingreso de fotografías

I12 debe admitir selección múltiple de fotografías.

Cada fotografía incorporada se registra una sola vez mediante `photoId` y conserva al menos:

```text
photoId
sessionId
fileRef/origin
individualRefs[]
photoEvidenceId
```

Los campos opcionales del contrato APC pueden completarse cuando estén disponibles.

Una fotografía puede entrar inicialmente al inbox sin especie ni individuo resuelto.

Una misma fotografía puede vincularse posteriormente a uno o más individuos. La fotografía no se duplica por individuo.

Las fotografías no esenciales pueden permanecer explícitamente sin clasificar al cierre de una sesión, conforme al contrato APC vigente.

## 5. Identidad e individuos

La UI debe permitir:

- crear un individuo dentro de la sesión;
- asociar una o varias fotografías a un individuo;
- asociar una fotografía a más de un individuo cuando corresponda;
- trabajar con individuos sin `speciesId`;
- mantener separadas identidad observacional e identificación taxonómica.

I12 no inventa un contrato de `speciesHypothesis` ni `workingSpeciesId`. Mientras no exista contrato APC canónico para hypothesis, estos campos no forman parte del flujo normativo I12.

## 6. Revisión por fotografía

Para una fotografía activa, la UI debe permitir registrar cero o más caracteres observacionales.

Estados APC permitidos por evidencia:

```text
OBSERVED
UNCERTAIN
NOT_OBSERVABLE
```

Reglas:

- `OBSERVED` requiere un estado botánico permitido por el carácter;
- `UNCERTAIN` no aporta un estado botánico positivo;
- `NOT_OBSERVABLE` no equivale a ausencia;
- un carácter no evaluado no se convierte automáticamente en `NOT_OBSERVABLE`;
- una fotografía puede confirmarse con revisión parcial cuando no queda un carácter requerido pendiente para esa fotografía.

## 7. Sugerencias y ayuda

La UI puede sugerir **qué estructura o carácter inspeccionar** utilizando el dataset canónico y, cuando exista un conjunto explícito de candidatos, ese contexto.

La UI puede mostrar:

- nombre del carácter;
- definición;
- instrucciones observacionales;
- estructuras visibles relacionadas;
- información de ayuda.

La UI **no puede sugerir ni preseleccionar un estado botánico concreto** como resultado de una inferencia automática en I12.

Un modelo, herramienta o heurística puede señalar estructuras o caracteres potencialmente relevantes, pero la confirmación de evidencia sigue siendo humana.

## 8. DRAFT y CONFIRMED

Toda captura editable comienza o permanece en estado `DRAFT` hasta confirmación humana explícita.

`DRAFT`:

- puede autosalvarse;
- puede editarse;
- no entra al handoff I11;
- no satisface requirements;
- no se presenta como evidencia confirmada.

`CONFIRMED`:

- requiere confirmación humana conforme al contrato APC;
- entra a la capa de evidencia;
- si posteriormente se corrige, debe producir una nueva revisión;
- no destruye la revisión anterior.

La UI debe mostrar claramente si el dato visible es DRAFT o CONFIRMED.

## 9. Prefill

La UI puede prellenar una observación desde observaciones previas únicamente conforme al contrato de adquisición `prefilled`.

Un prefill:

- no equivale a confirmación;
- debe indicar su procedencia;
- debe ser confirmado sobre la fotografía actual;
- no puede entrar al handoff mientras no cumpla el contrato de confirmación vigente.

I12 no introduce una nueva semántica de prefill.

## 10. Acciones por lote

La UI puede ofrecer acciones por lote para reducir repetición, siempre que sean reversibles y trazables.

Las acciones por lote permitidas en I12 se limitan a operaciones que no afirmen automáticamente un estado botánico positivo, por ejemplo:

- asignar/desasignar fotografías a un individuo;
- mover fotografías entre inbox y conjunto clasificado;
- aplicar metadata operacional común;
- seleccionar fotografías para una acción posterior.

I12 no permite confirmar por lote estados botánicos concretos inferidos o copiados sin revisión por fotografía.

Toda acción por lote que modifique el estado de sesión debe poder revertirse antes de exportar y conservar historial suficiente para explicar el cambio cuando el contrato APC lo requiera.

## 11. Requirements y pending

La UI debe distinguir:

```text
required
≠ evaluated
≠ observable
≠ critical
```

Un carácter se muestra como requerido sólo cuando existe un `requirement` canónico aplicable.

La mera existencia del carácter en el Master no lo vuelve requerido.

Cuando un requirement no está satisfecho, la UI debe reflejar el pending correspondiente conforme a I8.

Si una fotografía requerida produce `NOT_OBSERVABLE`:

- la fotografía puede confirmarse;
- el requirement no queda satisfecho por esa evidencia;
- el pending debe seguir visible hasta resolverse por otra evidencia o por el mecanismo canónico de representation gap.

## 12. Representation gaps

`REPRESENTATION_GAP` es contexto de cobertura, no evidencia observacional.

La UI debe mostrarlo separado de:

- `UNCERTAIN`;
- `NOT_OBSERVABLE`;
- carácter no evaluado.

I12 no crea representation gaps automáticamente a partir de una sola fotografía no observable salvo que una acción/contrato APC vigente lo autorice explícitamente.

## 13. Contradicciones

Cuando existen contradicciones APC para el individuo activo, la UI debe hacerlas visibles sin:

- seleccionar una evidencia ganadora;
- borrar observaciones incompatibles;
- fusionar estados;
- resolver automáticamente el episodio.

La UI presenta contradicciones como contexto diagnóstico y conserva todas las evidencias confirmadas involucradas.

## 14. Estado de fotografía

La UI debe distinguir al menos:

```text
foto sin revisar
foto con DRAFT
foto revisada parcialmente
foto con evidencia CONFIRMED
foto con required pendiente
```

Estos son estados de interfaz derivados y no nuevos estados canónicos de APC.

Una fotografía no necesita contener evidencia para todos los caracteres del dataset.

## 15. Navegación de sesión

Debe ser posible recorrer rápidamente las fotografías mediante:

- selección desde inbox/lista;
- siguiente/anterior;
- filtros derivados de estado de revisión;
- retorno a fotografías con pending o DRAFT.

La navegación no debe alterar evidencia por sí sola.

## 16. Contexto visible

Para la fotografía/individuo activo, la UI puede mostrar contexto APC relevante:

- evidence current;
- DRAFT local;
- requirements;
- pending;
- representation gaps;
- contradictions;
- provenance;
- revisiones históricas cuando sea necesario inspeccionarlas.

La UI no transforma estos elementos de contexto en evidencia positiva.

## 17. Exportación

I12 debe poder materializar una sesión compatible con el contrato APC canónico.

La UI debe distinguir claramente:

```text
STRUCTURALLY VALID
EXPORTABLE
PASS
CLOSED
```

y no presentarlos como sinónimos.

Sólo errores estructurales/de integridad bloquean la materialización técnica del JSON según I10.

`PASS` sigue siendo el resultado derivado definido por I10 y no una decisión visual de I12.

I12 no modifica los criterios de Gate B.

## 18. Integración con I11

I12 no ejecuta identificación como efecto implícito de confirmar un dato.

Cuando se use I11 como verificación desde la UI, debe ser una acción explícita y conservar exactamente la separación:

```text
APC evidence
→ H16 CharacterObservation
→ ACE evidence
→ assessment
```

El resultado ACE no reescribe automáticamente la evidencia APC.

## 19. Seguridad epistemológica

La UI no puede:

- inferir ausencia desde falta de observación;
- convertir `UNCERTAIN` en un estado positivo;
- convertir `NOT_OBSERVABLE` en ausencia;
- inventar speciesId;
- cerrar requirements por apariencia visual de completitud;
- editar Master o JSON botánico canónico;
- resolver contradicciones por mayoría;
- ocultar revisiones históricas necesarias para trazabilidad.

## 20. Regresiones mínimas I12

La implementación debe demostrar como mínimo:

```text
T-I12-01
selección múltiple
→ varias PHOTO registradas una sola vez en una sesión

T-I12-02
foto ingresa sin individuo/especie
→ permanece válida en inbox

T-I12-03
una PHOTO se asocia a dos individuos
→ no se duplica el asset
→ individualRefs conserva ambos

T-I12-04
cambio de fotografía con DRAFT
→ DRAFT se conserva
→ no se vuelve CONFIRMED

T-I12-05
CONFIRMED requiere acción humana explícita
→ entra a evidence canónica

T-I12-06
corrección de CONFIRMED
→ nueva revisión
→ revisión previa retenida

T-I12-07
UNCERTAIN
→ no estado positivo

T-I12-08
NOT_OBSERVABLE
→ no ausencia
→ requirement aplicable permanece insatisfecho

T-I12-09
carácter no evaluado
→ no se serializa como NOT_OBSERVABLE

T-I12-10
sugerencia automática
→ puede proponer estructura/carácter
→ no preselecciona estado botánico

T-I12-11
prefill
→ visible como prefill
→ requiere confirmación sobre foto actual

T-I12-12
batch assignment de individuo
→ reversible
→ no crea estado botánico positivo

T-I12-13
REPRESENTATION_GAP
→ visible como contexto
→ no evidence

T-I12-14
contradiction
→ ambas evidencias visibles
→ UI no elige ganadora

T-I12-15
required no satisfecho
→ pending visible

T-I12-16
foto parcialmente revisada sin required pendiente para esa foto
→ puede quedar confirmada/revisada sin evaluar todo el dataset

T-I12-17
estado de UI
→ no introduce nuevos valores canónicos en APC_SESSION

T-I12-18
export JSON
→ validateApcSession() válido

T-I12-19
EXPORTABLE/PASS/CLOSED
→ representados como estados distintos

T-I12-20
reimportar sesión exportada
→ conserva IDs, evidence revisions, pending, contradictions y provenance
```

## 21. Criterio de cierre I12

I12 puede considerarse implementado cuando:

- existe una interfaz HTML/JavaScript local funcional de una sola vista principal;
- puede ingresar múltiples fotografías en una sesión;
- permite atribuir fotografías a individuos sin duplicarlas;
- permite revisar evidencia por fotografía con estados APC canónicos;
- DRAFT y CONFIRMED están claramente separados;
- correcciones confirmadas usan revisiones;
- suggestions no proponen estados botánicos concretos;
- requirements/pending/gaps/contradictions se visualizan sin reinterpretarlos;
- acciones por lote permitidas son reversibles y no confirman estados botánicos;
- exporta una sesión APC estructuralmente válida;
- puede reimportar la sesión sin pérdida de trazabilidad;
- T-I12-01..20 pasan;
- I1–I11 permanecen verdes;
- `npm test` pasa;
- la auditoría del diff no encuentra blockers;
- el cambio se integra mediante PR aprobado.

### AUDITORÍA

R1 compila las decisiones ya aprobadas para la superficie UI de APC y mantiene separadas captura, confirmación, cobertura, exportabilidad e identificación. La interfaz se define como harness de verificación H16 y no como runtime de H17.

### INCONSISTENCIAS

No se detecta contradicción con I1–I11. El contrato evita convertir la conveniencia de la UI en semántica nueva del modelo de evidencia.

### VACÍOS / OMISIONES

R1 todavía no congela detalles puramente visuales como layout exacto, estilos, tamaños, accesibilidad final ni packaging de producto. Tampoco define un contrato nuevo de hypothesis. Esos elementos no son necesarios para probar el flujo epistemológico I12 y deben permanecer fuera de alcance salvo decisión posterior.

### REDUNDANCIAS

Los estados de revisión de fotografía definidos en §14 son derivados de UI y no deben persistirse como una segunda taxonomía canónica. I12 debe reutilizar validadores y estructuras APC existentes en lugar de replicarlas.
