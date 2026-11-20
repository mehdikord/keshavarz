# Graph Report - keshavarz  (2026-11-19)

## Corpus Check
- 755 files · ~623,102 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: (none) 8, .css 3, .example 1)

## Summary
- 4502 nodes · 17358 edges · 133 communities (118 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6791d5bf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin/format.ts
- EmptyState
- apiSuccess
- catalog-admin.service.ts
- providers-admin.schemas.ts
- utils/format.ts
- cn
- billing.service.ts
- ApiError
- app-menu.tsx
- billing.schemas.ts
- providers/services/page.tsx
- types/index.ts
- subscription/page.tsx
- app-profile.service.ts
- envelope.ts
- me/route.ts
- app-auth.service.ts
- subscriptions.service.ts
- provider.service.ts
- subscriptions.schemas.ts
- getSecurityEnvironment
- errors/index.ts
- team.service.ts
- catalog-admin.schemas.ts
- command-palette.tsx
- toPersianDigits
- notification.service.ts
- jalali.ts
- profile/page.tsx
- parseWithSchema
- lucide-react
- Badge
- db.ts
- search/page.tsx
- admin-auth.service.ts
- notifications-admin.service.ts
- contracts/index.ts
- useCan
- geo-data.ts
- Button
- root-chrome.tsx
- validate-prisma-foundation.mjs
- reports.service.ts
- scripts
- generate-icons.mjs
- security/index.ts
- prisma.ts
- settings-admin.service.ts
- createPublicId
- idempotency.ts
- dependencies
- app-provider.tsx
- next.config.ts
- integrations/index.ts
- package.json
- provider-public-profile.tsx
- reports-admin.service.ts
- session.service.ts
- zod
- seed.ts
- validate-api-contracts.mjs
- team.schemas.ts
- default-rate-limiter.ts
- Keshavarz Agricultural Services Platform (Mock)
- observability/index.ts
- next
- Panel
- map-picker.tsx
- api.ts
- generate-openapi.mjs
- app-requests.ts
- team.repository.ts
- compilerOptions
- components.json
- app/layout.tsx
- users.service.ts
- request-taken-state.tsx
- users.schemas.ts
- requests-admin.service.ts
- (panel)/reports/page.tsx
- ref_node_path
- report-period.ts
- dashboard.service.ts
- pwa-runtime.tsx
- devDependencies
- provider-detail.tsx
- sw.js
- seed-worker.mts
- request-detail.tsx
- faNumber
- validate-api-boundaries.mjs
- health/route.ts
- providers-admin.service.ts
- admin-access-panels.tsx
- reports-admin.export.ts
- billing.repository.ts
- providers-admin.integration.test.ts
- report-format.ts
- validate-secret-scan.mjs
- grantAdminSubscription
- [landId]/route.ts
- PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)
- Skeleton
- Graphify Knowledge Graph (graphify-out)
- catalog.service.ts
- otp-test.mjs
- File Document Icon (Next.js starter)
- postcss.config.mjs
- Next.js Wordmark Logo
- persian-tools.d.ts
- Keshavarz App Icon (green gradient plant/leaf)
- proxy.ts
- lands.service.ts
- AGENTS.md
- providers-admin.repository.ts
- crypto.ts
- reports-admin.schemas.ts
- use-price-input.ts
- listAdminSubscriptions
- billing.integration.test.ts
- settings-section-form.tsx
- addAdminProviderService
- deleteAdminPlan
- reports.schemas.ts
- billing-labels.ts
- api-error.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 406 edges
2. `next` - 312 edges
3. `apiSuccess()` - 291 edges
4. `ApiError` - 197 edges
5. `lucide-react` - 170 edges
6. `faNumber()` - 147 edges
7. `parseJsonBody()` - 140 edges
8. `withApiHandler()` - 139 edges
9. `parseWithSchema()` - 136 edges
10. `react` - 134 edges

## Surprising Connections (you probably didn't know these)
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` --conceptually_related_to--> `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md → src/test/fixtures/README.md
- `allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver)` --conceptually_related_to--> `schema.prisma (31 tables, type-safe mapping)`  [INFERRED]
  pnpm-workspace.yaml → prisma/README.md
- `Prisma/DB commands (validate, generate, migrate deploy, drift, seed)` --conceptually_related_to--> `Server module integration tests (*.integration.test.ts plant own rows)`  [INFERRED]
  prisma/README.md → src/test/fixtures/README.md
- `send()` --calls--> `faNumber()`  [EXTRACTED]
  src/components/admin/notifications/compose-form.tsx → src/lib/admin/format.ts
