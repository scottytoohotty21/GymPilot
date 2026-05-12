const STORAGE_KEY = "gympilot-data-v1";

const defaultData = {
  appName: "GymPilot",
  routines: [],
  exercises: [],
  completedWorkouts: [],
  personalBests: [],
  settings: {
    activeProfile: "Scott",
    accountabilityPartner: "Laurie"
  }
};

let gymPilotData = loadData();

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupSaveTest();
  setupExerciseLibrary();
  updateDashboardCounts();
  renderExerciseLibrary();
  updateSaveStatus("Ready");
});

function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return structuredClone(defaultData);
  }

  try {
    const parsedData = JSON.parse(savedData);

    return {
      ...structuredClone(defaultData),
      ...parsedData,
      settings: {
        ...defaultData.settings,
        ...(parsedData.settings || {})
      }
    };
  } catch (error) {
    console.error("Could not load GymPilot data:", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gymPilotData));
  updateSaveStatus("Saved");
}

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const screens = document.querySelectorAll(".screen");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetScreen = button.dataset.screen;

      tabButtons.forEach((tab) => tab.classList.remove("active"));
      screens.forEach((screen) => screen.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(targetScreen).classList.add("active");
    });
  });
}

function setupSaveTest() {
  const button = document.getElementById("quickSaveTestButton");

  if (!button) {
    return;
  }

  button.addEventListener("click", () => {
    const testExercise = {
      id: crypto.randomUUID(),
      name: "Test Exercise",
      type: "Weights",
      muscleGroup: "Test",
      defaultSets: 3,
      defaultReps: 10,
      defaultWeight: "20kg",
      notes: "Created by the save test button.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    gymPilotData.exercises.push(testExercise);
    saveData();
    updateDashboardCounts();
    renderExerciseLibrary();

    alert("Save test complete. A test exercise was saved.");
  });
}

function setupExerciseLibrary() {
  const form = document.getElementById("exerciseForm");
  const cancelButton = document.getElementById("cancelEditExerciseButton");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveExerciseFromForm();
  });

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      resetExerciseForm();
    });
  }
}

function saveExerciseFromForm() {
  const exerciseId = document.getElementById("exerciseId").value;

  const exercise = {
    id: exerciseId || crypto.randomUUID(),
    name: document.getElementById("exerciseName").value.trim(),
    type: document.getElementById("exerciseType").value,
    muscleGroup: document.getElementById("exerciseMuscleGroup").value.trim(),
    defaultSets: numberOrEmpty(document.getElementById("exerciseSets").value),
    defaultReps: numberOrEmpty(document.getElementById("exerciseReps").value),
    defaultWeight: document.getElementById("exerciseWeight").value.trim(),
    notes: document.getElementById("exerciseNotes").value.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!exercise.name || !exercise.type) {
    alert("Please add an exercise name and type.");
    return;
  }

  if (exerciseId) {
    const existingExercise = gymPilotData.exercises.find((item) => item.id === exerciseId);

    if (existingExercise) {
      exercise.createdAt = existingExercise.createdAt || new Date().toISOString();
    }

    gymPilotData.exercises = gymPilotData.exercises.map((item) => {
      if (item.id === exerciseId) {
        return exercise;
      }

      return item;
    });
  } else {
    gymPilotData.exercises.push(exercise);
  }

  sortExercises();
  saveData();
  updateDashboardCounts();
  renderExerciseLibrary();
  resetExerciseForm();
}

