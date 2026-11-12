[CmdletBinding()]
param(
 [string[]]$Path,
 [ValidateSet('Workstation','DomainController','Unknown')][string]$SourceRole='Unknown',
 [int[]]$EventId=@(4624,4625,4768,4769,4771,4776),
 [string]$StartUtc,
 [string]$EndUtc,
 [string]$OutputDirectory
)

function ConvertTo-ExplicitUtc {
 param([string]$Value)
 if ([string]::IsNullOrWhiteSpace($Value) -or $Value -notmatch '(Z|[+-]\d{2}:\d{2})$') {throw 'Timestamp requires Z or an explicit UTC offset.'}
 [DateTimeOffset]::Parse($Value,[Globalization.CultureInfo]::InvariantCulture,[Globalization.DateTimeStyles]::None).ToUniversalTime()
}

function ConvertFrom-LabEventXml {
 param([Parameter(Mandatory)][string]$EventXml,[string]$Role='Unknown',[string]$SourceFile)
 $settings=[Xml.XmlReaderSettings]::new();$settings.DtdProcessing=[Xml.DtdProcessing]::Prohibit;$settings.XmlResolver=$null
 $reader=[Xml.XmlReader]::Create([IO.StringReader]::new($EventXml),$settings)
 try {$doc=[Xml.XmlDocument]::new();$doc.XmlResolver=$null;$doc.Load($reader)} finally {$reader.Dispose()}
 $ns=[Xml.XmlNamespaceManager]::new($doc.NameTable);$ns.AddNamespace('e','http://schemas.microsoft.com/win/2004/08/events/event')
 $system=$doc.SelectSingleNode('/e:Event/e:System',$ns)
 if ($null -eq $system) {throw 'Missing Windows event System element.'}
 $idNode=$system.SelectSingleNode('e:EventID',$ns);$idNumber=0
 if ($null -eq $idNode -or -not [int]::TryParse($idNode.InnerText,[ref]$idNumber)) {throw 'Missing or invalid EventID.'}
 $fields=@{};foreach($node in $doc.SelectNodes('/e:Event/e:EventData/e:Data',$ns)) {$fields[$node.GetAttribute('Name')]=$node.InnerText}
 $warnings=[System.Collections.Generic.List[string]]::new()
 $utc=$null;$time=$system.SelectSingleNode('e:TimeCreated',$ns)
 try {if($null -eq $time){throw 'Missing timestamp'};$utc=(ConvertTo-ExplicitUtc $time.GetAttribute('SystemTime')).ToString('o')} catch {$warnings.Add('MissingOrInvalidTimestamp')}
 $record=$system.SelectSingleNode('e:EventRecordID',$ns);$computer=$system.SelectSingleNode('e:Computer',$ns);$provider=$system.SelectSingleNode('e:Provider',$ns);$channel=$system.SelectSingleNode('e:Channel',$ns)
 $kind=switch($idNumber){4624{'LogonSuccess'}4625{'LogonFailure'}4768{'KerberosTgtRequest'}4769{'KerberosServiceTicketRequest'}4771{'KerberosPreauthenticationFailure'}4776{'NtlmCredentialValidation'}default{'Other'}}
 # Named fields are optional. Missing fields remain null, never a success code.
 $logonType=$null
 if($idNumber -in @(4624,4625)) {
  $parsedType=0
  if($fields.ContainsKey('LogonType') -and [int]::TryParse($fields['LogonType'],[ref]$parsedType)) {$logonType=$parsedType} else {$warnings.Add('MissingOrInvalidLogonType')}
 }
 [pscustomobject]@{
  SourceRole=$Role;SourceFile=$SourceFile;Computer=if($computer){$computer.InnerText}else{$null}
  Provider=if($provider){$provider.GetAttribute('Name')}else{$null};Channel=if($channel){$channel.InnerText}else{$null}
  EventId=$idNumber;EventRecordId=if($record){$record.InnerText}else{$null};EventUtc=$utc;Kind=$kind;LogonType=$logonType
  Status=if($fields.ContainsKey('Status')){$fields['Status']}else{$null}
  SubStatus=if($fields.ContainsKey('SubStatus')){$fields['SubStatus']}else{$null}
  TargetAccount=if($fields.ContainsKey('TargetUserName')){$fields['TargetUserName']}else{$null}
  TargetDomain=if($fields.ContainsKey('TargetDomainName')){$fields['TargetDomainName']}else{$null}
  AuthenticationPackage=if($fields.ContainsKey('AuthenticationPackageName')){$fields['AuthenticationPackageName']}elseif($fields.ContainsKey('PackageName')){$fields['PackageName']}else{$null}
  CallerProcess=if($fields.ContainsKey('ProcessName')){$fields['ProcessName']}else{$null}
  Warnings=@($warnings.ToArray())
 }
}

