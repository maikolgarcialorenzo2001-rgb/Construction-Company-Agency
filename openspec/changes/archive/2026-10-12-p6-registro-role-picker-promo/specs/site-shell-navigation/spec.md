# Delta for site-shell-navigation

## MODIFIED Requirements

### Requirement: 3. [B] Header navigation, phone reachability and promo strip

The header MUST render a link to every marketing top-level route and one phone action whose `tel:` target comes from the NAP single source (`content-model`). The header MUST expose a **single** platform entry point linking to `/plataforma` (exactly one `a[href="/plataforma"]`). The header MUST also render a **static promo strip inside the header landmark**, advertising the trial→paid offer (7 días de uso gratis, después planes de pago) with a CTA linking to `/plataforma/registro`. The strip MUST NOT be dismissible and MUST NOT contain any images.

(Previously: the header exposed marketing links, a phone action and the platform entry; it carried no promo strip.)

#### Scenario: Header exposes phone, marketing sections and one platform entry

- GIVEN the header renders
- WHEN it is inspected
- THEN a `tel:` action matching the NAP phone is present
- AND links exist for each marketing top-level route
- AND exactly one link targets `/plataforma`

#### Scenario: Promo strip renders inside the header with a registration CTA

- GIVEN the marketing header renders
- WHEN it is inspected
- THEN a promo strip sits inside the header landmark
- AND it shows the trial→paid copy
- AND its CTA links to `/plataforma/registro`

#### Scenario: Promo strip is static, non-dismissible and image-free

- GIVEN the promo strip renders
- WHEN it is inspected
- THEN it offers no dismiss control
- AND it contains no images

#### Scenario: Platform chrome owns the platform nav

- GIVEN the user is on `/plataforma`
- WHEN the platform chrome renders
- THEN the platform header provides platform navigation independently of the marketing nav
- AND the marketing promo strip is absent
