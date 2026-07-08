export const meta = {
  name: 'bugfix',
  description: 'Systematic bug fixing: Debug -> Find root cause -> Fix -> Verify',
  phases: [
    { title: 'Debug', detail: 'Identify the bug behavior' },
    { title: 'Investigate', detail: 'Find root cause' },
    { title: 'Fix', detail: 'Apply the fix' },
    { title: 'Verify', detail: 'Confirm bug is resolved' },
  ],
}

var args = globalThis.args || {}
var BUG_DESC = args.description || 'unnamed bug'
var BUG_REPRO = args.repro || args.reproduction || ''

// Schema for structured findings output
var FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' }
        }
      }
    }
  }
}

// Schema for verification verdict
var VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    isReal: { type: 'boolean' },
    reason: { type: 'string' }
  }
}

phase('Debug')
log('Starting debug for: ' + BUG_DESC)

var debugInfo = await agent(
  'Debug the following issue:\n\n' +
  'Description: ' + BUG_DESC + '\n' +
  (BUG_REPRO ? 'Reproduction: ' + BUG_REPRO + '\n' : '') +
  '\nProject is a monorepo:\n' +
  '- backend/: NestJS + TypeORM + PostgreSQL (src/auth/, src/content/, src/upload/)\n' +
  '- frontend/: React 19 + TypeScript + Vite + CSS Modules\n\n' +
  'Approach:\n' +
  '1. Search codebase for likely culprits based on the bug description\n' +
  '2. Check error handling, edge cases, state management\n' +
  '3. Look for common patterns: missing null checks, race conditions, incorrect types/API mismatches\n\n' +
  'Report findings: what files are involved and what looks suspicious.',
  { label: 'Debug', phase: 'Debug', model: 'opus' }
)

phase('Investigate')
log('Investigating root cause.')

var rootCause = await agent(
  'Investigate the root cause of this bug:\n\n' +
  'Bug: ' + BUG_DESC + '\n' +
  'Debug findings: ' + debugInfo + '\n\n' +
  'Deeper investigation:\n' +
  '1. Read the suspicious files found in the debug phase\n' +
  '2. Trace the data flow\n' +
  '3. Check for: TypeScript type mismatches, null/undefined access, async/await issues\n' +
  '4. Verify against the actual file content\n\n' +
  'For each file with a bug, report:\n' +
  '- File path (repo-relative, e.g. frontend/src/pages/Home.tsx)\n' +
  '- Line number\n' +
  '- What is wrong and why it is a bug\n' +
  '- The fix (be specific)',
  { label: 'Investigate', phase: 'Investigate', schema: FINDINGS_SCHEMA }
)

phase('Fix')
log('Applying fix.')

await agent(
  'Apply the fix for this bug:\n\n' +
  'Bug: ' + BUG_DESC + '\n' +
  'Root cause: ' + JSON.stringify(rootCause) + '\n\n' +
  'Apply the fixes described in the investigation. For each fix:\n' +
  '1. Read the file first\n' +
  '2. Apply the minimal change needed (do not refactor unrelated code)\n' +
  '3. Verify the edit was applied correctly\n\n' +
  'Files to fix are in the root cause report above. Apply fixes one by one.',
  { isolation: 'worktree', label: 'Fix', phase: 'Fix' }
)

phase('Verify')
log('Verifying the fix works.')

var verifyResult = await agent(
  'Verify the bug fix:\n\n' +
  'Bug: ' + BUG_DESC + '\n' +
  'Root cause: ' + JSON.stringify(rootCause) + '\n\n' +
  'Verification:\n' +
  '1. Check TypeScript compiles: try tsc --noEmit in both backend/ and frontend/\n' +
  '2. Check lint: npm run lint\n' +
  '3. Trace the same data flow that had the bug - confirm it is now correct\n' +
  '4. Report: Is the bug 100% fixed? Any side effects?',
  { label: 'Verify fix', phase: 'Verify' }
)

log('Bugfix complete for: ' + BUG_DESC)
return {
  bug: BUG_DESC,
  verified: verifyResult.indexOf('fixed') >= 0 || verifyResult.indexOf('Fixed') >= 0
}