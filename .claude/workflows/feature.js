export const meta = {
  name: 'feature',
  description: 'End-to-end feature development: Plan -> Backend -> Frontend -> Migration -> Verify',
  phases: [
    { title: 'Plan', detail: 'Design architecture and components' },
    { title: 'Backend', detail: 'Entities, DTOs, services, controllers, modules' },
    { title: 'Frontend', detail: 'Components, hooks, pages, styles' },
    { title: 'Migration', detail: 'Generate and run DB migrations' },
    { title: 'Verify', detail: 'Lint and verify changes' },
  ],
}

const args = globalThis.args || {}
const FEATURE_NAME = args.feature || args.name || 'unnamed-feature'
const DESCRIPTION = args.description || 'Implement ' + FEATURE_NAME

// Schema for the plan output — forces structured text return
const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    plan: { type: 'string', description: 'Complete architecture plan with file paths, data flow, and implementation steps' }
  },
  required: ['plan']
}

// Patterns that indicate backend vs frontend changes
const BACKEND_PATTERNS = /entity|controller|service|module|dto|repository|guard|provider|backend/i
const FRONTEND_PATTERNS = /component|page|hook|style|css|module\.css|frontend|tsx|jsx/i
const MIGRATION_PATTERNS = /migration|entity|field|column|table|schema|relation/i

phase('Plan')
log('Planning feature: ' + FEATURE_NAME)

const planResult = await agent(
  'Design the architecture for: ' + DESCRIPTION + '\n\n' +
  'Project is a monorepo:\n' +
  '- backend/: NestJS + TypeORM + PostgreSQL (entities in src/content/entities/, services, controllers)\n' +
  '- frontend/: React 19 + TypeScript + Vite + CSS Modules\n\n' +
  'Current entities: best_photos, portfolio_categories/sessions/photos, price_items, reviews, about\n\n' +
  'Provide:\n' +
  '1. What backend changes are needed (new entities, DTOs, controllers, services)\n' +
  '2. What frontend changes are needed (components, pages, hooks, types)\n' +
  '3. Data flow diagram\n' +
  '4. File list with exact paths',
  { label: 'Plan ' + FEATURE_NAME, phase: 'Plan', schema: PLAN_SCHEMA }
)

const plan = planResult ? planResult.plan : ''
log('Plan ready.')

phase('Backend')
log('Implementing backend for: ' + FEATURE_NAME)

const hasBackend = BACKEND_PATTERNS.test(plan)

if (hasBackend) {
  try {
    await agent(
      'Implement backend changes for: ' + DESCRIPTION + '\n\n' +
      'Project context:\n' +
      '- NestJS backend in backend/src/\n' +
      '- Entities in src/content/entities/\n' +
      '- Services in src/content/services/\n' +
      '- Controllers in src/content/\n' +
      '- Admin controllers in src/content/ (prefixed with Admin*)\n' +
      '- All entities with orderIndex get reorder endpoint\n' +
      '- DTOs in src/content/dtos/\n' +
      '- Register new modules/services in src/content/content.module.ts\n\n' +
      'Plan:\n' + plan + '\n\n' +
      'Implement ALL backend code files. For each output the full path and complete content.',
      { isolation: 'worktree', label: 'Backend ' + FEATURE_NAME, phase: 'Backend' }
    )
    log('Backend implementation complete.')
  } catch (err) {
    log('ERROR: Backend implementation failed: ' + (err.message || err))
    throw err
  }
} else {
  log('No backend changes needed.')
}

phase('Frontend')
log('Implementing frontend for: ' + FEATURE_NAME)

const hasFrontend = FRONTEND_PATTERNS.test(plan)

if (hasFrontend) {
  try {
    await agent(
      'Implement frontend changes for: ' + DESCRIPTION + '\n\n' +
      'Project context:\n' +
      '- React 19 + TypeScript + Vite in frontend/\n' +
      '- CSS Modules for styling (*.module.css)\n' +
      '- API client at src/services/api.ts (Axios with JWT interceptor)\n' +
      '- Hooks: useFetch<T>, useAdminCrud<T>, useUploadImage\n' +
      '- Types in src/types/index.ts\n' +
      '- Admin pages use: DraggableTable, DropZone, AnimatedSection, Skeleton\n' +
      '- Admin CRUD pattern: useAdminCrud(baseUrl) -> items/loading/error/createItem/updateItem/deleteItem/reorderItems\n' +
      '- Routing: React Router v7\n\n' +
      'Plan:\n' + plan + '\n\n' +
      'Implement ALL frontend code files. For each output the full path and complete content.',
      { isolation: 'worktree', label: 'Frontend ' + FEATURE_NAME, phase: 'Frontend' }
    )
    log('Frontend implementation complete.')
  } catch (err) {
    log('ERROR: Frontend implementation failed: ' + (err.message || err))
    throw err
  }
} else {
  log('No frontend changes needed.')
}

phase('Migration')
log('Checking for required database migrations.')

const needsMigration = MIGRATION_PATTERNS.test(plan)

if (needsMigration) {
  try {
    await agent(
      'Handle database migrations for: ' + DESCRIPTION + '\n\n' +
      'Project context:\n' +
      '- NestJS + TypeORM\n' +
      '- Migrations in backend/src/migrations/\n' +
      '- TypeORM migration:generate detects entity changes and creates migration file\n' +
      '- Run: cd backend && npm run migration:generate\n' +
      '- Then verify: cd backend && npm run migration:run\n\n' +
      'Plan:\n' + plan + '\n\n' +
      'Steps:\n' +
      '1. Check what entity changes were made\n' +
      '2. Ensure Docker PostgreSQL is running (npm run db:start)\n' +
      '3. Generate migration via npm run migration:generate\n' +
      '4. Run migration via npm run migration:run\n' +
      '5. Verify no errors',
      { label: 'Migration ' + FEATURE_NAME, phase: 'Migration' }
    )
    log('Migration complete.')
  } catch (err) {
    log('ERROR: Migration failed: ' + (err.message || err))
    throw err
  }
} else {
  log('No migrations needed.')
}

phase('Verify')
log('Verifying feature: ' + FEATURE_NAME)

const verifyResult = await agent(
  'Verify the implementation of: ' + DESCRIPTION + '\n\n' +
  'Check:\n' +
  '1. Backend: ts compiles, entities are registered, routes work\n' +
  '2. Frontend: ts compiles, components render, routing works\n' +
  '3. Lint passes: npm run lint\n' +
  '4. No obvious bugs or issues\n\n' +
  'Feature plan:\n' + plan + '\n\n' +
  'Run checks and report any issues found.',
  { label: 'Verify ' + FEATURE_NAME, phase: 'Verify' }
)

log('Feature "' + FEATURE_NAME + '" complete.')
return { feature: FEATURE_NAME, verifyResult: verifyResult.substring(0, 500) }