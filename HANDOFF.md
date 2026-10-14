# HANDOFF — Construction-Company-Agency

> Última actualización: **2026-10-14** (p13-modo-previa archivado: verify PASS WITH WARNINGS + spec sync; queda en branch `feature/p13-modo-previa`, **sin mergear a `main`**) · nada pusheado a origin.
> Este archivo reemplaza al anterior (se sobrescribe a propósito para no arrastrar estado viejo).

---

## 1. Estado actual (verificado)

- Angular 22, static SSR, **zoneless signals**, TS strict, Tailwind v4. **BUN ONLY** (`bunx ng ...`).
- **Strict TDD activo** (`bunx ng test --watch=false`).
- Gate verde: **652 tests / 70 files** · lint limpio · build verde (**25 rutas prerenderizadas**) · `verify:prerender` PASS.
- `contracts/openapi.yaml` **READ-ONLY**. Roles `worker | company | admin` (sin 4º rol).
- `git status`: p13-modo-previa archivado (spec sync) pero **pendiente de commit** (lo hace el orquestador); vive en branch `feature/p13-modo-previa` (`5c639a3`), **no mergeado a `main`**. `angular.json` revertido (no se commitea).
- Rutas de plataforma: `/plataforma` = feed; `/plataforma/inicio` = **home por rol** (nuevo en p11).
- `/plataforma` es **client-only** y detrás de `authGuard`. Existe `roleGuard` con `data.roles` (p12-admin); `/plataforma/admin` usa `[authGuard, roleGuard]` con `data.roles: ['admin']`.

## 2. Cómo leemos el plan

Plan de registro: **§10 de la versión anterior del HANDOFF** (Paso 1–8). Cada paso = **un cambio SDD chico**,
con commits locales secuenciales sobre `main` (un work-unit commit por unidad, mensaje termina en `(nombre-cambio)`).
**Paso 1 y 2 ya están hechos** (p1–p7). Meta: una **previa estática presentable** de `/plataforma` con datos falsos.

### Decisiones bloqueadas (no volver a preguntar)
- Modo de ejecución: **`auto`** (correr fases sin frenar).
- Artifact store: **híbrido** (`openspec/` + Engram).
- Delivery: **`ask-on-risk`** · Chain: **`stacked-to-main`** (commits locales encadenados, **sin branches/PRs/push**).
- 4º rol / moderación: **descartado**. Pasos 5/6 pierden la parte de moderación; **Paso 6 se elimina**.

## 3. Hecho en esta tanda

| Cambio | Estado | Commits |
|---|---|---|
| **p8-warnings-closure** | ✅ archivado | `8a575d3`, `86f535c`, `a38697c`, `cfcb179` |
| **p9-comentarios** | ✅ archivado (con spec sync) | `c5919a6`, `cbc8048`, `0859ae1`, `bf628d8` |
| **p10-fixtures** | ✅ archivado (sin spec sync) | `fd28696`, `38f3725`, `0cc2d98` |
| **p11-home-por-rol** | ✅ archivado (con spec sync) | `163887d`, `9a0745a`, `40b909c`, `09286bf`, `8e55e7e`, `fb1bc76`, `68c27c7` |
| **p12-admin** | ✅ archivado (con spec sync) | `f4fe721`, `5b478e2`, `0f8ff7d`, `c81acef` |
| **p13-modo-previa** | ✅ archivado (con spec sync) — branch `feature/p13-modo-previa` (**no mergeado a `main`**) | `75c0132`, `512d366`, `5c639a3` |

- **p8**: cerró warnings de p6/p7 — CTA del header bindeada a `site.promo.ctaPath`; rutas de plataforma
  (`/plataforma`, `/login`, `/registro`) agregadas al scan a11y con sesión sembrada; guard de planes;
  test con `SessionService.login()` real.
