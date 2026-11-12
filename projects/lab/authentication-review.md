# SOC authentication evidence review

Home-lab experience. Historical evidence and a separate new audit-change case reviewed; original failed-attempt correlation remains unresolved. Sanitized public case review.

## Work completed

Preserved and inspected three saved workstation event exports and an initial domain-controller Security-log export containing 26,519 records. Built a PowerShell tool that reads saved events, extracts named XML fields, normalizes explicitly offset timestamps to UTC, keeps absent fields unknown, and creates separate private and sanitized summaries. Twenty-seven checks passed using three real workstation events, 265 domain-authentication records, empty selections and UTC windows, naturally absent fields, and explicitly derived robustness fixtures. That initial export covered 4768, 4769 and 4776 with no 4771 example. The later new-case 4771 validation is described separately below. Raw exports and detailed output remain private.

| Evidence | Verified observation | Interpretation limit |
| --- | --- | --- |
| Successful workstation unlock | Event 4624, logon type 7 | One recorded unlock; not an enterprise monitoring deployment |
| Controlled incorrect-password attempt | Event 4625, type 2; status 0xC000006D, substatus 0xC000006A | Consistent with the documented authorized test; not evidence of a brute-force attack |
| Separate administrator attempt | Event 4625, type 11; status 0xC000010B; local target-account context and an elevation-related caller | Elevation context is observed; exact cause remains unconfirmed |

Reviewed supporting artifacts also show the employee group in a historical session-group listing, no Administrators group in that listing, and a computer-policy report containing a 900-second inactivity limit. These are historical artifact observations. They do not establish current membership or runtime behavior by themselves. Separately, the owner confirmed the 15-minute lock and authentication to resume.

## Troubleshooting observation

**Verified configuration finding at collection time:** the domain controller's effective Kerberos Authentication Service and Credential Validation audit subcategories were set to Success only. Failure auditing was not enabled for those two subcategories. The separate Logon subcategory did include Success and Failure; this is not a finding that all failure logging was disabled. The preserved domain authentication records comprised 83 TGT requests, 176 service-ticket requests and 6 NTLM validations, all with success status. No matching failed domain authentication was identified. Success-only authentication auditing is a plausible contributing condition, not an established historical root cause.

A query of the recorded UTC window extending five minutes either side of the workstation's controlled failure found two successful Kerberos events for the employee roughly 20 seconds earlier. Neither is a failed attempt, and proximity does not prove they correspond to the controlled failure. The export contains recorded clock changes associated with VMware Tools, including a forward date change. The review preserves event timestamps without retroactively correcting or equating the clocks.

The workstation's saved time-service output reports an unsynchronized state. Collection timestamps from the workstation and the separately reported domain-controller collection fall on different dates. Current clock configuration and historical time alignment require investigation. Neither observation establishes why no matching domain-controller event was found in the original review.

The saved workstation events identify Negotiate as the authentication package. This alone does not establish whether Kerberos or NTLM was selected. Workstation logon records must be distinguished from domain authentication records before attempting correlation.

## Separate new case: failure visibility observed

Preserved a fresh domain-controller Security export and before-policy snapshot, then enabled failure auditing for Kerberos Authentication Service and Credential Validation. Reviewed the transferred before/after exports and policy snapshots; all ten recorded file hashes matched. Only those two effective audit inclusion settings changed in the compared snapshots. The Security log also contains the corresponding audit-policy-change records.

The later export records three Kerberos preauthentication failures for the fictional employee with status 0x18. Two have controller-local loopback context; one has a network source matching the workstation's previously recorded address. This verifies failure-event visibility under the new case conditions. The workstation command result and exact attempt start/end times are unavailable, and a new workstation log export was not collected. Attribution to exactly the requested single workstation attempt therefore remains incomplete. Event counts are not counts of human attempts. Do not repeat the attempt merely to recover the missing console record.

Real 4771 XML field parsing was checked against five actual new records in total, including the three employee records and two for other accounts; this supplements the earlier 27-check run. The current analysis environment blocked the native saved-event reader, so the new case used an offline parser, semantically checked against the three prior known exports. Original files were preserved; timestamps rendered by the offline reader have microsecond precision. This is not a fresh end-to-end rerun of all 27 native-adapter checks. A separate sanitized summary excludes identifying fields.

This new result does not establish the cause of the original missing event and does not constitute a production deployment, verified enterprise remediation or regulatory compliance.

## Next steps and limitations

- Fresh user-reported clock/account preflight was recorded before the new case. Both guests then reported no synchronization warning; the controller's external time trust remains unverified. No historical timestamp correction is applied.
- Obtain an authorized elevated workstation collection when administrator access is available. The first collection could not export the current Security log or read several administrative settings.
- Record exact source, UTC window, account context and filters for every correlation query.
- If original cause cannot be established, document it as unresolved and perform a separate controlled test. A later successful retest will not prove the original cause.
- Two audit subcategories were changed in the separate user-run new case. No password reset, account-privilege change, clock correction or SIEM deployment was performed. Failure visibility was observed; exact one-attempt attribution remains incomplete.

This public summary excludes account names, host/domain names, addresses, SIDs, source paths and absolute event timestamps. No raw event files are attached. This sanitized narrative is published separately from private originals. Career summaries retain the same investigation limits.

## Interpretation references

- [Microsoft: Kerberos Authentication Service audit policy](https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/audit-kerberos-authentication-service)
- [Microsoft: NTLM credential-validation event 4776](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4776)
- [Microsoft: system-time-change event 4616](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4616)
