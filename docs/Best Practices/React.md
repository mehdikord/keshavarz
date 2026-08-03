## **React 19 Best Practices**

> **Note**: This document focuses on React-specific best practices. For Next.js-specific practices, see [Next.js.md](./Next.js.md). For TypeScript practices, see [TypeScript.md](./TypeScript.md). For Tailwind CSS practices, see [Tailwind.md](./Tailwind.md). For shadcn/ui practices, see [shadcn.md](./shadcn.md). For Zod practices, see [Zod.md](./Zod.md). For Prisma practices, see [Prisma.md](./Prisma.md). For Testing practices, see [Testing.md](./Testing.md). For ESLint practices, see [ESLint.md](./ESLint.md). For shared/general practices, see [Shared.md](./Shared.md).

### **React 19 Features**
- Use React 19 features: Actions, useFormStatus, useActionState (replaces useFormState), useOptimistic, use()
- Use `use()` hook for unwrapping promises and context (React 19); works with both Promises and Context
  - Use `use()` with Context for conditional context consumption
  - Use `use()` with Promises in Server Components for async data fetching
- Server Actions are natively supported in React 19 (Next.js 16 uses React 19 by default)
- Use `useActionState` (not `useFormState`) for form state management with Server Actions
- Form pattern with Server Actions:
  - Use `<form action={serverAction}>` for form submission
  - Use `const [state, action, pending] = useActionState(serverAction, initialState)` for form state
  - Child components can access pending state via `useFormStatus` hook
  - This is the core form best-practice pattern in React 19 + Next.js 16
- **React 19.2 Features**:
  - **`<Activity mode="visible" | "hidden">`** (React 19.2 feature):
    - **Primary use**: Next.js 16 automatically uses `<Activity>` when `cacheComponents: true` is enabled to preserve component state during client-side navigation
    - **Manual use**: Can also be used manually for tabs, sidebars, multi-step forms to preserve component state while eliminating side-effects when hidden
    - Hidden UI sections (tabs, side panels) maintain state but effects/subscriptions don't run when hidden
    - **Perfect for tab-based interfaces** where hidden tabs should preserve state but pause effects
    - **Not a replacement for conditional rendering** in all cases; use when you need state preservation with effect pausing
    - **Props**: `mode` prop accepts `'visible'` or `'hidden'` (defaults to `'visible'` if omitted)
    - **Pre-rendering**: Can be used to pre-render content that's likely to become visible (hidden Activity boundaries still render their children at lower priority, without mounting Effects)
    - **Selective Hydration**: Activity boundaries participate in Selective Hydration, improving hydration performance by allowing React to hydrate parts of the app independently
    - **Caveats**:
      - Works with ViewTransition for animations (becomes visible/hidden triggers enter/exit animations)
      - For DOM elements with side effects (`<video>`, `<audio>`, `<iframe>`), add cleanup functions using `useLayoutEffect` to pause/stop when hidden
      - Text-only components (no DOM element) won't render anything when hidden
    - Manual usage pattern (optional, for custom scenarios):
      ```tsx
      // Tab-based interface with Activity (manual usage)
      function TabContainer() {
        const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
        return (
          <>
            <TabButtons activeTab={activeTab} onTabChange={setActiveTab} />
            <Activity mode={activeTab === 'dashboard' ? 'visible' : 'hidden'}>
              <DashboardContent />
            </Activity>
            <Activity mode={activeTab === 'settings' ? 'visible' : 'hidden'}>
              <SettingsContent />
            </Activity>
          </>
        );
      }
      ```
      - When a tab is hidden, its effects (subscriptions, timers) are paused, but state is preserved
      - This prevents unnecessary work while maintaining UI state for better UX
    - **Note**: Most use cases are handled automatically by Next.js when `cacheComponents` is enabled
  - **`useEffectEvent` Hook**:
    - Separate event-like logic from `useEffect`, reducing dependency array complexity
    - Recommended pattern for complex event handlers that previously required `useCallback` + dependency arrays
    - Use when event handler logic is complex and needs to be separated from effect dependencies
    - Example: `const handleEvent = useEffectEvent((data) => { /* complex logic */ }); useEffect(() => { subscribe(handleEvent); }, []);`
  - **View Transitions** (React 19.2):
    - **⚠️ Experimental**: View Transitions API is still experimental in Next.js 16
    - Enable with `experimental.viewTransition: true` in `next.config.ts`
    - Use `ViewTransition` API for smoother page transitions and element animations
    - Next.js 16 integrates View Transitions with routing for enhanced navigation experience
    - Pattern: Use for route transitions and element updates that benefit from smooth animations
    - Works seamlessly with Next.js 16's enhanced routing and prefetching improvements
    - **Note**: Not recommended for production use until stable
