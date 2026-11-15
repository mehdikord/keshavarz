# Graph Report - keshavarz  (2026-11-10)

## Corpus Check
- 657 files · ~212,965 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 8, .example 1, .toml 1)

## Summary
- 3693 nodes · 13950 edges · 112 communities (101 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22a362c5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Skeleton
- requireAdminSession
- apiSuccess
- lucide-react
- isApiClientError
- useAuthStore
- cn
- [deliveryId]/replay/route.ts
- ApiError
- profile/page.tsx
- search/page.tsx
- providers/services/page.tsx
- admin-provider-detail-page.tsx
- subscription/page.tsx
- search.service.ts
- admin-exports-page.tsx
- next
- app-auth.service.ts
- subscriptions.service.ts
- provider.service.ts
- shared/index.ts
- app-requests.ts
- app-profile.service.ts
- admin-management.service.ts
- admin-admin-detail-page.tsx
- ops.service.ts
- users/home/page.tsx
- notification.service.ts
- jalali.ts
- parseWithSchema
- users/requests/[id]/page.tsx
- search-results-content.tsx
- admin-catalog.service.ts
- db.ts
- providers/reports/page.tsx
- admin-auth.service.ts
- admin-providers.service.ts
- ref_node_path
- admin-reports-financial-page.tsx
- contracts/index.ts
- admin-subscriptions.service.ts
- admin-dashboard-page.tsx
- toPersianDigits
- reports.service.ts
- scripts
- admin-quick-links.tsx
- app-provider.tsx
- prisma.ts
- admin-users.service.ts
- lands.service.ts
- idempotency.ts
- dependencies
- LocalObjectStorage
- errors/index.ts
- integrations/index.ts
- package.json
- react
- admin-user-detail-page.tsx
- admin-management.mapper.ts
- validators/index.ts
- seed.ts
- validate-api-contracts.mjs
- admin-auth.integration.test.ts
- default-rate-limiter.ts
- Keshavarz Agricultural Services Platform (Mock)
- admin-jobs-page.tsx
- admins/v1/providers/[providerId]/route.ts
- types/index.ts
- parsimap-map.tsx
- app/layout.tsx
- generate-openapi.mjs
- PageContainer
- field-weather-card.tsx
- compilerOptions
- components.json
- app/page.tsx
- dashboard.service.ts
- validate-prisma-foundation.mjs
- admin-auth.password.ts
- weather-widget.tsx
- @playwright/test
- validate-frontend-security.mjs
- phase05.integration.test.ts
- moderation-actions/route.ts
- envelope.ts
- devDependencies
- geo-data.ts
- map-picker.tsx
- seed-worker.mts
- form.tsx
- manifest.json
- validate-api-boundaries.mjs
- health/route.ts
- [key]/route.ts
- haversine.ts
- setManagedAdminStatus
- admins/v1/health/authenticated/route.ts
- validate-secret-scan.mjs
- validate-no-mock-imports.mjs
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
1. `cn()` - 267 edges
2. `apiSuccess()` - 262 edges
3. `next` - 219 edges
4. `ApiError` - 184 edges
5. `requireAdminSession()` - 144 edges
6. `getAllowedOrigins()` - 143 edges
7. `assertMutationProtection()` - 139 edges
8. `isApiClientError()` - 132 edges
9. `toPersianDigits()` - 131 edges
10. `react` - 130 edges

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

## Communities (112 total, 11 thin omitted)

### Community 0 - "Skeleton"
Cohesion: 0.09
Nodes (28): AdminAdminsRoutePage(), Fallback(), Fallback(), Page(), AdminCategoriesRoutePage(), CatalogRouteFallback(), AdminServicesRoutePage(), CatalogRouteFallback() (+20 more)

### Community 1 - "requireAdminSession"
Cohesion: 0.03
Nodes (134): PUT, runtime, POST, runtime, PUT, runtime, adminIdFromPath(), GET (+126 more)

### Community 2 - "apiSuccess"
Cohesion: 0.04
Nodes (106): POST, GET, GET, runtime, GET, runtime, GET, runtime (+98 more)

### Community 3 - "lucide-react"
Cohesion: 0.15
Nodes (63): lucide-react, AdminDemoPage(), AdminAuditLogsListPage(), AdminCan(), AdminCanProps, AdminForbidden(), AdminCategoriesPage(), AdminServicesPage() (+55 more)

### Community 4 - "isApiClientError"
Cohesion: 0.07
Nodes (81): AdminPaymentDetailRoutePage(), PageProps, AdminRolesRoutePage(), Page(), AdminCategoryFormDialog(), onSubmit(), EMPTY, toFormValues() (+73 more)

### Community 5 - "useAuthStore"
Cohesion: 0.09
Nodes (35): AuthPage(), AuthPageContent(), STAGE_COPY, Crop(), FarmScene(), FarmStage, SPROUTS, Tractor() (+27 more)

### Community 6 - "cn"
Cohesion: 0.05
Nodes (84): radix-ui, AdminColumnVisibilityMenuProps, AdminDataTableProps, AdminFilterChips(), AdminFilterChipsProps, ADMIN_NAV_GROUPS, AdminNavGroup, AdminNavItem (+76 more)

### Community 7 - "[deliveryId]/replay/route.ts"
Cohesion: 0.19
Nodes (10): POST, ReplayBodySchema, runtime, POST, ReplayBodySchema, runtime, DeadLetterParamsSchema, NotificationDeadLetterParamsSchema (+2 more)

### Community 8 - "ApiError"
Cohesion: 0.09
Nodes (66): runInTransaction(), TransactionClient, ApiError, canRevealContact(), decimal(), mapAdminRequestDetail(), mapAdminRequestHistories(), mapAdminRequestSummary() (+58 more)

### Community 9 - "profile/page.tsx"
Cohesion: 0.07
Nodes (52): PLATFORM_LABEL, ProfilePage(), Reveal(), Section(), AdminFilterDrawerProps, CancelForm(), CancelRequestSheet(), CancelRequestSheetProps (+44 more)

### Community 10 - "search/page.tsx"
Cohesion: 0.06
Nodes (47): ConsumerSearchContent(), ConsumerSearchPage(), FIELD_STEP, StepKey, LandCardProps, LandFormProps, LandPicker(), LandPickerProps (+39 more)

### Community 11 - "providers/services/page.tsx"
Cohesion: 0.06
Nodes (57): persian-tools, clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage() (+49 more)

### Community 12 - "admin-provider-detail-page.tsx"
Cohesion: 0.05
Nodes (64): AdminCatalogReorderRoutePage(), AdminProviderDetailRoutePage(), PageProps, AdminServiceRequestDetailRoutePage(), PageProps, AdminCatalogReorderPage(), moveItem(), AdminCategoryFormDialogProps (+56 more)

### Community 13 - "subscription/page.tsx"
Cohesion: 0.07
Nodes (50): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge() (+42 more)

### Community 14 - "search.service.ts"
Cohesion: 0.08
Nodes (40): createPublicId(), encodeBase32(), createUser(), createUser(), cleanupAll(), cleanupUsers(), createLand(), createProvider() (+32 more)

### Community 15 - "admin-exports-page.tsx"
Cohesion: 0.09
Nodes (30): sonner, Fallback(), Page(), AdminExportsPage(), onCreate(), onLookup(), pushRecentId(), readRecentIds() (+22 more)

### Community 16 - "next"
Cohesion: 0.05
Nodes (84): next, POST, runtime, runtime, DELETE, runtime, DELETE, runtime (+76 more)

### Community 17 - "app-auth.service.ts"
Cohesion: 0.06
Nodes (64): argon2, findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup, UserSessionLookup, findActiveAdminSessionForToken() (+56 more)

### Community 18 - "subscriptions.service.ts"
Cohesion: 0.08
Nodes (59): GET, runtime, mapPrismaError(), getAppIdempotencyService(), createMockPaymentProvider(), createUser(), phones, mapActiveSubscription() (+51 more)

### Community 19 - "provider.service.ts"
Cohesion: 0.10
Nodes (48): decimalToString(), mapProviderGalleryImage(), mapProviderProfile(), mapProviderService(), mapPublicProviderProfile(), mapPublicProviderService(), countActiveProviderServices(), countProviderGalleryImages() (+40 more)

### Community 20 - "shared/index.ts"
Cohesion: 0.08
Nodes (31): class-variance-authority, ProfileLayout(), ProvidersLayout(), UsersLayout(), SearchResultsRoutePage(), AdminStatusBadgeProps, BadgeVariant, STATUS_TONES (+23 more)

### Community 21 - "app-requests.ts"
Cohesion: 0.07
Nodes (50): landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState, ProviderRequestsContent() (+42 more)

### Community 22 - "app-profile.service.ts"
Cohesion: 0.15
Nodes (21): GET, runtime, getCurrentUserProfile(), profileSelect, replaceCurrentUserImage(), updateCurrentUserProfile(), deleteCurrentUserImage(), hasValidImageSignature() (+13 more)

### Community 23 - "admin-management.service.ts"
Cohesion: 0.13
Nodes (37): mapAdminSummary(), mapRole(), adminDetailSelect, adminSummarySelect, createAdmin(), createRole(), findAdminByPublicId(), findAdminDetailByPublicId() (+29 more)

### Community 24 - "admin-admin-detail-page.tsx"
Cohesion: 0.09
Nodes (37): AdminAdminDetailRoutePage(), PageProps, AdminPermissionsRoutePage(), AdminRoleDetailRoutePage(), PageProps, AdminForbiddenProps, AdminAdminDetailPage(), AdminAdminDetailPageProps (+29 more)

### Community 25 - "ops.service.ts"
Cohesion: 0.07
Nodes (47): ApiRequestContext, ApiRouteHandler, normalizeError(), runRbacExpiryJob(), runRbacExpiryJobSafe(), listNotificationDeadLetters(), getOpsMetricsForAdmin(), listNotificationDeadLettersForAdmin() (+39 more)

### Community 26 - "users/home/page.tsx"
Cohesion: 0.08
Nodes (44): ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor(), Reveal() (+36 more)

### Community 27 - "notification.service.ts"
Cohesion: 0.07
Nodes (56): ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), backoffMilliseconds(), deliverChannel(), isReadyForRetry(), replayNotificationDeadLetter(), runNotificationDeliveryJob() (+48 more)

