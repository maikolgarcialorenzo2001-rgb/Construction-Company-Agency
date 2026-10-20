# HANDOFF — Construction-Company-Agency

> Última actualización: **2026-10-20** — `p15-solicitud-empleo` mergeado a `main` (`c903f65`) y pusheado. Gate verde: **745 tests / 77 files** · lint limpio · build con **25 rutas prerenderizadas**.
> El historial de cambios p0–p14 y sus notas quedaron en `git log -- HANDOFF.md` (este archivo se sobrescribe a propósito para no arrastrar estado viejo).

---

## Pendientes — Plantillas

**Plantilla 1 — base (estándar)** ✅ hecha en `p14-plantilla-publicacion`: autor + botón Seguir · texto opcional · fotos 1–10 · Me gusta / Reenviar / Guardar · invariante *nunca-vacía* (texto **o** imagen).

**Plantilla 2 — Solicitud de empleo (trabajador)** ✅ hecha en `p15-solicitud-empleo`: `PostKind 'job-request'` + payload demo (registry) · composer propio para `worker` (4 campos requeridos + regla texto-o-foto, structured-only rechazado) · card estructurada vía `[postExtra]` · composer por rol en el feed (worker→form, company→textarea, admin→ninguno). Specs: `openspec/specs/platform-job-request/` + delta en `platform-feed`.

**Plantilla 3 — Vacante (empresa)**
- [ ] `PostKind: 'vacancy'` + composer para `company`.
- [ ] Definir campos propios (a definir): título del puesto, rubro, ubicación, jornada, requisitos, rango salarial, forma de postularse.
- [ ] Decidir la relación con el modelo de vacante **ya existente** (`platform-jobs` + `ApplicationsStore`): ¿la publicación es un `Job` o un post con datos propios? Evitar duplicar el modelo de vacante/postulación. **Insight de p15**: el patrón ya probado es post + payload demo en registry + card por `[postExtra]`; la pregunta clave sigue siendo si vacancy debe enlazar a un `Job` real (postularse desde el post) o solo mostrar datos.
- [ ] Guardarraíles ya probados en p15: composer por rol (company ya tiene textarea → decidir si vacancy compone desde el mismo formulario o uno propio), slots, contrato READ-ONLY, strict TDD, gate a11y.
- [ ] **Deuda de diseño p15 (Debt-3)**: el admin no tiene composer — confirmar si eso se mantiene en vacancy o cambia.

## Pendientes — Reestructurar vistas
- [ ] **Vista de guardados**: el botón Guardar ya persiste por viewer, pero no existe la sección que lista las publicaciones guardadas.
- [ ] **Feed priorizado por seguidores**: el sistema de follow ya guarda las relaciones, pero `FeedStore` todavía no ordena/prioriza por follows.
- [ ] A definir: qué más entra en esta reestructuración (perfiles de autor, lista de seguidores/seguidos, layout general de `/plataforma`).

---

## Deuda registrada (no bloqueante)

- `W-1` — falta un test para la cláusula "sin contador de seguidores / sin notificaciones" de `platform-engagement`.
- `W-2` — WU2 (619 líneas) y WU3 (618) exceden el presupuesto de review de 400 líneas → requiere `size:exception` si algún día se cortan PRs.
- `W-3` — las fotos demo de las fixtures apuntan a `images.example.com`: **404 en un navegador real** (jsdom no lo detecta). Cerrar antes de una demo pública en vivo.
