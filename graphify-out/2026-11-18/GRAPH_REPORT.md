# Graph Report - keshavarz  (2026-11-18)

## Corpus Check
- 666 files · ~221,084 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 8, .example 1, .toml 1)

## Summary
- 3787 nodes · 14314 edges · 104 communities (93 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `016991d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- requireAdminSession
- apiSuccess
- AdminPageHeader
- Button
- profile/page.tsx
- admin-command-palette.tsx
- ops.service.ts
- request.service.ts
- lucide-react
- app/layout.tsx
- providers/services/page.tsx
- admin-provider-detail-page.tsx
- subscription/page.tsx
- search.service.ts
- admin-client.ts
- security/index.ts
- app-auth.service.ts
- subscriptions.service.ts
- provider.service.ts
- parseWithSchema
- app-requests.ts
- ApiError
- admin-management.service.ts
- admin-admin-detail-page.tsx
- vitest
- toPersianDigits
- notification.service.ts
- jalali.ts
- getAllowedOrigins
- dock-nav.tsx
- app-client.ts
- admin-catalog.service.ts
- db.ts
- users/reports/page.tsx
- admin-auth.service.ts
- admin-providers.service.ts
- searchable-select.tsx
- phase06.integration.test.ts
- contracts/index.ts
- admin-subscriptions.service.ts
- admin-panel/index.ts
- cn
- exports.service.ts
- scripts
- reports.service.ts
- admins/v1/providers/[providerId]/route.ts
- runner.ts
- prisma.ts
- lands.service.ts
- idempotency.ts
- dependencies
- app-provider.tsx
- [key]/route.ts
- app-profile.service.ts
- package.json
- isApiClientError
- admin-user-detail-page.tsx
- session.service.ts
- validators/index.ts
- ulid.ts
- validate-api-contracts.mjs
- @playwright/test
- default-rate-limiter.ts
- Keshavarz Agricultural Services Platform (Mock)
- admin-jobs-page.tsx
- use-initialize-app.ts
- admin-audit.repository.ts
- map-picker.tsx
- app-settings.ts
- generate-openapi.mjs
- utils/format.ts
- types/index.ts
- compilerOptions
- components.json
- clock.ts
- dashboard.service.ts
- check-release.mjs
- use-price-input.ts
- ref_node_path
- catalog.service.ts
- admin-notifications-page.tsx
- devDependencies
- public/settings/route.ts
- seed-worker.mts
- form.tsx
- manifest.json
- validate-api-boundaries.mjs
- health/route.ts
- validate-no-mock-imports.mjs
- validate-secret-scan.mjs
- admin/constants.ts
- PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)
- admins/layout.tsx
- Graphify Knowledge Graph (graphify-out)
- next.config.ts
- otp-test.mjs
- File Document Icon (Next.js starter)
- postcss.config.mjs
- Next.js Wordmark Logo
- persian-tools.d.ts
- Keshavarz App Icon (green gradient plant/leaf)

## God Nodes (most connected - your core abstractions)
1. `cn()` - 269 edges
2. `apiSuccess()` - 266 edges
3. `next` - 223 edges
4. `ApiError` - 191 edges
5. `requireAdminSession()` - 148 edges
6. `getAllowedOrigins()` - 145 edges
7. `assertMutationProtection()` - 141 edges
8. `isApiClientError()` - 137 edges
9. `react` - 134 edges
10. `toPersianDigits()` - 131 edges

## Surprising Connections (you probably didn't know these)
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` --conceptually_related_to--> `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md → src/test/fixtures/README.md
- `allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver)` --conceptually_related_to--> `schema.prisma (31 tables, type-safe mapping)`  [INFERRED]
  pnpm-workspace.yaml → prisma/README.md
- `Prisma/DB commands (validate, generate, migrate deploy, drift, seed)` --conceptually_related_to--> `Server module integration tests (*.integration.test.ts plant own rows)`  [INFERRED]
  prisma/README.md → src/test/fixtures/README.md
- `AdminFilterChipsProps` --references--> `AdminFilterChip`  [EXTRACTED]
  src/components/admin-panel/filters/admin-filter-bar.tsx → src/lib/admin/search-params.ts
- `AdminFilterChipsProps` --references--> `AdminFilterChip`  [EXTRACTED]
  src/components/admin-panel/filters/admin-filter-chips.tsx → src/lib/admin/search-params.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Parsimap map implementation (config, map component, picker)** — readme_parsimap_map, readme_parsimap_config, readme_parsimap_map_component, readme_map_picker [EXTRACTED 1.00]
- **Database schema sources kept in sync (schema.prisma, migration SQL, docs/database.schema)** — prisma_readme_schema_prisma, prisma_readme_initial_migration, prisma_readme_database_schema_doc, prisma_readme_sql_outside_dsl [EXTRACTED 1.00]
- **Next.js create-next-app boilerplate public assets (likely unused leftovers)** — public_file_file_icon, public_globe_globe_icon, public_window_window_icon, public_next_nextjs_logo, public_vercel_vercel_logo [INFERRED 0.95]
- **Same brand logo rendered at multiple PWA/Apple icon sizes** — public_icons_apple_touch_icon_icon, public_icons_icon_192_icon, public_icons_icon_512_icon [INFERRED 0.95]

## Communities (104 total, 11 thin omitted)

### Community 0 - "react"
Cohesion: 0.06
Nodes (43): react, AdminAdminsRoutePage(), Fallback(), Page(), Fallback(), Page(), AdminCategoriesRoutePage(), CatalogRouteFallback() (+35 more)

### Community 1 - "requireAdminSession"
Cohesion: 0.03
Nodes (124): PUT, runtime, POST, runtime, PUT, runtime, adminIdFromPath(), GET (+116 more)

### Community 2 - "apiSuccess"
Cohesion: 0.03
Nodes (132): next, POST, runtime, GET, runtime, GET, runtime, GET (+124 more)

### Community 3 - "AdminPageHeader"
Cohesion: 0.10
Nodes (94): AdminDemoPage(), AdminAuditLogsListPage(), AdminCategoriesPage(), AdminCategoryFormDialog(), onSubmit(), AdminCategoryFormDialogProps, EMPTY, toFormValues() (+86 more)

### Community 4 - "Button"
Cohesion: 0.07
Nodes (71): radix-ui, AdminPaymentDetailRoutePage(), PageProps, AdminRolesRoutePage(), Page(), AdminSessionKeeper(), faDigits, formatCountdown() (+63 more)

### Community 5 - "profile/page.tsx"
Cohesion: 0.07
Nodes (51): zustand, AuthPage(), AuthPageContent(), STAGE_COPY, PLATFORM_LABEL, ProfilePage(), Reveal(), Section() (+43 more)

### Community 6 - "admin-command-palette.tsx"
Cohesion: 0.06
Nodes (52): AdminCommandPalette(), close(), onInputKeyDown(), onKeyDown(), select(), isTypingTarget(), NO_ITEMS, normalize() (+44 more)

### Community 7 - "ops.service.ts"
Cohesion: 0.12
Nodes (19): POST, ReplayBodySchema, runtime, GET, runtime, POST, ReplayBodySchema, runtime (+11 more)

### Community 8 - "request.service.ts"
Cohesion: 0.08
Nodes (65): runInTransaction(), TransactionClient, canRevealContact(), decimal(), mapAdminRequestDetail(), mapAdminRequestHistories(), mapAdminRequestSummary(), mapConsumerRequestDetail() (+57 more)

### Community 9 - "lucide-react"
Cohesion: 0.09
Nodes (39): lucide-react, AdminFilterDrawerProps, CancelForm(), CancelRequestSheet(), CancelRequestSheetProps, DEFAULT_CANCEL_REASON, REASONS, AppMenu() (+31 more)

### Community 10 - "app/layout.tsx"
Cohesion: 0.18
Nodes (12): @fontsource-variable/vazirmatn, metadata, RootLayout(), viewport, AppShell(), MobileShell(), MobileShellProps, StatusBarMock() (+4 more)

### Community 11 - "providers/services/page.tsx"
Cohesion: 0.06
Nodes (57): clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage(), TabKey (+49 more)

### Community 12 - "admin-provider-detail-page.tsx"
Cohesion: 0.07
Nodes (52): sonner, AdminCatalogReorderRoutePage(), AdminProviderDetailRoutePage(), PageProps, AdminServiceRequestDetailRoutePage(), PageProps, AdminCatalogReorderPage(), moveItem() (+44 more)

### Community 13 - "subscription/page.tsx"
Cohesion: 0.06
Nodes (58): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge() (+50 more)

### Community 14 - "search.service.ts"
Cohesion: 0.09
Nodes (40): createPublicId(), encodeBase32(), createUser(), createUser(), cleanupAll(), cleanupUsers(), createLand(), createProvider() (+32 more)

### Community 15 - "admin-client.ts"
Cohesion: 0.18
Nodes (14): ADMIN_API_BASE, AdminApiRequestOptions, adminRequest(), buildUrl(), notifySessionExpired(), parseResponse(), QueryValue, recordAdminActivity() (+6 more)

### Community 16 - "security/index.ts"
Cohesion: 0.06
Nodes (51): POST, runtime, POST, runtime, GET, mapCurrentAdmin(), PATCH, runtime (+43 more)

### Community 17 - "app-auth.service.ts"
Cohesion: 0.08
Nodes (44): APP_SESSION_POLICY, OTP_POLICY, prisma, runAppAuthCleanupJob(), createOtp(), phones, smsQueue, isOtpResendCooldownActive() (+36 more)

### Community 18 - "subscriptions.service.ts"
Cohesion: 0.09
Nodes (48): GET, runtime, mapActiveSubscription(), mapPaymentDetail(), mapPaymentSummary(), mapPurchaseResult(), mapRefund(), mapSubscriptionHistoryItem() (+40 more)

### Community 19 - "provider.service.ts"
Cohesion: 0.10
Nodes (49): phones, decimalToString(), mapProviderGalleryImage(), mapProviderProfile(), mapProviderService(), mapPublicProviderProfile(), mapPublicProviderService(), countActiveProviderServices() (+41 more)

### Community 20 - "parseWithSchema"
Cohesion: 0.06
Nodes (52): POST, runtime, POST, runtime, POST, runtime, GET, POST (+44 more)

### Community 21 - "app-requests.ts"
Cohesion: 0.05
Nodes (65): landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState, ProviderRequestsContent() (+57 more)

### Community 22 - "ApiError"
Cohesion: 0.17
Nodes (16): API_ERROR_CODES, ApiError, ApiErrorCode, ApiErrorOptions, isRetryablePrismaConflict(), mapPrismaError(), normalizeError(), findSystemSetting() (+8 more)

### Community 23 - "admin-management.service.ts"
Cohesion: 0.06
Nodes (75): assertAdminPasswordPolicy(), countActiveSuperAdmins(), findAdminStatusTarget(), revokeAllAdminSessions(), AdminListRecord, AdminOverrideRecord, AdminRoleSummaryRecord, mapAdminDetail() (+67 more)

### Community 24 - "admin-admin-detail-page.tsx"
Cohesion: 0.10
Nodes (37): AdminAdminDetailRoutePage(), PageProps, AdminPermissionsRoutePage(), AdminRoleDetailRoutePage(), PageProps, AdminAdminDetailPage(), AdminAdminDetailPageProps, AdminPermissionsCatalogPage() (+29 more)

### Community 25 - "vitest"
Cohesion: 0.12
Nodes (23): vitest, RequestId, ApiRequestContext, ApiRouteHandler, AlertType, createLogger(), LogAttributes, Logger (+15 more)

### Community 26 - "toPersianDigits"
Cohesion: 0.06
Nodes (62): ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor(), Reveal() (+54 more)

### Community 27 - "notification.service.ts"
Cohesion: 0.08
Nodes (43): ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), mapAdminNotification(), mapNotification(), countUnreadUserNotifications(), createNotificationWithDeliveries(), findAdminsByPublicIds() (+35 more)

### Community 28 - "jalali.ts"
Cohesion: 0.09
Nodes (36): class-variance-authority, AdminStatusBadgeProps, BadgeVariant, STATUS_TONES, DatePickerStep(), DatePickerStepProps, isoForOffset(), MAX_SEARCH_DATES (+28 more)

### Community 29 - "getAllowedOrigins"
Cohesion: 0.08
Nodes (40): DELETE, runtime, POST, runtime, DELETE, runtime, DELETE, runtime (+32 more)

### Community 30 - "dock-nav.tsx"
Cohesion: 0.22
Nodes (11): ProfileLayout(), ProvidersLayout(), UsersLayout(), ConsumerDock(), DockItem, DockNav(), DockNavProps, ProviderDock() (+3 more)

### Community 31 - "app-client.ts"
Cohesion: 0.19
Nodes (14): APP_API_BASE, AppApiRequestOptions, appRequest(), buildUrl(), notifyUnauthorized(), parseResponse(), QueryValue, UnauthorizedListener (+6 more)

### Community 32 - "admin-catalog.service.ts"
Cohesion: 0.14
Nodes (35): AdminCategoryRecord, AdminServiceRecord, mapAdminCategory(), mapAdminService(), categorySelect, countNonDeletedServicesInCategory(), countProviderServicesForCategory(), countProviderServicesForService() (+27 more)

### Community 33 - "db.ts"
Cohesion: 0.14
Nodes (22): createSearch(), getData(), idempotencyKey(), listCandidates(), mutation(), PROVIDER_PHONES, sendTo(), tomorrow() (+14 more)

### Community 34 - "users/reports/page.tsx"
Cohesion: 0.06
Nodes (44): COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES, Reveal() (+36 more)

### Community 35 - "admin-auth.service.ts"
Cohesion: 0.10
Nodes (40): getSecurityEnvironment(), throwSecurityEnvError(), ADMIN_PASSWORD_POLICY, getDeviceFingerprint(), createAdmin(), phones, request(), COMMON_PASSWORDS (+32 more)

### Community 36 - "admin-providers.service.ts"
Cohesion: 0.14
Nodes (32): AdminProviderDetailRecord, AdminProviderListRecord, AdminProviderServiceRecord, decimalToString(), mapAdminProviderDetail(), mapAdminProviderListItem(), mapAdminProviderService(), toString() (+24 more)

### Community 37 - "searchable-select.tsx"
Cohesion: 0.24
Nodes (10): normalizeSearchText(), SearchableSelect(), SearchableSelectOption, SearchableSelectProps, Popover(), PopoverContent(), PopoverDescription(), PopoverHeader() (+2 more)

### Community 38 - "phase06.integration.test.ts"
Cohesion: 0.18
Nodes (16): runNamedJob(), runPaymentDeadLetterDrainJob(), runPaymentReconciliationJob(), runSubscriptionExpirationJob(), drainPaymentCallbackDeadLetters(), createUser(), phones, cancelPendingSubscription() (+8 more)

### Community 39 - "contracts/index.ts"
Cohesion: 0.07
Nodes (46): zod, ADMIN_SESSION_POLICY, API_ROOTS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, SESSION_COOKIES, ApiErrorEnvelopeSchema, ApiErrorSchema (+38 more)

### Community 40 - "admin-subscriptions.service.ts"
Cohesion: 0.15
Nodes (31): mapAdminPaymentDetail(), mapAdminPaymentSummary(), mapAdminProviderSubscription(), mapAdminRefund(), mapAdminSubscriptionPlan(), money(), countActiveSubscriptionsForPlan(), createSubscriptionPlan() (+23 more)

### Community 41 - "admin-panel/index.ts"
Cohesion: 0.07
Nodes (61): recharts, AdminCan(), AdminCanProps, AdminForbidden(), AdminForbiddenProps, AdminDashboardPage(), AdminRequestStatusChart, DashboardSkeleton() (+53 more)

### Community 42 - "cn"
Cohesion: 0.07
Nodes (41): SearchResultsRoutePage(), AdminKpiCardProps, TONE_STYLES, AdminQuickLinks(), LINKS, AdminFilterChips(), AdminFilterChipsProps, AdminPageHeaderProps (+33 more)

### Community 43 - "exports.service.ts"
Cohesion: 0.10
Nodes (36): GET, runtime, runExportCleanupJob(), escapeCsvCell(), toCsv(), listPaymentsForExport(), listReportsForExport(), resolveRange() (+28 more)

### Community 44 - "scripts"
Cohesion: 0.06
Nodes (32): scripts, build, check:admin-list-perf, check:admin-load-budget, check:api-boundaries, check:api-contracts, check:frontend-security, check:no-mock-imports (+24 more)

### Community 45 - "reports.service.ts"
Cohesion: 0.18
Nodes (32): countActiveApprovedProviders(), countActiveUsersInRange(), countNotificationDeliveries(), countPaidPayments(), countRequestsCreatedByStatus(), findConsumerTopLand(), findConsumerTopService(), findOwnedLandIdByPublicId() (+24 more)

### Community 46 - "admins/v1/providers/[providerId]/route.ts"
Cohesion: 0.10
Nodes (22): PATCH, runtime, POST, runtime, POST, runtime, GET, PATCH (+14 more)

### Community 47 - "runner.ts"
Cohesion: 0.10
Nodes (30): names, requested, runRbacExpiryJob(), runRbacExpiryJobSafe(), JOB_NAMES, JobName, JobRunRecord, JobRunResult (+22 more)

### Community 48 - "prisma.ts"
Cohesion: 0.11
Nodes (27): @prisma/adapter-mariadb, databaseEnvironment, globalForPrisma, adminPhones, phones, AdminModerationActionRecord, AdminUserDetailRecord, AdminUserListRecord (+19 more)

### Community 49 - "lands.service.ts"
Cohesion: 0.27
Nodes (14): decimalToString(), mapLand(), countLandServiceRequests(), createUserLand(), findUserLandByPublicId(), landSelect, listUserLands(), softDeleteUserLand() (+6 more)

### Community 50 - "idempotency.ts"
Cohesion: 0.16
Nodes (13): getAppIdempotencyService(), globalIdempotency, IdempotencyScope, IdempotencyService, IdempotencyStore, StoredIdempotencyResult, scope, MemoryIdempotencyStore (+5 more)

### Community 51 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, argon2, class-variance-authority, clsx, dotenv, farsi-tools, @fontsource-variable/vazirmatn, framer-motion (+20 more)

### Community 52 - "app-provider.tsx"
Cohesion: 0.27
Nodes (8): AppProvider(), AppProviderProps, isAdminPath(), AppSplash(), POLLEN, EASE_GROW, SproutMark(), SproutMarkProps

### Community 53 - "[key]/route.ts"
Cohesion: 0.27
Nodes (8): PUT, runtime, settingParamsFromPath(), AdminSettingParamsSchema, AdminSettingsQuerySchema, AdminSettingUpsertSchema, SettingValueTypeSchema, SystemSettingValueType

### Community 54 - "app-profile.service.ts"
Cohesion: 0.05
Nodes (40): GET, runtime, ConsoleSmsQueue, ObjectStorage, PaymentInitiation, PaymentProvider, SmsMessage, SmsProvider (+32 more)

### Community 55 - "package.json"
Cohesion: 0.07
Nodes (27): eslintConfig, name, private, version, argon2, clsx, dotenv, eslint (+19 more)

### Community 56 - "isApiClientError"
Cohesion: 0.06
Nodes (63): AdminConsoleLayout(), AdminChangePasswordPage(), onSubmit(), AdminMeForm(), onSave(), AdminMePage(), AdminMySessionsPage(), AdminLoginPage() (+55 more)

### Community 57 - "admin-user-detail-page.tsx"
Cohesion: 0.07
Nodes (36): AdminUserDetailRoutePage(), PageProps, AdminCursorPaginationProps, AdminUserDetailPage(), AdminUserDetailPageProps, MODERATION_OPTIONS, CursorListResult, useAdminCursorQuery() (+28 more)

### Community 58 - "session.service.ts"
Cohesion: 0.12
Nodes (23): findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup, UserSessionLookup, AdminAuthContext, findActiveAdminSessionForToken() (+15 more)

### Community 59 - "validators/index.ts"
Cohesion: 0.16
Nodes (16): LandFormProps, authFormSchema, AuthFormValues, otpSchema, phoneSchema, geoLocationSchema, landFormSchema, LandFormValues (+8 more)

### Community 60 - "ulid.ts"
Cohesion: 0.13
Nodes (23): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+15 more)

### Community 61 - "validate-api-contracts.mjs"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 62 - "@playwright/test"
Cohesion: 0.25
Nodes (3): adminPassword, adminPhone, @playwright/test

### Community 63 - "default-rate-limiter.ts"
Cohesion: 0.19
Nodes (12): createRateLimiter(), getAppRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy (+4 more)

### Community 64 - "Keshavarz Agricultural Services Platform (Mock)"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "admin-jobs-page.tsx"
Cohesion: 0.09
Nodes (33): Page(), AdminColumnVisibilityControls(), AdminColumnVisibilityMenuProps, AdminDataTableProps, AdminTableDensity, AdminJobsPage(), onReplay(), onRunJobs() (+25 more)

### Community 66 - "use-initialize-app.ts"
Cohesion: 0.48
Nodes (5): clearLegacyDomainStorage(), redirectToAppAuth(), useInitializeApp(), onAppUnauthorized(), LEGACY_APP_STORAGE_KEYS

### Community 67 - "admin-audit.repository.ts"
Cohesion: 0.53
Nodes (3): redactAuditValue(), auditLogSelect, insertAdminAuditLog()

### Community 68 - "map-picker.tsx"
Cohesion: 0.06
Nodes (48): @neshan-maps-platform/maplibre-sdk, WorkAreaPanelProps, inlineCenter(), LocationLabel(), MapPicker(), MapPickerProps, PickerHint(), useCurrentPosition() (+40 more)

### Community 69 - "app-settings.ts"
Cohesion: 0.40
Nodes (3): PublicSetting, PublicSettingSchema, SETTING_VALUE_TYPES

### Community 70 - "generate-openapi.mjs"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "utils/format.ts"
Cohesion: 0.04
Nodes (91): framer-motion, EditLandPage(), NewLandPage(), ConsumerLandsPage(), SortKey, SORTS, ConsumerProviderProfileContent(), ConsumerProviderProfilePage() (+83 more)

### Community 72 - "types/index.ts"
Cohesion: 0.05
Nodes (67): HomePage(), HomePageContent(), Reveal(), AdviceTile(), LandWeatherCard(), LandWeatherCardProps, AdviceRow(), FieldWeatherCard() (+59 more)

### Community 73 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 74 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 75 - "clock.ts"
Cohesion: 0.20
Nodes (17): systemClock, runNotificationDeliveriesJob(), runNotificationJobs(), backoffMilliseconds(), deliverChannel(), isReadyForRetry(), listNotificationDeadLetters(), replayNotificationDeadLetter() (+9 more)

### Community 76 - "dashboard.service.ts"
Cohesion: 0.20
Nodes (18): cache, CacheEntry, getDashboardCache(), pruneExpired(), setDashboardCache(), countActiveUsersInRange(), countNotificationDeliveryFailures(), countPaymentFailures() (+10 more)

### Community 80 - "use-price-input.ts"
Cohesion: 0.33
Nodes (9): persian-tools, formatToPersianWords(), formatWithCommas(), parseToRawNumber(), sanitizeInput(), toEnglishDigits(), toPersianDigits(), usePriceInput() (+1 more)

### Community 81 - "ref_node_path"
Cohesion: 0.07
Nodes (24): sharp, bannedPatterns, collectTs(), failures, listsRoot, projectRoot, requiredListHints, banned (+16 more)

### Community 82 - "catalog.service.ts"
Cohesion: 0.27
Nodes (13): cache, CacheEntry, getCatalogCache(), setCatalogCache(), mapCategory(), mapService(), findActiveCategoryBySlug(), findActiveServiceBySlug() (+5 more)

### Community 84 - "admin-notifications-page.tsx"
Cohesion: 0.19
Nodes (14): onConfirmSend(), isNotificationType(), parseIdList(), ADMIN_NOTIFICATION_TYPES, AdminNotification, AdminNotificationChannel, AdminNotificationDeliverySchema, AdminNotificationSchema (+6 more)

### Community 85 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, sharp, tailwindcss, @tailwindcss/postcss (+6 more)

### Community 87 - "public/settings/route.ts"
Cohesion: 0.26
Nodes (6): GET, runtime, listPublicSystemSettings(), publicSettingSelect, getPublicSettings(), mapPublicSetting()

### Community 88 - "seed-worker.mts"
Cohesion: 0.28
Nodes (10): args, [command, ...rest], hashToken(), installAppSession(), makeOpaqueToken(), makePublicId(), seedAdmin(), seedApp() (+2 more)

### Community 89 - "form.tsx"
Cohesion: 0.21
Nodes (11): react-hook-form, FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue (+3 more)

### Community 90 - "manifest.json"
Cohesion: 0.17
Nodes (11): background_color, description, dir, display, icons, lang, name, orientation (+3 more)

### Community 91 - "validate-api-boundaries.mjs"
Cohesion: 0.18
Nodes (9): collectFiles(), fail(), graph, projectRoot, sourceRoot, supportedExtensions, visit(), visited (+1 more)

### Community 92 - "health/route.ts"
Cohesion: 0.29
Nodes (8): GET, runtime, HealthResponse, HealthResponseSchema, mapHealthResponse(), checkDatabaseConnection(), getApiHealth(), HealthResult

### Community 96 - "validate-no-mock-imports.mjs"
Cohesion: 0.25
Nodes (6): bannedRoots, collectFiles(), mockDir, projectRoot, supportedExtensions, violations

### Community 99 - "validate-secret-scan.mjs"
Cohesion: 0.22
Nodes (8): allowlist, collectFiles(), patterns, projectRoot, scanRoots, skipDirectories, supportedExtensions, violations

### Community 102 - "admin/constants.ts"
Cohesion: 0.33
Nodes (5): ADMIN_DEFAULT_LIMIT, ADMIN_PAGE_LIMITS, ADMIN_SIDEBAR_COLLAPSED_WIDTH, ADMIN_SIDEBAR_WIDTH, ADMIN_STORAGE_KEYS

### Community 103 - "PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)"
Cohesion: 0.50
Nodes (4): Apple Touch Icon (180px, green goblet-with-hat logo), PWA Icon 192px (green goblet-with-hat logo), PWA Icon 512px (green goblet-with-hat logo), PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)

### Community 108 - "File Document Icon (Next.js starter)"
Cohesion: 0.67
Nodes (3): File Document Icon (Next.js starter), Globe Icon (Next.js starter), Browser Window Icon (Next.js starter)

## Ambiguous Edges - Review These
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` → `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **28 isolated node(s):** `@hookform/resolvers`, `@prisma/client`, `farsi-tools`, `mariadb`, `next-themes` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 953 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `apiSuccess` to `react`, `requireAdminSession`, `AdminPageHeader`, `Button`, `profile/page.tsx`, `admin-command-palette.tsx`, `ops.service.ts`, `lucide-react`, `app/layout.tsx`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `security/index.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `parseWithSchema`, `app-requests.ts`, `admin-admin-detail-page.tsx`, `vitest`, `toPersianDigits`, `getAllowedOrigins`, `dock-nav.tsx`, `users/reports/page.tsx`, `admin-auth.service.ts`, `admin-panel/index.ts`, `cn`, `exports.service.ts`, `admins/v1/providers/[providerId]/route.ts`, `app-provider.tsx`, `[key]/route.ts`, `app-profile.service.ts`, `package.json`, `isApiClientError`, `admin-user-detail-page.tsx`, `session.service.ts`, `map-picker.tsx`, `utils/format.ts`, `types/index.ts`, `ref_node_path`, `public/settings/route.ts`, `health/route.ts`, `admins/layout.tsx`, `next.config.ts`?**
  _High betweenness centrality (0.409) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `farsi-tools` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06321334503950835 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `contracts/index.ts` to `react`, `requireAdminSession`, `apiSuccess`, `AdminPageHeader`, `Button`, `profile/page.tsx`, `ops.service.ts`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `security/index.ts`, `parseWithSchema`, `app-requests.ts`, `admin-admin-detail-page.tsx`, `toPersianDigits`, `notification.service.ts`, `getAllowedOrigins`, `users/reports/page.tsx`, `admin-panel/index.ts`, `exports.service.ts`, `admins/v1/providers/[providerId]/route.ts`, `runner.ts`, `[key]/route.ts`, `package.json`, `isApiClientError`, `admin-user-detail-page.tsx`, `validators/index.ts`, `admin-jobs-page.tsx`, `app-settings.ts`, `utils/format.ts`, `admin-notifications-page.tsx`, `health/route.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `requireAdminSession` be split into smaller, more focused modules?**
  _Cohesion score 0.03499153430621624 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `ApiError` to `requireAdminSession`, `apiSuccess`, `ops.service.ts`, `request.service.ts`, `search.service.ts`, `security/index.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `provider.service.ts`, `parseWithSchema`, `admin-management.service.ts`, `vitest`, `notification.service.ts`, `getAllowedOrigins`, `admin-catalog.service.ts`, `admin-auth.service.ts`, `admin-providers.service.ts`, `phase06.integration.test.ts`, `admin-subscriptions.service.ts`, `exports.service.ts`, `reports.service.ts`, `runner.ts`, `prisma.ts`, `lands.service.ts`, `idempotency.ts`, `app-profile.service.ts`, `session.service.ts`, `default-rate-limiter.ts`, `clock.ts`, `catalog.service.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._