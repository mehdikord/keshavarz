# Graph Report - keshavarz  (2026-11-18)

## Corpus Check
- 678 files · ~454,733 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 8, .example 1, .toml 1)

## Summary
- 3864 nodes · 14532 edges · 111 communities (101 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `016991d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Skeleton
- requireAdminSession
- apiSuccess
- lucide-react
- isApiClientError
- profile/page.tsx
- cn
- parseWithSchema
- ApiError
- app-menu.tsx
- root-chrome.tsx
- providers/services/page.tsx
- admin-provider-detail-page.tsx
- subscription/page.tsx
- admin-user-detail-page.tsx
- admin-client.ts
- next
- app-auth.service.ts
- subscriptions.service.ts
- provider.service.ts
- http/index.ts
- utils/format.ts
- prisma.ts
- admin-management.service.ts
- admin-admin-detail-page.tsx
- admin-management.schemas.ts
- users/home/page.tsx
- notification.service.ts
- jalali.ts
- getAllowedOrigins
- dock-nav.tsx
- admins/v1/me/route.ts
- admin-catalog.service.ts
- db.ts
- providers/reports/page.tsx
- admin-auth.service.ts
- admin-providers.service.ts
- admin-exports-page.tsx
- field-weather-card.tsx
- contracts/index.ts
- admin-subscriptions.service.ts
- admin-dashboard-page.tsx
- toPersianDigits
- reports.service.ts
- scripts
- generate-icons.mjs
- provider.schemas.ts
- runner.ts
- phase10.integration.test.ts
- phase05.integration.test.ts
- idempotency.ts
- dependencies
- app-provider.tsx
- [key]/route.ts
- app-profile.service.ts
- package.json
- react
- admin-notifications-page.tsx
- session.service.ts
- edit/page.tsx
- seed.ts
- validate-api-contracts.mjs
- app/page.tsx
- default-rate-limiter.ts
- Keshavarz Agricultural Services Platform (Mock)
- admin-jobs-page.tsx
- admins/v1/notifications/route.ts
- admin-audit.service.ts
- neshan-map.tsx
- app-requests.ts
- generate-openapi.mjs
- search/page.tsx
- types/index.ts
- compilerOptions
- components.json
- app/layout.tsx
- dashboard.service.ts
- return/page.tsx
- Badge
- map-picker.tsx
- use-price-input.ts
- ref_node_path
- catalog.service.ts
- weather-widget.tsx
- platform.ts
- devDependencies
- billing-history.tsx
- sw.js
- seed-worker.mts
- crypto.ts
- validate-prisma-foundation.mjs
- validate-api-boundaries.mjs
- health/route.ts
- toast-provider.tsx
- pwa-runtime.tsx
- plan-card.tsx
- validate-no-mock-imports.mjs
- haversine.ts
- validate-secret-scan.mjs
- admin/constants.ts
- PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)
- admins/layout.tsx
- Graphify Knowledge Graph (graphify-out)
- otp-test.mjs
- File Document Icon (Next.js starter)
- postcss.config.mjs
- Next.js Wordmark Logo
- persian-tools.d.ts
- Keshavarz App Icon (green gradient plant/leaf)

## God Nodes (most connected - your core abstractions)
1. `cn()` - 273 edges
2. `apiSuccess()` - 266 edges
3. `next` - 228 edges
4. `ApiError` - 191 edges
5. `requireAdminSession()` - 148 edges
6. `getAllowedOrigins()` - 145 edges
7. `assertMutationProtection()` - 141 edges
8. `react` - 139 edges
9. `isApiClientError()` - 137 edges
10. `toPersianDigits()` - 131 edges

## Surprising Connections (you probably didn't know these)
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` --conceptually_related_to--> `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md → src/test/fixtures/README.md
- `allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver)` --conceptually_related_to--> `schema.prisma (31 tables, type-safe mapping)`  [INFERRED]
  pnpm-workspace.yaml → prisma/README.md
- `Prisma/DB commands (validate, generate, migrate deploy, drift, seed)` --conceptually_related_to--> `Server module integration tests (*.integration.test.ts plant own rows)`  [INFERRED]
  prisma/README.md → src/test/fixtures/README.md
- `AdminFilterChipsProps` --references--> `AdminFilterChip`  [EXTRACTED]
  src/components/admin-panel/filters/admin-filter-chips.tsx → src/lib/admin/search-params.ts
- `CardHeader()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/card.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Parsimap map implementation (config, map component, picker)** — readme_parsimap_map, readme_parsimap_config, readme_parsimap_map_component, readme_map_picker [EXTRACTED 1.00]
- **Database schema sources kept in sync (schema.prisma, migration SQL, docs/database.schema)** — prisma_readme_schema_prisma, prisma_readme_initial_migration, prisma_readme_database_schema_doc, prisma_readme_sql_outside_dsl [EXTRACTED 1.00]
- **Next.js create-next-app boilerplate public assets (likely unused leftovers)** — public_file_file_icon, public_globe_globe_icon, public_window_window_icon, public_next_nextjs_logo, public_vercel_vercel_logo [INFERRED 0.95]
- **Same brand logo rendered at multiple PWA/Apple icon sizes** — public_icons_apple_touch_icon_icon, public_icons_icon_192_icon, public_icons_icon_512_icon [INFERRED 0.95]

