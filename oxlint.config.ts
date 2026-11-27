const oxlint = require('oxlint');
const solanaConfig = require('@solana-config/oxc/oxlint');

module.exports = oxlint.defineConfig({
    extends: [solanaConfig],
    // Keep in sync with oxfmt.config.ts so both tools reason about the same files.
    ignorePatterns: [
        '**/dist/**',
        '.changeset/**',
        '.github/workflows/PULL_REQUEST_TEMPLATE.md',
        'AGENTS.md',
        'CHANGELOG.md',
        'CLAUDE.md',
        'pnpm-lock.yaml',
        'test/e2e/*/docs/**',
        'test/e2e/*/idl.json',
        'test/e2e/*/pnpm-lock.yaml',
    ],
    options: { typeAware: true },
});
