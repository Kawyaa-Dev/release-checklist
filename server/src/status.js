import { STEP_KEYS, TOTAL_STEPS } from "./constants.js";

/**
 * Compute a release's status from its completed steps.
 *
 * Rules (per assignment):
 *   - No step completed       -> "planned"
 *   - At least one completed  -> "ongoing"
 *   - All steps completed     -> "done"
 *
 * @param {string[]} completedSteps - keys of completed steps
 * @returns {"planned"|"ongoing"|"done"}
 */
export function computeStatus(completedSteps = []) {
  // Filter out any unknown keys defensively so bad data can't skew the status.
  const valid = completedSteps.filter((k) => STEP_KEYS.includes(k));

  if (valid.length === 0) return "planned";
  if (valid.length >= TOTAL_STEPS) return "done";
  return "ongoing";
}