### Community 28 - "jalali.ts"
Cohesion: 0.13
Nodes (28): DatePickerStep(), DatePickerStepProps, isoForOffset(), MAX_SEARCH_DATES, QUICK_DAYS, DayCellData, PersianCalendar, PersianCalendarProps (+20 more)

### Community 29 - "parseWithSchema"
Cohesion: 0.06
Nodes (49): POST, runtime, POST, runtime, POST, runtime, POST, runtime (+41 more)

### Community 30 - "users/requests/[id]/page.tsx"
Cohesion: 0.07
Nodes (39): ConsumerRequestDetailContent(), ConsumerRequestDetailPage(), FULL, landLocation(), PROVIDER_STATUS, Reveal(), Section(), STAMP (+31 more)

### Community 31 - "search-results-content.tsx"
Cohesion: 0.11
Nodes (26): framer-motion, CARD_STATE, describeSkipped(), LIST_ITEM_SPRING, OPEN_STATUSES, RequestBanner(), SearchResultsPage(), SearchSummary() (+18 more)

### Community 32 - "admin-catalog.service.ts"
Cohesion: 0.12
Nodes (37): AdminCategoryRecord, AdminServiceRecord, mapAdminCategory(), mapAdminService(), categorySelect, countNonDeletedServicesInCategory(), countProviderServicesForCategory(), countProviderServicesForService() (+29 more)

