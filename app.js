const STORAGE_KEY = "gympilot-data-v1";
const ACTIVE_WORKOUT_STORAGE_KEY = "gympilot-active-workout-v1";

const defaultData = {
  appName: "GymPilot",
  routines: [],
  exercises: [],
  completedWorkouts: [],
  personalBests: [],
  nutrition: {
    foods: [],
    meals: [],
    dailyLogs: []
  },
  progress: {
    checkIns: [],
    measurements: [],
    photos: []
  },
  settings: {
  activeProfile: "Scott",
  accountabilityPartner: "Laurie",
  profiles: [
    {
      name: "Scott",
      theme: "blue"
    },
    {
      name: "Laurie",
      theme: "pink"
    }
  ]
}
};

let gymPilotData = loadData();
let currentRoutineExercises = [];
let activeWorkout = loadActiveWorkout();

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupDashboardJumpButtons();
  setupExerciseLibrary();
  setupRoutineBuilder();
  setupWorkoutMode();
  setupSettings();

  applyActiveTheme();
  setDefaultWorkoutDate();
  renderDashboard();
  renderExerciseLibrary();
  renderRoutineBuilder();
  populateRoutineExerciseSelect();
  populateWorkoutRoutineSelect();
  renderWorkoutMode();
  renderHistory();
renderPersonalBests();
renderSettings();

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
nutrition: {
  ...structuredClone(defaultData.nutrition),
  ...(parsedData.nutrition || {})
},
progress: {
  ...structuredClone(defaultData.progress),
  ...(parsedData.progress || {})
},
settings: {
  ...defaultData.settings,
  ...(parsedData.settings || {}),
  profiles: getMergedProfiles(parsedData.settings?.profiles)
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
      showScreen(button.dataset.screen);
    });
  });
}

function showScreen(screenId) {
  const tabButtons = document.querySelectorAll(".tab-button");
  const screens = document.querySelectorAll(".screen");

  tabButtons.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === screenId);
  });

  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function setupDashboardJumpButtons() {
  const jumpButtons = document.querySelectorAll("[data-jump-screen]");

  jumpButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showScreen(button.dataset.jumpScreen);
    });
  });
}

/* ---------------------------
   Active Workout Auto-save
---------------------------- */

function loadActiveWorkout() {
  const savedWorkout = localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);

  if (!savedWorkout) {
    return null;
  }

  try {
    return JSON.parse(savedWorkout);
  } catch (error) {
    console.error("Could not load active workout:", error);
    localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
    return null;
  }
}

function saveActiveWorkout() {
  if (!activeWorkout) {
    localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
    return;
  }

  localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(activeWorkout));
}

function clearSavedActiveWorkout() {
  localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
}
/* ---------------------------
   Settings / Profiles / Themes
---------------------------- */

function setupSettings() {
  const activeProfileSelect = document.getElementById("activeProfileSelect");
  const scottThemeSelect = document.getElementById("scottThemeSelect");
  const laurieThemeSelect = document.getElementById("laurieThemeSelect");

  if (activeProfileSelect) {
    activeProfileSelect.addEventListener("change", () => {
      gymPilotData.settings.activeProfile = activeProfileSelect.value;
      saveData();
      applyActiveTheme();
      renderDashboard();
      renderSettings();
    });
  }

  if (scottThemeSelect) {
    scottThemeSelect.addEventListener("change", () => {
      updateProfileTheme("Scott", scottThemeSelect.value);
    });
  }

  if (laurieThemeSelect) {
    laurieThemeSelect.addEventListener("change", () => {
      updateProfileTheme("Laurie", laurieThemeSelect.value);
    });
  }
}

