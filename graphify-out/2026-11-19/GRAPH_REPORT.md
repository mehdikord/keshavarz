# Graph Report - keshavarz  (2026-11-19)

## Corpus Check
- 624 files · ~569,068 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: (none) 8, .css 2, .example 1)

## Summary
- 3709 nodes · 13440 edges · 109 communities (99 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6791d5bf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dashboard-sections.tsx
- faNumber
- apiSuccess
- catalog-admin.service.ts
- providers-admin.service.ts
- utils/format.ts
- cn
- billing.service.ts
- request.service.ts
- app-menu.tsx
- billing.schemas.ts
- providers/services/page.tsx
- field-weather-card.tsx
- subscription/page.tsx
- app-profile.service.ts
- envelope.ts
- security/index.ts
- app-auth.service.ts
- subscriptions.service.ts
- provider.service.ts
- parseJsonBody
- getSecurityEnvironment
- ApiError
- admin.integration.test.ts
- catalog-admin.schemas.ts
- sidebar.tsx
- toPersianDigits
- notification.service.ts
- jalali.ts
- profile/page.tsx
- AppMenuTrigger
- lucide-react
- [userId]/page.tsx
- db.ts
- users/reports/page.tsx
- admin-auth.service.ts
- users.repository.ts
- contracts/index.ts
- route-handler.ts
- geo-data.ts
- Button
- toast.ts
- validate-prisma-foundation.mjs
- reports.service.ts
- scripts
- generate-icons.mjs
- requireUserSession
- runner.ts
- dotenv
- createPublicId
- idempotency.ts
- dependencies
- app-provider.tsx
- next.config.ts
- integrations/index.ts
- package.json
- search/page.tsx
- phase06.integration.test.ts
- session.service.ts
- zod
- seed.ts
- validate-api-contracts.mjs
- @playwright/test
- default-rate-limiter.ts
- Keshavarz Agricultural Services Platform (Mock)
- observability/index.ts
- parseWithSchema
- payments/page.tsx
- neshan-map.tsx
- login-screen.tsx
- generate-openapi.mjs
- app-requests.ts
- form.tsx
- compilerOptions
- components.json
- app/layout.tsx
- users.service.ts
- request-taken-state.tsx
- users.schemas.ts
- requests-admin.service.ts
- subscription/plans/route.ts
- ref_node_path
- dashboard.service.ts
- pwa-runtime.tsx
- devDependencies
- admins/layout.tsx
- sw.js
- seed-worker.mts
- satellite-imagery.ts
- validate-api-boundaries.mjs
- health/route.ts
- validate-no-mock-imports.mjs
- types/index.ts
- metrics.ts
- validate-secret-scan.mjs
- [landId]/route.ts
- PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)
- Skeleton
- Graphify Knowledge Graph (graphify-out)
- otp-test.mjs
- File Document Icon (Next.js starter)
- postcss.config.mjs
- Next.js Wordmark Logo
- persian-tools.d.ts
- Keshavarz App Icon (green gradient plant/leaf)
- next
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 355 edges
2. `next` - 232 edges
3. `apiSuccess()` - 222 edges
4. `ApiError` - 164 edges
5. `lucide-react` - 136 edges
6. `react` - 117 edges
7. `requireUserSession()` - 115 edges
8. `parseWithSchema()` - 110 edges
9. `withApiHandler()` - 107 edges
10. `parseJsonBody()` - 105 edges

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

## Communities (109 total, 10 thin omitted)

### Community 0 - "dashboard-sections.tsx"
Cohesion: 0.18
Nodes (23): AdminDashboardPage(), greeting(), metadata, AttentionList(), BarList(), KpiStrip(), ProvinceSpread(), RecentRequests() (+15 more)

### Community 1 - "faNumber"
Cohesion: 0.06
Nodes (126): AdminPaymentPage(), Code(), metadata, AdminProviderDetailPage(), Params, SearchParams, AdminRequestDetailPage(), Params (+118 more)

### Community 2 - "apiSuccess"
Cohesion: 0.05
Nodes (66): GET, runtime, GET, runtime, GET, runtime, GET, GET (+58 more)

