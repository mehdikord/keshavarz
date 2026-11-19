# Graph Report - keshavarz  (2026-11-19)

## Corpus Check
- 682 files · ~456,256 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 8, .example 1, .toml 1)

## Summary
- 3878 nodes · 14563 edges · 114 communities (103 shown, 11 thin omitted)
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
- Button
- react
- useAuthStore
- admin-command-palette.tsx
- next
- ApiError
- profile/page.tsx
- root-chrome.tsx
- providers/services/page.tsx
- admin-provider-detail-page.tsx
- subscription/page.tsx
- admin-user-detail-page.tsx
- app-client.ts
- security/index.ts
- app-auth.service.ts
- subscriptions.service.ts
- provider.service.ts
- subscriptions.schemas.ts
- app-requests.ts
- errors/index.ts
- admin-management.service.ts
- admin-admin-detail-page.tsx
- admin-audit.service.ts
- toPersianDigits
- notification.service.ts
- jalali.ts
- admins/v1/catalog/services/[serviceId]/route.ts
- provider-public-profile.tsx
- admins/v1/me/route.ts
- admin-catalog.service.ts
- db.ts
- users/reports/page.tsx
- admin-auth.service.ts
- admin-providers.service.ts
- vitest
- field-weather-card.tsx
- contracts/index.ts
- admin-subscriptions.service.ts
- [planId]/route.ts
- search-results-content.tsx
- reports.service.ts
- scripts
- generate-icons.mjs
- provider.schemas.ts
- prisma.ts
- phase10.integration.test.ts
- search.service.ts
- idempotency.ts
- dependencies
- app-provider.tsx
- app-profile.service.ts
- integrations/index.ts
- package.json
- isApiClientError
- admin-notifications-page.tsx
- session.service.ts
- zod
- seed.ts
- validate-api-contracts.mjs
- admin-auth.integration.test.ts
- default-rate-limiter.ts
- Keshavarz Agricultural Services Platform (Mock)
- admin-jobs-page.tsx
- admins/v1/notifications/route.ts
- admin-audit.repository.ts
- types/index.ts
- consumer-request-card.tsx
- generate-openapi.mjs
- utils/format.ts
- form.tsx
- compilerOptions
- components.json
- app/layout.tsx
- dashboard.service.ts
- request-taken-state.tsx
- cn
- public/settings/route.ts
- use-price-input.ts
- ref_node_path
- admin-data-table.tsx
- admin-users.schemas.ts
- pwa-runtime.tsx
- devDependencies
- admin-management.mapper.ts
- sw.js
- seed-worker.mts
- getSecurityEnvironment
- validate-prisma-foundation.mjs
- validate-api-boundaries.mjs
- health/route.ts
- toast-provider.tsx
- lands.schemas.ts
- admin-auth.password.ts
- validate-no-mock-imports.mjs
- haversine.ts
- cities/route.ts
- validate-secret-scan.mjs
- admin-escalation-guards.test.ts
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
3. `next` - 229 edges
4. `ApiError` - 191 edges
5. `requireAdminSession()` - 148 edges
6. `getAllowedOrigins()` - 145 edges
7. `assertMutationProtection()` - 141 edges
8. `react` - 139 edges
9. `isApiClientError()` - 138 edges
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
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/breadcrumb.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Parsimap map implementation (config, map component, picker)** — readme_parsimap_map, readme_parsimap_config, readme_parsimap_map_component, readme_map_picker [EXTRACTED 1.00]
- **Database schema sources kept in sync (schema.prisma, migration SQL, docs/database.schema)** — prisma_readme_schema_prisma, prisma_readme_initial_migration, prisma_readme_database_schema_doc, prisma_readme_sql_outside_dsl [EXTRACTED 1.00]
- **Next.js create-next-app boilerplate public assets (likely unused leftovers)** — public_file_file_icon, public_globe_globe_icon, public_window_window_icon, public_next_nextjs_logo, public_vercel_vercel_logo [INFERRED 0.95]
- **Same brand logo rendered at multiple PWA/Apple icon sizes** — public_icons_apple_touch_icon_icon, public_icons_icon_192_icon, public_icons_icon_512_icon [INFERRED 0.95]

## Communities (114 total, 11 thin omitted)

### Community 0 - "Skeleton"
Cohesion: 0.04
Nodes (96): recharts, AdminAdminsRoutePage(), Fallback(), Fallback(), Page(), AdminCategoriesRoutePage(), CatalogRouteFallback(), AdminServicesRoutePage() (+88 more)

