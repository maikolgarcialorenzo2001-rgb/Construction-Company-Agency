import { Injectable, signal } from '@angular/core';

/**
 * Consent Mode v2 stub (design D4). Both signals default to DENIED so nothing is
 * collected before the visitor grants it; a banner can later drive `grant()`.
 *
 * The tag is never loaded pre-consent, so analytics registers its callbacks here and
 * they sit queued until consent arrives: work that must not happen before the grant
 * runs exactly once, when `grant()` flips the state.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  /** GA4 `analytics_storage`. */
  readonly analyticsGranted = signal(false);
  /** GA4 `ad_personalization`. */
  readonly adPersonalisationGranted = signal(false);

  private readonly queue: (() => void)[] = [];

  /** True only when every consent signal has been granted. */
  granted(): boolean {
    return this.analyticsGranted() && this.adPersonalisationGranted();
  }

  /**
   * Runs `callback` now when consent is already granted; queues it otherwise.
   * Queued callbacks are flushed once by `grant()`.
   */
  register(callback: () => void): void {
    if (this.granted()) {
      callback();
      return;
    }
    this.queue.push(callback);
  }

  /**
   * Grants every consent signal and flushes the queue exactly once: the queue is taken
   * before it is run, and re-calling `grant()` is a no-op, so a callback can never fire
   * twice.
   */
  grant(): void {
    if (this.granted()) {
      return;
    }

    this.analyticsGranted.set(true);
    this.adPersonalisationGranted.set(true);

    const pending = this.queue.splice(0, this.queue.length);
    for (const callback of pending) {
      callback();
    }
  }
}
