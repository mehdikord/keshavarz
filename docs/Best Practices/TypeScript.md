## **TypeScript Best Practices for Next.js & React Projects**

> **Note**: This document focuses on TypeScript-specific best practices. For Next.js-specific practices, see [Next.js.md](./Next.js.md). For React-specific practices, see [React.md](./React.md). For Tailwind CSS practices, see [Tailwind.md](./Tailwind.md). For shadcn/ui practices, see [shadcn.md](./shadcn.md). For Zod practices, see [Zod.md](./Zod.md). For Prisma practices, see [Prisma.md](./Prisma.md). For Testing practices, see [Testing.md](./Testing.md). For ESLint practices, see [ESLint.md](./ESLint.md). For shared/general practices, see [Shared.md](./Shared.md).

**General**

- Assume **strict TypeScript** configuration: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`, `noUnusedLocals: true`, `noUnusedParameters: true`.
- All code must pass `npm run lint` with zero errors or warnings.
- Prefer **explicit types** over `any` or implicit `any`.
- Never use `@ts-ignore` or `@ts-expect-error` unless absolutely necessary and with clear justification.

### Type Safety & Strictness

- Always define return types for functions, especially async functions and Server Actions.
- Use `void` for functions that don't return a value explicitly.
- Use `never` for functions that never return (error throwers, infinite loops).
- Always handle `undefined` and `null` explicitly when `noUncheckedIndexedAccess` is enabled.
- Use optional chaining (`?.`) and nullish coalescing (`??`) appropriately.
- Use type guards (`typeof`, `instanceof`, custom guards) instead of type assertions when possible.
- Prefer `as const` for literal types and readonly arrays when immutability is needed.
- **Use `satisfies` operator for object literals (introduced in TypeScript 4.9)**
  - `satisfies` provides type safety without type widening
  - Best Practice for config objects, mappings, and object literals
  - Pattern: `const config = { ... } satisfies ConfigType` instead of `const config: ConfigType = { ... }`
  - Preserves literal types while ensuring type compatibility
  - Example: `const theme = { primary: '#000', secondary: '#fff' } satisfies ThemeConfig`
  - **Note**: Requires TypeScript 4.9+; use when you need both type checking and literal type preservation

### Type Definitions & Interfaces

- **Interface vs Type Aliases**:
  - Use `interface` until you need features from `type` (recommended by TypeScript docs)
  - `interface` supports declaration merging and is more performant for the compiler
  - Use `interface` for object shapes that might be extended or merged
  - Use `type` for unions, intersections, computed types, and when you need features not available in `interface`
  - `interface` names always appear in error messages (helpful for debugging)
- Always export types/interfaces that are used in multiple files.
- Use `type-only imports/exports` (`import type`, `export type`) for types to avoid runtime imports.
- Define shared types in `types/` directory; feature-specific types in feature folders.
- Use branded types for IDs and sensitive values to prevent type confusion.
- Avoid `any`; use `unknown` when type is truly unknown, then narrow with type guards.
- **Consider union string literals vs `enum`**
  - In modern TypeScript, objects with `as const` can often replace enums
  - Use `enum` when you need reverse mapping (numeric enums) or const enum performance benefits
  - Use union string literals (`type Status = 'pending' | 'success' | 'error'`) for better tree-shaking and JavaScript alignment
  - Pattern with `as const`: `const Direction = { Up: 0, Down: 1, Left: 2, Right: 3 } as const` with `type Direction = typeof Direction[keyof typeof Direction]`
  - Example: `type Theme = 'light' | 'dark' | 'auto'` instead of `enum Theme { Light, Dark, Auto }`
  - Both approaches are valid; choose based on your specific needs (reverse mapping, performance, tree-shaking)

### Import/Export Organization

- Use type-only imports: `import type { TypeName } from '...'` for types, interfaces, enums.
- Separate type imports from value imports when both are needed.
- Use absolute imports with path aliases (`@/`, `@/features/*`, `@/components/*`).
- Group imports: external packages → internal absolute → relative imports.
- Remove all unused imports; ESLint should report zero unused imports.
- Use named exports over default exports for better tree-shaking and refactoring.

### React + TypeScript Patterns

- Always type component props explicitly; avoid `React.FC` (prefer explicit function signatures).
  - Pattern: `function Component({ prop1, prop2 }: Props) { ... }` instead of `const Component: React.FC<Props> = ...`
  - `React.FC` implicitly includes `children` prop and has other issues; explicit typing is preferred
- Type event handlers: `React.MouseEvent<HTMLButtonElement>`, `React.ChangeEvent<HTMLInputElement>`, etc.
- Use `React.ReactNode` for children that accept any renderable content.
- Use `React.ComponentProps<'element'>` or `React.ComponentPropsWithoutRef<'element'>` for extending HTML element props.
- Type refs: `React.RefObject<T>`, `React.MutableRefObject<T>`, or `React.Ref<T>`.
- Use proper types for hooks: `useState<Type>()`, `useRef<Type>(null)`, `useCallback<(arg: ArgType) => ReturnType>()`.
- Type context: `React.createContext<Type | undefined>(undefined)` and provide proper default or guard.
- Type `<Activity>` component (React 19.2): `<Activity mode="visible" | "hidden">` with proper children typing.
  - Props: `{ mode: "visible" | "hidden", children: React.ReactNode }`.

### Next.js 16 + TypeScript Patterns

- Type Server Actions: `async function actionName(formData: FormData): Promise<ActionResult>`.
  - Return type should be explicit: `Promise<{ success: boolean, data?: T, error?: string }>` or similar.
  - Use with `useActionState`: ensure Server Action signature matches `useActionState` generic types.
- Type Route Handlers: `export async function GET(request: NextRequest): Promise<NextResponse>`.
  - Use `NextRequest` from `next/server`; return `NextResponse` with proper typing.
- Type metadata: `export const metadata: Metadata = { ... }` or `export async function generateMetadata(): Promise<Metadata>`.
  - Use `Metadata` type from `next`; type dynamic metadata functions properly.
- Type dynamic route params: `{ params }: { params: Promise<{ id: string }> }` (version-specific behavior).
  - **Next.js 16 breaking change**: In Next.js 16, params are always `Promise<{ [key: string]: string }>` and must be awaited before use.
  - Next.js 15 allowed synchronous access to params, which was removed in Next.js 16.
  - Pattern: `const { id } = await params` then use `id` with proper typing.
  - This behavior is version-specific; developers need to be aware of this breaking change when upgrading to Next.js 16+.
- Type search params: `{ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }` (version-specific behavior).
  - **Next.js 16 breaking change**: In Next.js 16, searchParams are Promise-based and must be awaited.
  - Pattern: `const { query } = await searchParams` then use `query` with proper typing.
  - This behavior is version-specific; ensure code uses `await searchParams` in Next.js 16+ contexts.
- Use `NextRequest` and `NextResponse` types for route handlers and `proxy.ts`.
- Type Next.js 16 async APIs: `const cookieStore = await cookies(): Promise<ReadonlyRequestCookies>`, `const headersList = await headers(): Promise<Headers>`, `const draft = await draftMode(): Promise<{ isEnabled: boolean }>`.
  - All three are async in Next.js 16; always await and type the return values.
- Type `proxy.ts` (Next.js 16): `export function proxy(request: NextRequest): Promise<NextResponse | Response | null>`.
  - Replaces `middleware.ts`; **only supports Node.js runtime and cannot be configured** (unlike `middleware.ts` which defaulted to Edge Runtime in older Next.js versions).
  - If Edge runtime is needed, use Route Handlers with `export const runtime = 'edge'` or keep using `middleware.ts` (deprecated but still functional).
  - Type request/response properly.
  - **Important**: Do NOT use cache/revalidation APIs (`revalidateTag`, `updateTag`, `refresh`) in `proxy.ts`; these APIs are only available in Server Actions or Route Handlers.

### Async & Promises

- Always type Promise return values: `Promise<Type>`, `Promise<void>`, `Promise<Type | null>`.
- Handle Promise rejections explicitly; use `try/catch` or `.catch()`.
- Type async functions: `async function name(): Promise<ReturnType> { ... }`.
- Use `Awaited<Type>` utility type when unwrapping Promise types.
- Never leave unhandled promises; ESLint `@typescript-eslint/no-floating-promises` should pass.

### Function Overloads

- **Ordering**: Put more specific overloads before more general ones.
  - TypeScript chooses the first matching overload, so specific signatures must come first
  - Example: `function fn(x: HTMLDivElement): string; function fn(x: HTMLElement): number; function fn(x: unknown): unknown;`
- **Prefer Union Types**: When overloads have the same argument count and return type, use union types instead.
  - Instead of: `function len(s: string): number; function len(arr: any[]): number;`
  - Use: `function len(x: string | any[]): number { return x.length; }`
- **Use Optional Parameters**: Instead of multiple overloads that differ only in trailing parameters, use optional parameters.
  - Instead of: `diff(one: string): number; diff(one: string, two: string): number; diff(one: string, two: string, three: boolean): number;`
  - Use: `diff(one: string, two?: string, three?: boolean): number;`
- **Don't Use Optional Parameters in Callbacks**: When writing function types for callbacks, never write an optional parameter unless you intend to call the function without passing that argument.
  - Wrong: `callback: (arg: any, index?: number) => void` (means callback might be called with one argument)
  - Correct: `callback: (arg: any, index: number) => void` (callbacks can ignore extra parameters)

### Error Handling Types

- Create custom error classes extending `Error` with proper typing.
- Type error boundaries: `componentDidCatch(error: Error, errorInfo: React.ErrorInfo)`.
- Use discriminated unions for error states: `{ success: true, data: T } | { success: false, error: string }`.
- Type error responses consistently: `{ success: boolean, error?: string, message?: string }`.

### Array & Object Types

- Use readonly arrays when immutability is required: `readonly Type[]` or `ReadonlyArray<Type>`.
- Type array methods properly: `.map((item: Type) => ...)`, `.filter((item: Type): item is Type => ...)`.
- Use type predicates for filtered arrays: `(item): item is Type => ...`.
- Type object destructuring: `const { prop }: { prop: Type } = obj`.
- Use `Record<Key, Value>` for object maps, `Partial<Type>` for optional properties, `Required<Type>` for required.

### Generic Types

- Use descriptive generic names: `T`, `TData`, `TKey`, `TValue` (not single letters like `A`, `B`).
- Add constraints to generics when needed: `<T extends BaseType>`.
- Use default generic parameters when appropriate: `<T = string>`.
- Document complex generics with JSDoc comments.
- **Generic Function Guidelines** (from TypeScript docs):
  - **Push type parameters down**: Prefer `function firstElement<Type>(arr: Type[])` over `function firstElement<Type extends any[]>(arr: Type)` to avoid inference issues
  - **Use fewer type parameters**: Don't create type parameters that don't relate multiple values
  - **Type parameters should appear twice**: If a type parameter only appears once, reconsider if it's needed (it should relate input and output types)
  - Example: `function filter1<Type>(arr: Type[], func: (arg: Type) => boolean): Type[]` is better than creating a separate type parameter for the function

### Utility Types

- Use TypeScript utility types: `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`, `Readonly<T>`.
- Use `NonNullable<T>`, `Exclude<T, U>`, `Extract<T, U>` for type manipulation.
- Use `Parameters<F>`, `ReturnType<F>`, `Awaited<T>` for function and promise types.
- Use `ConstructorParameters<Type>` and `InstanceType<Type>` for class types.
- Use `ThisParameterType<Type>` and `OmitThisParameter<Type>` for `this` parameter manipulation.
- Use `ThisType<Type>` for contextual `this` typing (requires `noImplicitThis` to be enabled).
- Use `NoInfer<Type>` (TypeScript 5.4+) to block type inference when needed: `function createStreetLight<C extends string>(colors: C[], defaultColor?: NoInfer<C>)`.
- **Important**: Variance annotations (`in`, `out`, `in out`) should only be used in extremely rare cases when TypeScript's automatic variance inference is incorrect. Do NOT use them to force a particular variance behavior.

### ESLint Compliance

- **Code Quality Rules**:
  - No unused variables: remove or prefix with `_` if intentionally unused.
  - No unused imports: remove all unused import statements.
  - No `any` types: use `unknown` and type guards instead (see General section above).
  - No `@ts-ignore` or `@ts-expect-error`: fix the underlying type issue instead (see General section above).
  - No console statements in production code (use proper logging).
  - No empty functions: either implement or remove.
- **Naming Conventions**:
  - Consistent naming: `camelCase` for variables/functions, `PascalCase` for types/components, `UPPER_CASE` for constants.
  - Use arrow functions or function declarations consistently (follow project style).

### Type Assertions & Guards

- Avoid type assertions (`as Type`); prefer type guards and proper typing.
- When assertions are necessary:
  - Use `as const` for literal type narrowing: `const req = { method: 'GET' } as const` preserves literal types
  - Use `as Type` sparingly and document why it's necessary
  - Remember: type assertions don't change runtime behavior, only compile-time types
- Create custom type guard functions: `function isType(value: unknown): value is Type { ... }`.
- Use `instanceof` for class type checks, `typeof` for primitive checks.
- Prefer type guards over type assertions for runtime safety.

### Module & Namespace

- Use ES modules (`import`/`export`); avoid `namespace` unless interfacing with legacy code.
- Use `declare module` for ambient module declarations when needed.
- Use `declare global` sparingly and only for extending global types.

### React Hooks Types

- Type `useState`: `const [state, setState] = useState<Type>(initialValue)`.
- Type `useRef`: `const ref = useRef<Type>(null)` or `useRef<Type | null>(null)`.
- Type `useCallback`: `useCallback<(arg: Type) => ReturnType>(fn, deps)`.
- Type `useMemo`: `useMemo<ReturnType>(() => value, deps)`.
- Type custom hooks: `function useCustomHook(): ReturnType { ... }`.
- Type hook dependencies correctly; ensure all dependencies are included.

### React 19 Hooks Types

- Type `useActionState`: `const [state, action, pending] = useActionState<StateType, FormData>(serverAction, initialState)`.
  - `StateType` is the state shape, `FormData` is the form data type (or `FormData` from DOM).
  - Return type: `[StateType, (formData: FormData) => Promise<StateType>, boolean]`.
- Type `useFormStatus`: `const { pending, data, method, action } = useFormStatus()`.
  - Returns `{ pending: boolean, data: FormData | null, method: string, action: string | ((formData: FormData) => void) | null }`.
- Type `useOptimistic`: `const [optimisticState, addOptimistic] = useOptimistic<StateType>(state, reducer)`.
  - `reducer: (currentState: StateType, optimisticValue: OptimisticType) => StateType`.
- Type `use()` hook: `const value = use<Type>(promise)` or `const context = use<ContextType>(context)`.
  - Works with both Promises and Context; type the generic parameter explicitly.
- Type `useEffectEvent` (React 19.2): `const handleEvent = useEffectEvent<(arg: Type) => void>((arg) => { ... })`.
  - Separates event-like logic from `useEffect` dependencies; type the event handler signature.
- Type `cacheSignal` (React 19.2): `const signal = cacheSignal()` returns `AbortSignal | undefined`.
  - Use for advanced caching/abort scenarios in heavy routes.

### Form & Event Types (React 19)

- Type form data: `FormData`, `HTMLFormElement`, or custom typed form state.
- Type form events: `React.FormEvent<HTMLFormElement>`, `React.ChangeEvent<HTMLInputElement>`.
- Type input values: `string`, `number`, `boolean` explicitly; avoid implicit `any`.
- Use Zod schemas with TypeScript inference: `z.infer<typeof schema>`.
- Type React 19 form pattern: `<form action={serverAction}>` where `serverAction: (formData: FormData) => Promise<StateType>`.
  - Server Action must match `useActionState` generic: `useActionState<StateType, FormData>(serverAction, initialState)`.
- Type form state with `useActionState`: `const [state, action, pending] = useActionState<StateType, FormData>(serverAction, initialState)`.
  - `StateType` is the form state shape; `FormData` is the form data type (usually DOM `FormData`).

### API & Fetch Types

- Type fetch responses: `Promise<Response>`, then narrow with type guards or Zod.
- Type API responses: `Promise<{ success: boolean, data?: T, error?: string }>`.
- Use `NextRequest` and `NextResponse` types for Next.js API routes.
- Type request bodies: `request.json()` returns `Promise<unknown>`, validate and type assert.

### Database & Prisma Types

- Use Prisma generated types: `Prisma.UserCreateInput`, `Prisma.UserWhereInput`, etc.
- Type Prisma results: `Promise<User | null>`, `Promise<User[]>`, handle null cases.
- Use Prisma `select` and `include` with proper typing for optimized queries.
- Type transaction results properly when using Prisma transactions.

### Environment Variables

- Type environment variables: create a typed config object, validate with Zod.
- Use `process.env.NEXT_PUBLIC_*` for client-side variables; type them explicitly.
- **File Organization**:
  - `.env.local`: Local development secrets (never commit, in `.gitignore`)
  - `.env.example`: Template file with placeholder values (commit to repository)
  - `.env*` files (`.env`, `.env.development`, `.env.production`, etc.): Should NOT be committed to repository
  - **Best Practice**: Only commit `.env.example`; all actual `.env*` files should be in `.gitignore`
  - Sensitive values should always be in `.env.local` and never committed
- **Important**: Only `NEXT_PUBLIC_*` variables are accessible in client-side runtime
  - Direct access to `process.env` in client components only works for `NEXT_PUBLIC_*` prefixed variables
  - All other environment variables are server-only and not available in client runtime
  - This is an official Next.js constraint, not just a validation recommendation
  - Pattern: create typed env module that validates and exposes only allowed variables
- Never use `process.env` directly without type checking; create a typed env module.

### Conditional Types & Mapped Types

- Use conditional types for advanced type manipulation when needed: `T extends U ? X : Y`.
- Use mapped types for transforming object types: `{ [K in keyof T]: ... }`.
- Document complex type manipulations with comments.

### Type Narrowing

- Use type narrowing in conditionals: `if (typeof value === 'string') { ... }`.
- **Type Guard Patterns**:
  - Use `typeof` for primitive type checks: `typeof value === 'string'`, `typeof value === 'number'`, etc.
  - Use `instanceof` for class type checks: `value instanceof Date`, `value instanceof Error`
  - Use `in` operator for property checks: `'swim' in animal` to narrow union types
  - Use type predicates for custom narrowing: `function isFish(pet): pet is Fish { return (pet as Fish).swim !== undefined }`
  - Use equality checks (`===`, `!==`, `==`, `!=`) for narrowing: `if (x === y)` narrows both variables
- **Discriminated Unions**:
  - Use discriminated unions for state machines and variant types
  - Pattern: `interface Circle { kind: 'circle'; radius: number }` and `interface Square { kind: 'square'; sideLength: number }`
  - Use a common discriminant property (e.g., `kind`) to enable narrowing
  - TypeScript automatically narrows based on the discriminant property
- Narrow types in `if`, `switch`, `while` statements appropriately.
- Use `asserts` functions for assertion-based narrowing when needed: `function assertIsString(value: unknown): asserts value is string { ... }`
- **Exhaustive Checking**: Use `never` type in switch statements for exhaustive checking:
  ```typescript
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'square': return shape.sideLength ** 2;
    default: const _exhaustiveCheck: never = shape; return _exhaustiveCheck;
  }
  ```

### Next.js 16 Cache Components Types

- Type Cache Components: functions/components with `"use cache"` directive must have explicit return types.
- Type `cache()` function: `const cachedFn = cache<ReturnType>(async (args) => { ... })`.
  - `cache()` is a React API (React 19); use for memoization in Server Components.
  - Type the generic parameter with the return type.
  - Note: `cacheLife()`, `cacheTag()`, `updateTag()`, and `revalidateTag()` are from `next/cache`.
- Type `cacheLife()`: `cacheLife("hours" | "days" | "max")` returns `void`; use inside `"use cache"` scope.
- Type `cacheTag()`: `cacheTag(...tags: string[])` returns `void`; use inside `"use cache"` scope for tag management.
- Type cache directives: `"use cache"`, `'use cache: remote'`, `'use cache: private'` are string literals (no runtime types).
- Type `revalidateTag`: `revalidateTag(tag: string, profile?: 'max' | 'hours' | 'days' | { expire: number })` returns `void`.
  - Profile parameter is new in Next.js 16; type it explicitly when used.
  - Can be used in Route Handlers or Server Actions; do NOT use in `proxy.ts`.
- Type `updateTag`: `updateTag(tag: string)` returns `void`; use after mutations for read-your-writes.
  - Only available in Server Actions; do NOT use in `proxy.ts` or Route Handlers.
- Type `refresh()`: `refresh()` returns `void`; use in Server Actions to refresh uncached data.
  - Only available in Server Actions; do NOT use in `proxy.ts` or Route Handlers.

### Code Organization

- Keep type definitions close to usage when used once; extract to shared types when reused.
- Group related types together; use `namespace` only for legacy code compatibility.
- Export types from index files for cleaner imports: `export type { TypeName } from './types'`.

### Strict Mode Compliance

- All code must work with `strict: true` enabled.
- Handle `undefined` in optional properties: `obj.prop?.method()` or `obj.prop ?? defaultValue`.
- Handle array access that might be `undefined`: `arr[0] ?? defaultValue` or check length first.
- Return all code paths explicitly when `noImplicitReturns: true`.
- Type all function parameters and return types when `noImplicitAny: true`.

### React Compiler Compatibility

- Avoid patterns that break React Compiler (React Compiler must be enabled with `reactCompiler: true` in `next.config.ts` - not enabled by default):
  - No mutation of props or state directly (use immutable updates).
  - No side effects outside hooks (keep effects in `useEffect`, `useEffectEvent`, etc.).
  - Avoid dynamic hook usage; hooks must be called in consistent order.
- Type patterns that work well with React Compiler:
  - Explicit return types help compiler optimize.
  - Immutable data structures (readonly arrays, `as const`) are compiler-friendly.
  - Proper hook typing ensures compiler can analyze dependencies correctly.

### Next.js 16 Migration Notes & Breaking Changes

**Cursor must always assume these Next.js 16 breaking changes when generating code:**

- **`middleware.ts` → `proxy.ts`**: `middleware.ts` is deprecated; use `proxy.ts` instead.
  - `proxy.ts` runs in Node.js runtime by default (no runtime config needed).
  - `proxy.ts` does not support Edge runtime; for Edge runtime needs, use Route Handlers with `export const runtime = 'edge'`.
- **`params` and `searchParams` are now async/Promise-based** (breaking change from Next.js 15):
  - Pattern: `const { id } = await params` and `const { query } = await searchParams`.
  - Must await before accessing properties; this is required in Next.js 16+.
- **`next lint` command removed**: ESLint/BIOME must be run directly.
  - Use `npm run lint` or direct ESLint/BIOME commands.
  - `next build` no longer runs lint automatically.
- **Next.js 16 requires TypeScript 5.1+ and Node.js 20.9.0+** (Node.js 18 support removed).

### Next.js 16 Specific Type Considerations

- Type `generateStaticParams`: `export async function generateStaticParams(): Promise<Array<{ [key: string]: string }>>`.
  - Return type must be array of param objects matching dynamic route segments.
- Type View Transitions API: use `startViewTransition` with proper callback typing: `(callback: () => void | Promise<void>) => ViewTransition`.
- Type typed routes (when `typedRoutes: true`): use Next.js generated route types for `<Link href>` and route parameters.
  - Import route types from `.next/types/link.d.ts` or use Next.js route type helpers.

**When generating TypeScript code, ensure all code passes `npm run lint` with zero errors. Follow these rules to maintain type safety and ESLint compliance with Next.js 16 and React 19.**