### Community 1 - "requireAdminSession"
Cohesion: 0.08
Nodes (97): PUT, POST, PUT, PATCH, POST, runtime, POST, DELETE (+89 more)

### Community 2 - "apiSuccess"
Cohesion: 0.05
Nodes (78): GET, GET, GET, GET, GET, GET, GET, GET (+70 more)

### Community 3 - "Button"
Cohesion: 0.13
Nodes (78): Page(), AdminDemoPage(), AdminAuditLogDetailPage(), JsonBlock(), AdminAuditLogsListPage(), AdminCan(), AdminCanProps, AdminForbidden() (+70 more)

### Community 4 - "react"
Cohesion: 0.07
Nodes (75): radix-ui, react, sonner, AdminPaymentDetailRoutePage(), PageProps, AdminRolesRoutePage(), Page(), AdminCategoryFormDialog() (+67 more)

### Community 5 - "useAuthStore"
Cohesion: 0.09
Nodes (35): zustand, AuthPage(), AuthPageContent(), STAGE_COPY, Crop(), FarmScene(), FarmStage, SPROUTS (+27 more)

### Community 6 - "admin-command-palette.tsx"
Cohesion: 0.06
Nodes (52): AdminCommandPalette(), close(), onInputKeyDown(), onKeyDown(), select(), isTypingTarget(), NO_ITEMS, normalize() (+44 more)

### Community 7 - "next"
Cohesion: 0.04
Nodes (68): next, runtime, runtime, runtime, runtime, GET, runtime, GET (+60 more)

### Community 8 - "ApiError"
Cohesion: 0.09
Nodes (65): runInTransaction(), ApiError, canRevealContact(), decimal(), mapAdminRequestDetail(), mapAdminRequestHistories(), mapAdminRequestSummary(), mapConsumerRequestDetail() (+57 more)

### Community 9 - "profile/page.tsx"
Cohesion: 0.06
Nodes (69): PLATFORM_LABEL, ProfilePage(), Reveal(), Section(), AdminFilterDrawerProps, CancelForm(), CancelRequestSheet(), CancelRequestSheetProps (+61 more)

### Community 10 - "root-chrome.tsx"
Cohesion: 0.19
Nodes (12): AppShell(), AppShellProps, HIDDEN_MENU_PATHS, MobileShell(), MobileShellProps, StatusBarMock(), isAdminPath(), RootChrome() (+4 more)

### Community 11 - "providers/services/page.tsx"
Cohesion: 0.07
Nodes (49): clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage(), TabKey (+41 more)

### Community 12 - "admin-provider-detail-page.tsx"
Cohesion: 0.07
Nodes (52): AdminCatalogReorderRoutePage(), AdminProviderDetailRoutePage(), PageProps, AdminServiceRequestDetailRoutePage(), PageProps, AdminCatalogReorderPage(), moveItem(), AdminProviderDetailPage() (+44 more)

### Community 13 - "subscription/page.tsx"
Cohesion: 0.06
Nodes (56): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge() (+48 more)

### Community 14 - "admin-user-detail-page.tsx"
Cohesion: 0.17
Nodes (17): AdminUserDetailRoutePage(), PageProps, AdminUserDetailPage(), AdminUserDetailPageProps, MODERATION_OPTIONS, AdminModerationAction, AdminModerationActionSchema, AdminUserDetail (+9 more)

### Community 15 - "app-client.ts"
Cohesion: 0.09
Nodes (26): adminRequest(), buildUrl(), notifySessionExpired(), parseResponse(), recordAdminActivity(), APP_API_BASE, AppApiRequestOptions, appRequest() (+18 more)

### Community 16 - "security/index.ts"
Cohesion: 0.07
Nodes (50): POST, runtime, POST, runtime, DELETE, GET, runtime, DELETE (+42 more)

### Community 17 - "app-auth.service.ts"
Cohesion: 0.09
Nodes (39): APP_SESSION_POLICY, OTP_POLICY, isOtpResendCooldownActive(), isSessionWithinRefreshWindow(), otpResendRetryAfterSeconds(), assignSessionPublicId(), consumeAllLoginOtpsForPhone(), consumeOtpRecord() (+31 more)

