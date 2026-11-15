# Graph Report - keshavarz  (2026-11-09)

## Corpus Check
- Large corpus: 672 files · ~211,814 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 3694 nodes · 14016 edges · 115 communities (105 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.84)
- Token cost: 128,660 input · 0 output

## Community Hubs (Navigation)
- Admin Console Pages
- App API Mutation Routes
- Admin Payments & Health Routes
- Admin Panel Components & RBAC
- Admin Forms & UI Primitives
- Consumer Auth & Profile UI
- Admin Data Table & Hero
- Admin RBAC API Routes
- Request Workflow Service
- Profile & Filter Drawer UI
- Consumer Lands Pages
- Provider Services & Work Center
- Admin Catalog & Provider Pages
- Provider Subscription Pages
- ULID IDs & Phase 8 Tests
- Admin Settings & Exports UI
- Auth Login & Session Routes
- Security Env & OTP Policy
- Subscriptions & Payments Mappers
- Provider Profile Module
- Admin Nav & Zustand Store
- Provider Request Detail
- Location Routes & Integrations
- Admin Management Module
- Admin Roles & Permissions Pages
- Observability & Audit Redaction
- Provider & User Home Dashboards
- Notifications Module
- Status Badges & Utils
- Consumer Request Routes
- Consumer Request Detail
- Provider Search Results
- Admin Catalog Module
- E2E Playwright Specs
- Provider Reports Page
- Admin Password Policy
- Admin Providers Module
- Validation Scripts & Icon Gen
- Financial Reports Routes
- API Contracts & Constants
- Admin Subscriptions Module
- Admin Me & Change Password
- Provider Gallery & Profile Routes
- Reports Repository
- package.json Scripts
- Session Repository & Crypto
- Admin Audit & Category Routes
- Background Jobs Runner
- Admin Users Moderation
- API Error Model
- Idempotency Service
- Runtime Dependencies
- CSV Exports Module
- Prisma Client & DB
- SMS & Payment Integrations
- ESLint & Package Meta
- Admin Auth Gate & Login
- Admin User Detail
- API Fetch Clients
- Zod Form Validators
- Prisma Seed
- API Contract Validator
- Admin Auth Tests
- Rate Limiter
- Docs: Stack, Maps & Prisma
- Admin Jobs Page
- Admin Provider Routes
- Shared Domain Types
- Parsimap Leaflet Map
- Root Layout & Fonts
- OpenAPI Generator
- Consumer Provider Profile
- Weather Cards
- TypeScript Config
- shadcn components.json
- Home Page & Panel Choice
- Dashboard Cache
- Notification Delivery Jobs
- Exports API & Schemas
- Weather Widget Types
- Ops Metrics & Dead Letters
- Admin Notifications Routes
- Catalog Cache
- Admin User Routes
- Admin Notifications UI
- Dev Dependencies
- Prisma Geo Data
- Map Picker & Weather Route
- E2E Seed Worker
- React Hook Form Wrapper
- PWA Manifest
- API Boundary Validator
- Health Endpoint
- Admin Settings Routes
- Geo Haversine Utils
- Persian Price Input
- Zod Schemas Shared
- Admin Audit Log Detail
- Live Clock
- Secret Scan Validator
- No-Mock-Imports Validator
- Lands Schemas
- Admin Constants
- PWA Icon Set
- Admins Root Layout
- Graphify Rules
- Next Config & Headers
- OTP Test Script
- Next.js Starter Icons
- PostCSS Config
- Next.js & Vercel Logos
- persian-tools Types
- Keshavarz SVG Icon

## God Nodes (most connected - your core abstractions)
1. `cn()` - 267 edges
2. `apiSuccess()` - 265 edges
3. `next` - 221 edges
4. `ApiError` - 186 edges
5. `getAllowedOrigins()` - 145 edges
6. `requireAdminSession()` - 144 edges
7. `assertMutationProtection()` - 141 edges
8. `isApiClientError()` - 132 edges
9. `react` - 130 edges
10. `toPersianDigits()` - 130 edges

## Surprising Connections (you probably didn't know these)
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` --conceptually_related_to--> `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md → src/test/fixtures/README.md
- `allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver)` --conceptually_related_to--> `schema.prisma (31 tables, type-safe mapping)`  [INFERRED]
  pnpm-workspace.yaml → prisma/README.md
- `Prisma/DB commands (validate, generate, migrate deploy, drift, seed)` --conceptually_related_to--> `Server module integration tests (*.integration.test.ts plant own rows)`  [INFERRED]
  prisma/README.md → src/test/fixtures/README.md
