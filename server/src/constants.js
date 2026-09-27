export const PHASES = [
  { key: "pre_release",  label: "Pre-release" },
  { key: "release_day",  label: "Release day" },
  { key: "post_release", label: "Post-release" },
];

export const STEPS = [
  { key: "code_review",        label: "Code review approved",         phase: "pre_release" },
  { key: "unit_tests",         label: "Unit tests passing",           phase: "pre_release" },
  { key: "regression_tests",   label: "Regression suite green",       phase: "pre_release" },
  { key: "docs_updated",       label: "Docs & release notes updated", phase: "pre_release" },
  { key: "rollback_plan",      label: "Rollback plan ready",          phase: "pre_release" },
  { key: "db_backup",          label: "DB backup verified",           phase: "release_day" },
  { key: "env_ready",          label: "Environment ready",            phase: "release_day" },
  { key: "smoke_tests",        label: "Production smoke tests pass",  phase: "post_release" },
  { key: "post_release_notes", label: "Retrospective notes captured", phase: "post_release" },
];

export const STEP_KEYS = STEPS.map((s) => s.key);

export const TOTAL_STEPS = STEPS.length; // 9