### Community 33 - "db.ts"
Cohesion: 0.14
Nodes (22): createSearch(), getData(), idempotencyKey(), listCandidates(), mutation(), PROVIDER_PHONES, sendTo(), tomorrow() (+14 more)

### Community 34 - "providers/reports/page.tsx"
Cohesion: 0.08
Nodes (33): COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES, Reveal() (+25 more)

### Community 35 - "admin-auth.service.ts"
Cohesion: 0.17
Nodes (24): createAdminSession(), findAdminByPhoneForLogin(), getAdminPasswordMaterial(), getCurrentAdminProfile(), lockAdminForAuth(), lockAdminSessionForRotation(), registerFailedAdminLogin(), registerSuccessfulAdminLogin() (+16 more)

### Community 36 - "admin-providers.service.ts"
Cohesion: 0.14
Nodes (32): AdminProviderDetailRecord, AdminProviderListRecord, AdminProviderServiceRecord, decimalToString(), mapAdminProviderDetail(), mapAdminProviderListItem(), mapAdminProviderService(), toString() (+24 more)

### Community 37 - "ref_node_path"
Cohesion: 0.10
Nodes (11): sharp, projectRoot, bannedPatterns, collectTs(), failures, listsRoot, projectRoot, requiredListHints (+3 more)