- `WorkAreaPanelProps` --references--> `GeoLocation`  [EXTRACTED]
  src/components/providers-panel/services/work-area-panel.tsx → src/types/consumer.ts
- `StatusBadgeProps` --references--> `RequestStatus`  [EXTRACTED]
  src/components/shared/status-badge.tsx → src/types/request.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Parsimap map implementation (config, map component, picker)** — readme_parsimap_map, readme_parsimap_config, readme_parsimap_map_component, readme_map_picker [EXTRACTED 1.00]
- **Database schema sources kept in sync (schema.prisma, migration SQL, docs/database.schema)** — prisma_readme_schema_prisma, prisma_readme_initial_migration, prisma_readme_database_schema_doc, prisma_readme_sql_outside_dsl [EXTRACTED 1.00]
- **Next.js create-next-app boilerplate public assets (likely unused leftovers)** — public_file_file_icon, public_globe_globe_icon, public_window_window_icon, public_next_nextjs_logo, public_vercel_vercel_logo [INFERRED 0.95]
- **Same brand logo rendered at multiple PWA/Apple icon sizes** — public_icons_apple_touch_icon_icon, public_icons_icon_192_icon, public_icons_icon_512_icon [INFERRED 0.95]

## Communities (115 total, 10 thin omitted)

### Community 0 - "Admin Console Pages"
Cohesion: 0.04
Nodes (98): lucide-react, recharts, AdminAdminsRoutePage(), Fallback(), Fallback(), Page(), AdminCategoriesRoutePage(), CatalogRouteFallback() (+90 more)

### Community 1 - "App API Mutation Routes"
Cohesion: 0.08
Nodes (115): PUT, POST, PUT, PATCH, POST, GET, POST, DELETE (+107 more)

### Community 2 - "Admin Payments & Health Routes"
Cohesion: 0.04
Nodes (82): GET, runtime, runtime, runtime, runtime, DELETE, runtime, DELETE (+74 more)

### Community 3 - "Admin Panel Components & RBAC"
Cohesion: 0.12
Nodes (76): AdminDemoPage(), AdminAuditLogsListPage(), AdminCan(), AdminCanProps, AdminForbidden(), AdminCategoriesPage(), AdminServicesPage(), AdminColumnVisibilityControls() (+68 more)

### Community 4 - "Admin Forms & UI Primitives"
Cohesion: 0.08
Nodes (80): radix-ui, react, sonner, AdminChangePasswordPage(), onSubmit(), AdminMeForm(), onSave(), AdminMePage() (+72 more)

### Community 5 - "Consumer Auth & Profile UI"
Cohesion: 0.05
Nodes (60): framer-motion, AuthPage(), AuthPageContent(), STAGE_COPY, ProfileLayout(), ProvidersLayout(), UsersLayout(), SearchResultsRoutePage() (+52 more)

### Community 6 - "Admin Data Table & Hero"
Cohesion: 0.06
Nodes (61): AdminColumnVisibilityMenuProps, AdminDataTableProps, AdminFilterChips(), DayPart, getDayPart(), GREETINGS, HomeHero(), POLLEN (+53 more)

### Community 7 - "Admin RBAC API Routes"
Cohesion: 0.05
Nodes (51): next, runtime, runtime, runtime, adminIdFromPath(), GET, runtime, runtime (+43 more)

### Community 8 - "Request Workflow Service"
Cohesion: 0.09
Nodes (66): runInTransaction(), TransactionClient, isRetryablePrismaConflict(), enqueueDomainNotification(), canRevealContact(), decimal(), mapAdminRequestDetail(), mapAdminRequestHistories() (+58 more)

### Community 9 - "Profile & Filter Drawer UI"
Cohesion: 0.07
Nodes (54): PLATFORM_LABEL, ProfilePage(), Reveal(), Section(), AdminFilterDrawerProps, CancelForm(), CancelRequestSheet(), CancelRequestSheetProps (+46 more)

### Community 10 - "Consumer Lands Pages"
Cohesion: 0.07
Nodes (52): EditLandPage(), NewLandPage(), ConsumerLandsPage(), SortKey, SORTS, COMPACT, ConsumerReportsPage(), FULL (+44 more)

### Community 11 - "Provider Services & Work Center"
Cohesion: 0.06
Nodes (56): clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage(), TabKey (+48 more)