function renderSettings() {
  const activeProfileSelect = document.getElementById("activeProfileSelect");
  const scottThemeSelect = document.getElementById("scottThemeSelect");
  const laurieThemeSelect = document.getElementById("laurieThemeSelect");
  const settingsSummary = document.getElementById("settingsSummary");

  const activeProfile = getActiveProfile();
  const scottProfile = getProfileByName("Scott");
  const laurieProfile = getProfileByName("Laurie");

  if (activeProfileSelect) {
    activeProfileSelect.value = activeProfile;
  }

  if (scottThemeSelect) {
    scottThemeSelect.value = scottProfile.theme;
  }

  if (laurieThemeSelect) {
    laurieThemeSelect.value = laurieProfile.theme;
  }

  if (settingsSummary) {
    settingsSummary.textContent = `Training as ${activeProfile}. Scott theme: ${themeLabel(scottProfile.theme)}. Laurie theme: ${themeLabel(laurieProfile.theme)}.`;
  }
}

function updateProfileTheme(profileName, theme) {
  gymPilotData.settings.profiles = getProfiles().map((profile) => {
    if (profile.name === profileName) {
      return {
        ...profile,
        theme
      };
    }

    return profile;
  });

  saveData();
  applyActiveTheme();
  renderSettings();
}

function applyActiveTheme() {
  const theme = getActiveTheme();

  document.body.classList.remove("theme-blue", "theme-pink");
  document.body.classList.add(`theme-${theme}`);
}

function getActiveProfile() {
  return gymPilotData.settings.activeProfile || "Scott";
}

function getActiveTheme() {
  return getProfileByName(getActiveProfile()).theme || "blue";
}

function getProfileByName(profileName) {
  return getProfiles().find((profile) => profile.name === profileName) || {
    name: profileName,
    theme: "blue"
  };
}

function getProfiles() {
  return getMergedProfiles(gymPilotData.settings.profiles);
}

function getMergedProfiles(savedProfiles) {
  const fallbackProfiles = structuredClone(defaultData.settings.profiles);
  const profiles = Array.isArray(savedProfiles) ? savedProfiles : [];

  return fallbackProfiles.map((fallbackProfile) => {
    const savedProfile = profiles.find((profile) => profile.name === fallbackProfile.name);

    return {
      ...fallbackProfile,
      ...(savedProfile || {})
    };
  });
}

function themeLabel(theme) {
  if (theme === "pink") {
    return "Soft Rose";
  }

  return "Blue";
}

function profileLabel(profile) {
  return profile || "Scott";
}
/* ---------------------------
   Dashboard
---------------------------- */