### Community 38 - "admin-reports-financial-page.tsx"
Cohesion: 0.12
Nodes (27): Fallback(), Page(), AdminKpiCard(), AdminKpiCardProps, TONE_STYLES, AdminKpiGrid(), AdminMonthlyGmvChart(), AdminMonthlyGmvChartProps (+19 more)

### Community 39 - "contracts/index.ts"
Cohesion: 0.06
Nodes (62): zod, POST, runtime, POST, runtime, GET, runtime, POST (+54 more)

### Community 40 - "admin-subscriptions.service.ts"
Cohesion: 0.15
Nodes (31): mapAdminPaymentDetail(), mapAdminPaymentSummary(), mapAdminProviderSubscription(), mapAdminRefund(), mapAdminSubscriptionPlan(), money(), countActiveSubscriptionsForPlan(), createSubscriptionPlan() (+23 more)

### Community 41 - "admin-dashboard-page.tsx"
Cohesion: 0.17
Nodes (21): AdminDashboardRoutePage(), DashboardRouteFallback(), AdminDashboardPage(), AdminRequestStatusChart, DashboardSkeleton(), AdminDashboardToolbar(), AdminDashboardToolbarProps, PRESETS (+13 more)

### Community 42 - "toPersianDigits"
Cohesion: 0.16
Nodes (14): ITEMS, ReadinessCardProps, ReadinessItem, ReadinessKey, MiniStat(), StatGrid(), StatGridProps, DistanceDisplay() (+6 more)

### Community 43 - "reports.service.ts"
Cohesion: 0.07
Nodes (66): GET, runtime, escapeCsvCell(), toCsv(), listPaymentsForExport(), listReportsForExport(), resolveRange(), EXPORT_DOWNLOAD_TTL_SECONDS (+58 more)

### Community 44 - "scripts"
Cohesion: 0.06
Nodes (32): scripts, build, check:admin-list-perf, check:admin-load-budget, check:api-boundaries, check:api-contracts, check:frontend-security, check:no-mock-imports (+24 more)

### Community 45 - "admin-quick-links.tsx"
Cohesion: 0.15
Nodes (15): recharts, AdminKpiGridProps, AdminQuickLinksProps, LINKS, QuickLinkItem, AdminRequestStatusChart(), AdminRequestStatusChartProps, STATUS_COLORS (+7 more)

### Community 46 - "app-provider.tsx"
Cohesion: 0.18
Nodes (13): AppProvider(), AppProviderProps, isAdminPath(), AppSplash(), POLLEN, EASE_GROW, SproutMark(), SproutMarkProps (+5 more)

### Community 47 - "prisma.ts"
Cohesion: 0.07
Nodes (38): dotenv, vitest, baseUrl, names, requested, GET, runtime, systemClock (+30 more)

### Community 48 - "admin-users.service.ts"
Cohesion: 0.17
Nodes (22): AdminModerationActionRecord, AdminUserDetailRecord, AdminUserListRecord, mapAdminModerationAction(), mapAdminUserDetail(), mapAdminUserListItem(), applyUserModerationAction(), findAdminUserDetailByPublicId() (+14 more)

### Community 49 - "lands.service.ts"
Cohesion: 0.27
Nodes (14): decimalToString(), mapLand(), countLandServiceRequests(), createUserLand(), findUserLandByPublicId(), landSelect, listUserLands(), softDeleteUserLand() (+6 more)

### Community 50 - "idempotency.ts"
Cohesion: 0.16
Nodes (12): globalIdempotency, IdempotencyScope, IdempotencyService, IdempotencyStore, StoredIdempotencyResult, scope, MemoryIdempotencyStore, MemoryRecord (+4 more)

### Community 51 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, argon2, class-variance-authority, clsx, dotenv, farsi-tools, @fontsource-variable/vazirmatn, framer-motion (+20 more)