### Community 3 - "catalog-admin.service.ts"
Cohesion: 0.08
Nodes (72): runInTransaction(), removeImageQuietly(), resolveImageStorage(), recordAdminAudit(), cleanup(), PNG, request, CATEGORY_SELECT (+64 more)

### Community 4 - "providers-admin.service.ts"
Cohesion: 0.05
Nodes (84): generateMetadata(), request, SERVICE_SLUGS, activeSubscriptionWhere(), baseWhere(), countCompletedJobs(), countProvidersPerTab(), Db (+76 more)

### Community 5 - "utils/format.ts"
Cohesion: 0.06
Nodes (53): AuthPage(), AuthPageContent(), STAGE_COPY, ProfileLayout(), SearchResultsRoutePage(), Crop(), FarmScene(), FarmStage (+45 more)

### Community 6 - "cn"
Cohesion: 0.06
Nodes (48): class-variance-authority, radix-ui, react, normalizeSearchText(), SearchableSelect(), SearchableSelectOption, SearchableSelectProps, BreadcrumbEllipsis() (+40 more)

### Community 7 - "billing.service.ts"
Cohesion: 0.06
Nodes (73): request, cancelOpenPaymentsOfSubscription(), cancelSubscriptionRow(), countOpenSubscriptionsForPlan(), countPaymentsPerStatus(), countSubscriptionsPerPlan(), countSubscriptionsPerStatus(), Db (+65 more)

### Community 8 - "request.service.ts"
Cohesion: 0.11
Nodes (48): completeAdminRequest(), canRevealContact(), decimal(), mapConsumerRequestDetail(), mapConsumerRequestSummary(), mapProviderLink(), mapProviderRequestDetail(), mapProviderRequestSummary() (+40 more)

### Community 9 - "app-menu.tsx"
Cohesion: 0.05
Nodes (80): persian-tools, zustand, CancelForm(), CancelRequestSheet(), CancelRequestSheetProps, DEFAULT_CANCEL_REASON, REASONS, AppMenu() (+72 more)

### Community 10 - "billing.schemas.ts"
Cohesion: 0.06
Nodes (36): DELETE, params(), PATCH, runtime, POST, runtime, GET, POST (+28 more)

### Community 11 - "providers/services/page.tsx"
Cohesion: 0.08
Nodes (42): clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage(), TabKey (+34 more)

### Community 12 - "field-weather-card.tsx"
Cohesion: 0.07
Nodes (54): HomePage(), HomePageContent(), Reveal(), AdviceTile(), LandWeatherCard(), LandWeatherCardProps, AdviceRow(), FieldWeatherCard() (+46 more)

### Community 13 - "subscription/page.tsx"
Cohesion: 0.06
Nodes (56): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge() (+48 more)

### Community 14 - "app-profile.service.ts"
Cohesion: 0.15
Nodes (21): GET, runtime, getCurrentUserProfile(), profileSelect, replaceCurrentUserImage(), updateCurrentUserProfile(), deleteCurrentUserImage(), hasValidImageSignature() (+13 more)

### Community 15 - "envelope.ts"
Cohesion: 0.12
Nodes (24): adminRequest(), APP_API_BASE, AppApiRequestOptions, appRequest(), buildUrl(), notifyUnauthorized(), parseResponse(), QueryValue (+16 more)

### Community 16 - "security/index.ts"
Cohesion: 0.07
Nodes (43): POST, runtime, POST, runtime, POST, runtime, runtime, POST (+35 more)

### Community 17 - "app-auth.service.ts"
Cohesion: 0.08
Nodes (44): APP_SESSION_POLICY, OTP_POLICY, runAppAuthCleanupJob(), createOtp(), phones, smsQueue, isOtpResendCooldownActive(), isSessionWithinRefreshWindow() (+36 more)

### Community 18 - "subscriptions.service.ts"
Cohesion: 0.13
Nodes (36): mapActiveSubscription(), mapPaymentDetail(), mapPaymentSummary(), mapPurchaseResult(), mapSubscriptionHistoryItem(), mapSubscriptionPlan(), money(), activateSubscriptionAndPayment() (+28 more)