### Community 18 - "subscriptions.service.ts"
Cohesion: 0.08
Nodes (60): GET, runtime, mapPrismaError(), runPaymentReconciliationJob(), phones, mapActiveSubscription(), mapPaymentDetail(), mapPaymentSummary() (+52 more)

### Community 19 - "provider.service.ts"
Cohesion: 0.06
Nodes (76): cache, CacheEntry, getCatalogCache(), setCatalogCache(), mapCategory(), mapService(), findActiveCategoryBySlug(), findActiveServiceBySlug() (+68 more)

### Community 20 - "subscriptions.schemas.ts"
Cohesion: 0.08
Nodes (30): runtime, runtime, runtime, POST, runtime, runtime, runtime, runtime (+22 more)

### Community 21 - "app-requests.ts"
Cohesion: 0.07
Nodes (51): isTakenByOther(), landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState (+43 more)

### Community 22 - "errors/index.ts"
Cohesion: 0.16
Nodes (14): TransactionClient, API_ERROR_CODES, ApiErrorCode, ApiErrorOptions, isRetryablePrismaConflict(), findSystemSetting(), listSystemSettings(), settingSelect (+6 more)

### Community 23 - "admin-management.service.ts"
Cohesion: 0.12
Nodes (44): revokeAllAdminSessions(), mapRole(), adminDetailSelect, adminSummarySelect, createRole(), findAdminByPublicId(), findAdminDetailByPublicId(), findPermissionsByCodes() (+36 more)

### Community 24 - "admin-admin-detail-page.tsx"
Cohesion: 0.09
Nodes (38): AdminAdminDetailRoutePage(), PageProps, AdminPermissionsRoutePage(), AdminRoleDetailRoutePage(), PageProps, AdminAdminDetailPage(), AdminAdminDetailPageProps, AdminPermissionsCatalogPage() (+30 more)

### Community 25 - "admin-audit.service.ts"
Cohesion: 0.06
Nodes (41): runtime, runtime, runtime, adminIdFromPath(), GET, runtime, runtime, auditLogIdFromPath() (+33 more)

### Community 26 - "toPersianDigits"
Cohesion: 0.08
Nodes (43): lucide-react, ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor() (+35 more)

### Community 27 - "notification.service.ts"
Cohesion: 0.08
Nodes (52): runNotificationDeliveriesJob(), runNotificationJobs(), ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), backoffMilliseconds(), deliverChannel(), isReadyForRetry() (+44 more)

### Community 28 - "jalali.ts"
Cohesion: 0.13
Nodes (28): DatePickerStep(), DatePickerStepProps, isoForOffset(), MAX_SEARCH_DATES, QUICK_DAYS, DayCellData, PersianCalendar, PersianCalendarProps (+20 more)

### Community 29 - "admins/v1/catalog/services/[serviceId]/route.ts"
Cohesion: 0.17
Nodes (12): runtime, runtime, runtime, AdminCatalogCategoriesQuerySchema, AdminCatalogReorderSchema, AdminCatalogServicesQuerySchema, AdminCategoryCreateSchema, AdminCategoryParamsSchema (+4 more)

### Community 30 - "provider-public-profile.tsx"
Cohesion: 0.09
Nodes (29): ProfileLayout(), ProvidersLayout(), UsersLayout(), viewport, ConsumerProviderProfileContent(), ConsumerProviderProfilePage(), isInternalPath(), safeResultsHref() (+21 more)

### Community 31 - "admins/v1/me/route.ts"
Cohesion: 0.09
Nodes (21): runtime, GET, mapCurrentAdmin(), runtime, GET, PATCH, runtime, runtime (+13 more)

### Community 32 - "admin-catalog.service.ts"
Cohesion: 0.14
Nodes (35): AdminCategoryRecord, AdminServiceRecord, mapAdminCategory(), mapAdminService(), categorySelect, countNonDeletedServicesInCategory(), countProviderServicesForCategory(), countProviderServicesForService() (+27 more)

### Community 33 - "db.ts"
Cohesion: 0.10
Nodes (25): adminPassword, adminPhone, createSearch(), getData(), idempotencyKey(), listCandidates(), mutation(), PROVIDER_PHONES (+17 more)

### Community 34 - "users/reports/page.tsx"
Cohesion: 0.06
Nodes (46): COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES, Reveal() (+38 more)