### Community 12 - "Admin Catalog & Provider Pages"
Cohesion: 0.06
Nodes (54): AdminCatalogReorderRoutePage(), AdminProviderDetailRoutePage(), PageProps, AdminServiceRequestDetailRoutePage(), PageProps, AdminCatalogReorderPage(), moveItem(), AdminProviderDetailPage() (+46 more)

### Community 13 - "Provider Subscription Pages"
Cohesion: 0.06
Nodes (53): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge() (+45 more)

### Community 14 - "ULID IDs & Phase 8 Tests"
Cohesion: 0.07
Nodes (51): createPublicId(), encodeBase32(), createUser(), createUser(), cleanupAll(), cleanupUsers(), createLand(), createProvider() (+43 more)

### Community 15 - "Admin Settings & Exports UI"
Cohesion: 0.05
Nodes (50): Page(), onCreate(), onLookup(), pushRecentId(), readRecentIds(), AdminSettingsPage(), onSave(), formatSettingValue() (+42 more)

### Community 16 - "Auth Login & Session Routes"
Cohesion: 0.08
Nodes (43): POST, runtime, POST, runtime, DELETE, runtime, DELETE, runtime (+35 more)

### Community 17 - "Security Env & OTP Policy"
Cohesion: 0.08
Nodes (48): getSecurityEnvironment(), throwSecurityEnvError(), APP_SESSION_POLICY, OTP_POLICY, getDeviceFingerprint(), request(), createOtp(), phones (+40 more)

### Community 18 - "Subscriptions & Payments Mappers"
Cohesion: 0.10
Nodes (51): mapActiveSubscription(), mapPaymentDetail(), mapPaymentSummary(), mapPurchaseResult(), mapRefund(), mapSubscriptionHistoryItem(), mapSubscriptionPlan(), money() (+43 more)

### Community 19 - "Provider Profile Module"
Cohesion: 0.10
Nodes (49): phones, decimalToString(), mapProviderGalleryImage(), mapProviderProfile(), mapProviderService(), mapPublicProviderProfile(), mapPublicProviderService(), countActiveProviderServices() (+41 more)

### Community 20 - "Admin Nav & Zustand Store"
Cohesion: 0.08
Nodes (38): zustand, ADMIN_NAV_GROUPS, AdminNavGroup, AdminNavItem, AdminPermissionCode, isAdminNavActive(), AdminShell(), AdminShellProps (+30 more)

### Community 21 - "Provider Request Detail"
Cohesion: 0.08
Nodes (45): landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState, ProviderRequestsContent() (+37 more)

### Community 22 - "Location Routes & Integrations"
Cohesion: 0.08
Nodes (31): GET, runtime, GET, runtime, ObjectStorage, HttpObjectStorage, ObjectStorageUnavailableError, PutResponse (+23 more)

### Community 23 - "Admin Management Module"
Cohesion: 0.09
Nodes (47): AdminListRecord, AdminOverrideRecord, AdminRoleSummaryRecord, mapAdminDetail(), mapAdminSummary(), mapPermission(), mapRole(), mapRoleSummary() (+39 more)

### Community 24 - "Admin Roles & Permissions Pages"
Cohesion: 0.09
Nodes (38): AdminAdminDetailRoutePage(), PageProps, AdminPermissionsRoutePage(), AdminRoleDetailRoutePage(), PageProps, AdminAdminDetailPage(), AdminAdminDetailPageProps, AdminPermissionsCatalogPage() (+30 more)

### Community 25 - "Observability & Audit Redaction"
Cohesion: 0.10
Nodes (28): vitest, runRbacExpiryJob(), runRbacExpiryJobSafe(), redactAuditValue(), AlertType, emitAlert(), createLogger(), LogAttributes (+20 more)

### Community 26 - "Provider & User Home Dashboards"
Cohesion: 0.10
Nodes (34): ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor(), Reveal() (+26 more)

### Community 27 - "Notifications Module"
Cohesion: 0.11
Nodes (36): ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), mapAdminNotification(), mapNotification(), countUnreadUserNotifications(), createNotificationWithDeliveries(), findAdminsByPublicIds() (+28 more)

### Community 28 - "Status Badges & Utils"
Cohesion: 0.09
Nodes (37): class-variance-authority, AdminStatusBadgeProps, BadgeVariant, STATUS_TONES, DatePickerStep(), DatePickerStepProps, isoForOffset(), MAX_SEARCH_DATES (+29 more)

### Community 29 - "Consumer Request Routes"
Cohesion: 0.08
Nodes (28): runtime, runtime, runtime, runtime, runtime, runtime, runtime, GET (+20 more)

