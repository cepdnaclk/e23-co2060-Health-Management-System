# Testing Evidence

## Automated test command

From `code/`, start the development stack and run:

```bash
npm run test
```

This command runs the API smoke test and then creates a production frontend build. The API test uses Node.js built-in `fetch`, so no test dependency or external testing service is required.

## Automated checks

| Check | Evidence produced |
| --- | --- |
| API health endpoint | `PASS health endpoint` |
| Patient registration and JWT session | `PASS patient signup` |
| Patient profile update | `PASS profile update` |
| Nationality persistence | `PASS profile persistence` |
| Public symptom checker | `PASS public symptom chat` |
| Authenticated symptom checker | `PASS protected symptom chat` |
| AI wellness advice route | `PASS wellness advice` |
| Frontend compilation and bundling | Vite `built in ...` and exit code `0` |

The test creates a uniquely named temporary patient, so it can be rerun without depending on a pre-existing account.

## Tools and frameworks

- Node.js built-in `fetch` and assertions implemented in `scripts/test-api.mjs`.
- Express API routes tested through HTTP, matching real browser usage.
- JWT authentication tested using the token returned by signup.
- Vite production build used as the frontend compilation check.
- `npm run dev` launcher used to start the backend and frontend together.
- Docker Compose/MySQL is supported, while the local JSON database is used automatically when MySQL is unavailable.

## Manual demonstration record

During the presentation, demonstrate these cases and capture screenshots of the result:

1. Open Patient Profile and select `Sri Lankan` from Nationality.
2. Save the profile and show the Sri Lankan flag beside the profile picture.
3. Open AI Symptom Checker and show the visible tailored-for sentence containing nationality, age, and gender.
4. Describe symptoms across two messages and show the recommended specialty and doctors.
5. Return to the dashboard and show the AI Wellness Coach's tailored summary and Sri Lankan-friendly recipe.
6. Change nationality or dietary preference, refresh the profile, and show that the displayed context updates.

## Limitations and honest reporting

The current test is a smoke/integration suite, not a full clinical validation study. It verifies routes, authentication, persistence, fallback AI behavior, and frontend compilation. Gemini responses are non-deterministic, so the automated checks validate response shape and availability rather than judging medical wording. Clinical recommendations must remain advisory and require professional review.

## Evidence to submit

Save the terminal output from `npm run test` as a PDF or screenshot. Include this document, the generated screenshots from the manual record, and the commit/diff showing the fixes made after testing.

The prepared evidence files are in [`docs/evidence`](evidence/README.md):

- [Automated test log](evidence/automated-test-log.txt)
- [Test coverage report](evidence/test-coverage-report.md)
- [Manual testing record](evidence/manual-testing-record.md)
- [Bug-resolution log](evidence/bug-resolution-log.md)