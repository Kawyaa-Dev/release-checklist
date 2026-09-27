import { useState } from "react";
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Release Checklist</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Release"}
        </button>
      </header>

      {showForm && (
        <CreateReleaseForm
          onCreated={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">Error: {error.message}</p>}

      {data && data.releases.length === 0 && (
        <p className="muted">No releases yet. Create one to get started.</p>
      )}

      <div className="release-list">
        {data &&
          data.releases.map((release) => (
            <ReleaseCard key={release.id} release={release} onChanged={refetch} />
          ))}
      </div>
    </div>
  );
}