function renderExerciseLibrary() {
  const exerciseList = document.getElementById("exerciseList");
  const librarySummary = document.getElementById("librarySummary");

  if (!exerciseList) {
    return;
  }

  const exercises = gymPilotData.exercises || [];

  if (librarySummary) {
    const count = exercises.length;
    librarySummary.textContent = `${count} saved ${count === 1 ? "exercise" : "exercises"}`;
  }

  if (exercises.length === 0) {
    exerciseList.innerHTML = `
      <div class="empty-state">
        No exercises yet. Add your first one above.
      </div>
    `;
    return;
  }

  exerciseList.innerHTML = exercises.map((exercise) => {
    const stats = [];

    if (exercise.defaultSets !== "") {
      stats.push(`${exercise.defaultSets} sets`);
    }

    if (exercise.defaultReps !== "") {
      stats.push(`${exercise.defaultReps} reps`);
    }

    if (exercise.defaultWeight) {
      stats.push(`${escapeHTML(exercise.defaultWeight)}`);
    }

    const statChips = stats.map((stat) => {
      return `<span class="stat-chip">${stat}</span>`;
    }).join("");

    return `
      <article class="exercise-item">
        <div class="exercise-item-header">
          <div>
            <h4>${escapeHTML(exercise.name)}</h4>
            <div class="exercise-meta">
              ${escapeHTML(exercise.type || "No type")}
              ${exercise.muscleGroup ? ` • ${escapeHTML(exercise.muscleGroup)}` : ""}
            </div>
          </div>
        </div>

        ${statChips ? `<div class="exercise-stats">${statChips}</div>` : ""}

        ${exercise.notes ? `<div class="exercise-notes">${escapeHTML(exercise.notes)}</div>` : ""}

        <div class="exercise-actions">
          <button class="small-button" type="button" onclick="editExercise('${exercise.id}')">
            Edit
          </button>

          <button class="danger-button" type="button" onclick="deleteExercise('${exercise.id}')">
            Delete
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function editExercise(exerciseId) {
  const exercise = gymPilotData.exercises.find((item) => item.id === exerciseId);

  if (!exercise) {
    return;
  }

  document.getElementById("exerciseId").value = exercise.id;
  document.getElementById("exerciseName").value = exercise.name || "";
  document.getElementById("exerciseType").value = exercise.type || "";
  document.getElementById("exerciseMuscleGroup").value = exercise.muscleGroup || "";
  document.getElementById("exerciseSets").value = exercise.defaultSets ?? "";
  document.getElementById("exerciseReps").value = exercise.defaultReps ?? "";
  document.getElementById("exerciseWeight").value = exercise.defaultWeight || "";
  document.getElementById("exerciseNotes").value = exercise.notes || "";

  const saveButton = document.getElementById("saveExerciseButton");
  const cancelButton = document.getElementById("cancelEditExerciseButton");

  if (saveButton) {
    saveButton.textContent = "Update exercise";
  }

  if (cancelButton) {
    cancelButton.classList.add("visible");
  }

  document.getElementById("library").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function deleteExercise(exerciseId) {
  const exercise = gymPilotData.exercises.find((item) => item.id === exerciseId);

  if (!exercise) {
    return;
  }

  const confirmed = confirm(`Delete ${exercise.name}?`);

  if (!confirmed) {
    return;
  }

  gymPilotData.exercises = gymPilotData.exercises.filter((item) => item.id !== exerciseId);

  saveData();
  updateDashboardCounts();
  renderExerciseLibrary();
  resetExerciseForm();
}

function resetExerciseForm() {
  const form = document.getElementById("exerciseForm");
  const saveButton = document.getElementById("saveExerciseButton");
  const cancelButton = document.getElementById("cancelEditExerciseButton");

  if (form) {
    form.reset();
  }

  document.getElementById("exerciseId").value = "";

  if (saveButton) {
    saveButton.textContent = "Save exercise";
  }

  if (cancelButton) {
    cancelButton.classList.remove("visible");
  }
}

function sortExercises() {
  gymPilotData.exercises.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
}

function numberOrEmpty(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  return Number(value);
}

function updateDashboardCounts() {
  const routineCount = document.getElementById("routineCount");
  const exerciseCount = document.getElementById("exerciseCount");

  if (routineCount) {
    const count = gymPilotData.routines.length;
    routineCount.textContent = `${count} saved ${count === 1 ? "routine" : "routines"}`;
  }

  if (exerciseCount) {
    const count = gymPilotData.exercises.length;
    exerciseCount.textContent = `${count} saved ${count === 1 ? "exercise" : "exercises"}`;
  }
}

function updateSaveStatus(message) {
  const saveStatus = document.getElementById("saveStatus");

  if (!saveStatus) {
    return;
  }

  saveStatus.textContent = message;

  if (message === "Saved") {
    setTimeout(() => {
      saveStatus.textContent = "Ready";
    }, 1200);
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
