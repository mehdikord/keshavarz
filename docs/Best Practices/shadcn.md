## **shadcn/ui Best Practices**

> **Note**: This document focuses on shadcn/ui-specific best practices. For Next.js-specific practices, see [Next.js.md](./Next.js.md). For React-specific practices, see [React.md](./React.md). For Tailwind CSS practices, see [Tailwind.md](./Tailwind.md). For Zod practices, see [Zod.md](./Zod.md). For Prisma practices, see [Prisma.md](./Prisma.md). For shared/general practices, see [Shared.md](./Shared.md).

### **Installation & Setup**
- Use `npx shadcn@latest init` to initialize shadcn/ui in your project
- Choose the appropriate framework (Next.js, Vite, etc.) during initialization
- Components are installed directly into your project (not from npm)
- Components are copied to `components/ui/` directory
- **Best Practice**: Install components as needed; don't install all components upfront

### **Component Installation**
- Use CLI to add components: `npx shadcn@latest add button`
- Components are copied to your project, giving you full control
- **Manual installation**: Copy component code directly if needed
- Always update import paths to match your project setup
- **Best Practice**: Review component code after installation to understand implementation

### **Project Structure**
- Keep shadcn/ui components in `components/ui/` directory
- Keep custom components in `components/` directory (outside `ui/`)
- Use `cn()` utility from `lib/utils` for conditional classNames
- **Best Practice**: Maintain clear separation between shadcn components and custom components

### **Component Customization**
- **All components are yours**: Since components are copied to your project, customize freely
- Maintain variants using `class-variance-authority` (cva)
- Customize theme in `components/ui/` files directly
- **Best Practice**: Create wrapper components for frequently customized patterns
- **Example**: Create a custom `Button` wrapper if you need project-specific variants
  ```tsx
  // components/button.tsx
  import { Button as ShadcnButton } from "@/components/ui/button";
  import { cn } from "@/lib/utils";
  
  export function Button({ className, ...props }) {
    return (
      <ShadcnButton
        className={cn("custom-project-styles", className)}
        {...props}
      />
    );
  }
  ```

### **Using `cn()` Utility**
- Use `cn()` for conditional and merged classNames
- Combines `clsx` and `tailwind-merge` for optimal class handling
- **Pattern**: `cn("base-classes", conditionalClasses, className)`
- **Best Practice**: Always use `cn()` when combining Tailwind classes conditionally
  ```tsx
  import { cn } from "@/lib/utils";
  
  function Component({ className, variant }) {
    return (
      <div className={cn(
        "base-classes",
        variant === "primary" && "primary-classes",
        className
      )}>
        Content
      </div>
    );
  }
  ```

### **Component Variants with CVA**
- Use `class-variance-authority` (cva) for component variants
- Define variants in component files for type-safe props
- **Pattern**:
  ```tsx
  import { cva, type VariantProps } from "class-variance-authority";
  
  const buttonVariants = cva(
    "base-classes",
    {
      variants: {
        variant: {
          default: "default-classes",
          outline: "outline-classes",
        },
        size: {
          default: "default-size",
          sm: "small-size",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    }
  );
  ```

### **Dark Mode Integration**
- shadcn/ui components work seamlessly with Tailwind's dark mode
- Use `dark:` variants in component styles
- Configure dark mode in Tailwind (see [Tailwind.md](./Tailwind.md))
- **Best Practice**: Test all components in both light and dark modes

### **Form Integration**
- **React Hook Form**: Use with `@hookform/resolvers/zod` for form validation
  - Install: `npm install react-hook-form @hookform/resolvers zod`
  - Use shadcn/ui Form components with React Hook Form
- **TanStack Form**: Alternative form library option
- **Server Actions**: Use with React 19 `useActionState` for simple forms
- **Best Practice**: Choose form library based on complexity:
  - Simple forms: Server Actions + `useActionState`
  - Complex forms: React Hook Form + Zod

### **Accessibility (a11y)**
- shadcn/ui components are built on Radix UI primitives (accessible by default)
- Ensure proper ARIA labels and roles
- Test with screen readers
- **Best Practice**: Review and maintain accessibility when customizing components

### **Component Composition**
- shadcn/ui components are composable
- Combine multiple components for complex UIs
- **Example**: Combine Dialog, Form, and Button components
- **Best Practice**: Build complex UIs by composing simple components

### **TypeScript Integration**
- All components are fully typed
- Use `VariantProps` from `class-variance-authority` for variant types
- **Pattern**:
  ```tsx
  import { type VariantProps } from "class-variance-authority";
  import { buttonVariants } from "./button";
  
  interface ButtonProps extends VariantProps<typeof buttonVariants> {
    // additional props
  }
  ```

### **Updating Components**
- Components can be updated individually: `npx shadcn@latest add button --overwrite`
- Review changes before overwriting custom modifications
- **Best Practice**: Keep track of customizations to avoid losing them during updates
- Consider creating wrapper components to preserve customizations

### **Common Patterns**
- **Button with icon**: Use `size="icon"` variant for icon-only buttons
  ```tsx
  <Button size="icon" aria-label="Submit">
    <Icon />
  </Button>
  ```
- **Form fields**: Use shadcn/ui Form components with validation
- **Dialogs/Modals**: Use Dialog component for modals
- **Data tables**: Use Table component with proper structure
- **Best Practice**: Follow shadcn/ui examples and patterns

### **Styling Guidelines**
- Use Tailwind utility classes within components
- Avoid inline styles; use Tailwind classes
- Use `cn()` for conditional styling
- Maintain consistent spacing using Tailwind's spacing scale
- **Best Practice**: Stick to Tailwind's design tokens for consistency

### **Component Organization**
- Group related components in feature folders when appropriate
- Keep base shadcn/ui components in `components/ui/`
- Create feature-specific component wrappers in feature folders
- **Best Practice**: Balance between reusability and feature-specific needs

### **Performance Considerations**
- Components are lightweight (no runtime overhead)
- Tree-shaking works automatically (only used components are included)
- **Best Practice**: Only install components you actually use

### **Common Mistakes to Avoid**
- ❌ **Don't install all components**: Install only what you need
- ❌ **Don't modify shadcn components directly without tracking**: Use wrappers for customizations
- ❌ **Don't forget to update import paths**: After copying components, ensure paths match your project
- ❌ **Don't ignore TypeScript types**: Use proper typing for variants and props
- ❌ **Don't skip accessibility**: Maintain ARIA labels and keyboard navigation

### **Best Practices Summary**
- ✅ Install components as needed (not all at once)
- ✅ Use `cn()` utility for all conditional classNames
- ✅ Maintain variants with `class-variance-authority` (cva)
- ✅ Customize components freely (they're yours)
- ✅ Create wrapper components for project-specific patterns
- ✅ Test components in both light and dark modes
- ✅ Test components in both RTL and LTR layouts
- ✅ Use proper TypeScript types for variants
- ✅ Keep shadcn components in `components/ui/`
- ✅ Keep custom components separate from shadcn components
- ✅ Review component code to understand implementation
- ✅ Track customizations to avoid losing them during updates

**When generating code for this project, follow these shadcn/ui-specific rules by default unless the user explicitly asks for a different approach.**

