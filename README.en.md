<p align="center"><img src="docs/assets/logo.jpeg" alt="SolaniSense" width="360"></p>

גרסה בעברית: [README.md](README.md)

# SolaniSense

A PWA in Hebrew that detects greening on potatoes, for color-blind users. You point the phone camera at the potato, and the app marks the green areas and says what to do: peel generously or do not eat. The analysis runs on the device only, and the app's code sends no information to the network.

The app's interface is in Hebrew only. The interface texts quoted below are English translations of the Hebrew originals.

**Status:** phase 1, up to UI/UX. Detection, the three screens and accessibility are implemented, and they have passing tests. The visual design (task 13) has not been applied yet: the current interface is white text on a black background, without the design system. The thresholds were calibrated on synthetic images only.

**Project license:** not chosen yet. There is no `LICENSE` file in the repo.

## Why

Color-blind people do not see the greening on the skin, so they have no way to know that a potato has been exposed to light. The green itself is not the toxin: it is a warning sign of light exposure, during which solanine and chaconine also accumulate, and not a measure of their amount ([research](docs/research/2026-10-17-greening-research.md), section 1).

## What the app does

- Live scan: every 300 milliseconds a frame from the camera is checked, and the green areas are marked on the video with stripes and an outline. A dashed ellipse on the video shows the area being checked.
- Three levels: "No green detected", "Local greening", "Widespread greening". Each level is shown as text and as a shape. In the live scan, a rise to "local" or "widespread" is also spoken aloud and accompanied by vibration, and on the result screen the verdict is spoken and accompanied by vibration once, also for an uploaded image.
- Each frame sees only one side of the potato, so the scan remembers the most severe frame and shows it on the result screen, with the share of green and practical advice.
- An info screen with health guidance, each item with its source (health authorities and the scientific literature), and an animation of "how to clean".
- After the first visit it also works offline.

## What it does not do

The app never says "safe" and never shows a "solanine level". The disclaimer, as it appears on the info screen (`src/ui/content/info.ts`), translated:

> The app detects green only, not sprouts and not rot. The result is valid only for a potato that fills the frame. The thresholds are engineering values, not medically validated. Scan in natural or white light, because colored light can mislead. When no green is detected, that does not mean there is no toxin. When in doubt: do not eat.

## Screen mockups (illustrative)

The three mockups below illustrate the planned design system; they are not screenshots of the app. The current UI is still unstyled (see status above). Source: `docs/design/mockups/mockups.html`.

### Concept image

![Concept image generated with Gemini: a phone held in a kitchen, the screen shows a potato with a green area outlined in white stripes](docs/design/concept/app-concept-900.jpg)

Generated with Gemini from [the prompt](docs/design/gemini-image-prompt.md) as a mood illustration only. The on-screen texts are not the app's wording: the app never says "contains solanine", because green is a warning sign, not a toxin measurement. Full-resolution original: `docs/design/concept/app-concept.jpeg`.

| Live scan | Result | Info |
|---|---|---|
| ![Scan screen mockup: "no green detected" verdict with a check-in-circle shape, dashed ellipse guide over the video, a "Done" button](docs/design/mockups/01-scan.png) | ![Result screen mockup: "local greening" with a triangle shape, the green area outlined with white stripes, advice with sources, a "scan another" button](docs/design/mockups/02-result.png) | ![Info screen mockup: speech and vibration switches, "how to clean" illustration, an info card with its source](docs/design/mockups/03-info.png) |

## The screens

**Scan.** The main screen. On entry there is one button, "Start scan", and the camera opens only after the tap: the rear one, and if there is none, another one. At the top of the screen is the verdict, which appears only after a properly lit frame has been checked, and below it the hint "Fill the frame with the potato and rotate it slowly to all sides". "No green detected" waits for ten well-lit frames, about three seconds, because each frame sees one side. Until then only the hint appears. Green is shown at once. The video is shown in full, and the marks are drawn over it. The ellipse the analyzer checks is also drawn on the video, as a white dashed line with a black halo, already before the first frame, so it is clear what to fill with the potato. When the light is weak or colored a message appears, and the verdict freezes until the light improves. "Done" goes to the result screen. "Upload image" analyzes one image and goes straight to the result. Without camera permission the screen explains how to grant it, and leaves only the upload. On leaving the screen, on "Done" and in a hidden tab, the camera turns off.

