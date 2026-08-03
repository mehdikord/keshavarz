## **Zod Best Practices**

> **Note**: This document focuses on Zod-specific best practices for runtime validation. For TypeScript practices, see [TypeScript.md](./TypeScript.md). For form handling with Zod, see [Shared.md](./Shared.md). For Next.js practices, see [Next.js.md](./Next.js.md).

### **Schema Definition**
- **Define schemas before use**: Create schemas as constants, then use them for validation
  ```ts
  import * as z from "zod";
  
  const UserSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    age: z.number().int().positive().optional(),
  });
  ```
- **Use descriptive names**: Name schemas clearly (e.g., `UserSchema`, `LoginFormSchema`)
- **Organize schemas**: Store reusable schemas in `lib/validations/` or feature-specific folders
- **Export types**: Export both schemas and inferred types for reuse
  ```ts
  export const UserSchema = z.object({ ... });
  export type User = z.infer<typeof UserSchema>;
  ```

### **Primitive Types**
- Use appropriate primitive types: `z.string()`, `z.number()`, `z.boolean()`, `z.date()`, etc.
- **Coercion**: Use `z.coerce` when you need to convert input types
  ```ts
  // Coerce string to number
  const schema = z.coerce.number();
  schema.parse("42"); // => 42
  
  // Coerce to date
  const dateSchema = z.coerce.date();
  dateSchema.parse("2024-01-01"); // => Date object
  ```
- **Warning**: `z.coerce.boolean()` may not work as expected (any truthy value becomes `true`)
  - Use explicit validation instead: `z.boolean()` or `z.string().transform()`

### **String Validation**
- Use built-in validators: `.min()`, `.max()`, `.email()`, `.url()`, `.uuid()`, `.regex()`
  ```ts
  z.string()
    .min(3, "Must be at least 3 characters")
    .max(100, "Must be at most 100 characters")
    .email("Invalid email address");
  ```
- **Custom messages**: Always provide custom error messages for better UX
- **Regex patterns**: Use `.regex()` for complex string validation
  ```ts
  z.string().regex(/^[A-Z][a-z]+$/, "Must start with uppercase letter");
  ```

### **Number Validation**
- Use validators: `.int()`, `.positive()`, `.negative()`, `.min()`, `.max()`, `.finite()`
  ```ts
  z.number()
    .int("Must be an integer")
    .positive("Must be positive")
    .min(1, "Must be at least 1")
    .max(100, "Must be at most 100");
  ```
- **Optional numbers**: Use `.optional()` or `.nullable()` as needed
  ```ts
  z.number().optional(); // number | undefined
  z.number().nullable(); // number | null
  z.number().nullish(); // number | null | undefined
  ```

### **Object Schemas**
- **Define complete objects**: Include all required and optional fields
  ```ts
  const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().int().positive().optional(),
  });
  ```
- **Strict objects**: Use `.strict()` to disallow extra keys (recommended for API validation)
  ```ts
  const schema = z.object({ ... }).strict();
  schema.parse({ name: "John", extra: "key" }); // ❌ Error: Unrecognized key
  ```
- **Partial objects**: Use `.partial()` to make all fields optional
  ```ts
  const UpdateUserSchema = UserSchema.partial();
  ```
- **Pick/Omit**: Use `.pick()` and `.omit()` to create derived schemas
  ```ts
  const PublicUserSchema = UserSchema.omit({ password: true });
  const UserIdSchema = UserSchema.pick({ id: true });
  ```

### **Arrays**
- Validate array items: `z.array(z.string())` for arrays of strings
- **Non-empty arrays**: Use `.min(1)` to ensure at least one item
  ```ts
  z.array(z.string()).min(1, "Array cannot be empty");
  ```
- **Array length**: Use `.length()` for exact length, `.min()` and `.max()` for ranges
  ```ts
  z.array(z.string()).length(3, "Must have exactly 3 items");
  ```

### **Unions & Discriminated Unions**
- Use `.union()` for multiple possible types
  ```ts
  z.union([z.string(), z.number()]);
  ```
- **Discriminated unions**: Use for type-safe unions with a discriminator field
  ```ts
  const EventSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
    z.object({ type: z.literal("keypress"), key: z.string() }),
  ]);
  ```

### **Validation Methods**
- **`.parse()`**: Throws `ZodError` on validation failure (use in try/catch)
  ```ts
  try {
    const user = UserSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
    }
  }
  ```
- **`.safeParse()`**: Returns result object (preferred for error handling)
  ```ts
  const result = UserSchema.safeParse(data);
  if (!result.success) {
    // Handle errors: result.error
  } else {
    // Use validated data: result.data
  }
  ```
- **`.parseAsync()` / `.safeParseAsync()`**: Use for async schemas (with async refinements/transforms)

### **Refinements & SuperRefines**
- **`.refine()`**: Add custom validation logic
  ```ts
  z.object({
    password: z.string(),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Error appears on confirmPassword field
  });
  ```
- **`.superRefine()`**: For complex validation with multiple errors
  ```ts
  z.string().superRefine((val, ctx) => {
    if (val.length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: 3, type: "string" });
    }
    if (!/^[a-z]/.test(val)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must start with lowercase" });
    }
  });
  ```