function renderDashboard() {
  const dashboardIntro = document.getElementById("dashboardIntro");
const lastWorkoutSummary = document.getElementById("lastWorkoutSummary");
const latestPbSummary = document.getElementById("latestPbSummary");

  const routineCountNumber = document.getElementById("routineCountNumber");
  const exerciseCountNumber = document.getElementById("exerciseCountNumber");
  const workoutCountNumber = document.getElementById("workoutCountNumber");
  const pbCountNumber = document.getElementById("pbCountNumber");

  const workouts = gymPilotData.completedWorkouts || [];
  const personalBests = gymPilotData.personalBests || [];
  if (dashboardIntro) {
  dashboardIntro.textContent = `Training as ${getActiveProfile()}. Choose a routine in Workout Mode to begin.`;
}

  if (lastWorkoutSummary) {
    if (workouts.length === 0) {
      lastWorkoutSummary.textContent = "No workouts logged yet.";
    } else {
      const latestWorkout = workouts[0];
      const completedSets = latestWorkout.exercises.reduce((total, exercise) => {
        return total + exercise.sets.filter((set) => set.completed).length;
      }, 0);

      lastWorkoutSummary.textContent = `${profileLabel(latestWorkout.profile)} • ${latestWorkout.routineName} • ${formatDate(latestWorkout.date)} • ${completedSets} completed sets`;
    }
  }

  if (latestPbSummary) {
    if (personalBests.length === 0) {
      latestPbSummary.textContent = "No PBs yet.";
    } else {
      const latestPb = personalBests[0];
      latestPbSummary.textContent = `${profileLabel(latestPb.profile)} • ${latestPb.exerciseName} • ${latestPb.label}: ${latestPb.displayValue}`;
    }
  }

  if (routineCountNumber) {
    routineCountNumber.textContent = gymPilotData.routines.length;
  }

  if (exerciseCountNumber) {
    exerciseCountNumber.textContent = gymPilotData.exercises.length;
  }

  if (workoutCountNumber) {
    workoutCountNumber.textContent = workouts.length;
  }

  if (pbCountNumber) {
    pbCountNumber.textContent = personalBests.length;
  }
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

  renderDashboard();
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

  renderDashboard();
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

  renderDashboard();
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

  renderDashboard();
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
  profile: getActiveProfile(),
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

    saveActiveWorkout();
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
  summary.textContent = `Training as ${profileLabel(activeWorkout.profile)} • Workout date: ${formatDate(activeWorkout.date)}`;
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
              oninput="updateWorkoutSet('${exercise.workoutExerciseId}', '${set.setId}', 'actualReps', this.value)"
            />
          </label>

          <label>
            Actual weight / resistance
            <input
              type="text"
              value="${escapeHTML(set.actualWeight)}"
              oninput="updateWorkoutSet('${exercise.workoutExerciseId}', '${set.setId}', 'actualWeight', this.value)"
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

  saveActiveWorkout();
  renderWorkoutMode();
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
  clearSavedActiveWorkout();
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

  const newPersonalBests = checkForPersonalBests(completedWorkout);

  gymPilotData.completedWorkouts.unshift(completedWorkout);

  if (newPersonalBests.length > 0) {
    gymPilotData.personalBests.unshift(...newPersonalBests);
  }

    activeWorkout = null;
  clearSavedActiveWorkout();

  saveData();
  renderDashboard();
renderWorkoutMode();
renderHistory();
renderPersonalBests();
renderSettings();

  if (newPersonalBests.length > 0) {
    const pbText = newPersonalBests
      .slice(0, 5)
      .map((pb) => `${pb.exerciseName}: ${pb.label} — ${pb.displayValue}`)
      .join("\n");

    alert(`🎉 New PB${newPersonalBests.length === 1 ? "" : "s"}!\n\n${pbText}`);
  } else {
    alert("Workout saved. Nice work.");
  }
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
        <div class="history-date">${profileLabel(workout.profile)} • ${formatDate(workout.date)}</div>

        <div class="history-exercise-list">
          ${exerciseRows}
        </div>
      </article>
    `;
  }).join("");
}

/* ---------------------------
   Personal Bests
---------------------------- */

function checkForPersonalBests(workout) {
  const newPersonalBests = [];

  workout.exercises.forEach((exercise) => {
    const completedSets = exercise.sets.filter((set) => set.completed);

    if (completedSets.length === 0) {
      return;
    }

    const maxWeight = Math.max(
      ...completedSets
        .map((set) => extractFirstNumber(set.actualWeight))
        .filter((value) => value !== null)
    );

    const maxReps = Math.max(
      ...completedSets
        .map((set) => Number(set.actualReps))
        .filter((value) => !Number.isNaN(value))
    );

    const completedSetCount = completedSets.length;

    if (Number.isFinite(maxWeight)) {
      const currentBestWeight = getCurrentBestValue(exercise.exerciseId, "maxWeight", workout.profile);

      if (currentBestWeight === null || maxWeight > currentBestWeight) {
        newPersonalBests.push(createPersonalBestRecord({
          exercise,
          workout,
          type: "maxWeight",
          label: "Heaviest weight / resistance",
          value: maxWeight,
          displayValue: `${maxWeight}`
        }));
      }
    }

    if (Number.isFinite(maxReps)) {
      const currentBestReps = getCurrentBestValue(exercise.exerciseId, "maxReps", workout.profile);

      if (currentBestReps === null || maxReps > currentBestReps) {
        newPersonalBests.push(createPersonalBestRecord({
          exercise,
          workout,
          type: "maxReps",
          label: "Most reps in one set",
          value: maxReps,
          displayValue: `${maxReps} reps`
        }));
      }
    }

    const currentBestSets = getCurrentBestValue(exercise.exerciseId, "maxSets", workout.profile);

    if (currentBestSets === null || completedSetCount > currentBestSets) {
      newPersonalBests.push(createPersonalBestRecord({
        exercise,
        workout,
        type: "maxSets",
        label: "Most completed sets",
        value: completedSetCount,
        displayValue: `${completedSetCount} sets`
      }));
    }
  });

  return newPersonalBests;
}

function createPersonalBestRecord({ exercise, workout, type, label, value, displayValue }) {
  return {
    id: crypto.randomUUID(),
    profile: profileLabel(workout.profile),
exerciseId: exercise.exerciseId,
exerciseName: exercise.name,
routineId: workout.routineId,
    routineName: workout.routineName,
    workoutId: workout.id,
    date: workout.date,
    type,
    label,
    value,
    displayValue,
    achievedAt: new Date().toISOString()
  };
}

function getCurrentBestValue(exerciseId, type, profile) {
  const activeProfile = profileLabel(profile);

  const matchingBest = (gymPilotData.personalBests || [])
    .filter((pb) => {
      const pbProfile = profileLabel(pb.profile);
      return pb.exerciseId === exerciseId && pb.type === type && pbProfile === activeProfile;
    })
    .sort((a, b) => Number(b.value) - Number(a.value))[0];

  if (!matchingBest) {
    return null;
  }

  return Number(matchingBest.value);
}

function renderPersonalBests() {
  const pbSummary = document.getElementById("pbSummary");
  const latestPbCelebration = document.getElementById("latestPbCelebration");
  const pbList = document.getElementById("pbList");

  if (!pbSummary || !latestPbCelebration || !pbList) {
    return;
  }

  const personalBests = gymPilotData.personalBests || [];

  if (personalBests.length === 0) {
    pbSummary.textContent = "No PBs yet.";
    latestPbCelebration.innerHTML = `
      <div class="pb-celebration-icon">🎉</div>
      <div>
        <h3>PBs will appear here</h3>
        <p>Complete a workout and GymPilot will check for new records.</p>
      </div>
    `;

    pbList.innerHTML = `
      <div class="empty-state">
        No personal bests logged yet.
      </div>
    `;
    return;
  }

  const latestPb = personalBests[0];

  pbSummary.textContent = `${personalBests.length} saved ${personalBests.length === 1 ? "PB" : "PBs"}`;

  latestPbCelebration.innerHTML = `
    <div class="pb-celebration-icon">🎉</div>
    <div>
      <h3>Latest PB: ${escapeHTML(latestPb.exerciseName)}</h3>
      <p>${escapeHTML(profileLabel(latestPb.profile))} • ${escapeHTML(latestPb.label)} — ${escapeHTML(latestPb.displayValue)}</p>
    </div>
  `;

  pbList.innerHTML = personalBests.map((pb) => {
    return `
      <article class="pb-item">
        <div class="pb-item-header">
          <div>
            <h4>${escapeHTML(pb.exerciseName)}</h4>
            <div class="pb-type">${escapeHTML(pb.label)}</div>
          </div>

          <span class="pb-badge">PB</span>
        </div>

        <div class="pb-value">${escapeHTML(pb.displayValue)}</div>
        <div class="pb-date">
  ${escapeHTML(profileLabel(pb.profile))} • ${formatDate(pb.date)} • ${escapeHTML(pb.routineName || "Workout")}
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

function extractFirstNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const match = String(value).match(/\d+(\.\d+)?/);

  if (!match) {
    return null;
  }

  return Number(match[0]);
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