**Result.** The most severe frame with the marks, the verdict with its shape, the share of green (only for "local" and "widespread"; for "local" it is rounded down, so that 9.9% is not shown as 10%), and the practical advice for the level, with its sources below it: "Sources: BfR, CFS Hong Kong, Oregon State". When the screen opens with a verdict, the verdict is spoken and accompanied by vibration once, according to the settings, also for an uploaded image. Every result also shows the cultivar warning: "On red or rough brown skin the green may be hidden. A bitter taste or sprouts are warning signs even without green." If no properly lit frame was checked, a neutral message is shown, "Nothing was scanned", without a verdict. If a live scan saw no green but lasted fewer than ten well-lit frames, a different neutral message is shown, "The scan was too short. Scan for at least three seconds and rotate the potato to all sides.", also without a verdict and without speech. An uploaded image is exempt from this: it is one deliberate image. An upload during a live scan joins the scan and is not exempt. "Scan another one" opens a new scan.

**Info.** Seven sections: what solanine is, warning signs, how to store, how to clean, why cooking does not help, young children, and red or brown skin. Next to each section are its sources, from BfR, CFS Hong Kong, Oregon State and the scientific literature. After them comes "How to clean, step by step": three illustrations that change every 4 seconds, with the buttons "Previous", "Read aloud" and "Next". Then the speech and vibration switches, which are saved on the device, and a message when the device has no Hebrew voice. At the end, the disclaimer.

**Navigation.** A bottom bar with two destinations, "Scan" and "Info". The result is a state of the scan, not a separate destination.

## How detection works

The code is in `src/core`. The full source: [spec](docs/superpowers/specs/2026-10-17-solanisense-design.md), section 4.

1. **Frame.** Every 300 milliseconds a frame from the video, or an uploaded image, is scaled down to a width of 256 pixels.
2. **Check area.** An ellipse in the center of the frame, 80% of its width and height. The assumption is that the potato fills the frame. There is no background separation.
3. **CIELAB.** Each pixel is converted from RGB to the CIELAB color space: `L*` is lightness, `a*` runs from green (negative) to red (positive), and `b*` from blue to yellow. A negative `a*` means green.
4. **Two regimes, by the median.** The medians of `a*` and `b*` in the ellipse are the base hue of the frame, and they decide how it is judged. **Regime 1, skin-like median** (median `a*` at least -10, or median `b*` at most 0): a pixel counts as green when its `L*` is above 20 and its `a*` is more than 11 below the median. There is no absolute threshold. A light cast moves all the pixels together, and the median too, so the difference is kept: a faint greenish spot, which warm light lifts to a positive `a*`, is still 15 below the median. The previous rule also had an absolute threshold, `a*` below -4, and it erased this spot in warm light without any warning.
5. **Regime 2, clearly green median** (median `a*` below -10 and median `b*` above 0, the yellow-green of chlorophyll): when most of the area is green, the median is green too, and the relative rule has nothing to measure against. Then a pixel counts as green when its `a*` is below -4 and its `L*` is above 20. In the previous rule this switch already happened at a median of -4, and cool or fluorescent light pushed a clean yellow skin there, which was then read as "Widespread greening". **The limitations:** a side that is mostly pale green, in strong warm light, stays in regime 1 with no difference to find, and reads "No green detected"; so does an ellipse that is exactly half pale green, because the median falls in the middle. And a strong greenish cast on a light skin brings it close to the regime 2 threshold, where the whole tuber is counted. Details under "Known limitations".
6. **Ratio.** The number of green pixels divided by the number of pixels in the ellipse.
7. **Level:**

| Level | Green ratio | Text | Shape | Vibration | Advice on the result screen |
|---|---|---|---|---|---|
| `none` | below 1% | No green detected | check mark in a circle | none | "Rotate to all sides. A bitter taste or sprouts: do not eat." |
| `local` | from 1% to below 10% | Local greening | triangle | one 200 ms pulse | "Peel the marked area and the eyes generously, until no green is left, plus one more layer. A bitter taste: do not eat." |
| `widespread` | 10% and above | Widespread greening | X | three 200 ms pulses, with 100 ms pauses | "Do not eat." |

The 10% threshold is a cautious decision of the project owner. USDA uses 25% for marketing grades, and no health authority has set a percentage. The 1% floor is an engineering value against noise.

