const STORAGE_KEY = "realizaceBoardDataV1";
const ROLE_OPTIONS = [
  "Projektový manažer",
  "Obchodní manažer",
  "Designér",
  "Podpora obchodu",
  "Vedení",
  "Marketing",
  "Manažer kanceláře",
];

const TASK_COLUMNS = ["K vyřízení", "Probíhá", "Hotovo"];

const state = loadState();

const userRoleSelect = document.getElementById("user-role");
const projectMembersSelect = document.getElementById("project-members");
const usersList = document.getElementById("users-list");
const projectsGrid = document.getElementById("projects-grid");
const taskBoard = document.getElementById("task-board");
const taskFormTemplate = document.getElementById("task-form-template");

ROLE_OPTIONS.forEach((role) => {
  const opt = document.createElement("option");
  opt.value = role;
  opt.textContent = role;
  userRoleSelect.appendChild(opt);
});

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { users: [], projects: [], tasks: [] };
  }
  return JSON.parse(raw);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

function renderUsers() {
  usersList.innerHTML = "";
  projectMembersSelect.innerHTML = "";

  for (const user of state.users) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${user.name}</span><span class="badge">${user.role}</span>`;
    usersList.appendChild(li);

    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.name} (${user.role})`;
    projectMembersSelect.appendChild(option);
  }
}

function renderProjects() {
  projectsGrid.innerHTML = "";

  if (state.projects.length === 0) {
    projectsGrid.innerHTML = '<p class="muted">Zatím nebyla vytvořena žádná zakázka.</p>';
    return;
  }

  for (const project of state.projects) {
    const card = document.createElement("article");
    card.className = "project-card";

    const members = project.memberIds
      .map((id) => state.users.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    card.innerHTML = `
      <h3>${project.name}</h3>
      <p class="meta"><strong>Klient:</strong> ${project.client}</p>
      <p class="meta"><strong>Stav:</strong> <span class="badge">${project.status}</span></p>
      <p class="meta"><strong>Cena:</strong> ${formatCurrency(project.price)}</p>
      <p class="meta"><strong>Adresa:</strong> ${project.address}</p>
      <p class="meta">${project.description}</p>
      <p class="meta"><strong>Tým:</strong> ${members || "Bez přiřazených pracovníků"}</p>
    `;

    const taskForm = taskFormTemplate.content.firstElementChild.cloneNode(true);
    const assigneeSelect = taskForm.querySelector("select[name='assignee']");

    const availableUsers = state.users.filter((user) => project.memberIds.includes(user.id));
    if (availableUsers.length === 0) {
      const fallback = document.createElement("option");
      fallback.value = "";
      fallback.textContent = "Nejdříve přiřaďte členy týmu";
      assigneeSelect.appendChild(fallback);
      assigneeSelect.disabled = true;
      taskForm.querySelector("button").disabled = true;
    } else {
      for (const user of availableUsers) {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = `${user.name} (${user.role})`;
        assigneeSelect.appendChild(option);
      }
    }

    taskForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!assigneeSelect.value) return;

      const formData = new FormData(taskForm);
      state.tasks.push({
        id: uid("task"),
        projectId: project.id,
        title: formData.get("title"),
        description: formData.get("description"),
        assigneeId: formData.get("assignee"),
        status: formData.get("status"),
      });

      saveState();
      renderTaskBoard();
      taskForm.reset();
    });

    card.appendChild(taskForm);
    projectsGrid.appendChild(card);
  }
}

function renderTaskBoard() {
  taskBoard.innerHTML = "";

  for (const colName of TASK_COLUMNS) {
    const col = document.createElement("section");
    col.className = "column";
    col.innerHTML = `<h3>${colName}</h3>`;

    const tasks = state.tasks.filter((task) => task.status === colName);
    for (const task of tasks) {
      const project = state.projects.find((p) => p.id === task.projectId);
      const assignee = state.users.find((u) => u.id === task.assigneeId);
      const taskCard = document.createElement("article");
      taskCard.className = "task-card";

      const select = document.createElement("select");
      TASK_COLUMNS.forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        if (status === task.status) option.selected = true;
        select.appendChild(option);
      });

      select.addEventListener("change", () => {
        task.status = select.value;
        saveState();
        renderTaskBoard();
      });

      taskCard.innerHTML = `
        <h4>${task.title}</h4>
        <p class="muted">Zakázka: ${project?.name || "Neznámá"}</p>
        <p class="muted">Odpovědný: ${assignee?.name || "Neznámý"}</p>
        ${task.description ? `<p>${task.description}</p>` : ""}
      `;
      taskCard.appendChild(select);
      col.appendChild(taskCard);
    }

    taskBoard.appendChild(col);
  }
}

document.getElementById("user-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const nameInput = document.getElementById("user-name");
  const role = userRoleSelect.value;

  state.users.push({ id: uid("user"), name: nameInput.value.trim(), role });
  saveState();
  renderUsers();
  renderProjects();
  renderTaskBoard();

  event.target.reset();
});

document.getElementById("project-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const selectedMembers = Array.from(projectMembersSelect.selectedOptions).map(
    (option) => option.value,
  );

  const project = {
    id: uid("project"),
    name: document.getElementById("project-name").value.trim(),
    description: document.getElementById("project-description").value.trim(),
    client: document.getElementById("project-client").value.trim(),
    price: Number(document.getElementById("project-price").value),
    address: document.getElementById("project-address").value.trim(),
    status: document.getElementById("project-status").value,
    memberIds: selectedMembers,
  };

  state.projects.push(project);
  saveState();
  renderProjects();
  renderTaskBoard();
  event.target.reset();
});

renderUsers();
renderProjects();
renderTaskBoard();
