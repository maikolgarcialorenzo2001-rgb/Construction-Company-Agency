# platform-admin Specification

## Purpose

Admin-only area at `/plataforma/admin`: role gating, a read-only users/roles directory, and demo-only local configuration. No backend, no contract change.

## Requirements

### Requirement: Admin-only access gating

Access to `/plataforma/admin` MUST be gated to the `admin` role. An authenticated non-`admin` session MUST be redirected to `/plataforma/inicio`; an anonymous session MUST be redirected to `/plataforma/login`.

#### Scenario: Admin reaches the area

- GIVEN an authenticated `admin` session
- WHEN `/plataforma/admin` is navigated to
- THEN the admin area renders

#### Scenario: Non-admin is redirected home

- GIVEN an authenticated `worker` or `company` session
- WHEN `/plataforma/admin` is navigated to
- THEN navigation redirects to `/plataforma/inicio`

#### Scenario: Anonymous is redirected to login

- GIVEN no active session
- WHEN `/plataforma/admin` is navigated to
- THEN navigation redirects to `/plataforma/login`

### Requirement: Users and roles directory

The admin area MUST render a read-only directory of the demo accounts, one row per account showing `userId`, `email` and `role`. The directory MUST NOT render any password value. It MUST offer a role filter and MUST show per-role counts. The directory MUST expose idle/loading/ready/empty states and show an empty state when the filter matches no account.

#### Scenario: Directory lists all demo accounts

- GIVEN the admin area renders
- WHEN the directory is ready
- THEN one row per demo account is listed
- AND each row shows `userId`, `email` and `role`

#### Scenario: Password is never rendered

- GIVEN the directory data
- WHEN any row renders
- THEN no account password value appears

#### Scenario: Role filter narrows the list

- GIVEN the directory lists multiple roles
- WHEN the `company` filter is applied
- THEN only `company` rows are listed
- AND each per-role count reflects the filtered totals

#### Scenario: Empty filter result

- GIVEN a role filter that matches no account
- WHEN the directory renders
- THEN an empty state is shown

### Requirement: Demo configuration toggles

The admin area MUST expose exactly two configuration toggles. Each toggle MUST be labelled as demo-only (no backend persistence) and MUST persist its state to `localStorage`, surviving a reload.

#### Scenario: Toggle persists across reload

- GIVEN the admin area renders
- WHEN a configuration toggle is changed
- THEN the new state is persisted to `localStorage`
- AND it is still applied after a reload

#### Scenario: Configuration is labelled demo

- GIVEN the configuration panel renders
- WHEN it is inspected
- THEN both toggles are present
- AND each is visibly marked as demo-only