## Communities (111 total, 10 thin omitted)

### Community 0 - "Skeleton"
Cohesion: 0.07
Nodes (41): AdminAdminsRoutePage(), Fallback(), Fallback(), Page(), AdminCategoriesRoutePage(), CatalogRouteFallback(), AdminServicesRoutePage(), CatalogRouteFallback() (+33 more)

### Community 1 - "requireAdminSession"
Cohesion: 0.05
Nodes (85): GET, POST, runtime, DELETE, GET, runtime, GET, runtime (+77 more)

### Community 2 - "apiSuccess"
Cohesion: 0.04
Nodes (85): GET, runtime, GET, runtime, GET, runtime, GET, runtime (+77 more)

### Community 3 - "lucide-react"
Cohesion: 0.16
Nodes (64): lucide-react, AdminDemoPage(), AdminAuditLogsListPage(), AdminForbidden(), AdminForbiddenProps, AdminCategoriesPage(), AdminServicesPage(), AdminColumnVisibilityControls() (+56 more)

### Community 4 - "isApiClientError"
Cohesion: 0.07
Nodes (79): sonner, AdminPaymentDetailRoutePage(), PageProps, AdminRolesRoutePage(), Page(), AdminCategoryFormDialog(), onSubmit(), AdminCategoryFormDialogProps (+71 more)

### Community 5 - "profile/page.tsx"
Cohesion: 0.06
Nodes (54): AuthPage(), AuthPageContent(), STAGE_COPY, PLATFORM_LABEL, ProfilePage(), Reveal(), Section(), Crop() (+46 more)

### Community 6 - "cn"
Cohesion: 0.04
Nodes (104): react-hook-form, zustand, AdminColumnVisibilityMenuProps, AdminDataTableProps, AdminFilterChips(), AdminFilterChipsProps, ADMIN_ACCOUNT_ITEMS, ADMIN_NAV_GROUPS (+96 more)

### Community 7 - "parseWithSchema"
Cohesion: 0.07
Nodes (47): POST, runtime, POST, runtime, GET, runtime, GET, runtime (+39 more)

### Community 8 - "ApiError"
Cohesion: 0.06
Nodes (94): runInTransaction(), ApiError, cleanupAll(), cleanupUsers(), createLand(), createProvider(), createUser(), futureDate() (+86 more)

### Community 9 - "app-menu.tsx"
Cohesion: 0.08
Nodes (49): AdminFilterDrawerProps, CancelForm(), CancelRequestSheet(), CancelRequestSheetProps, DEFAULT_CANCEL_REASON, REASONS, AppMenu(), currentPanel() (+41 more)

