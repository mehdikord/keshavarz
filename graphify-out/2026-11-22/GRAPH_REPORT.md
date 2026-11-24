# Graph Report - keshavarz  (2026-11-22)

## Corpus Check
- 792 files · ~519,503 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 8, .css 4, .example 1)

## Summary
- 4782 nodes · 18345 edges · 126 communities (114 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ffcba650`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- faNumber
- getAdminUserHeader
- apiSuccess
- catalog-admin.service.ts
- providers-admin.service.ts
- search-results-content.tsx
- cn
- catalog.service.ts
- ApiError
- ServiceThumb
- billing.schemas.ts
- providers/services/page.tsx
- types/index.ts
- subscription/page.tsx
- app-profile.service.ts
- envelope.ts
- news-screen.tsx
- app-auth.service.ts
- subscriptions.service.ts
- provider.service.ts
- shared/index.ts
- news-admin.service.ts
- next
- team.service.ts
- requests-admin.schemas.ts
- sidebar.tsx
- toPersianDigits
- notification.service.ts
- jalali.ts
- profile/page.tsx
- permissions.ts
- search.service.ts
- Badge
- db.ts
- users/reports/page.tsx
- admin-auth.service.ts
- notifications-admin.service.ts
- contracts/index.ts
- [newsId]/route.ts
- seed.ts
- lucide-react
- root-chrome.tsx
- validate-prisma-foundation.mjs
- reports.service.ts
- scripts
- generate-icons.mjs
- parseJsonBody
- clock.ts
- settings-admin.service.ts
- users.repository.ts
- idempotency.ts
- dependencies
- app-provider.tsx
- rich-text-editor.tsx
- integrations/index.ts
- package.json
- home-hero.tsx
- reports-admin.service.ts
- session.service.ts
- validators/index.ts
- search/page.tsx
- validate-api-contracts.mjs
- team.schemas.ts
- default-rate-limiter.ts
- Keshavarz Agricultural Services Platform (Mock)
- observability/index.ts
- requireAdminActor
- Panel
- map-picker.tsx
- billing.service.ts
- generate-openapi.mjs
- app-requests.ts
- UserStatus
- compilerOptions
- components.json
- app/layout.tsx
- users.service.ts
- request-taken-state.tsx
- [userId]/page.tsx
- prisma
- (panel)/reports/page.tsx
- ref_node_path
- report-period.ts
- dashboard.service.ts
- pwa-runtime.tsx
- devDependencies
- (panel)/providers/[providerId]/page.tsx
- sw.js
- admins/layout.tsx
- toast-provider.tsx
- billing.repository.ts
- validate-api-boundaries.mjs
- notifications-admin.integration.test.ts
- audit-diff.tsx
- grantAdminSubscription
- reports-admin.export.ts
- notifications-admin.schemas.ts
- report-format.ts
- validate-secret-scan.mjs
- app-auth.schemas.ts
- notification.repository.ts
- PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)
- Skeleton
- Graphify Knowledge Graph (graphify-out)
- seed-worker.mts
- otp-test.mjs
- File Document Icon (Next.js starter)
- postcss.config.mjs
- Next.js Wordmark Logo
- persian-tools.d.ts
- Keshavarz App Icon (green gradient plant/leaf)
- listAdminSubscriptions
- prisma.ts
- AGENTS.md
- billing.integration.test.ts
- getSecurityEnvironment
- reports-admin.schemas.ts
- use-price-input.ts
- deleteAdminPlan
- next.config.ts
- getUserSessionsTab
- getUserLandsTab
- getUserRequestsTab

## God Nodes (most connected - your core abstractions)
1. `cn()` - 435 edges
2. `next` - 329 edges
3. `apiSuccess()` - 304 edges
4. `ApiError` - 205 edges
5. `lucide-react` - 181 edges
6. `faNumber()` - 153 edges
7. `react` - 146 edges
8. `withApiHandler()` - 144 edges
9. `parseWithSchema()` - 142 edges
10. `parseJsonBody()` - 142 edges

## Surprising Connections (you probably didn't know these)
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` --conceptually_related_to--> `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md → src/test/fixtures/README.md
- `allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver)` --conceptually_related_to--> `schema.prisma (31 tables, type-safe mapping)`  [INFERRED]
  pnpm-workspace.yaml → prisma/README.md
- `Prisma/DB commands (validate, generate, migrate deploy, drift, seed)` --conceptually_related_to--> `Server module integration tests (*.integration.test.ts plant own rows)`  [INFERRED]
  prisma/README.md → src/test/fixtures/README.md
- `run()` --calls--> `errorMessage()`  [EXTRACTED]
  src/components/admin/settings/system-actions.tsx → src/lib/admin/api.ts
- `LandPickerProps` --references--> `Land`  [EXTRACTED]
  src/components/consumer-panel/search/land-picker.tsx → src/types/consumer.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Parsimap map implementation (config, map component, picker)** — readme_parsimap_map, readme_parsimap_config, readme_parsimap_map_component, readme_map_picker [EXTRACTED 1.00]
- **Database schema sources kept in sync (schema.prisma, migration SQL, docs/database.schema)** — prisma_readme_schema_prisma, prisma_readme_initial_migration, prisma_readme_database_schema_doc, prisma_readme_sql_outside_dsl [EXTRACTED 1.00]
- **Next.js create-next-app boilerplate public assets (likely unused leftovers)** — public_file_file_icon, public_globe_globe_icon, public_window_window_icon, public_next_nextjs_logo, public_vercel_vercel_logo [INFERRED 0.95]
- **Same brand logo rendered at multiple PWA/Apple icon sizes** — public_icons_apple_touch_icon_icon, public_icons_icon_192_icon, public_icons_icon_512_icon [INFERRED 0.95]

## Communities (126 total, 12 thin omitted)

### Community 0 - "faNumber"
Cohesion: 0.06
Nodes (67): AdminDashboardPage(), greeting(), metadata, AdminSystemStatusPage(), CHANNEL, DELIVERY_STATUS, dynamic, formatDuration() (+59 more)

### Community 1 - "getAdminUserHeader"
Cohesion: 0.16
Nodes (15): generateMetadata(), buildUserWhere(), countUsersPerStatus(), listUserNotifications(), listUserPayments(), listUsers(), loadProviderDetail(), loadUserCounters() (+7 more)

### Community 2 - "apiSuccess"
Cohesion: 0.03
Nodes (92): GET, PATCH, runtime, self(), GET, runtime, GET, POST (+84 more)

### Community 3 - "catalog-admin.service.ts"
Cohesion: 0.05
Nodes (96): cleanup(), PNG, request, CATEGORY_SELECT, categorySearch(), countCategoriesPerStatus(), countRequestsPerCategory(), countServiceReferences() (+88 more)

### Community 4 - "providers-admin.service.ts"
Cohesion: 0.05
Nodes (84): generateMetadata(), request, SERVICE_SLUGS, activeSubscriptionWhere(), baseWhere(), countCompletedJobs(), countProvidersPerTab(), Db (+76 more)

### Community 5 - "search-results-content.tsx"
Cohesion: 0.05
Nodes (51): zustand, CARD_STATE, describeSkipped(), LIST_ITEM_SPRING, OPEN_STATUSES, RequestBanner(), SearchResultsPage(), SearchSummary() (+43 more)

### Community 6 - "cn"
Cohesion: 0.03
Nodes (80): react-hook-form, LandPickerProps, PriceDisplay(), PriceDisplayProps, OFFSETS, SatelliteThumb(), SatelliteThumbProps, worldPixel() (+72 more)

### Community 7 - "catalog.service.ts"
Cohesion: 0.06
Nodes (57): dynamic, generateMetadata(), loadIntro, Params, readingMinutes(), ServiceIntroPage(), Align, alignStyle() (+49 more)

### Community 8 - "ApiError"
Cohesion: 0.10
Nodes (54): ApiError, isRetryablePrismaConflict(), mapPrismaError(), normalizeError(), completeAdminRequest(), withdrawAdminRequestLink(), buildRequestNotification(), canRevealContact() (+46 more)

### Community 9 - "ServiceThumb"
Cohesion: 0.08
Nodes (54): CancelForm(), CancelRequestSheet(), CancelRequestSheetProps, DEFAULT_CANCEL_REASON, REASONS, AppMenu(), currentPanel(), isLinkActive() (+46 more)

### Community 10 - "billing.schemas.ts"
Cohesion: 0.07
Nodes (28): BILLING_PAGE_SIZES, BillingDuration, DurationSchema, PageSchema, PAYMENT_PERIODS, PAYMENT_STATUSES, PaymentRefundInput, PaymentRefundSchema (+20 more)

### Community 11 - "providers/services/page.tsx"
Cohesion: 0.08
Nodes (42): clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage(), TabKey (+34 more)

### Community 12 - "types/index.ts"
Cohesion: 0.05
Nodes (57): AdviceTile(), LandWeatherCard(), LandWeatherCardProps, AdviceRow(), FieldWeatherCard(), FieldWeatherCardProps, formatAstroTime(), formatWeekday() (+49 more)

### Community 13 - "subscription/page.tsx"
Cohesion: 0.06
Nodes (62): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge() (+54 more)

### Community 14 - "app-profile.service.ts"
Cohesion: 0.18
Nodes (19): getCurrentUserProfile(), profileSelect, replaceCurrentUserImage(), updateCurrentUserProfile(), deleteCurrentUserImage(), hasValidImageSignature(), IMAGE_TYPES, patchCurrentUserProfile() (+11 more)

### Community 15 - "envelope.ts"
Cohesion: 0.11
Nodes (25): adminRequest(), redirectToLogin(), APP_API_BASE, AppApiRequestOptions, appRequest(), buildUrl(), notifyUnauthorized(), parseResponse() (+17 more)

### Community 16 - "news-screen.tsx"
Cohesion: 0.09
Nodes (45): metadata, NewsPage(), LatestNews(), State, ImportantBadge(), NewsLink(), ReadButton(), StalkNode() (+37 more)

### Community 17 - "app-auth.service.ts"
Cohesion: 0.09
Nodes (41): APP_SESSION_POLICY, OTP_POLICY, createOtp(), phones, smsQueue, isOtpResendCooldownActive(), isSessionWithinRefreshWindow(), otpResendRetryAfterSeconds() (+33 more)

### Community 18 - "subscriptions.service.ts"
Cohesion: 0.12
Nodes (38): mapActiveSubscription(), mapPaymentDetail(), mapPaymentSummary(), mapPurchaseResult(), mapSubscriptionHistoryItem(), mapSubscriptionPlan(), money(), activateSubscriptionAndPayment() (+30 more)

### Community 19 - "provider.service.ts"
Cohesion: 0.10
Nodes (47): decimalToString(), mapProviderGalleryImage(), mapProviderProfile(), mapProviderService(), mapPublicProviderProfile(), mapPublicProviderService(), countActiveProviderServices(), countProviderGalleryImages() (+39 more)

### Community 20 - "shared/index.ts"
Cohesion: 0.12
Nodes (21): ProfileLayout(), ProvidersLayout(), UsersLayout(), viewport, ConsumerProviderProfileContent(), ConsumerProviderProfilePage(), isInternalPath(), safeResultsHref() (+13 more)

### Community 21 - "news-admin.service.ts"
Cohesion: 0.06
Nodes (67): foldChar(), highlightTitle(), LETTERS, normalizeSearchText(), searchWords(), TitlePart, hasValidImageSignature(), IMAGE_TYPES (+59 more)

### Community 22 - "next"
Cohesion: 0.06
Nodes (37): next, POST, runtime, POST, runtime, GET, runtime, POST (+29 more)

### Community 23 - "team.service.ts"
Cohesion: 0.06
Nodes (106): generateMetadata(), generateMetadata(), AdminAccess, runInTransaction(), changeOwnPassword(), getOwnAccount(), iso(), OwnAccount (+98 more)

### Community 24 - "requests-admin.schemas.ts"
Cohesion: 0.10
Nodes (22): POST, runtime, POST, runtime, POST, runtime, GET, runtime (+14 more)

### Community 25 - "sidebar.tsx"
Cohesion: 0.06
Nodes (47): AdminLoginPage(), metadata, AdminPanelLayout(), AdminLoginScreen(), onSubmit(), FieldRows(), AdminViewerProvider(), AdminViewerSummary (+39 more)

### Community 26 - "toPersianDigits"
Cohesion: 0.08
Nodes (46): ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor(), Reveal() (+38 more)

### Community 27 - "notification.service.ts"
Cohesion: 0.14
Nodes (24): ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), mapNotification(), countUnreadUserNotifications(), createNotificationWithDeliveries(), findExistingNotificationByEvent(), findUserNotificationByPublicId() (+16 more)

### Community 28 - "jalali.ts"
Cohesion: 0.12
Nodes (31): class-variance-authority, DatePickerStep(), DatePickerStepProps, isoForOffset(), MAX_SEARCH_DATES, QUICK_DAYS, DayCellData, PersianCalendar (+23 more)

### Community 29 - "profile/page.tsx"
Cohesion: 0.06
Nodes (59): AuthPage(), AuthPageContent(), STAGE_COPY, PLATFORM_LABEL, ProfilePage(), Reveal(), Section(), Crop() (+51 more)

### Community 30 - "permissions.ts"
Cohesion: 0.08
Nodes (52): POST, runtime, self(), POST, runtime, self(), POST, runtime (+44 more)

### Community 31 - "search.service.ts"
Cohesion: 0.18
Nodes (22): createSearchRequest(), CandidateState, mapCandidate(), mapCandidateRequestContext(), EligibleProviderRow, findActiveCatalogServiceForSearch(), findActiveOwnedLand(), findOpenRequestForCriteria() (+14 more)

### Community 32 - "Badge"
Cohesion: 0.05
Nodes (147): AccountPage(), metadata, AdminPaymentPage(), Code(), metadata, AdminRequestDetailPage(), Params, AdminTeamAdminDetailPage() (+139 more)

### Community 33 - "db.ts"
Cohesion: 0.12
Nodes (21): createSearch(), getData(), idempotencyKey(), listCandidates(), mutation(), PROVIDER_PHONES, sendTo(), tomorrow() (+13 more)

### Community 34 - "users/reports/page.tsx"
Cohesion: 0.06
Nodes (43): COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES, Reveal() (+35 more)

### Community 35 - "admin-auth.service.ts"
Cohesion: 0.18
Nodes (18): getClientIp(), getDeviceFingerprint(), getUserAgent(), AdminGrantRows, loadAdminGrants(), resolveAdminAccess(), createAdminSessionRow(), findAdminForLogin() (+10 more)

### Community 36 - "notifications-admin.service.ts"
Cohesion: 0.10
Nodes (38): audienceWhere(), BROADCAST_AUDIT_ACTION, BROADCAST_TYPE, campaignFilter(), CampaignStatsRow, countAudience(), deliveryWhere(), explorerWhere() (+30 more)

### Community 37 - "contracts/index.ts"
Cohesion: 0.05
Nodes (71): zod, ADMIN_PASSWORD_POLICY, ADMIN_SESSION_POLICY, API_ROOTS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, SESSION_COOKIES, ApiErrorEnvelopeSchema (+63 more)

### Community 38 - "[newsId]/route.ts"
Cohesion: 0.09
Nodes (25): DELETE, params(), POST, runtime, DELETE, params(), PATCH, runtime (+17 more)

### Community 39 - "seed.ts"
Cohesion: 0.12
Nodes (24): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+16 more)

### Community 40 - "lucide-react"
Cohesion: 0.05
Nodes (156): lucide-react, react, PasswordForm(), ProfileForm(), RULES, DurationField(), durationPayload(), DurationValue (+148 more)

### Community 41 - "root-chrome.tsx"
Cohesion: 0.20
Nodes (11): AppShell(), AppShellProps, HIDDEN_MENU_PATHS, MobileShell(), MobileShellProps, StatusBarMock(), isAdminPath(), RootChrome() (+3 more)

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

### Community 46 - "parseJsonBody"
Cohesion: 0.05
Nodes (101): POST, runtime, DELETE, runtime, DELETE, runtime, POST, runtime (+93 more)

### Community 47 - "clock.ts"
Cohesion: 0.10
Nodes (25): dotenv, prisma, baseUrl, names, requested, systemClock, runAppAuthCleanupJob(), runNotificationDeliveriesJob() (+17 more)

### Community 48 - "settings-admin.service.ts"
Cohesion: 0.08
Nodes (48): request, savedRows, TOUCHED, countDeliveriesByStatus(), Db, deleteSettingRow(), findSettingRow(), listJobRunRows() (+40 more)

### Community 49 - "users.repository.ts"
Cohesion: 0.16
Nodes (23): activeRestrictionWhere(), endModerationAction(), findActiveRestrictions(), findCityProvince(), findUserByPhone(), findUserCore(), findUserIdentity(), insertModerationAction() (+15 more)

### Community 50 - "idempotency.ts"
Cohesion: 0.16
Nodes (13): getAppIdempotencyService(), globalIdempotency, IdempotencyScope, IdempotencyService, IdempotencyStore, StoredIdempotencyResult, scope, MemoryIdempotencyStore (+5 more)

### Community 51 - "dependencies"
Cohesion: 0.06
Nodes (36): dependencies, argon2, class-variance-authority, clsx, dotenv, farsi-tools, @fontsource-variable/vazirmatn, framer-motion (+28 more)

### Community 52 - "app-provider.tsx"
Cohesion: 0.17
Nodes (14): RootLayout(), AppProvider(), AppProviderProps, isAdminPath(), AppSplash(), POLLEN, EASE_GROW, SproutMark() (+6 more)

### Community 53 - "rich-text-editor.tsx"
Cohesion: 0.16
Nodes (17): @tiptap/extension-highlight, @tiptap/extension-image, @tiptap/extension-table, @tiptap/extension-text-align, @tiptap/extensions, @tiptap/react, @tiptap/starter-kit, altFromFile() (+9 more)

### Community 54 - "integrations/index.ts"
Cohesion: 0.08
Nodes (20): ConsoleSmsQueue, ObjectStorage, PaymentInitiation, PaymentProvider, SmsMessage, SmsProvider, SmsQueue, HttpObjectStorage (+12 more)

### Community 55 - "package.json"
Cohesion: 0.07
Nodes (27): eslintConfig, name, private, version, argon2, clsx, eslint, eslint-config-next (+19 more)

### Community 56 - "home-hero.tsx"
Cohesion: 0.11
Nodes (25): DayPart, getDayPart(), GREETINGS, HomeHero(), HomeHeroProps, POLLEN, STARS, EASE (+17 more)

### Community 57 - "reports-admin.service.ts"
Cohesion: 0.12
Nodes (36): median(), Bounds, completedTotals(), countActiveUsers(), countUnmatchedRequests(), countUsersBefore(), dailyNewProviders(), dailyNewUsers() (+28 more)

### Community 58 - "session.service.ts"
Cohesion: 0.09
Nodes (30): GET, runtime, AdminSessionLookup, findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup (+22 more)

### Community 59 - "validators/index.ts"
Cohesion: 0.20
Nodes (13): authFormSchema, AuthFormValues, otpSchema, phoneSchema, geoLocationSchema, CancelReasonFormValues, cancelReasonSchema, searchFormSchema (+5 more)

### Community 60 - "search/page.tsx"
Cohesion: 0.06
Nodes (50): framer-motion, HomePage(), HomePageContent(), Reveal(), EditLandPage(), NewLandPage(), ConsumerSearchContent(), ConsumerSearchPage() (+42 more)

### Community 61 - "validate-api-contracts.mjs"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 62 - "team.schemas.ts"
Cohesion: 0.06
Nodes (36): AccountPasswordSchema, AccountProfileSchema, AccountSessionRevokeSchema, ADMIN_STATUSES, AdminCreateInput, AdminCreateSchema, AdminOverrideInput, AdminOverrideParamsSchema (+28 more)

### Community 63 - "default-rate-limiter.ts"
Cohesion: 0.19
Nodes (12): createRateLimiter(), getAppRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy (+4 more)

### Community 64 - "Keshavarz Agricultural Services Platform (Mock)"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "observability/index.ts"
Cohesion: 0.10
Nodes (30): DeadLetterEntry, enqueuePaymentCallbackDeadLetter(), nextId(), queue, AlertType, emitAlert(), createLogger(), LogAttributes (+22 more)

### Community 66 - "requireAdminActor"
Cohesion: 0.03
Nodes (101): POST, runtime, GET, runtime, DELETE, params(), PATCH, runtime (+93 more)

### Community 67 - "Panel"
Cohesion: 0.07
Nodes (94): AdminPaymentsPage(), metadata, Stat(), AdminPaymentNotFound(), AdminPlansPage(), metadata, AdminSubscriptionsPage(), metadata (+86 more)

### Community 68 - "map-picker.tsx"
Cohesion: 0.05
Nodes (71): @neshan-maps-platform/maplibre-sdk, radix-ui, ConsumerLandsPage(), SortKey, SORTS, ADDED, FieldFallback(), LandCard() (+63 more)

### Community 69 - "billing.service.ts"
Cohesion: 0.14
Nodes (20): countSubscriptionsPerPlan(), findPlanIdByCode(), insertPlan(), listLivePlanIds(), listPlanRows(), nextPlanSortOrder(), setPlanSortOrder(), sumRevenuePerPlan() (+12 more)

### Community 70 - "generate-openapi.mjs"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "app-requests.ts"
Cohesion: 0.04
Nodes (93): isTakenByOther(), landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState (+85 more)

### Community 72 - "UserStatus"
Cohesion: 0.67
Nodes (3): UserListFilters, UserStatus, AdminUserList

### Community 73 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 74 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 75 - "app/layout.tsx"
Cohesion: 0.17
Nodes (8): @fontsource-variable/vazirmatn, viewport, metadata, viewport, SCREENSHOTS, APPLE_STARTUP_IMAGES, PWA_BRAND, STATUS_BAR_COLORS

### Community 76 - "users.service.ts"
Cohesion: 0.10
Nodes (27): findLocationNames(), findUserNote(), listModerationHistory(), listProvinceOptions(), listUserNotes(), loadRecentActivity(), updateUserNote(), ActivityKind (+19 more)

### Community 77 - "request-taken-state.tsx"
Cohesion: 0.28
Nodes (11): DUST, Field(), LostRequestScene(), RequestSlip(), RequestTakenState(), SceneBackdrop(), SceneFrame(), Tractor() (+3 more)

### Community 78 - "[userId]/page.tsx"
Cohesion: 0.09
Nodes (23): first(), Params, SearchParams, MODERATION_ACTIONS, ModerationAction, toLatinDigits(), USER_DETAIL_TABS, USER_LIST_PAGE_SIZES (+15 more)

### Community 79 - "prisma"
Cohesion: 0.08
Nodes (42): generateMetadata(), prisma, TransactionClient, AdminAuditRow, insertAdminAuditLog(), listAuditLogsForSubject(), JsonInput, RecordAdminAuditInput (+34 more)

### Community 80 - "(panel)/reports/page.tsx"
Cohesion: 0.21
Nodes (25): AdminReportsPage(), BUCKET_TEXT, metadata, GrowthTab(), Delta(), KpiTiles(), MarketplaceTab(), STATUS_ORDER (+17 more)

### Community 81 - "ref_node_path"
Cohesion: 0.09
Nodes (16): projectRoot, banned, collectFiles(), projectRoot, scanRoots, supportedExtensions, violations, bannedRoots (+8 more)

### Community 82 - "report-period.ts"
Cohesion: 0.14
Nodes (25): QUICK, addDays(), bucketFor(), BucketSlot, daysBetween(), dayToUtcNoon(), fromJalali(), JalaliDate (+17 more)

### Community 83 - "dashboard.service.ts"
Cohesion: 0.26
Nodes (16): activeRestriction(), countPendingProviders(), countRequestMetrics(), countUserMetrics(), DailyRow, loadDailySeries(), loadRecentRequests(), loadRecentUsers() (+8 more)

### Community 84 - "pwa-runtime.tsx"
Cohesion: 0.18
Nodes (17): applyUpdate(), offerUpdate(), PwaRuntime(), registerServiceWorker(), trackInstalling(), APP_INSTALLED_EVENT, BeforeInstallPromptEvent, detectPlatform() (+9 more)

### Community 85 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, sharp, tailwindcss, @tailwindcss/postcss (+6 more)

### Community 86 - "(panel)/providers/[providerId]/page.tsx"
Cohesion: 0.31
Nodes (8): AdminProviderDetailPage(), Params, SearchParams, GrantSubscriptionButton(), GalleryPanel(), PROVIDER_DETAIL_TABS, ProviderDetailTab, ProviderTabsNav()

### Community 87 - "sw.js"
Cohesion: 0.29
Nodes (8): BYPASS_PREFIXES, cacheFirst(), CACHES, isCacheable(), LIMITS, PRECACHE_URLS, staleWhileRevalidate(), trim()

### Community 88 - "admins/layout.tsx"
Cohesion: 0.27
Nodes (8): AdminsLayout(), metadata, readTheme(), viewport, AdminTheme, AdminThemeRoot(), ThemeContext, ADMIN_THEME_COOKIE

### Community 89 - "toast-provider.tsx"
Cohesion: 0.36
Nodes (7): sonner, ToastProvider(), topOffset(), OfflineIndicator(), subscribe(), useOnlineStatus(), setToasterMounted()

### Community 90 - "billing.repository.ts"
Cohesion: 0.16
Nodes (18): countPaymentsPerStatus(), Db, findPaymentForRefund(), insertManualRefund(), listPaymentRows(), PAYMENT_STATUS_GROUPS, paymentFilters(), PERIOD_DAYS (+10 more)

### Community 91 - "validate-api-boundaries.mjs"
Cohesion: 0.18
Nodes (9): collectFiles(), fail(), graph, projectRoot, sourceRoot, supportedExtensions, visit(), visited (+1 more)

### Community 92 - "notifications-admin.integration.test.ts"
Cohesion: 0.15
Nodes (16): consumerIds, PHONES, request, campaignStats(), countNotificationsPerType(), deliveryCounts(), findCampaignAudit(), listCampaignAudits() (+8 more)

### Community 93 - "audit-diff.tsx"
Cohesion: 0.60
Nodes (4): asRecord(), AuditDiff(), Json, render()

### Community 94 - "grantAdminSubscription"
Cohesion: 0.15
Nodes (17): cancelOpenPaymentsOfSubscription(), cancelSubscriptionRow(), expireSubscription(), findActiveSubscriptionRow(), findProviderByUserPublicId(), findSubscriptionByPublicId(), insertGrantedSubscription(), setSubscriptionEnd() (+9 more)

### Community 95 - "reports-admin.export.ts"
Cohesion: 0.14
Nodes (26): RFC-4180, GET, bucketize(), bucketSlots(), dayStart(), rangeBounds(), buildReportCsv(), Cell (+18 more)

### Community 97 - "notifications-admin.schemas.ts"
Cohesion: 0.12
Nodes (16): ADMIN_BROADCAST_LINKS, AUDIENCE_KINDS, AudienceInput, AudienceSchema, BroadcastInput, CampaignParamsSchema, CampaignRecipientsQuerySchema, CampaignsQuerySchema (+8 more)

### Community 98 - "report-format.ts"
Cohesion: 0.19
Nodes (17): KpiItem, atNoon(), axisTick(), bucketLabel(), bucketTick(), compact, decimal, formatDay() (+9 more)

### Community 99 - "validate-secret-scan.mjs"
Cohesion: 0.22
Nodes (8): allowlist, collectFiles(), patterns, projectRoot, scanRoots, skipDirectories, supportedExtensions, violations

### Community 100 - "app-auth.schemas.ts"
Cohesion: 0.18
Nodes (10): AdminLoginInput, AdminLoginSchema, input(), DIGIT_MAP, IranianMobileSchema, OptionalBigIntId, OtpRequestSchema, OtpVerifySchema (+2 more)

### Community 102 - "notification.repository.ts"
Cohesion: 0.36
Nodes (11): backoffMilliseconds(), deliverChannel(), isReadyForRetry(), runNotificationDeliveryJob(), listDeadLetterDeliveries(), listQueuedDeliveries(), markDeliveryFailed(), markDeliveryProcessing() (+3 more)

### Community 103 - "PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)"
Cohesion: 0.50
Nodes (4): Apple Touch Icon (180px, green goblet-with-hat logo), PWA Icon 192px (green goblet-with-hat logo), PWA Icon 512px (green goblet-with-hat logo), PWA App Icon Set (white line-art goblet with pointed farmer-style hat on green gradient rounded square)

### Community 104 - "Skeleton"
Cohesion: 0.07
Nodes (29): Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), AdminPanelLoading() (+21 more)

### Community 106 - "seed-worker.mts"
Cohesion: 0.27
Nodes (9): args, [command, ...rest], hashToken(), installAppSession(), makeOpaqueToken(), makePublicId(), seedApp(), seedProvider() (+1 more)

### Community 108 - "File Document Icon (Next.js starter)"
Cohesion: 0.67
Nodes (3): File Document Icon (Next.js starter), Globe Icon (Next.js starter), Browser Window Icon (Next.js starter)

### Community 114 - "listAdminSubscriptions"
Cohesion: 0.24
Nodes (10): countSubscriptionsPerStatus(), listPlanOptions(), listSubscriptionRows(), searchProviders(), subscriptionFilters(), userSearch(), getPlanOptions(), iso() (+2 more)

### Community 115 - "prisma.ts"
Cohesion: 0.06
Nodes (47): vitest, databaseEnvironment, globalForPrisma, createPublicId(), encodeBase32(), request, PHONES, session() (+39 more)

### Community 117 - "billing.integration.test.ts"
Cohesion: 0.22
Nodes (6): request, findPaymentDetail(), PlanCreateSchema, SubscriptionExtendSchema, SubscriptionGrantSchema, getAdminPayment()

### Community 118 - "getSecurityEnvironment"
Cohesion: 0.24
Nodes (9): getSecurityEnvironment(), throwSecurityEnvError(), getOtpPepperSecrets(), getTokenHashSecrets(), HmacEncoding, safeEqual(), signPayload(), signWithSecret() (+1 more)

### Community 119 - "reports-admin.schemas.ts"
Cohesion: 0.20
Nodes (9): REPORT_TAB_LABELS, optionalText, REPORT_DATASETS, REPORT_TABS, ReportDataset, ReportExportQuerySchema, ReportsQuery, ReportsQuerySchema (+1 more)

### Community 120 - "use-price-input.ts"
Cohesion: 0.33
Nodes (9): persian-tools, formatToPersianWords(), formatWithCommas(), parseToRawNumber(), sanitizeInput(), toEnglishDigits(), toPersianDigits(), usePriceInput() (+1 more)

### Community 121 - "deleteAdminPlan"
Cohesion: 0.38
Nodes (7): countOpenSubscriptionsForPlan(), findPlanById(), updatePlanRow(), deleteAdminPlan(), requirePlan(), rethrow(), updateAdminPlan()

### Community 122 - "next.config.ts"
Cohesion: 0.33
Nodes (3): APP_VERSION, nextConfig, securityHeaders

### Community 123 - "getUserSessionsTab"
Cohesion: 0.67
Nodes (3): listRecentOtpAttempts(), listUserSessions(), getUserSessionsTab()

## Ambiguous Edges - Review These
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` → `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **30 isolated node(s):** `@hookform/resolvers`, `@prisma/client`, `@tiptap/pm`, `farsi-tools`, `mariadb` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1198 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `faNumber`, `apiSuccess`, `catalog-admin.service.ts`, `providers-admin.service.ts`, `search-results-content.tsx`, `cn`, `catalog.service.ts`, `ServiceThumb`, `providers/services/page.tsx`, `types/index.ts`, `subscription/page.tsx`, `news-screen.tsx`, `app-auth.service.ts`, `shared/index.ts`, `news-admin.service.ts`, `team.service.ts`, `requests-admin.schemas.ts`, `sidebar.tsx`, `toPersianDigits`, `profile/page.tsx`, `permissions.ts`, `Badge`, `users/reports/page.tsx`, `admin-auth.service.ts`, `notifications-admin.service.ts`, `[newsId]/route.ts`, `lucide-react`, `root-chrome.tsx`, `parseJsonBody`, `settings-admin.service.ts`, `app-provider.tsx`, `package.json`, `home-hero.tsx`, `session.service.ts`, `search/page.tsx`, `requireAdminActor`, `Panel`, `map-picker.tsx`, `billing.service.ts`, `app-requests.ts`, `app/layout.tsx`, `users.service.ts`, `request-taken-state.tsx`, `[userId]/page.tsx`, `prisma`, `(panel)/reports/page.tsx`, `ref_node_path`, `report-period.ts`, `(panel)/providers/[providerId]/page.tsx`, `admins/layout.tsx`, `notifications-admin.integration.test.ts`, `prisma.ts`, `billing.integration.test.ts`, `reports-admin.schemas.ts`, `next.config.ts`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `@tiptap/pm` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `faNumber` be split into smaller, more focused modules?**
  _Cohesion score 0.060350877192982454 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `faNumber`, `search-results-content.tsx`, `catalog.service.ts`, `ServiceThumb`, `providers/services/page.tsx`, `types/index.ts`, `subscription/page.tsx`, `news-screen.tsx`, `shared/index.ts`, `sidebar.tsx`, `toPersianDigits`, `jalali.ts`, `profile/page.tsx`, `Badge`, `users/reports/page.tsx`, `lucide-react`, `root-chrome.tsx`, `rich-text-editor.tsx`, `home-hero.tsx`, `search/page.tsx`, `Panel`, `map-picker.tsx`, `app-requests.ts`, `(panel)/reports/page.tsx`, `report-period.ts`, `(panel)/providers/[providerId]/page.tsx`, `toast-provider.tsx`, `audit-diff.tsx`, `Skeleton`, `reports-admin.schemas.ts`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Should `apiSuccess` be split into smaller, more focused modules?**
  _Cohesion score 0.033720665299612665 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `ApiError` to `apiSuccess`, `catalog-admin.service.ts`, `providers-admin.service.ts`, `catalog.service.ts`, `app-profile.service.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `provider.service.ts`, `news-admin.service.ts`, `next`, `team.service.ts`, `requests-admin.schemas.ts`, `notification.service.ts`, `permissions.ts`, `search.service.ts`, `admin-auth.service.ts`, `notifications-admin.service.ts`, `[newsId]/route.ts`, `reports.service.ts`, `parseJsonBody`, `settings-admin.service.ts`, `users.repository.ts`, `idempotency.ts`, `session.service.ts`, `default-rate-limiter.ts`, `requireAdminActor`, `billing.service.ts`, `users.service.ts`, `prisma`, `report-period.ts`, `billing.repository.ts`, `grantAdminSubscription`, `prisma.ts`, `getSecurityEnvironment`, `deleteAdminPlan`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._