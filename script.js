
// ==========================================
// TASKMATE - STUDENT TASK MANAGER
// ==========================================

// GET HTML ELEMENTS

const taskDialog = document.getElementById("task-dialog");
const taskForm = document.getElementById("task-form");

const taskTitle = document.getElementById("task-title");
const taskDescription = document.getElementById("task-description");
const taskCategory = document.getElementById("task-category");
const taskPriority = document.getElementById("task-priority");
const taskDate = document.getElementById("task-date");

const dialogTitle = document.getElementById("dialog-title");
const saveTaskButton = document.getElementById("save-task-button");

const searchInput = document.getElementById("search-input");
const filterStatus = document.getElementById("filter-status");
const filterCategory = document.getElementById("filter-category");

const toast = document.getElementById("toast");


// ==========================================
// APPLICATION DATA
// ==========================================

const STORAGE_KEY = "taskmate_tasks";

let tasks = loadTasks();
let editingId = null;


// ==========================================
// LOCAL STORAGE
// ==========================================

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.completed === "boolean" &&
            ["Academic", "Personal", "Other"].includes(task.category) &&
            ["High", "Medium", "Low"].includes(task.priority) &&
            /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) &&
            !Number.isNaN(Date.parse(task.dueDate))
        );

    } catch (error) {
        console.error("Unable to load tasks:", error);
        return [];
    }
}


function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Unable to save tasks:", error);
        showToast("Unable to save tasks. Check browser storage.");
    }
}


// ==========================================
// DATE FUNCTIONS
// ==========================================

function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(date) {
    if (!date) return "No date";

    const parts = date.split("-");
    const value = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    return value.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function isOverdue(task) {
    return !task.completed && task.dueDate < getToday();
}


// ==========================================
// SECURITY - DISPLAY USER INPUT SAFELY
// ==========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// ==========================================
// NOTIFICATIONS
// ==========================================

let toastTimer;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


// ==========================================
// NAVIGATION
// ==========================================

function showView(viewName) {
    document.querySelectorAll(".page-view").forEach(view => {
        view.classList.remove("active");
    });

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.remove("active");
    });

    const selectedView = document.getElementById(viewName);

    if (!selectedView) return;

    selectedView.classList.add("active");

    const selectedButton = document.querySelector(
        `.nav-link[data-view="${viewName}"]`
    );

    if (selectedButton) {
        selectedButton.classList.add("active");
    }

    const headings = {
        dashboard: "Dashboard",
        tasks: "My Tasks",
        upcoming: "Upcoming",
        progress: "Progress",
        about: "About"
    };

    document.getElementById("page-heading").textContent =
        headings[viewName] || "TaskMate";
}


document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        showView(button.dataset.view);
    });
});


document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
        showView(button.dataset.goto);
    });
});


// ==========================================
// ADD TASK
// ==========================================

function openAddDialog() {
    editingId = null;

    taskForm.reset();

    dialogTitle.textContent = "Add New Task";
    saveTaskButton.textContent = "Save Task";

    taskDialog.showModal();
    taskTitle.focus();
}


document.getElementById("add-task-button")
    .addEventListener("click", openAddDialog);

document.getElementById("dashboard-add")
    .addEventListener("click", openAddDialog);


// ==========================================
// EDIT TASK
// ==========================================

function editTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    editingId = id;

    taskTitle.value = task.title;
    taskDescription.value = task.description || "";
    taskCategory.value = task.category;
    taskPriority.value = task.priority;
    taskDate.value = task.dueDate;

    dialogTitle.textContent = "Edit Task";
    saveTaskButton.textContent = "Update Task";

    taskDialog.showModal();
    taskTitle.focus();
}


// ==========================================
// SAVE TASK
// ==========================================

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const category = taskCategory.value;
    const priority = taskPriority.value;
    const dueDate = taskDate.value;

    if (!title || !dueDate) {
        showToast("Please enter the required details.");
        return;
    }

    if (!Number.isNaN(Date.parse(dueDate)) === false) {
        showToast("Please enter a valid date.");
        return;
    }

    if (editingId) {

        const task = tasks.find(item => item.id === editingId);

        if (!task) return;

        task.title = title;
        task.description = description;
        task.category = category;
        task.priority = priority;
        task.dueDate = dueDate;

        showToast("Task updated successfully!");

    } else {

        const newTask = {
            id: (typeof crypto !== "undefined" &&
                typeof crypto.randomUUID === "function")
                ? crypto.randomUUID()
                : Date.now().toString() + Math.random().toString(36).slice(2),

            title: title,
            description: description,
            category: category,
            priority: priority,
            dueDate: dueDate,
            completed: false,
            createdAt: Date.now()
        };

        tasks.push(newTask);

        showToast("New task added successfully!");
    }

    saveTasks();
    renderAll();

    taskDialog.close();
    taskForm.reset();
    editingId = null;
});


// ==========================================
// CLOSE DIALOG
// ==========================================

document.getElementById("close-dialog")
    .addEventListener("click", () => {
        taskDialog.close();
    });

document.getElementById("cancel-task")
    .addEventListener("click", () => {
        taskDialog.close();
    });


// ==========================================
// DELETE TASK
// ==========================================

function deleteTask(id) {
    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) return;

    tasks = tasks.filter(task => task.id !== id);

    saveTasks();
    renderAll();

    showToast("Task deleted successfully!");
}


// ==========================================
// COMPLETE TASK
// ==========================================

