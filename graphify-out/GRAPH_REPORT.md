# Graph Report - keshavarz  (2026-11-22)

## Corpus Check
- 792 files · ~519,577 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 8, .css 4, .example 1)

## Summary
- 4783 nodes · 18346 edges · 143 communities (132 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ffcba650`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin/format.ts
- [userId]/page.tsx
- http/index.ts
- catalog-admin.service.ts
- providers-admin.service.ts
- search-results-content.tsx
- cn
- rich-content.ts
- ApiError
- Badge
- billing.schemas.ts
- providers/services/page.tsx
- field-weather-card.tsx
- subscription/page.tsx
- app-profile.service.ts
- envelope.ts
- news-screen.tsx
- app-auth.service.ts
- subscriptions.service.ts
- provider.service.ts
- types/index.ts
- news-admin.service.ts
- security/index.ts
- team.service.ts
- lucide-react
- [auditId]/page.tsx
- toPersianDigits
- notification.service.ts
- jalali.ts
- profile/page.tsx
- permissions.ts
- createPublicId
- EmptyState
- db.ts
- providers/reports/page.tsx
- admin-auth.service.ts
- notifications-admin.repository.ts
- contracts/index.ts
- next
- seed.ts
- admin-access-panels.tsx
- root-chrome.tsx
- validate-prisma-foundation.mjs
- reports.service.ts
- scripts
- generate-icons.mjs
- requireUserSession
- clock.ts
- settings-admin.service.ts
- users.service.ts
- idempotency.ts
- dependencies
- app-provider.tsx
- rich-text-editor.tsx
- integrations/index.ts
- package.json
- user-actions.tsx
- reports-admin.service.ts
- session.repository.ts
- validators/index.ts
- search/page.tsx
- validate-api-contracts.mjs
- team.schemas.ts
- default-rate-limiter.ts
- Keshavarz Agricultural Services Platform (Mock)
- observability/index.ts
- apiSuccess
- Panel
- provider-public-profile.tsx
- billing.service.ts
- generate-openapi.mjs
- app-requests.ts
- users.repository.ts
- compilerOptions
- components.json
- app/layout.tsx
- admin.integration.test.ts
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
- admin-shell.tsx
- toast-provider.tsx
- billing.repository.ts
- validate-api-boundaries.mjs
- notifications-admin.service.ts
- useCan
- grantAdminSubscription
- reports-admin.export.ts
- notifications-admin.schemas.ts
- report-format.ts
- validate-secret-scan.mjs
- vitest
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
- useAdminAction
- lands.service.ts
- AGENTS.md
- billing.integration.test.ts
- zod
- reports-admin.schemas.ts
- use-price-input.ts
- deleteAdminPlan
- prisma.ts
- catalog-admin.schemas.ts
- system/page.tsx
- service-form-dialog.tsx
- catalog.service.ts
- faNumber
- runInTransaction
- catalog-admin.repository.ts
- team.integration.test.ts
- team.repository.ts
- news-admin.integration.test.ts
- audit-viewer.service.ts
- errorMessage
- grant-subscription-dialog.tsx
- news-admin.repository.ts
- LocalObjectStorage
- cities/route.ts
- refundAdminPayment
- news.service.ts
- news-image.tsx
- MemoryStorage

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
- `LandCardProps` --references--> `Land`  [EXTRACTED]
  src/components/consumer-panel/land-card.tsx → src/types/consumer.ts
- `Checkbox()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/checkbox.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Parsimap map implementation (config, map component, picker)** — readme_parsimap_map, readme_parsimap_config, readme_parsimap_map_component, readme_map_picker [EXTRACTED 1.00]
- **Database schema sources kept in sync (schema.prisma, migration SQL, docs/database.schema)** — prisma_readme_schema_prisma, prisma_readme_initial_migration, prisma_readme_database_schema_doc, prisma_readme_sql_outside_dsl [EXTRACTED 1.00]
- **Next.js create-next-app boilerplate public assets (likely unused leftovers)** — public_file_file_icon, public_globe_globe_icon, public_window_window_icon, public_next_nextjs_logo, public_vercel_vercel_logo [INFERRED 0.95]
- **Same brand logo rendered at multiple PWA/Apple icon sizes** — public_icons_apple_touch_icon_icon, public_icons_icon_192_icon, public_icons_icon_512_icon [INFERRED 0.95]

## Communities (143 total, 11 thin omitted)

### Community 0 - "admin/format.ts"
Cohesion: 0.11
Nodes (34): AdminDashboardPage(), greeting(), metadata, AttentionList(), BarList(), KpiStrip(), ProvinceSpread(), RecentRequests() (+26 more)

### Community 1 - "[userId]/page.tsx"
Cohesion: 0.11
Nodes (29): AdminUserDetailPage(), first(), generateMetadata(), Params, SearchParams, UserTabsNav(), listProvinceOptions(), listRecentOtpAttempts() (+21 more)

### Community 2 - "http/index.ts"
Cohesion: 0.05
Nodes (54): GET, runtime, GET, runtime, GET, GET, runtime, GET (+46 more)

### Community 3 - "catalog-admin.service.ts"
Cohesion: 0.10
Nodes (45): cleanup(), countServiceReferences(), countServicesInCategory(), findCategoryById(), findCategoryIdBySlug(), findServiceById(), findServiceIdByName(), findServiceIdBySlug() (+37 more)

### Community 4 - "providers-admin.service.ts"
Cohesion: 0.05
Nodes (84): generateMetadata(), request, SERVICE_SLUGS, activeSubscriptionWhere(), baseWhere(), countCompletedJobs(), countProvidersPerTab(), Db (+76 more)

### Community 5 - "search-results-content.tsx"
Cohesion: 0.08
Nodes (36): ConsumerProviderProfileContent(), ConsumerProviderProfilePage(), isInternalPath(), safeResultsHref(), SearchResultsRoutePage(), CARD_STATE, describeSkipped(), LIST_ITEM_SPRING (+28 more)

### Community 6 - "cn"
Cohesion: 0.03
Nodes (83): class-variance-authority, react-hook-form, Header(), AppMenuTrigger(), AppMenuTriggerProps, PageHeaderProps, DashboardHero(), DashboardHeroProps (+75 more)

### Community 7 - "rich-content.ts"
Cohesion: 0.09
Nodes (33): dynamic, generateMetadata(), loadIntro, Params, readingMinutes(), ServiceIntroPage(), Align, alignStyle() (+25 more)

### Community 8 - "ApiError"
Cohesion: 0.10
Nodes (53): ApiError, isRetryablePrismaConflict(), mapPrismaError(), normalizeError(), completeAdminRequest(), withdrawAdminRequestLink(), canRevealContact(), decimal() (+45 more)

### Community 9 - "Badge"
Cohesion: 0.09
Nodes (53): AccountPage(), metadata, AdminPaymentPage(), Code(), metadata, AdminTeamAdminDetailPage(), Params, permissionSources() (+45 more)

### Community 10 - "billing.schemas.ts"
Cohesion: 0.07
Nodes (28): BILLING_PAGE_SIZES, BillingDuration, DurationSchema, PageSchema, PAYMENT_PERIODS, PAYMENT_STATUSES, PaymentRefundInput, PaymentRefundSchema (+20 more)

### Community 11 - "providers/services/page.tsx"
Cohesion: 0.05
Nodes (63): clampRadius(), ensureProviderProfile(), LoadState, parseTab(), profileToWorkCenter(), ProviderServicesContent(), ProviderServicesPage(), TabKey (+55 more)

### Community 12 - "field-weather-card.tsx"
Cohesion: 0.07
Nodes (53): HomePage(), HomePageContent(), Reveal(), AdviceTile(), LandWeatherCard(), LandWeatherCardProps, AdviceRow(), FieldWeatherCard() (+45 more)

### Community 13 - "subscription/page.tsx"
Cohesion: 0.06
Nodes (57): BENEFITS, ProviderSubscriptionPage(), Reveal(), DATE, PaymentDetails(), PaymentReturnContent(), ProviderSubscriptionReturnPage(), ResultBadge() (+49 more)

### Community 14 - "app-profile.service.ts"
Cohesion: 0.22
Nodes (15): getCurrentUserProfile(), profileSelect, replaceCurrentUserImage(), updateCurrentUserProfile(), deleteCurrentUserImage(), hasValidImageSignature(), IMAGE_TYPES, patchCurrentUserProfile() (+7 more)

### Community 15 - "envelope.ts"
Cohesion: 0.08
Nodes (34): loadSupportInfo(), SupportContact(), SupportInfo, adminRequest(), redirectToLogin(), APP_API_BASE, appApi, AppApiRequestOptions (+26 more)

### Community 16 - "news-screen.tsx"
Cohesion: 0.09
Nodes (40): metadata, NewsPage(), LatestNews(), State, ImportantBadge(), NewsLink(), ReadButton(), StalkNode() (+32 more)

### Community 17 - "app-auth.service.ts"
Cohesion: 0.09
Nodes (47): getSecurityEnvironment(), throwSecurityEnvError(), APP_SESSION_POLICY, OTP_POLICY, getClientIp(), createOtp(), phones, smsQueue (+39 more)

### Community 18 - "subscriptions.service.ts"
Cohesion: 0.11
Nodes (40): createUser(), phones, mapActiveSubscription(), mapPaymentDetail(), mapPaymentSummary(), mapPurchaseResult(), mapSubscriptionHistoryItem(), mapSubscriptionPlan() (+32 more)

### Community 19 - "provider.service.ts"
Cohesion: 0.10
Nodes (49): phones, decimalToString(), mapProviderGalleryImage(), mapProviderProfile(), mapProviderService(), mapPublicProviderProfile(), mapPublicProviderService(), countActiveProviderServices() (+41 more)

### Community 20 - "types/index.ts"
Cohesion: 0.06
Nodes (38): ProfileLayout(), ProvidersLayout(), UsersLayout(), viewport, ConsumerDock(), DockItem, DockNav(), DockNavProps (+30 more)

### Community 21 - "news-admin.service.ts"
Cohesion: 0.12
Nodes (30): hasValidImageSignature(), IMAGE_TYPES, MAX_IMAGE_BYTES, putImage(), readValidatedImage(), removeImageQuietly(), storageKeyFromUrl(), storageUnavailable() (+22 more)

### Community 22 - "security/index.ts"
Cohesion: 0.09
Nodes (40): POST, runtime, POST, runtime, POST, runtime, runtime, POST (+32 more)

### Community 23 - "team.service.ts"
Cohesion: 0.10
Nodes (36): generateMetadata(), AdminAccess, countActiveSuperAdmins(), countRoleAssignments(), deleteRoleAssignments(), findAdminIdByEmail(), findAdminIdByPhone(), findRoleById() (+28 more)

### Community 24 - "lucide-react"
Cohesion: 0.12
Nodes (30): lucide-react, radix-ui, react, AdminPanelError(), ServicesFilterBar(), AudienceKind, Recipient, RecipientPicker() (+22 more)

### Community 25 - "[auditId]/page.tsx"
Cohesion: 0.13
Nodes (25): AuditEntryPage(), metadata, ADMIN_NAV, AdminNavGroup, AdminNavItem, asRecord(), AuditDiff(), Json (+17 more)

### Community 26 - "toPersianDigits"
Cohesion: 0.06
Nodes (60): ALL_READINESS_KEYS, DashboardLoadState, ProviderHomePage(), Reveal(), COMPACT, ConsumerHomePage(), greetingFor(), Reveal() (+52 more)

### Community 27 - "notification.service.ts"
Cohesion: 0.13
Nodes (26): ALLOWED_DEEP_LINKS, extractDeepLinkFromData(), sanitizeNotificationDeepLink(), mapNotification(), countUnreadUserNotifications(), createNotificationWithDeliveries(), findExistingNotificationByEvent(), findUserNotificationByPublicId() (+18 more)

### Community 28 - "jalali.ts"
Cohesion: 0.13
Nodes (28): DatePickerStep(), DatePickerStepProps, isoForOffset(), MAX_SEARCH_DATES, QUICK_DAYS, DayCellData, PersianCalendar, PersianCalendarProps (+20 more)

### Community 29 - "profile/page.tsx"
Cohesion: 0.04
Nodes (110): zustand, AuthPage(), AuthPageContent(), STAGE_COPY, PLATFORM_LABEL, ProfilePage(), Reveal(), Section() (+102 more)

### Community 30 - "permissions.ts"
Cohesion: 0.04
Nodes (114): POST, runtime, self(), GET, PATCH, runtime, self(), POST (+106 more)

### Community 31 - "createPublicId"
Cohesion: 0.08
Nodes (42): createPublicId(), encodeBase32(), session(), createUser(), createUser(), cleanupAll(), cleanupUsers(), createLand() (+34 more)

### Community 32 - "EmptyState"
Cohesion: 0.08
Nodes (71): AdminRequestDetailPage(), Params, PaymentsTable(), RecipientsTable(), DeliveriesTable(), AsideRow(), AuditPanel(), CandidatesPanel() (+63 more)

### Community 33 - "db.ts"
Cohesion: 0.12
Nodes (21): createSearch(), getData(), idempotencyKey(), listCandidates(), mutation(), PROVIDER_PHONES, sendTo(), tomorrow() (+13 more)

### Community 34 - "providers/reports/page.tsx"
Cohesion: 0.06
Nodes (49): framer-motion, COMPACT, FULL, MONTH_YEAR, ProviderReportsPage(), RangeData, RangeKey, RANGES (+41 more)

### Community 35 - "admin-auth.service.ts"
Cohesion: 0.25
Nodes (14): getDeviceFingerprint(), getUserAgent(), createAdminSessionRow(), findAdminForLogin(), findAdminProfile(), registerFailedAdminLogin(), registerSuccessfulAdminLogin(), revokeAdminSessionRow() (+6 more)

### Community 36 - "notifications-admin.repository.ts"
Cohesion: 0.15
Nodes (20): audienceWhere(), BROADCAST_AUDIT_ACTION, BROADCAST_TYPE, campaignFilter(), CampaignStatsRow, countAudience(), deliveryWhere(), explorerWhere() (+12 more)

### Community 37 - "contracts/index.ts"
Cohesion: 0.09
Nodes (38): ADMIN_PASSWORD_POLICY, ADMIN_SESSION_POLICY, API_ROOTS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, SESSION_COOKIES, ApiErrorEnvelopeSchema, ApiErrorSchema (+30 more)

### Community 38 - "next"
Cohesion: 0.11
Nodes (12): next, POST, runtime, DELETE, params(), PATCH, runtime, POST (+4 more)

### Community 39 - "seed.ts"
Cohesion: 0.15
Nodes (23): CityRow, cleanName(), extractInsertRows(), isQuote(), loadCitiesFromSql(), loadProvincesFromSql(), parseNullableBigInt(), parseTimestamp() (+15 more)

### Community 40 - "admin-access-panels.tsx"
Cohesion: 0.12
Nodes (33): RefundButton(), RefundForm(), COPY, Kind, ReasonForm(), RequestHeaderActions(), WithdrawLinkButton(), OverrideDialog() (+25 more)

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
Cohesion: 0.22
Nodes (19): sharp, anyIconSvg(), appleIconSvg(), badgeSvg(), C, field(), generate(), ICONS_DIR (+11 more)

### Community 46 - "requireUserSession"
Cohesion: 0.03
Nodes (125): GET, runtime, DELETE, runtime, DELETE, runtime, GET, runtime (+117 more)

### Community 47 - "clock.ts"
Cohesion: 0.10
Nodes (27): localEnv, dotenv, prisma, baseUrl, names, requested, systemClock, runAppAuthCleanupJob() (+19 more)

### Community 48 - "settings-admin.service.ts"
Cohesion: 0.08
Nodes (48): request, savedRows, TOUCHED, countDeliveriesByStatus(), Db, deleteSettingRow(), findSettingRow(), listJobRunRows() (+40 more)

### Community 49 - "users.service.ts"
Cohesion: 0.10
Nodes (35): endModerationAction(), findCityProvince(), findUserByPhone(), findUserIdentity(), insertModerationAction(), insertUserNote(), lockUserForUpdate(), provinceExists() (+27 more)

### Community 50 - "idempotency.ts"
Cohesion: 0.17
Nodes (12): getAppIdempotencyService(), globalIdempotency, IdempotencyScope, IdempotencyService, IdempotencyStore, StoredIdempotencyResult, scope, MemoryIdempotencyStore (+4 more)

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
Cohesion: 0.12
Nodes (14): ConsoleSmsQueue, ObjectStorage, PaymentInitiation, PaymentProvider, SmsMessage, SmsProvider, SmsQueue, PutResponse (+6 more)

### Community 55 - "package.json"
Cohesion: 0.07
Nodes (26): eslintConfig, name, private, version, argon2, clsx, eslint, eslint-config-next (+18 more)

### Community 56 - "user-actions.tsx"
Cohesion: 0.13
Nodes (30): PlansTable(), SubscriptionActions(), CategoriesTable(), ServicesTable(), ProviderHeaderActions(), ServicesManager(), useAdminViewer(), useAdminTheme() (+22 more)

### Community 57 - "reports-admin.service.ts"
Cohesion: 0.13
Nodes (40): GET, median(), Bounds, completedTotals(), countActiveUsers(), countUnmatchedRequests(), countUsersBefore(), dailyNewProviders() (+32 more)

### Community 58 - "session.repository.ts"
Cohesion: 0.16
Nodes (16): GET, runtime, AdminSessionLookup, findActiveAdminSession(), findActiveUserSession(), findUserSessionByTokenHash(), isIdleExpired(), SessionLookup (+8 more)

### Community 59 - "validators/index.ts"
Cohesion: 0.18
Nodes (14): authFormSchema, AuthFormValues, otpSchema, phoneSchema, geoLocationSchema, landFormSchema, CancelReasonFormValues, cancelReasonSchema (+6 more)

### Community 60 - "search/page.tsx"
Cohesion: 0.06
Nodes (71): EditLandPage(), NewLandPage(), ConsumerLandsPage(), SortKey, SORTS, COMPACT, ConsumerReportsPage(), FULL (+63 more)

### Community 61 - "validate-api-contracts.mjs"
Cohesion: 0.12
Nodes (20): assertDomainMapping(), assertOperations(), assertPathParameters(), assertRequiredTags(), assertSameInventory(), catalogEndpoints, catalogPath, databaseSchemaPath (+12 more)

### Community 62 - "team.schemas.ts"
Cohesion: 0.06
Nodes (33): AccountPasswordSchema, AccountProfileSchema, AccountSessionRevokeSchema, ADMIN_STATUSES, AdminCreateInput, AdminOverrideInput, AdminOverrideParamsSchema, AdminOverrideSchema (+25 more)

### Community 63 - "default-rate-limiter.ts"
Cohesion: 0.19
Nodes (11): createRateLimiter(), globalRateLimit, MemoryEntry, MemoryRateLimitStore, RateLimiter, RateLimitIncrement, RateLimitPolicy, RateLimitResult (+3 more)

### Community 64 - "Keshavarz Agricultural Services Platform (Mock)"
Cohesion: 0.11
Nodes (18): allowBuilds (prisma engines, argon2, esbuild, sharp, unrs-resolver), pnpm Workspace Config, Prisma Database Foundation, docs/database.schema, Prisma/DB commands (validate, generate, migrate deploy, drift, seed), Initial MySQL Migration (20260803120000_initial_schema), schema.prisma (31 tables, type-safe mapping), Keshavarz Agricultural Services Platform (Mock) (+10 more)

### Community 65 - "observability/index.ts"
Cohesion: 0.09
Nodes (35): RequestId, apiErrorResponse(), createHeaders(), finalizeApiResponse(), ApiRequestContext, ApiRouteHandler, DeadLetterEntry, enqueuePaymentCallbackDeadLetter() (+27 more)

### Community 66 - "apiSuccess"
Cohesion: 0.05
Nodes (76): DELETE, params(), PATCH, runtime, POST, runtime, GET, POST (+68 more)

### Community 67 - "Panel"
Cohesion: 0.10
Nodes (73): AdminPaymentsPage(), metadata, Stat(), AdminPlansPage(), metadata, AdminSubscriptionsPage(), metadata, AdminCategoriesPage() (+65 more)

### Community 68 - "provider-public-profile.tsx"
Cohesion: 0.05
Nodes (75): @neshan-maps-platform/maplibre-sdk, ADDED, FieldFallback(), LandCard(), LandCardProps, LandForm(), FULL, locationLabel() (+67 more)

### Community 69 - "billing.service.ts"
Cohesion: 0.14
Nodes (20): countSubscriptionsPerPlan(), findPlanIdByCode(), insertPlan(), listLivePlanIds(), listPlanRows(), nextPlanSortOrder(), setPlanSortOrder(), sumRevenuePerPlan() (+12 more)

### Community 70 - "generate-openapi.mjs"
Cohesion: 0.15
Nodes (18): catalogPath, CREATED_OPERATIONS, createDocument(), createOperation(), createOperationId(), createParameters(), createPathParameters(), createPaths() (+10 more)

### Community 71 - "app-requests.ts"
Cohesion: 0.07
Nodes (48): isTakenByOther(), landToLocation(), ProviderRequestDetailPage(), Reveal(), SectionCard(), STAMP, WORK_DATE, ActionState (+40 more)

### Community 72 - "users.repository.ts"
Cohesion: 0.20
Nodes (15): activeRestrictionWhere(), buildUserWhere(), countUsersPerStatus(), findActiveRestrictions(), findLocationNames(), findUserCore(), listModerationHistory(), listUsers() (+7 more)

### Community 73 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 74 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 75 - "app/layout.tsx"
Cohesion: 0.21
Nodes (7): @fontsource-variable/vazirmatn, viewport, metadata, viewport, APPLE_STARTUP_IMAGES, PWA_BRAND, STATUS_BAR_COLORS

### Community 76 - "admin.integration.test.ts"
Cohesion: 0.22
Nodes (9): request, findUserNote(), listUserNotes(), loadRecentActivity(), updateUserNote(), deleteAdminUserNote(), getUserOverviewTab(), requireNote() (+1 more)

### Community 77 - "request-taken-state.tsx"
Cohesion: 0.28
Nodes (11): DUST, Field(), LostRequestScene(), RequestSlip(), RequestTakenState(), SceneBackdrop(), SceneFrame(), Tractor() (+3 more)

### Community 78 - "users.schemas.ts"
Cohesion: 0.12
Nodes (17): MODERATION_ACTIONS, ModerationAction, toLatinDigits(), USER_LIST_PAGE_SIZES, USER_LIST_SORTS, USER_STATUSES, UserDeleteSchema, UserModerationInput (+9 more)

### Community 79 - "requests-admin.service.ts"
Cohesion: 0.07
Nodes (47): generateMetadata(), listAuditLogsForSubject(), createRequest(), phones, PROVIDER_PHONES, providers, request, ACTOR (+39 more)

### Community 80 - "(panel)/reports/page.tsx"
Cohesion: 0.21
Nodes (24): BUCKET_TEXT, metadata, GrowthTab(), Delta(), KpiItem, KpiTiles(), MarketplaceTab(), STATUS_ORDER (+16 more)

### Community 81 - "ref_node_path"
Cohesion: 0.06
Nodes (20): APP_VERSION, nextConfig, securityHeaders, projectRoot, banned, collectFiles(), projectRoot, scanRoots (+12 more)

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
Cohesion: 0.16
Nodes (25): AdminProviderDetailPage(), Params, SearchParams, GalleryPanel(), ELIGIBILITY_GAP, ELIGIBILITY_ORDER, LINK_STATUS, PRICE_CHANGED_BY (+17 more)

### Community 87 - "sw.js"
Cohesion: 0.29
Nodes (8): BYPASS_PREFIXES, cacheFirst(), CACHES, isCacheable(), LIMITS, PRECACHE_URLS, staleWhileRevalidate(), trim()

### Community 88 - "admin-shell.tsx"
Cohesion: 0.15
Nodes (14): AdminsLayout(), metadata, readTheme(), viewport, AdminPanelLayout(), AdminViewerProvider(), AdminViewerSummary, AdminShell() (+6 more)

### Community 89 - "toast-provider.tsx"
Cohesion: 0.36
Nodes (7): sonner, ToastProvider(), topOffset(), OfflineIndicator(), subscribe(), useOnlineStatus(), setToasterMounted()

### Community 90 - "billing.repository.ts"
Cohesion: 0.14
Nodes (23): countPaymentsPerStatus(), countSubscriptionsPerStatus(), Db, listPaymentRows(), listPlanOptions(), listSubscriptionRows(), PAYMENT_STATUS_GROUPS, paymentFilters() (+15 more)

### Community 91 - "validate-api-boundaries.mjs"
Cohesion: 0.18
Nodes (9): collectFiles(), fail(), graph, projectRoot, sourceRoot, supportedExtensions, visit(), visited (+1 more)

### Community 92 - "notifications-admin.service.ts"
Cohesion: 0.10
Nodes (33): consumerIds, PHONES, request, campaignStats(), countNotificationsPerType(), deliveryCounts(), findCampaignAudit(), findDelivery() (+25 more)

### Community 93 - "useCan"
Cohesion: 0.11
Nodes (26): CatalogThumb(), CatalogStatusBadge(), SpecialMark(), AddNewsButton(), NewsDialogMode, NewsFormDialog(), NewsTable(), GalleryImage (+18 more)

### Community 94 - "grantAdminSubscription"
Cohesion: 0.24
Nodes (10): expireSubscription(), findActiveSubscriptionRow(), findProviderByUserPublicId(), insertGrantedSubscription(), setSubscriptionEnd(), addDuration(), durationLabel(), extendAdminSubscription() (+2 more)

### Community 95 - "reports-admin.export.ts"
Cohesion: 0.13
Nodes (18): RFC-4180, AdminReportsPage(), periodQuery(), formatJalaliInput(), buildReportCsv(), Cell, GROWTH_LABELS, jalali() (+10 more)

### Community 97 - "notifications-admin.schemas.ts"
Cohesion: 0.12
Nodes (16): ADMIN_BROADCAST_LINKS, AUDIENCE_KINDS, AudienceInput, AudienceSchema, BroadcastInput, CampaignParamsSchema, CampaignRecipientsQuerySchema, CampaignsQuerySchema (+8 more)

### Community 98 - "report-format.ts"
Cohesion: 0.22
Nodes (15): atNoon(), axisTick(), bucketLabel(), bucketTick(), compact, decimal, formatDay(), fullDateFormatter (+7 more)

### Community 99 - "validate-secret-scan.mjs"
Cohesion: 0.22
Nodes (8): allowlist, collectFiles(), patterns, projectRoot, scanRoots, skipDirectories, supportedExtensions, violations

### Community 100 - "vitest"
Cohesion: 0.10
Nodes (11): vitest, AdminLoginInput, AdminLoginSchema, input(), DIGIT_MAP, IranianMobileSchema, OptionalBigIntId, OtpRequestSchema (+3 more)

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

### Community 114 - "useAdminAction"
Cohesion: 0.11
Nodes (28): PasswordForm(), ProfileForm(), RULES, AddPlanButton(), PlanDialogMode, PlanForm(), PlanFormDialog(), CategoryForm() (+20 more)

### Community 115 - "lands.service.ts"
Cohesion: 0.27
Nodes (14): decimalToString(), mapLand(), countLandServiceRequests(), createUserLand(), findUserLandByPublicId(), landSelect, listUserLands(), softDeleteUserLand() (+6 more)

### Community 117 - "billing.integration.test.ts"
Cohesion: 0.22
Nodes (6): request, findPaymentDetail(), PlanCreateSchema, SubscriptionExtendSchema, SubscriptionGrantSchema, getAdminPayment()

### Community 118 - "zod"
Cohesion: 0.06
Nodes (34): zod, createCursorPaginationSchema(), CatalogSlugSchema, CategoryParamsSchema, ServiceParamsSchema, AreaSchema, LandCreateSchema, LandParamsSchema (+26 more)

### Community 119 - "reports-admin.schemas.ts"
Cohesion: 0.18
Nodes (10): REPORT_TAB_LABELS, ReportTabs(), optionalText, REPORT_DATASETS, REPORT_TABS, ReportDataset, ReportExportQuerySchema, ReportsQuery (+2 more)

### Community 120 - "use-price-input.ts"
Cohesion: 0.33
Nodes (9): persian-tools, formatToPersianWords(), formatWithCommas(), parseToRawNumber(), sanitizeInput(), toEnglishDigits(), toPersianDigits(), usePriceInput() (+1 more)

### Community 121 - "deleteAdminPlan"
Cohesion: 0.38
Nodes (7): countOpenSubscriptionsForPlan(), findPlanById(), updatePlanRow(), deleteAdminPlan(), requirePlan(), rethrow(), updateAdminPlan()

### Community 122 - "prisma.ts"
Cohesion: 0.10
Nodes (19): @prisma/adapter-mariadb, GET, runtime, databaseEnvironment, globalForPrisma, prisma, TransactionClient, AdminGrantRows (+11 more)

### Community 123 - "catalog-admin.schemas.ts"
Cohesion: 0.07
Nodes (29): PNG, request, findServiceDetails(), CATALOG_STATUSES, CatalogSlugInputSchema, CatalogStatusFilter, CategoriesListQuery, CategoriesListQuerySchema (+21 more)

### Community 124 - "system/page.tsx"
Cohesion: 0.09
Nodes (22): AdminPaymentNotFound(), CampaignNotFound(), ProviderNotFound(), RequestNotFound(), AdminSystemStatusPage(), CHANNEL, DELIVERY_STATUS, dynamic (+14 more)

### Community 125 - "service-form-dialog.tsx"
Cohesion: 0.14
Nodes (25): AddCategoryButton(), AddServiceButton(), CategoryDialogMode, submit(), CategoryFormDialog(), ACCEPTED, ImageChange, ImageField() (+17 more)

### Community 126 - "catalog.service.ts"
Cohesion: 0.16
Nodes (24): parseStoredRichDoc(), RichDoc, cache, CacheEntry, getCatalogCache(), setCatalogCache(), mapCategory(), mapService() (+16 more)

### Community 127 - "faNumber"
Cohesion: 0.19
Nodes (20): CampaignOverview(), CampaignsTable(), DeliverySummary(), ReadMeter(), send(), ExplorerFilterBar(), NotificationRow(), NotificationsList() (+12 more)

### Community 128 - "runInTransaction"
Cohesion: 0.29
Nodes (22): runInTransaction(), changeOwnPassword(), revokeOwnSessions(), updateOwnProfile(), recordAdminAudit(), uploadCatalogImage(), lockAdminRows(), revokeAdminSessions() (+14 more)

### Community 129 - "catalog-admin.repository.ts"
Cohesion: 0.16
Nodes (21): CATEGORY_SELECT, categorySearch(), countCategoriesPerStatus(), countRequestsPerCategory(), countServicesPerCategory(), countServicesPerStatus(), countSpecialServices(), Db (+13 more)

### Community 130 - "team.integration.test.ts"
Cohesion: 0.14
Nodes (18): generateMetadata(), resolveAdminAccess(), getOwnAccount(), iso(), OwnAccount, Self, PHONES, request (+10 more)

### Community 131 - "team.repository.ts"
Cohesion: 0.15
Nodes (19): adminFilters(), adminStatusWhere(), AUDIT_SELECT, countAdminsPerStatus(), Db, deleteOverride(), findOverride(), listAdminRows() (+11 more)

### Community 132 - "news-admin.integration.test.ts"
Cohesion: 0.15
Nodes (13): MemoryStorage, PNG, cleanUrl(), ImageUrlSchema, LinkSchema, NEWS_PAGE_SIZES, NewsCreateSchema, NewsIdParamsSchema (+5 more)

### Community 133 - "audit-viewer.service.ts"
Cohesion: 0.18
Nodes (15): AuditDetail, AuditList, auditRange(), AuditRowLike, AuditSubject, getAuditEntry(), listAuditEntries(), mapAuditRows() (+7 more)

### Community 134 - "errorMessage"
Cohesion: 0.23
Nodes (12): AdminLoginPage(), metadata, AdminLoginScreen(), onSubmit(), FieldRows(), RunJobButton(), run(), BrandMark() (+4 more)

### Community 135 - "grant-subscription-dialog.tsx"
Cohesion: 0.25
Nodes (13): DurationField(), durationPayload(), DurationValue, GrantForm(), submit(), GrantPlanOption, GrantProvider, GrantSubscriptionButton() (+5 more)

### Community 136 - "news-admin.repository.ts"
Cohesion: 0.20
Nodes (13): foldChar(), LETTERS, normalizeSearchText(), searchWords(), TitlePart, adminList(), countNewsPerImportance(), Db (+5 more)

### Community 137 - "LocalObjectStorage"
Cohesion: 0.19
Nodes (6): HttpObjectStorage, ObjectStorageUnavailableError, LocalObjectStorage, resolveImageStorage(), resolveStorage(), resolveGalleryStorage()

### Community 138 - "cities/route.ts"
Cohesion: 0.24
Nodes (9): GET, runtime, GET, runtime, listActiveCitiesByProvinceId(), listActiveProvinces(), ProvinceIdParamSchema, getCitiesForProvince() (+1 more)

### Community 139 - "refundAdminPayment"
Cohesion: 0.20
Nodes (11): cancelOpenPaymentsOfSubscription(), cancelSubscriptionRow(), findPaymentForRefund(), findSubscriptionByPublicId(), insertManualRefund(), setPaymentStatus(), sumSucceededRefunds(), cancelAdminSubscription() (+3 more)

### Community 140 - "news.service.ts"
Cohesion: 0.31
Nodes (9): feed(), countNews(), listNewsFeedRows(), titleMatches(), NewsFeedQuery, getNewsFeed(), NewsFeed, NewsFeedItem (+1 more)

### Community 141 - "news-image.tsx"
Cohesion: 0.48
Nodes (6): Fit, fitFor(), NewsImage(), Picture(), Placeholder(), State

## Ambiguous Edges - Review These
- `Mock OTP Authentication (code 12345, demo client/provider numbers)` → `Retired src/lib/mock seed data (Phase 13)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **30 isolated node(s):** `@hookform/resolvers`, `@prisma/client`, `@tiptap/pm`, `farsi-tools`, `mariadb` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1199 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `admin/format.ts`, `[userId]/page.tsx`, `http/index.ts`, `team.integration.test.ts`, `catalog-admin.service.ts`, `search-results-content.tsx`, `errorMessage`, `rich-content.ts`, `cn`, `Badge`, `cities/route.ts`, `providers/services/page.tsx`, `field-weather-card.tsx`, `subscription/page.tsx`, `news-screen.tsx`, `app-auth.service.ts`, `types/index.ts`, `news-admin.service.ts`, `security/index.ts`, `providers-admin.service.ts`, `lucide-react`, `[auditId]/page.tsx`, `toPersianDigits`, `news-admin.integration.test.ts`, `team.service.ts`, `profile/page.tsx`, `permissions.ts`, `EmptyState`, `providers/reports/page.tsx`, `admin-auth.service.ts`, `admin-access-panels.tsx`, `root-chrome.tsx`, `requireUserSession`, `settings-admin.service.ts`, `users.service.ts`, `app-provider.tsx`, `package.json`, `user-actions.tsx`, `session.repository.ts`, `search/page.tsx`, `observability/index.ts`, `apiSuccess`, `Panel`, `provider-public-profile.tsx`, `billing.service.ts`, `app-requests.ts`, `app/layout.tsx`, `admin.integration.test.ts`, `request-taken-state.tsx`, `requests-admin.service.ts`, `(panel)/reports/page.tsx`, `ref_node_path`, `provider-detail.tsx`, `admin-shell.tsx`, `notifications-admin.service.ts`, `useCan`, `useAdminAction`, `billing.integration.test.ts`, `reports-admin.schemas.ts`, `prisma.ts`, `catalog-admin.schemas.ts`, `system/page.tsx`, `service-form-dialog.tsx`, `faNumber`?**
  _High betweenness centrality (0.384) - this node is a cross-community bridge._
- **What connects `@hookform/resolvers`, `@prisma/client`, `@tiptap/pm` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `admin/format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10953058321479374 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `admin/format.ts`, `[userId]/page.tsx`, `search-results-content.tsx`, `errorMessage`, `grant-subscription-dialog.tsx`, `rich-content.ts`, `Badge`, `providers/services/page.tsx`, `field-weather-card.tsx`, `subscription/page.tsx`, `news-image.tsx`, `news-screen.tsx`, `types/index.ts`, `lucide-react`, `[auditId]/page.tsx`, `toPersianDigits`, `jalali.ts`, `profile/page.tsx`, `EmptyState`, `providers/reports/page.tsx`, `admin-access-panels.tsx`, `root-chrome.tsx`, `rich-text-editor.tsx`, `user-actions.tsx`, `search/page.tsx`, `Panel`, `provider-public-profile.tsx`, `app-requests.ts`, `(panel)/reports/page.tsx`, `provider-detail.tsx`, `admin-shell.tsx`, `toast-provider.tsx`, `useCan`, `Skeleton`, `useAdminAction`, `reports-admin.schemas.ts`, `system/page.tsx`, `service-form-dialog.tsx`, `faNumber`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `[userId]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11264367816091954 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `ApiError` to `runInTransaction`, `http/index.ts`, `team.integration.test.ts`, `catalog-admin.service.ts`, `providers-admin.service.ts`, `cities/route.ts`, `refundAdminPayment`, `app-profile.service.ts`, `app-auth.service.ts`, `subscriptions.service.ts`, `provider.service.ts`, `news-admin.service.ts`, `security/index.ts`, `team.service.ts`, `notification.service.ts`, `permissions.ts`, `createPublicId`, `admin-auth.service.ts`, `notifications-admin.repository.ts`, `next`, `reports.service.ts`, `requireUserSession`, `settings-admin.service.ts`, `users.service.ts`, `idempotency.ts`, `default-rate-limiter.ts`, `observability/index.ts`, `apiSuccess`, `billing.service.ts`, `admin.integration.test.ts`, `requests-admin.service.ts`, `report-period.ts`, `notifications-admin.service.ts`, `grantAdminSubscription`, `lands.service.ts`, `deleteAdminPlan`, `catalog-admin.schemas.ts`, `catalog.service.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mock OTP Authentication (code 12345, demo client/provider numbers)` and `Retired src/lib/mock seed data (Phase 13)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._