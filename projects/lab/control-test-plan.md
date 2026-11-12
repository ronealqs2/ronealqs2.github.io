# Home-lab control-test plan

**Mixed checkpoint: completed observations and planned extensions are distinguished below.** Use fictional accounts and lab-only resources. Record procedures and observations before making any portfolio or résumé claim. These exercises are separate from the canonical Sentinel GRC assessment.

| Exercise | Objective and method | Expected evidence | Current status |
| --- | --- | --- | --- |
| Timed workstation lock | Confirm effective policy scope; record an ordinary signed-in session, idle start and actual lock time; verify authentication is required to resume. Control objective: unattended-session protection. | Applied policy/registry, timestamps, observation record, lock/unlock context | Policy application checked; timed lock/authentication owner-confirmed; retained timing record outstanding |
| Authentication audit visibility | Capture effective workstation/domain audit settings, account type, authentication path, synchronized clocks, test window/time zone and query filters. Review the existing controlled failure before deciding whether another authorized test is needed. | Audit-policy output, scoped event excerpts and search notes, supported conclusion or remaining question | Separate new-case failure visibility observed; original cause and exact attempt attribution unresolved |
| Joiner/mover/leaver | Create an approved fictional request and a lab resource. Provision role access, verify allowed and denied operations, change role, remove former access, disable the account and test new authentication. Evaluate existing sessions separately. | Request/approval, membership and permission exports, positive/negative tests, offboarding check | Planned |
| Access review | Compare a fictional approved role matrix against actual accounts, memberships and resource permissions. Document each exception, decision, proposed owner and retest. | Expected/actual comparison and exception record | Planned |
| SIEM investigation | After Wazuh is installed, verify endpoint collection. Follow one authorized event through ingestion, query/rule evaluation, any alert, analyst review and disposition. | Agent/collection status, event/query context, applicable alert and investigation note | Wazuh and centralized collection planned |

## Test record

Record: test ID; objective/reference; scope; prerequisite; procedure; expected outcome; actual observation; evidence IDs; conclusion; limitations; reviewer status; next action/retest. Leave actual results and completion dates blank until observed.

## Illustrative control references

IAM exercises relate to NIST SP 800-53 Rev. 5 AC-2 Account Management, AC-6 Least Privilege and AC-11 Device Lock. Authentication exercises relate to AU-2 Event Logging, AU-6 Audit Record Review, Analysis, and Reporting, and AU-12 Audit Record Generation. These are learning mappings, not full assessments or equivalence/compliance claims. [NIST reference](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final).

Review the scope of each control and its organization-defined parameters before using it in a formal assessment.

[Lab documentation](README.md) · [Evidence index](evidence-index.md)