### Community 10 - "root-chrome.tsx"
Cohesion: 0.20
Nodes (11): AppShell(), AppShellProps, HIDDEN_MENU_PATHS, MobileShell(), MobileShellProps, StatusBarMock(), isAdminPath(), RootChrome() (+3 more)

### Community 11 - "providers/services/page.tsx"
Cohesion: 0.06
Nodes (53): clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage(), TabKey (+45 more)

### Community 12 - "admin-provider-detail-page.tsx"
Cohesion: 0.07
Nodes (51): AdminCatalogReorderRoutePage(), AdminProviderDetailRoutePage(), PageProps, AdminServiceRequestDetailRoutePage(), PageProps, AdminCatalogReorderPage(), moveItem(), AdminProviderDetailPage() (+43 more)

### Community 13 - "subscription/page.tsx"
Cohesion: 0.17
Nodes (19): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, MembershipCard(), fetchAppPayments(), AppActiveSubscription, AppActiveSubscriptionSchema (+11 more)

### Community 14 - "admin-user-detail-page.tsx"
Cohesion: 0.09
Nodes (32): AdminUserDetailRoutePage(), PageProps, AdminCommandPalette(), close(), onInputKeyDown(), onKeyDown(), select(), isTypingTarget() (+24 more)

### Community 15 - "admin-client.ts"
Cohesion: 0.11
Nodes (28): ADMIN_API_BASE, AdminApiRequestOptions, adminRequest(), buildUrl(), notifySessionExpired(), parseResponse(), QueryValue, recordAdminActivity() (+20 more)

### Community 16 - "next"
Cohesion: 0.08
Nodes (46): next, POST, runtime, POST, runtime, DELETE, GET, runtime (+38 more)

### Community 17 - "app-auth.service.ts"
Cohesion: 0.09
Nodes (40): APP_SESSION_POLICY, OTP_POLICY, getDeviceFingerprint(), createOtp(), phones, smsQueue, isOtpResendCooldownActive(), isSessionWithinRefreshWindow() (+32 more)

### Community 18 - "subscriptions.service.ts"
Cohesion: 0.08
Nodes (58): GET, runtime, mapPrismaError(), getAppIdempotencyService(), createUser(), phones, mapActiveSubscription(), mapPaymentDetail() (+50 more)

### Community 19 - "provider.service.ts"
Cohesion: 0.10
Nodes (48): decimalToString(), mapProviderGalleryImage(), mapProviderProfile(), mapProviderService(), mapPublicProviderProfile(), mapPublicProviderService(), countActiveProviderServices(), countProviderGalleryImages() (+40 more)

### Community 20 - "http/index.ts"
Cohesion: 0.09
Nodes (26): runtime, POST, runtime, POST, runtime, runtime, runtime, POST (+18 more)

### Community 21 - "utils/format.ts"
Cohesion: 0.08
Nodes (42): landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState, ProviderRequestsContent() (+34 more)

### Community 22 - "prisma.ts"
Cohesion: 0.11
Nodes (18): GET, runtime, databaseEnvironment, globalForPrisma, prisma, TransactionClient, findSystemSetting(), listSystemSettings() (+10 more)

### Community 23 - "admin-management.service.ts"
Cohesion: 0.08
Nodes (61): assertAdminPasswordPolicy(), AdminListRecord, AdminOverrideRecord, AdminRoleSummaryRecord, mapAdminDetail(), mapAdminSummary(), mapPermission(), mapRole() (+53 more)

### Community 24 - "admin-admin-detail-page.tsx"
Cohesion: 0.08
Nodes (46): AdminAdminDetailRoutePage(), PageProps, Page(), AdminPermissionsRoutePage(), AdminRoleDetailRoutePage(), PageProps, AdminAuditLogDetailPage(), JsonBlock() (+38 more)

### Community 25 - "admin-management.schemas.ts"
Cohesion: 0.08
Nodes (28): PUT, runtime, POST, runtime, PUT, runtime, adminIdFromPath(), GET (+20 more)

