# HANDOFF — Construction-Company-Agency

> Última actualización: **2026-10-25** — **`p17-home-perfil` COMPLETO**: slice 2 (perfil público + icono) y slice 3 (sección "Publicaciones" en la home) están en `main`; la slice 1 (3 publicaciones simuladas) sigue **aislada sin mergear** a propósito. Último gate local: **893/893 tests** (89 files) · build (25 rutas prerenderizadas) + lint OK · contrato y gates en zero-diff · proof de prerender OK. `main` está **mergeado localmente, SIN pushear**.
> El historial de cambios p0–p17 y sus notas quedaron en `git log -- HANDOFF.md` (este archivo se sobrescribe a propósito para no arrastrar estado viejo).

---

## CERRADO — `p17-home-perfil` (perfil público + home de publicaciones)

**Qué pidió el maintainer**: (1) la `home` —que ya es la página principal— que muestre publicaciones; (2) una página de perfil pública estilo Instagram/LinkedIn, con todo lo necesario de cada empresa o trabajador, entrar por un icono de usuario; (3) 3 publicaciones falsas sin imagen (una de cada tipo) en una **rama de simulación nueva**. Modo `auto`, artifact store `engram`, delivery `ask-on-risk` → el maintainer delegó las decisiones ⇒ se procedió con slices encadenados (`feature-branch-chain`).

### Estado por slice

| Slice | Rama | Estado | Contenido |
|---|---|---|---|
| 1 — simulación | `feature/simulacion-publicaciones` @ `529a412` | **PUSHEADA, SIN MERGEAR** (a propósito) | 3 posts demo sin imagen: `post-14` standard (worker-3), `post-15` vacancy (company-1), `post-16` job-request (worker-1). Es el "lienzo" para simular la página. |
| 2 — perfil + icono | (eliminada) | **MERGEADA a `main` @ `46648c9`** | perfil público `/plataforma/perfil/:id` + `app-user-icon-link` en ambos headers. 10 commits, +2203/−16. |
| 3 — home | `feature/p17-home-publicaciones` | **COMPLETA y mergeada a `main`** | sección "Publicaciones" en la home (3 teasers de texto, 0 media), gated por `afterNextRender`. 4 commits. |


### Commits de la slice 2 (ya en `main`)

| WU | Commit | Alcance |
|---|---|---|
| WU-2.1 | `434c259` | `ProfileView` demo-only + registry `profile-views.ts` + `formatEsDate` |
| WU-2.2a | `445c9b5` | página + bloque de identidad (avatar de iniciales, sin `<img>`) |
| WU-2.2b | `cbdbe56` | bio / contacto / stats |
| WU-2.2c | `c32541e` | grid de publicaciones + vacantes de la empresa |
| WU-2.2d | `e8a31c6` | Seguir / Editar perfil / anónimo |
| WU-2.4 | `6a9e72c` | ruta `perfil/:id` (sin guard, NOINDEX, lazy) |
| WU-2.3a | `5c8706f` | componente `app-user-icon-link` (el primer SVG del repo) |
| WU-2.3b | `658e389` | integración en el header de marketing y en el de plataforma |
| review fix 1 | `960497b` | hallazgos F1–F6 (vacantes cerradas visibles, copy "Verificada"/"Oficio", `<h1>` en loading, guard de id obsoleto, caracterización, prueba de binding) |
| review fix 2 | `36927fb` | hallazgos D1–D6 (la spec usa los providers REALES de `app.config.ts`, `label` en `post-vacancy`, tipos de rol estrechos, token de generación, "Oficios"→"Habilidades", labels a `core/platform/labels/`) |

### Decisiones que mandan (no reabrir sin el maintainer)

- **La `home` NO puede ser un feed puro**: el gate congelado `app.release-matrix.spec.ts` fija `/` → 7 imágenes, 1 prioritaria, `cta: true` y el `<app-cta-block>` como **último** nodo de `<main>`. La `home` gana la sección "Publicaciones" **después del hero y antes del CTA**.
- La sección muestra **la publicación más reciente de cada kind** (`standard`, `job-request`, `vacancy`) como teaser de texto, sin media, con link al perfil del autor.
- El perfil público es **demo-only**: `ProfileView` + registry sembrado (patrón `vacancy.registry.ts`); el contrato OpenAPI **no** se extiende. `WorkerProfile`/`CompanyProfile` intactos.
- Ruta `/plataforma/perfil/:id`: hija de `plataforma`, **sin `authGuard`**, NOINDEX, client-only. La página existente `/plataforma/perfil` (editor propio) no se toca.
- En el **marketing header** el anchor del icono se renderiza **siempre** (con o sin sesión) para que el conteo de nodos del HTML prerenderizado sea invariante → hidratación limpia. En el **platform header** (client-only) el anchor solo aparece con sesión.
- Contenido async en ruta prerenderizada ⇒ gate `afterNextRender` sobre el **componente entero** (D-4): el HTML prerenderizado de la home NO lleva la sección.