### Community 30 - "Consumer Request Detail"
Cohesion: 0.09
Nodes (34): ConsumerRequestDetailContent(), ConsumerRequestDetailPage(), FULL, landLocation(), PROVIDER_STATUS, Reveal(), Section(), STAMP (+26 more)

### Community 31 - "Provider Search Results"
Cohesion: 0.09
Nodes (32): getApiProviderResultState(), LIST_ITEM_SPRING, RequestBanner(), SearchResultsPage(), SearchSummary(), SortKey, SORTS, COMPACT (+24 more)

### Community 32 - "Admin Catalog Module"
Cohesion: 0.14
Nodes (35): AdminCategoryRecord, AdminServiceRecord, mapAdminCategory(), mapAdminService(), categorySelect, countNonDeletedServicesInCategory(), countProviderServicesForCategory(), countProviderServicesForService() (+27 more)

### Community 33 - "E2E Playwright Specs"
Cohesion: 0.09
Nodes (23): adminPassword, adminPhone, createSearch(), idempotencyKey(), mutation(), PROVIDER_PHONES, tomorrow(), AdminSessionSeed (+15 more)

### Community 34 - "Provider Reports Page"
Cohesion: 0.08
Nodes (33): COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES, Reveal() (+25 more)

### Community 35 - "Admin Password Policy"
Cohesion: 0.13
Nodes (32): ADMIN_PASSWORD_POLICY, assertAdminPasswordPolicy(), COMMON_PASSWORDS, nextAdminLockoutSeconds(), createAdminSession(), findAdminByPhoneForLogin(), getAdminPasswordMaterial(), getCurrentAdminProfile() (+24 more)

### Community 36 - "Admin Providers Module"
Cohesion: 0.14
Nodes (32): AdminProviderDetailRecord, AdminProviderListRecord, AdminProviderServiceRecord, decimalToString(), mapAdminProviderDetail(), mapAdminProviderListItem(), mapAdminProviderService(), toString() (+24 more)

### Community 37 - "Validation Scripts & Icon Gen"
Cohesion: 0.07
Nodes (24): sharp, bannedPatterns, collectTs(), failures, listsRoot, projectRoot, requiredListHints, banned (+16 more)

### Community 38 - "Financial Reports Routes"
Cohesion: 0.09
Nodes (25): runtime, GET, runtime, GET, runtime, GET, runtime, GET (+17 more)

### Community 39 - "API Contracts & Constants"
Cohesion: 0.14
Nodes (29): ADMIN_SESSION_POLICY, API_ROOTS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, SESSION_COOKIES, ApiErrorEnvelopeSchema, ApiErrorSchema, ApiFieldErrorsSchema (+21 more)

### Community 40 - "Admin Subscriptions Module"
Cohesion: 0.15
Nodes (31): mapAdminPaymentDetail(), mapAdminPaymentSummary(), mapAdminProviderSubscription(), mapAdminRefund(), mapAdminSubscriptionPlan(), money(), countActiveSubscriptionsForPlan(), createSubscriptionPlan() (+23 more)

### Community 41 - "Admin Me & Change Password"
Cohesion: 0.09
Nodes (22): runtime, GET, mapCurrentAdmin(), runtime, GET, PATCH, runtime, runtime (+14 more)

### Community 42 - "Provider Gallery & Profile Routes"
Cohesion: 0.08
Nodes (26): DELETE, imageIdFromPath(), runtime, GET, runtime, DELETE, providerServiceIdFromPath(), runtime (+18 more)

### Community 43 - "Reports Repository"
Cohesion: 0.19
Nodes (31): countActiveApprovedProviders(), countActiveUsersInRange(), countNotificationDeliveries(), countPaidPayments(), countRequestsCreatedByStatus(), findConsumerTopLand(), findConsumerTopService(), findOwnedLandIdByPublicId() (+23 more)

### Community 44 - "package.json Scripts"
Cohesion: 0.06
Nodes (32): scripts, build, check:admin-list-perf, check:admin-load-budget, check:api-boundaries, check:api-contracts, check:frontend-security, check:no-mock-imports (+24 more)

### Community 45 - "Session Repository & Crypto"
Cohesion: 0.12
Nodes (20): findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup, UserSessionLookup, findActiveAdminSessionForToken(), findUserSessionForToken() (+12 more)

### Community 46 - "Admin Audit & Category Routes"
Cohesion: 0.10
Nodes (25): auditLogIdFromPath(), GET, runtime, GET, categoryIdFromPath(), runtime, runtime, runtime (+17 more)