8. **Lighting gate.** A median `L*` below 25 is "dark", and the message is "The light is weak". A median `a*` above 45, or an absolute median `b*` above 60 when the frame is not in regime 2, is "tinted", and the message is "The light is too colored, try near a window". Such a frame does not change the verdict and is not marked. The thresholds are high on purpose: the frame has no reference point other than the potato itself, so a yellow skin cannot be told apart from warm light. According to the spec, a yellow skin reaches a `b*` of about 45, and a red skin an `a*` of about 35. In the first version, with thresholds of 35 for `b*` and 20 for `a*`, ordinary potatoes were treated as "tinted light", their frames were discarded, and that could have hidden greening. `b*` is not checked in regime 2, because potato green is yellowish, with a high `b*`. The lighting gate does not catch a green cast, because such a threshold would hide a fully green potato.
9. **Scan memory.** The scan keeps the most severe level and its frame. A milder level does not replace it. In the live scan, speech and vibration happen only when the level rises. The first well-lit frame is kept even without green, so that the result of a clean potato also has an image. The scan also counts the well-lit frames: "No green detected" waits for ten of them (`MIN_OK_FRAMES_FOR_NONE`), and green does not wait.

All the thresholds live only in `src/core/analyzer/thresholds.ts`, and a test locks their values, so a deliberate change requires updating it.

## Accessibility

The principle: no information is conveyed by color alone.

- **Text.** The verdict at 40 pixels, bold.
- **Shape.** Next to every verdict: a check mark in a circle, a triangle or an X, so the level can be recognized without telling colors apart.
- **Marks.** The green areas are marked with white diagonal stripes and a white outline, with black edges so they show on any background. No color fill. The same drawing in the live scan and on the result screen.
- **Speech.** `speechSynthesis` in Hebrew (`he-IL`): in the live scan every time the level rises, and on the result screen once, when it opens with a verdict. A neutral message is not spoken. It can be turned off on the info screen. When the device has no Hebrew voice, the info screen says so and explains how to add one.
- **Vibration.** A different pattern for each level (in the table above). It can be turned off. In a browser without vibration, such as Safari on iOS, the app simply continues without vibration.
- **Screen reader.** The verdict area in the scan is marked `aria-live="assertive"` and stays on screen throughout the scan, so that the first verdict is announced too. The shape is hidden from the screen reader, and the text is read. The image on the result screen has a Hebrew description with the verdict, and with the percentage when there is one.
- **Buttons.** At least 56 pixels tall. In the navigation bar the active destination is shown in inverted colors, not just in a different shade, and is marked `aria-current`.
- **The start tap.** The camera opens only after "Start scan". iOS allows speech, and Android vibration, only after a touch by the user, so this tap is the touch that unlocks them. When speech is on, the tap also speaks an empty sentence, so that the speech that follows works on iOS. The tap on "Upload image" does this too, because the result screen speaks the image's verdict after decoding, outside any tap. Not tested on an iOS device.
- **Motion.** The "how to clean" animation does not advance on its own when the user asked for reduced motion in the device settings, and it stops advancing on its own after the first tap.
- **Direction and language.** `dir="rtl"` and `lang="he"` on the root.

## Known limitations

