// === Employee and Shift Data ===
const employees = [
  { name: "Sudhir Kumar", contact: "+91-94470XXXX" },
  { name: "Vinay Singh Panher", contact: "+91-81714XXXX" }
];

const statuses = [
  "Office", "Holiday", "Meeting", "On-Call", "Out Of Office",
  "Telecommuting", "Training", "Travel", "Vacation",
  "Vac-AM/Ofc-PM", "Ofc-AM/Vac-PM", "Sick Leave",
  "Caregiver Day", "Bereavement Day", "Onsite", "Offsite", "Field"
];

const statusColors = {
  "Office": "#d4edda", "Holiday": "#cce5ff", "Meeting": "#e2d9f3",
  "On-Call": "#ffeeba", "Out Of Office": "#f8d7da", "Telecommuting": "#fff3cd",
  "Training": "#f5deb3", "Travel": "#bee5eb", "Vacation": "#fff8b3",
  "Vac-AM/Ofc-PM": "#d1ecf1", "Ofc-AM/Vac-PM": "#d1ecf1", "Sick Leave": "#e2e3e5",
  "Caregiver Day": "#f8d7da", "Bereavement Day": "#d6d8d9",
  "Onsite": "#c3e6cb", "Offsite": "#e2d9f3", "Field": "#fdfd96"
};

let currentWeekStart = getMonday(new Date());
let editMode = false;
let accessMode = "full";

// === Helpers ===
function getMonday(d) {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
function getWeekKey() { return currentWeekStart.toISOString().split("T")[0]; }

// === Table ===
// FIND this line in createSchedulerTable():
// const savedData = JSON.parse(localStorage.getItem(getWeekKey())) || {};

// REPLACE it with:
async function createSchedulerTable() {
  const tbody = document.getElementById("schedulerBody");
  const thead = document.getElementById("tableHeader");
  tbody.innerHTML = "";

  const weekDays = [];
  const weekdayNames = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    weekDays.push({
      name: weekdayNames[i],
      dateStr: date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })
    });
  }

  let headHTML = `<th>Employee Name & Contact</th>`;
  weekDays.forEach(day => {
    headHTML += `<th>${day.name}<br><small>${day.dateStr}</small></th>`;
  });
  thead.innerHTML = `<tr>${headHTML}</tr>`;

  // Load from Firebase
  let savedData = {};
  try {
    const weekKey = getWeekKey();
    const doc = await db.collection('schedules').doc(weekKey).get();
    if (doc.exists) {
      savedData = doc.data();
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }

  // Rest of your table creation code stays the same...
  employees.forEach(emp => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.innerHTML = `<strong>${emp.name}</strong><br><small>${emp.contact}</small>`;
    row.appendChild(nameCell);

    for (let i = 0; i < 7; i++) {
      const dayKey = ["mon","tue","wed","thu","fri","sat","sun"][i];
      const cell = document.createElement("td");
      const select = document.createElement("select");
      const input = document.createElement("input");

      select.disabled = accessMode === "ro";
      input.disabled = accessMode === "ro";

      statuses.forEach(status => {
        const opt = document.createElement("option");
        opt.value = status;
        opt.textContent = status;
        select.appendChild(opt);
      });

      input.type = "text";
      input.placeholder = "Shift (e.g. 9AM–6PM)";
      const empData = savedData[emp.name]?.[dayKey];
      if (empData) {
        select.value = empData.status;
        input.value = empData.shift;
      }

      cell.style.backgroundColor = statusColors[select.value] || "#fff";
      select.addEventListener("change", () => {
        cell.style.backgroundColor = statusColors[select.value] || "#fff";
      });

      cell.appendChild(select);
      cell.appendChild(document.createElement("br"));
      cell.appendChild(input);
      row.appendChild(cell);
    }

    tbody.appendChild(row);
  });

  document.getElementById("weekRange").textContent =
    `${weekDays[0].dateStr} - ${weekDays[6].dateStr}`;
}
// === Login ===
document.getElementById("loginBtn").addEventListener("click", () => {
  console.log("🔘 Login button clicked");
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "admin" && password === "1234") {
    console.log("✅ Correct credentials");
    alert("Login successful! Loading scheduler...");
    showSchedulerPage();
  } else {
    console.log("❌ Wrong credentials");
    alert("Invalid username or password!");
  }
});


// === Page Transitions ===
function showSchedulerPage() {
  document.getElementById("loginPage").classList.remove("active-view");
  setTimeout(() => {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("schedulerPage").classList.remove("hidden");
    setTimeout(() => document.getElementById("schedulerPage").classList.add("active-view"), 50);
    createSchedulerTable();
  }, 400);
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  document.getElementById("schedulerPage").classList.remove("active-view");
  setTimeout(() => {
    document.getElementById("schedulerPage").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
    setTimeout(() => document.getElementById("loginPage").classList.add("active-view"), 50);
  }, 400);
});

// === Access Permission ===
document.getElementById("accessControl").addEventListener("change", (e) => {
  accessMode = e.target.value;
  createSchedulerTable();
});

// === Navigation & Save ===
document.getElementById("prevWeekBtn").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  createSchedulerTable();
});
document.getElementById("nextWeekBtn").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  createSchedulerTable();
});

document.getElementById("editBtn").addEventListener("click", () => {
  if (accessMode === "ro") return alert("🔒 Read-only access!");
  editMode = true;
  document.getElementById("editBtn").disabled = true;
  document.getElementById("saveBtn").disabled = false;
  createSchedulerTable();
});

document.getElementById("saveBtn").addEventListener("click", () => {
  if (accessMode === "ro") return alert("🔒 Read-only access!");
  saveData();
  editMode = false;
  document.getElementById("editBtn").disabled = false;
  document.getElementById("saveBtn").disabled = true;
  createSchedulerTable();
});

// REPLACE your saveData() function with this:
async function saveData() {
  const rows = document.querySelectorAll("#schedulerBody tr");
  const data = {};
  
  rows.forEach(row => {
    const empName = row.cells[0].querySelector("strong").textContent;
    data[empName] = {};
    for (let i = 1; i <= 7; i++) {
      const select = row.cells[i].querySelector("select");
      const input = row.cells[i].querySelector("input");
      const dayKey = ["mon","tue","wed","thu","fri","sat","sun"][i-1];
      data[empName][dayKey] = { 
        status: select.value, 
        shift: input.value 
      };
    }
  });

  try {
    // Save to Firebase instead of localStorage
    const weekKey = getWeekKey();
    await db.collection('schedules').doc(weekKey).set(data);
    
    const now = new Date();
    document.getElementById("saveStatus").textContent = 
      `✅ Data saved to cloud! (${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} on ${now.toLocaleDateString("en-GB")})`;
    setTimeout(() => (document.getElementById("saveStatus").textContent = ""), 4000);
  } catch (error) {
    console.error("Error saving:", error);
    alert("Failed to save data. Check console for details.");
  }
}
 //== });
  localStorage.setItem(getWeekKey(), JSON.stringify(data));
  const now = new Date();
  document.getElementById("saveStatus").textContent =
    `✅ Data saved locally! (${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} on ${now.toLocaleDateString("en-GB")})`;
  setTimeout(() => (document.getElementById("saveStatus").textContent = ""), 4000);
}

