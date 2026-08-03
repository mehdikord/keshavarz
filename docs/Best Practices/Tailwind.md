## **Tailwind CSS Best Practices**

> **Note**: This document focuses on Tailwind CSS-specific best practices. For Next.js-specific practices, see [Next.js.md](./Next.js.md). For React-specific practices, see [React.md](./React.md). For Zod practices, see [Zod.md](./Zod.md). For Prisma practices, see [Prisma.md](./Prisma.md). For shared/general practices, see [Shared.md](./Shared.md).

### **Configuration & Setup**
- Configure Tailwind in `tailwind.config.ts` with proper content paths
- Use `@import "tailwindcss"` in your CSS file (Tailwind v4 syntax)
- Configure content paths to scan all relevant files:
  ```ts
  // tailwind.config.ts
  export default {
    content: [
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './features/**/*.{js,ts,jsx,tsx,mdx}',
    ],
  }
  ```
- Use utility classes; avoid custom CSS when possible
- Implement responsive design with breakpoints (sm, md, lg, xl, 2xl)
- Use `dark:` prefix for dark mode; logical properties for RTL
- Leverage plugins (forms, typography); use `@apply` sparingly
- Maintain consistent spacing and color system

### **Class Detection & Dynamic Class Names**
- **Always use complete class names**: Tailwind scans source files as plain text and cannot understand string concatenation
  - ❌ **Bad**: `className={`text-${error ? 'red' : 'green'}-600`}`
  - ✅ **Good**: `className={error ? 'text-red-600' : 'text-green-600'}`
- **Map props to static class names**: When using props to determine styles, map them to complete class names
  - ❌ **Bad**: 
    ```tsx
    function Button({ color }) {
      return <button className={`bg-${color}-600 hover:bg-${color}-500`}>Click</button>;
    }
    ```
  - ✅ **Good**:
    ```tsx
    function Button({ color }) {
      const colorVariants = {
        blue: "bg-blue-600 hover:bg-blue-500",
        red: "bg-red-600 hover:bg-red-500",
      };
      return <button className={colorVariants[color]}>Click</button>;
    }
    ```
- **Why this matters**: Tailwind generates CSS only for classes it finds in your source files. Dynamic class construction prevents Tailwind from detecting the classes, resulting in missing styles.

### **Source File Scanning**
- Tailwind automatically scans all files in your project except:
  - Files in `.gitignore`
  - Files in `node_modules`
  - Binary files (images, videos, zip files)
  - CSS files
  - Common package manager lock files
- **Explicitly register external sources**: Use `@source` directive to scan external libraries
  ```css
  @import "tailwindcss";
  @source "../node_modules/@acmecorp/ui-lib";
  ```
- **Set base path**: Use `source()` function when working with monorepos
  ```css
  @import "tailwindcss" source("../src");
  ```
- **Ignore specific paths**: Use `@source not` to exclude directories
  ```css
  @import "tailwindcss";
  @source not "../src/components/legacy";
  ```
- **Safelist specific utilities**: Use `@source inline()` to force generation of classes not found in source files
  ```css
  @import "tailwindcss";
  @source inline("underline");
  @source inline("{hover:,focus:,}bg-red-{50,{100..900..100},950}");
  ```

### **Dark Mode**
- **Default behavior**: Uses `prefers-color-scheme` CSS media feature
- **Manual toggle**: Override `dark` variant to use class-based or data attribute-based dark mode
  ```css
  /* Class-based dark mode */
  @custom-variant dark (&:where(.dark, .dark *));
  
  /* Data attribute-based dark mode */
  @custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
  ```
- **Three-way theme toggle**: Support light, dark, and system preference
  ```js
  // On page load
  document.documentElement.classList.toggle(
    "dark",
    localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches),
  );
  ```
- **Best Practice**: Use class-based dark mode for manual toggles; use `prefers-color-scheme` for automatic system preference

### **Customizing Your Theme**
- Use `@theme` directive in your CSS to customize design tokens:
  ```css
  @theme {
    --font-display: "Satoshi", "sans-serif";
    --breakpoint-3xl: 120rem;
    --color-avocado-100: oklch(0.99 0 0);
    --color-avocado-500: oklch(0.84 0.18 117.33);
    --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
  }
  ```
- Customize colors, spacing, typography, breakpoints, and easing functions
- Use CSS custom properties for dynamic theming