### Community 47 - "Background Jobs Runner"
Cohesion: 0.12
Nodes (22): names, requested, systemClock, runExportCleanupJob(), JOB_NAMES, JobName, JobRunRecord, JobRunResult (+14 more)

### Community 48 - "Admin Users Moderation"
Cohesion: 0.14
Nodes (24): adminPhones, phones, AdminModerationActionRecord, AdminUserDetailRecord, AdminUserListRecord, mapAdminModerationAction(), mapAdminUserDetail(), mapAdminUserListItem() (+16 more)

### Community 49 - "API Error Model"
Cohesion: 0.17
Nodes (21): API_ERROR_CODES, ApiError, ApiErrorCode, ApiErrorOptions, mapPrismaError(), normalizeError(), decimalToString(), mapLand() (+13 more)

### Community 50 - "Idempotency Service"
Cohesion: 0.16
Nodes (13): getAppIdempotencyService(), globalIdempotency, IdempotencyScope, IdempotencyService, IdempotencyStore, StoredIdempotencyResult, scope, MemoryIdempotencyStore (+5 more)

### Community 51 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (28): dependencies, argon2, class-variance-authority, clsx, dotenv, farsi-tools, @fontsource-variable/vazirmatn, framer-motion (+20 more)

### Community 52 - "CSV Exports Module"
Cohesion: 0.16
Nodes (21): escapeCsvCell(), toCsv(), listPaymentsForExport(), listReportsForExport(), resolveRange(), cleanupExpiredExports(), createAdminExport(), processExportJob() (+13 more)

### Community 53 - "Prisma Client & DB"
Cohesion: 0.13
Nodes (15): databaseEnvironment, globalForPrisma, prisma, findSystemSetting(), listSystemSettings(), settingSelect, upsertSystemSetting(), assertValueMatchesType() (+7 more)

### Community 54 - "SMS & Payment Integrations"
Cohesion: 0.14
Nodes (11): ConsoleSmsQueue, PaymentInitiation, PaymentProvider, SmsMessage, SmsProvider, SmsQueue, HttpSmsQueue, QueueResponse (+3 more)

### Community 55 - "ESLint & Package Meta"
Cohesion: 0.08
Nodes (25): eslintConfig, name, private, version, argon2, clsx, eslint, eslint-config-next (+17 more)

### Community 56 - "Admin Auth Gate & Login"
Cohesion: 0.14
Nodes (20): AdminConsoleLayout(), AdminLoginPage(), AdminAuthGate(), AdminLoginForm(), onSubmit(), AdminLoginFormProps, LoginFormSchema, AdminSessionContext (+12 more)

### Community 57 - "Admin User Detail"
Cohesion: 0.12
Nodes (22): AdminUserDetailRoutePage(), PageProps, AdminUserDetailPage(), AdminUserDetailPageProps, MODERATION_OPTIONS, CursorListResult, useAdminCursorQuery(), UseAdminCursorQueryOptions (+14 more)

### Community 58 - "API Fetch Clients"
Cohesion: 0.13
Nodes (21): adminRequest(), buildUrl(), parseResponse(), APP_API_BASE, AppApiRequestOptions, appRequest(), buildUrl(), notifyUnauthorized() (+13 more)

### Community 59 - "Zod Form Validators"
Cohesion: 0.17
Nodes (16): LandFormProps, authFormSchema, AuthFormValues, otpSchema, phoneSchema, geoLocationSchema, landFormSchema, LandFormValues (+8 more)

### Community 60 - "Prisma Seed"
Cohesion: 0.12
Nodes (15): catalog, main(), permissionCodes, prisma, seedBootstrapAdmin(), seedCatalog(), seedDir, seedPermissions() (+7 more)

### Community 61 - "API Contract Validator"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 62 - "Admin Auth Tests"
Cohesion: 0.16
Nodes (16): createAdmin(), phones, countActiveSuperAdmins(), findAdminStatusTarget(), setManagedAdminStatus(), assertNotLastSuperAdminRemoval(), assertNotSelfDeactivation(), cache (+8 more)

### Community 63 - "Rate Limiter"
Cohesion: 0.19
Nodes (11): createRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy, RateLimitResult (+3 more)

### Community 64 - "Docs: Stack, Maps & Prisma"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "Admin Jobs Page"
Cohesion: 0.19
Nodes (17): Page(), AdminJobsPage(), onReplay(), onRunJobs(), RUNNABLE_JOBS, ADMIN_JOB_NAMES, AdminJobName, fetchNotificationDeadLetters() (+9 more)