- **Does not detect sprouts or rot.** Only green.
- **No background separation.** The whole ellipse is checked. A green background, such as grass or a towel, that fills the frame will read "Widespread greening", and a white wall will read "No green detected" (and in strong greenish light "Widespread greening", see "Cool or greenish light on a clean skin" below). That is why the fixed hint is to fill the frame.
- **The thresholds are not medically validated.** They are engineering values, and 10% is a cautious decision, not a standard.
- **Red or rough brown skin hides green.** The toxin can rise even without visible green. That is why the cultivar warning appears in every result.
- **A side that is mostly pale green, in strong warm light, reads "No green detected".** A green spot on a skin stays visible in warm light, because the rule is relative to the median. But when the pale green covers more than half of the ellipse, the median is the pale green itself, and warm light lifts it to a positive `a*`: the frame stays in regime 1, and there is no difference to find. The same happens when exactly half of the ellipse is pale green, in daylight, warm and cool light, because the median falls in the middle (the previous rule read this as widespread in daylight and in cool light). Under the lighting matrix's fluorescent light it reads "Widespread greening", but only by a margin of 0.06 below the regime 2 threshold. The lighting gate does not warn about such light. The protection: the scan remembers the most severe side, so rotating the potato also shows sides where the green is a minority, plus the fixed hint, the cultivar warning and the disclaimer. The real fix: calibration on real photos.
- **Cool or greenish light on a clean skin.** Noise and texture of the skin can produce scattered hits; in the matrix they stay below the noise floor (0.12% to 0.40% with noise of standard deviation 6), but stronger texture would bring them closer to "local". A greenish cast slightly stronger than the matrix's fluorescent pushes a clean yellow skin to the regime 2 threshold, and then the whole potato is counted and reads "Widespread greening"; a white wall under the matrix's fluorescent light already reads that way. This is the safe direction of error. The lighting gate does not check for a green cast, because such a threshold would hide a fully green potato. The measured margins are in [`test-images/README.md`](test-images/README.md).
- **Very dark red skin** may cross the tinted-light threshold (median `a*` above 45): in synthetic samples such skins reached an `a*` of 42 to 46 ([decision log](docs/decisions.md)). The app will then show "The light is too colored" and will not judge the potato. Not tested on real photos.
- **No vibration on iOS.** Safari on iOS does not support the Vibration API.
- **The Hebrew voice depends on the device.** When no Hebrew voice is installed, speech may stay silent or sound in another language. The app does not choose a voice: if the browser chooses a network voice, it sends the spoken sentence, which is a fixed string of the app, to the voice provider.
- **On the result screen an automatic screen-reader announcement is not guaranteed**, because the verdict area there loads already filled.
- **Calibration on synthetic images only.** 28 generated images, until real photos are taken according to `test-images/README.md`.
- **A version update may reload the page in the middle of a scan**, because of `registerType: 'autoUpdate'`. The details are in the [security review](docs/security-review.md).

## Running

Requires Node 24 (tested with 24.19.0) and npm. `npm test` runs a bash script, so on Windows you need Git Bash.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build into the dist folder
npm run preview    # serves dist at http://localhost:4173
```

The service worker, and with it offline use, is active only in the build (`npm run build` and then `npm run preview`), not in `npm run dev`.

**Testing on a phone.** The browser gives camera access only in a secure context: HTTPS or `localhost`. An address like `http://192.168.1.10:5173` is not one, and there the app will show "No access to the camera" and leave only image upload. Two ways:

- **USB port forwarding to `localhost`.** On Android: turn on "USB debugging" on the phone and connect it with a cable, open `chrome://inspect` on the computer, add port `5173` to `localhost:5173` under Port forwarding, and on the phone open `http://localhost:5173`.
- **HTTPS**, for example a build hosted on a server with HTTPS.

Do not run `npm run dev -- --host` on an unknown network: it exposes the dev server to the whole network ([security review](docs/security-review.md), section 4).

### Obsidian link (git hook)

Local hooks append a line to the journal of the project note in Obsidian (`SolaniSense/SolaniSense.md` in the vault) after every commit, before every push to GitHub, and after every merge or pull (that is, when a PR merged on GitHub lands in this clone). The scripts in `scripts/githooks` read the vault path from Obsidian's own settings, so nothing is hard-coded. Enable once per clone:

```bash
git config core.hooksPath scripts/githooks
```

If Obsidian is not installed or the note does not exist, the hook does nothing.

## Git workflow

- Every change on its own branch (`feat/…`, `fix/…`, `chore/…`). No direct commits on `main`.
- Changes reach `main` only through a Pull Request. `main` is protected on GitHub.
- After a PR merges: `git checkout main && git pull`, and the hook records the merge in the Obsidian journal.

## Tests

```bash
npm test                                      # core purity, then Vitest: unit, regression and the lighting matrix
npx playwright install --only-shell chromium  # once, before the end-to-end tests
npm run test:e2e                              # Playwright, against npm run dev or a server already running on 5173
```

### Test matrix (as of 2026-10-18)

