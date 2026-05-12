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
  updateDashboardCounts();
  updateSaveStatus("Ready");
});

function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return structuredClone(defaultData);
  }

  try {
    return JSON.parse(savedData);
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
      createdAt: new Date().toISOString()
    };

    gymPilotData.exercises.push(testExercise);
    saveData();
    updateDashboardCounts();

    alert("Save test complete. A test exercise was saved.");
  });
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
