import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { JobRequestPayload } from '../../core/platform/domain';

/**
 * Structured "Solicitud de empleo" card (design D8, p15 WU2): a read-only,
 * data-in component that renders the demo-only `JobRequestPayload`. It carries
 * no feed logic — `feed.page` projects it into the post's always-present
 * `[postExtra]` slot when `kind === 'job-request'`, so the base template and
 * `isRenderablePostView` stay untouched. The fields are a `<dl>` (label/value
 * pairs) under a named `group`, so assistive tech announces the card structure;
 * the free text of the post remains the `[postBody]` slot.
 */
@Component({
  selector: 'app-post-job-request',
  templateUrl: './post-job-request.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostJobRequestComponent {
  readonly payload = input.required<JobRequestPayload>();
}