### Community 19 - "provider.service.ts"
Cohesion: 0.06
Nodes (78): cache, CacheEntry, getCatalogCache(), setCatalogCache(), mapCategory(), mapService(), findActiveCategoryBySlug(), findActiveServiceBySlug() (+70 more)

### Community 20 - "parseJsonBody"
Cohesion: 0.11
Nodes (23): POST, runtime, GET, runtime, POST, runtime, POST, runtime (+15 more)

### Community 21 - "getSecurityEnvironment"
Cohesion: 0.17
Nodes (7): getSecurityEnvironment(), throwSecurityEnvError(), HttpObjectStorage, ObjectStorageUnavailableError, LocalObjectStorage, resolveStorage(), resolveGalleryStorage()

### Community 22 - "ApiError"
Cohesion: 0.17
Nodes (17): API_ERROR_CODES, ApiError, ApiErrorCode, ApiErrorOptions, isRetryablePrismaConflict(), mapPrismaError(), normalizeError(), hasValidImageSignature() (+9 more)

### Community 23 - "admin.integration.test.ts"
Cohesion: 0.15
Nodes (21): request, endModerationAction(), findCityProvince(), findUserByPhone(), findUserIdentity(), insertModerationAction(), insertUserNote(), lockUserForUpdate() (+13 more)

### Community 24 - "catalog-admin.schemas.ts"
Cohesion: 0.06
Nodes (38): DELETE, params(), PATCH, runtime, POST, runtime, GET, POST (+30 more)

### Community 25 - "sidebar.tsx"
Cohesion: 0.11
Nodes (27): AdminPanelLayout(), AdminViewerProvider(), AdminViewerSummary, useAdminViewer(), AdminShell(), CommandPalette(), go(), onKeyDown() (+19 more)

### Community 26 - "toPersianDigits"
Cohesion: 0.05
Nodes (64): ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor(), Reveal() (+56 more)

### Community 27 - "notification.service.ts"
Cohesion: 0.09
Nodes (40): systemClock, runNotificationDeliveriesJob(), runNotificationJobs(), ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), backoffMilliseconds(), deliverChannel() (+32 more)

### Community 28 - "jalali.ts"
Cohesion: 0.07
Nodes (42): ProvidersLayout(), UsersLayout(), viewport, ConsumerDock(), DatePickerStep(), DatePickerStepProps, isoForOffset(), MAX_SEARCH_DATES (+34 more)

### Community 29 - "profile/page.tsx"
Cohesion: 0.10
Nodes (33): PLATFORM_LABEL, ProfilePage(), Reveal(), Section(), CatalogTree, ServicePicker(), ServicePickerProps, Select() (+25 more)

### Community 30 - "AppMenuTrigger"
Cohesion: 0.10
Nodes (25): AppMenuTrigger(), AppMenuTriggerProps, PageHeader(), PageHeaderProps, DashboardHero(), DashboardHeroProps, MONTH_NAME, ProviderHeroStat (+17 more)

### Community 31 - "lucide-react"
Cohesion: 0.20
Nodes (14): lucide-react, AdminPaymentNotFound(), AdminPanelError(), ProviderNotFound(), RequestNotFound(), AdminUserNotFound(), GalleryImage, parseCoordinate() (+6 more)

### Community 32 - "[userId]/page.tsx"
Cohesion: 0.13
Nodes (25): AdminUserDetailPage(), first(), generateMetadata(), Params, SearchParams, listProvinceOptions(), listUserLands(), listUserNotifications() (+17 more)

### Community 33 - "db.ts"
Cohesion: 0.15
Nodes (20): createSearch(), getData(), idempotencyKey(), listCandidates(), mutation(), PROVIDER_PHONES, sendTo(), tomorrow() (+12 more)

### Community 34 - "users/reports/page.tsx"
Cohesion: 0.06
Nodes (45): COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES, Reveal() (+37 more)

