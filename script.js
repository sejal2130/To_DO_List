/* =====================================================
   BLOOMTASK JAVASCRIPT
===================================================== */

const STORAGE_KEY = "bloomtask-v1";
const SESSION_KEY = "bloom-focus-sessions";

let tasks = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || [];

let deletedTask = null;

let pomodoroSeconds = 25 * 60;
let pomodoroInterval = null;
let pomodoroRunning = false;


/* =====================================================
   BASIC HELPERS
===================================================== */

function save() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );
}


function uid() {

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}


function todayISO() {

    const d = new Date();

    const year = d.getFullYear();

    const month = String(
        d.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        d.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function escapeHTML(value = "") {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(date) {

    if (!date) {
        return "No due date";
    }

    const d = new Date(
        date + "T00:00:00"
    );

    return d.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short"
        }
    );
}


function isOverdue(task) {

    return (
        task.due &&
        task.due < todayISO() &&
        !task.completed
    );
}


function toast(message) {

    const container =
        document.getElementById(
            "toastContainer"
        );

    const item =
        document.createElement("div");

    item.className = "toast";

    item.textContent = message;

    container.appendChild(item);

    setTimeout(() => {

        item.remove();

    }, 3000);
}


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateGreeting();

        updateDate();

        render();

        updateTimerDisplay();

        document
            .getElementById("taskForm")
            .addEventListener(
                "submit",
                saveTask
            );

    }
);


/* =====================================================
   GREETING
===================================================== */

function updateGreeting() {

    const hour = new Date().getHours();

    let greeting = "Good evening";

    if (hour < 12) {

        greeting = "Good morning";

    } else if (hour < 17) {

        greeting = "Good afternoon";

    }

    document.getElementById(
        "greeting"
    ).textContent = greeting;

}


function updateDate() {

    const now = new Date();

    document.getElementById(
        "currentDate"
    ).textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
}


/* =====================================================
   MODAL
===================================================== */

function openNewTask() {

    document
        .getElementById("taskModal")
        .classList.add("show");

    document
        .getElementById("taskForm")
        .reset();

    document
        .getElementById("editingId")
        .value = "";

    document
        .getElementById("modalTitle")
        .textContent =
        "Create a new task";

}


function closeModal() {

    document
        .getElementById("taskModal")
        .classList.remove("show");

}


function closeDetail() {

    document
        .getElementById("detailModal")
        .classList.remove("show");

}


/* =====================================================
   SAVE / EDIT TASK
===================================================== */

function saveTask(event) {

    event.preventDefault();

    const id =
        document.getElementById(
            "editingId"
        ).value;

    const title =
        document.getElementById(
            "taskTitle"
        ).value.trim();

    const priority =
        document.getElementById(
            "taskPriority"
        ).value;

    const category =
        document.getElementById(
            "taskCategory"
        ).value;

    const due =
        document.getElementById(
            "taskDue"
        ).value;

    const tags =
        document.getElementById(
            "taskTags"
        ).value
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    const notes =
        document.getElementById(
            "taskNotes"
        ).value.trim();

    const subtasks =
        document.getElementById(
            "taskSubtasks"
        ).value
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean)
        .map(title => ({
            title,
            done: false
        }));


    if (!title) {

        toast("Please enter a task title.");

        return;
    }


    if (id) {

        const task =
            tasks.find(
                t => t.id === id
            );

        if (task) {

            task.title = title;
            task.priority = priority;
            task.category = category;
            task.due = due;
            task.tags = tags;
            task.notes = notes;

            if (
                subtasks.length &&
                !task.subtasks.length
            ) {

                task.subtasks = subtasks;

            }

        }

        toast("Task updated ✨");

    } else {

        tasks.unshift({

            id: uid(),

            title,

            priority,

            category,

            due,

            tags,

            notes,

            subtasks,

            completed: false,

            created: Date.now(),

            completedAt: null

        });

        toast("Task created 🌸");
    }


    save();

    closeModal();

    render();
}


/* =====================================================
   EDIT
===================================================== */

function editTask(id) {

    const task =
        tasks.find(
            t => t.id === id
        );

    if (!task) return;


    document
        .getElementById("taskModal")
        .classList.add("show");


    document
        .getElementById("modalTitle")
        .textContent =
        "Edit your task";


    document
        .getElementById("editingId")
        .value = task.id;


    document
        .getElementById("taskTitle")
        .value = task.title;


    document
        .getElementById("taskPriority")
        .value =
        task.priority || "medium";


    document
        .getElementById("taskCategory")
        .value =
        task.category || "Study";


    document
        .getElementById("taskDue")
        .value =
        task.due || "";


    document
        .getElementById("taskTags")
        .value =
        (task.tags || []).join(", ");


    document
        .getElementById("taskNotes")
        .value =
        task.notes || "";


    document
        .getElementById("taskSubtasks")
        .value =
        (task.subtasks || [])
        .map(s => s.title)
        .join("\n");

}


