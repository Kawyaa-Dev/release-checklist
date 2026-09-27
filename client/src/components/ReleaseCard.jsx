import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useState } from "react";

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
        <div>
          <h2>{release.name}</h2>
          <p className="muted">{formatDate(release.date)}</p>
        </div>
        <span className={`badge badge-${release.status}`}>{release.status}</span>
      </div>

      <ul className="steps">
        {release.steps.map((step) => (
          <li key={step.key} className="step">
            <label>
              <input
                type="checkbox"
                checked={step.completed}
                onChange={() => handleToggle(step.key)}
              />
              <span className={step.completed ? "step-label done" : "step-label"}>
                {step.label}
              </span>
            </label>
          </li>
        ))}
      </ul>

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
              <button className="btn-primary" onClick={handleSaveInfo}>
                Save
              </button>
              <button
                className="btn-secondary"
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
            <p className="muted">
              {release.additionalInfo ? release.additionalInfo : "No additional info."}
            </p>
            <div className="btn-row">
              <button className="btn-secondary" onClick={() => setEditingInfo(true)}>
                Edit info
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}