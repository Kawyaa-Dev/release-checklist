import { prisma } from "../prisma.js";
import { STEPS, STEP_KEYS, TOTAL_STEPS } from "../constants.js";
import { computeStatus } from "../status.js";
import { cached, cacheInvalidate } from "../cache.js";

/**
 * Shape a Prisma Release row into the GraphQL Release shape.
 * Status + steps are computed on the fly.
 */
function shapeRelease(row) {
  const completed = new Set(row.completedSteps || []);
  return {
    id: row.id,
    name: row.name,
    date: row.date.toISOString(),
    additionalInfo: row.additionalInfo ?? null,
    status: computeStatus(row.completedSteps || []),
    steps: STEPS.map((s) => ({
      key: s.key,
      label: s.label,
      completed: completed.has(s.key),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const resolvers = {
  Query: {
    releases: async () => {
      return cached("releases:all", 5000, async () => {
        const rows = await prisma.release.findMany({
          orderBy: { date: "desc" },
        });
        return rows.map(shapeRelease);
      });
    },

    release: async (_parent, { id }) => {
      const row = await prisma.release.findUnique({ where: { id } });
      return row ? shapeRelease(row) : null;
    },
  },

  Mutation: {
    createRelease: async (_parent, { name, date, additionalInfo }) => {
      if (!name || !name.trim()) {
        throw new Error("Name is required");
      }
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        throw new Error("Invalid date");
      }

      const row = await prisma.release.create({
        data: {
          name: name.trim(),
          date: parsed,
          additionalInfo: additionalInfo?.trim() || null,
          completedSteps: [],
        },
      });

      cacheInvalidate("releases:");
      return shapeRelease(row);
    },

    toggleStep: async (_parent, { releaseId, stepKey }) => {
      if (!STEP_KEYS.includes(stepKey)) {
        throw new Error(`Unknown step: ${stepKey}`);
      }

      const existing = await prisma.release.findUnique({
        where: { id: releaseId },
      });
      if (!existing) throw new Error("Release not found");

      const current = new Set(existing.completedSteps || []);
      if (current.has(stepKey)) {
        current.delete(stepKey);
      } else {
        current.add(stepKey);
      }

      const row = await prisma.release.update({
        where: { id: releaseId },
        data: { completedSteps: Array.from(current) },
      });

      cacheInvalidate("releases:");
      return shapeRelease(row);
    },

    updateReleaseInfo: async (_parent, { id, additionalInfo }) => {
      const existing = await prisma.release.findUnique({ where: { id } });
      if (!existing) throw new Error("Release not found");

      const row = await prisma.release.update({
        where: { id },
        data: { additionalInfo: additionalInfo?.trim() || null },
      });

      cacheInvalidate("releases:");
      return shapeRelease(row);
    },

    deleteRelease: async (_parent, { id }) => {
      try {
        await prisma.release.delete({ where: { id } });
        cacheInvalidate("releases:");
        return true;
      } catch {
        return false;
      }
    },
  },
};