function Get-LabEventSummary {
 param([Parameter(Mandatory)][string[]]$InputPath,[string]$Role='Unknown',[int[]]$Ids=@(4624,4625,4768,4769,4771,4776),[string]$FromUtc,[string]$ToUtc)
 $from=$null;$to=$null
 if($FromUtc){$from=ConvertTo-ExplicitUtc $FromUtc};if($ToUtc){$to=ConvertTo-ExplicitUtc $ToUtc}
 if($null -ne $from -and $null -ne $to -and $from -gt $to){throw 'Start time must not follow end time.'}
 $events=[System.Collections.Generic.List[object]]::new();$sources=[System.Collections.Generic.List[object]]::new();$excluded=0;$readCount=0
 foreach($inputFile in $InputPath){
  $resolved=(Resolve-Path -LiteralPath $inputFile -ErrorAction Stop).Path
  $hashBefore=(Get-FileHash -LiteralPath $resolved -Algorithm SHA256 -ErrorAction Stop).Hash
  # Errors are not treated as zero matches. An unreadable/invalid export stops analysis.
  $records=@(Get-WinEvent -Path $resolved -Oldest -ErrorAction Stop)
  foreach($record in $records){
   $row=ConvertFrom-LabEventXml -EventXml $record.ToXml() -Role $Role -SourceFile $resolved;$readCount++
   if($row.EventId -notin $Ids){continue}
   if($null -ne $from -or $null -ne $to){
    if($null -eq $row.EventUtc){$excluded++;continue}
    $when=ConvertTo-ExplicitUtc $row.EventUtc
    if(($null -ne $from -and $when -lt $from) -or ($null -ne $to -and $when -gt $to)){continue}
   }
   $events.Add($row)
  }
  $hashAfter=(Get-FileHash -LiteralPath $resolved -Algorithm SHA256 -ErrorAction Stop).Hash
  if($hashBefore -ne $hashAfter){throw 'Input file changed during analysis.'}
  $sources.Add([pscustomobject]@{Path=$resolved;SHA256=$hashBefore;Unchanged=$true;RecordsRead=$records.Count})
 }
 [pscustomobject]@{
  SchemaVersion=1;AnalysisHostUtc=[DateTime]::UtcNow.ToString('o');SourceRole=$Role
  Query=[pscustomobject]@{EventIds=@($Ids);StartUtc=if($null -ne $from){$from.ToString('o')}else{$null};EndUtc=if($null -ne $to){$to.ToString('o')}else{$null};Bounds='Inclusive';Scope='Supplied saved exports only'}
  Sources=@($sources.ToArray());RecordsRead=$readCount;MatchingEvents=$events.Count;ExcludedUnknownTime=$excluded
  Events=@($events.ToArray() | Sort-Object EventUtc,EventRecordId)
  Limitations=@('Guest event timestamps are not independently trusted wall-clock times.','No match in supplied exports does not prove a logging failure.','Negotiate alone does not identify the selected Kerberos/NTLM path.','A later retest cannot establish the historical cause.')
 }
}

function ConvertTo-LabPublicationCandidate {
 param([Parameter(Mandatory)]$Summary)
 # Explicit allowlist: never copy names, addresses, source paths, record IDs or caller text.
 $publicEvents=@(foreach($row in $Summary.Events){[pscustomobject]@{SourceRole=$row.SourceRole;EventId=$row.EventId;Kind=$row.Kind;LogonType=$row.LogonType;Status=$row.Status;SubStatus=$row.SubStatus;TimestampAvailable=($null -ne $row.EventUtc)}})
 [pscustomobject]@{SchemaVersion=1;ReviewStatus='Sanitized candidate; not published';Scope='Historical saved lab events; not a production incident';SourceRole=$Summary.SourceRole;MatchingEvents=$Summary.MatchingEvents;Events=$publicEvents;Limitations=@($Summary.Limitations)}
}

if($MyInvocation.InvocationName -ne '.') {
 if(-not $Path){throw 'Supply saved lab EVTX paths with -Path. This tool never reads live logs.'}
 $summary=Get-LabEventSummary -InputPath $Path -Role $SourceRole -Ids $EventId -FromUtc $StartUtc -ToUtc $EndUtc
 if($OutputDirectory){
  if(Test-Path -LiteralPath $OutputDirectory){throw 'Choose a new private output directory; existing output is not overwritten.'}
  New-Item -ItemType Directory -Path $OutputDirectory -ErrorAction Stop | Out-Null
  $summary | ConvertTo-Json -Depth 9 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'Private-Summary.json') -Encoding UTF8
  ConvertTo-LabPublicationCandidate $summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'Sanitized-Review-Candidate.json') -Encoding UTF8
  Write-Output ('Private review saved to '+$OutputDirectory)
 } else {$summary | ConvertTo-Json -Depth 9}
}
