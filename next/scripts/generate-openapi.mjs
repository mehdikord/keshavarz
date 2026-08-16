import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const catalogPath = resolve(projectRoot, "../docs/api-tasks/endpoint-catalog.md");
const outputPath = resolve(projectRoot, "../docs/openapi/openapi.json");

const PUBLIC_OPERATIONS = new Set([
  "GET /api/app/v1/health",
  "GET /api/app/v1/public/settings",
  "POST /api/app/v1/auth/otp/request",
  "POST /api/app/v1/auth/otp/verify",
  "POST /api/app/v1/auth/otp/resend",
  "POST /api/admins/v1/auth/login",
]);

const CREATED_OPERATIONS = new Set([
  "POST /api/app/v1/lands",
  "POST /api/app/v1/provider/services",
  "POST /api/app/v1/provider/subscriptions/purchase",
  "POST /api/app/v1/service-searches",
  "POST /api/app/v1/service-requests",
  "POST /api/admins/v1/catalog/categories",
  "POST /api/admins/v1/catalog/services",
  "POST /api/admins/v1/subscription-plans",
  "POST /api/admins/v1/admins",
  "POST /api/admins/v1/roles",
  "POST /api/admins/v1/notifications",
  "POST /api/admins/v1/payments/{paymentId}/refunds",
]);

