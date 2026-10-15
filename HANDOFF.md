# HANDOFF — Construction-Company-Agency

> Última actualización: **2026-10-15** — `p14-plantilla-publicacion` mergeado a `main` (`f70ad55`) y pusheado. Gate verde: **716 tests / 74 files** · lint limpio · build con **25 rutas prerenderizadas**.
> El historial de cambios p0–p14 y sus notas quedaron en `git log -- HANDOFF.md` (este archivo se sobrescribe a propósito para no arrastrar estado viejo).

---

## Pendientes — Plantillas

**Plantilla 1 — base (estándar)** ✅ hecha en `p14-plantilla-publicacion`: autor + botón Seguir · texto opcional · fotos 1–10 · Me gusta / Reenviar / Guardar · invariante *nunca-vacía* (texto **o** imagen).

**Plantilla 2 — Solicitud de empleo (trabajador)**
- [ ] `PostKind: 'job-request'` + composer propio: hoy el composer del feed está **abierto solo a `company`** → hay que habilitarlo para `worker`.
- [ ] Definir campos propios (a definir): puesto/rubro buscado, zona, disponibilidad, experiencia, modalidad.
- [ ] Extender la base con los slots `[postBody]` / `[postExtra]` — **proyectar en `[postExtra]`**, nunca en `[postBody]`, si el post puede venir sin texto (S-6 del verify de p14).
- [ ] ¿Requiere schema nuevo en `contracts/openapi.yaml`? (hoy READ-ONLY → sería un cambio de contrato aparte).

**Plantilla 3 — Vacante (empresa)**
- [ ] `PostKind: 'vacancy'` + composer para `company`.
- [ ] Definir campos propios (a definir): título del puesto, rubro, ubicación, jornada, requisitos, rango salarial, forma de postularse.
- [ ] Decidir la relación con el modelo de vacante **ya existente** (`platform-jobs` + `ApplicationsStore`): ¿la publicación es un `Job` o un post con datos propios? Evitar duplicar el modelo de vacante/postulación.
- [ ] Mismos guardarraíles: slots de extensión, contrato READ-ONLY, strict TDD, gate a11y sobre `/plataforma`.

## Pendientes — Reestructurar vistas
- [ ] **Vista de guardados**: el botón Guardar ya persiste por viewer, pero no existe la sección que lista las publicaciones guardadas.
- [ ] **Feed priorizado por seguidores**: el sistema de follow ya guarda las relaciones, pero `FeedStore` todavía no ordena/prioriza por follows.
- [ ] A definir: qué más entra en esta reestructuración (perfiles de autor, lista de seguidores/seguidos, layout general de `/plataforma`).

---

## Deuda registrada (no bloqueante)

- `W-1` — falta un test para la cláusula "sin contador de seguidores / sin notificaciones" de `platform-engagement`.
- `W-2` — WU2 (619 líneas) y WU3 (618) exceden el presupuesto de review de 400 líneas → requiere `size:exception` si algún día se cortan PRs.
- `W-3` — las fotos demo de las fixtures apuntan a `images.example.com`: **404 en un navegador real** (jsdom no lo detecta). Cerrar antes de una demo pública en vivo.
