import { fetchModules, fetchAssignments } from './app.js';

// Helper: get all assignments for all modules
async function getAllAssignments() {
  const modules = await fetchModules();
  let allAssignments = [];
  for (const mod of modules) {
    const assignments = await fetchAssignments(mod.id);
    assignments.forEach(a => {
      allAssignments.push({ ...a, module: mod });
    });
  }
  return allAssignments;
}

// Helper: group assignments by date (YYYY-MM-DD)
function groupAssignmentsByDate(assignments) {
  const grouped = {};
  assignments.forEach(a => {
    if (!a.due_date) return;
    if (!grouped[a.due_date]) grouped[a.due_date] = [];
    grouped[a.due_date].push(a);
  });
  return grouped;
}

// Render assignments for the selected day in the sidebar
function renderDayEvents(assignments, dateStr) {
  const list = document.querySelector('.day-list-items');
  list.innerHTML = '';
  if (assignments[dateStr] && assignments[dateStr].length > 0) {
    assignments[dateStr].forEach(a => {
      const li = document.createElement('li');
      li.className = 'item';
      li.innerHTML = `<b>${a.title}</b> <span style="color:#888;">(${a.module.name})</span><br><small>${a.description || ''}</small>`;
      list.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.className = 'item';
    li.textContent = 'No assignments or modules for this day.';
    list.appendChild(li);
  }
}

// Highlight today and allow clicking days to show events
async function setupCalendarEvents() {
  const allAssignments = await getAllAssignments();
  const grouped = groupAssignmentsByDate(allAssignments);

  // Add event listeners to calendar days
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  document.querySelectorAll('.calendar__day').forEach(dayDiv => {
    const dateSpan = dayDiv.querySelector('.calendar__date');
    if (!dateSpan) return;
    // Parse day as integer
    const dayNum = parseInt(dateSpan.textContent, 10);
    // Get month and year from sidebar
    const month = document.getElementById('month').textContent;
    const year = document.getElementById('year').textContent;
    // Build date object for this cell
    const dateObj = new Date(`${month} ${dayNum}, ${year}`);
    const dateStr = dateObj.toISOString().split('T')[0];

    // Mark today
    dayDiv.classList.remove('today');
    if (dateStr === todayStr) {
      dayDiv.classList.add('today');
    }

    // Show count of assignments for this day
    const taskSpan = dayDiv.querySelector('.calendar__task');
    if (grouped[dateStr]) {
      taskSpan.textContent = grouped[dateStr].length + ' item' + (grouped[dateStr].length > 1 ? 's' : '');
    } else {
      taskSpan.textContent = '0 items';
    }

    // Click to show events in sidebar and update sidebar date
    dayDiv.addEventListener('click', () => {
      // Render events for this day
      renderDayEvents(grouped, dateStr);
      // Highlight selected day
      document.querySelectorAll('.calendar__day').forEach(dv => dv.classList.remove('selected'));
      dayDiv.classList.add('selected');
      // Update sidebar date to this day
      const sidebarDay = document.getElementById('day');
      const sidebarMonth = document.getElementById('month');
      const sidebarYear = document.getElementById('year');
      sidebarDay.textContent = dateObj.getDate();
      sidebarMonth.textContent = dateObj.toLocaleString('default', { month: 'long' });
      sidebarYear.textContent = dateObj.getFullYear();
    });
  });

  // Show today's events by default
  renderDayEvents(grouped, todayStr);
}

// Set today's date in sidebar
const todayDate = new Date();
const day = document.getElementById('day');
const month = document.getElementById('month');
const year = document.getElementById('year');
day.innerHTML = todayDate.getDate();
month.innerHTML = todayDate.toLocaleString('default', { month: 'long' });
year.innerHTML = todayDate.getFullYear();

// Setup calendar events after DOM loads
window.addEventListener('DOMContentLoaded', setupCalendarEvents);