### Community 35 - "admin-auth.service.ts"
Cohesion: 0.13
Nodes (31): getDeviceFingerprint(), createAdminSession(), findAdminByPhoneForLogin(), getAdminPasswordMaterial(), getAdminSessionTiming(), getCurrentAdminProfile(), listActiveAdminSessions(), lockAdminForAuth() (+23 more)

### Community 36 - "admin-providers.service.ts"
Cohesion: 0.14
Nodes (32): AdminProviderDetailRecord, AdminProviderListRecord, AdminProviderServiceRecord, decimalToString(), mapAdminProviderDetail(), mapAdminProviderListItem(), mapAdminProviderService(), toString() (+24 more)

### Community 37 - "vitest"
Cohesion: 0.11
Nodes (26): vitest, RequestId, apiErrorResponse(), createHeaders(), finalizeApiResponse(), ApiRequestContext, ApiRouteHandler, normalizeError() (+18 more)

### Community 38 - "field-weather-card.tsx"
Cohesion: 0.07
Nodes (50): HomePage(), HomePageContent(), Reveal(), AdviceTile(), LandWeatherCard(), LandWeatherCardProps, AdviceRow(), FieldWeatherCard() (+42 more)

### Community 39 - "contracts/index.ts"
Cohesion: 0.14
Nodes (27): ADMIN_SESSION_POLICY, API_ROOTS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, SESSION_COOKIES, ApiErrorEnvelopeSchema, ApiErrorSchema, ApiFieldErrorsSchema (+19 more)

### Community 40 - "admin-subscriptions.service.ts"
Cohesion: 0.15
Nodes (31): mapAdminPaymentDetail(), mapAdminPaymentSummary(), mapAdminProviderSubscription(), mapAdminRefund(), mapAdminSubscriptionPlan(), money(), countActiveSubscriptionsForPlan(), createSubscriptionPlan() (+23 more)

### Community 41 - "[planId]/route.ts"
Cohesion: 0.10
Nodes (20): runtime, runtime, runtime, runtime, runtime, AdminCreateSubscriptionPlanSchema, AdminPaymentParamsSchema, AdminPaymentsQuerySchema (+12 more)

### Community 42 - "search-results-content.tsx"
Cohesion: 0.09
Nodes (29): CARD_STATE, describeSkipped(), LIST_ITEM_SPRING, OPEN_STATUSES, RequestBanner(), SearchResultsPage(), SearchSummary(), SortKey (+21 more)

### Community 43 - "reports.service.ts"
Cohesion: 0.07
Nodes (66): GET, runtime, runExportCleanupJob(), escapeCsvCell(), toCsv(), listPaymentsForExport(), listReportsForExport(), resolveRange() (+58 more)

### Community 44 - "scripts"
Cohesion: 0.06
Nodes (32): scripts, build, check:admin-list-perf, check:admin-load-budget, check:api-boundaries, check:api-contracts, check:frontend-security, check:no-mock-imports (+24 more)

### Community 45 - "generate-icons.mjs"
Cohesion: 0.23
Nodes (18): anyIconSvg(), appleIconSvg(), badgeSvg(), C, field(), generate(), ICONS_DIR, maskableIconSvg() (+10 more)

### Community 46 - "provider.schemas.ts"
Cohesion: 0.10
Nodes (20): AdminProviderApproveSchema, AdminProviderAvailabilitySchema, AdminProviderServiceParamsSchema, AdminProviderServicesQuerySchema, AdminProviderServiceUpdateSchema, AdminProvidersQuerySchema, AdminProviderUpdateSchema, LatitudeSchema (+12 more)

### Community 47 - "prisma.ts"
Cohesion: 0.07
Nodes (45): dotenv, baseUrl, names, requested, systemClock, databaseEnvironment, globalForPrisma, prisma (+37 more)

### Community 48 - "phase10.integration.test.ts"
Cohesion: 0.14
Nodes (24): adminPhones, phones, AdminModerationActionRecord, AdminUserDetailRecord, AdminUserListRecord, mapAdminModerationAction(), mapAdminUserDetail(), mapAdminUserListItem() (+16 more)

### Community 49 - "search.service.ts"
Cohesion: 0.08
Nodes (41): createPublicId(), encodeBase32(), createUser(), createUser(), cleanupAll(), cleanupUsers(), createLand(), createProvider() (+33 more)

### Community 50 - "idempotency.ts"
Cohesion: 0.16
Nodes (13): getAppIdempotencyService(), globalIdempotency, IdempotencyScope, IdempotencyService, IdempotencyStore, StoredIdempotencyResult, scope, MemoryIdempotencyStore (+5 more)

