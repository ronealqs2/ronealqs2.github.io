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
  function verified(action) {
    return action['Approval status'] === 'Approved' && action['Workflow status'] === 'Completed' && hasDate(action['Completed date']) && present(action['Closure evidence IDs']) && action['Closure validation'] === 'Validated';
  }
  function prerequisite(action) {
    if (action['Approval status'] !== 'Approved') return 'Obtain approval';
    if (action['Workflow status'] === 'Completed') {
      if (!hasDate(action['Completed date'])) return 'Record completion date';
      if (!present(action['Closure evidence IDs'])) return 'Link closure evidence';
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
    return {
      riskCount: risks.length,
      pending: risks.filter(risk => risk['Validation status'] === 'Pending validation').length,
      assessed: controls.filter(assessed).length,
      designOpen: controls.filter(control => control['Design result'] === 'Not assessed').length,
      operatingOpen: controls.filter(control => control['Operating result'] === 'Not assessed').length,
      reviewed: evidence.filter(record => record.Status === 'Reviewed').length,
      verified: actions.filter(verified).length,
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
        return {risk, controls: [riskControls.filter(assessed).length, riskControls.length], evidence: [riskEvidence.filter(record => record.Status === 'Reviewed').length, riskEvidence.length], actions: [riskActions.filter(verified).length, riskActions.length]};
      }),
      priorities: actions.map((action, index) => ({action, index, risk: risks.find(risk => risk['Risk ID'] === action['Risk ID']), next: prerequisite(action)}))
        .filter(record => !verified(record.action))
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
      <div class="callout">${summary.allRisksValidated ? 'Risk records are marked validated. Confirm supporting assessments and reviewer approvals before sign-off.' : 'Sign-off pending. Evidence, assessment and approval prerequisites remain open.'} A completed action counts as verified only with approval, a completion date, closure evidence IDs and validated closure. This reflects entered records, not an independent validation by this website.</div>
      <p class="traceability-note">${summary.missingEvidence ? `Traceability alert: ${summary.missingEvidence} risk records lack evidence IDs.` : 'Every risk record has an evidence ID reference; review the supporting evidence before relying on it.'} Approval must precede scheduling and implementation.</p>
    </div></section>
    <section class="panel"><div class="panel-heading"><div><h2>Risk scorecard</h2><p>First 10 registered risks · all records · assessed and reviewed do not mean effective or validated</p></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Risk scorecard records"><table class="summary-table"><thead><tr><th scope="col">Risk</th><th scope="col">Inherent</th><th scope="col">Validation</th><th scope="col">Controls assessed</th><th scope="col">Evidence reviewed</th><th scope="col">Actions verified</th></tr></thead><tbody>${summary.scorecard.length ? summary.scorecard.map(record => `<tr><td><span class="record-id">${escape(record.risk['Risk ID'])}</span><br>${escape(record.risk['Risk title'])}</td><td>${record.risk['Inherent score'] ?? 'Unassessed'} ${badge(record.risk['Inherent rating'])}</td><td>${badge(record.risk['Validation status'])}</td><td>${fraction(record.controls)}</td><td>${fraction(record.evidence)}</td><td>${fraction(record.actions)}</td></tr>`).join('') : '<tr><td colspan="6">No risks registered.</td></tr>'}</tbody></table></div></section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><h2>Evidence pipeline</h2></div><div class="panel-body">${progress(summary.evidencePipeline)}<p class="context-note">Stages reflect request workflow. Reviewed evidence still requires a supported validation conclusion.</p></div></section><section class="panel"><div class="panel-heading"><h2>Remediation progress</h2></div><div class="panel-body">${progress(summary.remediationProgress)}<p class="context-note">Approved actions: ${summary.approved} / ${rows('remediation').length}. Completed means implementation recorded; verified closure requires every prerequisite.</p></div></section></div>
    <section class="panel"><div class="panel-heading"><div><h2>Priority actions</h2><p>Top 10 unverified actions · inherent score, then overdue status; source order breaks ties</p></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Priority action records"><table class="summary-table"><thead><tr><th scope="col">Action / risk</th><th scope="col">Proposed owner</th><th scope="col">Risk score</th><th scope="col">Approval</th><th scope="col">Workflow</th><th scope="col">Target date</th><th scope="col">Next prerequisite</th></tr></thead><tbody>${summary.priorities.length ? summary.priorities.map(record => `<tr><td><span class="record-id">${escape(record.action['Action ID'])}</span> / ${escape(record.action['Risk ID'])}</td><td>${escape(record.action['Proposed owner'] || 'Not assigned')}</td><td>${record.risk?.['Inherent score'] ?? 'Not scored'}</td><td>${badge(record.action['Approval status'])}</td><td>${badge(record.action['Workflow status'])}</td><td>${escape(dateValue(record.action['Target date']) || 'Not scheduled')}</td><td>${escape(record.next)}</td></tr>`).join('') : '<tr><td colspan="7">No unverified actions recorded.</td></tr>'}</tbody></table></div></section>
    <p class="context-note">Training scenario · provisional risk ratings are not organization-wide maturity scores. No maturity percentage is inferred.</p>
  </section>`;
}