- `LandPickerProps` --references--> `Land`  [EXTRACTED]
  src/components/consumer-panel/search/land-picker.tsx → src/types/consumer.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Parsimap map implementation (config, map component, picker)** — readme_parsimap_map, readme_parsimap_config, readme_parsimap_map_component, readme_map_picker [EXTRACTED 1.00]
- **Database schema sources kept in sync (schema.prisma, migration SQL, docs/database.schema)** — prisma_readme_schema_prisma, prisma_readme_initial_migration, prisma_readme_database_schema_doc, prisma_readme_sql_outside_dsl [EXTRACTED 1.00]
- **Next.js create-next-app boilerplate public assets (likely unused leftovers)** — public_file_file_icon, public_globe_globe_icon, public_window_window_icon, public_next_nextjs_logo, public_vercel_vercel_logo [INFERRED 0.95]
- **Same brand logo rendered at multiple PWA/Apple icon sizes** — public_icons_apple_touch_icon_icon, public_icons_icon_192_icon, public_icons_icon_512_icon [INFERRED 0.95]

## Communities (133 total, 15 thin omitted)

### Community 0 - "admin/format.ts"
Cohesion: 0.11
Nodes (37): AdminDashboardPage(), greeting(), metadata, AttentionList(), BarList(), KpiStrip(), ProvinceSpread(), RecentRequests() (+29 more)

### Community 1 - "EmptyState"
Cohesion: 0.10
Nodes (50): AdminUserDetailPage(), first(), Params, SearchParams, InvitationsPanel(), EmptyState(), SendNotificationLink(), UserNotes() (+42 more)

### Community 2 - "apiSuccess"
Cohesion: 0.04
Nodes (77): GET, runtime, GET, GET, GET, GET, GET, GET (+69 more)

### Community 3 - "catalog-admin.service.ts"
Cohesion: 0.07
Nodes (66): cleanup(), CATEGORY_SELECT, categorySearch(), countCategoriesPerStatus(), countRequestsPerCategory(), countServiceReferences(), countServicesInCategory(), countServicesPerCategory() (+58 more)

### Community 4 - "providers-admin.schemas.ts"
Cohesion: 0.08
Nodes (24): MAX_WORK_RADIUS_KM, MIN_SERVICE_PRICE_TOMAN, MIN_WORK_RADIUS_KM, PriceSchema, PRICING_UNITS, PROVIDER_LIST_PAGE_SIZES, PROVIDER_LIST_SORTS, ProviderApprovalSchema (+16 more)

### Community 5 - "utils/format.ts"
Cohesion: 0.05
Nodes (64): framer-motion, AuthPage(), AuthPageContent(), STAGE_COPY, ConsumerProviderProfileContent(), ConsumerProviderProfilePage(), isInternalPath(), safeResultsHref() (+56 more)

### Community 6 - "cn"
Cohesion: 0.04
Nodes (73): class-variance-authority, react-hook-form, PeriodBar(), normalizeSearchText(), SearchableSelect(), SearchableSelectOption, SearchableSelectProps, fallbackIconSizes (+65 more)

### Community 7 - "billing.service.ts"
Cohesion: 0.14
Nodes (20): countSubscriptionsPerPlan(), findPlanIdByCode(), insertPlan(), listLivePlanIds(), listPlanRows(), nextPlanSortOrder(), setPlanSortOrder(), sumRevenuePerPlan() (+12 more)

### Community 8 - "ApiError"
Cohesion: 0.11
Nodes (50): ApiError, mapPrismaError(), normalizeError(), completeAdminRequest(), canRevealContact(), decimal(), mapConsumerRequestDetail(), mapConsumerRequestSummary() (+42 more)

### Community 9 - "app-menu.tsx"
Cohesion: 0.06
Nodes (62): CancelForm(), CancelRequestSheet(), CancelRequestSheetProps, DEFAULT_CANCEL_REASON, REASONS, AppMenu(), currentPanel(), isLinkActive() (+54 more)

### Community 10 - "billing.schemas.ts"
Cohesion: 0.07
Nodes (28): BILLING_PAGE_SIZES, BillingDuration, DurationSchema, PageSchema, PAYMENT_PERIODS, PAYMENT_STATUSES, PaymentRefundInput, PaymentRefundSchema (+20 more)

### Community 11 - "providers/services/page.tsx"
Cohesion: 0.07
Nodes (48): sonner, clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage() (+40 more)

### Community 12 - "types/index.ts"
Cohesion: 0.05
Nodes (67): HomePage(), HomePageContent(), Reveal(), AdviceTile(), LandWeatherCard(), LandWeatherCardProps, AdviceRow(), FieldWeatherCard() (+59 more)