### Community 51 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, argon2, class-variance-authority, clsx, dotenv, farsi-tools, @fontsource-variable/vazirmatn, framer-motion (+20 more)

### Community 52 - "app-provider.tsx"
Cohesion: 0.17
Nodes (14): RootLayout(), AppProvider(), AppProviderProps, isAdminPath(), AppSplash(), POLLEN, EASE_GROW, SproutMark() (+6 more)

### Community 53 - "app-profile.service.ts"
Cohesion: 0.15
Nodes (21): GET, runtime, getCurrentUserProfile(), profileSelect, replaceCurrentUserImage(), updateCurrentUserProfile(), deleteCurrentUserImage(), hasValidImageSignature() (+13 more)

### Community 54 - "integrations/index.ts"
Cohesion: 0.09
Nodes (18): ConsoleSmsQueue, ObjectStorage, PaymentInitiation, PaymentProvider, SmsMessage, SmsProvider, SmsQueue, HttpObjectStorage (+10 more)

### Community 55 - "package.json"
Cohesion: 0.07
Nodes (26): eslintConfig, name, private, version, argon2, clsx, eslint, eslint-config-next (+18 more)

### Community 56 - "isApiClientError"
Cohesion: 0.05
Nodes (68): AdminConsoleLayout(), AdminChangePasswordPage(), onSubmit(), AdminMeForm(), onSave(), AdminMePage(), AdminMySessionsPage(), AdminLoginPage() (+60 more)

### Community 57 - "admin-notifications-page.tsx"
Cohesion: 0.04
Nodes (59): onConfirmSend(), isNotificationType(), parseIdList(), AdminCursorPaginationProps, CursorListResult, useAdminCursorQuery(), UseAdminCursorQueryOptions, AdminCursorMeta (+51 more)

### Community 58 - "session.service.ts"
Cohesion: 0.25
Nodes (13): findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup, UserSessionLookup, findActiveAdminSessionForToken(), findUserSessionForToken() (+5 more)

### Community 59 - "zod"
Cohesion: 0.16
Nodes (17): zod, authFormSchema, AuthFormValues, otpSchema, phoneSchema, geoLocationSchema, landFormSchema, CancelReasonFormValues (+9 more)

### Community 60 - "seed.ts"
Cohesion: 0.13
Nodes (24): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+16 more)

### Community 61 - "validate-api-contracts.mjs"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 62 - "admin-auth.integration.test.ts"
Cohesion: 0.14
Nodes (18): createAdmin(), phones, request(), countActiveSuperAdmins(), findAdminStatusTarget(), assertNotLastSuperAdminRemoval(), assertNotSelfDeactivation(), cache (+10 more)

### Community 63 - "default-rate-limiter.ts"
Cohesion: 0.19
Nodes (12): createRateLimiter(), getAppRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy (+4 more)

### Community 64 - "Keshavarz Agricultural Services Platform (Mock)"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "admin-jobs-page.tsx"
Cohesion: 0.16
Nodes (20): Page(), AdminJobsPage(), onReplay(), onRunJobs(), RUNNABLE_JOBS, ADMIN_JOB_LABELS, ADMIN_JOB_NAMES, AdminJobName (+12 more)

### Community 66 - "admins/v1/notifications/route.ts"
Cohesion: 0.20
Nodes (10): runtime, runtime, runtime, AdminNotificationsQuerySchema, AdminSendNotificationSchema, NotificationParamsSchema, NotificationsQuerySchema, NotificationTypeSchema (+2 more)

### Community 67 - "admin-audit.repository.ts"
Cohesion: 0.53
Nodes (3): redactAuditValue(), auditLogSelect, insertAdminAuditLog()

### Community 68 - "types/index.ts"
Cohesion: 0.04
Nodes (66): @neshan-maps-platform/maplibre-sdk, MAX_RADIUS_KM, MIN_RADIUS_KM, RADIUS_PRESETS, WorkAreaPanel(), WorkAreaPanelProps, inlineCenter(), LocationLabel() (+58 more)

### Community 69 - "consumer-request-card.tsx"
Cohesion: 0.14
Nodes (17): ConsumerRequestCard(), ConsumerRequestCardProps, FULL, STEPS, ActiveRequests(), ActiveRequestsProps, LiveClock(), LiveClockProps (+9 more)