function toggleComplete(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    task.completed = !task.completed;

    saveTasks();
    renderAll();

    showToast(
        task.completed
            ? "Task marked as completed!"
            : "Task marked as pending!"
    );
}


// ==========================================
// DISPLAY TASKS
// ==========================================

function createTaskHTML(task) {

    const overdue = isOverdue(task);

    const priorityClass = {
        High: "priority-high",
        Medium: "priority-medium",
        Low: "priority-low"
    }[task.priority];

    let dateLabel = "Due: " + formatDate(task.dueDate);

    if (overdue) {
        dateLabel += " (Overdue)";
    }

    if (task.completed) {
        dateLabel = "Completed";
    }

    return `
        <div class="task-item">

            <input
                type="checkbox"
                class="task-checkbox"
                data-action="complete"
                data-id="${escapeHTML(task.id)}"
                ${task.completed ? "checked" : ""}
                aria-label="Mark ${escapeHTML(task.title)} as completed"
            >

            <div class="task-info ${task.completed ? "completed" : ""}">

                <h4>${escapeHTML(task.title)}</h4>

                <p>${escapeHTML(task.description || "No description")}</p>

                <div class="task-badges">

                    <span class="badge category-badge">
                        ${escapeHTML(task.category)}
                    </span>

                    <span class="badge ${priorityClass}">
                        ${escapeHTML(task.priority)} Priority
                    </span>

                </div>

                <div class="task-date ${overdue ? "overdue-text" : ""}">
                    ${dateLabel}
                </div>

            </div>

            <div class="task-actions">

                <button
                    class="action-button"
                    data-action="edit"
                    data-id="${escapeHTML(task.id)}"
                    aria-label="Edit task"
                    title="Edit"
                >✎</button>

                <button
                    class="action-button delete"
                    data-action="delete"
                    data-id="${escapeHTML(task.id)}"
                    aria-label="Delete task"
                    title="Delete"
                >×</button>

            </div>

        </div>
    `;
}


function displayTasks(containerId, taskArray) {

    const container = document.getElementById(containerId);

    if (taskArray.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Add a task or change your filters.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = taskArray
        .map(task => createTaskHTML(task))
        .join("");
}


// ==========================================
// TASK ACTION EVENTS
// ==========================================

document.addEventListener("click", function(event) {

    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") {
        editTask(id);
    }

    if (action === "delete") {
        deleteTask(id);
    }
});


document.addEventListener("change", function(event) {

    if (event.target.matches('[data-action="complete"]')) {
        toggleComplete(event.target.dataset.id);
    }
});


// ==========================================
// SEARCH AND FILTERS
// ==========================================

function filterTasks() {

    const searchText = searchInput.value.trim().toLowerCase();
    const status = filterStatus.value;
    const category = filterCategory.value;

    let filteredTasks = [...tasks];

    if (searchText) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchText) ||
            (task.description || "").toLowerCase().includes(searchText)
        );
    }

    if (status === "pending") {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    }

    if (status === "completed") {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }

    if (status === "overdue") {
        filteredTasks = filteredTasks.filter(task => isOverdue(task));
    }

    if (category !== "all") {
        filteredTasks = filteredTasks.filter(task =>
            task.category === category
        );
    }

    filteredTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    displayTasks("all-tasks", filteredTasks);
}


searchInput.addEventListener("input", filterTasks);
filterStatus.addEventListener("change", filterTasks);
filterCategory.addEventListener("change", filterTasks);


// ==========================================
// DASHBOARD STATISTICS
// ==========================================

function updateStats() {

    const total = tasks.length;

    const completed = tasks.filter(task =>
        task.completed
    ).length;

    const pending = total - completed;

    const overdue = tasks.filter(task =>
        isOverdue(task)
    ).length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("total-count").textContent = total;
    document.getElementById("pending-count").textContent = pending;
    document.getElementById("completed-count").textContent = completed;
    document.getElementById("overdue-count").textContent = overdue;

    document.getElementById("progress-total").textContent = total;
    document.getElementById("progress-completed").textContent = completed;
    document.getElementById("progress-pending").textContent = pending;

    document.getElementById("dashboard-percentage").textContent =
        percentage + "%";

    document.getElementById("dashboard-progress-text").textContent =
        completed + " / " + total;

    document.getElementById("dashboard-circle").style.background =
        `conic-gradient(#4c6fff ${percentage}%, #edf0f6 ${percentage}%)`;

    document.getElementById("large-progress-fill").style.width =
        percentage + "%";

    document.getElementById("progress-percentage").textContent =
        percentage + "% Completed";

    document.getElementById("progress-message").textContent =
        total === 0
            ? "Start adding tasks to track your progress."
            : percentage === 100
                ? "Excellent! You have completed all your tasks."
                : "Keep going! You are making progress.";
}


// ==========================================
// UPCOMING TASKS
// ==========================================

function updateUpcoming() {

    const upcomingTasks = tasks
        .filter(task => !task.completed)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    displayTasks("upcoming-tasks", upcomingTasks);
}


// ==========================================
// DASHBOARD RECENT TASKS
// ==========================================

function updateRecentTasks() {

    const recentTasks = [...tasks]
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5);

    displayTasks("recent-tasks", recentTasks);
}


// ==========================================
// UPDATE ALL SECTIONS
// ==========================================

function renderAll() {

    updateStats();
    updateUpcoming();
    updateRecentTasks();
    filterTasks();
}


// ==========================================
// CURRENT DATE
// ==========================================

document.getElementById("current-date").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });


// ==========================================
// START APPLICATION
// ==========================================

renderAll();

console.log("TaskMate application started successfully!");
