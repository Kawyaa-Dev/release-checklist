import { useState, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import ReleaseCard from "./components/ReleaseCard.jsx";
import CreateReleaseForm from "./components/CreateReleaseForm.jsx";

export const GET_RELEASES = gql`
  query {
    releases {
      id
      name
      date
      status
      additionalInfo
      steps {
        key
        label
        completed
      }
    }
  }
`;

export default function App() {
  const { loading, error, data, refetch } = useQuery(GET_RELEASES);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showInfo, setShowInfo] = useState(true);

  const releases = data?.releases || [];

  const counts = useMemo(() => {
    return {
      all: releases.length,
      planned: releases.filter((r) => r.status === "planned").length,
      ongoing: releases.filter((r) => r.status === "ongoing").length,
      done: releases.filter((r) => r.status === "done").length,
    };
  }, [releases]);

  const filtered = useMemo(() => {
    if (filter === "all") return releases;
    return releases.filter((r) => r.status === filter);
  }, [releases, filter]);

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="brand-text">
              <h1>Release Checklist</h1>
              <p>Track every step from code review to post-release retro</p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ New Release"}
          </button>
        </div>
      </header>

      <div className="app">
        {showInfo && (
          <div className="info-banner">
            <div className="info-banner-content">
              <strong>How it works</strong>
              <p>
                A release moves through three phases — <em>Pre-release</em>,{" "}
                <em>Release day</em>, and <em>Post-release</em>. Check off each
                step as your team completes it. Status is computed
                automatically:{" "}
                <span className="info-chip planned">Planned</span> when nothing
                is checked,{" "}
                <span className="info-chip ongoing">Ongoing</span> once work
                starts, and{" "}
                <span className="info-chip done">Done</span> when all steps are
                complete.
              </p>
            </div>
            <button
              className="info-banner-close"
              onClick={() => setShowInfo(false)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {showForm && (
          <CreateReleaseForm
            onCreated={() => {
              setShowForm(false);
              refetch();
            }}
          />
        )}

        {loading && <p className="muted">Loading releases...</p>}
        {error && (
          <p className="error">Failed to load releases: {error.message}</p>
        )}

        {!loading && !error && (
          <>
            {releases.length > 0 && (
              <div className="stats-bar">
                <div className="stat-card">
                  <div className="stat-label">Planned</div>
                  <div className="stat-value planned">{counts.planned}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Ongoing</div>
                  <div className="stat-value ongoing">{counts.ongoing}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Done</div>
                  <div className="stat-value done">{counts.done}</div>
                </div>
              </div>
            )}

            {releases.length > 0 && (
              <div className="filters">
                {["all", "planned", "ongoing", "done"].map((f) => (
                  <button
                    key={f}
                    className={`filter-tab ${filter === f ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span className="filter-count">({counts[f]})</span>
                  </button>
                ))}
              </div>
            )}

            {releases.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <h3>No releases yet</h3>
                <p>
                  Start tracking your next deployment. Add a release, then check
                  off each step as your team completes it.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Create your first release
                </button>
              </div>
            )}

            {releases.length > 0 && filtered.length === 0 && (
              <p
                className="muted"
                style={{ padding: "24px 0", textAlign: "center" }}
              >
                No releases in this category.
              </p>
            )}

            <div className="release-list">
              {filtered.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  onChanged={refetch}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}