/* =====================================================
   TOGGLE TASK
===================================================== */

function toggleTask(id) {

    const task =
        tasks.find(
            t => t.id === id
        );

    if (!task) return;


    task.completed =
        !task.completed;


    task.completedAt =
        task.completed
            ? Date.now()
            : null;


    save();

    render();


    toast(
        task.completed
            ? "Task completed! 🌸"
            : "Task marked active."
    );
}


/* =====================================================
   DELETE
===================================================== */

function deleteTask(id) {

    const task =
        tasks.find(
            t => t.id === id
        );

    if (!task) return;


    if (
        !confirm(
            `Delete "${task.title}"?`
        )
    ) {

        return;
    }


    deletedTask = task;

    tasks =
        tasks.filter(
            t => t.id !== id
        );


    save();

    render();

    toast(
        "Task deleted. Refreshing your space..."
    );

}


/* =====================================================
   CLEAR COMPLETED
===================================================== */

function clearCompleted() {

    const count =
        tasks.filter(
            t => t.completed
        ).length;


    if (!count) {

        toast("No completed tasks.");

        return;
    }


    if (
        !confirm(
            `Remove ${count} completed task(s)?`
        )
    ) {

        return;
    }


    tasks =
        tasks.filter(
            t => !t.completed
        );


    save();

    render();

    toast("Completed tasks cleared.");
}


/* =====================================================
   DELETE EVERYTHING
===================================================== */

function deleteEverything() {

    if (!tasks.length) {

        toast("There are no tasks.");

        return;
    }


    if (
        !confirm(
            "Delete ALL tasks permanently?"
        )
    ) {

        return;
    }


    tasks = [];

    save();

    render();

    toast("Everything has been cleared.");
}


/* =====================================================
   FILTERING
===================================================== */

function filteredTasks() {

    const search =
        (
            document.getElementById(
                "searchInput"
            )?.value || ""
        )
        .toLowerCase()
        .trim();


    const status =
        document.getElementById(
            "statusFilter"
        )?.value || "all";


    const priority =
        document.getElementById(
            "priorityFilter"
        )?.value || "all";


    const category =
        document.getElementById(
            "categoryFilter"
        )?.value || "all";


    const sort =
        document.getElementById(
            "sortFilter"
        )?.value || "created";


    let result =
        [...tasks];


    if (search) {

        result =
            result.filter(task => {

                const text =
                    [
                        task.title,
                        task.notes,
                        ...(task.tags || [])
                    ]
                    .join(" ")
                    .toLowerCase();

                return text.includes(search);
            });
    }


    if (status === "active") {

        result =
            result.filter(
                task => !task.completed
            );

    } else if (status === "completed") {

        result =
            result.filter(
                task => task.completed
            );

    } else if (status === "overdue") {

        result =
            result.filter(
                task => isOverdue(task)
            );
    }


    if (priority !== "all") {

        result =
            result.filter(
                task =>
                    task.priority === priority
            );
    }


    if (category !== "all") {

        result =
            result.filter(
                task =>
                    task.category === category
            );
    }


    if (sort === "due") {

        result.sort(
            (a, b) =>
                (a.due || "9999")
                .localeCompare(
                    b.due || "9999"
                )
        );

    } else if (sort === "priority") {

        const order = {
            high: 1,
            medium: 2,
            low: 3
        };

        result.sort(
            (a, b) =>
                order[a.priority] -
                order[b.priority]
        );

    } else if (sort === "alphabetical") {

        result.sort(
            (a, b) =>
                a.title.localeCompare(
                    b.title
                )
        );

    } else {

        result.sort(
            (a, b) =>
                b.created - a.created
        );
    }


    return result;
}


/* =====================================================
   TASK CARD
===================================================== */