### Community 52 - "LocalObjectStorage"
Cohesion: 0.20
Nodes (5): HttpObjectStorage, ObjectStorageUnavailableError, LocalObjectStorage, resolveStorage(), resolveGalleryStorage()

### Community 53 - "errors/index.ts"
Cohesion: 0.19
Nodes (13): API_ERROR_CODES, ApiErrorCode, ApiErrorOptions, isRetryablePrismaConflict(), findSystemSetting(), listSystemSettings(), settingSelect, upsertSystemSetting() (+5 more)

### Community 54 - "integrations/index.ts"
Cohesion: 0.13
Nodes (12): ConsoleSmsQueue, ObjectStorage, PaymentInitiation, PaymentProvider, SmsMessage, SmsProvider, SmsQueue, PutResponse (+4 more)

### Community 55 - "package.json"
Cohesion: 0.07
Nodes (25): eslintConfig, name, private, version, clsx, eslint, eslint-config-next, farsi-tools (+17 more)

### Community 56 - "react"
Cohesion: 0.10
Nodes (33): react, AdminConsoleLayout(), AdminChangePasswordPage(), onSubmit(), AdminMeForm(), onSave(), AdminMePage(), AdminLoginPage() (+25 more)

### Community 57 - "admin-user-detail-page.tsx"
Cohesion: 0.16
Nodes (18): AdminUserDetailRoutePage(), PageProps, AdminUserDetailPage(), AdminUserDetailPageProps, MODERATION_OPTIONS, AdminModerationAction, AdminModerationActionSchema, AdminUserDetail (+10 more)

### Community 58 - "admin-management.mapper.ts"
Cohesion: 0.20
Nodes (10): AdminListRecord, AdminOverrideRecord, AdminRoleSummaryRecord, mapAdminDetail(), mapPermission(), mapRoleSummary(), PermissionListRecord, RoleListRecord (+2 more)

### Community 59 - "validators/index.ts"
Cohesion: 0.18
Nodes (15): authFormSchema, AuthFormValues, otpSchema, phoneSchema, geoLocationSchema, landFormSchema, LandFormValues, CancelReasonFormValues (+7 more)

### Community 60 - "seed.ts"
Cohesion: 0.18
Nodes (12): catalog, main(), permissionCodes, prisma, seedBootstrapAdmin(), seedCatalog(), seedDir, seedPermissions() (+4 more)

### Community 61 - "validate-api-contracts.mjs"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 62 - "admin-auth.integration.test.ts"
Cohesion: 0.14
Nodes (17): mapCurrentAdmin(), createAdmin(), phones, request(), AdminProfileRecord, mapAdminProfile(), cache, CacheEntry (+9 more)

### Community 63 - "default-rate-limiter.ts"
Cohesion: 0.19
Nodes (12): createRateLimiter(), getAppRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy (+4 more)

### Community 64 - "Keshavarz Agricultural Services Platform (Mock)"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "admin-jobs-page.tsx"
Cohesion: 0.17
Nodes (18): Page(), AdminJobsPage(), onReplay(), onRunJobs(), RUNNABLE_JOBS, Checkbox(), ADMIN_JOB_NAMES, AdminJobName (+10 more)

### Community 66 - "admins/v1/providers/[providerId]/route.ts"
Cohesion: 0.11
Nodes (21): PATCH, runtime, POST, runtime, POST, runtime, GET, PATCH (+13 more)

### Community 67 - "types/index.ts"
Cohesion: 0.15
Nodes (16): WorkAreaPanelProps, MapPickerProps, ParsimapMapProps, GeoLocation, Notification, NotificationType, OfferedService, ProviderProfile (+8 more)

### Community 68 - "parsimap-map.tsx"
Cohesion: 0.18
Nodes (15): LAYER_ICONS, Leaflet, DEFAULT_PARSIMAP_LAYER, fallbackLayer(), isSameLocation(), PARSIMAP_LAYERS, PARSIMAP_MAP_TOKEN, PARSIMAP_MAX_ZOOM (+7 more)

### Community 69 - "app/layout.tsx"
Cohesion: 0.18
Nodes (12): @fontsource-variable/vazirmatn, metadata, RootLayout(), viewport, AppShell(), MobileShell(), MobileShellProps, StatusBarMock() (+4 more)

