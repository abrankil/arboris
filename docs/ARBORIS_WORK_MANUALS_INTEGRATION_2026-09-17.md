# Árboris — integración de manuales de trabajo 4A y 4B

Fecha: 2026-09-17
Estado: VALIDADO / INTEGRADO EN BIBLIOTECA OPERATIVA
Proyecto consumidor: Árboris
Sistema de compilación/auditoría utilizado: ASC

## 1. Propósito

Registrar el cierre documental de los manuales operativos 4A y 4B y su integración en la biblioteca humana compartida de Árboris.

Este registro no convierte a ASC en propietario de los manuales ni en autoridad del proyecto. ASC es un sistema independiente de compilación y auditoría. Los artefactos aprobados pertenecen al proyecto consumidor y quedan sujetos a su autoridad.

## 2. Artefactos validados

### 4A — Verbos de trabajo

Estado: APROBADO
Archivo operativo: `4A_Verbos_de_trabajo_APROBADO.png`
Ubicación operativa: Google Drive → `Proyecto Árboris/00_MANUALES_DE_TRABAJO/01_METODO_DE_TRABAJO/`

Contenido funcional: vocabulario operativo para Investigar, Analizar, Definir, Diseñar, Prototipar, Implementar, Probar, Auditar, Corregir, Iterar, Validar, Integrar, Cerrar y Retomar. `DOCUMENTAR` se mantiene como actividad transversal y no como fase aislada.

### 4B — Ciclo de trabajo

Estado: APROBADO
Archivo operativo: `4B_Ciclo_de_trabajo_APROBADO.png`
Ubicación operativa: Google Drive → `Proyecto Árboris/00_MANUALES_DE_TRABAJO/01_METODO_DE_TRABAJO/`

Contenido funcional: ciclo operativo desde Retomar hasta Cerrar, con Prototipar opcional, Investigar como operación auxiliar y Documentar como actividad transversal. El bucle correctivo vigente conserva `Corregir / Iterar → Probar → Auditar` antes de reevaluar criterios.

## 3. Validación

Se consideran satisfechos para este cierre:

- contenido operativo aprobado por la autoridad del proyecto;
- fidelidad textual de 4A revisada;
- estructura de proceso de 4B corregida para impedir el salto directo desde `Corregir / Iterar` a `Auditar`;
- conservación del paso obligatorio por `Probar` antes de una nueva auditoría;
- archivos finales identificados explícitamente como `APROBADO`;
- biblioteca operativa e índice creados en Google Drive.

Resultado de validación para integración documental: PASS.

## 4. Integración

Biblioteca operativa humana:

```text
Proyecto Árboris/
└── 00_MANUALES_DE_TRABAJO/
    ├── 00_INDICE_Y_ESTADO
    ├── 01_METODO_DE_TRABAJO/
    │   ├── 4A_Verbos_de_trabajo_APROBADO.png
    │   └── 4B_Ciclo_de_trabajo_APROBADO.png
    └── 90_HISTORICO/
```

Google Drive mantiene los manuales aprobados y material humano de consulta. GitHub mantiene la trazabilidad técnica, normativa, contratos, especificaciones y registros de integración. No se establece sincronización automática entre ambas fuentes en esta etapa.

## 5. Regla para futuros manuales

```text
COMPILAR / PRODUCIR
→ PROBAR cuando corresponda
→ AUDITAR
→ CORREGIR / ITERAR si corresponde
→ VALIDAR
→ APROBACIÓN DE AUTORIDAD cuando sea requerida
→ INTEGRAR EN BIBLIOTECA OPERATIVA
→ ACTUALIZAR ÍNDICE
→ CERRAR
```

Un artefacto generado o compilado mediante ASC no adquiere estado vigente por existir. Solo entra en la biblioteca operativa como `APROBADO` después de superar los controles aplicables y recibir la aprobación correspondiente.

## 6. Fuente y estado

- Drive: fuente operativa de consulta para 4A y 4B aprobados.
- GitHub: registro técnico de esta integración y de la metodología relacionada.
- ASC: sistema independiente utilizado en compilación/auditoría; no reemplaza canon, evidencia ni autoridad de Árboris.

Cierre: 4A y 4B documentados, validados e integrados.