### Community 66 - "Admin Provider Routes"
Cohesion: 0.13
Nodes (16): runtime, GET, providerIdFromPath(), runtime, runtime, runtime, AdminProviderApproveSchema, AdminProviderAvailabilitySchema (+8 more)

### Community 67 - "Shared Domain Types"
Cohesion: 0.16
Nodes (14): Notification, NotificationType, CancelledBy, Request, RequestProvider, RequestProviderStatus, RequestStatus, Service (+6 more)

### Community 68 - "Parsimap Leaflet Map"
Cohesion: 0.17
Nodes (17): leaflet, LAYER_ICONS, Leaflet, ParsimapMap(), DEFAULT_PARSIMAP_LAYER, fallbackLayer(), isSameLocation(), PARSIMAP_LAYERS (+9 more)

### Community 69 - "Root Layout & Fonts"
Cohesion: 0.15
Nodes (14): @fontsource-variable/vazirmatn, metadata, RootLayout(), viewport, AppShell(), AppShellProps, HIDDEN_MENU_PATHS, MobileShell() (+6 more)

### Community 70 - "OpenAPI Generator"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "Consumer Provider Profile"
Cohesion: 0.17
Nodes (17): ConsumerProviderProfileContent(), ConsumerProviderProfilePage(), isInternalPath(), safeResultsHref(), FULL, Header(), locationLabel(), ProviderPublicProfile() (+9 more)

### Community 72 - "Weather Cards"
Cohesion: 0.22
Nodes (17): AdviceTile(), LandWeatherCard(), AdviceRow(), FieldWeatherCard(), formatAstroTime(), formatWeekday(), Metric(), WeatherBody() (+9 more)

### Community 73 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 74 - "shadcn components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 75 - "Home Page & Panel Choice"
Cohesion: 0.18
Nodes (15): HomePage(), HomePageContent(), Reveal(), PanelCard(), PanelChoice(), PanelConfig, PanelKey, PANELS (+7 more)

### Community 76 - "Dashboard Cache"
Cohesion: 0.22
Nodes (16): cache, CacheEntry, getDashboardCache(), setDashboardCache(), countActiveUsersInRange(), countNotificationDeliveryFailures(), countPaymentFailures(), countProviders() (+8 more)

### Community 77 - "Notification Delivery Jobs"
Cohesion: 0.21
Nodes (15): runNotificationDeliveriesJob(), runNotificationJobs(), backoffMilliseconds(), deliverChannel(), isReadyForRetry(), listNotificationDeadLetters(), replayNotificationDeadLetter(), runNotificationDeliveryJob() (+7 more)

### Community 78 - "Exports API & Schemas"
Cohesion: 0.20
Nodes (15): GET, runtime, CreateExportSchema, EXPORT_DOWNLOAD_TTL_SECONDS, EXPORT_MAX_ROWS, EXPORT_TTL_MS, ExportParamsSchema, getAdminExport() (+7 more)

### Community 79 - "Weather Widget Types"
Cohesion: 0.18
Nodes (15): LandWeatherCardProps, FieldWeatherCardProps, HomeHeroProps, formatForecastDate(), MetricPill(), WeatherSkeleton(), WeatherWidget(), loadInitialWeather() (+7 more)

### Community 80 - "Ops Metrics & Dead Letters"
Cohesion: 0.22
Nodes (15): getOpsMetricsForAdmin(), listPaymentDeadLettersForAdmin(), paymentReplayHandler(), replayPaymentDeadLetterForAdmin(), cleanup(), phones, clearPaymentCallbackDeadLettersForTests(), DeadLetterEntry (+7 more)

### Community 81 - "Admin Notifications Routes"
Cohesion: 0.16
Nodes (12): runtime, runtime, runtime, GET, runtime, AdminNotificationsQuerySchema, AdminSendNotificationSchema, NotificationParamsSchema (+4 more)

### Community 82 - "Catalog Cache"
Cohesion: 0.27
Nodes (13): cache, CacheEntry, getCatalogCache(), setCatalogCache(), mapCategory(), mapService(), findActiveCategoryBySlug(), findActiveServiceBySlug() (+5 more)

### Community 83 - "Admin User Routes"
Cohesion: 0.19
Nodes (12): runtime, GET, runtime, userIdFromPath(), GET, runtime, userIdFromPath(), AdminUserModerationActionSchema (+4 more)

### Community 84 - "Admin Notifications UI"
Cohesion: 0.19
Nodes (14): onConfirmSend(), isNotificationType(), parseIdList(), ADMIN_NOTIFICATION_TYPES, AdminNotification, AdminNotificationChannel, AdminNotificationDeliverySchema, AdminNotificationSchema (+6 more)

