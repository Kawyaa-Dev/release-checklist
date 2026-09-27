// The 8 checklist steps every release follows.
// Order matters — this is the canonical order.
export const STEPS = [
  { key: "code_freeze",         label: "Code freeze" },
  { key: "tests_passing",       label: "Tests passing" },
  { key: "changelog_updated",   label: "Changelog updated" },
  { key: "version_bumped",      label: "Version bumped" },
  { key: "docs_updated",        label: "Docs updated" },
  { key: "deploy_staging",      label: "Deploy to staging" },
  { key: "deploy_production",   label: "Deploy to production" },
  { key: "post_release_notes",  label: "Post-release notes" },
];

export const STEP_KEYS = STEPS.map((s) => s.key);

export const TOTAL_STEPS = STEPS.length;