### Community 26 - "users/home/page.tsx"
Cohesion: 0.11
Nodes (32): ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor(), Reveal() (+24 more)

### Community 27 - "notification.service.ts"
Cohesion: 0.07
Nodes (59): createPublicId(), encodeBase32(), ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), backoffMilliseconds(), deliverChannel(), isReadyForRetry() (+51 more)

### Community 28 - "jalali.ts"
Cohesion: 0.13
Nodes (28): DatePickerStep(), DatePickerStepProps, isoForOffset(), MAX_SEARCH_DATES, QUICK_DAYS, DayCellData, PersianCalendar, PersianCalendarProps (+20 more)

### Community 29 - "getAllowedOrigins"
Cohesion: 0.08
Nodes (43): DELETE, runtime, categoryIdFromPath(), DELETE, PATCH, runtime, GET, POST (+35 more)

### Community 30 - "dock-nav.tsx"
Cohesion: 0.20
Nodes (12): ProfileLayout(), ProvidersLayout(), UsersLayout(), viewport, ConsumerDock(), DockItem, DockNav(), DockNavProps (+4 more)

### Community 31 - "admins/v1/me/route.ts"
Cohesion: 0.08
Nodes (24): POST, runtime, GET, mapCurrentAdmin(), PATCH, runtime, GET, PATCH (+16 more)

### Community 32 - "admin-catalog.service.ts"
Cohesion: 0.14
Nodes (34): AdminCategoryRecord, AdminServiceRecord, mapAdminCategory(), mapAdminService(), categorySelect, countNonDeletedServicesInCategory(), countProviderServicesForCategory(), countProviderServicesForService() (+26 more)

### Community 33 - "db.ts"
Cohesion: 0.10
Nodes (25): adminPassword, adminPhone, createSearch(), getData(), idempotencyKey(), listCandidates(), mutation(), PROVIDER_PHONES (+17 more)

### Community 34 - "providers/reports/page.tsx"
Cohesion: 0.08
Nodes (34): COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES, Reveal() (+26 more)

### Community 35 - "admin-auth.service.ts"
Cohesion: 0.06
Nodes (62): getSecurityEnvironment(), throwSecurityEnvError(), ADMIN_PASSWORD_POLICY, API_ERROR_CODES, ApiErrorCode, ApiErrorOptions, isRetryablePrismaConflict(), createAdmin() (+54 more)

### Community 36 - "admin-providers.service.ts"
Cohesion: 0.14
Nodes (32): AdminProviderDetailRecord, AdminProviderListRecord, AdminProviderServiceRecord, decimalToString(), mapAdminProviderDetail(), mapAdminProviderListItem(), mapAdminProviderService(), toString() (+24 more)

### Community 37 - "admin-exports-page.tsx"
Cohesion: 0.19
Nodes (18): Fallback(), Page(), AdminExportsPage(), onCreate(), onDownload(), onLookup(), pushRecentId(), readRecentIds() (+10 more)

### Community 38 - "field-weather-card.tsx"
Cohesion: 0.21
Nodes (17): AdviceTile(), LandWeatherCard(), LandWeatherCardProps, AdviceRow(), FieldWeatherCardProps, formatAstroTime(), formatWeekday(), Metric() (+9 more)

### Community 39 - "contracts/index.ts"
Cohesion: 0.12
Nodes (31): zod, ADMIN_SESSION_POLICY, API_ROOTS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, SESSION_COOKIES, ApiErrorEnvelopeSchema, ApiErrorSchema (+23 more)

### Community 40 - "admin-subscriptions.service.ts"
Cohesion: 0.15
Nodes (31): mapAdminPaymentDetail(), mapAdminPaymentSummary(), mapAdminProviderSubscription(), mapAdminRefund(), mapAdminSubscriptionPlan(), money(), countActiveSubscriptionsForPlan(), createSubscriptionPlan() (+23 more)

### Community 41 - "admin-dashboard-page.tsx"
Cohesion: 0.07
Nodes (49): recharts, AdminDashboardRoutePage(), DashboardRouteFallback(), AdminDashboardPage(), AdminRequestStatusChart, DashboardSkeleton(), AdminDashboardToolbar(), AdminDashboardToolbarProps (+41 more)