function taskCard(task) {

    const tags =
        (task.tags || [])
        .slice(0, 2)
        .map(
            tag =>
                `<span class="badge category">#${escapeHTML(tag)}</span>`
        )
        .join("");


    const overdue =
        isOverdue(task)
            ? `<span class="badge high">Overdue</span>`
            : "";


    const subtaskCount =
        (task.subtasks || []).length;


    const completedSubtasks =
        (task.subtasks || [])
        .filter(s => s.done)
        .length;


    return `

        <div class="task-card
            ${task.completed ? "completed" : ""}">

            <button
                class="check
                    ${task.completed ? "checked" : ""}"
                onclick="toggleTask('${task.id}')">

                ${task.completed ? "✓" : ""}

            </button>


            <div
                class="task-main"
                onclick="showDetail('${task.id}')">

                <div class="task-title">

                    ${escapeHTML(task.title)}

                </div>


                <div class="task-meta">

                    <span
                        class="badge ${task.priority}">

                        ${task.priority}

                    </span>


                    <span
                        class="badge category">

                        ${escapeHTML(task.category)}

                    </span>


                    ${
                        task.due
                            ? `
                            <span class="task-due">
                                📅 ${formatDate(task.due)}
                            </span>
                            `
                            : ""
                    }


                    ${overdue}


                    ${
                        subtaskCount
                            ? `
                            <span class="task-due">
                                ☑ ${completedSubtasks}/${subtaskCount}
                            </span>
                            `
                            : ""
                    }


                    ${tags}

                </div>

            </div>


            <div class="task-actions">

                <button
                    class="task-action"
                    title="Edit"
                    onclick="editTask('${task.id}')">

                    ✎

                </button>


                <button
                    class="task-action delete"
                    title="Delete"
                    onclick="deleteTask('${task.id}')">

                    ×

                </button>

            </div>

        </div>

    `;
}


/* =====================================================
   RENDER TASKS
===================================================== */

