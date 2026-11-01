# Cybersecurity Project Collection

**GRC focus · IAM and SOC home-lab projects · Portfolio project documentation**

I connect risk documentation with hands-on identity administration and authentication-log analysis. This collection presents three distinct projects together, with separate scope, results and evidence for each.

| Project | Focus and keywords | Status |
| --- | --- | --- |
| [Sentinel GRC Assessment](grc.html) | Risk register, control mapping, evidence planning, remediation tracking, thematic charts | Fictional planning deliverables complete; assessment activities pending validation. Original assessment and workspace remain separate and unchanged. |
| [IAM & Active Directory](iam.html) | Account provisioning, organizational units, security groups, domain login, Group Policy, access verification | Home lab in progress; configuration and session checks completed; evidence export/review pending. |
| [SOC Authentication Analysis](soc.html) | Windows event logs, authentication analysis, failed-logon triage, controlled testing, investigation documentation | local log-analysis project in progress; domain-controller investigation open. |

## Shared environment

The collection includes interactive IAM and SOC visual summaries and a themed GRC dashboard. These summarize documented checkpoints; they are not live directory or SIEM feeds. The showcase focuses on these three projects. [Explore the collection](index.html).

```mermaid
flowchart TB
    Host[Personal Windows desktop / VMware Workstation]
    Host --> DC[Windows Server / domain controller]
    Host --> Client[Windows 11 / domain-joined workstation]
    Host --> Analyst[Ubuntu / analyst workstation]
    DC -->|Domain identity and Group Policy| Client
```

The IAM and SOC projects share this local lab. This logical view does not establish network segmentation, routing or Ubuntu domain membership. Sentinel GRC is a separate fictional assessment, not the parent assessment of these machines.

## IAM & Active Directory

**Business purpose:** practice structured employee access and workstation security-policy administration.

**My completed work with guidance:** established the domain/client environment; created employee, administrative-account, group and workstation OUs; placed the client in the workstation OU; created a fictional employee; verified employee-group membership and domain login; configured a 900-second screen-lock GPO and checked its application, registry value and computer-policy report.

**Current conclusions:** the employee group appeared in the observed session groups and Administrators did not. This is a session observation, not a complete least-privilege assessment. Screen-lock policy application was checked; timed automatic locking was not observed.

**Evidence:** HL-E-001 access note and HL-E-003 policy report are reported saved inside the Windows guest. HL-E-007–008 directory/policy screenshots need collection/export. Host export and review remain pending.

**Next:** export/review evidence, document a timed lock test and perform further account-lifecycle/resource-permission exercises. Full lifecycle management is not yet demonstrated.

## SOC Authentication Analysis

**Business purpose:** explain authentication activity, document investigation reasoning and identify visibility questions requiring further review.

**My completed work with guidance:** reviewed a successful unlock (4624, type 7); triaged a separate administrator failure (4625, status 0xC000010B, consent.exe caller); generated one authorized incorrect-password runas attempt for a fictional employee, recorded locally as 4625/status 0xC000006D/substatus 0xC000006A; reviewed domain-controller 4771/4776 results without identifying a matching failure.

**Current conclusions:** the controlled test produced a local failure event. An elevation-related cause for the separate administrator failure is suspected, not confirmed. No matching failure in reviewed domain-controller results does not establish that auditing is disabled or an event never occurred.

**Evidence:** HL-E-002 investigation note and HL-E-004–006 event exports are reported saved inside the guest. HL-E-009 audit configuration, filters, time window/time zone and authentication-path context need collection. All exports await private transfer/review.

**Next:** review audit configuration and query scope; corroborate the administrator-failure hypothesis; repeat a controlled test if appropriate. Wazuh, centralized SIEM collection, Splunk exercises and automation are planned, not deployed or demonstrated.

## Sentinel GRC Assessment — existing separate project

The [existing assessment](https://ronealqs2.github.io/grc/sentinel/) and [workspace](https://ronealqs2.github.io/grc/sentinel/workspace.html) contain four linked provisional risk/control/evidence-request/action chains. Planning deliverables are complete; evidence collection, assessment and remediation remain pending. IAM/SOC lab results do not fulfill its E-001–E-004 requests, validate its findings or close its actions. No workbook changes are proposed.

## Evidence and publication boundaries

- Technical projects are home-lab projects, not employment, client work or production operations.
- Business data is fictional/sample data. Training systems are separate from actual business operations and security posture.
- Public narratives use roles such as domain controller, workstation and fictional employee. Hostnames, domain/account names, original filenames and source-path mappings belong in the private evidence register.
- Only clipboard sharing has been tested. Guest files are not assumed accessible from the host; no evidence transfer or independent content review is claimed.
- Retain private originals and publish only reviewed sanitized excerpts. No credentials, VM images or unreviewed raw evidence are included.
- Record purpose, context, procedure, expected/actual outcome, timestamp/time zone, evidence ID and limitations for each test.
- A confirmed lab gap can lead to a separate HL-F finding and HL-A action with acceptance criteria and retest evidence. Observations do not automatically become findings.
- Do not claim comprehensive least privilege, effective automatic locking, confirmed root cause, complete audit coverage, SIEM operation, verified remediation or compliance.

## Project organization

The three peer projects share this collection. IAM and SOC share a lab foundation but have separate case studies. The original Sentinel assessment, interactive workspace and workbook remain separate; lab observations do not validate its risks or close its actions.

[Portfolio](https://ronealqs2.github.io/) · [Project collection](index.html)

**Evidence status:** IAM/SOC guest artifacts await private export and review. Public visuals summarize the owner’s checkpoint; they do not contain raw guest files.