### Community 85 - "Dev Dependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, sharp, tailwindcss, @tailwindcss/postcss (+7 more)

### Community 86 - "Prisma Geo Data"
Cohesion: 0.30
Nodes (12): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+4 more)

### Community 87 - "Map Picker & Weather Route"
Cohesion: 0.26
Nodes (10): inlineCenter(), LocationLabel(), MapPicker(), PickerHint(), useCurrentPosition(), MapControlButton(), DialogClose(), DEFAULT_MAP_CENTER (+2 more)

### Community 88 - "E2E Seed Worker"
Cohesion: 0.28
Nodes (10): args, [command, ...rest], hashToken(), installAppSession(), makeOpaqueToken(), makePublicId(), seedAdmin(), seedApp() (+2 more)

### Community 89 - "React Hook Form Wrapper"
Cohesion: 0.21
Nodes (11): react-hook-form, FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue (+3 more)

### Community 90 - "PWA Manifest"
Cohesion: 0.17
Nodes (11): background_color, description, dir, display, icons, lang, name, orientation (+3 more)

### Community 91 - "API Boundary Validator"
Cohesion: 0.18
Nodes (9): collectFiles(), fail(), graph, projectRoot, sourceRoot, supportedExtensions, visit(), visited (+1 more)

### Community 92 - "Health Endpoint"
Cohesion: 0.29
Nodes (8): GET, runtime, HealthResponse, HealthResponseSchema, mapHealthResponse(), checkDatabaseConnection(), getApiHealth(), HealthResult

### Community 93 - "Admin Settings Routes"
Cohesion: 0.24
Nodes (8): runtime, settingParamsFromPath(), runtime, AdminSettingParamsSchema, AdminSettingsQuerySchema, AdminSettingUpsertSchema, SettingValueTypeSchema, SystemSettingValueType

### Community 94 - "Geo Haversine Utils"
Cohesion: 0.25
Nodes (7): MapPickerProps, ParsimapMapProps, haversineKm(), toRadians(), GeoLocation, OfferedService, ProviderProfile

### Community 95 - "Persian Price Input"
Cohesion: 0.33
Nodes (9): persian-tools, formatToPersianWords(), formatWithCommas(), parseToRawNumber(), sanitizeInput(), toEnglishDigits(), toPersianDigits(), usePriceInput() (+1 more)

### Community 96 - "Zod Schemas Shared"
Cohesion: 0.20
Nodes (7): zod, PublicId, AdminAuditLogParamsSchema, AdminAuditLogsQuerySchema, AdminDashboardQuerySchema, AuthCheckResponse, AuthCheckResponseSchema

### Community 97 - "Admin Audit Log Detail"
Cohesion: 0.33
Nodes (7): Page(), AdminAuditLogDetailPage(), JsonBlock(), AdminAuditLog, AdminAuditLogSchema, CursorMetaSchema, fetchAdminAuditLog()

### Community 98 - "Live Clock"
Cohesion: 0.33
Nodes (7): LiveClock(), LiveClockProps, useLiveClock(), formatJalali(), formatJalaliShort(), formatTime(), RELATIVE_UNITS

### Community 99 - "Secret Scan Validator"
Cohesion: 0.22
Nodes (8): allowlist, collectFiles(), patterns, projectRoot, scanRoots, skipDirectories, supportedExtensions, violations

### Community 100 - "No-Mock-Imports Validator"
Cohesion: 0.25
Nodes (6): bannedRoots, collectFiles(), mockDir, projectRoot, supportedExtensions, violations

### Community 101 - "Lands Schemas"
Cohesion: 0.25
Nodes (7): AreaSchema, LandCreateSchema, LandParamsSchema, LandsQuerySchema, LandUpdateSchema, LatitudeSchema, LongitudeSchema

### Community 102 - "Admin Constants"
Cohesion: 0.33
Nodes (5): ADMIN_DEFAULT_LIMIT, ADMIN_PAGE_LIMITS, ADMIN_SIDEBAR_COLLAPSED_WIDTH, ADMIN_SIDEBAR_WIDTH, ADMIN_STORAGE_KEYS

### Community 103 - "PWA Icon Set"
Cohesion: 0.50
Nodes (4): Apple Touch Icon (180px, green goblet-with-hat logo), PWA Icon 192px (green goblet-with-hat logo), PWA Icon 512px (green goblet-with-hat logo), PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)