function renderList(elementId, list) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) return;


    if (!list.length) {

        element.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🌷
                </div>

                <h3>
                    Nothing here yet
                </h3>

                <p>
                    Add a task and start blooming.
                </p>

            </div>

        `;

        return;
    }


    element.innerHTML =
        list
        .map(taskCard)
        .join("");
}


/* =====================================================
   MAIN RENDER
===================================================== */

function render() {

    const today =
        todayISO();


    const completed =
        tasks.filter(
            t => t.completed
        ).length;


    const pending =
        tasks.length - completed;


    document.getElementById(
        "totalTasks"
    ).textContent =
        tasks.length;


    document.getElementById(
        "pendingTasks"
    ).textContent =
        pending;


    document.getElementById(
        "completedTasks"
    ).textContent =
        completed;


    document.getElementById(
        "streak"
    ).textContent =
        calculateStreak();


    const todayTasks =
        tasks
        .filter(
            t =>
                t.due === today &&
                !t.completed
        )
        .slice(0, 5);


    renderList(
        "todayTasks",
        todayTasks
    );


    const filtered =
        filteredTasks();


    renderList(
        "allTasks",
        filtered
    );


    const allToday =
        tasks
        .filter(
            t =>
                t.due === today
        );


    renderList(
        "todayFullList",
        allToday
    );


    const taskCount =
        document.getElementById(
            "taskCount"
        );


    if (taskCount) {

        taskCount.textContent =
            `${filtered.length} task${filtered.length === 1 ? "" : "s"}`;
    }


    updateProgress();

    renderAnalytics();
}


/* =====================================================
   PROGRESS
===================================================== */

function updateProgress() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(
            t => t.completed
        ).length;


    const percent =
        total
            ? Math.round(
                (completed / total) * 100
            )
            : 0;


    document.getElementById(
        "progressPercent"
    ).textContent =
        `${percent}%`;


    const ring =
        document.getElementById(
            "progressRing"
        );


    ring.style.background =
        `conic-gradient(
            var(--pink-500) ${percent * 3.6}deg,
            #f7e6ec ${percent * 3.6}deg
        )`;


    let message =
        "Start your first task.";


    if (percent === 100) {

        message =
            "Amazing! You completed everything. 🌸";

    } else if (percent >= 75) {

        message =
            "Almost there. Keep going! ✨";

    } else if (percent >= 40) {

        message =
            "Beautiful progress. Keep blooming.";

    } else if (percent > 0) {

        message =
            "You're off to a lovely start.";
    }


    document.getElementById(
        "progressMessage"
    ).textContent =
        message;
}


/* =====================================================
   STREAK
===================================================== */

function calculateStreak() {

    const completedDates =
        new Set(
            tasks
            .filter(t => t.completedAt)
            .map(
                t =>
                    new Date(
                        t.completedAt
                    )
                    .toISOString()
                    .slice(0, 10)
            )
        );


    let streak = 0;

    const date =
        new Date();


    while (true) {

        const key =
            date
            .toISOString()
            .slice(0, 10);


        if (
            completedDates.has(key)
        ) {

            streak++;

            date.setDate(
                date.getDate() - 1
            );

        } else {

            break;
        }
    }


    return streak;
}


/* =====================================================
   DETAIL MODAL
===================================================== */

function showDetail(id) {

    const task =
        tasks.find(
            t => t.id === id
        );


    if (!task) return;


    const detail =
        document.getElementById(
            "detailContent"
        );


    const subtasks =
        task.subtasks || [];


    detail.innerHTML = `

        <p class="eyebrow">
            ${escapeHTML(task.category)}
        </p>


        <h2>
            ${escapeHTML(task.title)}
        </h2>


        <div class="task-meta">

            <span
                class="badge ${task.priority}">
                ${task.priority}
            </span>


            ${
                task.due
                    ? `
                        <span class="task-due">
                            📅 ${formatDate(task.due)}
                        </span>
                    `
                    : ""
            }

        </div>


        ${
            task.notes
                ? `
                    <div class="detail-notes">
                        ${escapeHTML(task.notes)}
                    </div>
                `
                : ""
        }


        ${
            subtasks.length
                ? `
                    <div class="subtask-list">

                        <h3>
                            Checklist
                        </h3>

                        ${subtasks.map(
                            (sub, index) => `

                            <label
                                class="subtask-item
                                    ${sub.done ? "done" : ""}">

                                <input
                                    type="checkbox"
                                    ${sub.done ? "checked" : ""}
                                    onchange="
                                        toggleSub(
                                            '${task.id}',
                                            ${index}
                                        )">

                                <span>
                                    ${escapeHTML(sub.title)}
                                </span>

                            </label>

                        `
                        ).join("")}

                    </div>
                `
                : ""
        }

    `;


    document
        .getElementById("detailModal")
        .classList.add("show");
}


/* =====================================================
   SUBTASK
===================================================== */

function toggleSub(taskId, index) {

    const task =
        tasks.find(
            t => t.id === taskId
        );


    if (!task) return;


    task.subtasks[index].done =
        !task.subtasks[index].done;


    save();

    showDetail(taskId);

    render();
}


/* =====================================================
   NAVIGATION
===================================================== */

function switchView(view, button) {

    document
        .querySelectorAll(".view")
        .forEach(
            section =>
                section.classList.remove(
                    "active-view"
                )
        );


    const target =
        document.getElementById(
            view + "View"
        );


    if (target) {

        target.classList.add(
            "active-view"
        );
    }


    document
        .querySelectorAll(".nav-item")
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );


    if (button) {

        button.classList.add(
            "active"
        );
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    renderAnalytics();
}


/* =====================================================
   CATEGORY FILTER
===================================================== */

function filterCategory(category) {

    switchView("tasks");


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    if (categoryFilter) {

        categoryFilter.value =
            category;
    }


    render();
}


/* =====================================================
   ANALYTICS
===================================================== */

function renderAnalytics() {

    const completed =
        tasks.filter(
            t => t.completed
        ).length;


    const total =
        tasks.length;


    const completion =
        total
            ? Math.round(
                (completed / total) * 100
            )
            : 0;


    document.getElementById(
        "analyticsCompletion"
    ).textContent =
        `${completion}%`;


    document.getElementById(
        "analyticsOverdue"
    ).textContent =
        tasks.filter(
            t => isOverdue(t)
        ).length;


    document.getElementById(
        "focusSessions"
    ).textContent =
        Number(
            localStorage.getItem(
                SESSION_KEY
            ) || 0
        );


    const categories = [
        "Study",
        "Placement",
        "Personal",
        "Projects"
    ];


    const categoryCounts =
        categories.map(
            category => ({

                category,

                count:
                    tasks.filter(
                        t =>
                            t.category ===
                            category
                    ).length

            })
        );


    categoryCounts.sort(
        (a, b) =>
            b.count - a.count
    );


    document.getElementById(
        "topCategory"
    ).textContent =
        categoryCounts[0]?.count
            ? categoryCounts[0].category
            : "—";


    const categoryChart =
        document.getElementById(
            "categoryChart"
        );


    if (categoryChart) {

        const max =
            Math.max(
                1,
                ...categoryCounts.map(
                    x => x.count
                )
            );


        categoryChart.innerHTML =
            categoryCounts
            .map(
                item => `

                <div class="category-row">

                    <div class="category-row-header">

                        <span>
                            ${item.category}
                        </span>

                        <span>
                            ${item.count}
                        </span>

                    </div>

                    <div class="category-progress">

                        <div
                            style="
                                width:
                                ${(item.count / max) * 100}%;
                            ">
                        </div>

                    </div>

                </div>

            `
            )
            .join("");
    }


    renderWeeklyChart();
}


/* =====================================================
   WEEKLY CHART
===================================================== */

function renderWeeklyChart() {

    const chart =
        document.getElementById(
            "weeklyChart"
        );


    if (!chart) return;


    const days = [];


    for (let i = 6; i >= 0; i--) {

        const d = new Date();

        d.setDate(
            d.getDate() - i
        );


        const key =
            d.toISOString()
                .slice(0, 10);


        const label =
            d.toLocaleDateString(
                "en-IN",
                {
                    weekday: "short"
                }
            );


        const count =
            tasks.filter(
                t =>
                    t.completedAt &&
                    new Date(
                        t.completedAt
                    )
                    .toISOString()
                    .slice(0, 10) ===
                    key
            ).length;


        days.push({
            label,
            count
        });
    }


    const max =
        Math.max(
            1,
            ...days.map(
                d => d.count
            )
        );


    chart.innerHTML =
        days
        .map(
            day => `

            <div class="bar-item">

                <div
                    class="bar"
                    style="
                        height:
                        ${(day.count / max) * 85}%;
                    ">
                </div>

                <span>
                    ${day.label}
                </span>

            </div>

        `
        )
        .join("");
}


/* =====================================================
   DARK MODE
===================================================== */

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const dark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "bloom-theme",
        dark
            ? "dark"
            : "light"
    );


    document.getElementById(
        "themeBtn"
    ).textContent =
        dark ? "☾" : "☼";
}


if (
    localStorage.getItem(
        "bloom-theme"
    ) === "dark"
) {

    document.body.classList.add(
        "dark"
    );
}


/* =====================================================
   POMODORO
===================================================== */

function updateTimerDisplay() {

    const minutes =
        Math.floor(
            pomodoroSeconds / 60
        )
        .toString()
        .padStart(2, "0");


    const seconds =
        (
            pomodoroSeconds % 60
        )
        .toString()
        .padStart(2, "0");


    document.getElementById(
        "timerDisplay"
    ).textContent =
        `${minutes}:${seconds}`;
}


function startPomodoro() {

    if (pomodoroRunning) return;


    pomodoroRunning = true;


    document.getElementById(
        "timerButton"
    ).textContent =
        "Ⅱ";


    pomodoroInterval =
        setInterval(() => {

            pomodoroSeconds--;

            updateTimerDisplay();


            if (
                pomodoroSeconds <= 0
            ) {

                clearInterval(
                    pomodoroInterval
                );


                pomodoroRunning =
                    false;


                pomodoroSeconds =
                    25 * 60;


                updateTimerDisplay();


                let sessions =
                    Number(
                        localStorage.getItem(
                            SESSION_KEY
                        ) || 0
                    );


                sessions++;


                localStorage.setItem(
                    SESSION_KEY,
                    sessions
                );


                toast(
                    "Focus session complete! 🍅"
                );


                render();
            }

        }, 1000);
}


function togglePomodoro() {

    if (pomodoroRunning) {

        clearInterval(
            pomodoroInterval
        );


        pomodoroRunning =
            false;


        document.getElementById(
            "timerButton"
        ).textContent =
            "▶";


    } else {

        startPomodoro();

    }
}


function resetPomodoro() {

    clearInterval(
        pomodoroInterval
    );


    pomodoroRunning =
        false;


    pomodoroSeconds =
        25 * 60;


    updateTimerDisplay();


    document.getElementById(
        "timerButton"
    ).textContent =
        "▶";
}


/* =====================================================
   EXPORT
===================================================== */

function exportData() {

    const data =
        JSON.stringify(
            tasks,
            null,
            2
        );


    const blob =
        new Blob(
            [data],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href = url;

    a.download =
        "bloomtask-backup.json";


    a.click();


    URL.revokeObjectURL(url);


    toast(
        "Tasks exported successfully."
    );
}


/* =====================================================
   IMPORT
===================================================== */

function importData(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        function () {

            try {

                const imported =
                    JSON.parse(
                        reader.result
                    );


                if (
                    !Array.isArray(
                        imported
                    )
                ) {

                    throw new Error();

                }


                tasks =
                    imported;


                save();

                render();


                toast(
                    "Tasks imported successfully."
                );

            } catch {

                toast(
                    "Invalid JSON backup."
                );

            }

        };


    reader.readAsText(file);
}