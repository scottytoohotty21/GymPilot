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
let historyFilter = null;
let activeWeekFilter = null; // currently highlighted week in chart
let activeChartFilter = null; // stores currently highlighted month in chart

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
defaultUnit: document.getElementById("exerciseUnit").value,
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
  stats.push(`${escapeHTML(formatLoadWithUnit(exercise.defaultWeight, exercise.defaultUnit))}`);
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
  document.getElementById("exerciseUnit").value = exercise.defaultUnit || "kg";
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
    plannedWeight: document.getElementById("routineExerciseWeight").value.trim() || exercise.defaultWeight || "",
plannedUnit: document.getElementById("routineExerciseUnit").value || exercise.defaultUnit || "kg"
  };

  currentRoutineExercises.push(routineExercise);

  document.getElementById("routineExerciseSelect").value = "";
  document.getElementById("routineExerciseSets").value = "";
  document.getElementById("routineExerciseReps").value = "";
  document.getElementById("routineExerciseWeight").value = "";
  document.getElementById("routineExerciseUnit").value = "kg";

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

   if (item.plannedWeight || item.plannedUnit === "bodyweight") {
  detailParts.push(`${escapeHTML(formatLoadWithUnit(item.plannedWeight, item.plannedUnit))}`);
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
plannedWeight: item.plannedWeight,
plannedUnit: item.plannedUnit || "kg"
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

      if (item.plannedWeight || item.plannedUnit === "bodyweight") {
  detailParts.push(`${escapeHTML(formatLoadWithUnit(item.plannedWeight, item.plannedUnit))}`);
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
  plannedWeight: item.plannedWeight,
  plannedUnit: item.plannedUnit || "kg"
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
plannedUnit: exercise.plannedUnit || "kg",
sets: Array.from({ length: setCount }, (_, index) => ({
  setId: crypto.randomUUID(),
  setNumber: index + 1,
  completed: false,
  actualReps: exercise.plannedReps || "",
  actualWeight: exercise.plannedWeight || "",
  actualUnit: exercise.plannedUnit || "kg"
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
          ${exercise.plannedWeight || exercise.plannedUnit === "bodyweight" ? ` • ${escapeHTML(formatLoadWithUnit(exercise.plannedWeight, exercise.plannedUnit))}` : ""}
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

  let workouts = gymPilotData.completedWorkouts || [];

if (historyFilter && historyFilter.type === "range") {
  workouts = workouts.filter(w => {
    const d = parseSafeDate(w.date);
    if (!d) return false;

    if (historyFilter.start && d < historyFilter.start) return false;
    if (historyFilter.end && d > historyFilter.end) return false;

    return true;
  });
}

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

          if (set.actualWeight !== "" || set.actualUnit === "bodyweight") {
  parts.push(`${escapeHTML(formatLoadWithUnit(set.actualWeight, set.actualUnit))}`);
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

        <div class="history-actions">
          <button class="copy-button" type="button" onclick="copyWorkoutSummary('${workout.id}')">
            Copy summary
          </button>

          <button class="share-button" type="button" onclick="shareWorkoutSummary('${workout.id}')">
            Share
          </button>
        </div>
      </article>
    `;
  }).join("");
  renderStats();
  if(!gymPilotData.routines || !gymPilotData.routines.length) {
  gymPilotData.routines = [
    { id: "r1", name: "Push Day", exercises: [] },
    { id: "r2", name: "Pull Day", exercises: [] },
    { id: "r3", name: "Leg Day", exercises: [] },
    { id: "r4", name: "Cardio", exercises: [] },
    { id: "r5", name: "Full Body", exercises: [] }
  ];
}
  initPlanner();
}
function renderHistoryFiltered(list) {
  const container = document.getElementById("historyList");

  if (!container) return;

  container.innerHTML = list.map(workout => `
    <article class="card">
      <h3>${workout.routineName}</h3>
      <p>${formatDate(workout.date)}</p>
    </article>
  `).join("");
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
      const currentBestWeight = getCurrentBestValue(exercise.exerciseId, "maxWeight", workout.profile, getExerciseWorkoutUnit(exercise));

      if (currentBestWeight === null || maxWeight > currentBestWeight) {
        newPersonalBests.push(createPersonalBestRecord({
          exercise,
          workout,
          type: "maxWeight",
          label: "Heaviest weight / resistance",
          value: maxWeight,
          displayValue: formatLoadWithUnit(maxWeight, getExerciseWorkoutUnit(exercise))
        }));
      }
    }

    if (Number.isFinite(maxReps)) {
      const currentBestReps = getCurrentBestValue(exercise.exerciseId, "maxReps", workout.profile, getExerciseWorkoutUnit(exercise));

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

    const currentBestSets = getCurrentBestValue(exercise.exerciseId, "maxSets", workout.profile, getExerciseWorkoutUnit(exercise));

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
unit: getExerciseWorkoutUnit(exercise),
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

function getCurrentBestValue(exerciseId, type, profile, unit) {
  const activeProfile = profileLabel(profile);
  const activeUnit = unit || "kg";

  const matchingBest = (gymPilotData.personalBests || [])
    .filter((pb) => {
      const pbProfile = profileLabel(pb.profile);
      const pbUnit = pb.unit || "kg";

      return (
        pb.exerciseId === exerciseId &&
        pb.type === type &&
        pbProfile === activeProfile &&
        pbUnit === activeUnit
      );
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
            <div class="pb-type">${escapeHTML(pb.label)}${pb.unit ? ` • ${escapeHTML(pb.unit)}` : ""}</div>
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
   Workout Sharing
---------------------------- */

function getWorkoutById(workoutId) {
  return (gymPilotData.completedWorkouts || []).find((workout) => workout.id === workoutId);
}

function getWorkoutPersonalBests(workoutId) {
  return (gymPilotData.personalBests || []).filter((pb) => pb.workoutId === workoutId);
}

function buildWorkoutSummary(workoutId) {
  const workout = getWorkoutById(workoutId);

  if (!workout) {
    return "Workout not found.";
  }

  const lines = [];

  lines.push("GymPilot Workout");
  lines.push("");
  lines.push(`${profileLabel(workout.profile)} completed ${workout.routineName}`);
  lines.push(`Date: ${formatDate(workout.date)}`);
  lines.push("");

  workout.exercises.forEach((exercise) => {
    lines.push(exercise.name);

    const completedSets = exercise.sets.filter((set) => set.completed);

    if (completedSets.length === 0) {
      lines.push("No completed sets ticked.");
      lines.push("");
      return;
    }

    completedSets.forEach((set) => {
      const setParts = [];

      if (set.actualReps !== "") {
        setParts.push(`${set.actualReps} reps`);
      }

      if (set.actualWeight !== "" || set.actualUnit === "bodyweight") {
  setParts.push(formatLoadWithUnit(set.actualWeight, set.actualUnit));
}

      lines.push(`Set ${set.setNumber}: ${setParts.length ? setParts.join(" • ") : "Completed"}`);
    });

    lines.push("");
  });

  const workoutPBs = getWorkoutPersonalBests(workoutId);

  if (workoutPBs.length > 0) {
    lines.push("PBs:");
    workoutPBs.forEach((pb) => {
      lines.push(`🎉 ${pb.exerciseName} — ${pb.label}: ${pb.displayValue}`);
    });
    lines.push("");
  }

  lines.push("Logged with GymPilot");

  return lines.join("\n");
}

async function copyWorkoutSummary(workoutId) {
  const summary = buildWorkoutSummary(workoutId);

  try {
    await navigator.clipboard.writeText(summary);
    alert("Workout summary copied.");
  } catch (error) {
    console.error("Could not copy workout summary:", error);
    alert(summary);
  }
}

async function shareWorkoutSummary(workoutId) {
  const summary = buildWorkoutSummary(workoutId);
  const workout = getWorkoutById(workoutId);

  if (!workout) {
    alert("Workout not found.");
    return;
  }

  const shareData = {
    title: `GymPilot workout — ${workout.routineName}`,
    text: summary
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      console.error("Share cancelled or failed:", error);
    }
  }

  await copyWorkoutSummary(workoutId);
}
function setHistoryFilter(type, value) {
  const now = new Date();

  if (type === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);

    historyFilter = { type: "range", start, end: now };
  }

  if (type === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    historyFilter = { type: "range", start, end: now };
  }

  if (type === "year") {
    const start = new Date(now.getFullYear(), 0, 1);

    historyFilter = { type: "range", start, end: now };
  }

  if (type === "monthName") {
    const workouts = gymPilotData.completedWorkouts || [];

    const filtered = workouts.filter(w => {
      const d = parseSafeDate(w.date);
      if (!d) return false;

      const name = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      return name === value;
    });

    historyFilter = null;

    renderHistoryFiltered(filtered);
    return;
  }

  renderHistory();
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

function getExerciseWorkoutUnit(exercise) {
  const firstSetWithUnit = (exercise.sets || []).find((set) => set.actualUnit);

  if (firstSetWithUnit) {
    return firstSetWithUnit.actualUnit;
  }

  return exercise.plannedUnit || "kg";
}
function parseWorkoutDate(dateStr) {
  return new Date(dateStr);
}
function getFilteredWorkouts(startDate, endDate) {
  const workouts = gymPilotData.completedWorkouts || [];

  return workouts.filter(w => {
    const d = new Date(w.date);

    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;

    return true;
  });
}
function groupByMonth(workouts) {
  const map = {};

  workouts.forEach(w => {
    const d = parseSafeDate(w.date);
    if (!d) return;

    const key = d.toLocaleString('default', {
      month: 'long',
      year: 'numeric'
    });

    map[key] = (map[key] || 0) + 1;
  });

  return map;
}
// --- Streak helper ---
function calculateStreak(workouts, profile = null) {
  if (!workouts || workouts.length === 0) return 0;

  const filtered = profile
    ? workouts.filter(w => w.profile === profile)
    : workouts.slice();

  const sorted = filtered
    .map(w => parseSafeDate(w.date))
    .filter(d => d)
    .sort((a, b) => b - a);

  if (sorted.length === 0) return 0;

  let streak = 1;
  let lastDate = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((lastDate - sorted[i]) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak++;
      lastDate = sorted[i];
    } else if (diff > 1) {
      break;
    } else {
      lastDate = sorted[i];
    }
  }

  return streak;
}

// --- Monthly chart helper ---
function renderMonthlyChart(workouts) {
  const ctx = document.getElementById("monthlyChart").getContext("2d");

  const monthlyCounts = {};
  workouts.forEach(w => {
    const d = parseSafeDate(w.date);
    if (!d) return;
    const key = d.toLocaleString("default", { month: "short", year: "numeric" });
    monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
  });

  const labels = Object.keys(monthlyCounts).sort((a, b) => {
    const ad = new Date(a);
    const bd = new Date(b);
    return ad - bd;
  });

  const data = labels.map(l => monthlyCounts[l]);

  // Assign colors: highlight active month if any
  const backgroundColors = labels.map(l => (activeChartFilter === l ? "var(--accent)" : "#ccc"));

  // Destroy previous chart if exists
  if (window._monthlyChartInstance) {
    window._monthlyChartInstance.destroy();
  }

  window._monthlyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Workouts",
        data,
        backgroundColor: backgroundColors,
      }]
    },
    options: {
      responsive: true,
      onClick: (evt, elements) => {
        if (!elements.length) return;
        const index = elements[0].index;
        const monthClicked = labels[index];

        // Update active filter
        activeChartFilter = monthClicked;

        // Set history filter to this month and re-render
        const workouts = gymPilotData.completedWorkouts || [];
        const filtered = workouts.filter(w => {
          const d = parseSafeDate(w.date);
          if (!d) return false;
          const name = d.toLocaleString("default", { month: "short", year: "numeric" });
          return name === monthClicked;
        });

        // Store temporarily and re-render history & stats
        gymPilotData._tempHistoryFilter = filtered;
        renderHistory();
        renderStats();
      },
      scales: {
        y: { beginAtZero: true, precision: 0 }
      }
    }
  });
}
// --- Planner Data ---
let plannedWorkouts = []; // stores {date, routineId, profile, status}

// --- Initialize Planner ---
function initPlanner() {
  // Populate routine sidebar
  const routineList = document.getElementById("routineList");
  routineList.innerHTML = (gymPilotData.routines || []).map(r => 
    `<li class="planned-routine" draggable="true" data-routine-id="${r.id}">${r.name}</li>`
  ).join("");

  // Add drag events for routines
  document.querySelectorAll("#routineList .planned-routine").forEach(item => {
    item.addEventListener("dragstart", ev => {
      ev.dataTransfer.setData("text/plain", ev.target.dataset.routineId);
    });
  });

  // Build week calendar (7 days starting today)
  const calendarGrid = document.getElementById("calendarGrid");
  const today = new Date();
  calendarGrid.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    cell.dataset.date = d.toISOString().split("T")[0];
    cell.textContent = d.toLocaleDateString('default', { weekday:'short', day:'numeric' });

    // Allow drop
    cell.addEventListener("dragover", ev => ev.preventDefault());
    cell.addEventListener("drop", ev => {
      ev.preventDefault();
      const routineId = ev.dataTransfer.getData("text/plain");
      plannedWorkouts.push({date: cell.dataset.date, routineId, profile: "Scott", status:"planned"});
      renderPlanner();
    });

    calendarGrid.appendChild(cell);
  }

  renderPlanner();
}
function renderPlanner() {
  const calendarGrid = document.getElementById("calendarGrid");
  if(!calendarGrid) return;

  // Clear existing routines
  calendarGrid.querySelectorAll(".planned-routine").forEach(r=>r.remove());

  plannedWorkouts.forEach(pw => {
    const cell = calendarGrid.querySelector(`.calendar-cell[data-date='${pw.date}']`);
    if(!cell) return;
    const routine = (gymPilotData.routines || []).find(r=>r.id===pw.routineId);
    if(!routine) return;

    const el = document.createElement("div");
    el.className = "planned-routine";
    el.textContent = routine.name;
    el.draggable = true;

    // Drag to reorder or move to another cell
    el.addEventListener("dragstart", ev=>{
      ev.dataTransfer.setData("text/plain", pw.routineId + "|" + pw.date);
      // Remove from current array for simplicity
      plannedWorkouts = plannedWorkouts.filter(x => !(x.date===pw.date && x.routineId===pw.routineId));
    });

    cell.appendChild(el);
  });
}
document.addEventListener("click", ev => {
  if(ev.target.classList.contains("planned-routine")) {
    const cell = ev.target.parentElement;
    const date = cell.dataset.date;
    const routineName = ev.target.textContent;
    const routine = (gymPilotData.routines || []).find(r => r.name === routineName);
    if(!routine) return;

    // Mark as completed
    const index = plannedWorkouts.findIndex(x => x.date === date && x.routineId === routine.id);
    if(index !== -1) {
      plannedWorkouts[index].status = "completed";

      // Push to History
      const workoutDate = new Date(date);
      gymPilotData.completedWorkouts.push({
        date: workoutDate.toISOString(),
        routineName: routine.name,
        exercises: routine.exercises,
        profile: "Scott"
      });

      // Refresh Planner, History, and Stats
      renderPlanner();
      renderHistory();
      renderStats();
    }
  }
});
function renderWeeklyChart(workouts) {
  const ctx = document.getElementById("weeklyChart").getContext("2d");

  const weeklyCounts = {};
  workouts.forEach(w => {
    const d = parseSafeDate(w.date);
    if (!d) return;

    // Calculate year + week number
    const firstDayOfYear = new Date(d.getFullYear(),0,1);
    const pastDaysOfYear = (d - firstDayOfYear)/(1000*60*60*24);
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay()+1)/7);
    const key = `${d.getFullYear()}-W${weekNumber}`;
    weeklyCounts[key] = (weeklyCounts[key] || 0) + 1;
  });

  const labels = Object.keys(weeklyCounts).sort((a,b) => {
    const [yearA, wA] = a.split("-W");
    const [yearB, wB] = b.split("-W");
    return Number(yearA)*52+Number(wA) - Number(yearB)*52-Number(wB);
  });

  const data = labels.map(l => weeklyCounts[l]);
  const backgroundColors = labels.map(l => (activeWeekFilter===l ? "var(--accent)" : "#ccc"));

  if (window._weeklyChartInstance) {
    window._weeklyChartInstance.destroy();
  }

  window._weeklyChartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets:[{ label:"Workouts", data, backgroundColor: backgroundColors }] },
    options: {
      responsive:true,
      onClick: (evt,elements) => {
        if(!elements.length) return;
        const index = elements[0].index;
        const weekClicked = labels[index];
        activeWeekFilter = weekClicked;

        // Filter History
        const filtered = (gymPilotData.completedWorkouts||[]).filter(w=>{
          const d = parseSafeDate(w.date);
          if(!d) return false;
          const firstDayOfYear = new Date(d.getFullYear(),0,1);
          const pastDays = (d - firstDayOfYear)/(1000*60*60*24);
          const weekNum = Math.ceil((pastDays + firstDayOfYear.getDay()+1)/7);
          const key = `${d.getFullYear()}-W${weekNum}`;
          return key===weekClicked;
        });

        gymPilotData._tempHistoryFilter = filtered;
        renderHistory();
        renderStats();
      },
      scales:{ y:{ beginAtZero:true, precision:0 } }
    }
  });
}
function renderStats(useCustom = false) {
  const workouts = gymPilotData.completedWorkouts || [];

  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let filtered = workouts;

  if (useCustom) {
    const start = document.getElementById("statsStartDate").value;
    const end = document.getElementById("statsEndDate").value;

    if (start) {
      filtered = filtered.filter(w => new Date(w.date) >= new Date(start));
    }

    if (end) {
      filtered = filtered.filter(w => new Date(w.date) <= new Date(end));
    }
  }

  const week = workouts.filter(w => {
  const d = parseSafeDate(w.date);
  return d && d >= startOfWeek;
}).length;

const month = workouts.filter(w => {
  const d = parseSafeDate(w.date);
  return d && d >= startOfMonth;
}).length;

const year = workouts.filter(w => {
  const d = parseSafeDate(w.date);
  return d && d >= startOfYear;
}).length;

  const monthly = groupByMonth(workouts);

  const container = document.getElementById("statsSummary");

  if (!container) return;

  container.innerHTML = `
    <div class="data-preview-item" onclick="setHistoryFilter('week')">
  <strong>This Week</strong>
  <span>${week}</span>
</div>

    <div class="data-preview-item" onclick="setHistoryFilter('month')">
  <strong>This Month</strong>
  <span>${month}</span>
</div>

    <div class="data-preview-item" onclick="setHistoryFilter('year')">
  <strong>This Year</strong>
  <span>${year}</span>
</div>

    ${Object.entries(monthly).map(([k, v]) => `
      <div class="data-preview-item" onclick="setHistoryFilter('monthName', '${k}')">
  <strong>${k}</strong>
  <span>${v}</span>
</div>
    `).join("")}
  `;
  // Display streak
const currentStreak = calculateStreak(workouts);
const streakEl = document.getElementById("streakDisplay");
if (streakEl) streakEl.textContent = `Your current streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}`;

// Draw monthly chart
renderMonthlyChart(workouts);
renderWeeklyChart(workouts);
}
function parseSafeDate(dateStr) {
  if (!dateStr) return null;

  const iso = new Date(dateStr);
  if (!isNaN(iso)) return iso;

  const parts = dateStr.split("/");

  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return new Date(`${yyyy}-${mm}-${dd}`);
  }

  return null;
}
function formatLoadWithUnit(load, unit) {
  if (!load && unit === "bodyweight") {
    return "bodyweight";
  }

  if (!load) {
    return "";
  }

  if (!unit) {
    return load;
  }

  if (unit === "bodyweight") {
    return "bodyweight";
  }

  return `${load} ${unit}`;
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