### Community 13 - "subscription/page.tsx"
Cohesion: 0.06
Nodes (59): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge() (+51 more)

### Community 14 - "app-profile.service.ts"
Cohesion: 0.18
Nodes (19): getCurrentUserProfile(), profileSelect, replaceCurrentUserImage(), updateCurrentUserProfile(), deleteCurrentUserImage(), hasValidImageSignature(), IMAGE_TYPES, patchCurrentUserProfile() (+11 more)

### Community 15 - "envelope.ts"
Cohesion: 0.11
Nodes (26): adminRequest(), redirectToLogin(), APP_API_BASE, AppApiRequestOptions, appRequest(), buildUrl(), notifyUnauthorized(), parseResponse() (+18 more)

### Community 16 - "me/route.ts"
Cohesion: 0.39
Nodes (5): GET, PATCH, runtime, mapCurrentUserProfile(), ProfileRecord

### Community 17 - "app-auth.service.ts"
Cohesion: 0.09
Nodes (42): APP_SESSION_POLICY, OTP_POLICY, getClientIp(), createOtp(), phones, smsQueue, isOtpResendCooldownActive(), isSessionWithinRefreshWindow() (+34 more)

### Community 18 - "subscriptions.service.ts"
Cohesion: 0.09
Nodes (46): GET, runtime, isRetryablePrismaConflict(), runPaymentReconciliationJob(), phones, mapActiveSubscription(), mapPaymentDetail(), mapPaymentSummary() (+38 more)

### Community 19 - "provider.service.ts"
Cohesion: 0.10
Nodes (49): phones, decimalToString(), mapProviderGalleryImage(), mapProviderProfile(), mapProviderService(), mapPublicProviderProfile(), mapPublicProviderService(), countActiveProviderServices() (+41 more)

### Community 20 - "subscriptions.schemas.ts"
Cohesion: 0.09
Nodes (24): POST, runtime, runtime, runtime, API_HEADERS, IdempotencyKeySchema, PublicIdSchema, apiErrorResponse() (+16 more)

### Community 21 - "getSecurityEnvironment"
Cohesion: 0.12
Nodes (17): getSecurityEnvironment(), throwSecurityEnvError(), HttpObjectStorage, ObjectStorageUnavailableError, LocalObjectStorage, hasValidImageSignature(), IMAGE_TYPES, MAX_IMAGE_BYTES (+9 more)

### Community 22 - "errors/index.ts"
Cohesion: 0.15
Nodes (13): GET, runtime, DELETE, GET, params(), PATCH, runtime, runtime (+5 more)

### Community 23 - "team.service.ts"
Cohesion: 0.08
Nodes (72): generateMetadata(), runInTransaction(), changeOwnPassword(), getOwnAccount(), iso(), OwnAccount, revokeOwnSessions(), Self (+64 more)

### Community 24 - "catalog-admin.schemas.ts"
Cohesion: 0.07
Nodes (26): MemoryStorage, PNG, request, CATALOG_STATUSES, CatalogSlugInputSchema, CategoriesListQuery, CategoriesListQuerySchema, CategoryCreateInput (+18 more)

### Community 25 - "command-palette.tsx"
Cohesion: 0.09
Nodes (26): AdminsLayout(), metadata, readTheme(), viewport, AdminPanelLayout(), AdminViewerProvider(), AdminViewerSummary, AdminShell() (+18 more)

### Community 26 - "toPersianDigits"
Cohesion: 0.07
Nodes (47): ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor(), Reveal() (+39 more)

### Community 27 - "notification.service.ts"
Cohesion: 0.11
Nodes (36): ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), backoffMilliseconds(), deliverChannel(), isReadyForRetry(), runNotificationDeliveryJob(), mapNotification() (+28 more)

### Community 28 - "jalali.ts"
Cohesion: 0.07
Nodes (46): ProfileLayout(), ProvidersLayout(), UsersLayout(), viewport, ConsumerDock(), DatePickerStep(), DatePickerStepProps, isoForOffset() (+38 more)

### Community 29 - "profile/page.tsx"
Cohesion: 0.08
Nodes (43): PLATFORM_LABEL, ProfilePage(), Reveal(), Section(), ServicePicker(), ServicePickerProps, Select(), SelectContent() (+35 more)

### Community 30 - "parseWithSchema"
Cohesion: 0.06
Nodes (56): POST, runtime, self(), GET, PATCH, runtime, self(), POST (+48 more)

### Community 31 - "lucide-react"
Cohesion: 0.10
Nodes (42): lucide-react, radix-ui, react, AdminPanelError(), PaymentsFilterBar(), BillingSearchInput(), SubscriptionsFilterBar(), CategoriesSearch() (+34 more)

