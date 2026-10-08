const enquiryInput = document.getElementById("enquiry");
const processBtn = document.getElementById("processBtn");
const sampleBtn = document.getElementById("sampleBtn");
const message = document.getElementById("message");

const emptyState = document.getElementById("emptyState");
const result = document.getElementById("result");
const history = document.getElementById("history");
const taskList = document.getElementById("taskList");


// --------------------------------
// UPDATE DASHBOARD STATISTICS
// --------------------------------
function updateStatistics(data) {
  document.getElementById("total").textContent = data.total;
  document.getElementById("urgent").textContent = data.high_priority;
  document.getElementById("assigned").textContent = data.total;
  document.getElementById("drafted").textContent = data.total;
}


// --------------------------------
// DISPLAY RECENT ACTIVITY
// --------------------------------
function renderHistory(items) {
  history.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent =
      "Your processed enquiries will appear here.";
    history.appendChild(empty);
    return;
  }

  items.slice(0, 5).forEach((item) => {
    const card = document.createElement("div");
    card.className = "history-item";

    const title = document.createElement("strong");
    title.textContent =
      item.category + " · " + item.priority;

    const description = document.createElement("p");
    description.textContent =
      item.text + " — Assigned to " + item.team;

    card.append(title, description);
    history.appendChild(card);
  });
}


// --------------------------------
// DISPLAY TASKS
// --------------------------------
function renderTasks(items) {
  taskList.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No tasks available yet.";
    taskList.appendChild(empty);
    return;
  }

  items.forEach((item) => {

    const card = document.createElement("div");
    card.className = "history-item";

    // Customer enquiry
    const enquiryTitle = document.createElement("strong");
    enquiryTitle.textContent = item.text;

    // Category
    const category = document.createElement("p");
    category.textContent =
      "Category: " + item.category;

    // Team
    const team = document.createElement("p");
    team.textContent =
      "Assigned team: " + item.team;

    // Priority
    const priority = document.createElement("p");
    priority.textContent =
      "Priority: " + item.priority;

    // Status label
    const statusLabel = document.createElement("label");
    statusLabel.textContent = "Status: ";

    // Status dropdown
    const statusSelect = document.createElement("select");

    const statuses = [
      "Processed",
      "Assigned",
      "In Progress",
      "Resolved"
    ];

    statuses.forEach((status) => {
      const option = document.createElement("option");

      option.value = status;
      option.textContent = status;

      if (status === item.status) {
        option.selected = true;
      }

      statusSelect.appendChild(option);
    });

    // Change status
    statusSelect.addEventListener("change", async () => {
      await updateTaskStatus(
        item.id,
        statusSelect.value
      );
    });

    statusLabel.appendChild(statusSelect);

    card.append(
      enquiryTitle,
      category,
      priority,
      team,
      statusLabel
    );

    taskList.appendChild(card);
  });
}


// --------------------------------
// UPDATE TASK STATUS
// --------------------------------
async function updateTaskStatus(taskId, newStatus) {

  try {

    const response = await fetch(
      `/tasks/${taskId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: newStatus
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Could not update task."
      );
    }

    message.textContent =
      "Task status updated to " + newStatus + ".";

  } catch (error) {

    console.error(
      "Status update error:",
      error
    );

    message.textContent =
      "Could not update the task status.";
  }
}


// --------------------------------
// LOAD DATA FROM DATABASE
// --------------------------------
async function loadDashboardData() {

  try {

    const response = await fetch("/history");

    if (!response.ok) {
      throw new Error(
        "Could not load dashboard data."
      );
    }

    const data = await response.json();

    // Update statistics
    updateStatistics(data);

    // Update recent activity
    renderHistory(data.items);

    // Update tasks
    renderTasks(data.items);

  } catch (error) {

    console.error(
      "Dashboard loading error:",
      error
    );
  }
}


// --------------------------------
// AUTOMATE ENQUIRY
// --------------------------------
async function processEnquiry() {

  const text = enquiryInput.value.trim();

  if (!text) {

    message.textContent =
      "Please enter a customer enquiry first.";

    enquiryInput.focus();

    return;
  }

  processBtn.disabled = true;

  message.textContent =
    "Python is analyzing your enquiry...";

  try {

    const response = await fetch(
      "/automate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: text
        })
      }
    );

    const analysis = await response.json();

    if (!response.ok) {

      throw new Error(
        analysis.error ||
        "Unable to process the enquiry."
      );
    }


    // --------------------------------
    // SHOW WORKFLOW RESULT
    // --------------------------------

    document.getElementById(
      "category"
    ).textContent = analysis.category;

    document.getElementById(
      "priority"
    ).textContent = analysis.priority;

    document.getElementById(
      "team"
    ).textContent = analysis.team;

    document.getElementById(
      "taskStatus"
    ).textContent = "Ready for review";

    document.getElementById(
      "reply"
    ).textContent = analysis.reply;


    // Show result section
    emptyState.hidden = true;
    result.hidden = false;


    // Reload everything from database
    await loadDashboardData();

    message.textContent =
      "Enquiry processed successfully by Python!";

  } catch (error) {

    console.error(
      "Automation error:",
      error
    );

    message.textContent =
      "Could not process the enquiry. " +
      "Check that Flask is running and try again.";

  } finally {

    processBtn.disabled = false;
  }
}


// --------------------------------
// SAMPLE BUTTON
// --------------------------------
sampleBtn.addEventListener(
  "click",
  () => {

    enquiryInput.value =
      "I was charged twice for my order. Please help me get a refund urgently.";

    message.textContent =
      "Sample enquiry loaded. Click Automate enquiry to process it.";
  }
);


// --------------------------------
// AUTOMATE BUTTON
// --------------------------------
processBtn.addEventListener(
  "click",
  processEnquiry
);


// --------------------------------
// CTRL + ENTER
// --------------------------------
enquiryInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.ctrlKey &&
      event.key === "Enter"
    ) {
      processEnquiry();
    }

  }
);


// --------------------------------
// LOAD DATABASE DATA ON PAGE OPEN
// --------------------------------
document.addEventListener(
  "DOMContentLoaded",
  loadDashboardData
);