### Community 70 - "generate-openapi.mjs"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "utils/format.ts"
Cohesion: 0.05
Nodes (75): framer-motion, EditLandPage(), NewLandPage(), ConsumerLandsPage(), SortKey, SORTS, ConsumerRequestDetailContent(), ConsumerRequestDetailPage() (+67 more)

### Community 72 - "form.tsx"
Cohesion: 0.21
Nodes (11): react-hook-form, FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue (+3 more)

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

### Community 77 - "request-taken-state.tsx"
Cohesion: 0.28
Nodes (11): DUST, Field(), LostRequestScene(), RequestSlip(), RequestTakenState(), SceneBackdrop(), SceneFrame(), Tractor() (+3 more)

### Community 78 - "cn"
Cohesion: 0.06
Nodes (48): class-variance-authority, AdminFilterChips(), AdminFilterChipsProps, AdminStatusBadgeProps, BadgeVariant, STATUS_TONES, DockItem, DockNavProps (+40 more)

### Community 79 - "public/settings/route.ts"
Cohesion: 0.26
Nodes (6): GET, runtime, listPublicSystemSettings(), publicSettingSelect, getPublicSettings(), mapPublicSetting()

### Community 80 - "use-price-input.ts"
Cohesion: 0.33
Nodes (9): persian-tools, formatToPersianWords(), formatWithCommas(), parseToRawNumber(), sanitizeInput(), toEnglishDigits(), toPersianDigits(), usePriceInput() (+1 more)

### Community 81 - "ref_node_path"
Cohesion: 0.07
Nodes (19): APP_VERSION, nextConfig, securityHeaders, projectRoot, bannedPatterns, collectTs(), failures, listsRoot (+11 more)

### Community 82 - "admin-data-table.tsx"
Cohesion: 0.26
Nodes (10): AdminColumnVisibilityMenuProps, AdminDataTableProps, Table(), TableBody(), TableCaption(), TableCell(), TableFooter(), TableHead() (+2 more)

### Community 83 - "admin-users.schemas.ts"
Cohesion: 0.18
Nodes (9): IsoUtcDateTimeSchema, createCursorPaginationSchema(), AdminAuditLogParamsSchema, AdminAuditLogsQuerySchema, AdminDashboardQuerySchema, AdminUserModerationActionSchema, AdminUserModerationActionsQuerySchema, AdminUsersQuerySchema (+1 more)

### Community 84 - "pwa-runtime.tsx"
Cohesion: 0.18
Nodes (16): applyUpdate(), offerUpdate(), PwaRuntime(), registerServiceWorker(), trackInstalling(), APP_INSTALLED_EVENT, BeforeInstallPromptEvent, detectPlatform() (+8 more)

### Community 85 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, sharp, tailwindcss, @tailwindcss/postcss (+6 more)

### Community 86 - "admin-management.mapper.ts"
Cohesion: 0.20
Nodes (11): AdminListRecord, AdminOverrideRecord, AdminRoleSummaryRecord, mapAdminDetail(), mapAdminSummary(), mapPermission(), mapRoleSummary(), PermissionListRecord (+3 more)

### Community 87 - "sw.js"
Cohesion: 0.29
Nodes (8): BYPASS_PREFIXES, cacheFirst(), CACHES, isCacheable(), LIMITS, PRECACHE_URLS, staleWhileRevalidate(), trim()

### Community 88 - "seed-worker.mts"
Cohesion: 0.28
Nodes (10): args, [command, ...rest], hashToken(), installAppSession(), makeOpaqueToken(), makePublicId(), seedAdmin(), seedApp() (+2 more)

### Community 89 - "getSecurityEnvironment"
Cohesion: 0.13
Nodes (16): getSecurityEnvironment(), throwSecurityEnvError(), runAppAuthCleanupJob(), createOtp(), phones, smsQueue, cleanupExpiredAppAuth(), createDownloadSignature() (+8 more)

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
Cohesion: 0.52
Nodes (5): ToastProvider(), topOffset(), subscribe(), useOnlineStatus(), setToasterMounted()

### Community 94 - "lands.schemas.ts"
Cohesion: 0.22
Nodes (8): DecimalStringSchema, AreaSchema, LandCreateSchema, LandParamsSchema, LandsQuerySchema, LandUpdateSchema, LatitudeSchema, LongitudeSchema

