# Graph Report - keshavarz  (2026-11-17)

## Corpus Check
- 657 files · ~213,368 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 8, .example 1, .toml 1)

## Summary
- 3700 nodes · 13971 edges · 115 communities (105 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `016991d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Skeleton
- requireAdminSession
- apiSuccess
- AdminPageHeader
- isApiClientError
- useAuthStore
- admin-topbar.tsx
- [deliveryId]/replay/route.ts
- request.service.ts
- lucide-react
- app-client.ts
- providers/services/page.tsx
- admin-provider-detail-page.tsx
- subscription/page.tsx
- search.service.ts
- admin-exports-page.tsx
- security/index.ts
- app-auth.service.ts
- subscriptions.service.ts
- provider.service.ts
- LoadingSpinner
- app-requests.ts
- app-profile.service.ts
- admin-management.service.ts
- admin-admin-detail-page.tsx
- ops.service.ts
- users/home/page.tsx
- notification.service.ts
- jalali.ts
- getAllowedOrigins
- users/requests/[id]/page.tsx
- toPersianDigits
- admin-catalog.service.ts
- db.ts
- users/reports/page.tsx
- admin-auth.service.ts
- admin-providers.service.ts
- ref_node_path
- AdminSectionCard
- contracts/index.ts
- admin-subscriptions.service.ts
- admin-dashboard-page.tsx
- cn
- exports.service.ts
- scripts
- reports.service.ts
- app-provider.tsx
- prisma.ts
- phase10.integration.test.ts
- phase05.integration.test.ts
- idempotency.ts
- dependencies
- LocalObjectStorage
- transaction.ts
- integrations/index.ts
- package.json
- use-admin-session.tsx
- admin-user-detail-page.tsx
- getSecurityEnvironment
- validators/index.ts
- ulid.ts
- validate-api-contracts.mjs
- admin-auth.integration.test.ts
- default-rate-limiter.ts
- Keshavarz Agricultural Services Platform (Mock)
- admin-jobs-page.tsx
- app-auth.integration.test.ts
- types/index.ts
- map-picker.tsx
- root-chrome.tsx
- generate-openapi.mjs
- search/page.tsx
- field-weather-card.tsx
- compilerOptions
- components.json
- notification.delivery.ts
- dashboard.service.ts
- read/route.ts
- admin-data-table.tsx
- createPublicId
- use-price-input.ts
- validate-frontend-security.mjs
- catalog.service.ts
- location.service.ts
- envelope.ts
- devDependencies
- phase08.integration.test.ts
- public/settings/route.ts
- seed-worker.mts
- form.tsx
- manifest.json
- validate-api-boundaries.mjs
- health/route.ts
- [key]/route.ts
- session.repository.ts
- ApiError
- app/layout.tsx
- admins/v1/me/route.ts
- use-initialize-app.ts
- validate-secret-scan.mjs
- app-public-provider.ts
- app-settings.ts
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

## Communities (115 total, 10 thin omitted)

### Community 0 - "Skeleton"
Cohesion: 0.08
Nodes (32): AdminAdminsRoutePage(), Fallback(), Fallback(), Page(), AdminCategoriesRoutePage(), CatalogRouteFallback(), AdminServicesRoutePage(), CatalogRouteFallback() (+24 more)

### Community 1 - "requireAdminSession"
Cohesion: 0.03
Nodes (131): PUT, runtime, POST, runtime, PUT, runtime, adminIdFromPath(), GET (+123 more)

### Community 2 - "apiSuccess"
Cohesion: 0.03
Nodes (118): next, POST, runtime, GET, runtime, GET, runtime, GET (+110 more)

### Community 3 - "AdminPageHeader"
Cohesion: 0.15
Nodes (66): AdminDemoPage(), AdminAuditLogsListPage(), AdminCan(), AdminCanProps, AdminForbidden(), AdminCategoriesPage(), AdminServicesPage(), AdminColumnVisibilityControls() (+58 more)

### Community 4 - "isApiClientError"
Cohesion: 0.07
Nodes (87): react, sonner, AdminChangePasswordPage(), onSubmit(), AdminPaymentDetailRoutePage(), PageProps, AdminRolesRoutePage(), Page() (+79 more)

### Community 5 - "useAuthStore"
Cohesion: 0.10
Nodes (33): zustand, AuthPage(), AuthPageContent(), STAGE_COPY, Crop(), FarmScene(), FarmStage, SPROUTS (+25 more)

### Community 6 - "admin-topbar.tsx"
Cohesion: 0.08
Nodes (38): radix-ui, ADMIN_NAV_GROUPS, AdminNavGroup, AdminNavItem, AdminPermissionCode, isAdminNavActive(), AdminShell(), AdminShellProps (+30 more)

### Community 7 - "[deliveryId]/replay/route.ts"
Cohesion: 0.50
Nodes (4): POST, ReplayBodySchema, runtime, replayNotificationDeadLetterForAdmin()

### Community 8 - "request.service.ts"
Cohesion: 0.09
Nodes (64): runInTransaction(), canRevealContact(), decimal(), mapAdminRequestDetail(), mapAdminRequestHistories(), mapAdminRequestSummary(), mapConsumerRequestDetail(), mapConsumerRequestSummary() (+56 more)

### Community 9 - "lucide-react"
Cohesion: 0.07
Nodes (53): lucide-react, PLATFORM_LABEL, ProfilePage(), Reveal(), Section(), AdminFilterDrawerProps, CancelForm(), CancelRequestSheet() (+45 more)

### Community 10 - "app-client.ts"
Cohesion: 0.18
Nodes (14): APP_API_BASE, AppApiRequestOptions, appRequest(), buildUrl(), notifyUnauthorized(), parseResponse(), QueryValue, UnauthorizedListener (+6 more)

### Community 11 - "providers/services/page.tsx"
Cohesion: 0.06
Nodes (55): clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage(), TabKey (+47 more)

### Community 12 - "admin-provider-detail-page.tsx"
Cohesion: 0.05
Nodes (61): AdminCatalogReorderRoutePage(), AdminProviderDetailRoutePage(), PageProps, AdminServiceRequestDetailRoutePage(), PageProps, AdminCatalogReorderPage(), moveItem(), AdminCategoryFormDialogProps (+53 more)

### Community 13 - "subscription/page.tsx"
Cohesion: 0.07
Nodes (50): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge() (+42 more)

### Community 14 - "search.service.ts"
Cohesion: 0.18
Nodes (21): createSearchRequest(), CandidateState, mapCandidate(), mapCandidateRequestContext(), EligibleProviderRow, findActiveCatalogServiceForSearch(), findActiveOwnedLand(), findOpenRequestForCriteria() (+13 more)

### Community 15 - "admin-exports-page.tsx"
Cohesion: 0.11
Nodes (24): onCreate(), onLookup(), pushRecentId(), readRecentIds(), AdminExportDomain, AdminExportJob, AdminExportJobSchema, createAdminExport() (+16 more)

### Community 16 - "security/index.ts"
Cohesion: 0.05
Nodes (56): POST, runtime, DELETE, runtime, DELETE, runtime, POST, runtime (+48 more)

### Community 17 - "app-auth.service.ts"
Cohesion: 0.10
Nodes (37): getDeviceFingerprint(), touchAdminSession(), assignSessionPublicId(), consumeAllLoginOtpsForPhone(), consumeOtpRecord(), createLoginOtp(), createOrUpdateLoginUser(), createUserSession() (+29 more)

### Community 18 - "subscriptions.service.ts"
Cohesion: 0.08
Nodes (58): GET, runtime, mapPrismaError(), getAppIdempotencyService(), createUser(), phones, mapActiveSubscription(), mapPaymentDetail() (+50 more)

### Community 19 - "provider.service.ts"
Cohesion: 0.10
Nodes (48): decimalToString(), mapProviderGalleryImage(), mapProviderProfile(), mapProviderService(), mapPublicProviderProfile(), mapPublicProviderService(), countActiveProviderServices(), countProviderGalleryImages() (+40 more)

### Community 20 - "LoadingSpinner"
Cohesion: 0.14
Nodes (18): ProfileLayout(), ProvidersLayout(), UsersLayout(), ConsumerProviderProfileContent(), ConsumerProviderProfilePage(), isInternalPath(), safeResultsHref(), SearchResultsRoutePage() (+10 more)

### Community 21 - "app-requests.ts"
Cohesion: 0.07
Nodes (54): landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState, ProviderRequestsContent() (+46 more)

### Community 22 - "app-profile.service.ts"
Cohesion: 0.22
Nodes (14): getCurrentUserProfile(), profileSelect, replaceCurrentUserImage(), updateCurrentUserProfile(), deleteCurrentUserImage(), hasValidImageSignature(), IMAGE_TYPES, patchCurrentUserProfile() (+6 more)

### Community 23 - "admin-management.service.ts"
Cohesion: 0.09
Nodes (53): assertAdminPasswordPolicy(), revokeAllAdminSessions(), AdminListRecord, AdminOverrideRecord, AdminRoleSummaryRecord, mapAdminDetail(), mapAdminSummary(), mapPermission() (+45 more)

### Community 24 - "admin-admin-detail-page.tsx"
Cohesion: 0.09
Nodes (38): AdminAdminDetailRoutePage(), PageProps, AdminPermissionsRoutePage(), AdminRoleDetailRoutePage(), PageProps, AdminAdminDetailPage(), AdminAdminDetailPageProps, AdminPermissionsCatalogPage() (+30 more)

### Community 25 - "ops.service.ts"
Cohesion: 0.08
Nodes (46): RequestId, ApiRequestContext, ApiRouteHandler, normalizeError(), runRbacExpiryJob(), runRbacExpiryJobSafe(), getOpsMetricsForAdmin(), listPaymentDeadLettersForAdmin() (+38 more)

### Community 26 - "users/home/page.tsx"
Cohesion: 0.11
Nodes (30): ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor(), Reveal() (+22 more)

### Community 27 - "notification.service.ts"
Cohesion: 0.11
Nodes (38): ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), mapAdminNotification(), mapNotification(), countUnreadUserNotifications(), createNotificationWithDeliveries(), findAdminsByPublicIds() (+30 more)

### Community 28 - "jalali.ts"
Cohesion: 0.13
Nodes (28): DatePickerStep(), DatePickerStepProps, isoForOffset(), MAX_SEARCH_DATES, QUICK_DAYS, DayCellData, PersianCalendar, PersianCalendarProps (+20 more)

### Community 29 - "getAllowedOrigins"
Cohesion: 0.04
Nodes (104): POST, runtime, POST, runtime, POST, runtime, POST, runtime (+96 more)

### Community 30 - "users/requests/[id]/page.tsx"
Cohesion: 0.08
Nodes (36): ConsumerRequestDetailContent(), ConsumerRequestDetailPage(), FULL, landLocation(), PROVIDER_STATUS, Reveal(), Section(), STAMP (+28 more)

### Community 31 - "toPersianDigits"
Cohesion: 0.09
Nodes (33): CARD_STATE, describeSkipped(), LIST_ITEM_SPRING, OPEN_STATUSES, RequestBanner(), SearchResultsPage(), SearchSummary(), SortKey (+25 more)

### Community 32 - "admin-catalog.service.ts"
Cohesion: 0.14
Nodes (34): AdminCategoryRecord, AdminServiceRecord, mapAdminCategory(), mapAdminService(), categorySelect, countNonDeletedServicesInCategory(), countProviderServicesForCategory(), countProviderServicesForService() (+26 more)

### Community 33 - "db.ts"
Cohesion: 0.08
Nodes (26): adminPassword, adminPhone, createSearch(), getData(), idempotencyKey(), listCandidates(), mutation(), PROVIDER_PHONES (+18 more)

### Community 34 - "users/reports/page.tsx"
Cohesion: 0.06
Nodes (47): COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES, Reveal() (+39 more)

### Community 35 - "admin-auth.service.ts"
Cohesion: 0.17
Nodes (25): createAdminSession(), findAdminByPhoneForLogin(), getAdminPasswordMaterial(), getCurrentAdminProfile(), lockAdminForAuth(), lockAdminSessionForRotation(), registerFailedAdminLogin(), registerSuccessfulAdminLogin() (+17 more)

### Community 36 - "admin-providers.service.ts"
Cohesion: 0.14
Nodes (32): AdminProviderDetailRecord, AdminProviderListRecord, AdminProviderServiceRecord, decimalToString(), mapAdminProviderDetail(), mapAdminProviderListItem(), mapAdminProviderService(), toString() (+24 more)

### Community 37 - "ref_node_path"
Cohesion: 0.06
Nodes (24): sharp, bannedPatterns, collectTs(), failures, listsRoot, projectRoot, requiredListHints, bannedRoots (+16 more)

### Community 38 - "AdminSectionCard"
Cohesion: 0.17
Nodes (16): Page(), Fallback(), Page(), AdminAuditLogDetailPage(), JsonBlock(), AdminForbiddenProps, AdminMonthlyGmvChart(), AdminMonthlyGmvChartProps (+8 more)

### Community 39 - "contracts/index.ts"
Cohesion: 0.05
Nodes (63): zod, GET, runtime, GET, POST, runtime, POST, runtime (+55 more)

### Community 40 - "admin-subscriptions.service.ts"
Cohesion: 0.15
Nodes (31): mapAdminPaymentDetail(), mapAdminPaymentSummary(), mapAdminProviderSubscription(), mapAdminRefund(), mapAdminSubscriptionPlan(), money(), countActiveSubscriptionsForPlan(), createSubscriptionPlan() (+23 more)

### Community 41 - "admin-dashboard-page.tsx"
Cohesion: 0.08
Nodes (47): recharts, AdminDashboardPage(), AdminRequestStatusChart, DashboardSkeleton(), AdminDashboardToolbar(), AdminDashboardToolbarProps, PRESETS, AdminKpiCard() (+39 more)

### Community 42 - "cn"
Cohesion: 0.04
Nodes (76): class-variance-authority, AdminKpiCardProps, TONE_STYLES, AdminQuickLinks(), LINKS, AdminFilterChips(), AdminFilterChipsProps, AdminPageHeaderProps (+68 more)

### Community 43 - "exports.service.ts"
Cohesion: 0.11
Nodes (33): GET, runtime, escapeCsvCell(), toCsv(), listPaymentsForExport(), listReportsForExport(), resolveRange(), CreateExportSchema (+25 more)

### Community 44 - "scripts"
Cohesion: 0.06
Nodes (32): scripts, build, check:admin-list-perf, check:admin-load-budget, check:api-boundaries, check:api-contracts, check:frontend-security, check:no-mock-imports (+24 more)

### Community 45 - "reports.service.ts"
Cohesion: 0.18
Nodes (32): countActiveApprovedProviders(), countActiveUsersInRange(), countNotificationDeliveries(), countPaidPayments(), countRequestsCreatedByStatus(), findConsumerTopLand(), findConsumerTopService(), findOwnedLandIdByPublicId() (+24 more)

### Community 46 - "app-provider.tsx"
Cohesion: 0.27
Nodes (8): AppProvider(), AppProviderProps, isAdminPath(), AppSplash(), POLLEN, EASE_GROW, SproutMark(), SproutMarkProps

### Community 47 - "prisma.ts"
Cohesion: 0.08
Nodes (33): dotenv, prisma, baseUrl, names, requested, systemClock, databaseEnvironment, globalForPrisma (+25 more)

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

### Community 52 - "LocalObjectStorage"
Cohesion: 0.20
Nodes (5): HttpObjectStorage, ObjectStorageUnavailableError, LocalObjectStorage, resolveStorage(), resolveGalleryStorage()

### Community 53 - "transaction.ts"
Cohesion: 0.23
Nodes (9): TransactionClient, findSystemSetting(), listSystemSettings(), settingSelect, upsertSystemSetting(), assertValueMatchesType(), listSettingsForAdmin(), mapSetting() (+1 more)

### Community 54 - "integrations/index.ts"
Cohesion: 0.12
Nodes (14): ConsoleSmsQueue, ObjectStorage, PaymentInitiation, PaymentProvider, SmsMessage, SmsProvider, SmsQueue, PutResponse (+6 more)

### Community 55 - "package.json"
Cohesion: 0.08
Nodes (25): eslintConfig, name, private, version, argon2, clsx, eslint, eslint-config-next (+17 more)

### Community 56 - "use-admin-session.tsx"
Cohesion: 0.14
Nodes (21): AdminConsoleLayout(), AdminMeForm(), onSave(), AdminMePage(), AdminLoginPage(), AdminAuthGate(), AdminLoginForm(), onSubmit() (+13 more)

### Community 57 - "admin-user-detail-page.tsx"
Cohesion: 0.17
Nodes (17): AdminUserDetailRoutePage(), PageProps, AdminUserDetailPage(), AdminUserDetailPageProps, MODERATION_OPTIONS, AdminModerationAction, AdminModerationActionSchema, AdminUserDetail (+9 more)

### Community 58 - "getSecurityEnvironment"
Cohesion: 0.18
Nodes (14): findActiveAdminSessionForToken(), findUserSessionForToken(), getSecurityEnvironment(), throwSecurityEnvError(), request(), createOtp(), getOtpPepperSecrets(), getTokenHashSecrets() (+6 more)

### Community 59 - "validators/index.ts"
Cohesion: 0.18
Nodes (14): authFormSchema, AuthFormValues, otpSchema, phoneSchema, geoLocationSchema, landFormSchema, CancelReasonFormValues, cancelReasonSchema (+6 more)

### Community 60 - "ulid.ts"
Cohesion: 0.12
Nodes (25): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+17 more)

### Community 61 - "validate-api-contracts.mjs"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 62 - "admin-auth.integration.test.ts"
Cohesion: 0.24
Nodes (10): phones, cache, CacheEntry, cacheKey(), getCachedAdminPermissions(), setCachedAdminPermissions(), buildPermissionContext(), loadAdminPermissionMaterial() (+2 more)

### Community 63 - "default-rate-limiter.ts"
Cohesion: 0.19
Nodes (11): createRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy, RateLimitResult (+3 more)

### Community 64 - "Keshavarz Agricultural Services Platform (Mock)"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "admin-jobs-page.tsx"
Cohesion: 0.19
Nodes (17): Page(), AdminJobsPage(), onReplay(), onRunJobs(), RUNNABLE_JOBS, ADMIN_JOB_NAMES, AdminJobName, fetchNotificationDeadLetters() (+9 more)

### Community 66 - "app-auth.integration.test.ts"
Cohesion: 0.16
Nodes (9): vitest, APP_SESSION_POLICY, OTP_POLICY, redactAuditValue(), phones, smsQueue, isOtpResendCooldownActive(), isSessionWithinRefreshWindow() (+1 more)

### Community 67 - "types/index.ts"
Cohesion: 0.10
Nodes (21): haversineKm(), toRadians(), GeoLocation, Notification, NotificationType, OfferedService, ProviderProfile, CancelledBy (+13 more)

### Community 68 - "map-picker.tsx"
Cohesion: 0.08
Nodes (38): leaflet, inlineCenter(), LocationLabel(), MapPicker(), MapPickerProps, PickerHint(), useCurrentPosition(), LAYER_ICONS (+30 more)

### Community 69 - "root-chrome.tsx"
Cohesion: 0.26
Nodes (9): AppShell(), AppShellProps, HIDDEN_MENU_PATHS, MobileShell(), MobileShellProps, StatusBarMock(), isAdminPath(), RootChrome() (+1 more)

### Community 70 - "generate-openapi.mjs"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "search/page.tsx"
Cohesion: 0.09
Nodes (42): framer-motion, EditLandPage(), NewLandPage(), ConsumerLandsPage(), SortKey, SORTS, ConsumerSearchContent(), ConsumerSearchPage() (+34 more)

### Community 72 - "field-weather-card.tsx"
Cohesion: 0.08
Nodes (43): HomePage(), HomePageContent(), Reveal(), AdviceTile(), LandWeatherCard(), LandWeatherCardProps, AdviceRow(), FieldWeatherCard() (+35 more)

### Community 73 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 74 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 75 - "notification.delivery.ts"
Cohesion: 0.26
Nodes (13): backoffMilliseconds(), deliverChannel(), isReadyForRetry(), listNotificationDeadLetters(), replayNotificationDeadLetter(), runNotificationDeliveryJob(), listDeadLetterDeliveries(), listQueuedDeliveries() (+5 more)

### Community 76 - "dashboard.service.ts"
Cohesion: 0.22
Nodes (16): cache, CacheEntry, getDashboardCache(), setDashboardCache(), countActiveUsersInRange(), countNotificationDeliveryFailures(), countPaymentFailures(), countProviders() (+8 more)

### Community 77 - "read/route.ts"
Cohesion: 0.19
Nodes (10): POST, runtime, POST, runtime, AdminNotificationsQuerySchema, AdminSendNotificationSchema, NotificationParamsSchema, NotificationTypeSchema (+2 more)

### Community 78 - "admin-data-table.tsx"
Cohesion: 0.26
Nodes (10): AdminColumnVisibilityMenuProps, AdminDataTableProps, Table(), TableBody(), TableCaption(), TableCell(), TableFooter(), TableHead() (+2 more)

### Community 79 - "createPublicId"
Cohesion: 0.24
Nodes (8): createPublicId(), createAdmin(), createLand(), createSearchableProvider(), createUser(), offsetLatitude(), phones, ServiceSearchResult

### Community 80 - "use-price-input.ts"
Cohesion: 0.33
Nodes (9): persian-tools, formatToPersianWords(), formatWithCommas(), parseToRawNumber(), sanitizeInput(), toEnglishDigits(), toPersianDigits(), usePriceInput() (+1 more)

### Community 81 - "validate-frontend-security.mjs"
Cohesion: 0.29
Nodes (6): banned, collectFiles(), projectRoot, scanRoots, supportedExtensions, violations

### Community 82 - "catalog.service.ts"
Cohesion: 0.27
Nodes (13): cache, CacheEntry, getCatalogCache(), setCatalogCache(), mapCategory(), mapService(), findActiveCategoryBySlug(), findActiveServiceBySlug() (+5 more)

### Community 83 - "location.service.ts"
Cohesion: 0.38
Nodes (7): GET, runtime, findActiveProvinceById(), listActiveCitiesByProvinceId(), listActiveProvinces(), getCitiesForProvince(), getProvinces()

### Community 84 - "envelope.ts"
Cohesion: 0.05
Nodes (56): onConfirmSend(), isNotificationType(), parseIdList(), AdminCursorPaginationProps, CursorListResult, useAdminCursorQuery(), UseAdminCursorQueryOptions, ADMIN_DEFAULT_LIMIT (+48 more)

### Community 85 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, sharp, tailwindcss, @tailwindcss/postcss (+7 more)

### Community 86 - "phase08.integration.test.ts"
Cohesion: 0.36
Nodes (9): cleanupAll(), cleanupUsers(), createLand(), createProvider(), createUser(), futureDate(), offsetLatitude(), phones (+1 more)

### Community 87 - "public/settings/route.ts"
Cohesion: 0.36
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

### Community 93 - "[key]/route.ts"
Cohesion: 0.31
Nodes (7): PUT, runtime, settingParamsFromPath(), AdminSettingParamsSchema, AdminSettingUpsertSchema, SettingValueTypeSchema, SystemSettingValueType

### Community 94 - "session.repository.ts"
Cohesion: 0.42
Nodes (7): findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup, UserSessionLookup, Clock

### Community 95 - "ApiError"
Cohesion: 0.20
Nodes (12): API_ERROR_CODES, ApiError, ApiErrorCode, ApiErrorOptions, isRetryablePrismaConflict(), COMMON_PASSWORDS, nextAdminLockoutSeconds(), countActiveSuperAdmins() (+4 more)

### Community 96 - "app/layout.tsx"
Cohesion: 0.32
Nodes (5): @fontsource-variable/vazirmatn, metadata, RootLayout(), viewport, ToastProvider()

### Community 97 - "admins/v1/me/route.ts"
Cohesion: 0.39
Nodes (6): GET, mapCurrentAdmin(), PATCH, runtime, AdminProfileRecord, mapAdminProfile()

### Community 98 - "use-initialize-app.ts"
Cohesion: 0.48
Nodes (5): clearLegacyDomainStorage(), redirectToAppAuth(), useInitializeApp(), onAppUnauthorized(), LEGACY_APP_STORAGE_KEYS

### Community 99 - "validate-secret-scan.mjs"
Cohesion: 0.22
Nodes (8): allowlist, collectFiles(), patterns, projectRoot, scanRoots, skipDirectories, supportedExtensions, violations

### Community 100 - "app-public-provider.ts"
Cohesion: 0.29
Nodes (6): AppPublicProviderGalleryImage, AppPublicProviderGalleryImageSchema, AppPublicProviderProfile, AppPublicProviderProfileSchema, AppPublicProviderService, AppPublicProviderServiceSchema

### Community 101 - "app-settings.ts"
Cohesion: 0.40
Nodes (3): PublicSetting, PublicSettingSchema, SETTING_VALUE_TYPES

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 934 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `apiSuccess` to `requireAdminSession`, `AdminPageHeader`, `isApiClientError`, `useAuthStore`, `admin-topbar.tsx`, `[deliveryId]/replay/route.ts`, `lucide-react`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `admin-exports-page.tsx`, `security/index.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `LoadingSpinner`, `app-requests.ts`, `admin-admin-detail-page.tsx`, `ops.service.ts`, `users/home/page.tsx`, `getAllowedOrigins`, `users/requests/[id]/page.tsx`, `toPersianDigits`, `users/reports/page.tsx`, `admin-auth.service.ts`, `ref_node_path`, `AdminSectionCard`, `contracts/index.ts`, `admin-dashboard-page.tsx`, `cn`, `exports.service.ts`, `app-provider.tsx`, `package.json`, `use-admin-session.tsx`, `admin-user-detail-page.tsx`, `admin-auth.integration.test.ts`, `app-auth.integration.test.ts`, `map-picker.tsx`, `root-chrome.tsx`, `search/page.tsx`, `field-weather-card.tsx`, `read/route.ts`, `location.service.ts`, `public/settings/route.ts`, `health/route.ts`, `[key]/route.ts`, `app/layout.tsx`, `admins/v1/me/route.ts`, `admins/layout.tsx`, `next.config.ts`?**
  _High betweenness centrality (0.417) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `farsi-tools` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Skeleton` be split into smaller, more focused modules?**
  _Cohesion score 0.08078231292517007 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `contracts/index.ts` to `requireAdminSession`, `apiSuccess`, `AdminPageHeader`, `isApiClientError`, `useAuthStore`, `[deliveryId]/replay/route.ts`, `lucide-react`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `admin-exports-page.tsx`, `security/index.ts`, `app-requests.ts`, `admin-admin-detail-page.tsx`, `users/home/page.tsx`, `getAllowedOrigins`, `users/reports/page.tsx`, `admin-dashboard-page.tsx`, `exports.service.ts`, `prisma.ts`, `package.json`, `use-admin-session.tsx`, `admin-user-detail-page.tsx`, `validators/index.ts`, `admin-jobs-page.tsx`, `search/page.tsx`, `read/route.ts`, `envelope.ts`, `health/route.ts`, `[key]/route.ts`, `app-public-provider.ts`, `app-settings.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `requireAdminSession` be split into smaller, more focused modules?**
  _Cohesion score 0.034441980783444195 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `ApiError` to `requireAdminSession`, `apiSuccess`, `request.service.ts`, `search.service.ts`, `security/index.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `provider.service.ts`, `app-profile.service.ts`, `admin-management.service.ts`, `ops.service.ts`, `notification.service.ts`, `getAllowedOrigins`, `admin-catalog.service.ts`, `admin-auth.service.ts`, `admin-providers.service.ts`, `admin-subscriptions.service.ts`, `exports.service.ts`, `reports.service.ts`, `phase10.integration.test.ts`, `phase05.integration.test.ts`, `idempotency.ts`, `transaction.ts`, `getSecurityEnvironment`, `default-rate-limiter.ts`, `notification.delivery.ts`, `catalog.service.ts`, `location.service.ts`, `phase08.integration.test.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._