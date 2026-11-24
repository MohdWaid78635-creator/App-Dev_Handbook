export const securityTools = {
  title: 'Security Tools',
  src: 'Official tool documentation',
  cards: [
    {
      h: 'MobSF',
      body: 'Review a static report for your Android APK or AAB. Static analysis examines the packaged app and its configuration. Check each finding against how your app actually works.',
      ex: 'A sample report lists a camera permission for a habit tracker that never takes photos. Confirm it in the merged release manifest. After removing the unused permission, rebuild and record the manifest check and the result of testing the core journey.',
      note: 'Start with a local report for your own Android release. Match the report to the exact build you intend to ship.',
      sourceUrl: 'https://github.com/MobSF/Mobile-Security-Framework-MobSF',
    },
    {
      h: 'Gitleaks',
      body: 'Look for possible credentials in repository files and Git history. Treat the reported value as sensitive and record only redacted evidence.',
      ex: 'A report flags a value in a sample configuration file. Confirm whether it is a placeholder. For a real exposed key, record the rotation and the clean follow-up result without saving the key itself.',
      sourceUrl: 'https://github.com/gitleaks/gitleaks',
    },
    {
      h: 'Dependabot',
      body: 'Use dependency alerts to learn which package version is affected and whether a fixed version is available.',
      ex: 'The alert names a package in the lockfile. After updating, confirm the resolved version and rerun the app’s checks.',
      sourceUrl: 'https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts',
    },
    {
      h: 'Semgrep',
      body: 'Inspect static findings in your own source code. Read the flagged code and the rule to understand whether the finding applies.',
      ex: 'A rule flags a logger that may include private data. Check what the logger receives and verify that the corrected output is redacted.',
      sourceUrl: 'https://docs.semgrep.dev/semgrep-code/overview',
    },
    {
      h: 'ZAP passive scanning',
      body: 'For a project with a website or API, learn to read alerts from normal traffic. Passive scanning leaves the observed messages unchanged.',
      ex: 'An existing passive report flags a missing security header. Confirm which response it refers to and whether that header is relevant there.',
      sourceUrl: 'https://www.zaproxy.org/docs/desktop/addons/passive-scanner/',
    },
    {
      h: 'SafeLine',
      body: 'A self-hosted web application firewall filters traffic in front of a web app or API. Running it requires hosting, configuration, and maintenance.',
      ex: 'For a self-hosted API, compare the operational work of running a firewall with the controls your hosting provider already offers.',
      sourceUrl: 'https://github.com/chaitin/SafeLine',
    },
  ],
  ai: ['Give your coding agent a redacted report and the exact build ID. Ask it which findings apply, what evidence supports that judgment, and how to verify a fix.'],
  explain: 'Write a one-line note with the build ID, the finding, the fix or reason it does not apply, and the verification result.',
  try: [
    {
      type: 'match',
      q: 'Match each sample finding to the tool that would report it.',
      pairs: [
        ['An unused camera permission appears in an Android release report.', 'MobSF'],
        ['A possible API key appears in a Git commit.', 'Gitleaks'],
        ['A package in the lockfile has a security advisory.', 'Dependabot'],
      ],
      why: 'These tools inspect different parts of the project: the release artifact, the Git repository, and the dependency list.',
    },
    {
      type: 'order',
      q: 'Put the steps for reviewing a flagged camera permission in order.',
      items: [
        'Confirm the report matches the release build.',
        'Check the manifest and which features use the camera.',
        'Remove the unused permission and rebuild.',
        'Verify the new manifest and core journey, then record the result.',
      ],
      why: 'A finding becomes useful release evidence when it is tied to the right build and backed by a verification result.',
    },
  ],
};
