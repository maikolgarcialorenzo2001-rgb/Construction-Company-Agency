# HANDOFF — Construction-Company-Agency

> Última actualización: **2026-10-21** — **`p16-vacante` COMPLETO y archivado** ✅ en la rama `feature/p16-vacante` (HEAD `8806b3d`, base `main@a711e5f`). **Sin merge a `main` y sin push** (decisión de integración pendiente). Último gate local: **795/795 tests** (82 files) · build (25 rutas prerenderizadas) + lint OK · contrato y gates en zero-diff.
> El historial de cambios p0–p16 y sus notas quedaron en `git log -- HANDOFF.md` (este archivo se sobrescribe a propósito para no arrastrar estado viejo).

---

## CERRADO — `p16-vacante` (Plantilla 3 — vacante de empresa)

**Qué entra**: la empresa publica una promo de 1..n vacantes propias. Payload demo-only **reference-only** (`VacancyPayload { jobIds[] }`, nunca copia campos del job) · registro determinista `postId → payload` · derivación de `kind:'vacancy'` en `toPostView` · card multi-vacante con estado `Abierta`/`Cerrada` y link "Postularse" a `/plataforma/trabajos/:id` (siempre presente, incluso cerrada) · proyección **solo** en `[postExtra]` · compositor propio de empresa con toggle **normal / "Buscar trabajadores"** (modos excluyentes), picker acotado a sus vacantes abiertas y regla compuesta (≥1 vacante Y (texto O foto)).

**Commits** (rama `feature/p16-vacante`, base `main@a711e5f`):

| WU | Commit | Alcance |
|---|---|---|
| WU1 — data | `3fbe2b2` | `PostKind` +`'vacancy'`, `VacancyPayload`, registry + reset, 2 seeds texto-only antes de `post-10` (11→13), derivación en `toPostView`, `CreatePostDraft.vacancy?`, gateway author-aware |
| WU2 — card | `982eecf` | `jobStatusLabel`, `resolveVacancyOpenings`, `post-vacancy` component (multi-vacante + a11y D11) |
| WU3 — feed | `4c9bd9c` | Proyección en `[postExtra]`, hidratación `JobsStore.load()` one-shot idle-guarded, hide-on-empty (D6) |
| WU4a — composer | `e9af21e` | `CompanyComposerComponent` (`src/app/components/company-composer/`), picker con scope propio+abierto, regla compuesta, `role="alert"` + foco |
| WU4a polish | `c65dcbf` | Empty-picker state, `aria-invalid` en fotos, error↔grupo, error se limpia al editar, modos **exclusivos** (D4a) |
| WU4b — wiring | `8f95d55` | `<app-company-composer>` reemplaza el textarea inline · `publishCompany` mapea `CompanyPostDraft` → `CreatePostDraft` (`kind:'vacancy'` con payload, `'standard'` sin) · `companyAuthorId` desde la sesión (nunca `'company-1'` hardcodeado) · guard de hidratación con trigger `needsPicker` |
| archive | `8806b3d` | Sync de specs + `openspec/changes/archive/2026-10-21-p16-vacante/` (9 archivos) |

**Verificación**: **PASS WITH WARNINGS** — 0 CRITICAL, 6 WARNING, 9 SUGGESTION · **23/24 escenarios COMPLIANT** (1 PARTIAL, resuelto en archive) · **9/9 mutaciones matadas** (guards probados por mutación: idle-guard, `needsPicker`, D6 hide, precedence job-request, scope del picker, regla compuesta, posición de seeds, reset del registry). Specs canónicas: **`platform-vacancy` CREADA** (8 requirements / 17 escenarios) + **`platform-feed` MODIFICADA** (1 requirement reemplazada + 1 agregada; el resto byte-idéntico).

