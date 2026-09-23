# System Testing & Evidence Report

## 1. Executive Summary

The Health Management System was tested using a layered strategy:

- **API integration testing:** a Node.js test harness sends HTTP requests to the running Express API and verifies health, registration, authentication, patient profile persistence, public symptom chat, protected symptom chat, and wellness advice.
- **Frontend production compilation:** Vite creates a production bundle and the Vite image optimizer compresses raster assets during the build.
- **Manual workflow testing:** the patient profile, AI symptom checker, AI wellness coach, and responsive UI are tested in a browser using the manual testing record.
The automated suite currently provides **7 passing API checks plus a successful frontend production build**.

## 2. Test Suite Matrix

| Test Category | Test Case Name | Tool/Framework Used | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| API | Health endpoint and database availability | Node.js test harness, Express HTTP API | API returns healthy status and database mode | Returns `ok: true`, `db: up`, local mode | PASS |
| Auth | Patient Signup | Node.js test harness, JWT API | New patient receives a valid session token | Signup returned a JWT token | PASS |
| Auth | Patient Profile Update | Node.js test harness, authenticated HTTP request | Profile accepts demographic data | Profile update returned success | PASS |
| API | Profile Persistence | Node.js test harness, local/MySQL data layer | Saved nationality remains after a fresh profile request | Sri Lankan nationality persisted and reloaded | PASS |
| AI Feature | Public Symptom Chat | Node.js test harness, Express HTTP API | Public visitor receives a triage response | Assistant response returned successfully | PASS |
| AI Feature | Protected Symptom Chat | Node.js test harness, JWT authentication | Authenticated patient receives symptom guidance | Protected response returned successfully | PASS |
| AI Feature | Wellness Advice | Node.js test harness, authenticated HTTP request | Patient receives diet, recipe, and lifestyle advice | Lifestyle advice array returned successfully | PASS |
| Build | Frontend production compilation | Vite | React application compiles into production assets | 70 modules transformed and build completed | PASS |
| Build | Frontend image optimization | Vite Image Optimizer and Sharp | Large raster assets are compressed at build time | Build logs report before/after asset savings | PASS after build verification |

## 3. Bug Resolution Log

| Bug ID | Observed Problem | Root Cause | Resolution | Verification |
| --- | --- | --- | --- | --- |
| B-01 | Public landing-page AI chat did not respond | The component ignored its supplied endpoint and called the protected route; no public chat route existed | Added a public symptom-chat route and endpoint prop wiring | `PASS public symptom chat` |
| B-02 | Patient AI routes failed when MySQL was unavailable | The local database fallback did not support seeded user updates | Added the missing local database update handler | `PASS patient signup`, `PASS wellness advice` |
| B-03 | AI recommendations did not reflect patient nationality | Nationality was not persisted or included in AI context | Added nationality storage, profile selection, flags, and guarded AI context | `PASS profile persistence` and manual profile test |
| B-04 | Wellness fallback advice was too generic for the local demonstration | Fallback output had no Sri Lankan food examples | Added culturally familiar examples without inferring medical risk from nationality | Manual test M-04 |
| B-05 | Health smoke test initially failed despite a healthy API | Test expected `status: ok`, but the API contract uses `ok: true` and `db: up` | Corrected the assertion to match the real API contract | `PASS health endpoint` |
| B-06 | Production build reported stale Browserslist data and shipped a high-resolution login image | Browser compatibility data was stale and Vite had no raster optimization step | Updated Browserslist data and added `vite-plugin-image-optimizer` with Sharp JPEG/PNG/WebP/AVIF settings | Build warning removed and optimizer statistics produced during build |

## 4. Execution Instructions

### Start the project

From the repository root:

```bash
cd code
npm install
npm --prefix backend install
npm --prefix frontend install
npm run dev
```

### Run automated API and frontend tests

Keep the development stack running, open a second terminal, and run:

```bash
cd code
npm test
```

Expected evidence includes:

```text
PASS health endpoint
PASS patient signup
PASS profile update
PASS profile persistence
PASS public symptom chat
PASS protected symptom chat
PASS wellness advice

7 API checks passed.
...
✓ built in ...
```

### Run only the frontend build

```bash
cd code/frontend
npm run build
```

The build should show Vite compilation and image optimization statistics. The Browserslist database can be refreshed with:

```bash
cd code/frontend
npx update-browserslist-db@latest
```

### Capture the automated log

```bash
cd code
npm test 2>&1 | tee ../docs/evidence/automated-test-log.txt
```

## 5. Manual Testing Evidence

Complete the prepared record in [`docs/evidence/manual-testing-record.md`](docs/evidence/manual-testing-record.md). During the assessment:

1. Select `Sri Lankan` in the patient profile and save it.
2. Show the country flag beside the profile image.
3. Open the AI Symptom Checker and show the visible nationality, age, and gender tailoring label.
4. Submit symptoms and show the recommended specialty and doctors.
5. Open the AI Wellness Coach and show the localized diet/recipe advice.
6. Record screenshots or a short screen recording using the test IDs.

## 6. Evidence Files

- [Automated test log](docs/evidence/automated-test-log.txt)
- [Feature coverage report](docs/evidence/test-coverage-report.md)
- [Manual testing record](docs/evidence/manual-testing-record.md)
- [Bug-resolution log](docs/evidence/bug-resolution-log.md)

## 7. Testing Limitations

This report records integration and feature coverage, not 100% source-code coverage or clinical validation. Gemini responses are non-deterministic, so automated AI checks verify route availability and response structure. Medical recommendations remain advisory and require professional review. No hardware integration is included in the current project scope.