- **p9**: modelo `Comment` + `CommentsGateway` (mock in-memory) + `CommentsStore` zoneless por post +
  **hilo inline de comentarios en el feed** (composer sólo para autenticados). Nueva capability
  `platform-comments` (+ MODIFIED `platform-feed`), sincronizada a `openspec/specs/`. **Sin cambio de contrato.**
  ⚠️ El effect de carga necesitó **`untracked()`** para no loopear infinito.
- **p10**: fixtures ampliadas — posts 3→9, comments 3→12, jobs 3→7, applications 2→7 (4 estados),
  perfiles 3W+2C, cuentas demo 2→5. Todo `isPlaceholder: true`. Sin delta de spec.
- **p11**: entrada por rol — nueva `PlatformHomePage` en `/plataforma/inicio` (worker "Mis postulaciones",
  company "Mis vacantes", admin placeholder), `login`/`registro` redirigen ahí, nav gana "Inicio". Nueva
  `ApplicationsStore` y **fix W1-p10**: `loadApplication(jobId, applicantId?)` + bloque de estado sólo para worker.
  Capabilities: NEW `platform-home`; MODIFIED `platform-jobs`, `platform-shell`, `site-shell-navigation`.
  Sin cambio de contrato. `roleGuard` se difirió y llegó en p12-admin (abajo).
- **p12**: área admin con `roleGuard` (`data.roles`) + cuenta demo admin (`admin@demo.test`/`demo1234`/`admin-1`);
  `/plataforma/admin` con `[authGuard, roleGuard]` (`data.roles: ['admin']`), directorio read-only (sin `password`)
  + config local en `localStorage`;   `ADMIN_NAV` propio (con `Admin`) y link en el home admin. Capabilities:
  NEW `platform-admin`; MODIFIED `platform-home`, `platform-identity`, `platform-shell`, `site-shell-navigation`.
  Sin cambio de contrato.
- **p13**: modo previa estática — `/previa` **top-level** (hermano de `plataforma`), prerenderizable y **sincrónico**
  desde fixtures (sin store/`await`/`PendingTasks`, R1 mitigado), + `/previa/:role` (worker/company/admin) por
  segmento; **switcher de rol client-only** que entra a la plataforma con cualquiera de las 6 cuentas demo
  (`SessionService.login(email,'demo1234')`, sin registro). `/previa` es `NOINDEX` y `scripts/verify-prerender.ts`
  queda **sin tocar** (`previa` fuera de `STATIC_PATHS`). Capabilities: NEW `platform-preview`; MODIFIED
  `platform-shell`, `server-rendering`, `platform-identity`. Sin cambio de contrato. ⚠️ Vive en branch
  `feature/p13-modo-previa`, **no mergeado a `main`**.

## 4. EN CURSO — retomar acá

Paso 7 (`p12-admin`) ✅ **DONE / archivado** (ver §3 y §8).
Paso 8 (`p13-modo-previa`) ✅ **DONE / archivado** en branch `feature/p13-modo-previa` (**no mergeado a `main`** — ver §3 y §8).

**Paso 8 — Modo previa estática** (`p13-modo-previa`) — ✅ **DONE**
- Alcance cumplido: switcher de rol (entrar como cualquiera desde fixtures, sin registro) + showcase
  `/previa` prerenderizado (top-level, hosteable sin app). Los perfiles extra de p10 quedan **alcanzables acá**.
- Entregable: previa navegable/publicable con datos falsos → `dist/.../browser/previa/{index,worker,company,admin}.html`.
- ⚠️ Vive **sólo** en `feature/p13-modo-previa` (`5c639a3`); **decisión de merge pendiente** (no está en `main`).

## 5. Warnings / arrastres vivos

