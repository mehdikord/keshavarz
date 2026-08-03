## **ESLint Best Practices**

> **Note**: This document focuses on ESLint-specific best practices. For Next.js-specific practices, see [Next.js.md](./Next.js.md). For React-specific practices, see [React.md](./React.md). For TypeScript practices, see [TypeScript.md](./TypeScript.md). For shared/general practices, see [Shared.md](./Shared.md).

### **Installation & Setup**
- Install ESLint: `npm install -D eslint @eslint/js`
- Initialize configuration: `npm init @eslint/config`
- **Next.js 16**: Use ESLint Flat Config format (default for `@next/eslint-plugin-next`)
- **ESLint v10**: Flat Config is the default; legacy `.eslintrc` format is deprecated
- **Best Practice**: Use Flat Config format (`eslint.config.js` or `eslint.config.mjs`)

### **ESLint Flat Config (Recommended)**
- **File name**: `eslint.config.js` or `eslint.config.mjs`
- **Format**: Use `defineConfig` helper for better TypeScript support
  ```js
  import { defineConfig } from "eslint/config";
  import js from "@eslint/js";
  import globals from "globals";

  export default defineConfig([
    {
      files: ["**/*.js", "**/*.jsx"],
      languageOptions: {
        globals: globals.browser,
        ecmaVersion: "latest",
        sourceType: "module",
      },
      plugins: {
        js,
      },
      rules: {
        ...js.configs.recommended.rules,
      },
    },
  ]);
  ```
