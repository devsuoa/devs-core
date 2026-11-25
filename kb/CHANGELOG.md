# Changelog

All notable changes to this project are recorded here from **commit messages on the `main` branch**. Entries are grouped by month (newest first). This is not a semantic versioning release log unless a future release process adopts it.

> **AI documentation notice:** This file was assembled from `git log` with automated formatting assistance and **may contain errors** (e.g. missing merges, wrong ordering). See [Documentation disclaimer](disclaimer.md).

## How to read this

- Each bullet is the **subject line** of one commit on `main`.
- **Chore** / deployment-only commits are included for a complete history; skim as needed.
- For full diffs, follow the commit link.

## November 2026

- [#0] Feature Rollback (#3): removes the feature endpoints so club members can rebuild them; feature pages go back to their pre-API code — [a48f7b2](https://github.com/devsuoa/devs-core/commit/a48f7b2) (2026-11-25)
- Proof of concept (#2): adds the Java API and moves all data access behind it — [ea65c84](https://github.com/devsuoa/devs-core/commit/ea65c84) (2026-11-19)

## October 2026

- Chore/FlywaySetup (#1): database migrations with Flyway — [298d43e](https://github.com/devsuoa/devs-core/commit/298d43e) (2026-10-26)

## September 2026

- chore: deploy loading screen (#152) — [5e40d2a](https://github.com/devsuoa/devs-core/commit/5e40d2a) (2026-09-29)
- feat: added loading screen (#151) — [422e3aa](https://github.com/devsuoa/devs-core/commit/422e3aa) (2026-09-18)

## August 2026

- feat: new execs on team page (#150) — [87876ef](https://github.com/devsuoa/devs-core/commit/87876ef) (2026-08-28)
- chore: deploy changes (#149) — [ac3aa24](https://github.com/devsuoa/devs-core/commit/ac3aa24) (2026-08-14)
- fix: improve pagination, filtering, event image cleanup (#148) — [b24b05b](https://github.com/devsuoa/devs-core/commit/b24b05b) (2026-08-14)
- feat: add smooth scrolling (#147) — [801680a](https://github.com/devsuoa/devs-core/commit/801680a) (2026-08-14)
- chore: update pnpm-lock.yaml to fix vercel build (#146) — [ea18226](https://github.com/devsuoa/devs-core/commit/ea18226) (2026-08-07)
- chore: deploy changes — [80de96c](https://github.com/devsuoa/devs-core/commit/80de96c) (2026-08-07)
- fix: event rsvp disappearing on day of event (#145) — [297c449](https://github.com/devsuoa/devs-core/commit/297c449) (2026-08-07)
- improve: Change fonts and make things look better (#142) — [b0249b5](https://github.com/devsuoa/devs-core/commit/b0249b5) (2026-08-02)
- feat: add auto linking when creating events (#143) — [fdf4f1e](https://github.com/devsuoa/devs-core/commit/fdf4f1e) (2026-08-02)
- chore: reformatting entire repo with prettier (#136) — [016c2d5](https://github.com/devsuoa/devs-core/commit/016c2d5) (2026-08-02)

## July 2026

- fix: change qr code url (#144) — [bbdce2f](https://github.com/devsuoa/devs-core/commit/bbdce2f) (2026-07-20)

## May 2026

- fix: rsvp is case insensitive (#141) — [42f072a](https://github.com/devsuoa/devs-core/commit/42f072a) (2026-05-15)
- fix: past events order reversed to descending dates (#140) — [c013193](https://github.com/devsuoa/devs-core/commit/c013193) (2026-05-14)
- feat: add rsvp for non members in rsvp dialog (#139) — [f0b4947](https://github.com/devsuoa/devs-core/commit/f0b4947) (2026-05-11)
- fix: filtering on the events page and allow for inactive events (#138) — [d1e6398](https://github.com/devsuoa/devs-core/commit/d1e6398) (2026-05-11)
- fix: added active/inactive events (#130) — [37ecac3](https://github.com/devsuoa/devs-core/commit/37ecac3) (2026-05-08)

## April 2026

- chore: reroute qr code for imc tech race (#137) — [11a82b2](https://github.com/devsuoa/devs-core/commit/11a82b2) (2026-04-21)
- feat: visual indicator of completed task and current day (#128) — [4857c84](https://github.com/devsuoa/devs-core/commit/4857c84) (2026-04-17)
- fix: prevent duplicated submissions by disabling submit button (#133) — [798d87d](https://github.com/devsuoa/devs-core/commit/798d87d) (2026-04-17)
- chore: updated audit row limit (#134) — [a7ed1b2](https://github.com/devsuoa/devs-core/commit/a7ed1b2) (2026-04-17)
- fix: prevent bank transfers submission from non members (#129) — [8bede84](https://github.com/devsuoa/devs-core/commit/8bede84) (2026-04-16)
- chore: deploy drag and drop for links (#127) — [314de3b](https://github.com/devsuoa/devs-core/commit/314de3b) (2026-04-14)
- feat: implemented drag and drop to manage links (#126) — [f755975](https://github.com/devsuoa/devs-core/commit/f755975) (2026-04-14)
- feat: added graphs and undo to audit log (#125) — [ac20269](https://github.com/devsuoa/devs-core/commit/ac20269) (2026-04-13)
- chore: deploy rsvp fix (#124) — [253f8b0](https://github.com/devsuoa/devs-core/commit/253f8b0) (2026-04-11)
- fix: adjust for moible resize on rsvp (#123) — [5d41ac2](https://github.com/devsuoa/devs-core/commit/5d41ac2) (2026-04-11)
- fix: prevent unexpected rsvp close on mobile (#122) — [aaf7d5c](https://github.com/devsuoa/devs-core/commit/aaf7d5c) (2026-04-10)
- fix: prevent unwanted rsvp close (#121) — [d530246](https://github.com/devsuoa/devs-core/commit/d530246) (2026-04-10)
- fix: stop ghost clicks from closing rsvp dialog (#120) — [e37a5e6](https://github.com/devsuoa/devs-core/commit/e37a5e6) (2026-04-10)
- fix: group attendee count is accurate (#119) — [73d6484](https://github.com/devsuoa/devs-core/commit/73d6484) (2026-04-10)
- fix: add payment disclaimers (#118) — [9463d6f](https://github.com/devsuoa/devs-core/commit/9463d6f) (2026-04-10)
- feat: introduce payments (#116) — [8cc7c31](https://github.com/devsuoa/devs-core/commit/8cc7c31) (2026-04-10)
- feat: introduce event to do lists (#115) — [c9e48d1](https://github.com/devsuoa/devs-core/commit/c9e48d1) (2026-04-06)
- feat: posthog user failure tracking (#114) — [b47614f](https://github.com/devsuoa/devs-core/commit/b47614f) (2026-04-06)

## March 2026

- feat: introduce kartik glazer page (#113) — [e8309af](https://github.com/devsuoa/devs-core/commit/e8309af) (2026-03-27)
- feat: autofill on events rsvp to join redirect (#112) — [9defbfd](https://github.com/devsuoa/devs-core/commit/9defbfd) (2026-03-27)
- fix: improve rsvp grammar discrepencies (#111) — [301dba4](https://github.com/devsuoa/devs-core/commit/301dba4) (2026-03-27)
- feat: extend rsvp capability (#109) — [e699834](https://github.com/Gh05stt/devsuoa/commit/e699834) (2026-03-26)
- fix: event card register button and desc adujustments (#104) — [ef4366f](https://github.com/Gh05stt/devsuoa/commit/ef4366f) (2026-03-25)
- fix: adjust sponsor card font (#108) — [5a73e7f](https://github.com/Gh05stt/devsuoa/commit/5a73e7f) (2026-03-25)
- chore: deploy audit log (#107) — [b239c8b](https://github.com/Gh05stt/devsuoa/commit/b239c8b) (2026-03-25)
- feat: reintroduce audit log (#106) — [5f6d5c7](https://github.com/Gh05stt/devsuoa/commit/5f6d5c7) (2026-03-25)
- fix: reinstate sap logo (#105) — [912c72a](https://github.com/Gh05stt/devsuoa/commit/912c72a) (2026-03-25)
- feat: presidents audit log (#100) — [018a0e1](https://github.com/Gh05stt/devsuoa/commit/018a0e1) (2026-03-18)
- feat: drag and drop for photos in admin dashboard (#98) — [48e9f4f](https://github.com/Gh05stt/devsuoa/commit/48e9f4f) (2026-03-11)
- feat: add collapse function to event attendees dashboard (#97) — [0f2af73](https://github.com/Gh05stt/devsuoa/commit/0f2af73) (2026-03-11)
- chore: deploy eroad sponsor (#96) — [98c1911](https://github.com/Gh05stt/devsuoa/commit/98c1911) (2026-03-10)
- feat: added eroad sponsor (#93) — [dad10cd](https://github.com/Gh05stt/devsuoa/commit/dad10cd) (2026-03-10)
- chore: sign deployment (#92) — [134ba40](https://github.com/Gh05stt/devsuoa/commit/134ba40) (2026-03-05)
- fix: added onBlur to fix form drop down (#87) — [08a42a7](https://github.com/Gh05stt/devsuoa/commit/08a42a7) (2026-03-05)
- chore: sign commit for deployment (#91) — [5c67c00](https://github.com/Gh05stt/devsuoa/commit/5c67c00) (2026-03-05)
- fix: workaround rls policy for event rsvp (#90) — [adf908f](https://github.com/Gh05stt/devsuoa/commit/adf908f) (2026-03-05)
- feat: introduce eager loading (#86) — [1dcdf70](https://github.com/Gh05stt/devsuoa/commit/1dcdf70) (2026-03-03)
- fix: admin member directory (#85) — [1b044f1](https://github.com/Gh05stt/devsuoa/commit/1b044f1) (2026-03-03)
- fix: event card not scaling correctly (#84) — [e9041e7](https://github.com/Gh05stt/devsuoa/commit/e9041e7) (2026-03-03)
- feat: second degree / major removal (#83) — [4626d7f](https://github.com/Gh05stt/devsuoa/commit/4626d7f) (2026-03-03)
- fix: update qr code deployment (#82) — [f89c95b](https://github.com/Gh05stt/devsuoa/commit/f89c95b) (2026-03-02)
- fix: gender selection (#81) — [11478a6](https://github.com/Gh05stt/devsuoa/commit/11478a6) (2026-03-02)
- fix: improve mobile touch sensitivity (#80) — [2083fd5](https://github.com/Gh05stt/devsuoa/commit/2083fd5) (2026-03-01)
- fix: stop event card text overflow (#79) — [6a1ef19](https://github.com/Gh05stt/devsuoa/commit/6a1ef19) (2026-03-01)
- fix: mobile styling inconsistencies (#77) — [7fe86a0](https://github.com/Gh05stt/devsuoa/commit/7fe86a0) (2026-03-01)

## February 2026

- fix: redirect qr code to join (#76) — [4824fe3](https://github.com/Gh05stt/devsuoa/commit/4824fe3) (2026-02-26)
- feat: add imc to sponsor tape (#75) — [aa1c181](https://github.com/Gh05stt/devsuoa/commit/aa1c181) (2026-02-25)
- fix: landing page routing (#74) — [9fc1aa3](https://github.com/Gh05stt/devsuoa/commit/9fc1aa3) (2026-02-25)
- fix: mobile styling issues (#73) — [063a20e](https://github.com/Gh05stt/devsuoa/commit/063a20e) (2026-02-25)
- improve: overall website styling (#72) — [35a485b](https://github.com/Gh05stt/devsuoa/commit/35a485b) (2026-02-24)
- feat: create admin back button (#68) — [7543977](https://github.com/Gh05stt/devsuoa/commit/7543977) (2026-02-22)
- fix: password recovery deployment (#67) — [94fadb4](https://github.com/Gh05stt/devsuoa/commit/94fadb4) (2026-02-21)
- feat: add reset admin password feature (#66) — [82848b7](https://github.com/Gh05stt/devsuoa/commit/82848b7) (2026-02-21)
- improve: mobile signup page (#65) — [6852c90](https://github.com/Gh05stt/devsuoa/commit/6852c90) (2026-02-16)
- feat: create contact page (#64) — [1a6baa7](https://github.com/Gh05stt/devsuoa/commit/1a6baa7) (2026-02-16)
- feat: create admin mobile ui (#63) — [a622893](https://github.com/Gh05stt/devsuoa/commit/a622893) (2026-02-16)
- feat: add cookie disclaimer to all pages — [0b61ec7](https://github.com/Gh05stt/devsuoa/commit/0b61ec7) (2026-02-15)
- fix: cookie disclaimer feature flag (#61) — [f30fbd9](https://github.com/Gh05stt/devsuoa/commit/f30fbd9) (2026-02-15)
- feat: create cookie disclaimer (#51) — [6668a34](https://github.com/Gh05stt/devsuoa/commit/6668a34) (2026-02-15)
- fix: update feature flags (#60) — [5cb42e5](https://github.com/Gh05stt/devsuoa/commit/5cb42e5) (2026-02-15)
- feat: create sponsors page (#56) — [ce84721](https://github.com/Gh05stt/devsuoa/commit/ce84721) (2026-02-15)
- feat: mobile about page layout (#59) — [ac5bf78](https://github.com/Gh05stt/devsuoa/commit/ac5bf78) (2026-02-15)
- fix: update lockfile (#58) — [726fdc8](https://github.com/Gh05stt/devsuoa/commit/726fdc8) (2026-02-03)
- feat: add events page and pagination — [5804a7c](https://github.com/Gh05stt/devsuoa/commit/5804a7c) (2026-02-03)

## January 2026

- feat: create mobile version for home page (#57) — [4ad2452](https://github.com/Gh05stt/devsuoa/commit/4ad2452) (2026-01-23)
- fix: adjust task card fonts (#54) — [98906d8](https://github.com/Gh05stt/devsuoa/commit/98906d8) (2026-01-14)
- fix: consistent admin dashboard links visibility (#53) — [a5ccf6e](https://github.com/Gh05stt/devsuoa/commit/a5ccf6e) (2026-01-14)
- fix: adjust name alignment on teams page (#50) — [7f410e1](https://github.com/Gh05stt/devsuoa/commit/7f410e1) (2026-01-09)
- feat: create mobile team page (#49) — [11176ce](https://github.com/Gh05stt/devsuoa/commit/11176ce) (2026-01-09)
- fix: refactor and adjust mobile footer (#48) — [9318ddc](https://github.com/Gh05stt/devsuoa/commit/9318ddc) (2026-01-09)
- feat: create landing page (#39) — [95aa029](https://github.com/Gh05stt/devsuoa/commit/95aa029) (2026-01-08)
- feat: create dynamic qr code (#47) — [c86bbe2](https://github.com/Gh05stt/devsuoa/commit/c86bbe2) (2026-01-02)
- fix: hide signup page — [d2425b2](https://github.com/Gh05stt/devsuoa/commit/d2425b2) (2026-01-01)
- feat: create sign up page (#12) — [81f1033](https://github.com/Gh05stt/devsuoa/commit/81f1033) (2026-01-01)

## December 2025

- feat: make t&c page (#46) — [ea8c2d9](https://github.com/Gh05stt/devsuoa/commit/ea8c2d9) (2025-12-26)
- feat: add mobile header (#45) — [02c7178](https://github.com/Gh05stt/devsuoa/commit/02c7178) (2025-12-26)
- feat: create event attendees dashboard (#44) — [3906085](https://github.com/Gh05stt/devsuoa/commit/3906085) (2025-12-25)
- feat: link events rsvp to db (#43) — [514da4f](https://github.com/Gh05stt/devsuoa/commit/514da4f) (2025-12-25)
- fix: adjust about page ui (#42) — [6884cc0](https://github.com/Gh05stt/devsuoa/commit/6884cc0) (2025-12-25)
- feat: create about page (#41) — [feea80b](https://github.com/Gh05stt/devsuoa/commit/feea80b) (2025-12-25)
- feat: create task tracker (#38) — [5dfaaa7](https://github.com/Gh05stt/devsuoa/commit/5dfaaa7) (2025-12-23)
- fix: make privacy policy responsive (#36) — [4847876](https://github.com/Gh05stt/devsuoa/commit/4847876) (2025-12-22)
- feat: create pb page (#35) — [09299f1](https://github.com/Gh05stt/devsuoa/commit/09299f1) (2025-12-22)
- feat: create team page (#34) — [f4a8d2e](https://github.com/Gh05stt/devsuoa/commit/f4a8d2e) (2025-12-22)
- feat: create events page (#33) — [0834f0d](https://github.com/Gh05stt/devsuoa/commit/0834f0d) (2025-12-21)
- feat: create home page (#31) — [cece4f4](https://github.com/Gh05stt/devsuoa/commit/cece4f4) (2025-12-21)
- feat: implement footer (#32) — [6a4d5d5](https://github.com/Gh05stt/devsuoa/commit/6a4d5d5) (2025-12-21)
- feat: create footer component (#24) — [6c5aabd](https://github.com/Gh05stt/devsuoa/commit/6c5aabd) (2025-12-21)
- improve: fix feature flag routing (#30) — [2e65311](https://github.com/Gh05stt/devsuoa/commit/2e65311) (2025-12-21)
- improve: implement feature flags (#29) — [d103595](https://github.com/Gh05stt/devsuoa/commit/d103595) (2025-12-21)
- improve: use native react routing (#28) — [5102779](https://github.com/Gh05stt/devsuoa/commit/5102779) (2025-12-20)
- feat: create privacy policy (#27) — [0b8232e](https://github.com/Gh05stt/devsuoa/commit/0b8232e) (2025-12-20)
- fix: remove header from links page (#26) — [34d2199](https://github.com/Gh05stt/devsuoa/commit/34d2199) (2025-12-20)
- fix: address overscroll behaviour (#25) — [5f2cb27](https://github.com/Gh05stt/devsuoa/commit/5f2cb27) (2025-12-20)
- feat: create links page (#22) — [fd9cbf3](https://github.com/Gh05stt/devsuoa/commit/fd9cbf3) (2025-12-20)
- improve: add new assets (#23) — [b7f5673](https://github.com/Gh05stt/devsuoa/commit/b7f5673) (2025-12-20)
- improve: updated tailwind to v4 spec (#19) — [ab353ac](https://github.com/Gh05stt/devsuoa/commit/ab353ac) (2025-12-20)
- fix: block unauthorised access to marketing portal (#18) — [27bd509](https://github.com/Gh05stt/devsuoa/commit/27bd509) (2025-12-20)
- feat: implement analytics (#17) — [7ba1348](https://github.com/Gh05stt/devsuoa/commit/7ba1348) (2025-12-20)
- improve: refactor admin routing (#16) — [d06d583](https://github.com/Gh05stt/devsuoa/commit/d06d583) (2025-12-20)
- feat: create admin dashboard (#15) — [c2eb9ea](https://github.com/Gh05stt/devsuoa/commit/c2eb9ea) (2025-12-20)
- chore: fix page routing (#14) — [afab4c4](https://github.com/Gh05stt/devsuoa/commit/afab4c4) (2025-12-19)
- feat: add authentication for execs (#13) — [9c6cb92](https://github.com/Gh05stt/devsuoa/commit/9c6cb92) (2025-12-19)
- chore: fix deployment linting issue (#11) — [96fb43d](https://github.com/Gh05stt/devsuoa/commit/96fb43d) (2025-12-18)
- docs: add initial documentation (#10) — [e0909b2](https://github.com/Gh05stt/devsuoa/commit/e0909b2) (2025-12-18)
- feat: add page title component (#9) — [44784f8](https://github.com/Gh05stt/devsuoa/commit/44784f8) (2025-12-18)
- fix: removed header route from prod — [6cd634e](https://github.com/Gh05stt/devsuoa/commit/6cd634e) (2025-12-12)
- Merge branch 'main' into hazik/DV-21-create-header — [530e2ca](https://github.com/Gh05stt/devsuoa/commit/530e2ca) (2025-12-12)
- feat: removed header route for prod — [0a36038](https://github.com/Gh05stt/devsuoa/commit/0a36038) (2025-12-12)
- feat: add header component (#5) — [3b560e9](https://github.com/Gh05stt/devsuoa/commit/3b560e9) (2025-12-12)
- feat: added react routing, for better dev — [789abfa](https://github.com/Gh05stt/devsuoa/commit/789abfa) (2025-12-11)
- fix: made some changes to spacing, font and layout for header — [c056288](https://github.com/Gh05stt/devsuoa/commit/c056288) (2025-12-11)
- fix: added new link-white utility class, which allows for easy use of the styling we need for the header and footer — [29f677e](https://github.com/Gh05stt/devsuoa/commit/29f677e) (2025-12-11)
- feat: added temp join now button and added new links — [74327d4](https://github.com/Gh05stt/devsuoa/commit/74327d4) (2025-12-11)
- feat: created a new header component, temporarily added it to app, will add routing later — [b4cb010](https://github.com/Gh05stt/devsuoa/commit/b4cb010) (2025-12-10)
- feat: add mobile page — [597afd7](https://github.com/Gh05stt/devsuoa/commit/597afd7) (2025-12-02)
- add mobile page — [b471e93](https://github.com/Gh05stt/devsuoa/commit/b471e93) (2025-12-02)
- fix: fix build command — [7b0b684](https://github.com/Gh05stt/devsuoa/commit/7b0b684) (2025-12-02)
- fix npm run build command — [f0d9f94](https://github.com/Gh05stt/devsuoa/commit/f0d9f94) (2025-12-02)
- fix: images not found — [c5e23b0](https://github.com/Gh05stt/devsuoa/commit/c5e23b0) (2025-12-02)
- fix deployment issues where images were not found and adjust spacing for social media — [99fc753](https://github.com/Gh05stt/devsuoa/commit/99fc753) (2025-12-02)
- feat: add construction page — [98c03ba](https://github.com/Gh05stt/devsuoa/commit/98c03ba) (2025-12-02)
- add construction page — [eafc2bb](https://github.com/Gh05stt/devsuoa/commit/eafc2bb) (2025-12-02)

## November 2025

- redesign — [8b73486](https://github.com/Gh05stt/devsuoa/commit/8b73486) (2025-11-30)

## October 2025

- restart — [18d2223](https://github.com/Gh05stt/devsuoa/commit/18d2223) (2025-10-12)
- add about, sponsors and footer — [1046b4b](https://github.com/Gh05stt/devsuoa/commit/1046b4b) (2025-10-04)
- initial commit — [5f6de78](https://github.com/Gh05stt/devsuoa/commit/5f6de78) (2025-10-03)
- Initial commit — [f63c534](https://github.com/Gh05stt/devsuoa/commit/f63c534) (2025-10-03)

---

_Source: `git log main --pretty=format:%h|%ad|%s --date=short` (newest first). Snapshot tip: **e699834** on `main` (2026-03-26 NZDT). Regenerate this file after significant merges if you want the KB to stay current._
