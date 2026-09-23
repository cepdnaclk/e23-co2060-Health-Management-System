# Test Coverage Report

**Run date:** 2026-09-23
**Test command:** `npm run test`

## Requirement and Feature Coverage

| Area | Covered checks | Result |
| --- | --- | --- |
| API availability | Health endpoint responds with database status | PASS |
| Patient authentication | Patient signup returns a JWT session | PASS |
| Patient profile | Profile update and reload preserve nationality, age, and gender | PASS |
| Public AI symptom checker | Unauthenticated symptom chat returns an assistant response | PASS |
| Protected AI symptom checker | Authenticated symptom chat returns an assistant response | PASS |
| AI wellness coach | Authenticated wellness route returns lifestyle advice | PASS |
| Frontend integration | Vite production build transforms 70 modules | PASS |

**Automated feature coverage: 7 API checks plus 1 frontend build check.**

## Scope

This is integration/feature coverage, not source-code line coverage. The checks exercise the running Express API over HTTP and compile the React frontend. No claim of clinical accuracy or 100% code coverage is made.

## Remaining Coverage Gaps

- Browser interaction tests are recorded separately in the manual test record.
- Gemini wording is non-deterministic; automated tests verify response availability and shape.
- Clinical safety and recommendation quality require human review by qualified users.