| ID | Origen | Item |
|---|---|---|
| W-spawn | proceso | El sub-agente `sdd-apply` falla **intermitente** al spawnear: `Bad Request: {"model":"big-pickle"}`. **Solución: reintentar** el `task`. Un intento parcial puede dejar archivos huérfanos → re-probar RED y reconciliar (pasó en p11 WU2). |
| W-propose | proceso | El sub-agente `sdd-propose` reportó éxito pero **no persistió** (p10): reescribir inline y **verificar artefactos en disco** tras cada fase. |
| W-verify | proceso | En p9 el `verify-report.md` no quedó en disco (gap híbrido): verificar persistencia. |
| **W-p13-1** | verify p13 | **Sin aserción automática de que el HTML construido de `/previa*.html` no esté vacío**: el escenario *"Prerendered HTML is non-empty"* sólo se cubre a nivel componente y `scripts/verify-prerender.ts` **no** incluye `previa` en `STATIC_PATHS` (pinned por diseño — NOINDEX emite JSON-LD). No-emptiness verificada a mano. Fix mínimo: spec `node:fs` post-build que lea `dist/.../browser/previa/index.html` y valide contenido de fixtures + meta `noindex`, **sin** tocar `STATIC_PATHS`. |
| W-p13-2 | verify p13 | Evidencia TDD no consolidada: `apply-progress` (#983) cubre WU2 (+ fix W1) pero sin tabla RED/GREEN/TRIANGULATE/SAFETY-NET/REFACTOR; WU1 no tiene observación propia. Fix mínimo: upsert de `sdd/p13-modo-previa/apply-progress` con una tabla TDD que abarque WU1+WU2. |

**Cerrados (2026-10-14, commit de limpieza):** `W-NG8107` — el `?.` del harness en `comments.store.spec.ts` está justificado ahora que `postState` se tipa `CommentsState | undefined` (la causa raíz real es que no está activo `noUncheckedIndexedAccess`; queda como ticket aparte). `W-seq` — `MockCommentsGateway.seq` ahora es contador **por instancia** (como los otros mocks); ids determinísticos sin depender del orden de la suite.

## 6. Gotchas operativos (ya nos mordieron)

- **Archive**: el dir del cambio suele estar **untracked**; `git mv` falla → usar `mv` normal + **`git add` de todo el dir**.
  Confirmar `git status` sin artefactos de archivo colgando.
- **`angular.json`** aparece `M` por el CLI (`analytics: false` + reformat): **no commitear**.
- **No tocar** `contracts/openapi.yaml`; **no** agregar `Comment` (u otras entidades sin schema) a `contract-conformance.ts` (rompe build).
- UI copy **es-AR**; artefactos/commits en **inglés**; convencional commits; sin atribución de IA.

## 7. Comandos

```bash
bunx ng test --watch=false     # tests (strict TDD)
bunx ng lint
bunx ng build                  # AOT + strictTemplates
bun run gate                   # gate completo
```

## 8. Refs Engram (project: construction-company-agency)

- Cambios: `sdd/p8-warnings-closure/summary`, `sdd/p9-comentarios/summary`, `sdd/p10-fixtures/summary`, `sdd/p11-home-por-rol/summary`. Archivado p12: `sdd/p12-admin/archive-report` (#972). Archivado p13: `sdd/p13-modo-previa/archive-report`.
- Fases p11: `explore` (#944), `proposal` (#946), `spec` (#947), `design` (#948), `tasks` (#949), `apply-progress` (#950), `verify-report` (#952), `archive-report` (#953).
- Fases p12 (archivado): `explore` (#956), `proposal` (#958), `spec` (#959), `design` (#960), `tasks` (#961), `apply-progress` (#963), `verify-report` (#969), `archive-report` (#972).
- Fases p13 (archivado, branch `feature/p13-modo-previa`): `explore` (#977), `proposal` (#979), `spec` (#980), `design` (#981), `tasks` (#982), `apply-progress` (#983, WU2+fix), `verify-report` (#986), `archive-report` (`sdd/p13-modo-previa/archive-report`).
- Descubrimientos: `platform/role-guard` (#945), #951 (p11 apply), #954 (stray delta scaffolding), #957 (p12 foundation gaps).
- Protocolo SDD: `sdd-init/{project}` (#783), `skill-registry` (#785).
- Lección: `openspec/archive-must-stage-artifacts`.
