# Bug Resolution Log

| ID | Problem found | Root cause | Resolution | Verification |
| --- | --- | --- | --- | --- |
| B-01 | Public landing-page wellness chat did not respond | Component ignored its supplied endpoint and called the protected route; no public chat route existed | Added public symptom-chat route and endpoint prop wiring | `PASS public symptom chat` |
| B-02 | Patient AI routes failed without MySQL | Local database fallback did not support seeded user updates | Added the missing local update query handler | `PASS patient signup`, `PASS wellness advice` |
| B-03 | AI context did not reflect patient nationality | Nationality was not stored or included in AI context | Added profile persistence, country selector, flags, and guarded AI context | `PASS profile persistence` |
| B-04 | AI advice was too generic for local demonstration | Fallback wellness output had no Sri Lankan examples | Added culturally familiar Sri Lankan food examples without inferring medical risk from nationality | Manual test M-04 |
| B-05 | Health smoke test initially failed | Test expected `status: ok`, but the API contract uses `ok: true, db: up` | Corrected the test assertion to match the actual API contract | `PASS health endpoint` |

## Verification Principle

Each fix was followed by a focused executable check, then the full automated suite was rerun. The log records the problem and the evidence used to verify the resolution.