### Community 70 - "generate-openapi.mjs"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "PageContainer"
Cohesion: 0.07
Nodes (49): zustand, EditLandPage(), NewLandPage(), ConsumerLandsPage(), SortKey, SORTS, ConsumerProviderProfileContent(), ConsumerProviderProfilePage() (+41 more)

### Community 72 - "field-weather-card.tsx"
Cohesion: 0.17
Nodes (20): AdviceTile(), LandWeatherCard(), LandWeatherCardProps, AdviceRow(), FieldWeatherCard(), FieldWeatherCardProps, formatAstroTime(), formatWeekday() (+12 more)

### Community 73 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 74 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 75 - "app/page.tsx"
Cohesion: 0.18
Nodes (15): HomePage(), HomePageContent(), Reveal(), PanelCard(), PanelChoice(), PanelConfig, PanelKey, PANELS (+7 more)

### Community 76 - "dashboard.service.ts"
Cohesion: 0.22
Nodes (16): cache, CacheEntry, getDashboardCache(), setDashboardCache(), countActiveUsersInRange(), countNotificationDeliveryFailures(), countPaymentFailures(), countProviders() (+8 more)

### Community 77 - "validate-prisma-foundation.mjs"
Cohesion: 0.20
Nodes (8): envExamplePath, migrationPath, migrationTables, packageJson, packagePath, projectRoot, referencePath, schemaPath

### Community 78 - "admin-auth.password.ts"
Cohesion: 0.31
Nodes (7): ADMIN_PASSWORD_POLICY, assertAdminPasswordPolicy(), COMMON_PASSWORDS, nextAdminLockoutSeconds(), revokeAllAdminSessions(), resetAdminPassword(), resetManagedAdminPassword()

### Community 79 - "weather-widget.tsx"
Cohesion: 0.23
Nodes (12): formatForecastDate(), MetricPill(), WeatherSkeleton(), WeatherWidget(), loadInitialWeather(), WeatherWidgetProps, fetchWeather(), getWeatherIconUrl() (+4 more)

### Community 80 - "@playwright/test"
Cohesion: 0.25
Nodes (3): adminPassword, adminPhone, @playwright/test

### Community 81 - "validate-frontend-security.mjs"
Cohesion: 0.29
Nodes (6): banned, collectFiles(), projectRoot, scanRoots, supportedExtensions, violations

### Community 82 - "phase05.integration.test.ts"
Cohesion: 0.25
Nodes (14): cache, CacheEntry, getCatalogCache(), setCatalogCache(), mapCategory(), mapService(), findActiveCategoryBySlug(), findActiveServiceBySlug() (+6 more)

### Community 83 - "moderation-actions/route.ts"
Cohesion: 0.32
Nodes (7): GET, POST, runtime, userIdFromPath(), AdminUserModerationActionSchema, AdminUserModerationActionsQuerySchema, AdminUserParamsSchema

### Community 84 - "envelope.ts"
Cohesion: 0.06
Nodes (47): Page(), AdminAuditLogDetailPage(), JsonBlock(), onConfirmSend(), isNotificationType(), parseIdList(), AdminCursorPaginationProps, CursorListResult (+39 more)

### Community 85 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, sharp, tailwindcss, @tailwindcss/postcss (+7 more)

### Community 86 - "geo-data.ts"
Cohesion: 0.30
Nodes (12): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+4 more)

### Community 87 - "map-picker.tsx"
Cohesion: 0.24
Nodes (12): leaflet, inlineCenter(), LocationLabel(), MapPicker(), PickerHint(), useCurrentPosition(), MapControlButton(), ParsimapMap() (+4 more)

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

### Community 93 - "[key]/route.ts"
Cohesion: 0.21
Nodes (10): PUT, runtime, settingParamsFromPath(), GET, runtime, AdminSettingParamsSchema, AdminSettingsQuerySchema, AdminSettingUpsertSchema (+2 more)

### Community 95 - "setManagedAdminStatus"
Cohesion: 0.52
Nodes (5): countActiveSuperAdmins(), findAdminStatusTarget(), setManagedAdminStatus(), assertNotLastSuperAdminRemoval(), assertNotSelfDeactivation()