### Commits de la slice 3 (ya en `main`)

| WU | Commit | Alcance |
|---|---|---|
| WU-3.0 | `d4d869a` | `KIND_LABELS` extraídos a `src/app/core/platform/labels/post-kind-labels.ts` (`postKindLabel(kind)`), usados por el perfil y por la home |
| WU-3.1a | `67eb049` | `mostRecentByKind(views)` — proyección pura: 1 por kind, la más nueva por `createdAt`, empate por `id`, orden newest-first, kind vacío ⇒ sin entrada |
| WU-3.1b | `61d0c67` | componente `app-home-publications`: badge con `postKindLabel`, autor + rol, texto, link a `/plataforma/perfil/:id`, `<h2 id>` propio + `aria-labelledby`, link "Ver todas" a `/plataforma`, **0 `<img>`** |
| WU-3.2/3.3 | `3f42ebb` | integración en `home.page.*`: sección entre el hero y el CTA, gate `afterNextRender`, se oculta con timeline vacío, 1 `<h1>`, 7 imágenes / 1 prioritaria, caso "falta un kind" y proof de prerender en la suite |

### Artefactos SDD (engram)

`sdd/p17-home-perfil/` → `explore` #1064 · `decision-lock` #1065 (D1–D12) · `proposal` #1066 · `spec` #1070 · `design` #1074 · `tasks` #1077 · `apply-progress` #1068 (+ #1083–#1090).

**Verificación de la slice 3**: `893/893 tests` (89 files) · `bunx ng build` (25 rutas prerenderizadas) · `bunx ng lint` OK · zero-diff de `contracts/`, `contract-conformance.ts`, `app.release-matrix.spec.ts`, `app.a11y.spec.ts`, `angular.json` · proof de prerender: el `index.html` de la home **no** contiene `app-home-publications` · `contract:lint` / `contract:check` / `verify:prerender` / `verify:previa` OK.

---

## CERRADO — `p16-vacante` (Plantilla 3 — vacante de empresa)

**Qué entra**: la empresa publica una promo de 1..n vacantes propias. Payload demo-only **reference-only** (`VacancyPayload { jobIds[] }`, nunca copia campos del job) · registro determinista `postId → payload` · derivación de `kind:'vacancy'` en `toPostView` · card multi-vacante con estado `Abierta`/`Cerrada` y link "Postularse" a `/plataforma/trabajos/:id` (siempre presente, incluso cerrada) · proyección **solo** en `[postExtra]` · compositor propio de empresa con toggle **normal / "Buscar trabajadores"** (modos excluyentes), picker acotado a sus vacantes abiertas y regla compuesta (≥1 vacante Y (texto O foto)).

**Commits** (todos ya están en `main`, base `a711e5f`):

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

**Entrega**: `feature/p16-vacante` se integró a `main` por **fast-forward** (`a711e5f` → `10df9b9`) y `main` está **pusheado** a `origin/main`. Sin PR ni issue. La rama de trabajo `feature/p16-vacante` se **eliminó** (solo local; nunca estuvo en el remoto).

---

## Estado del repo

| Rama | Estado | Contenido |
|---|---|---|
| `main` | **activa, local @ HEAD (p17 completo), SIN pushear** | todo el trabajo (p0 → p17) |
| `feature/p17-home-publicaciones` | **mergeada a `main`** (misma punta) | slice 3: la sección "Publicaciones" de la home |
| `feature/simulacion-publicaciones` | **pusheada, sin mergear** @ `529a412` | los 3 posts demo sin imagen (slice 1 de p17) — **aislada a propósito** |
| `feature/p15-solicitud-empleo` | **en blanco** (`5a58d0a`, commit huérfano) | 0 archivos — lienzo limpio para simular la página |

La p15 quedó como rama huérfana a propósito: su trabajo ya estaba **dentro de `main`** (verificado con `git merge-base --is-ancestor`), así que resetearla a un árbol vacío no pierde ni un commit. La slice 1 de p17 vive en su propia rama **sin mergear**: es el sandbox para simular publicaciones falsas; mergearla es decisión del maintainer.

---

## Pendiente

- [ ] **Pushear `main`**: el merge de la slice 3 quedó **local** (sin `origin`).
- [ ] **Deuda W-3 antes de cualquier demo pública**: las fotos de contenido y fixtures apuntan a `images.example.com` → **404 en un navegador real** (jsdom no lo detecta). No se tocó: requiere assets reales.


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
