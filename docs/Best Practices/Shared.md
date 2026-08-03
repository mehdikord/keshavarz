## **Shared Best Practices**

> **Note**: This document contains best practices that apply to both Next.js and React projects, as well as general development practices. For Next.js-specific practices, see [Next.js.md](./Next.js.md). For React-specific practices, see [React.md](./React.md). For TypeScript practices, see [TypeScript.md](./TypeScript.md).

**General Principles**
- Prefer **clarity over cleverness**. Avoid unnecessary abstractions and over-optimization.

### **Project Structure & Architecture**
- Use hybrid architecture: feature-based organization with shared layers (components, lib, hooks, types)
- Structure: `app/`, `features/`, `components/`, `lib/`, `hooks/`, `types/`, `docs/`, `prisma/`
- Each feature folder: `components/`, `hooks/`, `utils/`, `types/`, `api/` (if needed)
- Separate server and client components; use `'use client'` only when necessary
- Use `app/` directory for Next.js App Router (routes, layouts, loading, error boundaries)
- Place API routes in `app/api/` following RESTful conventions

### **TypeScript Configuration**
> **Note**: For comprehensive TypeScript best practices, see [TypeScript.md](./TypeScript.md).

- Use strict mode: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`
- Require Node.js 20.9.0+ and TypeScript 5.1.0+ (Next.js 16 requirements; Node.js 18 support removed)
- Enable path aliases: `@/` for root, `@/features/*`, `@/components/*`
- Use type-only imports: `import type { ... }`
- Define shared types in `types/`; feature-specific types in feature folders
- Use branded types for IDs and sensitive values
- **Use `satisfies` operator for object literals** (see [TypeScript.md](./TypeScript.md) for details)
- **Prefer union string literals over `enum`** (see [TypeScript.md](./TypeScript.md) for details)

### **CSS Framework: Tailwind CSS**
> **Note**: For comprehensive Tailwind CSS best practices, see [Tailwind.md](./Tailwind.md).

- Configure Tailwind in `tailwind.config.ts` with proper content paths
- Use utility classes; avoid custom CSS when possible
- Implement responsive design with breakpoints (sm, md, lg, xl, 2xl)
- Use `dark:` prefix for dark mode; logical properties for RTL
- Leverage plugins (forms, typography); use `@apply` sparingly
- Maintain consistent spacing and color system

### **shadcn/ui Integration**
> **Note**: For comprehensive shadcn/ui best practices, see [shadcn.md](./shadcn.md).

- Install components as needed; customize theme in `components/ui/`
- Use `cn()` utility from `lib/utils` for conditional classNames
- Maintain variants using `class-variance-authority` (cva)
- Keep shadcn/ui components in `components/ui/`; custom in `components/`

### **Toast/Notification System**
- Use toast library (sonner) for user feedback
- Implement consistent positioning, types (success, error, warning, info)
- Create reusable utilities in `lib/toast.ts`
- Ensure accessibility (ARIA labels, keyboard navigation)
- Test in both RTL and LTR layouts

### **Database: Prisma + MySQL**
> **Note**: For comprehensive Prisma best practices, see [Prisma.md](./Prisma.md).

- Define schema in `prisma/schema.prisma`; use migrations (never edit manually)
- Use Prisma Client with connection pooling; implement transactions for multi-step operations
- Use `select` and `include` to optimize queries (avoid over-fetching)
- Implement soft deletes with `deletedAt`; use indexes for frequently queried fields
- Use Prisma Studio for development; seed in `prisma/seed.ts`
- Store connection string in environment variables; log queries in development only

### **State Management: Zustand & Context API**
- **When to use Zustand**:
  - Only for shared cross-page state or truly global client state
  - With React 19 and Server Components, most state moves to server
  - Use for client-side UI state that needs to persist across navigation
  - Avoid for server-renderable data (use Server Components instead)
- **When to use Context API**:
  - For state that is local to a subtree of components (not truly global)
  - When state scope is limited to a few related components
  - Use `useReducer` + `Context` for complex local state management
  - Prefer Context over Zustand when state doesn't need to be accessed across unrelated pages
  - This prevents unnecessary re-renders of the entire app and keeps state management lightweight
- **Lifting State Up Pattern**:
  - State should live in the closest common ancestor of components that need it
  - If multiple components need the same state, lift it up to their common parent
  - Avoid prop drilling by using Context for deeply nested state sharing
  - Pattern: Start with local state, lift up only when multiple components need it
  - Example:
    ```tsx
    // ✅ Good: State in common parent
    function Parent() {
      const [count, setCount] = useState(0);
      return (
        <>
          <Child1 count={count} onIncrement={() => setCount(c => c + 1)} />
          <Child2 count={count} />
        </>
      );
    }
    
    // ❌ Bad: Duplicated state
    function Child1() {
      const [count, setCount] = useState(0);
      // ...
    }
    function Child2() {
      const [count, setCount] = useState(0); // Different state!
      // ...
    }
    ```
- **State Placement Best Practices**:
  - **Local state**: Use `useState` for component-specific state (form inputs, UI toggles)
  - **Shared state**: Lift to common parent or use Context for subtree
  - **Global state**: Use Zustand for cross-page/global state
  - **Server state**: Use Server Components, Server Actions, or data fetching libraries
  - **URL state**: Use Next.js router for shareable, bookmarkable state (search params, route params)
- **Best Practice**: Use Context for local component tree state, Zustand only for truly cross-page/global state
- Create feature-specific stores in `features/*/stores/` or global in `stores/`
- Use slices for modular organization; proper TypeScript types
- Use `persist` middleware for client-side persistence when needed
- Implement selectors to prevent unnecessary re-renders
- Use Zustand DevTools in development; avoid storing sensitive data

### **Error Handling**
- Implement global error boundary in `app/error.tsx`; route-level for granular handling
- Use error logging service (Sentry, LogRocket); create custom error classes
- Use proper HTTP status codes; user-friendly messages; log detailed errors server-side
- Create utilities in `lib/errors/`; use Zod for runtime validation (see [Zod.md](./Zod.md))
- Handle network errors with retry mechanisms and exponential backoff
- Implement error recovery strategies: fallback UI, retry buttons, graceful degradation
- Use error boundaries with Suspense for better error isolation

### **Form Handling: Zod & React Hook Form**
> **Note**: For comprehensive Zod best practices, see [Zod.md](./Zod.md).

- Use Zod for client and server-side validation
- Create reusable schemas in `lib/validations/` or feature-specific folders
- **When to use React Hook Form + Zod**:
  - Complex multi-step forms with extensive client-side validation
  - Forms requiring real-time validation feedback before submission
  - Forms with dynamic fields or conditional validation logic
  - Use `react-hook-form` with Zod resolver (`@hookform/resolvers/zod`) for these cases
- **When to use Server Actions + React 19 hooks** (preferred for simple forms):
  - Simple forms that primarily submit data to the server
  - Forms that benefit from server-side validation and error handling
  - Use `<form action={serverAction}>` with `useActionState` and `useFormStatus` (React 19)
  - This is the recommended pattern for most forms in Next.js 16 + React 19
- Use `refine` and `superRefine` for complex validation; `transform` for data transformation
- Implement error message localization; async validation when needed
- **Best Practice**: For simple forms, prefer Server Actions with React 19 hooks. For complex forms with extensive client-side logic, use React Hook Form + Zod

### **Authentication: JWT with HttpOnly Cookies**
- Generate JWT tokens server-side only; store refresh tokens in HttpOnly cookies
- Use secure flags: `httpOnly: true`, `secure: true`, `sameSite: 'strict'`
- Implement token expiration, refresh mechanism, blacklisting for logout
- Use environment variables for JWT secrets; rotate regularly
- Implement CSRF protection; rate limiting for auth endpoints
- Create utilities in `lib/auth/`; use `bcrypt` or `argon2` for password hashing
- **Alternative for Large-Scale Applications**:
  - Consider session-based auth with short-lived tokens + Redis for enterprise deployments
  - Provides better revocation control and scalability for high-traffic applications
  - JWT with HttpOnly cookies remains valid and recommended for most use cases

### **RBAC (Role-Based Access Control)**
- Define roles and permissions in database schema; create hierarchy (super-admin → admin → moderator → user)
- Implement permission-based access control; create utilities in `lib/rbac/`
- Store roles/permissions in JWT payload (with validation)
- Create admin panel for management; document in `docs/rbac.md`
- Implement audit logging; permission caching for performance

### **Security Best Practices**
- Sanitize inputs (prevent XSS); use parameterized queries (Prisma handles this)
- Implement CORS, CSP headers, rate limiting (`@upstash/ratelimit`)
- Validate file uploads (type, size, content); use environment variables for secrets
- Use HTTPS in production (HSTS); secure headers middleware
- **Disable X-Powered-By header** in production:
  - Set `poweredByHeader: false` in `next.config.ts` to prevent technology disclosure
  - This removes the `X-Powered-By: Next.js` header from responses
  - Example: `const nextConfig = { poweredByHeader: false, ... }`
- Validate all API inputs with Zod; don't leak sensitive info in errors
- Keep dependencies updated (`npm audit`); implement access control on all endpoints

### **Performance Optimization (General)**
- Implement caching strategies (ISR, SSG, SSR appropriately)
- Use Redis for caching; CDN for static assets; compression (gzip/brotli)
- Implement pagination, virtual scrolling for long lists
- Monitor Core Web Vitals (LCP, INP, CLS); use `@next/bundle-analyzer` (Note: FID deprecated, replaced by INP)
- Use View Transitions API for smoother page transitions (experimental in Next.js 16, enable with `experimental.viewTransition: true`)
- **Next.js 16 Routing & Prefetch Improvements**:
  - Layout deduplication for prefetch (one layout downloaded for multiple links)
  - Incremental prefetching (only new sections are prefetched)
  - Integration with View Transitions API (enhanced in React 19.2)
  - Rely on default Link/prefetch behavior instead of manual prefetch hacks
  - For complex route animations, use View Transitions + `<Activity>` instead of client-side-only stateful hacks
  - **Scroll Behavior**: Next.js 16 no longer overrides `scroll-behavior: smooth` by default
    - To restore previous behavior (instant scroll on navigation), add `data-scroll-behavior="smooth"` to `<html>` element
    - This change improves navigation performance by avoiding expensive scroll manipulation
  - **Note**: You may see more individual prefetch requests with lower total transfer sizes (this is intentional and improves performance)
- Implement progressive enhancement strategies
- Use proper image formats (WebP, AVIF with fallbacks)
- Implement lazy loading, code splitting, tree shaking
- Monitor bundle size with `@next/bundle-analyzer`; use compression, CDN caching headers
- Analyze and optimize bundle composition regularly
- Use `next/font`; proper `font-display` strategy (`swap` or `optional`)
- Use font subsetting, preloading for critical fonts; minimize weights/styles
- Set budgets (Lighthouse scores, bundle sizes)
- Monitor in CI/CD; fail builds if exceeded; track Core Web Vitals

### **API Design & Architecture**
- Follow RESTful conventions; use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Use consistent response format: `{ success, data, error, message }`
- Implement API versioning, documentation (OpenAPI/Swagger)
- Use proper status codes (200, 201, 400, 401, 403, 404, 500)
- Validate requests with Zod; implement rate limiting, authentication middleware
- Create utilities in `lib/api/`; use tRPC for type-safe APIs (optional)

### **Testing Strategy**
> **Note**: For comprehensive testing best practices, see [Testing.md](./Testing.md).

- Write unit tests for utilities; integration tests for API routes
- Use React Testing Library for components; Playwright or Cypress for E2E
- Use test data factories; proper mocking; test error scenarios
- Implement coverage thresholds; CI/CD pipeline with test execution

### **Code Quality & Linting**
> **Note**: For comprehensive ESLint best practices, see [ESLint.md](./ESLint.md).

- **ESLint Flat Config**: `@next/eslint-plugin-next` now defaults to ESLint Flat Config format (Next.js 16)
  - Aligns with ESLint v10 which will drop legacy config support
  - Migrate from `.eslintrc` to flat config format if using legacy format
  - See [ESLint migration guide](https://eslint.org/docs/latest/use/configure/migration-guide) for details
- Use ESLint with Next.js config; Prettier for formatting
- Implement pre-commit hooks (Husky + lint-staged)
- Use consistent naming (camelCase variables, PascalCase components)
- Remove unused imports; proper import sorting
- Leverage React Compiler (React 19, must be enabled with `reactCompiler: true` in `next.config.ts`) to reduce manual optimization code
- Use TypeScript strict mode for better type safety
- Implement import/export organization rules

### **Environment Variables**
- Use `.env.local` for development; `.env.example` as template
- **File Organization**:
  - `.env.local`: Local development secrets (never commit, in `.gitignore`)
  - `.env.example`: Template file with placeholder values (commit to repository)
  - `.env*` files (`.env`, `.env.development`, `.env.production`, etc.): Should NOT be committed to repository
  - **Best Practice**: Only commit `.env.example`; all actual `.env*` files should be in `.gitignore`
  - Sensitive values should always be in `.env.local` and never committed
- Never commit `.env.local` files; use `NEXT_PUBLIC_*` for client-side variables
- **Important**: Only `NEXT_PUBLIC_*` variables are accessible in client-side runtime
  - Direct access to `process.env` in client components only works for `NEXT_PUBLIC_*` prefixed variables
  - All other environment variables are server-only and not available in client runtime
  - This is an official Next.js constraint, not just a validation recommendation
- Validate at startup with Zod; document in `docs/environment.md`

### **Logging & Monitoring**
- Implement structured logging; different levels (debug, info, warn, error)
- Use error tracking (Sentry, LogRocket); APM tools
- Don't log sensitive data; implement alerting for critical errors
- Implement APM, distributed tracing, log aggregation
- Use metrics collection (Prometheus, DataDog); alerting rules
- Monitor database and API performance
- Track React Server Components performance and hydration metrics
- Monitor Turbopack build performance and optimization opportunities
- Use Real User Monitoring (RUM) for production performance insights

### **Documentation**
- Maintain in `docs/` folder: setup, architecture, API, components, RBAC, environment, deployment
- Use JSDoc for complex functions; keep README.md updated

### **Development Workflow**
- Use feature branches; Conventional Commits; PR templates
- Implement code review; semantic versioning

### **Rich Text Editor: TipTap**
- Use TipTap for rich text editing; install core and required extensions
- Create reusable component in `components/editor/` or `components/rich-text/`
- Sanitize content before saving (prevent XSS); validate with Zod
- Use JSON or HTML format for storage; handle image uploads if needed
- Test in both RTL and LTR modes; ensure accessibility

### **Additional Best Practices**
- Implement health check endpoint (`/api/health`)
- Use date/time libraries (`date-fns`, `dayjs`)
- Use cloud storage (AWS S3, Cloudinary) for production files
- Use email service (Resend, SendGrid, AWS SES)
- Use search (Algolia, Meilisearch) if needed
- Implement privacy-compliant analytics (GDPR, CCPA)
- Use containerization (Docker); CI/CD pipeline

### **Accessibility (a11y)**
- Follow WCAG 2.1 Level AA; use semantic HTML
- Implement ARIA labels and roles; keyboard navigation
- Ensure color contrast (4.5:1 for text); proper focus management
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Use proper form labels; ARIA live regions for dynamic content

### **File Storage & Management**
- Validate uploads (type, size, content scanning); use cloud storage for production
- Implement proper naming conventions; file type detection (not just extension)
- Store metadata in database; implement access control for downloads

### **Background Jobs & Queue System**
- Use queue system (BullMQ, Bull) with Redis storage
- Implement retry mechanisms, prioritization, scheduling (cron-like)
- Track job status; implement monitoring dashboard

### **Real-time Features**
- Use WebSockets (Socket.io, ws) for real-time communication
- Implement connection management, reconnection; Server-Sent Events (SSE) for one-way updates
- Use room/channel management; presence system; rate limiting

### **Payment Integration**
- Use payment gateway (Stripe, PayPal); implement webhook handling
- Use idempotency keys; PCI compliance (never store card details)
- Implement refund handling, subscription management, invoice generation

### **Email Templates & Sending**
- Create reusable templates; implement queue system
- Use HTML and plain text versions; track opens/clicks
- Implement bounce/complaint handling; email authentication (SPF, DKIM, DMARC)

### **API Pagination Standards**
- Use cursor-based pagination for large datasets; page-based as fallback
- Return consistent metadata: `{ data, pagination: { page, limit, total, hasMore } }`
- Use default page sizes (10, 20, 50); maximum limits

### **Search Functionality**
- Implement full-text search (MySQL FULLTEXT, or Algolia/Meilisearch)
- Use proper indexing, ranking, filters, facets, autocomplete
- Implement fuzzy matching for typos

### **Progressive Web App (PWA)**
- Implement service worker for offline support; manifest.json
- Use caching strategies (Cache First, Network First); push notifications

### **Mobile-First Design**
- Design mobile-first; test on real devices
- Implement touch targets (minimum 44x44px); responsive images

### **Feature Flags**
- Use feature flag system (LaunchDarkly, or custom)
- Implement A/B testing, rollback, analytics

### **Audit Logging**
- Log critical actions (create, update, delete)
- Include: user, action, resource, timestamp, IP, user agent
- Never allow deletion; implement retention policy

### **Compliance & Privacy**
- Implement GDPR compliance (right to access, deletion, portability)
- Implement cookie consent, data retention policies, anonymization
- Implement data export/deletion functionality

### **Content Security Policy (CSP)**
- Implement strict CSP headers; use nonce or hash for inline scripts
- Whitelist only necessary resources; test in report-only mode first

### **Export/Import Functionality**
- Implement CSV, PDF (Puppeteer, jsPDF), Excel (ExcelJS) export
- Validate imports; batch processing for large imports; progress tracking

### **Contract Testing**
- Implement API contract testing; use tools like Pact
- Test contracts in CI/CD; document properly

### **Data Migration Strategies**
- Implement rollback procedures; test on staging first
- Use proper versioning, locking for zero-downtime

### **Soft Delete Patterns**
- Use `deletedAt` timestamp; filter in all queries
- Implement restore functionality; permanent delete (admin only)

### **API Documentation**
- Use OpenAPI/Swagger; generate from code (tRPC, OpenAPI generator)
- Include request/response examples; document error responses

### **Dependency Management**
- Use exact versions for critical dependencies
- Regularly update (`npm audit`, Dependabot); monitor vulnerabilities
- **After upgrading Next.js/React**: Ensure all related type packages are updated
  - Update `@types/react` and `@types/react-dom` to versions compatible with React 19
  - Update `@types/node` to version compatible with Node.js 20
  - Verify Prisma version is compatible with Node.js 20 (use latest Prisma version)
  - Run `npm install` and verify no type conflicts after major version upgrades
  - Example: After upgrading to Next.js 16, ensure `@types/react@^19` and `@types/node@^20` are installed

**When generating code for this project, follow these shared best practices by default unless the user explicitly asks for a different approach.**