### Community 32 - "Badge"
Cohesion: 0.10
Nodes (56): AccountPage(), metadata, AdminPaymentPage(), Code(), metadata, AdminTeamAdminDetailPage(), Params, permissionSources() (+48 more)

### Community 33 - "db.ts"
Cohesion: 0.12
Nodes (21): createSearch(), getData(), idempotencyKey(), listCandidates(), mutation(), PROVIDER_PHONES, sendTo(), tomorrow() (+13 more)

### Community 34 - "search/page.tsx"
Cohesion: 0.05
Nodes (64): COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES, Reveal() (+56 more)

### Community 35 - "admin-auth.service.ts"
Cohesion: 0.12
Nodes (26): AdminAccess, getDeviceFingerprint(), getUserAgent(), resolveAdminAccess(), insertAdminAuditLog(), JsonInput, RecordAdminAuditInput, sanitize() (+18 more)

### Community 36 - "notifications-admin.service.ts"
Cohesion: 0.05
Nodes (70): consumerIds, PHONES, request, audienceWhere(), BROADCAST_AUDIT_ACTION, BROADCAST_TYPE, campaignFilter(), campaignStats() (+62 more)

### Community 37 - "contracts/index.ts"
Cohesion: 0.14
Nodes (26): ADMIN_PASSWORD_POLICY, ADMIN_SESSION_POLICY, API_ROOTS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, SESSION_COOKIES, ApiErrorEnvelopeSchema, ApiErrorSchema (+18 more)

### Community 38 - "useCan"
Cohesion: 0.11
Nodes (44): PlanDialogMode, PlansTable(), SubscriptionActions(), CatalogThumb(), CategoriesTable(), CatalogStatusBadge(), ServicesTable(), QueueActions() (+36 more)

### Community 39 - "geo-data.ts"
Cohesion: 0.30
Nodes (12): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+4 more)

### Community 40 - "Button"
Cohesion: 0.07
Nodes (76): PasswordForm(), ProfileForm(), RULES, DurationField(), durationPayload(), DurationValue, GrantForm(), submit() (+68 more)

### Community 41 - "root-chrome.tsx"
Cohesion: 0.17
Nodes (14): AppShell(), AppShellProps, HIDDEN_MENU_PATHS, MobileShell(), MobileShellProps, StatusBarMock(), isAdminPath(), RootChrome() (+6 more)

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

### Community 46 - "security/index.ts"
Cohesion: 0.03
Nodes (114): POST, runtime, POST, runtime, POST, runtime, runtime, POST (+106 more)

### Community 47 - "prisma.ts"
Cohesion: 0.06
Nodes (36): dotenv, prisma, vitest, baseUrl, names, requested, systemClock, databaseEnvironment (+28 more)

### Community 48 - "settings-admin.service.ts"
Cohesion: 0.08
Nodes (48): request, savedRows, TOUCHED, countDeliveriesByStatus(), Db, deleteSettingRow(), findSettingRow(), listJobRunRows() (+40 more)

### Community 49 - "createPublicId"
Cohesion: 0.08
Nodes (43): createPublicId(), encodeBase32(), createRequest(), session(), createUser(), cleanupAll(), cleanupUsers(), createLand() (+35 more)

### Community 50 - "idempotency.ts"
Cohesion: 0.16
Nodes (13): getAppIdempotencyService(), globalIdempotency, IdempotencyScope, IdempotencyService, IdempotencyStore, StoredIdempotencyResult, scope, MemoryIdempotencyStore (+5 more)

### Community 51 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, argon2, class-variance-authority, clsx, dotenv, farsi-tools, @fontsource-variable/vazirmatn, framer-motion (+20 more)

### Community 52 - "app-provider.tsx"
Cohesion: 0.18
Nodes (13): AppProvider(), AppProviderProps, isAdminPath(), AppSplash(), POLLEN, EASE_GROW, SproutMark(), SproutMarkProps (+5 more)

### Community 53 - "next.config.ts"
Cohesion: 0.33
Nodes (3): APP_VERSION, nextConfig, securityHeaders

### Community 54 - "integrations/index.ts"
Cohesion: 0.13
Nodes (13): ConsoleSmsQueue, ObjectStorage, PaymentInitiation, PaymentProvider, SmsMessage, SmsProvider, SmsQueue, PutResponse (+5 more)

### Community 55 - "package.json"
Cohesion: 0.07
Nodes (26): eslintConfig, name, private, version, clsx, eslint, eslint-config-next, farsi-tools (+18 more)

