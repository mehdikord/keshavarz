## **Testing Best Practices**

> **Note**: This document focuses on testing best practices. For Next.js-specific practices, see [Next.js.md](./Next.js.md). For React-specific practices, see [React.md](./React.md). For shared/general practices, see [Shared.md](./Shared.md).

### **Testing Strategy Overview**
- **Unit Tests**: Test individual functions, utilities, and components in isolation (Vitest)
- **Integration Tests**: Test API routes and server-side logic (Vitest)
- **Component Tests**: Test React components with user interactions (React Testing Library + Vitest)
- **E2E Tests**: Test complete user flows across the application (Playwright)
- **Best Practice**: Write more unit tests, fewer E2E tests (testing pyramid)

### **When to Use Each Testing Tool**

#### **Vitest** (Unit & Integration Testing)
- ✅ Testing utility functions, helpers, and pure functions
- ✅ Testing API routes and Server Actions
- ✅ Testing business logic and data transformations
- ✅ Fast feedback during development
- ✅ Integration tests for database operations

#### **React Testing Library** (Component Testing)
- ✅ Testing React components in isolation
- ✅ Testing user interactions and component behavior
- ✅ Testing component props and state changes
- ✅ Testing accessibility and ARIA attributes
- ✅ Use with Vitest as the test runner

#### **Playwright** (E2E Testing)
- ✅ Testing complete user flows (login, checkout, etc.)
- ✅ Testing critical paths and user journeys
- ✅ Testing cross-browser compatibility
- ✅ Testing responsive design and mobile views
- ✅ Testing authentication and authorization flows

---

## **Playwright (E2E Testing)**

### **Installation & Setup**
- Install Playwright: `npm install -D @playwright/test`
- Initialize: `npx playwright install`
- Create `playwright.config.ts` in project root
- **Best Practice**: Use TypeScript for Playwright tests (`.spec.ts` files)

### **Test Philosophy**
- **Test user-visible behavior**: Verify what users see and interact with
- **Avoid implementation details**: Don't test internal implementation (function names, CSS classes, etc.)
- **Test isolation**: Each test should be completely independent
- **Avoid third-party dependencies**: Mock external services and APIs

### **Locators Best Practices**
- **Use built-in locators**: Prefer `getByRole`, `getByText`, `getByLabel`, `getByTestId`
  ```ts
  // ✅ Good: User-facing locator
  await page.getByRole('button', { name: 'Submit' }).click();
  
  // ❌ Bad: Implementation detail
  await page.locator('button.button-primary').click();
  ```
- **Prefer role-based locators**: `getByRole` is most resilient to DOM changes
- **Use chaining and filtering**: Narrow down locators to specific parts of the page
  ```ts
  const product = page.getByRole('listitem').filter({ hasText: 'Product 2' });
  await product.getByRole('button', { name: 'Add to cart' }).click();
  ```
- **Use `data-testid` sparingly**: Only when no other locator works
  ```ts
  // Only when necessary
  await page.getByTestId('unique-component-id').click();
  ```
- **Generate locators**: Use `npx playwright codegen` or VS Code extension to generate locators

### **Assertions**
- **Use web-first assertions**: Playwright waits automatically
  ```ts
  // ✅ Good: Web-first assertion
  await expect(page.getByText('Welcome')).toBeVisible();
  
  // ❌ Bad: Manual assertion
  expect(await page.getByText('Welcome').isVisible()).toBe(true);
  ```
- **Use soft assertions**: For multiple checks that shouldn't stop the test
  ```ts
  await expect.soft(page.getByTestId('status')).toHaveText('Success');
  await expect.soft(page.getByTestId('count')).toHaveText('5');
  // Test continues even if assertions fail
  ```

### **Test Isolation**
- **Each test gets fresh context**: Browser context is isolated per test
- **Use `beforeEach` hooks**: For common setup (login, navigation)
  ```ts
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
  });
  ```
- **Avoid test dependencies**: Tests should not rely on other tests
- **Use setup projects**: For authentication state (see Authentication section)

### **Authentication**
- **Use setup projects**: Authenticate once, reuse state
  ```ts
  // tests/auth.setup.ts
  import { test as setup } from '@playwright/test';
  
  setup('authenticate', async ({ page }) => {
    await page.goto('/login');
    // ... authentication steps
    await page.context().storageState({ path: 'playwright/.auth/user.json' });
  });
  ```
- **Configure in `playwright.config.ts`**:
  ```ts
  export default defineConfig({
    projects: [
      { name: 'setup', testMatch: /.*\.setup\.ts/ },
      {
        name: 'chromium',
        use: { storageState: 'playwright/.auth/user.json' },
        dependencies: ['setup'],
      },
    ],
  });
  ```
- **Store auth state securely**: Add `playwright/.auth` to `.gitignore`