### Community 42 - "toPersianDigits"
Cohesion: 0.05
Nodes (52): ConsumerProviderProfileContent(), ConsumerProviderProfilePage(), isInternalPath(), safeResultsHref(), SearchResultsRoutePage(), CARD_STATE, describeSkipped(), LIST_ITEM_SPRING (+44 more)

### Community 43 - "reports.service.ts"
Cohesion: 0.06
Nodes (71): escapeCsvCell(), toCsv(), listPaymentsForExport(), listReportsForExport(), resolveRange(), CreateExportSchema, EXPORT_DOWNLOAD_TTL_SECONDS, EXPORT_MAX_ROWS (+63 more)

### Community 44 - "scripts"
Cohesion: 0.06
Nodes (32): scripts, build, check:admin-list-perf, check:admin-load-budget, check:api-boundaries, check:api-contracts, check:frontend-security, check:no-mock-imports (+24 more)

### Community 45 - "generate-icons.mjs"
Cohesion: 0.23
Nodes (18): anyIconSvg(), appleIconSvg(), badgeSvg(), C, field(), generate(), ICONS_DIR, maskableIconSvg() (+10 more)

### Community 46 - "provider.schemas.ts"
Cohesion: 0.06
Nodes (35): PublicIdSchema, createCursorPaginationSchema(), AdminAuditLogParamsSchema, AdminAuditLogsQuerySchema, AdminProviderApproveSchema, AdminProviderAvailabilitySchema, AdminProviderServiceParamsSchema, AdminProviderServicesQuerySchema (+27 more)

### Community 47 - "runner.ts"
Cohesion: 0.04
Nodes (78): dotenv, prisma, vitest, baseUrl, names, requested, systemClock, RequestId (+70 more)

### Community 48 - "phase10.integration.test.ts"
Cohesion: 0.14
Nodes (24): adminPhones, phones, AdminModerationActionRecord, AdminUserDetailRecord, AdminUserListRecord, mapAdminModerationAction(), mapAdminUserDetail(), mapAdminUserListItem() (+16 more)

### Community 49 - "phase05.integration.test.ts"
Cohesion: 0.21
Nodes (17): cleanup(), createUser(), phones, decimalToString(), mapLand(), countLandServiceRequests(), createUserLand(), findUserLandByPublicId() (+9 more)

### Community 50 - "idempotency.ts"
Cohesion: 0.16
Nodes (12): globalIdempotency, IdempotencyScope, IdempotencyService, IdempotencyStore, StoredIdempotencyResult, scope, MemoryIdempotencyStore, MemoryRecord (+4 more)

### Community 51 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, argon2, class-variance-authority, clsx, dotenv, farsi-tools, @fontsource-variable/vazirmatn, framer-motion (+20 more)

### Community 52 - "app-provider.tsx"
Cohesion: 0.18
Nodes (13): AppProvider(), AppProviderProps, isAdminPath(), AppSplash(), POLLEN, EASE_GROW, SproutMark(), SproutMarkProps (+5 more)

### Community 53 - "[key]/route.ts"
Cohesion: 0.21
Nodes (10): PUT, runtime, settingParamsFromPath(), GET, runtime, AdminSettingParamsSchema, AdminSettingsQuerySchema, AdminSettingUpsertSchema (+2 more)

### Community 54 - "app-profile.service.ts"
Cohesion: 0.05
Nodes (42): GET, runtime, GET, runtime, ConsoleSmsQueue, ObjectStorage, PaymentInitiation, PaymentProvider (+34 more)

### Community 55 - "package.json"
Cohesion: 0.08
Nodes (24): eslintConfig, name, private, version, clsx, eslint, eslint-config-next, farsi-tools (+16 more)

### Community 56 - "react"
Cohesion: 0.05
Nodes (58): radix-ui, react, AdminConsoleLayout(), AdminChangePasswordPage(), onSubmit(), AdminMeForm(), onSave(), AdminMePage() (+50 more)

