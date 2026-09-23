# Manual Testing Record

**Tester:** ____________________  **Date:** ____________________
**Build/commit:** ____________________  **Browser:** ____________________

| ID | Test steps | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- |
| M-01 | Open Patient Profile; choose `Sri Lankan` from Nationality; save | Country selector saves and Sri Lankan flag appears beside the profile image | ____________________ | PASS / FAIL |
| M-02 | Enter date of birth and gender; open AI Symptom Checker | Header states nationality, age, and gender tailoring | ____________________ | PASS / FAIL |
| M-03 | Send symptoms in two messages | Coach asks a follow-up question, then recommends a specialty and doctors | ____________________ | PASS / FAIL |
| M-04 | Open dashboard AI Wellness Coach | Shows tailored profile summary and diet, recipe, and lifestyle advice | ____________________ | PASS / FAIL |
| M-05 | Change nationality or dietary preference; save and refresh | Personalization label and recommendations update | ____________________ | PASS / FAIL |
| M-06 | Submit empty symptom message | Send button remains disabled and no empty request is sent | ____________________ | PASS / FAIL |
| M-07 | Open patient workspace without a valid session | Protected patient routes reject the request and user must authenticate | ____________________ | PASS / FAIL |
| M-08 | Run `npm run test` after manual changes | Automated checks pass and frontend build completes | ____________________ | PASS / FAIL |

## Evidence Attachments

Attach screenshots or screen recordings using the IDs above, for example `M-01-profile-nationality.png`.
