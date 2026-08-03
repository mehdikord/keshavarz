## **Next.js 16 Best Practices**

> **Note**: This document focuses on Next.js-specific best practices. For React-specific practices, see [React.md](./React.md). For TypeScript practices, see [TypeScript.md](./TypeScript.md). For Tailwind CSS practices, see [Tailwind.md](./Tailwind.md). For shadcn/ui practices, see [shadcn.md](./shadcn.md). For Zod practices, see [Zod.md](./Zod.md). For Prisma practices, see [Prisma.md](./Prisma.md). For Testing practices, see [Testing.md](./Testing.md). For ESLint practices, see [ESLint.md](./ESLint.md). For shared/general practices, see [Shared.md](./Shared.md).

### **Next.js 16 Migration Notes & Breaking Changes**

**Cursor must always assume these Next.js 16 breaking changes when generating code:**

- **`middleware.ts` → `proxy.ts`**: `middleware.ts` is deprecated; use `proxy.ts` instead.
  - `proxy.ts` runs in Node.js runtime by default (no runtime config needed).
  - `proxy.ts` does not support Edge runtime; for Edge runtime needs, use Route Handlers with `export const runtime = 'edge'`.
- **`params` and `searchParams` are now async/Promise-based** (breaking change from Next.js 15):
  - Pattern: `const { id } = await params` and `const { query } = await searchParams`.
  - Must await before accessing properties; this is required in Next.js 16+.
  - **Migration from Next.js 15**: Next.js 15 allowed synchronous access (deprecated), but Next.js 16 fully removes synchronous access. Use `npx next typegen` to generate type helpers for safe migration.
- **`next lint` command removed**: ESLint/BIOME must be run directly.
  - Use `npm run lint` or direct ESLint/BIOME commands.
  - `next build` no longer runs lint automatically.
- **Next.js 16 requires TypeScript 5.1+ and Node.js 20.9.0+** (Node.js 18 support removed).
- **Browser support**: Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+
- **Async icon/image generation**: `opengraph-image`, `twitter-image`, `icon`, and `apple-icon` now receive `params` and `id` as Promises (breaking change)
  - Pattern: `export default async function Image({ params, id }) { const { slug } = await params; const imageId = await id; ... }`
  - `generateImageMetadata` continues to receive synchronous `params`
- **Async sitemap**: `sitemap` generating function now receives `id` as a Promise when using `generateSitemaps`
  - Pattern: `export default async function sitemap({ id }) { const resolvedId = await id; ... }`
- **Type helpers for async APIs**: Use `npx next typegen` to generate type helpers (`PageProps`, `LayoutProps`, `RouteContext`) for type-safe async params/searchParams migration
- **Runtime Configuration removed**: `serverRuntimeConfig` and `publicRuntimeConfig` removed; use environment variables instead
- **AMP Support removed**: All AMP APIs and configurations removed in Next.js 16

### **Next.js 16 App Router**
- Use Server Components by default; Client Components for interactivity
- **Important**: `'use client'` directive must be at top-level and unconditional
  - Do not use conditional `'use client'` directives
  - `'use client'` must appear at the very top of the file, before any imports or code
  - Conditional client components should be handled through component composition, not conditional directives
- Use `cookies()`, `headers()`, and `draftMode()` as async functions (Next.js 16 breaking change)
- Implement `loading.tsx`, `error.tsx`, `not-found.tsx` files
- Use React `Suspense` for streaming and progressive rendering
- Use Route Groups `(group)` for organization without affecting URLs
- **Parallel Routes**: All parallel route slots now require explicit `default.tsx` files in Next.js 16
  - Builds will fail without `default.tsx` files for each parallel route slot
  - Pattern: Create `default.tsx` that calls `notFound()` or returns `null` to maintain previous behavior
- Implement metadata API in `layout.tsx` and `page.tsx` for SEO; use enhanced metadata features in Next.js 16
  - **Use `generateMetadata` for dynamic metadata; avoid runtime metadata changes**
  - Changing metadata at runtime (inside component logic) is not recommended
  - Best Practice: use `metadata` export for static metadata, `generateMetadata` function for dynamic metadata
  - Do not modify metadata dynamically within component render logic