function extractEndpoints(markdown) {
  const endpoints = [];
  const pattern =
    /^\| `(GET|POST|PUT|PATCH|DELETE)` \| `([^`]+)` \| ([^|]+) \|$/gm;

  for (const match of markdown.matchAll(pattern)) {
    const method = match[1];
    const path = match[2];
    const summary = match[3]?.trim();

    if (method && path && summary) {
      endpoints.push({ method, path, summary });
    }
  }

  return endpoints;
}

function toPascalCase(value) {
  return value
    .replace(/[{}]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

function createOperationId(method, path) {
  const realm = path.startsWith("/api/admins/") ? "admin" : "app";
  const relativePath = path.replace(/^\/api\/(?:app|admins)\/v1\/?/, "");
  const pathName = relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment.startsWith("{")
        ? `By${toPascalCase(segment)}`
        : toPascalCase(segment),
    )
    .join("");

  return `${realm}${pathName}${toPascalCase(method.toLowerCase())}`;
}

function getTags(path) {
  if (path.startsWith("/api/app/v1/")) {
    const relative = path.slice("/api/app/v1/".length);

    if (relative === "health" || relative.startsWith("public/")) {
      return ["App System"];
    }
    if (relative.startsWith("auth/")) {
      return ["App Auth"];
    }
    if (relative === "me" || relative.startsWith("me/")) {
      return ["App Profile"];
    }
    if (relative.startsWith("catalog/")) {
      return ["Catalog"];
    }
    if (relative.startsWith("lands")) {
      return ["Consumer"];
    }
    if (relative.startsWith("provider/reports/")) {
      return ["Reports", "Provider"];
    }
    if (relative.startsWith("provider/requests")) {
      return ["Requests", "Provider"];
    }
    if (relative.startsWith("provider/subscription")) {
      return ["Subscription", "Provider"];
    }
    if (relative.startsWith("provider/")) {
      return ["Provider"];
    }
    if (relative.startsWith("consumer/reports/")) {
      return ["Reports", "Consumer"];
    }
    if (relative.startsWith("consumer/requests")) {
      return ["Requests", "Consumer"];
    }
    if (relative.startsWith("subscription/")) {
      return ["Subscription"];
    }
    if (relative.startsWith("payments") || relative.startsWith("payment-gateways/")) {
      return ["Payments"];
    }
    if (relative.startsWith("service-searches")) {
      return ["Search"];
    }
    if (relative.startsWith("service-requests")) {
      return ["Requests"];
    }
    if (relative.startsWith("notifications")) {
      return ["Notifications"];
    }

    return ["App System"];
  }

  const relative = path.slice("/api/admins/v1/".length);

  if (relative.startsWith("auth/") || relative === "me" || relative.startsWith("me/")) {
    return ["Admin Auth"];
  }
  if (relative.startsWith("reports/") || relative.startsWith("exports")) {
    return ["Admin Reports"];
  }
  if (relative.startsWith("catalog/")) {
    return ["Admin Management", "Catalog"];
  }
  if (relative.startsWith("service-request")) {
    return ["Admin Management", "Requests"];
  }
  if (relative.includes("subscription")) {
    return ["Admin Management", "Subscription"];
  }
  if (relative.startsWith("payments") || relative.startsWith("refunds")) {
    return ["Admin Management", "Payments"];
  }
  if (relative.startsWith("notifications")) {
    return ["Admin Management", "Notifications"];
  }

  return ["Admin Management"];
}

function createPathParameters(path) {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((match) => {
    const name = match[1];
    const isPublicId = name?.endsWith("Id") ?? false;

    return {
      name,
      in: "path",
      required: true,
      schema: isPublicId
        ? { $ref: "#/components/schemas/PublicId" }
        : { type: "string", minLength: 1, maxLength: 64 },
    };
  });
}

function getSecurity(method, path) {
  const key = `${method} ${path}`;

  if (PUBLIC_OPERATIONS.has(key)) {
    return [];
  }
  if (path.startsWith("/api/app/v1/payment-gateways/")) {
    return [{ GatewaySignature: [] }];
  }
  if (path.startsWith("/api/admins/v1/")) {
    return [{ AdminSessionCookie: [] }];
  }

  return [{ AppSessionCookie: [] }];
}

function getSuccessResponse(method, path) {
  const key = `${method} ${path}`;

  if (key === "GET /api/app/v1/health") {
    return { "200": { $ref: "#/components/responses/HealthSuccess" } };
  }
  if (
    key === "GET /api/app/v1/health/authenticated" ||
    key === "GET /api/admins/v1/health/authenticated"
  ) {
    return { "200": { $ref: "#/components/responses/AuthCheckSuccess" } };
  }
  if (method === "DELETE") {
    return { "204": { $ref: "#/components/responses/NoContent" } };
  }
  if (key === "POST /api/admins/v1/exports") {
    return { "202": { $ref: "#/components/responses/Accepted" } };
  }
  if (CREATED_OPERATIONS.has(key)) {
    return { "201": { $ref: "#/components/responses/Created" } };
  }

  return { "200": { $ref: "#/components/responses/Success" } };
}

function createParameters(method, path, isAuthenticated) {
  const parameters = [];

  if (isAuthenticated && method !== "GET") {
    parameters.push({ $ref: "#/components/parameters/CsrfToken" });
  }
  if (method === "POST" && !PUBLIC_OPERATIONS.has(`${method} ${path}`)) {
    parameters.push({ $ref: "#/components/parameters/IdempotencyKey" });
  }
  if (["PATCH", "PUT", "DELETE"].includes(method)) {
    parameters.push({ $ref: "#/components/parameters/IfMatch" });
  }
  if (path.startsWith("/api/app/v1/payment-gateways/")) {
    parameters.push({ $ref: "#/components/parameters/GatewayTimestamp" });
  }

  return parameters;
}

function createOperation(endpoint) {
  const { method, path, summary } = endpoint;
  const security = getSecurity(method, path);
  const isAuthenticated = security.some(
    (requirement) => requirement.AppSessionCookie || requirement.AdminSessionCookie,
  );
  const operation = {
    operationId: createOperationId(method, path),
    summary,
    tags: getTags(path),
    security,
    parameters: createParameters(method, path, isAuthenticated),
    responses: {
      ...getSuccessResponse(method, path),
      "400": { $ref: "#/components/responses/BadRequest" },
      "401": { $ref: "#/components/responses/Unauthorized" },
      "403": { $ref: "#/components/responses/Forbidden" },
      "404": { $ref: "#/components/responses/NotFound" },
      "409": { $ref: "#/components/responses/Conflict" },
      "412": { $ref: "#/components/responses/PreconditionFailed" },
      "422": { $ref: "#/components/responses/UnprocessableEntity" },
      "429": { $ref: "#/components/responses/TooManyRequests" },
      "500": { $ref: "#/components/responses/InternalServerError" },
    },
  };

  if (["POST", "PUT", "PATCH"].includes(method)) {
    operation.requestBody = { $ref: "#/components/requestBodies/GenericCommand" };
  }

  return operation;
}

function createPaths(endpoints) {
  const paths = {};

  for (const endpoint of endpoints) {
    const pathItem = paths[endpoint.path] ?? {
      parameters: createPathParameters(endpoint.path),
    };
    pathItem[endpoint.method.toLowerCase()] = createOperation(endpoint);
    paths[endpoint.path] = pathItem;
  }

  return paths;
}

function errorResponse(description) {
  return {
    description,
    headers: {
      "X-Request-Id": { $ref: "#/components/headers/RequestId" },
    },
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorEnvelope" },
      },
    },
  };
}

function createDocument(endpoints) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Keshavarz API",
      version: "1.0.0-contract.0",
      description: "قرارداد پایه API اپلیکیشن کشاورز و پنل مدیریت.",
    },
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    servers: [
      { url: "/", description: "Same-origin deployment" },
      { url: "http://localhost:3000", description: "Local development" },
    ],
    tags: [
      { name: "App System", description: "سلامت و تنظیمات عمومی اپ" },
      { name: "App Auth", description: "OTP و نشست کاربر اپ" },
      { name: "App Profile", description: "پروفایل و نشست‌های کاربر جاری" },
      { name: "Provider", description: "قابلیت‌های خدمات‌دهنده" },
      { name: "Consumer", description: "زمین و قابلیت‌های خدمات‌گیرنده" },
      { name: "Catalog", description: "دسته‌بندی و خدمات" },
      { name: "Subscription", description: "پلن و اشتراک" },
      { name: "Payments", description: "پرداخت، callback و refund" },
      { name: "Search", description: "جستجو و تطبیق Provider" },
      { name: "Requests", description: "چرخه درخواست خدمت" },
      { name: "Notifications", description: "اعلان‌های اپ و مدیریت" },
      { name: "Reports", description: "گزارش مالی کاربر" },
      { name: "Admin Auth", description: "ورود و نشست مدیر" },
      { name: "Admin Management", description: "عملیات مجوزدار مدیریت" },
      { name: "Admin Reports", description: "گزارش و export مدیریت" },
    ],
    paths: createPaths(endpoints),
    components: {
      securitySchemes: {
        AppSessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "__Secure-keshavarz_app_session",
          description: "Opaque app session; Path=/api/app/v1",
        },
        AdminSessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "__Secure-keshavarz_admin_session",
          description: "Opaque admin session; Path=/api/admins/v1",
        },
        GatewaySignature: {
          type: "apiKey",
          in: "header",
          name: "X-Gateway-Signature",
          description: "امضای callback درگاه با timestamp و replay protection",
        },
      },
      parameters: {
        CsrfToken: {
          name: "X-CSRF-Token",
          in: "header",
          required: true,
          schema: { type: "string", minLength: 32, maxLength: 256 },
        },
        IdempotencyKey: {
          name: "Idempotency-Key",
          in: "header",
          required: false,
          schema: {
            type: "string",
            minLength: 16,
            maxLength: 128,
            pattern: "^[A-Za-z0-9._~-]+$",
          },
        },
        IfMatch: {
          name: "If-Match",
          in: "header",
          required: false,
          schema: { type: "string", pattern: "^\\\"[A-Za-z0-9_-]{16,}\\\"$" },
        },
        GatewayTimestamp: {
          name: "X-Gateway-Timestamp",
          in: "header",
          required: true,
          schema: { type: "string", format: "date-time" },
        },
      },
      headers: {
        RequestId: {
          description: "شناسه correlation درخواست",
          schema: { $ref: "#/components/schemas/RequestId" },
        },
        ETag: {
          description: "Strong ETag برای optimistic concurrency",
          schema: { type: "string", pattern: "^\\\"[A-Za-z0-9_-]{16,}\\\"$" },
        },
      },
      schemas: {
        PublicId: {
          type: "string",
          pattern: "^[0-9A-HJKMNP-TV-Z]{26}$",
          example: "01J00000000000000000000000",
        },
        RequestId: {
          type: "string",
          pattern: "^[0-9A-HJKMNP-TV-Z]{26}$",
          example: "01J00000000000000000000001",
        },
        IsoUtcDateTime: {
          type: "string",
          format: "date-time",
          pattern: "Z$",
          example: "2026-08-03T12:00:00.000Z",
        },
        MoneyToman: {
          type: "integer",
          minimum: 0,
          maximum: 9007199254740991,
          example: 2500000,
        },
        DecimalString: {
          type: "string",
          pattern: "^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$",
          example: "35.7219000",
        },
        GenericData: {
          type: "object",
          additionalProperties: true,
          description: "Placeholder فاز صفر؛ در فاز مالک endpoint جایگزین می‌شود.",
        },
        GenericCommand: {
          type: "object",
          additionalProperties: true,
          description: "Placeholder body فاز صفر؛ validation دقیق در فاز feature ثبت می‌شود.",
        },
        HealthData: {
          type: "object",
          additionalProperties: false,
          required: ["checkedAt", "status"],
          properties: {
            checkedAt: { $ref: "#/components/schemas/IsoUtcDateTime" },
            status: { type: "string", const: "ok" },
          },
        },
        AuthCheckData: {
          type: "object",
          additionalProperties: false,
          required: ["actorId", "realm"],
          properties: {
            actorId: { $ref: "#/components/schemas/PublicId" },
            realm: { type: "string", enum: ["app", "admins"] },
          },
        },
        PaginationMeta: {
          type: "object",
          additionalProperties: false,
          required: ["nextCursor", "hasMore", "limit"],
          properties: {
            nextCursor: { type: ["string", "null"], maxLength: 512 },
            hasMore: { type: "boolean" },
            limit: { type: "integer", minimum: 1, maximum: 100 },
          },
        },
        SuccessEnvelope: {
          type: "object",
          additionalProperties: false,
          required: ["data", "requestId"],
          properties: {
            data: { $ref: "#/components/schemas/GenericData" },
            meta: { type: "object", additionalProperties: true },
            requestId: { $ref: "#/components/schemas/RequestId" },
          },
        },
        ErrorDetail: {
          type: "object",
          additionalProperties: false,
          required: ["code", "message"],
          properties: {
            code: { type: "string", pattern: "^[A-Z][A-Z0-9_]*$" },
            message: { type: "string", minLength: 1 },
            fields: {
              type: "object",
              additionalProperties: {
                type: "array",
                minItems: 1,
                items: { type: "string", minLength: 1 },
              },
            },
          },
        },
        ErrorEnvelope: {
          type: "object",
          additionalProperties: false,
          required: ["error", "requestId"],
          properties: {
            error: { $ref: "#/components/schemas/ErrorDetail" },
            requestId: { $ref: "#/components/schemas/RequestId" },
          },
        },
      },
      requestBodies: {
        GenericCommand: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GenericCommand" },
            },
          },
        },
      },
      responses: {
        Success: {
          description: "عملیات موفق",
          headers: {
            "X-Request-Id": { $ref: "#/components/headers/RequestId" },
            ETag: { $ref: "#/components/headers/ETag" },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessEnvelope" },
            },
          },
        },
        HealthSuccess: {
          description: "API و اتصال دیتابیس آماده است",
          headers: {
            "X-Request-Id": { $ref: "#/components/headers/RequestId" },
          },
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["data", "requestId"],
                properties: {
                  data: { $ref: "#/components/schemas/HealthData" },
                  requestId: { $ref: "#/components/schemas/RequestId" },
                },
              },
            },
          },
        },
        AuthCheckSuccess: {
          description: "نشست قلمرو معتبر است",
          headers: {
            "X-Request-Id": { $ref: "#/components/headers/RequestId" },
          },
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["data", "requestId"],
                properties: {
                  data: { $ref: "#/components/schemas/AuthCheckData" },
                  requestId: { $ref: "#/components/schemas/RequestId" },
                },
              },
            },
          },
        },
        Created: {
          description: "منبع ایجاد شد",
          headers: { "X-Request-Id": { $ref: "#/components/headers/RequestId" } },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessEnvelope" },
            },
          },
        },
        Accepted: {
          description: "عملیات برای پردازش async پذیرفته شد",
          headers: { "X-Request-Id": { $ref: "#/components/headers/RequestId" } },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessEnvelope" },
            },
          },
        },
        NoContent: {
          description: "عملیات موفق بدون body",
          headers: { "X-Request-Id": { $ref: "#/components/headers/RequestId" } },
        },
        BadRequest: errorResponse("درخواست نامعتبر"),
        Unauthorized: errorResponse("credential مفقود یا نامعتبر"),
        Forbidden: errorResponse("دسترسی غیرمجاز"),
        NotFound: errorResponse("منبع در scope پیدا نشد"),
        Conflict: errorResponse("تعارض state یا idempotency"),
        PreconditionFailed: errorResponse("نسخه منبع تغییر کرده است"),
        UnprocessableEntity: errorResponse("خطای semantic داده"),
        TooManyRequests: errorResponse("محدودیت نرخ درخواست"),
        InternalServerError: errorResponse("خطای داخلی redacted"),
      },
    },
  };
}

const catalog = await readFile(catalogPath, "utf8");
const endpoints = extractEndpoints(catalog);
const document = createDocument(endpoints);

await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(`[openapi] generated ${endpoints.length} operations at ${outputPath}`);
