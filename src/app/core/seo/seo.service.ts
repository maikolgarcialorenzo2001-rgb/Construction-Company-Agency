import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, NavigationStart, Router } from '@angular/router';

import { site } from '../../../content/site';
import { ENVIRONMENT } from '../../environments/environment.token';
import { buildJsonLd } from './json-ld';

/**
 * Per-route SEO payload carried in the route `data` under the `seo` key.
 * `indexable` drives robots; `title`/`description` are the es-AR copy for the head.
 */
export interface SeoRouteData {
  readonly indexable?: boolean;
  readonly title?: string;
  readonly description?: string;
}

/** Caller-supplied values that win over the route `data` for the current route. */
export interface SeoOverride {
  readonly title?: string;
  readonly description?: string;
}

const JSON_LD_SELECTOR = 'script[type="application/ld+json"]';

/**
 * Owns the document head: title, meta description, Open Graph tags, canonical link,
 * robots and the single JSON-LD script. Every value is rewritten in place — the script
 * node is reused across navigations so exactly one ships in `<head>`, ever.
 *
 * It reads the activated route's `data.seo` on each `NavigationEnd`, so the head always
 * describes the route that actually rendered. All DOM access goes through the injected
 * `DOCUMENT`, never the `document` global.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly environment = inject(ENVIRONMENT);

  private started = false;
  private overrides: SeoOverride = {};

  /**
   * Subscribes to the router once. Safe to call again (the app initializer and tests
   * may both call it): the second call is a no-op instead of a second subscription.
   */
  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Overrides belong to the route being left; a page may set a new one while its
        // component initialises, which happens AFTER this point of the navigation.
        this.overrides = {};
      } else if (event instanceof NavigationEnd) {
        this.apply();
      }
    });
  }

  /** Sets title/description for the current route, taking precedence over route data. */
  override(partial: SeoOverride): void {
    this.overrides = { ...this.overrides, ...partial };
    this.apply();
  }

  /** Applies the route SEO payload (merged with pending overrides) to the document. */
  private apply(): void {
    const route = this.currentRouteSeo();
    if (!route) {
      return;
    }

    const routeTitle = route.title?.trim() ? route.title : site.nap.name;
    const routeDescription = route.description?.trim() ? route.description : site.story;
    const title = this.overrides.title ?? routeTitle;
    const description = this.overrides.description ?? routeDescription;

    this.setTitle(title);
    this.setMeta('name', 'description', description);
    this.setMeta('property', 'og:title', title);
    this.setMeta('property', 'og:description', description);
    this.setMeta('name', 'robots', route.indexable === false ? 'noindex,nofollow' : 'index,follow');
    this.setMeta('property', 'og:type', 'website');
    this.setMeta('property', 'og:image', site.ogImage.src);
    this.setMeta('name', 'twitter:card', 'summary_large_image');

    const url = this.canonicalUrl();
    this.setMeta('property', 'og:url', url);
    this.setLink('canonical', url);
    this.writeJsonLd(url);
  }

  /** Deepest activated route carrying `data.seo`; `undefined` before the first navigation. */
  private currentRouteSeo(): SeoRouteData | undefined {
    let node: ActivatedRouteSnapshot | null | undefined =
      this.router.routerState.snapshot.root;
    let found: SeoRouteData | undefined;

    while (node) {
      const seo = node.data['seo'] as SeoRouteData | undefined;
      if (seo) {
        found = seo;
      }
      node = node.firstChild;
    }

    return found;
  }

  private canonicalUrl(): string {
    const origin = this.environment.siteUrl?.trim() || this.document.location.origin;
    return new URL(this.router.url, origin).href;
  }

  private setTitle(title: string): void {
    const head = this.document.head;
    let element = head.querySelector('title');
    if (!element) {
      element = this.document.createElement('title');
      head.appendChild(element);
    }
    element.textContent = title;
  }

  private setMeta(attribute: 'name' | 'property', key: string, content: string): void {
    const head = this.document.head;
    let meta = head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!meta) {
      meta = this.document.createElement('meta');
      meta.setAttribute(attribute, key);
      head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  private setLink(rel: string, href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  /** Rewrites the one JSON-LD script in place; creates it only when it is missing. */
  private writeJsonLd(url: string): void {
    const head = this.document.head;
    let script = head.querySelector<HTMLScriptElement>(JSON_LD_SELECTOR);
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      head.appendChild(script);
    }
    script.textContent = JSON.stringify(buildJsonLd(site, url));
  }
}
