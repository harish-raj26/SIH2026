
import { useEffect, useState } from "react";

import {
  getApplicationStatus,
  getApplicationFields,
  getApplicationDocuments,
  suggestApplicationField,
  acceptApplicationSuggestion,
  updateApplicationField,
  uploadApplicationDocument,
  verifyApplicationDocument
} from "./api";

function App() {
  const [application, setApplication] = useState(null);
  const [fields, setFields] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [suggestingField, setSuggestingField] = useState(null);
  const [acceptingField, setAcceptingField] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(null);
  const [verifyingDocument, setVerifyingDocument] = useState(null);

  async function handleSuggest(fieldId) {
    try {
      setSuggestingField(fieldId);

      const data = await suggestApplicationField(fieldId);

      setFields((currentFields) =>
        currentFields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                ai_suggestion: data.field.ai_suggestion,
                status: data.field.status
              }
            : field
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setSuggestingField(null);
    }
  }

  async function handleAccept(fieldId) {
    try {
      setAcceptingField(fieldId);

      const data =
        await acceptApplicationSuggestion(fieldId);

      setFields((currentFields) =>
        currentFields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                value: data.field.value,
                ai_suggestion:
                  data.field.ai_suggestion,
                status: data.field.status
              }
            : field
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setAcceptingField(null);
    }
  }

  async function handleUpdate(fieldId, value) {
    try {
      const data =
        await updateApplicationField(
          fieldId,
          value
        );

      setFields((currentFields) =>
        currentFields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                value: data.field.value,
                status: data.field.status
              }
            : field
        )
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUpload(documentId, file) {
    if (!file) {
      return;
    }

    try {
      setUploadingDocument(documentId);

      const data =
        await uploadApplicationDocument(
          documentId,
          file
        );

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id === documentId
            ? {
                ...document,
                file_path:
                  data.document.file_path,
                status:
                  data.document.status,
                verification_notes:
                  data.document
                    .verification_notes
              }
            : document
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingDocument(null);
    }
  }

  async function handleVerify(documentId) {
    try {
      setVerifyingDocument(documentId);

      const data =
        await verifyApplicationDocument(
          documentId
        );

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id === documentId
            ? {
                ...document,
                status:
                  data.document.status,
                verification_notes:
                  data.document
                    .verification_notes
              }
            : document
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifyingDocument(null);
    }
  }

  useEffect(() => {
    async function loadApplication() {
      try {
        const statusData =
          await getApplicationStatus(1);

        const fieldsData =
          await getApplicationFields(1);

        const documentsData =
          await getApplicationDocuments(1);

        setApplication(statusData);
        setFields(
          fieldsData.fields || []
        );
        setDocuments(
          documentsData.documents || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <h2>
          Loading BizClear...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h2>
          Something went wrong
        </h2>

        <p>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="app">

      <header className="navbar">

        <div className="logo">
          Biz<span>Clear</span>
        </div>

        <div className="nav-right">
          <span>
            Dashboard
          </span>

          <span>
            Applications
          </span>

          <span>
            Profile
          </span>
        </div>

      </header>

      <main className="container">

        <section className="hero">

          <div>

            <h1>
              Welcome to BizClear
            </h1>

            <p>
              AI-powered regulatory
              compliance for your business.
            </p>

          </div>

          <button>
            + New Application
          </button>

        </section>

        <section className="stats">

          <div className="card">

            <h3>
              Application
            </h3>

            <p>
              #{application.application_id}
            </p>

          </div>

          <div className="card">

            <h3>
              Status
            </h3>

            <p>
              {application.status}
            </p>

          </div>

          <div className="card">

            <h3>
              Required Fields
            </h3>

            <p>
              {fields.length}
            </p>

          </div>

          <div className="card">

            <h3>
              Documents
            </h3>

            <p>
              {documents.length}
            </p>

          </div>

        </section>

        <section className="applications">

          <div className="section-header">

            <h2>
              Application Fields
            </h2>

          </div>

          {fields.length === 0 ? (

            <p>
              No application fields found.
            </p>

          ) : (

            fields.map((field) => (

              <div
                className="application-card"
                key={field.id}
              >

                <div>

                  <h3>
                    {field.field_name}
                  </h3>

                  <p>
                    Type: {field.field_type}
                  </p>

                  {field.field_type ===
                  "number" ? (

                    <input
                      type="number"
                      defaultValue={
                        field.value || ""
                      }
                      placeholder="Enter value"
                      onBlur={(event) =>
                        handleUpdate(
                          field.id,
                          event.target.value
                        )
                      }
                    />

                  ) : (

                    <input
                      type="text"
                      defaultValue={
                        field.value || ""
                      }
                      placeholder="Enter value"
                      onBlur={(event) =>
                        handleUpdate(
                          field.id,
                          event.target.value
                        )
                      }
                    />

                  )}

                  {field.ai_suggestion && (

                    <p>
                      <strong>
                        AI Suggestion:
                      </strong>{" "}
                      {field.ai_suggestion}
                    </p>

                  )}

                </div>

                <div>

                  <span className="status">
                    {field.status}
                  </span>

                  <br />
                  <br />

                  <button
                    onClick={() =>
                      handleSuggest(
                        field.id
                      )
                    }
                    disabled={
                      suggestingField ===
                      field.id
                    }
                  >
                    {suggestingField ===
                    field.id
                      ? "Generating..."
                      : "AI Suggestion"}
                  </button>

                  {field.ai_suggestion && (

                    <button
                      onClick={() =>
                        handleAccept(
                          field.id
                        )
                      }
                      disabled={
                        acceptingField ===
                        field.id
                      }
                      style={{
                        marginLeft: "10px"
                      }}
                    >
                      {acceptingField ===
                      field.id
                        ? "Accepting..."
                        : "Accept Suggestion"}
                    </button>

                  )}

                </div>

              </div>

            ))

          )}

        </section>

        <section className="applications">

          <div className="section-header">

            <h2>
              Required Documents
            </h2>

          </div>

          {documents.length === 0 ? (

            <p>
              No documents generated yet.
            </p>

          ) : (

            documents.map((document) => (

              <div
                className="application-card"
                key={document.id}
              >

                <div>

                  <h3>
                    {document.document_name}
                  </h3>

                  <p>
                    Type:{" "}
                    {document.document_type}
                  </p>

                  <p>
                    Required:{" "}
                    {document.required
                      ? "Yes"
                      : "No"}
                  </p>

                  {document.verification_notes && (

                    <p>
                      <strong>
                        Verification:
                      </strong>{" "}
                      {document.verification_notes}
                    </p>

                  )}

                </div>

                <div>

                  <span className="status">
                    {document.status}
                  </span>

                  <br />
                  <br />

                  <input
                    type="file"
                    id={`file-${document.id}`}
                    style={{
                      display: "none"
                    }}
                    onChange={(event) =>
                      handleUpload(
                        document.id,
                        event.target.files[0]
                      )
                    }
                  />

                  <label
                    htmlFor={`file-${document.id}`}
                    style={{
                      display:
                        "inline-block",
                      background:
                        "#2563eb",
                      color: "white",
                      padding:
                        "10px 16px",
                      borderRadius:
                        "8px",
                      cursor:
                        "pointer",
                      fontSize:
                        "14px"
                    }}
                  >
                    {uploadingDocument ===
                    document.id
                      ? "Uploading..."
                      : "Upload Document"}
                  </label>

                  {document.status ===
                    "Uploaded" && (

                    <button
                      onClick={() =>
                        handleVerify(
                          document.id
                        )
                      }
                      disabled={
                        verifyingDocument ===
                        document.id
                      }
                      style={{
                        marginLeft:
                          "10px"
                      }}
                    >
                      {verifyingDocument ===
                      document.id
                        ? "Verifying..."
                        : "Verify Document"}
                    </button>

                  )}

                </div>

              </div>

            ))

          )}

        </section>

      </main>

    </div>
  );
}

export default App;
