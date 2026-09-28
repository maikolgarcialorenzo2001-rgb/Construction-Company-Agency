import { Component, input } from '@angular/core';

/** Placeholder page: replaced by S6 (project detail with before/after gallery). */
@Component({
  selector: 'app-project-detail',
  template: `
    <section class="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Proyecto</h1>
      <p class="mt-4 text-ink-600">Contenido en preparación.</p>
    </section>
  `
})
export class ProjectDetail {
  /** Bound from the route by `withComponentInputBinding()`. */
  readonly slug = input<string>();
}