- Use `generateStaticParams` for dynamic routes when possible
- Use `proxy.ts` (Next.js 16) for network-level operations only: redirects, rewrites, i18n routing, A/B testing, headers/cookies manipulation (middleware.ts renamed to avoid confusion with Express/Koa middleware)
- **Important**: Do NOT use `proxy.ts` for auth, permission checks, business logic, or logging
  - **Note**: While Next.js official documentation shows examples of auth checks in proxy/middleware, this project's architectural decision is to keep `proxy.ts` lightweight and maintainable
  - Authentication and authorization logic should be implemented in Route Handlers (`app/api/...`), Server Actions, or layout/page-level checks
  - This approach ensures proxy remains focused on network-level concerns and keeps business logic in appropriate layers
- **Critical Restriction**: Do NOT use cache/revalidation APIs (`revalidateTag`, `updateTag`, `refresh`) in `proxy.ts`.
  - These APIs are only available in Server Actions or Route Handlers.
  - `revalidateTag` documentation explicitly states it cannot be used in Proxy context.
  - `proxy.ts` is for network-level operations only (redirects, rewrites, headers, cookies).
- For real authentication: use Route handlers (`app/api/...`), Server Actions, or layout/page-level checks
- **Important**: `proxy.ts` **only supports Node.js runtime and cannot be configured**
  - `proxy.ts` defaults to Node.js runtime and cannot be changed (unlike `middleware.ts` which defaulted to Edge Runtime in older Next.js versions)
  - If you need Edge runtime, you must either:
    - Keep using `middleware.ts` (deprecated but still functional for Edge runtime needs)
    - Use Route Handlers with `export const runtime = 'edge'` in `app/api/` routes
- **Important**: `middleware.ts` is **deprecated** and should not be used for new code; migrate existing `middleware.ts` to `proxy.ts` (Node.js) or Route Handlers (Edge)
- Edge Runtime is still available for Route handlers and other use cases, but `proxy.ts` specifically uses Node.js runtime only
- **Configuration flags renamed**: `skipMiddlewareUrlNormalize` is now `skipProxyUrlNormalize` in Next.js 16
- **Advanced Proxy Configuration**:
  - Use `proxyClientMaxBodySize` in `next.config.ts` to control body size before reaching app (useful for upload redirects)
    - **⚠️ Experimental/Use with caution**: This option is experimental in Next.js 16 and should be used cautiously
    - Only use when explicitly needed for specific upload/redirect scenarios
  - Example use cases:
    - A/B testing with header manipulation
    - i18n routing at proxy level (alongside next-intl middleware)
    - Lightweight rate limiting for routes like `/api/*` (not full security)
- Optimize images with `next/image`; configure `images.remotePatterns` in `next.config.ts` instead of `images.domains` (deprecated in Next.js 16)
- Use `placeholder="blur"` and `blurDataURL` for better image loading experience
- **Next.js 16 Image Configuration Defaults**:
  - `images.minimumCacheTTL`: Default changed from 60s to 14400s (4 hours) in Next.js 16
  - `images.imageSizes`: Default no longer includes `16` (removed from array)
  - `images.qualities`: Default changed from all qualities to `[75]` only
  - `images.maximumRedirects`: Default changed from unlimited to 3 redirects maximum
  - `images.dangerouslyAllowLocalIP`: Default is `false` (local IP optimization blocked by default for security)
  - Local images with query strings require `images.localPatterns.search` configuration to prevent enumeration attacks
- **Deprecated**: `next/legacy/image` component is deprecated; use `next/image` instead
- Use `next/font` for font optimization
- Implement caching: `revalidate`, `cache: 'force-cache'` for static data
- **SSR/SSG/ISR Strategy Selection**:
  - **Static Generation (SSG/ISR)**: Use for content pages, blog posts, product listings that change infrequently
    - Use `generateStaticParams` for dynamic routes when possible
    - Use ISR with appropriate `revalidate` time for content that updates periodically
    - Reduces server load and improves performance for SEO-focused pages
  - **Server-Side Rendering (SSR)**: Use for personalized pages, dashboards, real-time data
    - Use `cache: 'no-store'` for always-fresh data (user-specific dashboards, live metrics)
    - Use for pages that require authentication or user-specific content
  - **Hybrid Approach**: Combine ISR with client-side updates for best of both worlds
    - Use ISR with Cache Components for static shell, stream dynamic parts with Suspense
    - Next.js 16's Cache Components and Partial Prerendering enable optimal hybrid rendering
  - **Best Practice**: Default to ISR for content pages, use SSR only when data must be fresh on every request