### Community 56 - "provider-public-profile.tsx"
Cohesion: 0.09
Nodes (40): ConsumerLandsPage(), SortKey, SORTS, ADDED, FieldFallback(), LandCard(), FULL, locationLabel() (+32 more)

### Community 57 - "reports-admin.service.ts"
Cohesion: 0.13
Nodes (40): GET, median(), Bounds, completedTotals(), countActiveUsers(), countUnmatchedRequests(), countUsersBefore(), dailyNewProviders() (+32 more)

### Community 58 - "session.service.ts"
Cohesion: 0.23
Nodes (16): AdminSessionLookup, findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup, touchAdminSession(), UserSessionLookup (+8 more)

### Community 59 - "zod"
Cohesion: 0.10
Nodes (34): zod, EditLandPage(), NewLandPage(), LandCardProps, LandForm(), LandFormProps, PageHeader(), PageHeaderProps (+26 more)

### Community 60 - "seed.ts"
Cohesion: 0.22
Nodes (11): catalog, main(), permissionCodes, prisma, seedBootstrapAdmin(), seedCatalog(), seedDir, seedPermissions() (+3 more)

### Community 61 - "validate-api-contracts.mjs"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 62 - "team.schemas.ts"
Cohesion: 0.06
Nodes (35): AccountPasswordSchema, AccountProfileSchema, AccountSessionRevokeSchema, ADMIN_STATUSES, AdminCreateInput, AdminOverrideInput, AdminOverrideParamsSchema, AdminOverrideSchema (+27 more)

### Community 63 - "default-rate-limiter.ts"
Cohesion: 0.19
Nodes (12): createRateLimiter(), getAppRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy (+4 more)

### Community 64 - "Keshavarz Agricultural Services Platform (Mock)"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "observability/index.ts"
Cohesion: 0.09
Nodes (33): RequestId, ApiRequestContext, ApiRouteHandler, DeadLetterEntry, enqueuePaymentCallbackDeadLetter(), nextId(), queue, AlertType (+25 more)

### Community 66 - "next"
Cohesion: 0.04
Nodes (132): next, POST, runtime, runtime, DELETE, params(), PATCH, runtime (+124 more)

### Community 67 - "Panel"
Cohesion: 0.11
Nodes (62): AdminPaymentsPage(), metadata, Stat(), AdminPaymentNotFound(), AdminPlansPage(), metadata, AdminSubscriptionsPage(), metadata (+54 more)

### Community 68 - "map-picker.tsx"
Cohesion: 0.06
Nodes (51): @neshan-maps-platform/maplibre-sdk, MAX_RADIUS_KM, MIN_RADIUS_KM, RADIUS_PRESETS, WorkAreaPanel(), WorkAreaPanelProps, inlineCenter(), LocationLabel() (+43 more)

### Community 69 - "api.ts"
Cohesion: 0.11
Nodes (22): AdminLoginPage(), metadata, AdminLoginScreen(), onSubmit(), FieldRows(), GalleryImage, parseCoordinate(), PRESETS (+14 more)

### Community 70 - "generate-openapi.mjs"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "app-requests.ts"
Cohesion: 0.04
Nodes (88): isTakenByOther(), landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState (+80 more)

### Community 72 - "team.repository.ts"
Cohesion: 0.11
Nodes (31): generateMetadata(), AuditDetail, AuditList, auditRange(), AuditRowLike, AuditSubject, getAuditEntry(), listAuditEntries() (+23 more)

### Community 73 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 74 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 75 - "app/layout.tsx"
Cohesion: 0.15
Nodes (9): @fontsource-variable/vazirmatn, viewport, metadata, RootLayout(), viewport, SCREENSHOTS, APPLE_STARTUP_IMAGES, PWA_BRAND (+1 more)

### Community 76 - "users.service.ts"
Cohesion: 0.06
Nodes (81): generateMetadata(), request, activeRestrictionWhere(), buildUserWhere(), countUsersPerStatus(), endModerationAction(), findActiveRestrictions(), findCityProvince() (+73 more)

### Community 77 - "request-taken-state.tsx"
Cohesion: 0.25
Nodes (12): zustand, DUST, Field(), LostRequestScene(), RequestSlip(), RequestTakenState(), SceneBackdrop(), SceneFrame() (+4 more)

### Community 78 - "users.schemas.ts"
Cohesion: 0.07
Nodes (28): AdminLoginInput, AdminLoginSchema, MODERATION_ACTIONS, ModerationAction, toLatinDigits(), USER_DETAIL_TABS, USER_LIST_PAGE_SIZES, USER_LIST_SORTS (+20 more)

