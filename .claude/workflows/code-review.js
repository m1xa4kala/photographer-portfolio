export const meta = {
  name: 'code-review',
  description: 'Comprehensive code review: Parallel reviews across dimensions -> Adversarial verification -> Synthesis',
  phases: [
    { title: 'Review', detail: 'Parallel review across dimensions' },
    { title: 'Verify', detail: 'Adversarially verify findings' },
    { title: 'Synthesize', detail: 'Compile final report' },
  ],
}

var args = globalThis.args || {}
var SCOPE = args.scope || ''

// Schema for findings
var FINDING_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' },
          severity: { type: 'string' }
        }
      }
    }
  }
}

// Schema for verification
var VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    isReal: { type: 'boolean' },
    reason: { type: 'string' }
  }
}

// Schema for quick verification
var QUICK_VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    isReal: { type: 'boolean' }
  }
}

phase('Review')
log('Starting code review' + (SCOPE ? ' for scope: ' + SCOPE : '') + '.')

// Get the current diff
var diffInfo = await agent(
  'Get code review scope.\n\n' +
  'Project: photographer-project monorepo (NestJS backend + React frontend)\n\n' +
  (SCOPE ? 'Focus on scope: ' + SCOPE + '\n\n' : 'Review ALL changed files.\n\n') +
  'Run: git diff --stat (shows changed files)\n' +
  'Also check: git diff (shows the actual changes)\n\n' +
  'Report back the list of files changed and their change types (added/modified/deleted).',
  { label: 'Get diff', phase: 'Review' }
)

// Run 3 parallel reviews
var results = await parallel([
  function() {
    return agent(
      'Review for CORRECTNESS bugs in these files:\n\n' + diffInfo + '\n\n' +
      'Check for:\n' +
      '1. Logic errors, off-by-one, null/undefined access\n' +
      '2. Async/await issues, promise handling\n' +
      '3. Type mismatches (TypeScript)\n' +
      '4. Race conditions, stale closures\n' +
      '5. Missing error handling\n' +
      '6. Incorrect API usage\n\n' +
      'For each bug found, report: FILE:LINENUM - Description - Severity (HIGH/MEDIUM/LOW)',
      { label: 'Review: correctness', phase: 'Review', schema: FINDING_SCHEMA }
    )
  },
  function() {
    return agent(
      'Review for SECURITY & PERFORMANCE issues in these files:\n\n' + diffInfo + '\n\n' +
      'Check for:\n' +
      '1. SQL injection, XSS, path traversal\n' +
      '2. Missing authorization checks\n' +
      '3. Insecure file upload handling\n' +
      '4. N+1 queries, missing indexes\n' +
      '5. Memory leaks, unnecessary re-renders\n' +
      '6. Large bundle imports\n\n' +
      'For each issue found, report: FILE:LINENUM - Description - Severity (HIGH/MEDIUM/LOW)',
      { label: 'Review: security/perf', phase: 'Review', schema: FINDING_SCHEMA }
    )
  },
  function() {
    return agent(
      'Review for CODE QUALITY concerns in these files:\n\n' + diffInfo + '\n\n' +
      'Check for:\n' +
      '1. Violation of existing patterns (useAdminCrud, useFetch, CSS Modules)\n' +
      '2. Missing loading/error/empty states\n' +
      '3. Hardcoded strings that should be constants\n' +
      '4. Duplicate code that should be shared\n' +
      '5. CSS: unused classes, missing responsive behavior\n' +
      '6. Accessibility issues (missing aria, keyboard nav)\n' +
      '7. Import organization, dead code\n\n' +
      'For each issue found, report: FILE:LINENUM - Description - Severity (HIGH/MEDIUM/LOW)',
      { label: 'Review: code quality', phase: 'Review', schema: FINDING_SCHEMA }
    )
  }
])

// Process results
var allFindings = []
for (var i = 0; i < results.length; i++) {
  if (results[i] && results[i].findings) {
    allFindings = allFindings.concat(results[i].findings)
  }
}
log('Found ' + allFindings.length + ' total findings from all dimensions.')

phase('Verify')
log('Adversarially verifying ' + allFindings.length + ' findings.')

// Separate by severity
var highFindings = []
var mediumFindings = []
var lowFindings = []
for (var i = 0; i < allFindings.length; i++) {
  if (allFindings[i].severity === 'HIGH') highFindings.push(allFindings[i])
  else if (allFindings[i].severity === 'MEDIUM') mediumFindings.push(allFindings[i])
  else lowFindings.push(allFindings[i])
}

// Verify HIGH findings
var verifiedHigh = await parallel(
  highFindings.map(function(f) {
    return function() {
      return agent(
        'Adversarially verify this finding. Try to REFUTE it.\n\n' +
        'Finding: ' + f.description + '\n' +
        'File: ' + (f.file || '?') + ':' + (f.line || '0') + '\n\n' +
        'Read the actual file content. Default to "refuted" if uncertain.\n' +
        'Only confirm if you are SURE the bug is real.',
        { label: 'Verify: ' + (f.file || '?'), phase: 'Verify', schema: VERIFY_SCHEMA }
      ).then(function(v) { return { finding: f, verdict: v } })
    }
  })
)

var confirmedFindings = []
for (var i = 0; i < verifiedHigh.length; i++) {
  if (verifiedHigh[i] && verifiedHigh[i].verdict && verifiedHigh[i].verdict.isReal) {
    confirmedFindings.push(verifiedHigh[i].finding)
  }
}

// Verify MEDIUM findings (lighter check)
var mediumLimit = mediumFindings.slice(0, 10)
var verifiedMedium = await parallel(
  mediumLimit.map(function(f) {
    return function() {
      return agent(
        'Quick check: Is this issue real?\n\n' +
        'File: ' + (f.file || '?') + '\n' +
        'Issue: ' + f.description + '\n\n' +
        'Read the actual file content. Return { isReal: boolean }.',
        { label: 'Quick verify: ' + (f.file || '?'), phase: 'Verify', schema: QUICK_VERIFY_SCHEMA }
      ).then(function(v) { return { finding: f, verdict: v } })
    }
  })
)

var confirmedMedium = []
for (var i = 0; i < verifiedMedium.length; i++) {
  if (verifiedMedium[i] && verifiedMedium[i].verdict && verifiedMedium[i].verdict.isReal) {
    confirmedMedium.push(verifiedMedium[i].finding)
  }
}

phase('Synthesize')
log('Synthesizing final report.')

var allConfirmed = confirmedFindings.concat(confirmedMedium)
var confirmedHigh = confirmedFindings // all verified HIGH that survived
var confirmedMed = confirmedMedium

var report = await agent(
  'Compile the final code review report.\n\n' +
  'Confirmed findings (' + allConfirmed.length + '):\n' +
  JSON.stringify(allConfirmed, null, 2) + '\n\n' +
  'Low-severity suggestions (' + lowFindings.length + '):\n' +
  JSON.stringify(lowFindings, null, 2) + '\n\n' +
  'Changed files:\n' + diffInfo + '\n\n' +
  'Write a concise markdown report covering:\n' +
  '1. Summary: N confirmed bugs + N suggestions\n' +
  '2. Critical issues that must be fixed (HIGH severity, confirmed)\n' +
  '3. Medium issues worth addressing\n' +
  '4. Low severity suggestions\n' +
  '5. Overall assessment',
  { label: 'Synthesize report', phase: 'Synthesize' }
)

return {
  totalFindings: allFindings.length,
  highCount: confirmedHigh.length,
  mediumCount: confirmedMed.length,
  lowCount: lowFindings.length,
  report: report
}