### Community 35 - "admin-auth.service.ts"
Cohesion: 0.16
Nodes (22): AdminAccess, AdminAuthContext, getClientIp(), getDeviceFingerprint(), getUserAgent(), AdminRequestActor, createAdminSessionRow(), findAdminForLogin() (+14 more)

### Community 36 - "users.repository.ts"
Cohesion: 0.20
Nodes (15): activeRestrictionWhere(), buildUserWhere(), countUsersPerStatus(), findActiveRestrictions(), findUserCore(), listUserNotes(), listUsers(), loadRecentActivity() (+7 more)

### Community 37 - "contracts/index.ts"
Cohesion: 0.14
Nodes (29): ADMIN_PASSWORD_POLICY, ADMIN_SESSION_POLICY, API_ROOTS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, SESSION_COOKIES, ApiErrorEnvelopeSchema, ApiErrorSchema (+21 more)

### Community 38 - "route-handler.ts"
Cohesion: 0.26
Nodes (7): RequestId, apiErrorResponse(), createHeaders(), finalizeApiResponse(), ApiRequestContext, ApiRouteHandler, Logger

### Community 39 - "geo-data.ts"
Cohesion: 0.30
Nodes (12): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+4 more)

### Community 40 - "Button"
Cohesion: 0.06
Nodes (101): DurationField(), durationPayload(), DurationValue, GrantForm(), submit(), GrantPlanOption, GrantProvider, GrantSubscriptionButton() (+93 more)

### Community 41 - "toast.ts"
Cohesion: 0.31
Nodes (7): sonner, ToastProvider(), topOffset(), subscribe(), useOnlineStatus(), pendingToasts, setToasterMounted()

### Community 42 - "validate-prisma-foundation.mjs"
Cohesion: 0.20
Nodes (8): envExamplePath, migrationPath, migrationTables, packageJson, packagePath, projectRoot, referencePath, schemaPath

### Community 43 - "reports.service.ts"
Cohesion: 0.25
Nodes (18): phones, findConsumerTopLand(), findConsumerTopService(), findOwnedLandIdByPublicId(), findProviderProfileIdByUserId(), findProviderTopService(), findServiceIdBySlug(), listConsumerMonthlyCosts() (+10 more)

### Community 44 - "scripts"
Cohesion: 0.07
Nodes (29): scripts, build, check:api-boundaries, check:api-contracts, check:frontend-security, check:no-mock-imports, check:prisma-foundation, check:secret-scan (+21 more)

### Community 45 - "generate-icons.mjs"
Cohesion: 0.23
Nodes (18): anyIconSvg(), appleIconSvg(), badgeSvg(), C, field(), generate(), ICONS_DIR, maskableIconSvg() (+10 more)

### Community 46 - "requireUserSession"
Cohesion: 0.05
Nodes (91): GET, runtime, DELETE, runtime, DELETE, runtime, POST, runtime (+83 more)

### Community 47 - "runner.ts"
Cohesion: 0.17
Nodes (17): names, requested, JOB_NAMES, JobName, JobRunRecord, JobRunResult, releaseLease(), runJobs() (+9 more)

### Community 48 - "dotenv"
Cohesion: 0.25
Nodes (3): dotenv, prisma, baseUrl

### Community 49 - "createPublicId"
Cohesion: 0.09
Nodes (39): createPublicId(), encodeBase32(), createUser(), cleanupAll(), cleanupUsers(), createLand(), createProvider(), createUser() (+31 more)

### Community 50 - "idempotency.ts"
Cohesion: 0.16
Nodes (13): getAppIdempotencyService(), globalIdempotency, IdempotencyScope, IdempotencyService, IdempotencyStore, StoredIdempotencyResult, scope, MemoryIdempotencyStore (+5 more)

### Community 51 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, argon2, class-variance-authority, clsx, dotenv, farsi-tools, @fontsource-variable/vazirmatn, framer-motion (+20 more)

### Community 52 - "app-provider.tsx"
Cohesion: 0.24
Nodes (9): RootLayout(), AppProvider(), AppProviderProps, isAdminPath(), AppSplash(), POLLEN, EASE_GROW, SproutMark() (+1 more)