### Community 95 - "admin-auth.password.ts"
Cohesion: 0.36
Nodes (6): ADMIN_PASSWORD_POLICY, assertAdminPasswordPolicy(), COMMON_PASSWORDS, nextAdminLockoutSeconds(), createAdmin(), createManagedAdmin()

### Community 96 - "validate-no-mock-imports.mjs"
Cohesion: 0.25
Nodes (6): bannedRoots, collectFiles(), mockDir, projectRoot, supportedExtensions, violations

### Community 98 - "cities/route.ts"
Cohesion: 0.50
Nodes (3): GET, runtime, ProvinceIdParamSchema

### Community 99 - "validate-secret-scan.mjs"
Cohesion: 0.22
Nodes (8): allowlist, collectFiles(), patterns, projectRoot, scanRoots, skipDirectories, supportedExtensions, violations

### Community 100 - "admin-escalation-guards.test.ts"
Cohesion: 0.50
Nodes (3): regular, resolveContext, superAdmin

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 973 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Skeleton`, `requireAdminSession`, `apiSuccess`, `Button`, `react`, `useAuthStore`, `admin-command-palette.tsx`, `profile/page.tsx`, `root-chrome.tsx`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `admin-user-detail-page.tsx`, `security/index.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `subscriptions.schemas.ts`, `app-requests.ts`, `admin-admin-detail-page.tsx`, `admin-audit.service.ts`, `toPersianDigits`, `admins/v1/catalog/services/[serviceId]/route.ts`, `provider-public-profile.tsx`, `admins/v1/me/route.ts`, `users/reports/page.tsx`, `admin-auth.service.ts`, `vitest`, `field-weather-card.tsx`, `[planId]/route.ts`, `search-results-content.tsx`, `reports.service.ts`, `app-provider.tsx`, `app-profile.service.ts`, `package.json`, `isApiClientError`, `session.service.ts`, `admin-auth.integration.test.ts`, `admins/v1/notifications/route.ts`, `types/index.ts`, `consumer-request-card.tsx`, `utils/format.ts`, `app/layout.tsx`, `request-taken-state.tsx`, `cn`, `public/settings/route.ts`, `ref_node_path`, `getSecurityEnvironment`, `health/route.ts`, `cities/route.ts`, `admins/layout.tsx`?**
  _High betweenness centrality (0.407) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `farsi-tools` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Skeleton` be split into smaller, more focused modules?**
  _Cohesion score 0.039123062015503876 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `zod` to `Skeleton`, `requireAdminSession`, `apiSuccess`, `Button`, `react`, `useAuthStore`, `next`, `profile/page.tsx`, `providers/services/page.tsx`, `admin-provider-detail-page.tsx`, `subscription/page.tsx`, `admin-user-detail-page.tsx`, `app-client.ts`, `security/index.ts`, `subscriptions.schemas.ts`, `app-requests.ts`, `admin-admin-detail-page.tsx`, `admin-audit.service.ts`, `toPersianDigits`, `admins/v1/catalog/services/[serviceId]/route.ts`, `provider-public-profile.tsx`, `admins/v1/me/route.ts`, `users/reports/page.tsx`, `contracts/index.ts`, `[planId]/route.ts`, `reports.service.ts`, `provider.schemas.ts`, `prisma.ts`, `package.json`, `isApiClientError`, `admin-notifications-page.tsx`, `admin-jobs-page.tsx`, `admins/v1/notifications/route.ts`, `utils/format.ts`, `admin-users.schemas.ts`, `health/route.ts`, `lands.schemas.ts`, `cities/route.ts`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `requireAdminSession` be split into smaller, more focused modules?**
  _Cohesion score 0.0817347789824854 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `ApiError` to `requireAdminSession`, `apiSuccess`, `next`, `security/index.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `provider.service.ts`, `errors/index.ts`, `admin-management.service.ts`, `admin-audit.service.ts`, `notification.service.ts`, `admin-catalog.service.ts`, `admin-auth.service.ts`, `admin-providers.service.ts`, `vitest`, `admin-subscriptions.service.ts`, `reports.service.ts`, `prisma.ts`, `phase10.integration.test.ts`, `search.service.ts`, `idempotency.ts`, `app-profile.service.ts`, `session.service.ts`, `admin-auth.integration.test.ts`, `default-rate-limiter.ts`, `getSecurityEnvironment`, `admin-auth.password.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._