### Community 57 - "admin-notifications-page.tsx"
Cohesion: 0.05
Nodes (53): onConfirmSend(), isNotificationType(), parseIdList(), AdminCursorPaginationProps, CursorListResult, useAdminCursorQuery(), UseAdminCursorQueryOptions, ADMIN_DEFAULT_LIMIT (+45 more)

### Community 58 - "session.service.ts"
Cohesion: 0.16
Nodes (19): findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup, UserSessionLookup, AdminAuthContext, findActiveAdminSessionForToken() (+11 more)

### Community 59 - "edit/page.tsx"
Cohesion: 0.10
Nodes (30): EditLandPage(), NewLandPage(), LandForm(), LandFormProps, PageHeader(), PageHeaderProps, Card(), CardContent() (+22 more)

### Community 60 - "seed.ts"
Cohesion: 0.12
Nodes (24): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+16 more)

### Community 61 - "validate-api-contracts.mjs"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 62 - "app/page.tsx"
Cohesion: 0.18
Nodes (15): HomePage(), HomePageContent(), Reveal(), FieldWeatherCard(), WeatherSkeleton(), PanelCard(), PanelChoice(), PanelConfig (+7 more)

### Community 63 - "default-rate-limiter.ts"
Cohesion: 0.19
Nodes (12): createRateLimiter(), getAppRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy (+4 more)

### Community 64 - "Keshavarz Agricultural Services Platform (Mock)"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "admin-jobs-page.tsx"
Cohesion: 0.15
Nodes (21): Page(), AdminJobsPage(), onReplay(), onRunJobs(), RUNNABLE_JOBS, Checkbox(), ADMIN_JOB_LABELS, ADMIN_JOB_NAMES (+13 more)

### Community 66 - "admins/v1/notifications/route.ts"
Cohesion: 0.15
Nodes (13): GET, POST, runtime, POST, runtime, POST, runtime, AdminNotificationsQuerySchema (+5 more)

### Community 67 - "admin-audit.service.ts"
Cohesion: 0.14
Nodes (18): auditLogIdFromPath(), GET, runtime, GET, runtime, POST, ReplayBodySchema, runtime (+10 more)

### Community 68 - "neshan-map.tsx"
Cohesion: 0.09
Nodes (30): @neshan-maps-platform/maplibre-sdk, LAYER_ICONS, MapMarker, NeshanMap(), NeshanMapInstance, NeshanSdk, pinElement(), DEFAULT_MAP_LAYER (+22 more)

### Community 69 - "app-requests.ts"
Cohesion: 0.05
Nodes (47): ConsumerRequestsContent(), ConsumerRequestsPage(), EMPTY, Grouped, parseTab(), STATUSES, TAB_QUERY, TabKey (+39 more)

### Community 70 - "generate-openapi.mjs"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "search/page.tsx"
Cohesion: 0.06
Nodes (63): framer-motion, ConsumerLandsPage(), SortKey, SORTS, COMPACT, ConsumerReportsPage(), FULL, LandCost (+55 more)

### Community 72 - "types/index.ts"
Cohesion: 0.10
Nodes (23): WorkAreaPanelProps, MapPickerProps, NeshanMapProps, GeoLocation, Notification, NotificationType, OfferedService, ProviderProfile (+15 more)

### Community 73 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 74 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 75 - "app/layout.tsx"
Cohesion: 0.17
Nodes (8): @fontsource-variable/vazirmatn, viewport, metadata, viewport, SCREENSHOTS, APPLE_STARTUP_IMAGES, PWA_BRAND, STATUS_BAR_COLORS

### Community 76 - "dashboard.service.ts"
Cohesion: 0.20
Nodes (18): cache, CacheEntry, getDashboardCache(), pruneExpired(), setDashboardCache(), countActiveUsersInRange(), countNotificationDeliveryFailures(), countPaymentFailures() (+10 more)