| Type | Tool | Location | Tests | What is tested |
|---|---|---|---|---|
| `core` purity | bash and grep | `scripts/lint-core.sh` | one script | that `src/core` does not import React, `platform` or `ui` and does not touch the DOM |
| Unit: `core` | Vitest | `src/core` | 58 | color conversion, the analyzer (including a single pixel, a 0x0 frame, a wrong data length, all white, all green, a non-square frame and the lighting gate), the two regimes under warm, cool and fluorescent casts (a faint greenish spot, a clean yellow skin, Gaussian noise with a fixed seed, half pale green, a white wall), the verdict, the scan state and the frame count, and the threshold lock |
| Lighting matrix | Vitest | `src/core/analyzer/lightingMatrix.test.ts`, `test-images/` | 30 | 28 synthetic images, a check that every image in the folder has an expected answer, and downscaling and decoding of a JPEG |
| Unit: `platform` | Vitest | `src/platform` | 35 | camera (start, stop, cancel), speech, vibration and storage |
| Unit: `ui` | Vitest and Testing Library | `src/ui` | 66 | the three screens, the verdict, the marks and the frame of the checked area, the ten frames before "No green detected", speech and vibration on the result screen, the advice source, navigation and the whole app |
| End-to-end | Playwright on Chromium | `e2e/scan.spec.ts` | 6 | uploading an image with a spot (including the advice source), a brown image, RTL, sources and disclaimer, the speech switch, and a broken file |

In total, 189 Vitest tests in 16 files, and 6 end-to-end tests. All of them pass. Every run of `npm test` is also the regression test.

### The lighting matrix

`test-images/synthetic/` contains six lights (daylight, a warm 2700K bulb, a cool 6500K bulb, fluorescent, mixed, dim) times four kinds: a clean brown potato, one with a green spot, one with a faint greenish spot, and a clean yellow skin. In addition there is a brown skin with Gaussian noise from a fixed seed, in daylight, cool and fluorescent light, and one image of widespread green in daylight: 28 images. The images are generated by `node scripts/make-lighting-matrix.mjs`, and the expected answer for each one is in `test-images/expected.json`. There are no real photos yet.

**Adding real photos.** The full details are in [`test-images/README.md`](test-images/README.md):

1. Photograph in six lighting conditions, and in each condition a clean potato and a potato with green. The potato fills the frame, without flash.
2. Save as JPEG or PNG, not HEIC. Remove the location from the file, because the repo is public, and it is worth scaling down to a width of about 1000 pixels.
3. Put them in `test-images/real/<condition>-<kind>-<n>.jpg`, for example `test-images/real/warm-2700k-green-1.jpg`.
4. Add a line to `test-images/expected.json` with the correct answer, decided by eye before the run. Someone who cannot make out the green asks someone who sees colors.
5. Run `npm test`. An image that fails prints the ratio, the verdict, the lighting and the medians. A threshold change is made only in `thresholds.ts`, and after it you update the lock (`npx vitest run src/core/analyzer/thresholds.test.ts -u`) and add a line to the calibration log.

## Code structure

```
src/
  core/       pure TypeScript: color conversion, the analyzer, the thresholds, the verdict and the scan state
  platform/   interface and Web implementation: camera, speech, vibration, and settings storage
  ui/         React: the screens, the components, the strings and the content
  main.tsx    service worker registration and mounting the app
```

- **`core`** does not depend on the DOM, React or Web APIs, so it is unit-tested without a browser, and can also run as is outside the browser. `scripts/lint-core.sh` enforces this inside `npm test`.
- **`platform`** wraps the camera, speech and vibration in interfaces (`Camera`, `Speech`, `Haptics`), and the settings storage in two functions. The UI reaches these capabilities only through it, so a move to Capacitor will replace only the implementations.
- **`ui`** connects them. There is no router: the current screen is a state in `App`.
- **`Analyzer`** (`src/core/analyzer/types.ts`) is an interface. A future AI engine will be another implementation of it, alongside the local analyzer.

## Repo map

```
src/              app code: core, platform, ui
e2e/              the end-to-end tests and their upload images
test-images/      the lighting matrix: images, expected answers and photo instructions
scripts/          generators of the test images and the icons, and the core purity check
public/           the PWA icons
docs/             spec, plan, research, decision log, design, licenses and security review, and the README logo in docs/assets
logo/             the original logo
buildin_model/    the development model diagram
index.html        the entry page, with the CSP policy
CLAUDE.md         the project rules
package.json      dependencies and commands
*.config.ts       Vite, Vitest and Playwright configuration
tsconfig*.json    TypeScript configuration
```

## Development process

