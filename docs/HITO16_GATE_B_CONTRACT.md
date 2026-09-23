# Árboris — Hito 16 Gate B Contract R2

**ID:** `ARBORIS_H16_GATE_B_CONTRACT_R2`  
**Estado:** VALIDATED WITH ASC / FROZEN.  
**Ámbito:** Hito 16 / cierre empírico y técnico.  
**Base:** APC I1–I12 integrados; I11 R4 e I12 R10/V0.11 validados y congelados.  
**No autoriza:** cierre automático de Hito 16, H17 runtime ni modificación de conocimiento botánico.

## 1. Propósito

Gate B determina si Hito 16 ha demostrado su tesis técnica mínima:

```text
fotografía real
→ observador restringido a un carácter canónico
→ estado permitido | uncertain | not_observable
→ evidencia trazable
→ benchmark contra anotación humana
→ handoff compatible con ACE
```

Gate B no exige observadores para todos los caracteres ni convierte H16 en un identificador directo de especies.

R2 añade una corrección de reproducibilidad: el benchmark no puede depender de una partición por individuo cuyo conjunto de fotografías pueda crecer silenciosamente después de haber sido congelado.

## 2. Fuentes de autoridad

Gate B compila únicamente requisitos ya documentados en el proyecto:

- criterio histórico de éxito de Hito 16 para al menos un carácter activo del Master;
- contratos APC I1–I12;
- I11 R4 para handoff contradiction-safe hacia ACE;
- I12 R10/V0.11 para captura/revisión/export de evidencia;
- contratos vigentes de ACE;
- Master Botánico y derivados canónicos para estados y relaciones botánicas.

La rama histórica de H16 puede aportar trazabilidad y artefactos candidatos, pero no se considera por sí sola fuente canónica.

## 3. Carácter demostrador

El carácter demostrador vigente para el experimento es:

```text
H16-EXP-001
characterId = CH-003
```

Cambiar el carácter demostrador requiere declarar una nueva versión o experimento y no se infiere automáticamente.

## 4. Criterios obligatorios de Gate B

Gate B sólo puede considerarse satisfecho cuando, para el carácter demostrador:

1. existe evidencia fotográfica real;
2. el observador intenta evaluar únicamente el carácter autorizado;
3. la salida se limita a un estado canónico permitido, `uncertain` o `not_observable`;
4. el observador no identifica directamente una especie;
5. se conserva provenance y estado de incertidumbre;
6. existe capacidad explícita de abstención ante evidencia insuficiente;
7. existe benchmark contra anotación humana;
8. la evidencia producida es compatible con el contrato H16 → ACE;
9. no se introduce conocimiento botánico paralelo al canon;
10. la arquitectura demuestra que el patrón es extensible a otros caracteres sin hardcodear una especie;
11. el benchmark usa separación anti-leakage documentada;
12. se declaran explícitamente las clases/estados no cubiertos por el dataset.

Además, la infraestructura que sustenta la demostración debe mantener verdes las regresiones vigentes de APC, character observers, ACE y el gate general `npm test`.

## 5. Requisitos de evidencia de cierre

El expediente de Gate B debe contener al menos:

```text
dataset/split usado
anotaciones humanas de referencia
cobertura observada por estado
definición exacta del observer input
versión/configuración del observador
resultados de development
resultados de holdout
métricas reportadas
abstenciones
errores/confusiones
clases no cubiertas
provenance de ejecución
auditoría ASC final
```

Los resultados de holdout deben registrarse sin reusar el holdout para ajustar reglas, arquitectura o thresholds posteriores a su evaluación.

### 5.1 Freeze inmutable del benchmark

La partición por individuo evita leakage entre individuos, pero no congela por sí sola la composición fotográfica del benchmark.

Por tanto, antes del primer uso del holdout, debe existir un manifiesto inmutable que fije como mínimo:

```text
experimentId
characterId
manifestVersion
sourceDatasetRef
sourceDatasetHash
developmentPhotoIds[]
holdoutPhotoIds[]
excludedPhotoIds[]
assetIdentity por foto
createdAt
```

Reglas:

- agregar posteriormente una PHOTO al mismo individuo no la incorpora automáticamente al development ni al holdout congelados;
- remover o reemplazar una foto del manifest requiere nueva versión del manifest;
- la identidad del asset debe poder verificarse mediante fingerprint/hash o referencia equivalente estable;
- el benchmark debe reportar exactamente qué versión de manifest consumió;
- development y holdout se derivan del manifest congelado, no de una consulta dinámica a todos los registros actuales del individuo;
- fotos nuevas pueden permanecer fuera del benchmark hasta una decisión explícita de nueva versión.

Esto preserva tanto anti-leakage como reproducibilidad temporal.

## 6. Anti-leakage

La unidad de split debe impedir que evidencia del mismo individuo aparezca simultáneamente en development y holdout.

El observer input no puede contener ni derivar desde:

- `speciesId`;
- nombre científico o común;
- etiquetas de ground truth;
- estado anotado;
- filename o ruta que revele identidad taxonómica;
- metadata cuyo propósito sea entregar la respuesta.

Los campos de provenance necesarios para evaluación pueden existir en la capa confiable de benchmark sin cruzar al observer input.

## 7. Relación con APC e I12

I12 puede utilizarse para capturar y curar la referencia humana.

La evidencia humana de benchmark debe:

- conservarse sin destrucción;
- mantener DRAFT separado de CONFIRMED;
- mantener individuo, fotografía, carácter y provenance;
- no convertirse en evidencia automática por mera carga de una foto.

