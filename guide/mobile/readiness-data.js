// Keep existing item positions stable because checklist answers use group IDs and item positions.
window.READINESS_GROUPS = [
  ['auth', 'Authentication and accounts', 4, [
    'Production authentication configured', 'Session persistence matches the app’s security needs', 'Token refresh works',
    'Email verification works if used', 'Password recovery works if used', 'Signed-out users are redirected from private screens',
    'Logout clears private app state', 'Account deletion works where applicable', 'Sensitive session storage is protected',
  ]],
  ['database', 'Database security', 5, [
    'Row Level Security or equivalent rules are enabled', 'Two ordinary accounts cannot access each other’s records',
    'Roles match the product’s access rules', 'Database privileges are limited to needed operations',
    'Privileged database keys stay on the server', 'Database-facing input is validated', 'Constraints enforce data integrity',
    'Backup and restore have been rehearsed',
  ]],
  ['api', 'API and backend security', 9, [
    'Server-side rate limits are enforced', 'The server verifies caller identity', 'The server checks ownership and permissions',
    'Request payloads are validated', 'Request sizes are limited', 'Requests have timeouts', 'Environment secrets are protected',
    'Webhook signatures are verified where used', 'Dependencies are checked for known vulnerabilities', 'Sensitive data is redacted from logs',
  ]],
  ['money', 'AI, payments and cost controls', 7, [
    'Privileged AI calls run on the server', 'Per-user AI quotas are enforced', 'AI request and response token budgets are capped',
    'Credit deductions are atomic under concurrency', 'Retries cannot duplicate charges or credits', 'Subscriptions are verified server-side',
    'Billable actions stop at spending limits', 'Abuse signals can be reviewed',
  ]],
  ['queries', 'Database performance', 5, [
    'Indexes reflect real query patterns', 'Foreign key indexes are reviewed for benefit', 'Slow queries are measured and tuned',
    'Large result sets are paginated', 'Only needed data is fetched', 'Connections and pooling are appropriate', 'Transactions preserve data integrity',
  ]],
  ['performance', 'App performance', 6, [
    'Caching has a clear scope and invalidation rule', 'Images are sized and compressed', 'Expensive resources are loaded when needed',
    'Long lists use appropriate virtualization', 'Search requests are debounced where useful', 'Repeated renders are measured and reduced where needed',
    'Release bundle size is measured', 'Network retries are bounded',
  ]],
  ['ux', 'UX and reliability', 6, [
    'Loading feedback or a skeleton is shown where useful', 'Empty screens explain the next action', 'Errors explain how to recover',
    'Offline behavior is clear', 'Screen failures have an error boundary or fallback', 'Repeated taps do not duplicate writes',
    'The keyboard does not hide key fields or actions', 'Core tasks work with accessibility settings', 'Feedback is consistent across screens',
  ]],
  ['testing', 'Testing and monitoring', 8, [
    'Unit tests cover important rules', 'Integration tests cover the core journey', 'Authentication flow is tested',
    'Cross-account isolation is tested with disposable data', 'Rate limiting is tested safely in development',
    'Crash reports identify the release', 'Performance signals are monitored', 'Backend errors reach an owner',
  ]],
  ['release', 'Android deployment', 10, [
    'Development and production environments are separate', 'Production EAS or equivalent build configuration is correct',
    'Signing and upload keys are handled securely', 'Android permissions match the features', 'Sensitive debug logs are absent in the release',
    'Privacy policy reflects the app', 'Play Data Safety matches the app and SDKs', 'The installed release build passes the smoke test',
    'Rollback or recovery is documented',
  ]],
  ['security-extra', 'Advanced security', 9, [
    'Applicable mobile and API security controls are reviewed', 'HTTPS is enforced', 'Token expiry and revocation are tested',
    'Sign-in has brute-force protection', 'Secrets can be rotated with minimal interruption', 'Uploads are validated if used',
    'Storage bucket access policies are reviewed', 'Deep links validate destinations and respect authorization',
    'Admin privileges are independently enforced', 'AI inputs and model-suggested actions are treated as untrusted',
  ]],
  ['scale', 'Scalability and failure recovery', 11, [
    'Expected concurrency is tested in a safe environment', 'Database resource usage is monitored',
    'Repeated upstream failures have an appropriate stop or fallback', 'Retries back off and stop after a limit',
    'Background work handles interruptions', 'Provider outages degrade gracefully', 'Migrations are reviewed and rehearsed',
  ]],
  ['code', 'Maintainability', 2, [
    'Strict type checks are enabled where the stack supports them', 'Repeated UI uses shared components where it helps',
    'Errors are handled consistently', 'API calls share configuration and timeouts', 'Project structure is documented and consistent',
    'Unused dependencies are removed', 'Dead or duplicate code is reviewed',
    'Repository documentation covers architecture, security, tests, deployment and changes', 'Automated checks run before release',
  ]],
  ['operations', 'Business and incident response', 11, [
    'Global spend limits are enforced where applicable', 'Usage and billing alerts have an owner', 'Free-tier abuse is addressed',
    'Subscription expiry removes access at the right time', 'Refunds and cancellations are handled',
    'Retention and deletion rules are documented', 'Applicable terms are available', 'Incident response and communication are rehearsed',
  ]],
  ['android-extra', 'Android compatibility and quality', 12, [
    'Version numbers and build identifiers are recorded', 'Older apps can still use newer APIs during rollout', 'Target SDK meets applicable requirements',
    'Core journey is tested on a low-end phone', 'Slow network behavior is tested', 'Cold startup is measured',
    'Background, resume and process restart are tested', 'App integrity checks are considered where appropriate',
  ]],
  ['control-plane', 'Service ownership and API inventory', 9, [
    'An owner can identify sensitive data, trust boundaries, and which services process it',
    'Privileged repository, store, CI and backend accounts have MFA and least-privilege access where supported',
    'There is an inventory of live API routes, versions, owners and retired or debug endpoints',
    'APIs restrict which record fields callers may read and change',
    'Server features that fetch external URLs restrict destinations and validate third-party responses where applicable',
    'Third-party SDK data collection, telemetry and consent are reviewed against privacy disclosures',
  ], [
    ['OWASP API Security Top 10', 'https://api-security.owasp.org/editions/2023/en/0x11-t10/'],
    ['Supabase production security checklist', 'https://supabase.com/docs/guides/security/production-checklist'],
    ['Google Play Data safety', 'https://support.google.com/googleplay/android-developer/answer/10787469'],
  ]],
  ['artifact', 'Android release artifact checks', 10, [
    'The merged release manifest exposes only intended Android components with appropriate permissions',
    'Android backups and device transfers exclude sensitive app data as appropriate',
    'The production network configuration disallows unintended cleartext and debug trust settings',
    'The signed release bundle and its native dependencies meet applicable 16 KB page-size requirements',
    'Over-the-air updates target the intended channel and compatible runtime where used',
    'A static security report for the Android release was reviewed and applicable findings were verified',
  ], [
    ['Android exported components', 'https://developer.android.com/privacy-and-security/risks/android-exported'],
    ['Android backup recommendations', 'https://developer.android.com/privacy-and-security/risks/backup-best-practices'],
    ['Android network configuration', 'https://developer.android.com/privacy-and-security/security-config'],
    ['Android 16 KB compatibility', 'https://developer.android.com/guide/practices/page-sizes'],
    ['Expo Update runtime versions', 'https://docs.expo.dev/eas-update/runtime-versions/'],
    ['MobSF', 'https://github.com/MobSF/Mobile-Security-Framework-MobSF'],
    ['OWASP Mobile Application Security Verification Standard', 'https://mas.owasp.org/MASVS/'],
  ]],
  ['recovery-proof', 'Release and recovery evidence', 11, [
    'The exact release artifact can be traced to a commit, dependencies and its build record',
    'The restore rehearsal covers database records and any separately stored files, with time and data loss recorded',
    'Release and rollback decisions have a named owner, measurable stop criteria, and a known recovery procedure',
  ], [
    ['NIST Secure Software Development Framework', 'https://csrc.nist.gov/pubs/sp/800/218/final'],
    ['Supabase database backups', 'https://supabase.com/docs/guides/platform/backups'],
    ['Android vitals', 'https://developer.android.com/google/play/vitals'],
  ]],
];
