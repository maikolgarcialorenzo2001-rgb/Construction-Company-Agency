import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal
} from '@angular/core';

import type { PostView } from '../../core/platform/domain';
import { hasVisibleText } from '../../core/platform/mocks/post-views';
import { PLATFORM_PREFIX } from '../../core/platform/platform-paths';
import { roleLabel } from '../../core/platform/preview/preview-fixtures';
import { EngagementStore } from '../../core/platform/store/engagement.store';

/** The template renders at most this many attachments; the rest collapse into a `+N` hint. */
const MAX_MEDIA = 10;

/** The permalink the share action copies: the feed route anchored to one post. */
const postPermalink = (postId: string): string =>
  `${location.origin}/${PLATFORM_PREFIX}#${postId}`;

/**
 * Base feed post template (design D1/D4/D6/D7): renders a denormalized `PostView`
 * authored by `authorName`/`authorRole` — never a raw `authorId` — plus the
 * `viewerId` it engages as. It injects `EngagementStore` and reads the selectors
 * directly in the bindings, so each store `.set()` repaints the zoneless view; the
 * component never calls change detection itself.
 *
 * The media grid is a plain lazy `<img>` grid clamped to `MAX_MEDIA` (bare-string
 * attachments carry no intrinsic size, so `NgOptimizedImage` is off the table); an
 * empty URL degrades to a labeled es-AR placeholder instead of a broken image.
 *
 * `[postBody]`/`[postExtra]` are the extension points for future `PostKind`s
 * (the design-sanctioned one is `[postExtra]`, which always renders), so types
 * 2/3 extend the shell without editing it (the per-post comment thread stays
 * page-side in the `li`). The standard body region itself renders only when
 * its text is non-blank (WU5): text-only and image-only posts are legitimate
 * shapes and must not leave a phantom empty block.
 */
@Component({
  selector: 'app-post-template',
  templateUrl: './post-template.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostTemplateComponent {
  readonly post = input.required<PostView>();

  /** The engaged viewer; `null` (anonymous) never writes an engagement record. */
  readonly viewerId = input<string | null>(null);

  protected readonly store = inject(EngagementStore);

  /** es-AR role label, shared with the preview directory (never the raw id). */
  protected readonly roleLabel = roleLabel;

  protected readonly mediaAlt = 'Imagen de la publicación';

  /** es-AR outcome of the last share attempt; empty until the user shares. */
  protected readonly shareFeedback = signal('');

  /** The first `MAX_MEDIA` attachments, in order. */
  protected readonly visibleAttachments = computed(() => this.post().attachments.slice(0, MAX_MEDIA));

  /** Attachments dropped by the clamp, shown as `+N` (zero hides the hint). */
  protected readonly overflowCount = computed(() =>
    Math.max(0, this.post().attachments.length - MAX_MEDIA)
  );

  /**
   * The body region renders only when the standard body has visible text
   * (WU5 — whitespace-only counts as blank): a text-less post must not leave
   * an empty paragraph or a phantom block behind.
   */
  protected readonly hasBody = computed(() => hasVisibleText(this.post().content));

  protected onFollow(): void {
    const viewerId = this.viewerId();
    if (viewerId !== null) {
      void this.store.toggleFollow(viewerId, this.post().authorId);
    }
  }

  protected onLike(): void {
    const viewerId = this.viewerId();
    if (viewerId !== null) {
      void this.store.toggleLike(viewerId, this.post().id);
    }
  }

  protected onSave(): void {
    const viewerId = this.viewerId();
    if (viewerId !== null) {
      void this.store.toggleSave(viewerId, this.post().id);
    }
  }

  /** Share stays outside the port (D8): it only copies the permalink, never records. */
  protected async onShare(): Promise<void> {
    try {
      await navigator.clipboard.writeText(postPermalink(this.post().id));
      this.shareFeedback.set('Enlace copiado');
    } catch {
      this.shareFeedback.set('No se pudo copiar el enlace');
    }
  }
}
