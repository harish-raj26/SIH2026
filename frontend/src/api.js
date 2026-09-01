const API_URL = "http://127.0.0.1:8000";

export async function getApplicationStatus(applicationId) {
  const response = await fetch(
    `${API_URL}/api/applications/${applicationId}/status`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch application status");
  }

  return response.json();
}

export async function getApplicationFields(applicationId) {
  const response = await fetch(
    `${API_URL}/api/application-fields/${applicationId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch application fields");
  }

  return response.json();
}

export async function getApplicationDocuments(applicationId) {
  const response = await fetch(
    `${API_URL}/api/application-documents/${applicationId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch application documents");
  }

  return response.json();
}
export async function suggestApplicationField(fieldId) {
  const response = await fetch(
    `${API_URL}/api/application-fields/${fieldId}/suggest`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.detail?.message ||
      errorData.detail ||
      "Failed to generate AI suggestion"
    );
  }

  return response.json();
}

export async function acceptApplicationSuggestion(fieldId) {
  const response = await fetch(
    `${API_URL}/api/application-fields/${fieldId}/accept-suggestion`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.detail?.message ||
      errorData.detail ||
      "Failed to accept AI suggestion"
    );
  }

  return response.json();
}
export async function updateApplicationField(fieldId, value) {
  const response = await fetch(
    `${API_URL}/api/application-fields/${fieldId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        value: value
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.detail?.message ||
      errorData.detail ||
      "Failed to update application field"
    );
  }

  return response.json();
}
export async function uploadApplicationDocument(documentId, file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/application-documents/${documentId}/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.detail?.message ||
      errorData.detail ||
      "Failed to upload document"
    );
  }

  return response.json();
}