### **Transforms**
- Use `.transform()` to transform validated data
  ```ts
  z.string().transform((val) => val.trim().toLowerCase());
  z.coerce.number().transform((val) => val * 2);
  ```
- **Input/Output types**: Be aware that transforms change output types
  ```ts
  const schema = z.string().transform((val) => val.length);
  type Input = z.input<typeof schema>; // string
  type Output = z.output<typeof schema>; // number
  ```

### **Error Handling**
- **Error formatting**: Use Zod's error formatting utilities
  ```ts
  const result = schema.safeParse(data);
  if (!result.success) {
    // Tree structure
    const tree = z.treeifyError(result.error);
    
    // Human-readable string
    const pretty = z.prettifyError(result.error);
    
    // Flattened errors (for forms)
    const flattened = z.flattenError(result.error);
    // { formErrors: string[], fieldErrors: { [key: string]: string[] } }
  }
  ```
- **Custom error messages**: Always provide user-friendly error messages
  ```ts
  z.string().min(3, "Name must be at least 3 characters");
  ```
- **Error paths**: Use `path` in refinements to target specific fields
  ```ts
  .refine(..., { path: ["fieldName"] });
  ```

### **Type Inference**
- **Extract types**: Use `z.infer<>` to extract TypeScript types from schemas
  ```ts
  const UserSchema = z.object({ ... });
  type User = z.infer<typeof UserSchema>;
  ```
- **Input/Output types**: Use `z.input<>` and `z.output<>` when schemas have transforms
  ```ts
  type Input = z.input<typeof schema>;
  type Output = z.output<typeof schema>;
  ```

### **Integration with React Hook Form**
- Use `@hookform/resolvers/zod` for form validation
  ```ts
  import { zodResolver } from "@hookform/resolvers/zod";
  import { useForm } from "react-hook-form";
  
  const form = useForm({
    resolver: zodResolver(UserSchema),
  });
  ```
- **Best Practice**: Create separate schemas for form validation vs. API validation if needed

### **Integration with Server Actions**
- Validate Server Action inputs with Zod
  ```ts
  async function createUser(formData: FormData) {
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
    };
    
    const result = UserSchema.safeParse(rawData);
    if (!result.success) {
      return { error: result.error.flatten() };
    }
    
    // Use validated data: result.data
  }
  ```

### **API Route Validation**
- Validate all API inputs with Zod
  ```ts
  export async function POST(request: Request) {
    const body = await request.json();
    const result = CreateUserSchema.safeParse(body);
    
    if (!result.success) {
      return Response.json(
        { error: result.error.flatten() },
        { status: 400 }
      );
    }
    
    // Process validated data: result.data
  }
  ```

### **Environment Variables Validation**
- Validate environment variables at startup
  ```ts
  const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    NODE_ENV: z.enum(["development", "production", "test"]),
  });
  
  const env = envSchema.parse(process.env);
  ```
- **Best Practice**: Create typed config object, validate with Zod (see [Shared.md](./Shared.md))

### **Common Patterns**
- **Reusable field schemas**: Create base schemas and extend them
  ```ts
  const BaseUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });
  
  const CreateUserSchema = BaseUserSchema.extend({
    password: z.string().min(8),
  });
  
  const UpdateUserSchema = BaseUserSchema.partial();
  ```
- **Optional vs. Nullable**: Understand the difference
  ```ts
  z.string().optional(); // string | undefined
  z.string().nullable(); // string | null
  z.string().nullish(); // string | null | undefined
  ```
- **Default values**: Use `.default()` for optional fields with defaults
  ```ts
  z.string().optional().default("unknown");
  ```

### **Performance Considerations**
- **Schema reuse**: Reuse schemas instead of creating new ones
- **Lazy evaluation**: Use `z.lazy()` for recursive schemas
  ```ts
  const CategorySchema: z.ZodType<Category> = z.lazy(() =>
    z.object({
      name: z.string(),
      children: z.array(CategorySchema).optional(),
    })
  );
  ```

### **Common Mistakes to Avoid**
- ❌ **Don't use `.parse()` without error handling**: Use `.safeParse()` instead
- ❌ **Don't forget custom error messages**: Always provide user-friendly messages
- ❌ **Don't use coercion unnecessarily**: Prefer explicit validation
- ❌ **Don't ignore type inference**: Use `z.infer<>` to get TypeScript types
- ❌ **Don't validate in multiple places**: Create reusable schemas
- ❌ **Don't use `.any()`**: Use `z.unknown()` and validate properly
- ❌ **Don't forget to validate API inputs**: Always validate with Zod

### **Best Practices Summary**
- ✅ Define schemas as constants before use
- ✅ Organize schemas in `lib/validations/` or feature folders
- ✅ Export both schemas and inferred types
- ✅ Use `.safeParse()` for error handling (preferred over `.parse()`)
- ✅ Provide custom error messages for better UX
- ✅ Use `.strict()` for API validation
- ✅ Validate all API inputs and Server Actions
- ✅ Validate environment variables at startup
- ✅ Use `z.infer<>` to extract TypeScript types
- ✅ Create reusable base schemas and extend them
- ✅ Use refinements for complex validation logic
- ✅ Use transforms for data transformation
- ✅ Format errors appropriately (treeify, flatten, prettify)

**When generating code for this project, follow these Zod-specific rules by default unless the user explicitly asks for a different approach.**