- Use `useId()` hook for generating stable IDs in SSR/CSR environments
  - Essential for form inputs, aria attributes, and hydration consistency
  - Prevents ID mismatches between server and client rendering
  - Pattern: `const id = useId()` for form labels, aria-describedby, etc.
- Keep client components **small**, mostly UI shells delegating data to server components
- **Important**: `useLayoutEffect` must only be used in Client Components
  - React officially warns that `useLayoutEffect` is not available in Server Components
  - Always use `'use client'` directive when using `useLayoutEffect`
  - Prefer `useEffect` for most cases; `useLayoutEffect` only for DOM measurements before paint
- Use `useTransition` and `useDeferredValue` for non-urgent updates and concurrent rendering
- Leverage Concurrent Rendering features for better user experience
- Use React Server Components composition patterns for better code organization
- Implement **Adaptive Hydration**: prioritize component hydration based on user interaction, viewport visibility, and device capabilities
- Use **Modular Rendering**: split UI into independent, composable modules that can render and hydrate separately

### **React Compiler**
- React 19 includes automatic memoization compiler (stable in Next.js 16, not enabled by default); reduces need for manual `React.memo`, `useMemo`, `useCallback` in many cases
- The compiler automatically optimizes re-renders by analyzing hooks, dependencies, and state
- Still use manual memoization for complex cases or when compiler hints are needed
- **Setup Steps (Order Matters)**:
  1. **First**: Install `babel-plugin-react-compiler` as a dev dependency (required):
     ```bash
     npm install -D babel-plugin-react-compiler@latest
     ```
  2. **Then**: Enable React Compiler in `next.config.ts`:
     ```ts
     const nextConfig = {
       reactCompiler: true,
     };
     ```
  - **Important**: The Babel plugin must be installed before enabling `reactCompiler: true` in the config
  - Next.js 16 automatically configures the Babel plugin when `reactCompiler: true` is set (no manual Babel configuration needed)
  - The plugin is automatically added to the Babel pipeline in the correct order
- **Compiler-Friendly Patterns**:
  - Avoid mutating props or state directly
  - Avoid side-effects outside of hooks
  - Be aware of libraries that may conflict with Babel plugin
  - Follow React Compiler guidelines for optimal automatic optimization
- **ESLint Integration**: Install `eslint-plugin-react-hooks@latest` for compiler-aware linting
  - Use `recommended-latest` preset to identify code that can't be optimized
  - ESLint rules help identify violations of Rules of React
- **Opting out**: Use `"use no memo"` directive to temporarily opt out specific components if needed
- **Note**: Expect higher compile times in development and builds when React Compiler is enabled (relies on Babel)
- **Incremental Adoption**: React Compiler supports gradual rollout
  - Start with specific components or features
  - Use `"use no memo"` directive to opt out problematic components during migration
  - Test thoroughly before enabling globally
  - Monitor performance and bundle size changes
- **Debugging & Troubleshooting**:
  - Use React DevTools to inspect compiler optimizations
  - Check console for compiler warnings and errors
  - Verify that components follow Rules of React for optimal compilation
  - Use `"use no memo"` to isolate issues with specific components
- **useMemo/useCallback as Escape Hatches**:
  - React Compiler handles most memoization automatically
  - Use `useMemo`/`useCallback` when you need precise control over memoization
  - Common use case: memoized values used as effect dependencies to prevent unnecessary effect re-runs
  - For new code, rely on compiler; use manual memoization only when needed for specific control
  - For existing code, test carefully before removing manual memoization (removing it can change compilation output)