### **Network & API Mocking**
- **Mock external APIs**: Use `page.route()` to mock third-party services
  ```ts
  await page.route('**/api/external-service', route => route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' }),
  }));
  ```
- **Avoid testing external sites**: Mock or stub external dependencies

### **Debugging**
- **VS Code Extension**: Install Playwright extension for live debugging
- **Debug mode**: Run tests with `--debug` flag
  ```bash
  npx playwright test --debug
  ```
- **Trace Viewer**: Use for CI failures (configure in `playwright.config.ts`)
  ```ts
  use: {
    trace: 'on-first-retry', // Record trace on first retry
  },
  ```
- **HTML Report**: View test results with `npx playwright show-report`

### **CI/CD Integration**
- **Run on CI**: Set up GitHub Actions or other CI platforms
- **Use Linux on CI**: Cheaper and faster than Windows/Mac
- **Optimize browser downloads**: Only install needed browsers
  ```bash
  npx playwright install chromium --with-deps
  ```
- **Use sharding**: Split tests across multiple machines
  ```bash
  npx playwright test --shard=1/3
  ```

### **Performance**
- **Use parallelism**: Tests run in parallel by default
- **Configure parallel mode**: For tests in same file
  ```ts
  test.describe.configure({ mode: 'parallel' });
  ```
- **Use test sharding**: For large test suites on CI

### **Common Patterns**
- **Page Object Model**: Organize tests with page objects
  ```ts
  class LoginPage {
    constructor(private page: Page) {}
    
    async goto() {
      await this.page.goto('/login');
    }
    
    async login(email: string, password: string) {
      await this.page.getByLabel('Email').fill(email);
      await this.page.getByLabel('Password').fill(password);
      await this.page.getByRole('button', { name: 'Sign in' }).click();
    }
  }
  ```

### **Best Practices Summary**
- ✅ Test user-visible behavior, not implementation details
- ✅ Use role-based locators (`getByRole`, `getByText`, `getByLabel`)
- ✅ Use web-first assertions (automatic waiting)
- ✅ Keep tests isolated (fresh context per test)
- ✅ Use setup projects for authentication
- ✅ Mock external APIs and services
- ✅ Use TypeScript for better IDE support
- ✅ Run tests on CI with proper configuration
- ✅ Use trace viewer for debugging CI failures

---

## **Vitest (Unit & Integration Testing)**

### **Installation & Setup**
- Install Vitest: `npm install -D vitest`
- Configure in `vite.config.ts` or `vitest.config.ts`
  ```ts
  import { defineConfig } from 'vitest/config';
  
  export default defineConfig({
    test: {
      globals: true, // Use global test, expect, etc.
      environment: 'node', // or 'jsdom' for DOM testing
    },
  });
  ```
- **Best Practice**: Use Vitest with Vite for fast HMR and unified config

### **Writing Tests**
- **Test file naming**: Use `.test.ts` or `.spec.ts` suffix
- **Basic test structure**:
  ```ts
  import { describe, it, expect } from 'vitest';
  
  describe('sum function', () => {
    it('adds 1 + 2 to equal 3', () => {
      expect(sum(1, 2)).toBe(3);
    });
  });
  ```

### **Mocking**
- **Mock functions**: Use `vi.fn()` for function mocks
  ```ts
  import { vi } from 'vitest';
  
  const mockFn = vi.fn();
  mockFn('hello');
  expect(mockFn).toHaveBeenCalledWith('hello');
  ```
- **Mock modules**: Use `vi.mock()` for module mocking
  ```ts
  vi.mock('./api', () => ({
    fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' })),
  }));
  ```
- **Mock timers**: Use `vi.useFakeTimers()` for time-dependent tests
  ```ts
  vi.useFakeTimers();
  // ... test code
  vi.useRealTimers();
  ```
- **Clear mocks**: Always clear/restore mocks between tests
  ```ts
  beforeEach(() => {
    vi.clearAllMocks();
  });
  ```

### **Testing Async Code**
- **Async/await**: Use async/await for async tests
  ```ts
  it('fetches data', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
  });
  ```
- **Promises**: Use `.resolves` and `.rejects` matchers
  ```ts
  await expect(fetchData()).resolves.toBeDefined();
  await expect(fetchError()).rejects.toThrow();
  ```

### **Testing API Routes & Server Actions**
- **Test Server Actions**: Mock database and external services
  ```ts
  import { createUser } from '@/app/actions';
  
  vi.mock('@/lib/prisma', () => ({
    prisma: {
      user: {
        create: vi.fn(),
      },
    },
  }));
  
  it('creates a user', async () => {
    const result = await createUser({ name: 'John', email: 'john@example.com' });
    expect(result).toBeDefined();
  });
  ```

### **Coverage**
- **Enable coverage**: Configure in `vitest.config.ts`
  ```ts
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
  },
  ```
- **Run coverage**: `npx vitest --coverage`
- **Set thresholds**: Define minimum coverage requirements