- Use resource hints: `preload`, `prefetch`, `preconnect` for performance optimization

### **Cache Components & Partial Prerendering (PPR) - Next.js 16**
- **Cache Components is an opt-in feature**: Enable with `cacheComponents: true` in `next.config.ts`
- Cache Components enable Partial Prerendering (PPR): serve static shell immediately while streaming dynamic parts
- **How it works**: At build time, Next.js renders route component trees; components that don't access network resources, system APIs, or request data are automatically added to the static shell
- **For dynamic content**: Wrap in `<Suspense>` boundaries to defer rendering to request time
- **For cacheable dynamic content**: Use `"use cache"` directive to include in static shell during prerendering
- **Runtime data** (`cookies()`, `headers()`, `searchParams`, `params`) cannot be cached with `"use cache"`; must be wrapped in `<Suspense>`
- Use `connection()` API from `next/server` if you need to defer to request time without accessing runtime APIs
  - Pattern: `await connection()` before non-deterministic operations to ensure request-time execution
  - Useful when you need unique values per request (random numbers, timestamps, UUIDs) without accessing cookies/headers
  - **Important**: `connection()` defers execution to request time, making the route dynamic; use when you need to guarantee dynamic rendering
- **Non-deterministic operations** (`Math.random()`, `Date.now()`, `crypto.randomUUID()`) must be called after dynamic/runtime data access or use `connection()` to ensure request-time execution
- PPR improves initial page load by serving static HTML shell instantly
- Combine Cache Components with ISR for best performance on content-heavy sites
- Use `loading.tsx` files to define fallback UI for dynamic sections
- **Navigation uses Activity**: When `cacheComponents` is enabled, Next.js automatically uses React's `<Activity>` component to preserve component state during client-side navigation
  - Next.js sets Activity mode to `"hidden"` when navigating away, preserving state while cleaning up effects
  - When navigating back, the previous route reappears with its state intact
  - This is handled automatically by Next.js; manual `<Activity>` usage is optional for custom scenarios
- Cache Components are the stable, production-ready way to achieve PPR in Next.js 16 (replaces experimental PPR from Next.js 15)

### **Next.js 16 Cache Components & Caching APIs Best Practices**
- Enable Cache Components: `cacheComponents: true` in `next.config.ts`
- Use `"use cache"` directive in:
  - Full pages for static shell generation
  - Shared layouts for common static content
  - Heavy components (charts, dashboards) for performance
  - Data-fetching functions:
    ```ts
    async function getPost(id: string) {
      'use cache'
      cacheTag('post', `post:${id}`)
      const data = await db.post.findUnique({ where: { id } })
      return data
    }
    ```
- Implement cache tagging strategy:
  - Use `next: { tags: ['post', 'post:' + id] }` in fetch calls
  - Invalidate with `revalidateTag('post', 'max')` or `revalidateTag('post', { expire: 3600 })`
  - Use `updateTag(tag)` for read-your-writes consistency in Server Actions
  - Use `refresh()` for uncached data refresh in Server Actions (server-side equivalent of `router.refresh()`)
- **New Caching APIs in Next.js 16**:
  - `revalidateTag(tag, profile)`: profile can be `'max'`, `'hours'`, `'days'`, or `{ expire: number }` (single-parameter version deprecated)
    - Returns `void` (not a Promise); can be used in Route Handlers or Server Actions.
    - Examples: `revalidateTag('post', 'max')`, `revalidateTag('product', 'hours')`, `revalidateTag('user', { expire: 3600 })`
    - Do NOT use in `proxy.ts` (not allowed in proxy context).
  - `updateTag(tag)`: ensures read-your-writes consistency after mutations
    - Returns `void` (not a Promise); only available in Server Actions.
    - Do NOT use in `proxy.ts` or Route Handlers.
  - `refresh()`: refreshes uncached data in Server Actions
    - Returns `void` (not a Promise); only available in Server Actions.
    - Do NOT use in `proxy.ts` or Route Handlers.
- Cache strategy guidelines:
  - Use cache for eventual consistency (articles, products, static content)
  - Use `no-store` / no cache for live metrics, auth state, sensitive notifications
  - Combine cache tags with Server Actions for automatic invalidation

