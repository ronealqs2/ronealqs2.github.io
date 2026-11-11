# Sentinel cybersecurity home lab

**IAM administration · SOC authentication analysis · GRC control documentation**

The lab supports two peer case studies: [IAM & Active Directory](https://ronealqs2.github.io/projects/iam.html) and [SOC Authentication Analysis](https://ronealqs2.github.io/projects/soc.html). Sentinel is a fictional cybersecurity-company scenario. Training systems and sample business data are separate from actual business operations.

```mermaid
flowchart LR
  H[Personal Windows desktop / VMware Workstation]
  H --> D[Windows Server / domain controller]
  H --> C[Windows 11 / domain workstation]
  H --> U[Ubuntu / analyst workstation]
  D -->|Directory, account and Group Policy services| C
```

This is a logical role diagram, not a claim of network segmentation or Ubuntu domain membership.

## Completed checkpoint

- Configured the Windows domain and joined the Windows client.
- Created four OUs and a fictional employee account with employee-group membership.
- Verified domain login and observed session groups; Administrators was absent from that observed session.
- Configured a 900-second screen-lock GPO and checked its application, registry value and HTML policy report. Timed locking is still untested.
- Reviewed a successful-unlock event and two failure examples, including one authorized incorrect-password test that produced a workstation event 4625.
- Investigated domain-controller authentication visibility; no matching failure was identified in the reviewed 4771/4776 results. Audit-configuration follow-up remains open.

## Evidence and next tests

- [Evidence index](evidence-index.md): artifact IDs, availability, review status and conclusions they can support.
- [Control-test plan](control-test-plan.md): timed locking, lifecycle/access review and authentication-audit follow-up.
- [Milestones](next-milestones.md): evidence export, one SIEM workflow and later scripting practice.

Original notes, policy report and event exports are reported saved inside the Windows guest. Host export and publication review have not occurred. Screenshots and future test results must be collected before they can be presented as evidence. There are no raw event or report attachments here.

## Relationship to Sentinel GRC

[Sentinel GRC Assessment](https://ronealqs2.github.io/projects/grc.html) retains its own workbook, risks, proposed tests, evidence requests and action plans. Illustrative lab control mappings do not fulfill its evidence requests, establish its findings or close its actions.

Status confirmed November 11, 2026; no new completed lab results were added in this documentation update.
