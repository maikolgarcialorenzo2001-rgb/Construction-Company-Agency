import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SectionHeadingComponent } from '../../components/section-heading/section-heading.component';
import {
  previewViewModelFor,
  resolvePreviewRole,
  roleLabel as previewRoleLabel
} from '../../core/platform/preview/preview-fixtures';
import { PreviewRoleSwitcherComponent } from './preview-role-switcher.component';

/**
 * The public, prerenderable preview at `/previa` (design D4: R1 de-risk).
 *
 * It renders SYNCHRONOUSLY from the pure fixture selector — no store, no `await`, no
 * `PendingTasks` — so the build emits a non-empty, hydration-stable HTML snapshot
 * instead of an empty shell. The `role` input is bound from the `:role` route segment
 * (WU2) so per-role HTML also works with JavaScript disabled; an unknown segment
 * falls back to the default view.
 *
 * The page is anonymous and NOINDEX: it renders fixture data only, adds no guard and
 * writes nothing. The client-only `PreviewRoleSwitcherComponent` provides the demo-login
 * affordance and the plain anchors to the prerendered role pages.
 */
@Component({
  selector: 'app-previa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent, PreviewRoleSwitcherComponent],
  templateUrl: './previa.page.html'
})
export class PreviaPage {
  /** The `:role` route segment; `undefined` on the bare `/previa` default view. */
  readonly role = input<string>();

  /** The synchronous fixture snapshot for the resolved role (unknown → default). */
  protected readonly vm = computed(() => previewViewModelFor(resolvePreviewRole(this.role())));

  /** es-AR intro copy as data, so a content edit never touches the markup. */
  protected readonly heading = {
    title: 'Así se ve la plataforma, con datos de ejemplo',
    lead: 'Recorrido público de la herramienta: novedades de obra, búsquedas laborales abiertas y perfiles de demostración. No hace falta registrarse y ningún dato es real.'
  } as const;

  /** es-AR directory role label (shared with the client switcher). */
  protected readonly roleLabel = previewRoleLabel;
}