### **Advanced Cache Components: cacheLife & cacheTag**
- **Cache Life Profiles (`cacheLife`)**:
  - Use `cacheLife()` function inside components/functions with `"use cache"` to set cache lifetime
  - **Usage**: Call `cacheLife()` function in your code to use built-in profiles or custom configuration
  - Built-in profile examples:
    - `cacheLife("hours")`: for content/lists (articles, products) that update frequently
    - `cacheLife("days")`: for relatively static content
    - `cacheLife("max")`: for content that rarely changes
  - Custom configuration example:
    ```ts
    "use cache";
    cacheLife({
      stale: 3600,    // 1 hour until considered stale
      revalidate: 7200, // 2 hours until revalidated
      expire: 86400,   // 1 day until expired
    });
    const data = await fetchData();
    ```
  - Simple profile example:
    ```ts
    "use cache";
    cacheLife("hours");
    const data = await fetchData();
    ```
- **Cache Tagging with `cacheTag()`**:
  - Use `cacheTag()` inside `"use cache"` scope for cleaner tag management alongside `next.tags` in fetch
  - Combine with Cache Components for fine-grained cache control
  - Pattern: `"use cache"; cacheTag('post', `post:${id}`); return data;`
- **Cache Directive**:
  - `"use cache"`: Caches the return value of async functions and components
  - Arguments and closed-over values automatically become part of the cache key
  - Can be applied at function, component, or file level
  - Use `cacheLife()` to control cache duration (profiles: `'hours'`, `'days'`, `'max'`, or custom object)
  - Runtime data (`cookies()`, `headers()`, `searchParams`, `params`) cannot be used in the same scope as `"use cache"`; extract values and pass as arguments to cached functions

### **Server Actions & Data Fetching**
- Use Server Actions for form submissions and mutations
- Use Server Components for initial data; Client Components for updates
- **Use native `fetch` in Server Components; avoid custom fetch libraries (axios, etc.)**
  - Next.js officially recommends using native `fetch` in Server Components
  - Native `fetch` provides automatic request deduplication and streaming support
  - Caching is opt-in: use `cache: 'force-cache'` to enable caching for individual requests
  - Custom fetch libraries (axios, node-fetch) bypass Next.js optimizations
  - **Important**: By default, `fetch` requests are **not cached** in Next.js 16
    - Use `cache: 'force-cache'` to cache individual requests
    - Use `next: { revalidate }` for time-based revalidation
    - Use `next: { tags }` for tag-based cache invalidation
  - Pattern: use `fetch` with `next: { revalidate, tags }` options for optimal caching
  - **Note**: Although `fetch` requests are not cached by default, Next.js will pre-render routes that have `fetch` requests and cache the HTML output. The `fetch` request itself is not cached unless you explicitly set `cache: 'force-cache'`
- **To guarantee dynamic rendering**: Use `connection()` API from `next/server` to ensure route is always dynamic
- **Server Components must be pure functions with no side-effects**
  - Server Components should not have subscriptions, timers, or global mutations
  - No `useEffect`, `useState`, or browser APIs in Server Components
  - All side-effects must be moved to Client Components or Server Actions
  - Server Components are for data fetching and rendering only
  - **Pure function principles**:
    - Same inputs (props) should always produce the same output (JSX)
    - No mutations of external variables or objects
    - No side-effects during rendering (no API calls, no mutations, no subscriptions)
    - All data fetching should be done at the top level, not in effects
  - **What Server Components CAN do**:
    - Fetch data from databases, APIs, or file systems
    - Access server-only APIs (`cookies()`, `headers()`, `draftMode()`)
    - Render JSX based on fetched data
    - Call Server Actions
  - **What Server Components CANNOT do**:
    - Use React hooks (`useState`, `useEffect`, `useContext`, etc.)
    - Use browser APIs (`window`, `document`, `localStorage`, etc.)
    - Handle user interactions (onClick, onChange, etc.)
    - Maintain client-side state
    - Subscribe to real-time updates
  - **Example of pure Server Component**:
    ```tsx
    // ✅ Good: Pure Server Component
    async function PostList() {
      const posts = await db.post.findMany(); // Data fetching at top level
      return (
        <ul>
          {posts.map(post => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      );
    }
    
    // ❌ Bad: Side-effect in Server Component
    function BadComponent() {
      useEffect(() => { // ❌ Cannot use hooks
        fetchData();
      }, []);
      return <div>Content</div>;
    }
    ```
