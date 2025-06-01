# Food Vision AI - Technical Context

## Development Environment

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Project Setup
```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Start development server
npm run dev
```

## Technology Stack

### Frontend
1. **Core Technologies**
   - React 18
   - TypeScript
   - Vite
   - React Router v6

2. **UI Framework**
   - Radix UI primitives
   - Tailwind CSS
   - Custom UI components
   - RTL support

3. **State Management**
   - React Query
   - React Context
   - Local state

### Backend (Supabase)
1. **Core Services**
   - PostgreSQL Database
   - Authentication
   - Storage
   - Real-time subscriptions

2. **API Integration**
   - REST API
   - Real-time WebSocket
   - Storage API

## Dependencies

### Production Dependencies
```json
{
  "@hookform/resolvers": "^3.9.0",
  "@radix-ui/react-*": "^1.x",
  "@supabase/supabase-js": "^2.49.4",
  "@tanstack/react-query": "^5.56.2",
  "date-fns": "^4.1.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-hook-form": "^7.x",
  "tailwindcss": "^3.x"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.x",
  "vite": "^5.x",
  "eslint": "^8.x",
  "prettier": "^3.x"
}
```

## Configuration Files

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Development Practices

### Code Organization
```
src/
├── api/          # API integration
├── components/   # React components
├── hooks/        # Custom hooks
├── layouts/      # Layout components
├── lib/          # Utilities
├── pages/        # Route components
├── types/        # TypeScript types
└── utils/        # Helper functions
```

### Coding Standards
1. **TypeScript**
   - Strict type checking
   - Interface-first design
   - Proper type exports

2. **React**
   - Functional components
   - Custom hooks for logic
   - Proper prop typing

3. **Styling**
   - Tailwind CSS classes
   - CSS modules when needed
   - RTL considerations

4. **Database & Migrations (Supabase/PostgreSQL)**
   - When working with Supabase ENUM types, ensure that the exact string values (case-sensitive, language-specific, e.g., Hebrew) used in the ENUM definition are used when inserting or querying data. Discrepancies will lead to 'invalid input value for enum' errors (e.g., PostgreSQL error code 22P02).
   - Supabase migrations must be idempotent or written to handle re-application if `supabase db reset` is used. Debugging migration errors often involves checking `supabase migration up` logs for the specific SQL statement causing failure and ensuring all precedent schema (tables, types, functions) exists or is correctly handled (e.g., `DROP FUNCTION IF EXISTS` before `CREATE FUNCTION`).
   - RPC function definitions in Supabase are sensitive to the number, names (if called with named parameters from client), and types of parameters. Mismatches between client call and DB function signature result in an HTTP 404 (Not Found) with PostgREST error code `PGRST202`.

### Testing Strategy
1. **Unit Testing**
   - Component testing
   - Hook testing
   - Utility testing

2. **Integration Testing**
   - Route testing
   - Form submission
   - API integration

3. **E2E Testing**
   - Critical user flows
   - Authentication
   - Data persistence

## Deployment

### Build Process
```bash
# Production build
npm run build

# Preview build
npm run preview
```

### Environment Variables
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Deployment Checklist
1. Environment variables configured
2. Build successful
3. Type checking passed
4. Tests passed
5. Performance metrics met
6. Security audit passed 