### Community 77 - "return/page.tsx"
Cohesion: 0.22
Nodes (14): DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge(), ResultShell(), VerifyState, AppPaymentDetail (+6 more)

### Community 78 - "Badge"
Cohesion: 0.22
Nodes (10): class-variance-authority, AdminStatusBadgeProps, BadgeVariant, STATUS_TONES, STATUS_CONFIG, StatusBadge(), StatusBadgeProps, Badge() (+2 more)

### Community 79 - "map-picker.tsx"
Cohesion: 0.26
Nodes (10): inlineCenter(), LocationLabel(), MapPicker(), PickerHint(), useCurrentPosition(), MapControlButton(), DialogClose(), DEFAULT_MAP_CENTER (+2 more)

### Community 80 - "use-price-input.ts"
Cohesion: 0.33
Nodes (9): persian-tools, formatToPersianWords(), formatWithCommas(), parseToRawNumber(), sanitizeInput(), toEnglishDigits(), toPersianDigits(), usePriceInput() (+1 more)

### Community 81 - "ref_node_path"
Cohesion: 0.07
Nodes (19): APP_VERSION, nextConfig, securityHeaders, projectRoot, bannedPatterns, collectTs(), failures, listsRoot (+11 more)

### Community 82 - "catalog.service.ts"
Cohesion: 0.27
Nodes (13): cache, CacheEntry, getCatalogCache(), setCatalogCache(), mapCategory(), mapService(), findActiveCategoryBySlug(), findActiveServiceBySlug() (+5 more)

### Community 83 - "weather-widget.tsx"
Cohesion: 0.29
Nodes (10): formatForecastDate(), MetricPill(), WeatherSkeleton(), WeatherWidget(), loadInitialWeather(), WeatherWidgetProps, toMessage(), useWeather() (+2 more)

### Community 84 - "platform.ts"
Cohesion: 0.21
Nodes (10): APP_INSTALLED_EVENT, BeforeInstallPromptEvent, INSTALL_AVAILABLE_EVENT, INSTALL_CAPTURE_SCRIPT, InstallPlatform, Navigator, PlatformInfo, Window (+2 more)

### Community 85 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, sharp, tailwindcss, @tailwindcss/postcss (+6 more)

### Community 86 - "billing-history.tsx"
Cohesion: 0.26
Nodes (10): BillingHistory(), BillingHistoryProps, DATE, EmptyRow(), View, AppPaymentSummary, AppSubscriptionHistoryItem, paymentStatusInfo() (+2 more)

### Community 87 - "sw.js"
Cohesion: 0.29
Nodes (8): BYPASS_PREFIXES, cacheFirst(), CACHES, isCacheable(), LIMITS, PRECACHE_URLS, staleWhileRevalidate(), trim()

### Community 88 - "seed-worker.mts"
Cohesion: 0.28
Nodes (10): args, [command, ...rest], hashToken(), installAppSession(), makeOpaqueToken(), makePublicId(), seedAdmin(), seedApp() (+2 more)

### Community 89 - "crypto.ts"
Cohesion: 0.27
Nodes (4): argon2, HmacEncoding, signWithSecret(), verifyPayloadSignature()

### Community 90 - "validate-prisma-foundation.mjs"
Cohesion: 0.20
Nodes (8): envExamplePath, migrationPath, migrationTables, packageJson, packagePath, projectRoot, referencePath, schemaPath

### Community 91 - "validate-api-boundaries.mjs"
Cohesion: 0.18
Nodes (9): collectFiles(), fail(), graph, projectRoot, sourceRoot, supportedExtensions, visit(), visited (+1 more)

### Community 92 - "health/route.ts"
Cohesion: 0.29
Nodes (8): GET, runtime, HealthResponse, HealthResponseSchema, mapHealthResponse(), checkDatabaseConnection(), getApiHealth(), HealthResult

### Community 93 - "toast-provider.tsx"
Cohesion: 0.36
Nodes (7): RootLayout(), ToastProvider(), topOffset(), OfflineIndicator(), subscribe(), useOnlineStatus(), setToasterMounted()