### Community 53 - "next.config.ts"
Cohesion: 0.33
Nodes (3): APP_VERSION, nextConfig, securityHeaders

### Community 54 - "integrations/index.ts"
Cohesion: 0.11
Nodes (15): ConsoleSmsQueue, ObjectStorage, PaymentInitiation, PaymentProvider, SmsMessage, SmsProvider, SmsQueue, PutResponse (+7 more)

### Community 55 - "package.json"
Cohesion: 0.07
Nodes (26): eslintConfig, name, private, version, argon2, clsx, eslint, eslint-config-next (+18 more)

### Community 56 - "search/page.tsx"
Cohesion: 0.05
Nodes (87): framer-motion, EditLandPage(), NewLandPage(), ConsumerLandsPage(), SortKey, SORTS, ConsumerProviderProfileContent(), ConsumerProviderProfilePage() (+79 more)

### Community 57 - "phase06.integration.test.ts"
Cohesion: 0.40
Nodes (3): createUser(), phones, setPaymentProviderForTests()

### Community 58 - "session.service.ts"
Cohesion: 0.11
Nodes (25): AdminSessionLookup, findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup, touchAdminSession(), UserSessionLookup (+17 more)

### Community 59 - "zod"
Cohesion: 0.14
Nodes (18): zod, PublicSetting, PublicSettingSchema, SETTING_VALUE_TYPES, authFormSchema, AuthFormValues, otpSchema, phoneSchema (+10 more)

### Community 60 - "seed.ts"
Cohesion: 0.20
Nodes (12): catalog, main(), permissionCodes, prisma, seedBootstrapAdmin(), seedCatalog(), seedDir, seedPermissions() (+4 more)

### Community 61 - "validate-api-contracts.mjs"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 63 - "default-rate-limiter.ts"
Cohesion: 0.19
Nodes (12): createRateLimiter(), getAppRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy (+4 more)

### Community 64 - "Keshavarz Agricultural Services Platform (Mock)"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "observability/index.ts"
Cohesion: 0.18
Nodes (17): createLogger(), LogAttributes, LogLevel, redact(), redactLogValue(), writeLog(), observeLatencyMs(), createRequestId() (+9 more)

### Community 66 - "parseWithSchema"
Cohesion: 0.04
Nodes (102): POST, runtime, GET, runtime, GET, POST, runtime, POST (+94 more)

### Community 67 - "payments/page.tsx"
Cohesion: 0.11
Nodes (51): AdminPaymentsPage(), metadata, Stat(), AdminPlansPage(), metadata, AdminSubscriptionsPage(), metadata, AdminCategoriesPage() (+43 more)

### Community 68 - "neshan-map.tsx"
Cohesion: 0.10
Nodes (26): @neshan-maps-platform/maplibre-sdk, LAYER_ICONS, MapMarker, NeshanMap(), NeshanMapInstance, NeshanSdk, pinElement(), DEFAULT_MAP_CENTER (+18 more)

### Community 69 - "login-screen.tsx"
Cohesion: 0.25
Nodes (11): AdminLoginPage(), metadata, AdminLoginScreen(), onSubmit(), FieldRows(), BrandMark(), run(), errorMessage() (+3 more)

### Community 70 - "generate-openapi.mjs"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "app-requests.ts"
Cohesion: 0.04
Nodes (98): isTakenByOther(), landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState (+90 more)

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
Cohesion: 0.21
Nodes (7): @fontsource-variable/vazirmatn, viewport, metadata, viewport, APPLE_STARTUP_IMAGES, PWA_BRAND, STATUS_BAR_COLORS

### Community 76 - "users.service.ts"
Cohesion: 0.10
Nodes (25): findLocationNames(), findUserNote(), listModerationHistory(), listRecentOtpAttempts(), listUserSessions(), updateUserNote(), ActivityKind, Actor (+17 more)

### Community 77 - "request-taken-state.tsx"
Cohesion: 0.28
Nodes (11): DUST, Field(), LostRequestScene(), RequestSlip(), RequestTakenState(), SceneBackdrop(), SceneFrame(), Tractor() (+3 more)

