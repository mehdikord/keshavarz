## **Prisma Best Practices**

> **Note**: This document focuses on Prisma ORM-specific best practices. For Next.js-specific practices, see [Next.js.md](./Next.js.md). For TypeScript practices, see [TypeScript.md](./TypeScript.md). For shared/general practices, see [Shared.md](./Shared.md).

### **Schema Definition**
- **Define schema in `prisma/schema.prisma`**: Never edit database manually; always use migrations
- **Use descriptive model names**: Use PascalCase for models (e.g., `User`, `Post`, `Comment`)
- **Use camelCase for fields**: Follow JavaScript naming conventions
  ```prisma
  model User {
    id        String   @id @default(uuid())
    firstName String   @map("first_name")
    lastName  String   @map("last_name")
    email     String   @unique
    createdAt DateTime @default(now()) @map("created_at")
    updatedAt DateTime @updatedAt @map("updated_at")
  }
  ```
- **Use `@map` for database naming**: Map Prisma field names to database column names
- **Use `@@map` for table naming**: Map Prisma model names to database table names
  ```prisma
  model User {
    // ...
    @@map("users")
  }
  ```

### **Migrations**
- **Always use migrations**: Never edit database schema manually
- **Create migrations**: Use `npx prisma migrate dev --name migration_name`
- **Apply migrations in production**: Use `npx prisma migrate deploy`
- **Review migration SQL**: Always review generated SQL before applying
- **Never edit migration files manually**: Let Prisma generate them
- **Best Practice**: Commit migration files to version control

### **Relations**
- **Define relations explicitly**: Use `@relation` attribute for clarity
  ```prisma
  model User {
    id    String @id @default(uuid())
    posts Post[]
  }
  
  model Post {
    id     String @id @default(uuid())
    userId String @map("user_id")
    user   User   @relation(fields: [userId], references: [id])
    
    @@index([userId])
  }
  ```
- **Use indexes on foreign keys**: Always add `@@index` on foreign key fields
- **Cascade deletes**: Use `onDelete: Cascade` when appropriate
  ```prisma
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  ```

### **Indexes**
- **Add indexes for frequently queried fields**: Use `@@index` for performance
  ```prisma
  model User {
    email String @unique
    name  String
    
    @@index([name])
    @@index([email, name]) // Composite index
  }
  ```
- **Use unique constraints**: Use `@unique` for fields that must be unique
- **Composite indexes**: Use for queries that filter by multiple fields

### **Soft Deletes**
- **Implement soft deletes**: Use `deletedAt` field instead of hard deletes
  ```prisma
  model User {
    id        String    @id @default(uuid())
    deletedAt DateTime? @map("deleted_at")
    
    @@index([deletedAt])
  }
  ```
- **Filter deleted records**: Always filter by `deletedAt IS NULL` in queries
  ```ts
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
  });
  ```

### **Prisma Client Usage**
- **Singleton pattern**: Create single Prisma Client instance
  ```ts
  // lib/prisma.ts
  import { PrismaClient } from "@prisma/client";
  
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };
  
  export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  ```
- **Connection pooling**: Use connection pooling in production (Prisma handles this automatically)
- **Close connections**: Prisma Client manages connections automatically; no need to close manually

### **Query Optimization**
- **Use `select` to limit fields**: Avoid over-fetching data
  ```ts
  // ✅ Good: Only fetch needed fields
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  
  // ❌ Bad: Fetch all fields
  const users = await prisma.user.findMany();
  ```
- **Use `include` for relations**: Load related data when needed
  ```ts
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
  ```
- **Avoid N+1 queries**: Use `include` or batch queries
  ```ts
  // ✅ Good: Single query with include
  const users = await prisma.user.findMany({
    include: { posts: true },
  });
  
  // ❌ Bad: N+1 queries
  const users = await prisma.user.findMany();
  for (const user of users) {
    const posts = await prisma.post.findMany({ where: { userId: user.id } });
  }
  ```

### **Transactions**
- **Use transactions for multi-step operations**: Ensure data consistency
  ```ts
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    await tx.post.create({ data: { ...postData, userId: user.id } });
  });
  ```
- **Isolation levels**: Use appropriate isolation levels when needed
- **Best Practice**: Wrap related database operations in transactions

### **Type Safety**
- **Use Prisma generated types**: Leverage TypeScript types from Prisma
  ```ts
  import { Prisma } from "@prisma/client";
  
  type UserCreateInput = Prisma.UserCreateInput;
  type UserWhereInput = Prisma.UserWhereInput;
  type User = Prisma.UserGetPayload<{}>;
  ```
- **Type query results**: Use proper typing for query results
  ```ts
  const user: User | null = await prisma.user.findUnique({
    where: { id: userId },
  });
  ```
