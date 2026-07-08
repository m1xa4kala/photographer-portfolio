export const meta = {
  name: 'migration',
  description: 'Database migration workflow: Analyze entity changes -> Generate -> Run -> Verify',
  phases: [
    { title: 'Analyze', detail: 'Review entity changes' },
    { title: 'Generate', detail: 'Create migration file' },
    { title: 'Run', detail: 'Apply migration to database' },
    { title: 'Verify', detail: 'Confirm migration succeeded' },
  ],
}

var args = globalThis.args || {}
var MIGRATION_DESC = args.description || 'Apply pending entity changes'

phase('Analyze')
log('Analyzing entity changes for: ' + MIGRATION_DESC)

var analysis = await agent(
  'Analyze database entity changes needed.\n\n' +
  'Project: NestJS + TypeORM + PostgreSQL\n' +
  'Entities in: backend/src/content/entities/\n\n' +
  'Current entities: best_photos, portfolio_categories, portfolio_sessions, portfolio_photos, price_items, reviews, about\n' +
  'Migrations in: backend/src/migrations/\n\n' +
  'Context: ' + MIGRATION_DESC + '\n\n' +
  '1. Read current entity files to see their structure\n' +
  '2. Check if there are uncommitted entity changes (git diff)\n' +
  '3. Check what is in the latest migration files to understand the current schema\n' +
  '4. Report what changes are needed and which entities are affected',
  { label: 'Analyze entities', phase: 'Analyze', model: 'opus' }
)

phase('Generate')
log('Generating migration based on analysis.')

var generationResult = await agent(
  'Generate TypeORM migration.\n\n' +
  'Analysis: ' + analysis + '\n\n' +
  'Steps:\n' +
  '1. First check if Docker PostgreSQL is running: docker compose --profile dev ps\n' +
  '   - If not running, start it: npm run db:start\n' +
  '   - Wait for it to be ready\n' +
  '2. Make sure backend/.env exists with proper config\n' +
  '3. Run: cd backend && npm run migration:generate\n' +
  '   - This creates a new migration file in src/migrations/\n' +
  '4. Read the generated migration file to verify it is correct\n' +
  '5. Report: was migration generated successfully? What does it do?\n\n' +
  'If npm run migration:generate fails, read the error and try to fix it.',
  { label: 'Generate migration', phase: 'Generate' }
)

phase('Run')
log('Running migration against database.')

var runResult = await agent(
  'Run the generated migration.\n\n' +
  'Context: ' + generationResult + '\n\n' +
  'Steps:\n' +
  '1. Ensure Docker PostgreSQL is running\n' +
  '2. Run: cd backend && npm run migration:run\n' +
  '3. Report output and any errors\n\n' +
  'If it fails, diagnose and fix:\n' +
  '- Check data-source.ts config\n' +
  '- Check if there is a conflict with synchronize\n' +
  '- Report what went wrong',
  { label: 'Run migration', phase: 'Run' }
)

phase('Verify')
log('Verifying migration.')

var verifyResult = await agent(
  'Verify the migration was applied correctly.\n\n' +
  'Context: ' + MIGRATION_DESC + '\n\n' +
  'Steps:\n' +
  '1. Run: cd backend && npx typeorm migration:show -d src/data-source.ts\n' +
  '   (This shows pending vs run migrations)\n' +
  '2. Verify the new migration shows as applied\n' +
  '3. Check the table structure via a quick query\n' +
  '4. Report: Migration status - SUCCESS or FAILED\n\n' +
  'Also check:\n' +
  '- Did the migration match what was expected?\n' +
  '- Any data loss risk?\n' +
  '- Any rollback plan needed?',
  { label: 'Verify migration', phase: 'Verify' }
)

log('Migration complete.')
return {
  analysis: analysis.substring(0, 500),
  verifyResult: verifyResult.substring(0, 500)
}