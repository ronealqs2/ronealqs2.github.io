# Home-lab evidence index

Updated November12,2026. Received historical artifacts and new-case exports were privately reviewed. Raw evidence remains private.

| ID | Artifact | Review status | Interpretation limit |
| --- | --- | --- | --- |
| HL-E-001 | Access note | Privately reviewed | Employee group present; Administrators absent in that historical session listing |
| HL-E-002 | Investigation note | Privately reviewed | Original cause remains unresolved |
| HL-E-003 | Computer-policy report | Privately reviewed |900-second setting; runtime evidence is separate |
| HL-E-004 | Unlock event | Privately reviewed |4624,type7; not itself evidence of a timed lock |
| HL-E-005 | Administrator failure | Privately reviewed |Local target context; elevation hypothesis unconfirmed |
| HL-E-006 | Historical controlled failure | Privately reviewed |4625,status0xC000006D/substatus0xC000006A |
| HL-E-007–008 | Directory/policy screenshots | Retained images outstanding |Do not infer all effective permissions |
| HL-E-009 | DC export, audit/time/query context | Privately reviewed |Collection-time settings do not establish historical cause |
| HL-E-010 | New-case before evidence and audit change | Privately reviewed |Two audit categories changed; preserved before snapshot |
| HL-E-011 | New-case after export | Privately reviewed |Three employee4771records; source context distinct; exact one-attempt attribution incomplete |
| HL-E-012 | Summary tool and validation | Source and sanitized validation published |27initial checks; later real4771field checks separate |
| HL-E-013 | Timed lock and resume | Owner-confirmed |15-minute lock and authentication confirmed; retained timing record not supplied |

Six historical artifact hashes matched their supplied manifest. The initial full DC export lacked a guest EVTX hash in its supplied manifest; a host fingerprint was recorded without claiming retroactive transfer authentication. All ten recorded hashes in the separate new case matched. Keep originals and exact UTC/source mappings private.

[Sanitized investigation](authentication-review.md) · [Tool](tools/README.md) · [Control-test plan](control-test-plan.md)