### Community 79 - "requests-admin.service.ts"
Cohesion: 0.06
Nodes (50): generateMetadata(), TransactionClient, AdminAuditRow, listAuditLogsForSubject(), phones, PROVIDER_PHONES, providers, request (+42 more)

### Community 80 - "(panel)/reports/page.tsx"
Cohesion: 0.21
Nodes (24): BUCKET_TEXT, metadata, GrowthTab(), Delta(), KpiItem, KpiTiles(), MarketplaceTab(), STATUS_ORDER (+16 more)

### Community 81 - "ref_node_path"
Cohesion: 0.09
Nodes (16): projectRoot, banned, collectFiles(), projectRoot, scanRoots, supportedExtensions, violations, bannedRoots (+8 more)

### Community 82 - "report-period.ts"
Cohesion: 0.13
Nodes (30): addDays(), bucketFor(), bucketize(), BucketSlot, bucketSlots(), daysBetween(), dayStart(), dayToUtcNoon() (+22 more)

### Community 83 - "dashboard.service.ts"
Cohesion: 0.24
Nodes (17): activeRestriction(), countPendingProviders(), countRequestMetrics(), countUserMetrics(), DailyRow, loadDailySeries(), loadRecentRequests(), loadRecentUsers() (+9 more)

### Community 84 - "pwa-runtime.tsx"
Cohesion: 0.18
Nodes (17): applyUpdate(), offerUpdate(), PwaRuntime(), registerServiceWorker(), trackInstalling(), APP_INSTALLED_EVENT, BeforeInstallPromptEvent, detectPlatform() (+9 more)

### Community 85 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, sharp, tailwindcss, @tailwindcss/postcss (+6 more)

### Community 86 - "provider-detail.tsx"
Cohesion: 0.17
Nodes (24): AdminProviderDetailPage(), Params, SearchParams, GalleryPanel(), ELIGIBILITY_GAP, ELIGIBILITY_ORDER, LINK_STATUS, PROVIDER_TAB_LABELS (+16 more)

### Community 87 - "sw.js"
Cohesion: 0.29
Nodes (8): BYPASS_PREFIXES, cacheFirst(), CACHES, isCacheable(), LIMITS, PRECACHE_URLS, staleWhileRevalidate(), trim()

### Community 88 - "seed-worker.mts"
Cohesion: 0.27
Nodes (9): args, [command, ...rest], hashToken(), installAppSession(), makeOpaqueToken(), makePublicId(), seedApp(), seedProvider() (+1 more)

### Community 89 - "request-detail.tsx"
Cohesion: 0.14
Nodes (24): AdminRequestDetailPage(), Params, AsideRow(), AuditPanel(), CandidatesPanel(), mapUrl(), ProviderIdentity(), RequestAside() (+16 more)

### Community 90 - "faNumber"
Cohesion: 0.15
Nodes (22): AdminCampaignPage(), metadata, READ_FILTERS, AdminSystemStatusPage(), CHANNEL, DELIVERY_STATUS, dynamic, formatDuration() (+14 more)

### Community 91 - "validate-api-boundaries.mjs"
Cohesion: 0.18
Nodes (9): collectFiles(), fail(), graph, projectRoot, sourceRoot, supportedExtensions, visit(), visited (+1 more)

### Community 92 - "health/route.ts"
Cohesion: 0.67
Nodes (3): GET, runtime, mapHealthResponse()

### Community 93 - "providers-admin.service.ts"
Cohesion: 0.14
Nodes (24): generateMetadata(), countCompletedJobs(), findProviderProfile(), listGallery(), listProviderServiceRows(), listProvinceOptions(), listServiceOptions(), listSubscriptionHistory() (+16 more)

### Community 94 - "admin-access-panels.tsx"
Cohesion: 0.15
Nodes (20): OverrideDialog(), submit(), OverridesPanel(), RolesDialog(), submit(), useEditable(), EXPIRY_OPTIONS, expiryFromDays() (+12 more)

### Community 95 - "reports-admin.export.ts"
Cohesion: 0.13
Nodes (18): RFC-4180, AdminReportsPage(), periodQuery(), formatJalaliInput(), buildReportCsv(), Cell, GROWTH_LABELS, jalali() (+10 more)

### Community 96 - "billing.repository.ts"
Cohesion: 0.16
Nodes (18): countPaymentsPerStatus(), Db, findPaymentForRefund(), insertManualRefund(), listPaymentRows(), PAYMENT_STATUS_GROUPS, paymentFilters(), PERIOD_DAYS (+10 more)