### **Keep Components Pure**
- Components should be pure functions
  - Same inputs (props) should always produce the same output (JSX)
  - Don't mutate external variables or objects during rendering
  - Don't perform side-effects during rendering (use event handlers or effects instead)
  - **Local mutation is OK**: Mutating variables created during the same render is acceptable
    ```tsx
    // ✅ Good: Local mutation
    function TodoList({ todos }) {
      const items = [];
      for (const todo of todos) {
        items.push(<TodoItem key={todo.id} todo={todo} />);
      }
      return <ul>{items}</ul>;
    }
    
    // ❌ Bad: Mutating external variable
    let count = 0;
    function Counter() {
      count++; // ❌ Mutating external variable
      return <div>{count}</div>;
    }
    
    // ✅ Good: Using state instead
    function Counter() {
      const [count, setCount] = useState(0);
      return <div>{count}</div>;
    }
    ```
- **Pure components enable**:
  - Server-side rendering (same result on server and client)
  - Automatic optimization by React Compiler
  - Safe caching and memoization
  - Predictable behavior and easier testing

### **Error Boundaries**
- **Error Boundaries must be Client Components**
  - Error Boundary components must have `'use client'` directive
  - Server Components cannot be Error Boundaries (React limitation)
  - **Why Client Components?**: Error Boundaries use class components or error handling hooks that require client-side JavaScript
  - **Implementation pattern**:
    ```tsx
    'use client';
    import { Component, ReactNode } from 'react';
    
    interface Props {
      children: ReactNode;
      fallback?: ReactNode;
    }
    
    interface State {
      hasError: boolean;
    }
    
    export class ErrorBoundary extends Component<Props, State> {
      constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
      }
      
      static getDerivedStateFromError() {
        return { hasError: true };
      }
      
      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // Log to error tracking service (Sentry, etc.)
      }
      
      render() {
        if (this.state.hasError) {
          return this.props.fallback || <div>Something went wrong</div>;
        }
        return this.props.children;
      }
    }
    ```
  - **Placement strategy**: Place Error Boundaries at strategic points in your component tree
    - Global boundary in root layout for app-wide errors
    - Route-level boundaries in `error.tsx` files for route-specific errors
    - Feature-level boundaries around critical features
  - **Error Boundaries with Suspense**: Combine Error Boundaries with Suspense for better error isolation
    - Suspense boundaries catch loading states
    - Error Boundaries catch error states
    - This provides granular error handling for different parts of your app

### **Keys in Lists**
- Implement proper key props for lists; keys must be stable and derived from data
  - React docs explicitly state: keys should not be generated from array index or random values
  - Keys must be unique, stable across re-renders, and derived from the data itself
  - **Why not use index?**: Using array index as key causes bugs when items are reordered, added, or removed
    - React uses keys to identify which items changed, were added, or removed
    - When using index, React can't distinguish between item changes and reordering
    - This leads to incorrect component state preservation and performance issues
  - **When index is acceptable**: Only for truly static lists that never reorder, add, or remove items
  - **Best Practice**: Always use unique, stable IDs from your data
    - Pattern: `key={item.id}` (from database or stable identifier)
    - Pattern: `key={`${item.category}-${item.id}`}` (composite key when needed)
    - Avoid: `key={index}`, `key={Math.random()}`, `key={item.name}` (unless name is guaranteed unique and stable)
  - **Example of correct usage**:
    ```tsx
    // ✅ Good: Using stable ID from data
    {items.map(item => <Item key={item.id} data={item} />)}
    
    // ❌ Bad: Using index
    {items.map((item, index) => <Item key={index} data={item} />)}
    
    // ❌ Bad: Using random value
    {items.map(item => <Item key={Math.random()} data={item} />)}
    ```