- Implement loading states with Suspense; error boundaries for data fetching
- Use `fetch` with caching (`cache: 'force-cache'`, `next: { revalidate }`)
- Use `"use cache"` directive (Next.js 16) for component-level caching
  - `"use cache"` provides fine-grained control over component-level caching in Next.js
  - `cache()` function from React is for memoization in Server Components (different from `"use cache"` directive)
  - `"use cache"` directive is a Next.js feature for Cache Components and PPR
  - Note: `cacheLife()`, `cacheTag()`, `updateTag()`, and `revalidateTag()` are from `next/cache`
  - **Legacy API**: `unstable_cache` is experimental; prefer `"use cache"` directive with Cache Components
- Implement validation in Server Actions with Zod; transaction handling
- Use type-safe Server Actions with TypeScript for better developer experience
- Handle Server Action errors gracefully with proper error boundaries
- Use Server Actions with `revalidatePath` and `revalidateTag` for cache invalidation
- Use new caching APIs: `revalidateTag(tag, profile)`, `updateTag(tag)`, and `refresh()` for optimal cache management

### **SEO Optimization**
- Implement metadata in `layout.tsx` and `page.tsx`; use `generateMetadata` for dynamic metadata
- Use enhanced metadata API features in Next.js 16 for better SEO control
- Use structured data (JSON-LD), Open Graph, Twitter Cards, canonical URLs
- Implement sitemap.xml and robots.txt (use `sitemap.ts` and `robots.ts` in App Router)
- Use semantic HTML (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`)
- Optimize titles (50-60 chars) and descriptions (150-160 chars)
- Implement heading hierarchy (h1 → h2 → h3), alt text for images
- Use `lang` attribute and hreflang tags for multi-language support
- Leverage Cache Components & Partial Prerendering (PPR) for better SEO with dynamic content

### **Internationalization (i18n) & RTL Support**
- Use `next-intl` for i18n; default to RTL layout; implement LTR/RTL switching
- Store translations in `messages/` or `locales/`; use namespace-based organization
- Implement locale detection (URL-based, cookie-based, browser-based)
- Use `next-intl` middleware for locale routing; `Intl` API for formatting
- Use `dir` attribute in HTML; logical properties in CSS
- Test all UI components in both RTL and LTR modes

### **Router Cache & Static Generation Configuration**
- **Client Router Cache (`staleTimes`)**:
  - **Note**: `experimental.staleTimes` is an experimental feature and not recommended for production use
  - Should only be used cautiously (e.g., during testing or if explicitly needed), as it is not yet a stable API in Next.js 16
  - If used, configure `staleTimes` in `next.config.ts` to control how long Next.js considers cached links "fresh" in client router cache
  - Use different profiles for different page types:
    - Real-time dashboards: very short `staleTime` (seconds)
    - Content pages: longer `staleTime` (minutes/hours)
  - Pattern: `staleTimes: { dynamic: 30, static: 180 }` (seconds)
- **Static Generation Configuration (`staticGeneration.*`)**:
  - Use `staticGeneration.maxDuration` to control SSG/ISR timeout
  - Configure `staticGeneration.retry` for retry behavior during static generation
  - Useful for controlling build-time behavior and resource limits

### **Typed Routes & URL Safety**
- Enable typed routes in `next.config.ts`: `typedRoutes: true`
- Makes `<Link href>` and dynamic routes type-safe
- Benefits:
  - Compile-time validation of route paths
  - Type-safe URL construction helpers
  - Better 404/not-found handling with type checking
- Implementation patterns:
  - Create helper functions for building URLs from types
  - Test 404 and `not-found.tsx` based on typed routes
  - Use for enterprise-grade code safety and maintainability

### **Build & Deployment**
- **Turbopack is enabled by default** in Next.js 16 for both development and production builds
- Use standard scripts: `next dev`, `next build`, `next start` (Turbopack runs automatically)
- Only use `--webpack` flag if you need to temporarily revert to Webpack
- **Turbopack Configuration**:
  - `experimental.turbopack` is now a top-level `turbopack` option in `next.config.ts`
  - Use `turbopack.resolveAlias` for resolving Node.js native modules in client code (e.g., `fs` fallbacks)
  - Sass imports from `node_modules` are fully supported (no tilde `~` prefix needed)
- **Turbopack File System Cache (Beta)**:
  - Enable `experimental.turbopackFileSystemCacheForDev` in `next.config.ts` for large projects
  - Enable `experimental.turbopackFileSystemCacheForBuild` in `next.config.ts` for large projects
  - Significantly speeds up restart times for large codebases by storing compiler artifacts on disk
  - Recommended for enterprise/SaaS applications with extensive codebases
  - Example: `experimental: { turbopackFileSystemCacheForDev: true, turbopackFileSystemCacheForBuild: true }`
- Do not generate Webpack-specific config unless explicitly requested
- **Concurrent dev and build**: `next dev` and `next build` now use separate output directories (`.next/dev` for dev)
  - Enables concurrent execution of dev and build commands
  - Lockfile mechanism prevents multiple instances on the same project
- **Build Adapters API (Alpha)**:
  - Use Build Adapters for customizing build output for different targets (serverless, edge, custom runtime)
  - Useful for multi-region deployments and custom runtime requirements
  - Advanced feature for enterprise-grade infrastructure needs
- Implement build optimization, caching
- Use deployment strategies (blue-green, canary); rollback procedures
- Use health checks before traffic routing
- Monitor build times and bundle sizes; optimize based on metrics

### **Custom Cache Handler & Remote Cache (Redis, Multi-Instance)**
- **When to use Custom Cache Handler** (Context-Dependent):
  - **Only needed for multi-instance deployments** (Docker, Kubernetes) where file-system cache is insufficient
  - The default in-memory cache works for most apps and is sufficient for single-server environments
  - Custom cache handlers are for advanced scenarios like sharing cache across multiple server instances
  - Use when you need shared cache across multiple Next.js instances in production
- **Implementation**:
  - Configure `cacheHandler` in `next.config.ts` (Next.js 14.1+, stable in Next.js 16)
  - Use Redis adapter for shared cache across instances
  - Pattern (Next.js 16+): `cacheHandler: require.resolve('./lib/cache-handler.mjs')`
  - For older Next.js versions (<=14.0): use `experimental.incrementalCacheHandlerPath`
  - Example:
    ```ts
    const nextConfig: NextConfig = {
      cacheHandler: process.env.NODE_ENV === 'production' && process.env.MULTI_INSTANCE === 'true'
        ? require.resolve('./lib/cache-handler.mjs')
        : undefined,
    };
    ```
- **Deployment considerations**:
  - Use custom cache handler only for Docker/K8s deployments with shared Redis
  - Ensures cache consistency across all instances in multi-instance setups
  - Reduces redundant data fetching in multi-instance deployments
  - For single-server environments, the default in-memory cache is sufficient
- **Remote Cache**:
  - Combine custom cache handler with `"use cache"` directive for optimal shared caching in multi-instance setups
  - Use for runtime data that benefits from cross-user sharing
  - Extract runtime data values and pass them as arguments to cached functions (runtime data cannot be used directly in `"use cache"` scope)

### **Cache Invalidation Strategies**
- Implement cache tagging, versioning, warming
- Use proper TTL strategies; cache keys (include version/user/locale)
- Use `"use cache"` directive (Next.js 16) for fine-grained component caching
  - **Note**: `"use cache"` directive (Next.js) is different from React's `cache()` function
  - `"use cache"` is for Cache Components and PPR (Next.js feature)
  - React's `cache()` function is for memoization in Server Components (separate use case)
- Implement cache invalidation on data mutations using new APIs: `revalidateTag(tag, profile)`, `updateTag(tag)`, and `refresh()`
- Use Cache Components (`cacheComponents: true`) for automatic PPR and optimal caching behavior
- Use `cacheLife()` profiles for different content types (hours, days, max)
- Combine `cacheTag()` with Cache Components for cleaner tag management

### **Next.js DevTools MCP (AI-Enhanced Debugging)**
- **Next.js DevTools MCP** enables AI agents to connect to your application and gather context (routing, logs, errors)
- Install and enable DevTools MCP for intelligent debugging workflows
- Use in CI/CD and local development for:
  - Log aggregation and analysis
  - Error context gathering for AI-assisted debugging
  - AI-assisted migration help
  - Performance insights and recommendations
- Particularly valuable for enterprise-grade applications requiring advanced debugging capabilities

**When generating code for this project, follow these Next.js-specific rules by default unless the user explicitly asks for a different approach.**

