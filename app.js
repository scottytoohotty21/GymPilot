const STORAGE_KEY = "gympilot-data-v1";

const defaultData = {
  appName: "GymPilot",
  routines: [],
  exercises: [],
  completedWorkouts: [],
  personalBests: [],
  settings: {
    activeProfile: "Scott",
    accountabilityPartner: "Laurie",
    theme: "blue"
  }
};

let gymPilotData = loadData();
let currentRoutineExercises = [];
let activeWorkout = null;

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupSaveTest();
  setupExerciseLibrary();
  setupRoutineBuilder();
  setupWorkoutMode();

  setDefaultWorkoutDate();
  updateDashboardCounts();
  renderExerciseLibrary();
  renderRoutineBuilder();
  populateRoutineExerciseSelect();
  populateWorkoutRoutineSelect();
  renderWorkoutMode();
  renderHistory();

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
      routines: parsedData.routines || [],
      exercises: parsedData.exercises || [],
      completedWorkouts: parsedData.completedWorkouts || [],
      personalBests: parsedData.personalBests || [],
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
    sortExercises();
    saveData();

    updateDashboardCounts();
    renderExerciseLibrary();
    populateRoutineExerciseSelect();

    alert("Save test complete. A test exercise was saved.");
  });
}

/* ---------------------------
   Exercise Library
---------------------------- */

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
  populateRoutineExerciseSelect();
  renderRoutineDraftList();
  renderRoutineBuilder();
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

  const confirmed = confirm(`Delete ${exercise.name}? This will also remove it from saved routines.`);

  if (!confirmed) {
    return;
  }

  gymPilotData.exercises = gymPilotData.exercises.filter((item) => item.id !== exerciseId);

  currentRoutineExercises = currentRoutineExercises.filter((item) => item.exerciseId !== exerciseId);

  gymPilotData.routines = gymPilotData.routines.map((routine) => {
    return {
      ...routine,
      exercises: (routine.exercises || []).filter((item) => item.exerciseId !== exerciseId)
    };
  });

  saveData();

  updateDashboardCounts();
  renderExerciseLibrary();
  populateRoutineExerciseSelect();
  populateWorkoutRoutineSelect();
  renderRoutineDraftList();
  renderRoutineBuilder();
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

/* ---------------------------
   Routine Builder
---------------------------- */

function setupRoutineBuilder() {
  const form = document.getElementById("routineForm");
  const addExerciseButton = document.getElementById("addExerciseToRoutineButton");
  const cancelButton = document.getElementById("cancelEditRoutineButton");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveRoutineFromForm();
  });

  if (addExerciseButton) {
    addExerciseButton.addEventListener("click", () => {
      addExerciseToRoutineDraft();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      resetRoutineForm();
    });
  }
}