### Community 108 - "Next.js Starter Icons"
Cohesion: 0.67
Nodes (3): File Document Icon (Next.js starter), Globe Icon (Next.js starter), Browser Window Icon (Next.js starter)

## Ambiguous Edges - Review These
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` → `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **29 isolated node(s):** `@hookform/resolvers`, `@prisma/client`, `farsi-tools`, `mariadb`, `next-themes` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 922 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Admin RBAC API Routes` to `Admin Console Pages`, `App API Mutation Routes`, `Admin Payments & Health Routes`, `Admin Panel Components & RBAC`, `Admin Forms & UI Primitives`, `Consumer Auth & Profile UI`, `Admin Data Table & Hero`, `Profile & Filter Drawer UI`, `Consumer Lands Pages`, `Provider Services & Work Center`, `Admin Catalog & Provider Pages`, `Provider Subscription Pages`, `Admin Settings & Exports UI`, `Auth Login & Session Routes`, `Security Env & OTP Policy`, `Admin Nav & Zustand Store`, `Provider Request Detail`, `Location Routes & Integrations`, `Admin Roles & Permissions Pages`, `Provider & User Home Dashboards`, `Consumer Request Routes`, `Consumer Request Detail`, `Provider Search Results`, `Provider Reports Page`, `Admin Password Policy`, `Validation Scripts & Icon Gen`, `Financial Reports Routes`, `Admin Me & Change Password`, `Provider Gallery & Profile Routes`, `Session Repository & Crypto`, `Admin Audit & Category Routes`, `ESLint & Package Meta`, `Admin Auth Gate & Login`, `Admin User Detail`, `Admin Auth Tests`, `Admin Provider Routes`, `Root Layout & Fonts`, `Consumer Provider Profile`, `Weather Cards`, `Home Page & Panel Choice`, `Exports API & Schemas`, `Weather Widget Types`, `Admin Notifications Routes`, `Admin User Routes`, `Map Picker & Weather Route`, `Health Endpoint`, `Admin Settings Routes`, `Admin Audit Log Detail`, `Admins Root Layout`, `Next Config & Headers`?**
  _High betweenness centrality (0.412) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `farsi-tools` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Console Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.03851492019430951 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `Zod Schemas Shared` to `Admin Console Pages`, `App API Mutation Routes`, `Admin Payments & Health Routes`, `Admin Panel Components & RBAC`, `Admin Forms & UI Primitives`, `Consumer Auth & Profile UI`, `Admin RBAC API Routes`, `Profile & Filter Drawer UI`, `Consumer Lands Pages`, `Provider Services & Work Center`, `Admin Catalog & Provider Pages`, `Provider Subscription Pages`, `Admin Settings & Exports UI`, `Auth Login & Session Routes`, `Provider Request Detail`, `Location Routes & Integrations`, `Admin Roles & Permissions Pages`, `Provider & User Home Dashboards`, `Consumer Request Routes`, `Provider Search Results`, `Provider Reports Page`, `Financial Reports Routes`, `API Contracts & Constants`, `Admin Me & Change Password`, `Provider Gallery & Profile Routes`, `Admin Audit & Category Routes`, `Background Jobs Runner`, `ESLint & Package Meta`, `Admin Auth Gate & Login`, `Admin User Detail`, `Zod Form Validators`, `Admin Jobs Page`, `Admin Provider Routes`, `Consumer Provider Profile`, `Exports API & Schemas`, `Admin Notifications Routes`, `Admin User Routes`, `Admin Notifications UI`, `Health Endpoint`, `Admin Settings Routes`, `Admin Audit Log Detail`, `Lands Schemas`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `App API Mutation Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.07699037620297462 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `API Error Model` to `App API Mutation Routes`, `Admin Payments & Health Routes`, `Request Workflow Service`, `ULID IDs & Phase 8 Tests`, `Auth Login & Session Routes`, `Security Env & OTP Policy`, `Subscriptions & Payments Mappers`, `Provider Profile Module`, `Location Routes & Integrations`, `Admin Management Module`, `Notifications Module`, `Admin Catalog Module`, `Admin Password Policy`, `Admin Providers Module`, `Financial Reports Routes`, `Admin Subscriptions Module`, `Reports Repository`, `Session Repository & Crypto`, `Admin Audit & Category Routes`, `Admin Users Moderation`, `Idempotency Service`, `CSV Exports Module`, `Prisma Client & DB`, `Admin Auth Tests`, `Rate Limiter`, `Notification Delivery Jobs`, `Exports API & Schemas`, `Ops Metrics & Dead Letters`, `Catalog Cache`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._