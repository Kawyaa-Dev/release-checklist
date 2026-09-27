import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useState } from "react";

const PHASES = [
  { key: "pre_release",  label: "Pre-release" },
  { key: "release_day",  label: "Release day" },
  { key: "post_release", label: "Post-release" },
];

// Map step keys -> phase (mirrors server-side constants)
const STEP_PHASE = {
  code_review: "pre_release",
  unit_tests: "pre_release",
  regression_tests: "pre_release",
  docs_updated: "pre_release",
  rollback_plan: "pre_release",
  db_backup: "release_day",
  env_ready: "release_day",
  smoke_tests: "post_release",
  post_release_notes: "post_release",
};

const TOGGLE_STEP = gql`
  mutation ToggleStep($releaseId: ID!, $stepKey: String!) {
    toggleStep(releaseId: $releaseId, stepKey: $stepKey) {
      id
      status
      steps {
        key
        completed
      }
    }
  }
`;

const UPDATE_INFO = gql`
  mutation UpdateInfo($id: ID!, $additionalInfo: String) {
    updateReleaseInfo(id: $id, additionalInfo: $additionalInfo) {
      id
      additionalInfo
    }
  }
`;

const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ReleaseCard({ release, onChanged }) {
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState(release.additionalInfo || "");

  const [toggleStep] = useMutation(TOGGLE_STEP);
  const [updateInfo] = useMutation(UPDATE_INFO);
  const [deleteRelease] = useMutation(DELETE_RELEASE);

  const totalSteps = release.steps.length;
  const completedSteps = release.steps.filter((s) => s.completed).length;
  const percent = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

  async function handleToggle(stepKey) {
    await toggleStep({ variables: { releaseId: release.id, stepKey } });
    onChanged();
  }

  async function handleSaveInfo() {
    await updateInfo({
      variables: { id: release.id, additionalInfo: infoDraft },
    });
    setEditingInfo(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${release.name}"?`)) return;
    await deleteRelease({ variables: { id: release.id } });
    onChanged();
  }

  return (
    <div className="release-card">
      <div className="release-card-header">
        <div className="release-title-block">
          <h2>{release.name}</h2>
          <div className="release-meta">
            <span>{formatDate(release.date)}</span>
            <span className="release-meta-sep">•</span>
            <span>
              {completedSteps}/{totalSteps} steps
            </span>
          </div>
        </div>
        <span className={`badge badge-${release.status}`}>{release.status}</span>
      </div>

      <div className="progress-block">
        <div className="progress-header">
          <span>Progress</span>
          <span>
            <strong>{percent}%</strong> complete
          </span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${release.status === "done" ? "done" : ""}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="phases">
        {PHASES.map((phase) => {
          const phaseSteps = release.steps.filter(
            (s) => STEP_PHASE[s.key] === phase.key
          );
          if (phaseSteps.length === 0) return null;

          const doneInPhase = phaseSteps.filter((s) => s.completed).length;
          const phaseComplete = doneInPhase === phaseSteps.length;

          return (
            <div key={phase.key} className="phase-block">
              <div className="phase-header">
                <span>{phase.label}</span>
                <span
                  className={`phase-progress ${phaseComplete ? "complete" : ""}`}
                >
                  {doneInPhase}/{phaseSteps.length}
                </span>
              </div>
              <ul className="steps">
                {phaseSteps.map((step) => (
                  <li key={step.key} className="step">
                    <label>
                      <input
                        type="checkbox"
                        checked={step.completed}
                        onChange={() => handleToggle(step.key)}
                      />
                      <span
                        className={
                          step.completed ? "step-label done" : "step-label"
                        }
                      >
                        {step.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="release-info">
        {editingInfo ? (
          <>
            <textarea
              value={infoDraft}
              onChange={(e) => setInfoDraft(e.target.value)}
              placeholder="Additional info..."
              rows={3}
            />
            <div className="btn-row">
              <button className="btn btn-primary btn-sm" onClick={handleSaveInfo}>
                Save
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditingInfo(false);
                  setInfoDraft(release.additionalInfo || "");
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className={`info-text ${release.additionalInfo ? "" : "empty"}`}
            >
              {release.additionalInfo || "No additional info added."}
            </div>
            <div className="btn-row">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditingInfo(true)}
              >
                Edit info
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}