### **Effects Best Practices**
- **Effects must be independent and idempotent**
  - React 19 with Concurrent Rendering does not guarantee execution order of effects
  - Best Practice: effects should be independent and idempotent (safe to run multiple times)
  - Do not rely on effects executing in a specific order
  - Each effect should handle its own cleanup and state independently
  - **Idempotent effects**: Effects should produce the same result when run multiple times
    - Example: Setting up a subscription should check if already subscribed before subscribing
    - Example: Cleanup functions should safely handle cases where setup didn't complete
- Implement cleanup in `useEffect` hooks; prefer `useEffectEvent` for event-like logic separation
  - **Cleanup functions are essential**: Always return cleanup functions from effects that set up subscriptions, timers, or event listeners
  - Pattern: `useEffect(() => { const subscription = subscribe(); return () => subscription.unsubscribe(); }, [])`
  - **Race conditions in data fetching**: Use cleanup flags to ignore stale responses
    ```tsx
    useEffect(() => {
      let ignore = false;
      fetchData().then(data => {
        if (!ignore) setData(data);
      });
      return () => { ignore = true; };
    }, [query]);
    ```
- **When NOT to use Effects** (React best practices):
  - **Don't use Effects to transform data for rendering**: Calculate during rendering instead
    - ❌ Bad: `useEffect(() => { setFiltered(items.filter(...)); }, [items])`
    - ✅ Good: `const filtered = items.filter(...);` (calculate during render)
  - **Don't use Effects to handle user events**: Use event handlers directly
    - ❌ Bad: `useEffect(() => { if (isSubmitted) submitForm(); }, [isSubmitted])`
    - ✅ Good: `onClick={() => submitForm()}` (handle in event handler)
  - **Don't use Effects to update state based on props/state**: Calculate during rendering or use key prop
    - ❌ Bad: `useEffect(() => { setFullName(firstName + ' ' + lastName); }, [firstName, lastName])`
    - ✅ Good: `const fullName = firstName + ' ' + lastName;` (calculate during render)
    - ✅ Alternative: Use `key` prop to reset component state when needed
  - **Don't use Effects to cache expensive calculations**: Use `useMemo` or React Compiler
    - ❌ Bad: `useEffect(() => { setProcessed(expensive(data)); }, [data])`
    - ✅ Good: `const processed = useMemo(() => expensive(data), [data])` or rely on React Compiler
  - **Don't use Effects for data fetching in modern frameworks**: Use Server Components, Server Actions, or framework data fetching
    - Next.js provides better data fetching with Server Components, Server Actions, and Route Handlers
    - Effects for data fetching require manual cleanup, race condition handling, and loading state management
  - **Do use Effects** to synchronize with external systems:
    - Browser APIs (scroll position, window size, geolocation)
    - Third-party widgets (maps, charts, analytics)
    - Network subscriptions (WebSockets, Server-Sent Events)
    - Timers and intervals (with proper cleanup)
    - Focus management and keyboard shortcuts
  - **Modern frameworks (like Next.js) provide better data fetching mechanisms than Effects**
    - Server Components for initial data fetching
    - Server Actions for mutations
    - Route Handlers for API endpoints
    - These eliminate the need for Effects in most data fetching scenarios

### **Performance Optimization (React-Specific)**
- **React DevTools Profiler**: Use React DevTools Profiler to identify performance bottlenecks
  - Profile component render times to find slow components
  - Identify unnecessary re-renders and optimize with React Compiler or manual memoization
  - Measure impact of optimizations before and after changes
  - Focus optimization efforts on components that actually impact user experience
- **React Compiler Automatic Optimization**:
  - React Compiler automatically optimizes most component re-renders
  - Reduces need for manual `useMemo`, `useCallback`, and `React.memo` in many cases
  - Still use manual memoization when you need precise control or for effect dependencies
  - Monitor bundle size and compile times when enabling React Compiler
- Use code splitting with dynamic imports; `next/dynamic` for lazy loading
- Use React Server Components to reduce bundle size
- Implement **Adaptive Hydration**: prioritize hydration based on user conditions, device capabilities, and component importance
- Use **Modular Rendering**: split UI into independent modules that can render and hydrate separately

**When generating code for this project, follow these React-specific rules by default unless the user explicitly asks for a different approach.**