Una contradicción operacional `OPEN` sigue la política I11 R4: se preserva en APC y suspende esa dimensión del handoff ACE para el individuo afectado.

## 8. Relación con ACE

Gate B no requiere que ACE resuelva contradicciones observacionales ni que conozca la causa botánica de una variación.

El observador entrega evidencia; ACE identifica usando las dimensiones habilitadas por sus contratos vigentes.

La repetición del mismo `characterId` no crea dimensiones independientes adicionales.

## 9. OPEN-B1 — criterio cuantitativo de aceptación del benchmark

Los documentos históricos exigen un benchmark contra anotación humana, pero no fijan un umbral numérico mínimo de exactitud, cobertura o abstención para declarar éxito empírico.

Por tanto, R1 no inventa uno.

Permanece `OPEN`:

```text
¿Gate B exige sólo un benchmark válido y auditado
para demostrar factibilidad,
o requiere superar un threshold cuantitativo mínimo?
```

Hasta que esta decisión sea resuelta explícitamente por dirección de proyecto, Gate B no puede producir un `PASS FINAL` de cierre empírico.

El benchmark sí puede ejecutarse y documentarse antes de resolver OPEN-B1.

## 10. OPEN técnicos no necesariamente bloqueantes

Las siguientes decisiones pueden permanecer abiertas si no son necesarias para interpretar o reproducir el experimento demostrador:

- herramienta final de segmentación;
- modelo final para runtime local;
- arquitectura móvil;
- estrategia offline definitiva;
- reglas UX finales para pedir otra foto;
- orden de caracteres posteriores;
- generalización entre campañas independientes.

Un OPEN se vuelve blocker sólo si impide reproducibilidad, interpretación del benchmark, integridad de evidencia o satisfacción de uno de los doce criterios obligatorios.

## 11. Resultado de Gate B

Gate B reutiliza el vocabulario transversal vigente:

```text
FAIL
→ existe un criterio obligatorio incumplido o un blocker

PARTIAL
→ la evidencia es incompleta o existe una decisión OPEN necesaria para cierre

PASS
→ todos los criterios obligatorios están satisfechos
→ OPEN-B1 está resuelto o documentado como no bloqueante por dirección
→ auditoría ASC final PASS
→ aprobación formal de dirección registrada
```

Este resultado pertenece al gate de H16 y no sustituye `PASS` de APC I10.

## 12. Cierre de Hito 16

El cierre formal de Hito 16 sólo procede después de Gate B `PASS`.

El cierre debe registrar:

- experimento demostrador usado;
- versión del contrato;
- evidencia de benchmark;
- limitaciones;
- OPEN trasladados a hitos posteriores;
- aprobación de dirección;
- actualización de roadmap.

No se cierra H16 por el solo hecho de que I1–I12 estén implementados.

## 13. AUDITORÍA

R2 conserva la separación de R1 entre infraestructura validada y demostración empírica y añade el freeze explícito del conjunto de fotografías. No convierte I12, PASS de I10 ni handoff I11 en prueba de desempeño del observador. Los doce criterios de éxito se preservan y se hace explícito el vacío cuantitativo existente.

## 14. INCONSISTENCIAS

R2 corrige un hallazgo posterior a R1: una partición definida sólo por `individualId` puede cambiar materialmente si se agregan fotografías nuevas a esos mismos individuos después del freeze. El benchmark queda ahora ligado a un manifest de PHOTO/asset explícito y versionado. Se mantiene además la corrección de R1 respecto de Gate B y OPEN-B1.

## 15. VACÍOS / OMISIONES

OPEN-B1 permanece sin resolver. También faltan, en el estado actual de H16, el manifest congelado del benchmark, anotación humana completa, cobertura por clase, baseline, observador CH-003, benchmark holdout y auditoría empírica.

## 16. REDUNDANCIAS

Gate B no redefine APC PASS, ACE supported ni contratos de observación. Sólo compila los requisitos de cierre de H16 y referencia esas autoridades.


## 17. HISTORIAL DE R1

R1 fue validado con ASC e integrado. R2 lo supersede únicamente para añadir el requisito de freeze inmutable del conjunto de fotografías y assets del benchmark.

```text
AUDITORÍA             PASS
INCONSISTENCIAS       PASS
VACÍOS / OMISIONES    PASS
REDUNDANCIAS          PASS
BLOCKERS DEL CONTRATO 0
```

Verificación ejecutable:

- CI #224 → PASS;
- canonical tests / `npm test` → PASS;
- Audit Protocol Check #155 → PASS;
- diff limitado a este contrato;
- no hay cambios de runtime, Master, ACE, APC ni datos botánicos;
- OPEN-B1 permanece explícitamente abierto.

R1 permanece como antecedente histórico. R2 requiere nueva validación completa antes de quedar FROZEN.


## 18. VALIDACIÓN FINAL ASC R2

Validación ejecutada sobre la corrección de freeze del benchmark.

```text
AUDITORÍA             PASS
INCONSISTENCIAS       PASS
VACÍOS / OMISIONES    PASS
REDUNDANCIAS          PASS
BLOCKERS DEL CONTRATO 0
```

Verificación:

- CI #227 → PASS;
- canonical tests / `npm test` → PASS;
- Audit Protocol Check #158 → PASS;
- diff limitado al contrato Gate B;
- no cambia runtime, Master, ACE, APC ni datos;
- OPEN-B1 permanece abierto;
- R2 añade únicamente el requisito de manifest fotográfico/asset inmutable y versionado.

R2 queda FROZEN. Esto no declara Gate B PASS ni cierra Hito 16.