The [development model](buildin_model/building_model.jpeg) describes the path from idea to app: an idea, shaping and specification with Claude, a work plan, and then a sequence of stages in Claude Code: `CLAUDE.md`, planning and architecture, implementation, tests and edge cases, security review and commit. In parallel, documentation in Obsidian, the code on GitHub, and finally interface design in Stitch.

In practice:

1. **Research and spec.** The [research](docs/research/2026-10-17-greening-research.md) gathered the findings and the authorities' guidance, with the sources and the access date. The [spec](docs/superpowers/specs/2026-10-17-solanisense-design.md) was written on that basis and approved.
2. **Plan.** The [plan](docs/superpowers/plans/2026-10-17-solanisense-phase1.md) divides the phase into 14 tasks, each with its files, steps and commit.
3. **Execution by agents, task by task.** Each task, or several related tasks together, goes to an executing agent with a brief. It writes tests and code and commits. A separate reviewer checks the change against the spec and the plan, and findings go back to a fix round with its own commit, until the review is clean. `CLAUDE.md` sets planning with Fable 5.1 and execution with Opus 5.5.
4. **Project rules** in [`CLAUDE.md`](CLAUDE.md): Hebrew and RTL always; no information by color alone; no "safe" and no "solanine level"; every health instruction with its source; a pure `core`; thresholds only in `thresholds.ts`; a `shortcut:` comment for every deliberate shortcut; only freely licensed libraries; a commit after every stage; and after every execution, end-to-end tests, edge cases, regression and a security review.
5. **Where the decisions are.** In the spec (section 11, "Closed decisions", and updates that came in `docs(spec): ...` commits) and in the plan, under `docs/superpowers/`. The decisions made during execution, and the small deferred items, are in [`docs/decisions.md`](docs/decisions.md). The calibration decisions are in the log in `test-images/README.md`, and the licensing decisions in `docs/licenses.md`. The agents' briefs, reports and work log are kept locally in the `.superpowers/` folder, which is not in the repo.

## Documents

- [Spec](docs/superpowers/specs/2026-10-17-solanisense-design.md)
- [Research: potato greening and solanine](docs/research/2026-10-17-greening-research.md)
- [Implementation plan](docs/superpowers/plans/2026-10-17-solanisense-phase1.md)
- [Execution decision log](docs/decisions.md)
- [Design tokens (Stitch)](docs/design/stitch-screens.md)
- [Licenses](docs/licenses.md)
- [Security review](docs/security-review.md)
- [Lighting matrix and calibration](test-images/README.md)
- [Project rules](CLAUDE.md)

## Licenses

- **The project:** the license has not been chosen yet, and there is no `LICENSE` file in the repo.
- **Dependencies:** every direct package, with its version and license, is listed in [`docs/licenses.md`](docs/licenses.md). The allowed list: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD. The code shipped to the browser contains only react, react-dom, scheduler and workbox, all MIT.
- **Transitive exceptions, development only:** some transitive dependencies of the build and test tools are outside the allowed list: lightningcss (MPL-2.0, through Vite 8 and Tailwind 4), packages under MIT-0, BlueOak-1.0.0 and CC0-1.0 through jsdom, and packages under BlueOak-1.0.0 and CC-BY-4.0 through workbox-build. None of them is shipped to the browser. All of them are documented in `docs/licenses.md`, and the decision whether to accept them belongs to the project owner. The browsers that Playwright downloads, some of them under other licenses (for example FFmpeg's LGPL), also stay on the development machine.

## What's next

- **Design (task 13).** Applying the design system from [`docs/design/stitch-screens.md`](docs/design/stitch-screens.md). Partial work is in the `wip/task13-design` branch, which has not been merged into `main`.
- The Rubik font will be served from the repo itself (OFL) and not from Google Fonts, to keep working offline and with zero traffic.
- **Calibration on real photos.** Photographing the lighting matrix according to `test-images/README.md`, and then tuning the thresholds.
- **Capacitor.** An installed app: new implementations in `src/platform` for the camera, speech and vibration, including vibration on iOS.
- **AI engines.** More implementations of the `Analyzer` interface, alongside the local analyzer.
- **Recommendations from the security review.** Security headers from the hosting (including `frame-ancestors`) and an update prompt instead of an automatic reload ([section 5](docs/security-review.md)).
