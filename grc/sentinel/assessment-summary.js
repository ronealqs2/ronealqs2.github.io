window.SENTINEL_SUMMARY = (() => {
  const present = value => value != null && String(value).trim() !== '';
  function hasDate(value) {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const parsed = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }
  function assessed(control) {
    return ['Design result', 'Operating result'].every(field => present(control[field]) && control[field] !== 'Not assessed');
  }
  function notFuture(value) {
    if (!hasDate(value)) return false;
    const today = new Date();
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (typeof value === 'number') {
      const serialToday = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000) + 25569;
      return value <= serialToday;
    }
    return new Date(value + 'T00:00:00') <= day;
  }
  function closureEvidence(action, evidence = []) {
    const identifier = String(action['Closure evidence IDs'] ?? '').trim();
    if (!identifier) return 'Link one primary closure evidence ID';
    const matches = evidence.filter(record => record['Evidence ID'] === identifier);
    if (matches.length !== 1) return 'Use one existing, unique evidence ID';
    const record = matches[0];
    if (!present(action['Risk ID']) || record['Risk ID'] !== action['Risk ID']) return 'Link evidence for the same risk';
    if (!notFuture(record['Received date'])) return 'Record a valid evidence received date';
    if (!present(record['Evidence location']) || !present(record.Reviewer)) return 'Record evidence location and reviewer';
    if (record.Status !== 'Reviewed') return 'Review closure evidence';
    if (record['Validation status'] !== 'Validated') return 'Validate closure evidence';
    return '';
  }
  function verified(action, evidence = []) {
    return action['Approval status'] === 'Approved' && action['Workflow status'] === 'Completed' && notFuture(action['Completed date']) && !closureEvidence(action, evidence) && action['Closure validation'] === 'Validated';
  }
  function prerequisite(action, evidence = []) {
    if (action['Approval status'] !== 'Approved') return 'Obtain approval';
    if (action['Workflow status'] === 'Completed') {
      if (!notFuture(action['Completed date'])) return 'Record a valid completion date';
      const missing = closureEvidence(action, evidence);
      if (missing) return missing;
      return action['Closure validation'] === 'Validated' ? 'Verified' : 'Validate closure';
    }
    return hasDate(action['Target date']) ? 'Implement and verify' : 'Set target date';
  }
  function summarize(tables) {
    const risks = tables['Risk Register'].rows;
    const controls = tables['Control Assessment'].rows;
    const evidence = tables['Evidence Tracker'].rows;
    const actions = tables['Remediation Tracker'].rows;
    const evidenceStages = ['Planned request', 'Requested', 'Received', 'Under review', 'Reviewed'];
    const actionStages = ['Proposed', 'Open', 'In progress', 'Blocked', 'Completed'];
    const ownerGroups = new Map();
    risks.forEach(risk => {
      const label = String(risk['Proposed owner'] || 'Unassigned').trim() || 'Unassigned';
      const key = label.toLowerCase();
      const group = ownerGroups.get(key) || {owner: label, count: 0, high: 0, pending: 0};
      group.count += 1;
      group.high += Number(['High', 'Critical'].includes(risk['Inherent rating']));
      group.pending += Number(risk['Validation status'] !== 'Validated');
      ownerGroups.set(key, group);
    });
    const key = value => String(value ?? '').trim().toLowerCase();
    const riskKeys = new Set(risks.map(risk => key(risk['Risk ID'])).filter(Boolean));
    const controlKeys = new Set(controls.map(control => key(control['Control ID'])).filter(Boolean));
    const riskFrequency = new Map();
    risks.forEach(risk => {const id = key(risk['Risk ID']); if (id) riskFrequency.set(id, (riskFrequency.get(id) || 0) + 1);});
    const quality = [
      ['Risks missing owner', risks.filter(risk => !present(risk['Proposed owner'])).length],
      ['Risks missing validation', risks.filter(risk => !present(risk['Validation status'])).length],
      ['Evidence without due date', evidence.filter(record => !present(record['Due date'])).length],
      ['Actions without target date', actions.filter(action => !present(action['Target date'])).length],
      ['Invalid evidence due dates', evidence.filter(record => present(record['Due date']) && !hasDate(record['Due date'])).length],
      ['Invalid action target dates', actions.filter(action => present(action['Target date']) && !hasDate(action['Target date'])).length],
      ['Duplicate risk ID rows', risks.filter(risk => riskFrequency.get(key(risk['Risk ID'])) > 1).length],
      ['Controls with unknown risk ID', controls.filter(control => !riskKeys.has(key(control['Risk ID']))).length],
      ['Evidence with unknown control ID', evidence.filter(record => !controlKeys.has(key(record['Control ID']))).length],
      ['Actions with unknown risk ID', actions.filter(action => !riskKeys.has(key(action['Risk ID']))).length]
    ];
    return {
      owners: [...ownerGroups.values()].sort((left, right) => right.high - left.high || right.count - left.count || left.owner.localeCompare(right.owner)),
      quality,
      riskCount: risks.length,
      pending: risks.filter(risk => risk['Validation status'] === 'Pending validation').length,
      assessed: controls.filter(assessed).length,
      designOpen: controls.filter(control => control['Design result'] === 'Not assessed').length,
      operatingOpen: controls.filter(control => control['Operating result'] === 'Not assessed').length,
      reviewed: evidence.filter(record => record.Status === 'Reviewed').length,
      verified: actions.filter(action => verified(action, evidence)).length,
      unscheduled: actions.filter(action => action['Workflow status'] !== 'Completed' && !hasDate(action['Target date'])).length,
      pendingApproval: actions.filter(action => action['Approval status'] === 'Pending approval').length,
      approved: actions.filter(action => action['Approval status'] === 'Approved').length,
      missingEvidence: risks.filter(risk => !present(risk['Evidence IDs'])).length,
      allRisksValidated: risks.length > 0 && risks.every(risk => risk['Validation status'] === 'Validated'),
      evidencePipeline: evidenceStages.map(stage => ({stage, count: evidence.filter(record => record.Status === stage).length})),
      remediationProgress: actionStages.map(stage => ({stage, count: actions.filter(action => action['Workflow status'] === stage).length})),
      scorecard: risks.slice(0, 10).map(risk => {
        const linked = records => records.filter(record => record['Risk ID'] === risk['Risk ID']);
        const riskControls = linked(controls), riskEvidence = linked(evidence), riskActions = linked(actions);
        return {risk, controls: [riskControls.filter(assessed).length, riskControls.length], evidence: [riskEvidence.filter(record => record.Status === 'Reviewed').length, riskEvidence.length], actions: [riskActions.filter(action => verified(action, evidence)).length, riskActions.length]};
      }),
      priorities: actions.map((action, index) => ({action, index, risk: risks.find(risk => risk['Risk ID'] === action['Risk ID']), next: prerequisite(action, evidence)}))
        .filter(record => !verified(record.action, evidence))
        .sort((left, right) => (right.risk?.['Inherent score'] ?? 0) - (left.risk?.['Inherent score'] ?? 0) || Number(right.action['Days overdue'] > 0) - Number(left.action['Days overdue'] > 0) || left.index - right.index)
        .slice(0, 10)
    };
  }
  return {summarize, assessed, verified, prerequisite};
})();