function populateRoutineExerciseSelect() {
  const select = document.getElementById("routineExerciseSelect");

  if (!select) {
    return;
  }

  const exercises = gymPilotData.exercises || [];

  if (exercises.length === 0) {
    select.innerHTML = `<option value="">Add exercises in the Library first</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;

  select.innerHTML = `
    <option value="">Choose exercise</option>
    ${exercises.map((exercise) => {
      return `<option value="${exercise.id}">${escapeHTML(exercise.name)}</option>`;
    }).join("")}
  `;
}

function addExerciseToRoutineDraft() {
  const exerciseId = document.getElementById("routineExerciseSelect").value;

  if (!exerciseId) {
    alert("Choose an exercise to add.");
    return;
  }

  const exercise = gymPilotData.exercises.find((item) => item.id === exerciseId);

  if (!exercise) {
    alert("Could not find that exercise.");
    return;
  }

  const routineExercise = {
    draftId: crypto.randomUUID(),
    exerciseId: exercise.id,
    name: exercise.name,
    type: exercise.type || "",
    muscleGroup: exercise.muscleGroup || "",
    plannedSets: numberOrEmpty(document.getElementById("routineExerciseSets").value) || exercise.defaultSets || "",
    plannedReps: numberOrEmpty(document.getElementById("routineExerciseReps").value) || exercise.defaultReps || "",
    plannedWeight: document.getElementById("routineExerciseWeight").value.trim() || exercise.defaultWeight || ""
  };

  currentRoutineExercises.push(routineExercise);

  document.getElementById("routineExerciseSelect").value = "";
  document.getElementById("routineExerciseSets").value = "";
  document.getElementById("routineExerciseReps").value = "";
  document.getElementById("routineExerciseWeight").value = "";

  renderRoutineDraftList();
}

function renderRoutineDraftList() {
  const draftList = document.getElementById("routineDraftList");

  if (!draftList) {
    return;
  }

  if (currentRoutineExercises.length === 0) {
    draftList.innerHTML = `
      <div class="empty-state">
        No exercises added to this routine yet.
      </div>
    `;
    return;
  }

  draftList.innerHTML = currentRoutineExercises.map((item, index) => {
    const detailParts = [];

    if (item.plannedSets !== "") {
      detailParts.push(`${item.plannedSets} sets`);
    }

    if (item.plannedReps !== "") {
      detailParts.push(`${item.plannedReps} reps`);
    }

    if (item.plannedWeight) {
      detailParts.push(`${escapeHTML(item.plannedWeight)}`);
    }

    return `
      <div class="routine-draft-item">
        <div>
          <strong>${index + 1}. ${escapeHTML(item.name)}</strong>
          <div class="routine-exercise-detail">
            ${detailParts.length ? detailParts.join(" • ") : "No plan entered"}
          </div>
        </div>

        <button class="danger-button" type="button" onclick="removeExerciseFromRoutineDraft('${item.draftId}')">
          Remove
        </button>
      </div>
    `;
  }).join("");
}

function removeExerciseFromRoutineDraft(draftId) {
  currentRoutineExercises = currentRoutineExercises.filter((item) => item.draftId !== draftId);
  renderRoutineDraftList();
}

function saveRoutineFromForm() {
  const routineId = document.getElementById("routineId").value;

  const routine = {
    id: routineId || crypto.randomUUID(),
    name: document.getElementById("routineName").value.trim(),
    focus: document.getElementById("routineFocus").value.trim(),
    notes: document.getElementById("routineNotes").value.trim(),
    exercises: currentRoutineExercises.map((item) => ({
      routineExerciseId: item.routineExerciseId || crypto.randomUUID(),
      exerciseId: item.exerciseId,
      name: item.name,
      type: item.type || "",
      muscleGroup: item.muscleGroup || "",
      plannedSets: item.plannedSets,
      plannedReps: item.plannedReps,
      plannedWeight: item.plannedWeight
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!routine.name) {
    alert("Please add a routine name.");
    return;
  }

  if (routine.exercises.length === 0) {
    alert("Please add at least one exercise to the routine.");
    return;
  }

  if (routineId) {
    const existingRoutine = gymPilotData.routines.find((item) => item.id === routineId);

    if (existingRoutine) {
      routine.createdAt = existingRoutine.createdAt || new Date().toISOString();
    }

    gymPilotData.routines = gymPilotData.routines.map((item) => {
      if (item.id === routineId) {
        return routine;
      }

      return item;
    });
  } else {
    gymPilotData.routines.push(routine);
  }

  sortRoutines();
  saveData();

  updateDashboardCounts();
  renderRoutineBuilder();
  populateWorkoutRoutineSelect();
  resetRoutineForm();
}

function renderRoutineBuilder() {
  const routineList = document.getElementById("routineList");
  const routineSummary = document.getElementById("routineSummary");

  if (!routineList) {
    return;
  }

  const routines = gymPilotData.routines || [];

  if (routineSummary) {
    const count = routines.length;
    routineSummary.textContent = `${count} saved ${count === 1 ? "routine" : "routines"}`;
  }

  renderRoutineDraftList();

  if (routines.length === 0) {
    routineList.innerHTML = `
      <div class="empty-state">
        No routines yet. Build your first one above.
      </div>
    `;
    return;
  }

  routineList.innerHTML = routines.map((routine) => {
    const routineExercises = routine.exercises || [];

    const exerciseRows = routineExercises.map((item, index) => {
      const detailParts = [];

      if (item.plannedSets !== "") {
        detailParts.push(`${item.plannedSets} sets`);
      }

      if (item.plannedReps !== "") {
        detailParts.push(`${item.plannedReps} reps`);
      }

      if (item.plannedWeight) {
        detailParts.push(`${escapeHTML(item.plannedWeight)}`);
      }

      return `
        <div class="routine-exercise-row">
          <strong>${index + 1}. ${escapeHTML(item.name)}</strong>
          <div class="routine-exercise-detail">
            ${detailParts.length ? detailParts.join(" • ") : "No plan entered"}
          </div>
        </div>
      `;
    }).join("");

    return `
      <article class="routine-item">
        <div class="routine-item-header">
          <div>
            <h4>${escapeHTML(routine.name)}</h4>
            ${routine.focus ? `<div class="routine-focus">${escapeHTML(routine.focus)}</div>` : ""}
          </div>

          <span class="stat-chip">${routineExercises.length} ${routineExercises.length === 1 ? "exercise" : "exercises"}</span>
        </div>

        <div class="routine-exercise-list">
          ${exerciseRows}
        </div>

        ${routine.notes ? `<div class="routine-notes">${escapeHTML(routine.notes)}</div>` : ""}

        <div class="routine-actions">
          <button class="small-button" type="button" onclick="editRoutine('${routine.id}')">
            Edit
          </button>

          <button class="danger-button" type="button" onclick="deleteRoutine('${routine.id}')">
            Delete
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function editRoutine(routineId) {
  const routine = gymPilotData.routines.find((item) => item.id === routineId);

  if (!routine) {
    return;
  }

  document.getElementById("routineId").value = routine.id;
  document.getElementById("routineName").value = routine.name || "";
  document.getElementById("routineFocus").value = routine.focus || "";
  document.getElementById("routineNotes").value = routine.notes || "";

  currentRoutineExercises = (routine.exercises || []).map((item) => ({
    draftId: crypto.randomUUID(),
    routineExerciseId: item.routineExerciseId || crypto.randomUUID(),
    exerciseId: item.exerciseId,
    name: item.name,
    type: item.type || "",
    muscleGroup: item.muscleGroup || "",
    plannedSets: item.plannedSets,
    plannedReps: item.plannedReps,
    plannedWeight: item.plannedWeight
  }));

  const saveButton = document.getElementById("saveRoutineButton");
  const cancelButton = document.getElementById("cancelEditRoutineButton");

  if (saveButton) {
    saveButton.textContent = "Update routine";
  }

  if (cancelButton) {
    cancelButton.classList.add("visible");
  }

  renderRoutineDraftList();

  document.getElementById("routines").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function deleteRoutine(routineId) {
  const routine = gymPilotData.routines.find((item) => item.id === routineId);

  if (!routine) {
    return;
  }

  const confirmed = confirm(`Delete ${routine.name}?`);

  if (!confirmed) {
    return;
  }

  gymPilotData.routines = gymPilotData.routines.filter((item) => item.id !== routineId);

  if (activeWorkout && activeWorkout.routineId === routineId) {
    activeWorkout = null;
  }

  saveData();

  updateDashboardCounts();
  renderRoutineBuilder();
  populateWorkoutRoutineSelect();
  renderWorkoutMode();
  resetRoutineForm();
}

function resetRoutineForm() {
  const form = document.getElementById("routineForm");
  const saveButton = document.getElementById("saveRoutineButton");
  const cancelButton = document.getElementById("cancelEditRoutineButton");

  if (form) {
    form.reset();
  }

  document.getElementById("routineId").value = "";

  currentRoutineExercises = [];

  if (saveButton) {
    saveButton.textContent = "Save routine";
  }

  if (cancelButton) {
    cancelButton.classList.remove("visible");
  }

  renderRoutineDraftList();
}

/* ---------------------------
   Workout Mode
---------------------------- */

function setupWorkoutMode() {
  const startButton = document.getElementById("startWorkoutButton");
  const clearButton = document.getElementById("clearWorkoutButton");
  const saveButton = document.getElementById("saveWorkoutButton");

  if (startButton) {
    startButton.addEventListener("click", () => {
      startWorkout();
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      clearActiveWorkout();
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      saveCompletedWorkout();
    });
  }
}

function setDefaultWorkoutDate() {
  const workoutDate = document.getElementById("workoutDate");

  if (!workoutDate) {
    return;
  }

  workoutDate.value = new Date().toISOString().slice(0, 10);
}

function populateWorkoutRoutineSelect() {
  const select = document.getElementById("workoutRoutineSelect");

  if (!select) {
    return;
  }

  const routines = gymPilotData.routines || [];

  if (routines.length === 0) {
    select.innerHTML = `<option value="">Create a routine first</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;

  select.innerHTML = `
    <option value="">Choose routine</option>
    ${routines.map((routine) => {
      return `<option value="${routine.id}">${escapeHTML(routine.name)}</option>`;
    }).join("")}
  `;
}

function startWorkout() {
  const routineId = document.getElementById("workoutRoutineSelect").value;
  const workoutDate = document.getElementById("workoutDate").value || new Date().toISOString().slice(0, 10);

  if (!routineId) {
    alert("Choose a routine to start.");
    return;
  }

  const routine = gymPilotData.routines.find((item) => item.id === routineId);

  if (!routine) {
    alert("Could not find that routine.");
    return;
  }

  activeWorkout = {
    id: crypto.randomUUID(),
    routineId: routine.id,
    routineName: routine.name,
    date: workoutDate,
    startedAt: new Date().toISOString(),
    exercises: (routine.exercises || []).map((exercise) => {
      const setCount = Number(exercise.plannedSets) || 1;

      return {
        workoutExerciseId: crypto.randomUUID(),
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        type: exercise.type || "",
        muscleGroup: exercise.muscleGroup || "",
        plannedSets: exercise.plannedSets,
        plannedReps: exercise.plannedReps,
        plannedWeight: exercise.plannedWeight,
        sets: Array.from({ length: setCount }, (_, index) => ({
          setId: crypto.randomUUID(),
          setNumber: index + 1,
          completed: false,
          actualReps: exercise.plannedReps || "",
          actualWeight: exercise.plannedWeight || ""
        }))
      };
    })
  };

  renderWorkoutMode();
}

function renderWorkoutMode() {
  const title = document.getElementById("activeWorkoutTitle");
  const summary = document.getElementById("activeWorkoutSummary");
  const list = document.getElementById("activeWorkoutList");
  const saveButton = document.getElementById("saveWorkoutButton");

  if (!title || !summary || !list || !saveButton) {
    return;
  }

  if (!activeWorkout) {
    title.textContent = "No active workout";
    summary.textContent = "Choose a routine above to begin.";
    list.innerHTML = "";
    saveButton.classList.remove("visible");
    return;
  }

  title.textContent = activeWorkout.routineName;
  summary.textContent = `Workout date: ${formatDate(activeWorkout.date)}`;
  saveButton.classList.add("visible");

  list.innerHTML = activeWorkout.exercises.map((exercise) => {
    const setRows = exercise.sets.map((set) => {
      return `
        <div class="workout-set-row">
          <label class="workout-set-check">
            <input
              type="checkbox"
              ${set.completed ? "checked" : ""}
              onchange="updateWorkoutSet('${exercise.workoutExerciseId}', '${set.setId}', 'completed', this.checked)"
            />
            Set ${set.setNumber}
          </label>

          <label>
            Actual reps
            <input
              type="number"
              min="0"
              step="1"
              value="${escapeHTML(set.actualReps)}"
              onchange="updateWorkoutSet('${exercise.workoutExerciseId}', '${set.setId}', 'actualReps', this.value)"
            />
          </label>

          <label>
            Actual weight / resistance
            <input
              type="text"
              value="${escapeHTML(set.actualWeight)}"
              onchange="updateWorkoutSet('${exercise.workoutExerciseId}', '${set.setId}', 'actualWeight', this.value)"
            />
          </label>
        </div>
      `;
    }).join("");

    return `
      <article class="workout-exercise-card">
        <h4>${escapeHTML(exercise.name)}</h4>
        <div class="routine-exercise-detail">
          Planned: ${exercise.plannedSets || "?"} sets
          ${exercise.plannedReps ? ` • ${escapeHTML(exercise.plannedReps)} reps` : ""}
          ${exercise.plannedWeight ? ` • ${escapeHTML(exercise.plannedWeight)}` : ""}
        </div>

        <div class="workout-set-list">
          ${setRows}
        </div>
      </article>
    `;
  }).join("");
}

function updateWorkoutSet(workoutExerciseId, setId, field, value) {
  if (!activeWorkout) {
    return;
  }

  activeWorkout.exercises = activeWorkout.exercises.map((exercise) => {
    if (exercise.workoutExerciseId !== workoutExerciseId) {
      return exercise;
    }

    return {
      ...exercise,
      sets: exercise.sets.map((set) => {
        if (set.setId !== setId) {
          return set;
        }

        return {
          ...set,
          [field]: field === "completed" ? Boolean(value) : value
        };
      })
    };
  });
}

function clearActiveWorkout() {
  if (!activeWorkout) {
    renderWorkoutMode();
    return;
  }

  const confirmed = confirm("Clear the active workout? Unsaved results will be lost.");

  if (!confirmed) {
    return;
  }

  activeWorkout = null;
  renderWorkoutMode();
}

function saveCompletedWorkout() {
  if (!activeWorkout) {
    alert("There is no active workout to save.");
    return;
  }

  const completedSets = activeWorkout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter((set) => set.completed).length;
  }, 0);

  if (completedSets === 0) {
    const confirmed = confirm("No sets are ticked as complete. Save anyway?");

    if (!confirmed) {
      return;
    }
  }

  const completedWorkout = {
    ...activeWorkout,
    completedAt: new Date().toISOString()
  };

  gymPilotData.completedWorkouts.unshift(completedWorkout);

  activeWorkout = null;

  saveData();
  renderWorkoutMode();
  renderHistory();

  alert("Workout saved. Nice work.");
}

/* ---------------------------
   History
---------------------------- */

function renderHistory() {
  const historySummary = document.getElementById("historySummary");
  const historyList = document.getElementById("historyList");

  if (!historySummary || !historyList) {
    return;
  }

  const workouts = gymPilotData.completedWorkouts || [];

  if (workouts.length === 0) {
    historySummary.textContent = "No workouts logged yet.";
    historyList.innerHTML = `
      <div class="empty-state">
        Complete your first workout and it will appear here.
      </div>
    `;
    return;
  }

  const totalSets = workouts.reduce((total, workout) => {
    return total + workout.exercises.reduce((exerciseTotal, exercise) => {
      return exerciseTotal + exercise.sets.filter((set) => set.completed).length;
    }, 0);
  }, 0);

  historySummary.textContent = `${workouts.length} completed ${workouts.length === 1 ? "workout" : "workouts"} • ${totalSets} completed sets`;

  historyList.innerHTML = workouts.map((workout) => {
    const exerciseRows = workout.exercises.map((exercise) => {
      const completedSetRows = exercise.sets
        .filter((set) => set.completed)
        .map((set) => {
          const parts = [];

          if (set.actualReps !== "") {
            parts.push(`${escapeHTML(set.actualReps)} reps`);
          }

          if (set.actualWeight !== "") {
            parts.push(`${escapeHTML(set.actualWeight)}`);
          }

          return `<div class="completed-set">Set ${set.setNumber}: ${parts.length ? parts.join(" • ") : "Completed"}</div>`;
        })
        .join("");

      return `
        <div class="history-exercise-row">
          <strong>${escapeHTML(exercise.name)}</strong>
          ${completedSetRows || `<div class="completed-set">No completed sets ticked.</div>`}
        </div>
      `;
    }).join("");

    return `
      <article class="history-item">
        <h4>${escapeHTML(workout.routineName)}</h4>
        <div class="history-date">${formatDate(workout.date)}</div>

        <div class="history-exercise-list">
          ${exerciseRows}
        </div>
      </article>
    `;
  }).join("");
}

/* ---------------------------
   Shared helpers
---------------------------- */

function sortExercises() {
  gymPilotData.exercises.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
}

function sortRoutines() {
  gymPilotData.routines.sort((a, b) => {
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

function formatDate(dateString) {
  if (!dateString) {
    return "No date";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