### Community 96 - "admins/v1/health/authenticated/route.ts"
Cohesion: 0.29
Nodes (7): GET, runtime, GET, runtime, AuthCheckResponse, AuthCheckResponseSchema, mapAuthCheckResponse()

### Community 99 - "validate-secret-scan.mjs"
Cohesion: 0.22
Nodes (8): allowlist, collectFiles(), patterns, projectRoot, scanRoots, skipDirectories, supportedExtensions, violations

### Community 100 - "validate-no-mock-imports.mjs"
Cohesion: 0.25
Nodes (6): bannedRoots, collectFiles(), mockDir, projectRoot, supportedExtensions, violations

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
- **29 isolated node(s):** `@hookform/resolvers`, `@prisma/client`, `farsi-tools`, `mariadb`, `next-themes` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 931 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `requireAdminSession`, `apiSuccess`, `lucide-react`, `isApiClientError`, `useAuthStore`, `cn`, `[deliveryId]/replay/route.ts`, `profile/page.tsx`, `search/page.tsx`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `admin-exports-page.tsx`, `app-auth.service.ts`, `subscriptions.service.ts`, `shared/index.ts`, `app-requests.ts`, `app-profile.service.ts`, `admin-admin-detail-page.tsx`, `ops.service.ts`, `users/home/page.tsx`, `parseWithSchema`, `users/requests/[id]/page.tsx`, `search-results-content.tsx`, `providers/reports/page.tsx`, `admin-auth.service.ts`, `ref_node_path`, `admin-reports-financial-page.tsx`, `contracts/index.ts`, `admin-dashboard-page.tsx`, `toPersianDigits`, `reports.service.ts`, `admin-quick-links.tsx`, `app-provider.tsx`, `prisma.ts`, `package.json`, `react`, `admin-user-detail-page.tsx`, `admin-auth.integration.test.ts`, `admins/v1/providers/[providerId]/route.ts`, `app/layout.tsx`, `PageContainer`, `field-weather-card.tsx`, `app/page.tsx`, `weather-widget.tsx`, `moderation-actions/route.ts`, `envelope.ts`, `map-picker.tsx`, `health/route.ts`, `[key]/route.ts`, `admins/v1/health/authenticated/route.ts`, `admins/layout.tsx`, `next.config.ts`?**
  _High betweenness centrality (0.397) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `farsi-tools` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Skeleton` be split into smaller, more focused modules?**
  _Cohesion score 0.09191583610188261 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `contracts/index.ts` to `requireAdminSession`, `apiSuccess`, `lucide-react`, `isApiClientError`, `useAuthStore`, `[deliveryId]/replay/route.ts`, `profile/page.tsx`, `search/page.tsx`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `admin-exports-page.tsx`, `next`, `app-requests.ts`, `admin-admin-detail-page.tsx`, `users/home/page.tsx`, `notification.service.ts`, `parseWithSchema`, `providers/reports/page.tsx`, `admin-reports-financial-page.tsx`, `admin-dashboard-page.tsx`, `package.json`, `react`, `admin-user-detail-page.tsx`, `validators/index.ts`, `admin-jobs-page.tsx`, `admins/v1/providers/[providerId]/route.ts`, `PageContainer`, `envelope.ts`, `health/route.ts`, `[key]/route.ts`, `admins/v1/health/authenticated/route.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `requireAdminSession` be split into smaller, more focused modules?**
  _Cohesion score 0.033486147099860475 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `ApiError` to `requireAdminSession`, `apiSuccess`, `search.service.ts`, `next`, `app-auth.service.ts`, `subscriptions.service.ts`, `provider.service.ts`, `app-profile.service.ts`, `admin-management.service.ts`, `ops.service.ts`, `notification.service.ts`, `parseWithSchema`, `admin-catalog.service.ts`, `admin-auth.service.ts`, `admin-providers.service.ts`, `contracts/index.ts`, `admin-subscriptions.service.ts`, `reports.service.ts`, `admin-users.service.ts`, `lands.service.ts`, `idempotency.ts`, `errors/index.ts`, `default-rate-limiter.ts`, `admin-auth.password.ts`, `phase05.integration.test.ts`, `setManagedAdminStatus`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._