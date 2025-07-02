import { fetchModules, fetchAssignments, fetchTests } from './app.js';

// Fetch all events from the API
async function fetchEvents() {
  const res = await fetch('/api/events');
  if (!res.ok) return [];
  return await res.json();
}

// Helper: get all assignments, tests, and events for all modules
async function getAllCalendarItems() {
  const modules = await fetchModules();
  let allAssignments = [];
  let allTests = [];
  for (const mod of modules) {
    const assignments = await fetchAssignments(mod.id);
    assignments.forEach(a => {
      allAssignments.push({ ...a, module: mod, _type: 'assignment' });
    });
    const tests = await fetchTests(mod.id);
    tests.forEach(t => {
      allTests.push({ ...t, module: mod, _type: 'test' });
    });
  }
  const events = await fetchEvents();
  const allEvents = events.map(e => ({ ...e, _type: 'event' }));
  return [...allAssignments, ...allTests, ...allEvents];
}

// Helper: group items by date (YYYY-MM-DD)
function groupCalendarItemsByDate(items) {
  const grouped = {};
  items.forEach(a => {
    let date;
    if (a._type === 'assignment') date = a.due_date;
    else if (a._type === 'test') date = a.date;
    else date = a.date;
    if (!date) return;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(a);
  });
  return grouped;
}

// Render assignments, tests, and events for the selected day in the sidebar
function renderDayEvents(assignmentsByDate, dateStr) {
  const list = document.querySelector('.day-list-items');
  list.innerHTML = '';
  if (assignmentsByDate[dateStr] && assignmentsByDate[dateStr].length > 0) {
    assignmentsByDate[dateStr].forEach(a => {
      const li = document.createElement('li');
      li.className = 'item';
      if (a._type === 'assignment') {
        li.innerHTML = `<b>[Assignment]</b> ${a.title} <span style="color:#888;">(${a.module.name})</span><br><small>${a.description || ''}</small>`;
      } else if (a._type === 'test') {
        li.innerHTML = `<b>[Test/Quiz]</b> ${a.title} <span style=\"color:#888;\">(${a.module.name})</span><br><small>${a.description || ''}</small>`;
      } else {
        li.innerHTML = `<b>[Event]</b> ${a.title}<br><small>${a.description || ''}</small>`;
      }
      list.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.className = 'item';
    li.textContent = 'No assignments, tests, or events for this day.';
    list.appendChild(li);
  }
}

// Helper: get local date string in YYYY-MM-DD
function getLocalDateString(dateObj) {
  return dateObj.getFullYear() + '-' +
    String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
    String(dateObj.getDate()).padStart(2, '0');
}

// --- Dynamic Calendar Logic ---

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDay = new Date().getDate();

function getMonthName(monthIdx) {
  return new Date(currentYear, monthIdx, 1).toLocaleString('default', { month: 'long' });
}

function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(month, year) {
  // Returns 0 (Mon) to 6 (Sun)
  let d = new Date(year, month, 1);
  return (d.getDay() + 6) % 7; // Make Monday=0
}

function renderCalendarGrid(assignmentsByDate) {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  const days = daysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfWeek(currentMonth, currentYear);
  const prevMonthDays = daysInMonth((currentMonth - 1 + 12) % 12, currentYear - (currentMonth === 0 ? 1 : 0));

  // Fill leading days from previous month
  for (let i = 0; i < firstDay; i++) {
    const dayNum = prevMonthDays - firstDay + i + 1;
    const div = document.createElement('div');
    div.className = 'calendar__day inactive';
    div.innerHTML = `<span class="calendar__date">${dayNum}</span><span class="calendar__task"></span>`;
    grid.appendChild(div);
  }
  // Fill current month days
  for (let d = 1; d <= days; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const dateStr = getLocalDateString(dateObj);
    const div = document.createElement('div');
    div.className = 'calendar__day';
    if (
      d === new Date().getDate() &&
      currentMonth === new Date().getMonth() &&
      currentYear === new Date().getFullYear()
    ) {
      div.classList.add('today');
    }
    div.innerHTML = `<span class="calendar__date">${d}</span><span class="calendar__task"></span>`;
    const taskSpan = div.querySelector('.calendar__task');
    if (assignmentsByDate[dateStr]) {
      taskSpan.textContent = assignmentsByDate[dateStr].length + ' item' + (assignmentsByDate[dateStr].length > 1 ? 's' : '');
      taskSpan.classList.add('calendar__task--today');
    } else {
      taskSpan.textContent = '0 items';
      taskSpan.classList.add('calendar__task--empty');
    }
    // Click handler
    div.addEventListener('click', () => {
      renderDayEvents(assignmentsByDate, dateStr);
      document.querySelectorAll('.calendar__day').forEach(dv => dv.classList.remove('selected'));
      div.classList.add('selected');
      // Update sidebar date
      document.getElementById('day').textContent = d;
      document.getElementById('month').textContent = getMonthName(currentMonth);
      document.getElementById('year').textContent = currentYear;
      selectedDay = d;
    });
    grid.appendChild(div);
  }
  // Fill trailing days from next month
  const totalCells = firstDay + days;
  for (let i = 0; i < (7 - (totalCells % 7)) % 7; i++) {
    const dayNum = i + 1;
    const div = document.createElement('div');
    div.className = 'calendar__day inactive';
    div.innerHTML = `<span class="calendar__date">${dayNum}</span><span class="calendar__task"></span>`;
    grid.appendChild(div);
  }
}

async function updateCalendar() {
  document.getElementById('month').textContent = getMonthName(currentMonth);
  document.getElementById('year').textContent = currentYear;
  const allItems = await getAllCalendarItems();
  const grouped = groupCalendarItemsByDate(allItems);
  renderCalendarGrid(grouped);
  // Show selected day's events by default
  const selectedDate = getLocalDateString(new Date(currentYear, currentMonth, selectedDay));
  renderDayEvents(grouped, selectedDate);
}

function setupNavigation() {
  document.getElementById('prev-month').onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    selectedDay = 1;
    updateCalendar();
  };
  document.getElementById('next-month').onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    selectedDay = 1;
    updateCalendar();
  };
  document.getElementById('prev-year').onclick = () => {
    currentYear--;
    updateCalendar();
  };
  document.getElementById('next-year').onclick = () => {
    currentYear++;
    updateCalendar();
  };
}

function setupAddEventModal() {
  const modal = document.getElementById('event-modal');
  const btn = document.getElementById('add-event-btn');
  const close = document.getElementById('close-modal');
  btn.onclick = () => {
    // Set default date in modal to selected day
    const dateInput = document.getElementById('event-date');
    dateInput.value = getLocalDateString(new Date(currentYear, currentMonth, selectedDay));
    modal.style.display = 'block';
  };
  close.onclick = () => {
    modal.style.display = 'none';
  };
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  document.getElementById('event-form').onsubmit = async (e) => {
    e.preventDefault();
    // Save event (not assignment) via API or local logic
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value;
    // POST to /api/events (not assignments)
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, description })
    });
    modal.style.display = 'none';
    updateCalendar();
  };
}

window.addEventListener('DOMContentLoaded', async () => {
  // Set today's date in sidebar
  const todayDate = new Date();
  currentMonth = todayDate.getMonth();
  currentYear = todayDate.getFullYear();
  selectedDay = todayDate.getDate();
  document.getElementById('day').textContent = selectedDay;
  document.getElementById('month').textContent = getMonthName(currentMonth);
  document.getElementById('year').textContent = currentYear;
  setupNavigation();
  setupAddEventModal();
  await updateCalendar();
});
