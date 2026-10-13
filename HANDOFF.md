# HANDOFF — Construction-Company-Agency

> Última actualización: **2026-10-13** · HEAD `68c27c7` · adelante **80** de `origin/main` (nada pusheado).
> Este archivo reemplaza al anterior (se sobrescribe a propósito para no arrastrar estado viejo).

---

## 1. Estado actual (verificado)

- Angular 22, static SSR, **zoneless signals**, TS strict, Tailwind v4. **BUN ONLY** (`bunx ng ...`).
- **Strict TDD activo** (`bunx ng test --watch=false`).
- Gate verde: **578 tests / 62 files** · lint limpio · build verde (21 rutas).
- `contracts/openapi.yaml` **READ-ONLY**. Roles `worker | company | admin` (sin 4º rol).
- `git status` limpio (sin pendientes). `HANDOFF.md` ya está trackeado; `angular.json` quedó revertido (el cambio incidental del CLI no se commitea).
- Rutas de plataforma: `/plataforma` = feed; `/plataforma/inicio` = **home por rol** (nuevo en p11).
- `/plataforma` es **client-only** y detrás de `authGuard`. Solo existe `authGuard`: no hay `roleGuard` ni `data.roles` (el gating por rol queda diferido a `p12-admin`).

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
  Sin cambio de contrato. ⚠️ `roleGuard` sigue diferido a `p12-admin`.

## 4. FALTA — Pasos 7 y 8

Cada uno = su propio cambio SDD. Alcance propuesto abajo (bloques `📝 Instrucciones (usuario)` a completar/validar).

**Paso 7 — Área admin** (`p12-admin`)
- Alcance: gestión de usuarios/roles + configuración (sólo rol `admin`).
- Entregable: superficie admin jugable en demo.
- 📝 Instrucciones (usuario): _(a completar)_

**Paso 8 — Modo previa estática** (`p13-modo-previa`)
- Alcance: switcher de rol (entrar como cualquiera desde fixtures, sin registro) + (opcional) showcase
  prerenderizado de `/plataforma`. Los perfiles extra de p10 quedan **alcanzables recién acá**.
- Entregable: previa navegable/publicable con datos falsos.
- 📝 Instrucciones (usuario): _(a completar)_

## 5. Warnings / arrastres vivos

| ID | Origen | Item |
|---|---|---|
| W-NG8107 | p9 | Warning cosmético de template en `comments.store.spec.ts` (`?.` sobre no-nullable). |
| W-seq | p9 | `MockCommentsGateway.seq` estático/global → sufijos de id sensibles al orden de la suite (mitigado con regex). |
| W-propose | proceso | El sub-agente `sdd-propose` reportó éxito pero **no persistió** (p10): reescribir inline y **verificar artefactos en disco** tras cada fase. |
| W-verify | proceso | En p9 el `verify-report.md` no quedó en disco (gap híbrido): verificar persistencia. |

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

- Cambios: `sdd/p8-warnings-closure/summary`, `sdd/p9-comentarios/summary`, `sdd/p10-fixtures/summary`, `sdd/p11-home-por-rol/summary`.
- Fases p11: `explore` (#944), `proposal` (#946), `spec` (#947), `design` (#948), `tasks` (#949), `apply-progress` (#950), `verify-report` (#952), `archive-report` (#953).
- Protocolo SDD: `sdd-init/{project}` (#783), `skill-registry` (#785).
- Lección: `openspec/archive-must-stage-artifacts`.
