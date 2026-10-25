import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { PostView } from '../../core/platform/domain';
import { postKindLabel } from '../../core/platform/labels/post-kind-labels';
import { roleLabel } from '../../core/platform/labels/profile-labels';

/**
 * The "Publicaciones" section of the marketing home (p17 slice 3): ONE text
 * teaser per publication kind, already selected by `mostRecentByKind`.
 *
 * Presentational and text-only on purpose: every teaser shows the kind badge,
 * the author name and role, the post text and a link to the author's public
 * profile — and NO media, so the `/` image budget never moves.
 *
 * The section owns its own `h2 id` and points `aria-labelledby` at it: the
 * shared `SectionHeadingComponent` exposes no `id`, and a dangling
 * `aria-labelledby` would fail the axe `region`/name rules.
 */
@Component({
  selector: 'app-home-publications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './home-publications.component.html'
})
export class HomePublicationsComponent {
  /** The teasers to render, one per publication kind, newest-first. */
  readonly publications = input.required<readonly PostView[]>();

  /** The es-AR kind badge, shared with the public profile grid. */
  protected readonly postKindLabel = postKindLabel;

  /** The es-AR author role label ("Trabajador" / "Empresa"). */
  protected readonly roleLabel = roleLabel;
}
