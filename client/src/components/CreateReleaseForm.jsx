import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

const CREATE_RELEASE = gql`
  mutation CreateRelease($name: String!, $date: String!, $additionalInfo: String) {
    createRelease(name: $name, date: $date, additionalInfo: $additionalInfo) {
      id
    }
  }
`;

export default function CreateReleaseForm({ onCreated }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [createRelease, { loading }] = useMutation(CREATE_RELEASE);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Name is required");
      return;
    }
    if (!date) {
      setErrorMsg("Date is required");
      return;
    }

    try {
      // Convert the local datetime-local value to ISO
      const isoDate = new Date(date).toISOString();
      await createRelease({
        variables: {
          name: name.trim(),
          date: isoDate,
          additionalInfo: additionalInfo.trim() || null,
        },
      });
      setName("");
      setDate("");
      setAdditionalInfo("");
      onCreated();
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <h2>New Release</h2>

      <label>
        Name *
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. v1.2.0 - Payment fixes"
        />
      </label>

      <label>
        Date *
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <label>
        Additional info
        <textarea
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Optional notes..."
          rows={3}
        />
      </label>

      {errorMsg && <p className="error">{errorMsg}</p>}

      <div className="btn-row">
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Release"}
        </button>
      </div>
    </form>
  );
}