### Community 97 - "providers-admin.integration.test.ts"
Cohesion: 0.17
Nodes (16): request, SERVICE_SLUGS, deleteProviderServiceRow(), findProviderServiceRow(), lockProviderProfile(), updateProviderProfileRow(), ProviderServiceCreateSchema, ProviderWorkAreaSchema (+8 more)

### Community 98 - "report-format.ts"
Cohesion: 0.22
Nodes (15): atNoon(), axisTick(), bucketLabel(), bucketTick(), compact, decimal, formatDay(), fullDateFormatter (+7 more)

### Community 99 - "validate-secret-scan.mjs"
Cohesion: 0.22
Nodes (8): allowlist, collectFiles(), patterns, projectRoot, scanRoots, skipDirectories, supportedExtensions, violations

### Community 100 - "grantAdminSubscription"
Cohesion: 0.15
Nodes (17): cancelOpenPaymentsOfSubscription(), cancelSubscriptionRow(), expireSubscription(), findActiveSubscriptionRow(), findProviderByUserPublicId(), findSubscriptionByPublicId(), insertGrantedSubscription(), setSubscriptionEnd() (+9 more)

### Community 102 - "[landId]/route.ts"
Cohesion: 0.17
Nodes (14): DELETE, GET, landIdFromPath(), PATCH, runtime, runtime, DecimalStringSchema, AreaSchema (+6 more)

### Community 103 - "PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)"
Cohesion: 0.50
Nodes (4): Apple Touch Icon (180px, green goblet-with-hat logo), PWA Icon 192px (green goblet-with-hat logo), PWA Icon 512px (green goblet-with-hat logo), PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)

### Community 104 - "Skeleton"
Cohesion: 0.07
Nodes (29): Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), AdminPanelLoading() (+21 more)

### Community 106 - "catalog.service.ts"
Cohesion: 0.27
Nodes (13): cache, CacheEntry, getCatalogCache(), setCatalogCache(), mapCategory(), mapService(), findActiveCategoryBySlug(), findActiveServiceBySlug() (+5 more)

### Community 108 - "File Document Icon (Next.js starter)"
Cohesion: 0.67
Nodes (3): File Document Icon (Next.js starter), Globe Icon (Next.js starter), Browser Window Icon (Next.js starter)

### Community 115 - "lands.service.ts"
Cohesion: 0.27
Nodes (14): decimalToString(), mapLand(), countLandServiceRequests(), createUserLand(), findUserLandByPublicId(), landSelect, listUserLands(), softDeleteUserLand() (+6 more)

### Community 117 - "providers-admin.repository.ts"
Cohesion: 0.26
Nodes (12): activeSubscriptionWhere(), baseWhere(), countProvidersPerTab(), Db, deleteGalleryImageRow(), findActiveSubscriptionFor(), findGalleryImage(), listProviderRows() (+4 more)

### Community 118 - "crypto.ts"
Cohesion: 0.24
Nodes (6): argon2, HmacEncoding, safeEqual(), signPayload(), signWithSecret(), verifyPayloadSignature()

### Community 119 - "reports-admin.schemas.ts"
Cohesion: 0.18
Nodes (10): REPORT_TAB_LABELS, ReportTabs(), optionalText, REPORT_DATASETS, REPORT_TABS, ReportDataset, ReportExportQuerySchema, ReportsQuery (+2 more)

### Community 120 - "use-price-input.ts"
Cohesion: 0.33
Nodes (9): persian-tools, formatToPersianWords(), formatWithCommas(), parseToRawNumber(), sanitizeInput(), toEnglishDigits(), toPersianDigits(), usePriceInput() (+1 more)

### Community 121 - "listAdminSubscriptions"
Cohesion: 0.24
Nodes (10): countSubscriptionsPerStatus(), listPlanOptions(), listSubscriptionRows(), searchProviders(), subscriptionFilters(), userSearch(), getPlanOptions(), iso() (+2 more)

### Community 122 - "billing.integration.test.ts"
Cohesion: 0.22
Nodes (6): request, findPaymentDetail(), PlanCreateSchema, SubscriptionExtendSchema, SubscriptionGrantSchema, getAdminPayment()

### Community 123 - "settings-section-form.tsx"
Cohesion: 0.43
Nodes (7): describeValue(), Draft, latinDigits(), SettingRow(), SettingsSectionForm(), submit(), toDraft()

### Community 124 - "addAdminProviderService"
Cohesion: 0.32
Nodes (8): findCatalogService(), findProviderServiceByCatalogId(), insertAdminPriceHistory(), insertProviderService(), updateProviderServiceRow(), addAdminProviderService(), requireActiveCatalogService(), updateAdminProviderService()