### **Arbitrary Values**
- Use square bracket notation for one-off values that don't fit your design system
  ```html
  <div class="top-[117px] lg:top-[344px]">
  <div class="bg-[#bada55] text-[22px]">
  ```
- **Arbitrary properties**: Use for CSS properties Tailwind doesn't include utilities for
  ```html
  <div class="[mask-type:luminance] hover:[mask-type:alpha]">
  <div class="[--scroll-offset:56px] lg:[--scroll-offset:44px]">
  ```
- **Arbitrary variants**: Use for custom selectors
  ```html
  <li class="lg:[&:nth-child(-n+3)]:hover:underline">
  ```
- **Handling whitespace**: Use underscore (`_`) instead of space in arbitrary values
  ```html
  <div class="grid-cols-[1fr_500px_2fr]">
  ```
- **CSS variables**: Use custom property syntax for CSS variables
  ```html
  <div class="fill-(--my-brand-color)">
  ```

### **States & Variants**
- Use variants to apply utilities conditionally: `hover:`, `focus:`, `active:`, `dark:`, `md:`, etc.
- Stack variants for specific conditions: `dark:md:hover:bg-fuchsia-600`
- Available variant categories:
  - **Pseudo-classes**: `:hover`, `:focus`, `:active`, `:first-child`, `:required`
  - **Pseudo-elements**: `::before`, `::after`, `::placeholder`, `::selection`
  - **Media queries**: Responsive breakpoints, dark mode, `prefers-reduced-motion`
  - **Attribute selectors**: `[dir="rtl"]`, `[open]`
  - **Child selectors**: `& > *`, `& *`

### **Adding Custom Styles**
- **Prefer utility classes**: Most designs can be built with utilities alone
- **Use `@apply` sparingly**: Only when you have repeated patterns that can't be extracted to components
  ```css
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded;
  }
  ```
- **Custom CSS**: Use for truly custom styles that don't fit the utility model
- **Plugins**: Create plugins for reusable custom utilities
- **Best Practice**: Extract repeated patterns to React components rather than CSS classes

### **Editor Setup & Developer Experience**
- **VS Code**: Install [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) extension
  - Provides autocomplete, syntax highlighting, linting, and hover previews
- **Cursor**: Supports VS Code extensions, including Tailwind IntelliSense
- **Zed**: Built-in Tailwind CSS support (autocomplete, linting, hover previews)
- **Prettier**: Use [Prettier plugin for Tailwind CSS](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) for automatic class sorting
  - Automatically sorts classes following recommended order
  - Works with custom Tailwind configurations
- **Class sorting order**: Follow Tailwind's recommended class order for consistency

### **Performance Optimization**
- Tailwind automatically purges unused classes in production builds
- Use `@source` directives strategically to avoid scanning unnecessary files
- Use `@source not` to exclude large legacy directories
- **Best Practice**: Keep content paths focused on actual source files

### **RTL (Right-to-Left) Support**
- Use logical properties for RTL compatibility
- Use `dir` attribute or `[dir="rtl"]` variant for RTL-specific styles
- Test all UI components in both RTL and LTR modes
- Use logical properties: `start`, `end`, `ms-`, `me-` instead of `left`, `right`, `ml-`, `mr-`

### **Responsive Design**
- Use mobile-first approach: base styles for mobile, then add breakpoint variants
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Custom breakpoints can be added via `@theme` directive
- **Best Practice**: Design mobile-first, then enhance for larger screens

### **Common Patterns to Avoid**
- ❌ **Don't construct class names dynamically**: Always use complete class names
- ❌ **Don't use `@apply` excessively**: Prefer utility classes or component extraction
- ❌ **Don't ignore content paths**: Ensure all source files are included in content configuration
- ❌ **Don't use arbitrary values for everything**: Use design tokens when possible
- ❌ **Don't mix Tailwind with heavy custom CSS**: Prefer Tailwind's utility-first approach

### **Best Practices Summary**
- ✅ Always use complete, static class names
- ✅ Map props to complete class names using objects/maps
- ✅ Use `@theme` for design system customization
- ✅ Use arbitrary values sparingly for one-off cases
- ✅ Extract repeated patterns to React components
- ✅ Use Prettier plugin for consistent class ordering
- ✅ Configure content paths accurately
- ✅ Use variants for conditional styling
- ✅ Test in both light and dark modes
- ✅ Test in both RTL and LTR layouts

**When generating code for this project, follow these Tailwind CSS-specific rules by default unless the user explicitly asks for a different approach.**