### **Best Practices Summary**
- ✅ Use Vitest for unit and integration tests
- ✅ Mock external dependencies (APIs, database)
- ✅ Clear mocks between tests
- ✅ Use async/await for async code
- ✅ Enable coverage reporting
- ✅ Use TypeScript for better type safety

---

## **React Testing Library (Component Testing)**

### **Installation & Setup**
- Install dependencies:
  ```bash
  npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```
- Configure with Vitest:
  ```ts
  // vitest.config.ts
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';
  
  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
    },
  });
  ```
- Setup file (`tests/setup.ts`):
  ```ts
  import '@testing-library/jest-dom';
  ```

### **Rendering Components**
- **Basic rendering**:
  ```ts
  import { render, screen } from '@testing-library/react';
  import { Button } from './Button';
  
  it('renders button', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
  ```
- **Custom render**: Create wrapper for providers
  ```ts
  // tests/test-utils.tsx
  import { render } from '@testing-library/react';
  
  function customRender(ui: React.ReactElement, options = {}) {
    return render(ui, {
      wrapper: ({ children }) => (
        <Provider>{children}</Provider>
      ),
      ...options,
    });
  }
  
  export * from '@testing-library/react';
  export { customRender as render };
  ```

### **Querying Elements**
- **Prefer queries by role**: `getByRole`, `getAllByRole`
- **Use accessible queries**: `getByLabelText`, `getByText`, `getByPlaceholderText`
- **Avoid test IDs**: Only when necessary
  ```ts
  // ✅ Good: Query by role
  screen.getByRole('button', { name: 'Submit' });
  
  // ✅ Good: Query by label
  screen.getByLabelText('Email');
  
  // ❌ Bad: Query by test ID (unless necessary)
  screen.getByTestId('submit-button');
  ```

### **User Interactions**
- **Use `@testing-library/user-event`**: For user interactions
  ```ts
  import userEvent from '@testing-library/user-event';
  
  it('handles click', async () => {
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
  ```

### **Testing Forms**
- **Test form submission**: Fill inputs and submit
  ```ts
  it('submits form', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
  });
  ```

### **Testing Async Behavior**
- **Use `waitFor`**: For async updates
  ```ts
  import { waitFor } from '@testing-library/react';
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
  ```
- **Use `findBy` queries**: Auto-wait for elements
  ```ts
  const message = await screen.findByText('Data loaded');
  expect(message).toBeInTheDocument();
  ```

### **Accessibility Testing**
- **Test ARIA attributes**: Ensure components are accessible
  ```ts
  expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close');
  ```
- **Test keyboard navigation**: Use `userEvent.keyboard()`
  ```ts
  await user.keyboard('{Tab}');
  expect(screen.getByRole('button')).toHaveFocus();
  ```

### **Best Practices Summary**
- ✅ Test user-visible behavior, not implementation
- ✅ Use queries by role, label, or text
- ✅ Use `user-event` for interactions
- ✅ Test accessibility (ARIA, keyboard navigation)
- ✅ Use `waitFor` and `findBy` for async behavior
- ✅ Create custom render for providers
- ✅ Avoid testing implementation details

---

## **Testing Strategy**

### **Testing Pyramid**
- **Base (Unit Tests)**: Many fast unit tests (Vitest)
- **Middle (Integration Tests)**: Some integration tests (Vitest)
- **Top (E2E Tests)**: Few E2E tests for critical paths (Playwright)

### **What to Test**
- ✅ **Unit Tests**: Pure functions, utilities, helpers
- ✅ **Component Tests**: User interactions, props, state
- ✅ **Integration Tests**: API routes, Server Actions, database operations
- ✅ **E2E Tests**: Critical user flows (login, checkout, etc.)

### **What NOT to Test**
- ❌ Third-party library code
- ❌ Implementation details (internal state, function names)
- ❌ CSS classes or styling
- ❌ Framework code (React, Next.js internals)

### **Test Organization**
- **Structure**: Mirror source code structure
  ```
  app/
    users/
      page.tsx
      page.test.tsx  # Component test
  lib/
    utils.ts
    utils.test.ts    # Unit test
  tests/
    e2e/
      login.spec.ts  # E2E test
  ```

### **CI/CD Integration**
- **Run tests on every commit**: Fast feedback
- **Run unit tests first**: Fastest tests run first
- **Run E2E tests on PR**: Before merging
- **Set coverage thresholds**: Enforce minimum coverage

### **Best Practices Summary**
- ✅ Follow testing pyramid (more unit, fewer E2E)
- ✅ Test user-visible behavior
- ✅ Keep tests fast and isolated
- ✅ Mock external dependencies
- ✅ Use appropriate tool for each test type
- ✅ Run tests in CI/CD pipeline
- ✅ Maintain test coverage thresholds

**When generating code for this project, follow these testing-specific rules by default unless the user explicitly asks for a different approach.**