function dashboardSummary() {
  const summary = window.SENTINEL_SUMMARY.summarize(state.tables);
  const fraction = values => values.join(' / ');
  const progress = records => {
    const maximum = Math.max(1, ...records.map(record => record.count));
    return `<ul class="progress-list">${records.map(record => `<li><span>${escape(record.stage)}</span><div class="progress-track"><i style="width:${record.count / maximum * 100}%"></i></div><strong>${record.count}</strong></li>`).join('')}</ul>`;
  };
  return `<section class="assessment-readiness" aria-labelledby="readiness-heading">
    <div class="panel-heading"><div><h2 id="readiness-heading">Assessment readiness</h2><p>All records · independent of dashboard filters · recorded workflow, not organizational maturity</p></div></div>
    <div class="metrics">${metric('CONTROLS ASSESSED', summary.assessed, 'Both design and operating results entered')}${metric('EVIDENCE REVIEWED', summary.reviewed, 'Review stage is not evidence validation')}${metric('CLOSURES VERIFIED', summary.verified, 'All recorded closure prerequisites met')}${metric('UNSCHEDULED ACTIONS', summary.unscheduled, 'Not completed · no target date', summary.unscheduled > 0)}</div>
    <section class="panel"><div class="panel-heading"><h2>Executive insights</h2></div><div class="panel-body prose">
      <p>${summary.riskCount} risks recorded; ${summary.pending} await validation. ${summary.designOpen} controls have no design assessment; ${summary.operatingOpen} have no operating assessment.</p>
      <p>${summary.evidencePipeline[0].count} evidence requests remain planned; ${summary.reviewed} are reviewed. ${summary.pendingApproval} actions await approval; ${summary.unscheduled} open actions have no target date.</p>
      <div class="callout">${summary.allRisksValidated ? 'Risk records are marked validated. Confirm supporting assessments and reviewer approvals before sign-off.' : 'Sign-off pending. Evidence, assessment and approval prerequisites remain open.'} A completed action counts as verified only with approval, a valid nonfuture completion date, validated closure and one unique same-risk evidence record: reviewed and validated, with a valid nonfuture received date, location and reviewer. This reflects entered records, not an independent validation by this website.</div>
      <p class="traceability-note">${summary.missingEvidence ? `Traceability alert: ${summary.missingEvidence} risk records lack evidence IDs.` : 'Every risk record has an evidence ID reference; review the supporting evidence before relying on it.'} Approval must precede scheduling and implementation.</p>
    </div></section>
    <section class="panel"><div class="panel-heading"><div><h2>Risk scorecard</h2><p>First 10 registered risks · all records · assessed and reviewed do not mean effective or validated</p></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Risk scorecard records"><table class="summary-table"><thead><tr><th scope="col">Risk</th><th scope="col">Inherent</th><th scope="col">Validation</th><th scope="col">Controls assessed</th><th scope="col">Evidence reviewed</th><th scope="col">Actions verified</th></tr></thead><tbody>${summary.scorecard.length ? summary.scorecard.map(record => `<tr><td><span class="record-id">${escape(record.risk['Risk ID'])}</span><br>${escape(record.risk['Risk title'])}</td><td>${record.risk['Inherent score'] ?? 'Unassessed'} ${badge(record.risk['Inherent rating'])}</td><td>${badge(record.risk['Validation status'])}</td><td>${fraction(record.controls)}</td><td>${fraction(record.evidence)}</td><td>${fraction(record.actions)}</td></tr>`).join('') : '<tr><td colspan="6">No risks registered.</td></tr>'}</tbody></table></div></section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><h2>Evidence pipeline</h2></div><div class="panel-body">${progress(summary.evidencePipeline)}<p class="context-note">Stages reflect request workflow. Reviewed evidence still requires a supported validation conclusion.</p></div></section><section class="panel"><div class="panel-heading"><h2>Remediation progress</h2></div><div class="panel-body">${progress(summary.remediationProgress)}<p class="context-note">Approved actions: ${summary.approved} / ${rows('remediation').length}. Completed means implementation recorded; verified closure requires every prerequisite.</p></div></section></div>
    <section class="panel"><div class="panel-heading"><div><h2>Priority actions</h2><p>Top 10 unverified actions · inherent score, then overdue status; source order breaks ties</p></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Priority action records"><table class="summary-table"><thead><tr><th scope="col">Action / risk</th><th scope="col">Proposed owner</th><th scope="col">Risk score</th><th scope="col">Approval</th><th scope="col">Workflow</th><th scope="col">Target date</th><th scope="col">Next prerequisite</th></tr></thead><tbody>${summary.priorities.length ? summary.priorities.map(record => `<tr><td><span class="record-id">${escape(record.action['Action ID'])}</span> / ${escape(record.action['Risk ID'])}</td><td>${escape(record.action['Proposed owner'] || 'Not assigned')}</td><td>${record.risk?.['Inherent score'] ?? 'Not scored'}</td><td>${badge(record.action['Approval status'])}</td><td>${badge(record.action['Workflow status'])}</td><td>${escape(dateValue(record.action['Target date']) || 'Not scheduled')}</td><td>${escape(record.next)}</td></tr>`).join('') : '<tr><td colspan="7">No unverified actions recorded.</td></tr>'}</tbody></table></div></section>
    <section class="panel" aria-labelledby="ownership-heading"><div class="panel-heading"><div><h2 id="ownership-heading">Risk ownership</h2><p>All registered risks · proposed assignments · case variations combined</p></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Risk ownership records"><table class="summary-table"><thead><tr><th scope="col">Proposed owner</th><th scope="col">Risks</th><th scope="col">High / Critical</th><th scope="col">Not validated</th></tr></thead><tbody>${summary.owners.length ? summary.owners.map(group => `<tr><td>${escape(group.owner)}</td><td>${group.count}</td><td>${group.high}</td><td>${group.pending}</td></tr>`).join('') : '<tr><td colspan="4">No risks registered.</td></tr>'}</tbody></table></div></section>
    <section class="panel" aria-labelledby="quality-heading"><div class="panel-heading"><div><h2 id="quality-heading">Data quality and scheduling</h2><p>All records · missing dates are unscheduled, not overdue · counts identify records needing review</p></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Data quality checks"><table class="summary-table"><thead><tr><th scope="col">Check</th><th scope="col">Affected records</th><th scope="col">Review</th></tr></thead><tbody>${summary.quality.map(([label, count]) => `<tr><td>${escape(label)}</td><td>${count}</td><td>${count ? 'Review records' : 'No issue detected'}</td></tr>`).join('')}</tbody></table></div><div class="panel-body"><p class="context-note">These checks inspect recorded fields and links. They do not confirm evidence reliability, approved ownership or control effectiveness. Duplicate counts represent affected rows.</p><a class="text-link" href="index.html#executive-reporting">Explore the enhanced Excel dashboard and reporting notes ↗</a></div></section>
    <p class="context-note">Training scenario · provisional risk ratings are not organization-wide maturity scores. No maturity percentage is inferred.</p>
  </section>`;
}