### Community 94 - "pwa-runtime.tsx"
Cohesion: 0.47
Nodes (8): applyUpdate(), offerUpdate(), PwaRuntime(), registerServiceWorker(), trackInstalling(), detectPlatform(), isStandaloneDisplay(), whenToasterReady()

### Community 95 - "plan-card.tsx"
Cohesion: 0.39
Nodes (7): CheckoutSheetProps, durationLabel(), formatToman(), PlanCard(), PlanCardProps, planFeatureList(), AppSubscriptionPlan

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 969 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Skeleton`, `requireAdminSession`, `apiSuccess`, `lucide-react`, `isApiClientError`, `profile/page.tsx`, `cn`, `parseWithSchema`, `app-menu.tsx`, `root-chrome.tsx`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `admin-user-detail-page.tsx`, `app-auth.service.ts`, `subscriptions.service.ts`, `http/index.ts`, `utils/format.ts`, `prisma.ts`, `admin-admin-detail-page.tsx`, `admin-management.schemas.ts`, `users/home/page.tsx`, `getAllowedOrigins`, `dock-nav.tsx`, `admins/v1/me/route.ts`, `providers/reports/page.tsx`, `admin-auth.service.ts`, `admin-exports-page.tsx`, `field-weather-card.tsx`, `admin-dashboard-page.tsx`, `toPersianDigits`, `runner.ts`, `app-provider.tsx`, `[key]/route.ts`, `app-profile.service.ts`, `package.json`, `react`, `session.service.ts`, `edit/page.tsx`, `app/page.tsx`, `admins/v1/notifications/route.ts`, `admin-audit.service.ts`, `app-requests.ts`, `search/page.tsx`, `app/layout.tsx`, `return/page.tsx`, `map-picker.tsx`, `ref_node_path`, `weather-widget.tsx`, `billing-history.tsx`, `health/route.ts`, `admins/layout.tsx`?**
  _High betweenness centrality (0.418) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `farsi-tools` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Skeleton` be split into smaller, more focused modules?**
  _Cohesion score 0.07062146892655367 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `contracts/index.ts` to `requireAdminSession`, `lucide-react`, `isApiClientError`, `profile/page.tsx`, `parseWithSchema`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `admin-user-detail-page.tsx`, `next`, `http/index.ts`, `admin-admin-detail-page.tsx`, `admin-management.schemas.ts`, `users/home/page.tsx`, `getAllowedOrigins`, `admins/v1/me/route.ts`, `providers/reports/page.tsx`, `admin-exports-page.tsx`, `admin-dashboard-page.tsx`, `toPersianDigits`, `reports.service.ts`, `provider.schemas.ts`, `runner.ts`, `[key]/route.ts`, `app-profile.service.ts`, `package.json`, `react`, `admin-notifications-page.tsx`, `edit/page.tsx`, `admin-jobs-page.tsx`, `admins/v1/notifications/route.ts`, `admin-audit.service.ts`, `app-requests.ts`, `search/page.tsx`, `return/page.tsx`, `health/route.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `requireAdminSession` be split into smaller, more focused modules?**
  _Cohesion score 0.04584942084942085 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `Skeleton`, `lucide-react`, `isApiClientError`, `profile/page.tsx`, `app-menu.tsx`, `root-chrome.tsx`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `admin-user-detail-page.tsx`, `utils/format.ts`, `admin-admin-detail-page.tsx`, `users/home/page.tsx`, `jalali.ts`, `dock-nav.tsx`, `providers/reports/page.tsx`, `field-weather-card.tsx`, `admin-dashboard-page.tsx`, `toPersianDigits`, `react`, `edit/page.tsx`, `app/page.tsx`, `admin-jobs-page.tsx`, `neshan-map.tsx`, `app-requests.ts`, `search/page.tsx`, `return/page.tsx`, `Badge`, `map-picker.tsx`, `weather-widget.tsx`, `billing-history.tsx`, `toast-provider.tsx`, `plan-card.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._