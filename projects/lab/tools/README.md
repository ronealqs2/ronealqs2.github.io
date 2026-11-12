# Saved-event summary tool

[PowerShell source](Get-LabEventSummary.ps1) · [Validation](validation.md) · [Case review](../authentication-review.md)

Reads authorized saved Windows EVTX exports through Get-WinEvent. Extracts named XML fields, handles4776PackageName, normalizes explicitly offset timestamps to UTC, preserves missing fields as null, distinguishes workstation logons/domain authentication, verifies unchanged inputs and creates separate private/sanitized outputs. It never changes audit policy or reads live logs.

Run on your own Windows system with reviewed private exports:

```powershell
.\Get-LabEventSummary.ps1 -Path 'C:\PrivateLab\saved-events.evtx' -SourceRole DomainController -OutputDirectory 'C:\PrivateLab\new-review'
```

Use Workstation, DomainController or Unknown for SourceRole. Optional EventId, StartUtc and EndUtc filters are supported; supply Z or an explicit UTC offset. Choose a new private output folder. Private-Summary.json contains identifiers; never publish it. Review Sanitized-Review-Candidate.json before sharing. No real exports, private source paths, collection/change scripts or hardcoded lab account names are distributed here.

An empty match does not prove logging failure. Unreadable input raises an error. Current host policy may block the native reader; later case review used an offline parser, not a silently successful native adapter. Raw EVTX remains authoritative.
