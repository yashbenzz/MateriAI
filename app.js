const state = {
  mode: "paste",
  file: null,
};

const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
const pasteMode = document.getElementById("pasteMode");
const uploadMode = document.getElementById("uploadMode");
const notesText = document.getElementById("notesText");
const notesFile = document.getElementById("notesFile");
const dropzone = document.getElementById("dropzone");
const fileMeta = document.getElementById("fileMeta");
const summarizeBtn = document.getElementById("summarizeBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const questionsEl = document.getElementById("questions");
const revisionEl = document.getElementById("revision");
const apiUrlEl = document.getElementById("apiUrl");

const API_URL_STORAGE_KEY = "notes_summarizer_api_url";

function loadSavedApiUrl() {
  const savedUrl = localStorage.getItem(API_URL_STORAGE_KEY);
  if (savedUrl && typeof savedUrl === "string") {
    apiUrlEl.value = savedUrl;
  }
}

function saveApiUrl() {
  localStorage.setItem(API_URL_STORAGE_KEY, apiUrlEl.value.trim());
}

function setMode(mode) {
  state.mode = mode;

  modeButtons.forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle("active", active);
  });

  pasteMode.classList.toggle("active", mode === "paste");
  uploadMode.classList.toggle("active", mode === "upload");
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "#0f766e";
}

function setSelectedFile(file) {
  state.file = file;
  if (!file) {
    fileMeta.textContent = "No file selected";
    return;
  }

  const kb = Math.max(1, Math.round(file.size / 1024));
  fileMeta.textContent = `${file.name} (${kb} KB)`;
}

function setLoading(loading) {
  summarizeBtn.disabled = loading;
  summarizeBtn.textContent = loading ? "Generating..." : "Generate Exam Pack";
}

function toBulletList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((x) => String(x).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|\r|\u2022|\-/g)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }

  return [];
}

function normalizeApiResponse(data) {
  const payload = data && typeof data === "object" && data.data ? data.data : data;

  return {
    summary:
      payload?.summary ||
      payload?.result_summary ||
      payload?.overview ||
      "",
    important_questions:
      payload?.important_questions ||
      payload?.questions ||
      payload?.exam_questions ||
      [],
    quick_revision_points:
      payload?.quick_revision_points ||
      payload?.revision_points ||
      payload?.key_points ||
      [],
  };
}

async function fetchWithTimeout(url, options, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function renderResults({ summary, important_questions, quick_revision_points }) {
  summaryEl.classList.remove("empty");
  summaryEl.textContent = summary || "No summary returned by API.";

  const questions = toBulletList(important_questions);
  const revision = toBulletList(quick_revision_points);

  questionsEl.innerHTML = "";
  revisionEl.innerHTML = "";

  if (questions.length === 0) {
    questionsEl.classList.add("empty");
    questionsEl.innerHTML = "<li>No questions returned by API.</li>";
  } else {
    questionsEl.classList.remove("empty");
    questions.forEach((q) => {
      const li = document.createElement("li");
      li.textContent = q;
      questionsEl.appendChild(li);
    });
  }

  if (revision.length === 0) {
    revisionEl.classList.add("empty");
    revisionEl.innerHTML = "<li>No revision points returned by API.</li>";
  } else {
    revisionEl.classList.remove("empty");
    revision.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      revisionEl.appendChild(li);
    });
  }
}

function clearOutputs() {
  summaryEl.classList.add("empty");
  summaryEl.textContent = "Your concise summary will appear here.";

  questionsEl.classList.add("empty");
  questionsEl.innerHTML = "<li>Likely exam questions will appear here.</li>";

  revisionEl.classList.add("empty");
  revisionEl.innerHTML = "<li>Fast revision bullets will appear here.</li>";
}

async function submitNotes() {
  const apiUrl = apiUrlEl.value.trim();
  if (!apiUrl) {
    setStatus("Please enter the backend API URL.", true);
    return;
  }

  saveApiUrl();

  if (state.mode === "paste" && !notesText.value.trim()) {
    setStatus("Paste your notes before generating.", true);
    return;
  }

  if (state.mode === "upload" && !state.file) {
    setStatus("Upload a file before generating.", true);
    return;
  }

  setLoading(true);
  setStatus("Processing notes with AI...");

  try {
    let response;

    if (state.mode === "upload") {
      const formData = new FormData();
      formData.append("file", state.file);

      response = await fetchWithTimeout(apiUrl, {
        method: "POST",
        body: formData,
      });
    } else {
      response = await fetchWithTimeout(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesText.value.trim() }),
      });
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with ${response.status}`);
    }

    const data = await response.json();
    renderResults(normalizeApiResponse(data));
    setStatus("Exam pack generated successfully.");
  } catch (error) {
    const message =
      error && error.name === "AbortError"
        ? "Request timed out after 60s. Try shorter notes or check backend performance."
        : error.message;

    const fallback = {
      summary:
        "Could not reach the backend. Start your Python API and verify the URL. This preview shows expected output format.",
      important_questions: [
        "What are the top 5 high-weight topics from these notes?",
        "Which definitions are most likely to appear as short answers?",
        "What comparison-style question can be asked from this chapter?",
      ],
      quick_revision_points: [
        "Revise formulas first, then applications.",
        "Practice one 5-mark and one 10-mark answer from each topic.",
        "Memorize key terms and one example for each.",
      ],
    };

    renderResults(fallback);
    setStatus(`Error: ${message}`, true);
  } finally {
    setLoading(false);
  }
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

notesFile.addEventListener("change", (event) => {
  const [file] = event.target.files;
  setSelectedFile(file || null);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (event) => {
  const [file] = event.dataTransfer.files;
  if (file) {
    notesFile.files = event.dataTransfer.files;
    setSelectedFile(file);
  }
});

summarizeBtn.addEventListener("click", submitNotes);

clearBtn.addEventListener("click", () => {
  notesText.value = "";
  notesFile.value = "";
  setSelectedFile(null);
  setStatus("");
  clearOutputs();
});

apiUrlEl.addEventListener("change", saveApiUrl);

loadSavedApiUrl();
clearOutputs();
