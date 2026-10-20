# HANDOFF — Construction-Company-Agency

> Última actualización: **2026-10-20 (fin de jornada)** — `p15` mergeado en `main` (`c903f65`) ✅ · **`p16-vacante` EN CURSO** en rama `feature/p16-vacante` (WU1–WU3 de 5, sin push). Último gate local: **773 tests** · build + lint OK.
> El historial de cambios p0–p15 y sus notas quedaron en `git log -- HANDOFF.md` (este archivo se sobrescribe a propósito para no arrastrar estado viejo).

---

## EN CURSO — `p16-vacante` (Plantilla 3)

**Estado**: planning completo en **engram** (NO hay dir `openspec/changes/p16…`; artefactos: `sdd/p16-vacante/{explore#1036, proposal#1037, spec#1038, design#1039, tasks#1041, apply-progress#1042}`).
**Decisiones tomadas**: payload = `jobIds[]` referencia (card resuelve via `JobsStore`, nunca copia campos — conformance lock) · "Postularse" = link a `/plataforma/trabajos/:id` (v1, apply inline descartado) · picker del composer filtra `status==='open' && companyId===author` · regla: ≥1 vacante Y (texto O foto) · contrato READ-ONLY · admin sigue sin composer (resuelve Debt-3 p15).

**Committed** (rama `feature/p16-vacante`, base `main@a711e5f`, 5 WUs de ~≤400 líneas c/u):
- [x] **WU1** `3fbe2b2` — data foundation: `PostKind 'vacancy'`, `VacancyPayload`, `vacancy.registry` + reset, 2 seeds antes de `post-10` (11→13), derive en `toPostView`, `CreatePostDraft.vacancy?` → **759 tests**
- [x] **WU2** `982eecf` — card: `jobStatusLabel` (Abierta/Cerrada), `resolveVacancyOpenings`, `post-vacancy` component (multi-vacante, Postularse link siempre visible, a11y D11) → **768 tests**
- [x] **WU3** `4c9bd9c` — feed: proyección en `[postExtra]` (attributo en el host!), `JobsStore.load()` one-shot guard, hide-on-empty D6, matrix+a11y verdes sin editar → **773 tests**

**Pendiente**:
- [ ] **WU4a** (tasks 4.1–4.4) — `CompanyComposerComponent`: toggle normal/vacancy, picker (1..n, filtro propio+abierto), regla compuesta, a11y. **El lanzamiento se canceló — arrancar acá.** Base: `4c9bd9c`. Est. 330–400 líneas.
- [ ] **WU4b** (tasks 4.1–4.4 remanentes) — wiring en `feed.page`: publish path + role gating + gates. Est. 200–260.
- [ ] `sdd-verify` → `sdd-archive` (⚠️ nota para archive: spec dice count "11→12", realidad es "11→13" — corregir) → merge a `main` + push.

**Gotchas p16 para el que continúe**:
- Zonaless 2-hop flush: specs de feed con vacancy cards necesitan 2 rondas `whenStable` (helper `settleVacancyFeed` en feed.page.spec).
- `provideRouter([])` obligatorio en TestBed de specs que rendericen la card (RouterLink NG0201).
- Angular lint `eqeqeq` rechaza `!= null` en templates → usar `!== undefined`.
- Baseline de compat: los tests actuales de company-textarea en `feed.page.spec.ts` son lo que WU4a/WU4b NO deben romper.

---

## Pendientes — Plantillas

**Plantilla 1 — base (estándar)** ✅ hecha en `p14-plantilla-publicacion`: autor + botón Seguir · texto opcional · fotos 1–10 · Me gusta / Reenviar / Guardar · invariante *nunca-vacía* (texto **o** imagen).

**Plantilla 2 — Solicitud de empleo (trabajador)** ✅ hecha en `p15-solicitud-empleo`: `PostKind 'job-request'` + payload demo (registry) · composer propio para `worker` (4 campos requeridos + regla texto-o-foto, structured-only rechazado) · card estructurada vía `[postExtra]` · composer por rol en el feed (worker→form, company→textarea, admin→ninguno). Specs: `openspec/specs/platform-job-request/` + delta en `platform-feed`.

**Plantilla 3 — Vacante (empresa)** 🚧 **EN CURSO** → ver sección "EN CURSO — p16-vacante" arriba (planning + WU1–WU3 ya committed).

## Pendientes — Reestructurar vistas
- [ ] **Vista de guardados**: el botón Guardar ya persiste por viewer, pero no existe la sección que lista las publicaciones guardadas.
- [ ] **Feed priorizado por seguidores**: el sistema de follow ya guarda las relaciones, pero `FeedStore` todavía no ordena/prioriza por follows.
- [ ] A definir: qué más entra en esta reestructuración (perfiles de autor, lista de seguidores/seguidos, layout general de `/plataforma`).

---

## Deuda registrada (no bloqueante)

- `W-1` — falta un test para la cláusula "sin contador de seguidores / sin notificaciones" de `platform-engagement`.
- `W-2` — WU2 (619 líneas) y WU3 (618) exceden el presupuesto de review de 400 líneas → requiere `size:exception` si algún día se cortan PRs.
- `W-3` — las fotos demo de las fixtures apuntan a `images.example.com`: **404 en un navegador real** (jsdom no lo detecta). Cerrar antes de una demo pública en vivo.