### Community 78 - "users.schemas.ts"
Cohesion: 0.12
Nodes (17): MODERATION_ACTIONS, ModerationAction, toLatinDigits(), USER_LIST_PAGE_SIZES, USER_LIST_SORTS, USER_STATUSES, UserDeleteSchema, UserModerationInput (+9 more)

### Community 79 - "requests-admin.service.ts"
Cohesion: 0.06
Nodes (50): vitest, generateMetadata(), databaseEnvironment, globalForPrisma, prisma, TransactionClient, AdminAuditRow, insertAdminAuditLog() (+42 more)

### Community 80 - "subscription/plans/route.ts"
Cohesion: 0.67
Nodes (3): GET, runtime, listSubscriptionPlans()

### Community 81 - "ref_node_path"
Cohesion: 0.11
Nodes (11): projectRoot, banned, collectFiles(), projectRoot, scanRoots, supportedExtensions, violations, SCREENSHOTS (+3 more)

### Community 83 - "dashboard.service.ts"
Cohesion: 0.24
Nodes (17): activeRestriction(), countPendingProviders(), countRequestMetrics(), countUserMetrics(), DailyRow, loadDailySeries(), loadRecentRequests(), loadRecentUsers() (+9 more)

### Community 84 - "pwa-runtime.tsx"
Cohesion: 0.26
Nodes (13): applyUpdate(), offerUpdate(), PwaRuntime(), registerServiceWorker(), trackInstalling(), APP_INSTALLED_EVENT, detectPlatform(), INSTALL_AVAILABLE_EVENT (+5 more)

### Community 85 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, sharp, tailwindcss, @tailwindcss/postcss (+6 more)

### Community 86 - "admins/layout.tsx"
Cohesion: 0.27
Nodes (8): AdminsLayout(), metadata, readTheme(), viewport, AdminTheme, AdminThemeRoot(), ThemeContext, ADMIN_THEME_COOKIE

### Community 87 - "sw.js"
Cohesion: 0.29
Nodes (8): BYPASS_PREFIXES, cacheFirst(), CACHES, isCacheable(), LIMITS, PRECACHE_URLS, staleWhileRevalidate(), trim()

### Community 88 - "seed-worker.mts"
Cohesion: 0.27
Nodes (9): args, [command, ...rest], hashToken(), installAppSession(), makeOpaqueToken(), makePublicId(), seedApp(), seedProvider() (+1 more)

### Community 90 - "satellite-imagery.ts"
Cohesion: 0.33
Nodes (6): fallback, ParsimapStyle, resolveSatelliteImagery(), SATELLITE_IMAGERY_TOKEN, SatelliteImagery, withToken()

### Community 91 - "validate-api-boundaries.mjs"
Cohesion: 0.18
Nodes (9): collectFiles(), fail(), graph, projectRoot, sourceRoot, supportedExtensions, visit(), visited (+1 more)

### Community 92 - "health/route.ts"
Cohesion: 0.29
Nodes (8): GET, runtime, HealthResponse, HealthResponseSchema, mapHealthResponse(), checkDatabaseConnection(), getApiHealth(), HealthResult

### Community 96 - "validate-no-mock-imports.mjs"
Cohesion: 0.25
Nodes (6): bannedRoots, collectFiles(), mockDir, projectRoot, supportedExtensions, violations

### Community 97 - "types/index.ts"
Cohesion: 0.11
Nodes (20): MapPickerProps, NeshanMapProps, haversineKm(), toRadians(), GeoLocation, Notification, NotificationType, OfferedService (+12 more)

### Community 98 - "metrics.ts"
Cohesion: 0.22
Nodes (12): DeadLetterEntry, enqueuePaymentCallbackDeadLetter(), nextId(), queue, AlertType, emitAlert(), CounterMap, counters (+4 more)

### Community 99 - "validate-secret-scan.mjs"
Cohesion: 0.22
Nodes (8): allowlist, collectFiles(), patterns, projectRoot, scanRoots, skipDirectories, supportedExtensions, violations