- **Type with `select`/`include`**: Use `Prisma.UserGetPayload` for typed results
  ```ts
  type UserWithPosts = Prisma.UserGetPayload<{
    include: { posts: true };
  }>;
  ```

### **Error Handling**
- **Handle Prisma errors**: Catch and handle specific Prisma errors
  ```ts
  try {
    await prisma.user.create({ data: userData });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Unique constraint violation
      }
    }
  }
  ```
- **Common error codes**:
  - `P2002`: Unique constraint violation
  - `P2025`: Record not found
  - `P2003`: Foreign key constraint violation

### **Seeding**
- **Create seed script**: Use `prisma/seed.ts` for database seeding
  ```ts
  // prisma/seed.ts
  import { PrismaClient } from "@prisma/client";
  
  const prisma = new PrismaClient();
  
  async function main() {
    // Seed data
  }
  
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
  ```
- **Run seed**: Use `npx prisma db seed` or add to `package.json`
  ```json
  {
    "prisma": {
      "seed": "tsx prisma/seed.ts"
    }
  }
  ```

### **Development Tools**
- **Prisma Studio**: Use `npx prisma studio` for database GUI
- **Log queries in development**: Enable query logging in development only
  ```ts
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  ```

### **Environment Variables**
- **Store connection string**: Use `DATABASE_URL` in environment variables
  ```env
  DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
  ```
- **Never commit secrets**: Add `.env` to `.gitignore`
- **Validate with Zod**: Validate environment variables at startup (see [Zod.md](./Zod.md))

### **Production Considerations**
- **Connection pooling**: Prisma handles connection pooling automatically
- **Read replicas**: Use read replicas for read-heavy workloads
  ```ts
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  ```
- **Query logging**: Disable query logging in production (only log errors)
- **Migration strategy**: Use `prisma migrate deploy` in production (not `prisma migrate dev`)

### **Next.js Integration**
- **Server Components**: Use Prisma in Server Components and Server Actions
  ```ts
  // app/users/page.tsx
  import { prisma } from "@/lib/prisma";
  
  export default async function UsersPage() {
    const users = await prisma.user.findMany();
    return <div>{/* Render users */}</div>;
  }
  ```
- **Server Actions**: Use Prisma in Server Actions for mutations
  ```ts
  "use server";
  
  import { prisma } from "@/lib/prisma";
  
  export async function createUser(data: UserCreateInput) {
    return await prisma.user.create({ data });
  }
  ```
- **API Routes**: Use Prisma in API routes when needed
  ```ts
  // app/api/users/route.ts
  import { prisma } from "@/lib/prisma";
  
  export async function GET() {
    const users = await prisma.user.findMany();
    return Response.json(users);
  }
  ```

### **Common Patterns**
- **Pagination**: Use `skip` and `take` for pagination
  ```ts
  const users = await prisma.user.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  ```
- **Sorting**: Use `orderBy` for sorting
  ```ts
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  ```
- **Filtering**: Use `where` for filtering
  ```ts
  const users = await prisma.user.findMany({
    where: {
      email: { contains: "@example.com" },
      age: { gte: 18 },
    },
  });
  ```

### **Common Mistakes to Avoid**
- ❌ **Don't edit database manually**: Always use migrations
- ❌ **Don't fetch all fields**: Use `select` to limit fields
- ❌ **Don't create N+1 queries**: Use `include` or batch queries
- ❌ **Don't forget indexes**: Add indexes for frequently queried fields
- ❌ **Don't ignore soft deletes**: Filter by `deletedAt` in queries
- ❌ **Don't use transactions unnecessarily**: Only for multi-step operations
- ❌ **Don't log queries in production**: Only log errors
- ❌ **Don't commit `.env` files**: Keep secrets secure

### **Best Practices Summary**
- ✅ Define schema in `prisma/schema.prisma`; never edit database manually
- ✅ Always use migrations for schema changes
- ✅ Use `select` and `include` to optimize queries
- ✅ Add indexes for frequently queried fields
- ✅ Implement soft deletes with `deletedAt` field
- ✅ Use transactions for multi-step operations
- ✅ Create singleton Prisma Client instance
- ✅ Use Prisma generated types for type safety
- ✅ Handle Prisma errors appropriately
- ✅ Use Prisma Studio for development
- ✅ Store connection string in environment variables
- ✅ Disable query logging in production
- ✅ Use `prisma migrate deploy` in production
- ✅ Filter soft-deleted records in queries
- ✅ Avoid N+1 queries with `include` or batch queries

**When generating code for this project, follow these Prisma-specific rules by default unless the user explicitly asks for a different approach.**

