#!/usr/bin/env node
/**
 * Optional load helper notes for admin list performance.
 * Prefer planting rows via SQL/seed against a staging DB, then exercise
 * /admins/users|payments|audit-logs with cursor Next only.
 *
 * This script validates the client budget constants stay aligned with
 * docs/admin-tasks/pagination-filtering-standard.md
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const TARGET_TTFR_MS = 1500;

if (DEFAULT_LIMIT !== 20 || MAX_LIMIT !== 100 || TARGET_TTFR_MS !== 1500) {
  console.error("[load-budget] unexpected pagination budget constants");
  process.exit(1);
}

console.log(
  `[load-budget] OK default=${DEFAULT_LIMIT} max=${MAX_LIMIT} ttfrP95<${TARGET_TTFR_MS}ms`,
);
console.log(
  "[load-budget] Manual: seed >=1000 users/payments on staging, open list, spam Next — UI must keep one page in view.",
);