### Community 102 - "[landId]/route.ts"
Cohesion: 0.16
Nodes (15): DELETE, GET, landIdFromPath(), PATCH, runtime, GET, POST, runtime (+7 more)

### Community 103 - "PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)"
Cohesion: 0.50
Nodes (4): Apple Touch Icon (180px, green goblet-with-hat logo), PWA Icon 192px (green goblet-with-hat logo), PWA Icon 512px (green goblet-with-hat logo), PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)

### Community 104 - "Skeleton"
Cohesion: 0.14
Nodes (14): Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), AdminPanelLoading(), Loading() (+6 more)

### Community 108 - "File Document Icon (Next.js starter)"
Cohesion: 0.67
Nodes (3): File Document Icon (Next.js starter), Globe Icon (Next.js starter), Browser Window Icon (Next.js starter)

### Community 114 - "next"
Cohesion: 0.17
Nodes (6): next, GET, providerIdFromPath(), runtime, config, PublicProviderParamsSchema

## Ambiguous Edges - Review These
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` → `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **29 isolated node(s):** `@hookform/resolvers`, `@prisma/client`, `farsi-tools`, `mariadb`, `next-themes` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 946 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `dashboard-sections.tsx`, `faNumber`, `apiSuccess`, `catalog-admin.service.ts`, `providers-admin.service.ts`, `utils/format.ts`, `billing.service.ts`, `app-menu.tsx`, `billing.schemas.ts`, `providers/services/page.tsx`, `field-weather-card.tsx`, `subscription/page.tsx`, `app-profile.service.ts`, `security/index.ts`, `app-auth.service.ts`, `parseJsonBody`, `ApiError`, `admin.integration.test.ts`, `catalog-admin.schemas.ts`, `sidebar.tsx`, `toPersianDigits`, `jalali.ts`, `profile/page.tsx`, `AppMenuTrigger`, `lucide-react`, `[userId]/page.tsx`, `users/reports/page.tsx`, `admin-auth.service.ts`, `route-handler.ts`, `Button`, `requireUserSession`, `app-provider.tsx`, `next.config.ts`, `package.json`, `search/page.tsx`, `session.service.ts`, `parseWithSchema`, `payments/page.tsx`, `neshan-map.tsx`, `login-screen.tsx`, `app-requests.ts`, `app/layout.tsx`, `users.service.ts`, `request-taken-state.tsx`, `requests-admin.service.ts`, `subscription/plans/route.ts`, `ref_node_path`, `admins/layout.tsx`, `health/route.ts`, `[landId]/route.ts`?**
  _High betweenness centrality (0.373) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `farsi-tools` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `faNumber` be split into smaller, more focused modules?**
  _Cohesion score 0.05626034197462769 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `dashboard-sections.tsx`, `faNumber`, `utils/format.ts`, `app-menu.tsx`, `providers/services/page.tsx`, `field-weather-card.tsx`, `subscription/page.tsx`, `sidebar.tsx`, `toPersianDigits`, `jalali.ts`, `profile/page.tsx`, `AppMenuTrigger`, `lucide-react`, `users/reports/page.tsx`, `Button`, `search/page.tsx`, `payments/page.tsx`, `neshan-map.tsx`, `login-screen.tsx`, `app-requests.ts`, `form.tsx`, `Skeleton`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `apiSuccess` be split into smaller, more focused modules?**
  _Cohesion score 0.04706163401815576 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `ApiError` to `apiSuccess`, `catalog-admin.service.ts`, `providers-admin.service.ts`, `billing.service.ts`, `request.service.ts`, `app-profile.service.ts`, `security/index.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `provider.service.ts`, `parseJsonBody`, `getSecurityEnvironment`, `admin.integration.test.ts`, `notification.service.ts`, `admin-auth.service.ts`, `route-handler.ts`, `reports.service.ts`, `requireUserSession`, `createPublicId`, `idempotency.ts`, `session.service.ts`, `default-rate-limiter.ts`, `parseWithSchema`, `users.service.ts`, `requests-admin.service.ts`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._