**Decisiones de diseño relevantes** (para quien retome): payload = referencia, nunca copia (lock de conformance) · "Postularse" = link, sin apply inline (v1) · picker = `status==='open' && companyId===session authorId` · ≥1 vacante Y (texto O foto) · contrato READ-ONLY (`openapi.yaml` + `contract-conformance.ts` en zero-diff) · admin sigue sin composer (deuda de p15).

**Entrega**: la rama vive SOLA en `feature/p16-vacante` — **NO mergeada a `main`, NO pusheada**, sin PR ni issue. Merge/push es decisión del maintainer.

---

## Pendiente — integración

- [ ] **Merge a `main` + push** de `feature/p16-vacante` (`8806b3d` + este commit de handoff). Hasta entonces la planta 3 no está en `main`.
- [ ] **Deuda W-3 antes de cualquier demo pública**: las fotos de las fixtures apuntan a `images.example.com` → **404 en un navegador real** (jsdom no lo detecta).

## Pendientes — Plantillas

**Plantilla 1 — base (estándar)** ✅ `p14-plantilla-publicacion`: autor + botón Seguir · texto opcional · fotos 1–10 · Me gusta / Reenviar / Guardar · invariante *nunca-vacía* (texto **o** imagen).

**Plantilla 2 — Solicitud de empleo (trabajador)** ✅ `p15-solicitud-empleo`: `PostKind 'job-request'` + payload demo (registry) · composer propio para `worker` (4 campos requeridos + regla texto-o-foto) · card estructurada vía `[postExtra]` · composer por rol en el feed. Specs: `openspec/specs/platform-job-request/` + delta en `platform-feed`.

**Plantilla 3 — Vacante (empresa)** ✅ `p16-vacante` — ver arriba. Las 3 plantillas base están completas.

## Pendientes — Reestructurar vistas

- [ ] **Vista de guardados**: el botón Guardar ya persiste por viewer, pero no existe la sección que lista las publicaciones guardadas.
- [ ] **Feed priorizado por seguidores**: el sistema de follow ya guarda las relaciones, pero `FeedStore` todavía no ordena/prioriza por follows.
- [ ] A definir: qué más entra en esta reestructuración (perfiles de autor, lista de seguidores/seguidos, layout general de `/plataforma`).

---

## Deuda registrada (no bloqueante)

- `W-1` — falta un test para la cláusula "sin contador de seguidores / sin notificaciones" de `platform-engagement`.
- `W-2` — el commit de WU4a (`e9af21e`) quedó en **513 líneas**, 113 sobre el presupuesto de review de 400. Aceptado como Residual-1 (igual que p15): bajarlo obligaría a separar el spec del componente y romper `work-unit-commits`. El commit **no** se reescribe. `c65dcbf` y `8f95d55` sí están dentro de budget.
- `W-3` — fotos demo de las fixtures apuntan a `images.example.com`: **404 en un navegador real**. Cerrar antes de una demo pública.
- `W-4` — flake **pre-existente** (no es de p16): `app.release-matrix.spec.ts` → "starts the shell with the skip link" puede dar un timeout de 5000 ms con `ReferenceError: IntersectionObserver is not defined` bajo carga del suite completo. Reproducido sobre un `main` prístino → la causa está en la galería de fotos, no en este cambio. Pasa 7/7 en carga aislada.
- `W-5` — el composer de empresa no muestra previews de fotos (el de p15 sí) y no revoca los `URL.createObjectURL` (mismo gap en p15) → candidato a un fix cross-cutting de los dos composers.
- `W-6` — `@vitest/coverage-v8` quedó instalado en p15 pero **sin cablear** (`coverage_threshold: 0`). Candidato a chore con gates de cobertura.
- `W-7` — el admin sigue sin composer (deuda de p15, por diseño hasta que alguien lo pida explícitamente).
- `W-8` — los modos del composer de empresa son excluyentes (D4a, refinamiento del spec durante la implementación) y la aserción "byte-compatible" del spec de componente es superficial (el código sí es byte-idéntico: 599/599 chars).
