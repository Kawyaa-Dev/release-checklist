import { describe, it, expect } from "vitest";
import { computeStatus } from "../src/status.js";
import { STEP_KEYS, TOTAL_STEPS } from "../src/constants.js";

describe("computeStatus", () => {
  it("returns 'planned' when no steps are completed", () => {
    expect(computeStatus([])).toBe("planned");
    expect(computeStatus()).toBe("planned");
  });

  it("returns 'ongoing' when at least one step is completed", () => {
    expect(computeStatus([STEP_KEYS[0]])).toBe("ongoing");
    expect(computeStatus([STEP_KEYS[0], STEP_KEYS[1]])).toBe("ongoing");
    expect(computeStatus(STEP_KEYS.slice(0, TOTAL_STEPS - 1))).toBe("ongoing");
  });

  it("returns 'done' when all steps are completed", () => {
    expect(computeStatus(STEP_KEYS)).toBe("done");
  });

  it("ignores unknown step keys", () => {
    expect(computeStatus(["not_a_real_step"])).toBe("planned");
    expect(computeStatus([...STEP_KEYS, "not_a_real_step"])).toBe("done");
  });
});