- **Migration**: Migrate from `.eslintrc` to Flat Config (see [Migration Guide](#migration-from-legacy-config))

### **Next.js Integration**
- **Install Next.js ESLint plugin**: `npm install -D eslint-config-next`
- **Flat Config example**:
  ```js
  import { defineConfig } from "eslint/config";
  import nextPlugin from "eslint-config-next";

  export default defineConfig([
    ...nextPlugin,
    {
      rules: {
        // Custom rules
      },
    },
  ]);
  ```
- **Note**: `next lint` command removed in Next.js 16; use `npm run lint` or direct ESLint commands
- **Best Practice**: Use `eslint-config-next` which includes recommended Next.js rules

### **TypeScript Integration**
- **Install TypeScript ESLint**: `npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin`
- **Flat Config example**:
  ```js
  import { defineConfig } from "eslint/config";
  import tseslint from "typescript-eslint";
  import js from "@eslint/js";

  export default defineConfig([
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ["**/*.ts", "**/*.tsx"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          project: "./tsconfig.json",
        },
      },
      plugins: {
        "@typescript-eslint": tseslint.plugin,
      },
      rules: {
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-explicit-any": "warn",
      },
    },
  ]);
  ```
- **Important rules**:
  - `@typescript-eslint/no-floating-promises`: Prevent unhandled promises
  - `@typescript-eslint/no-unused-vars`: Remove unused variables
  - `@typescript-eslint/no-explicit-any`: Warn on `any` types

### **React Integration**
- **Install React ESLint plugin**: `npm install -D eslint-plugin-react eslint-plugin-react-hooks`
- **Flat Config example**:
  ```js
  import { defineConfig } from "eslint/config";
  import react from "eslint-plugin-react";
  import reactHooks from "eslint-plugin-react-hooks";

  export default defineConfig([
    {
      files: ["**/*.jsx", "**/*.tsx"],
      plugins: {
        react,
        "react-hooks": reactHooks,
      },
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      settings: {
        react: {
          version: "detect",
        },
      },
      rules: {
        ...react.configs.recommended.rules,
        ...reactHooks.configs.recommended.rules,
        "react/react-in-jsx-scope": "off", // Not needed in React 17+
        "react/prop-types": "off", // Use TypeScript instead
      },
    },
  ]);
  ```
- **React 19**: Install `eslint-plugin-react-hooks@latest` for compiler-aware linting
- **Important rules**:
  - `react-hooks/rules-of-hooks`: Enforce Rules of Hooks
  - `react-hooks/exhaustive-deps`: Check effect dependencies

### **Rule Configuration**
- **Rule levels**:
  - `"off"` or `0`: Turn rule off
  - `"warn"` or `1`: Warning (doesn't affect exit code)
  - `"error"` or `2`: Error (exit code will be 1)
- **Configure rules**:
  ```js
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
      "prefer-const": "error",
    },
  }
  ```
- **Best Practice**: Start with recommended configs, then customize as needed

### **File Patterns & Ignoring**
- **File patterns**: Use `files` array to specify which files to lint
  ```js
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    // rules apply to these files
  }
  ```
- **Ignoring files**: Use `ignores` array
  ```js
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "coverage/**",
    ],
  }
  ```
- **`.eslintignore` file**: Alternative way to ignore files (legacy, prefer `ignores` in config)

### **Recommended Rules for Next.js + React + TypeScript**
```js
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "eslint-config-next";

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextPlugin,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // TypeScript
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      
      // React
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // General
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
]);
```

### **Pre-commit Hooks**
- **Husky + lint-staged**: Run ESLint on staged files before commit
  ```json
  // package.json
  {
    "lint-staged": {
      "*.{js,jsx,ts,tsx}": [
        "eslint --fix",
        "prettier --write"
      ]
    }
  }
  ```
- **Install**: `npm install -D husky lint-staged`
- **Setup**: `npx husky init` and configure pre-commit hook

### **CI/CD Integration**
- **Run ESLint in CI**: Add to CI pipeline
  ```yaml
  # .github/workflows/ci.yml
  - name: Run ESLint
    run: npm run lint
  ```
- **Exit on error**: ESLint exits with code 1 on errors (default)
- **Best Practice**: Fail CI build on ESLint errors

### **Editor Integration**
- **VS Code**: Install ESLint extension
- **Settings**: Enable format on save and auto-fix
  ```json
  {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "eslint.validate": [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact"
    ]
  }
  ```

### **Auto-fix**
- **Command line**: `npx eslint --fix .`
- **Fix specific files**: `npx eslint --fix file.js`
- **Best Practice**: Run `--fix` before committing to fix auto-fixable issues

### **Custom Rules**
- **Create custom rules**: For project-specific patterns
- **Use plugins**: Install community plugins for additional rules
- **Best Practice**: Prefer existing plugins over custom rules when possible

### **Performance**
- **Cache**: ESLint caches results by default (`.eslintcache`)
- **Parallel execution**: ESLint runs in parallel by default
- **Ignore patterns**: Use `ignores` to skip unnecessary files

### **Migration from Legacy Config**
- **From `.eslintrc` to Flat Config**:
  1. Install ESLint v9+ (Flat Config is default)
  2. Rename `.eslintrc.*` to `eslint.config.js`
  3. Convert configuration format
  4. Update plugins and extends syntax
- **Migration tool**: Use `@eslint/config` to help with migration
- **Best Practice**: Migrate to Flat Config for better performance and maintainability

### **Common Patterns**

#### **Separate Configs for Different File Types**
```js
export default defineConfig([
  // JavaScript files
  {
    files: ["**/*.js", "**/*.jsx"],
    // ... config
  },
  // TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"],
    // ... config
  },
  // Test files
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
```

#### **Environment-Specific Rules**
```js
{
  files: ["**/*.ts", "**/*.tsx"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
  },
}
```

### **Best Practices Summary**
- ✅ Use ESLint Flat Config format (ESLint v9+)
- ✅ Use `eslint-config-next` for Next.js projects
- ✅ Enable TypeScript ESLint rules for type safety
- ✅ Enable React Hooks rules for React projects
- ✅ Configure pre-commit hooks (Husky + lint-staged)
- ✅ Run ESLint in CI/CD pipeline
- ✅ Use editor integration for real-time feedback
- ✅ Run `--fix` to auto-fix issues
- ✅ Ignore build artifacts and dependencies
- ✅ Start with recommended configs, customize as needed
- ✅ Keep rules consistent across the project
- ✅ Document custom rules and their rationale

### **Common Mistakes to Avoid**
- ❌ **Don't use legacy `.eslintrc` format**: Migrate to Flat Config
- ❌ **Don't ignore ESLint errors**: Fix or disable with comments
- ❌ **Don't disable too many rules**: Understand why rules exist
- ❌ **Don't skip ESLint in CI**: Enforce code quality
- ❌ **Don't use global ESLint install**: Install locally per project
- ❌ **Don't ignore unused imports**: Remove them (TypeScript helps)

**When generating code for this project, ensure all code passes ESLint with zero errors. Follow these rules to maintain code quality and consistency.**