### Community 125 - "deleteAdminPlan"
Cohesion: 0.38
Nodes (7): countOpenSubscriptionsForPlan(), findPlanById(), updatePlanRow(), deleteAdminPlan(), requirePlan(), rethrow(), updateAdminPlan()

### Community 126 - "reports.schemas.ts"
Cohesion: 0.29
Nodes (6): ConsumerFinancialSummaryQuerySchema, ConsumerMonthlyCostsQuerySchema, ProviderFinancialSummaryQuerySchema, ProviderMonthlyRevenueQuerySchema, ReportRangeQuerySchema, REPORTS_TIMEZONE

### Community 127 - "billing-labels.ts"
Cohesion: 0.40
Nodes (4): GATEWAY_LABELS, PAYMENT_PERIOD_LABELS, PAYMENT_TABS, SUBSCRIPTION_TABS

## Ambiguous Edges - Review These
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` → `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **29 isolated node(s):** `@hookform/resolvers`, `@prisma/client`, `farsi-tools`, `mariadb`, `next-themes` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1118 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `admin/format.ts`, `billing/page.tsx`, `catalog/page.tsx`, `settings/page.tsx`, `team/page.tsx`, `EmptyState`, `apiSuccess`, `utils/format.ts`, `billing.service.ts`, `app-menu.tsx`, `catalog-admin.service.ts`, `providers/services/page.tsx`, `types/index.ts`, `subscription/page.tsx`, `me/route.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `subscriptions.schemas.ts`, `errors/index.ts`, `team.service.ts`, `catalog-admin.schemas.ts`, `command-palette.tsx`, `toPersianDigits`, `jalali.ts`, `profile/page.tsx`, `parseWithSchema`, `lucide-react`, `Badge`, `search/page.tsx`, `admin-auth.service.ts`, `notifications-admin.service.ts`, `useCan`, `Button`, `root-chrome.tsx`, `security/index.ts`, `settings-admin.service.ts`, `app-provider.tsx`, `next.config.ts`, `package.json`, `provider-public-profile.tsx`, `session.service.ts`, `zod`, `observability/index.ts`, `Panel`, `map-picker.tsx`, `api.ts`, `app-requests.ts`, `app/layout.tsx`, `users.service.ts`, `request-taken-state.tsx`, `requests-admin.service.ts`, `(panel)/reports/page.tsx`, `ref_node_path`, `provider-detail.tsx`, `request-detail.tsx`, `faNumber`, `health/route.ts`, `providers-admin.service.ts`, `admin-access-panels.tsx`, `providers-admin.integration.test.ts`, `[landId]/route.ts`, `proxy.ts`, `reports-admin.schemas.ts`, `billing.integration.test.ts`?**
  _High betweenness centrality (0.348) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `farsi-tools` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `admin/format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10975609756097561 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `admin/format.ts`, `EmptyState`, `utils/format.ts`, `app-menu.tsx`, `providers/services/page.tsx`, `types/index.ts`, `subscription/page.tsx`, `command-palette.tsx`, `toPersianDigits`, `jalali.ts`, `profile/page.tsx`, `lucide-react`, `Badge`, `search/page.tsx`, `useCan`, `Button`, `root-chrome.tsx`, `provider-public-profile.tsx`, `zod`, `Panel`, `map-picker.tsx`, `api.ts`, `app-requests.ts`, `(panel)/reports/page.tsx`, `provider-detail.tsx`, `request-detail.tsx`, `faNumber`, `admin-access-panels.tsx`, `Skeleton`, `reports-admin.schemas.ts`, `settings-section-form.tsx`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Should `EmptyState` be split into smaller, more focused modules?**
  _Cohesion score 0.09610389610389611 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `ApiError` to `api-error.ts`, `apiSuccess`, `catalog-admin.service.ts`, `billing.service.ts`, `app-profile.service.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `provider.service.ts`, `subscriptions.schemas.ts`, `getSecurityEnvironment`, `errors/index.ts`, `team.service.ts`, `notification.service.ts`, `parseWithSchema`, `admin-auth.service.ts`, `notifications-admin.service.ts`, `reports.service.ts`, `security/index.ts`, `settings-admin.service.ts`, `createPublicId`, `idempotency.ts`, `session.service.ts`, `default-rate-limiter.ts`, `observability/index.ts`, `next`, `users.service.ts`, `requests-admin.service.ts`, `report-period.ts`, `providers-admin.service.ts`, `billing.repository.ts`, `providers-admin.integration.test.ts`, `grantAdminSubscription`, `catalog.service.ts`, `lands.service.ts`, `providers-admin.repository.ts`, `addAdminProviderService`, `deleteAdminPlan`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._