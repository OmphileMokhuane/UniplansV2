
// Redirect to login if not authenticated and set username in header
async function checkAuthAndSetUser() {
    try {
        const res = await fetch('/api/me');
        if (!res.ok) {
            window.location.href = '/pages/login.html';
        } else {
            const user = await res.json();
            document.querySelectorAll('.username').forEach(el => el.textContent = user.username);
        }
    } catch (e) {
        window.location.href = '/pages/login.html';
    }
}
checkAuthAndSetUser();

import { fetchModules, fetchAssignments, fetchTests } from './app.js';

// Fetch and display a motivational quote from ZenQuotes (via backend proxy)
async function loadMotivationalQuote() {
    try {
        const res = await fetch('/api/motivation');
        const data = await res.json();
        if (Array.isArray(data) && data[0]) {
            const quote = data[0].q;
            const author = data[0].a;
            const quoteEl = document.getElementById('dashboard-quote');
            if (quoteEl) {
                quoteEl.textContent = `"${quote}" — ${author}`;
            }
        }
    } catch (e) {
        const quoteEl = document.getElementById('dashboard-quote');
        if (quoteEl) {
            quoteEl.textContent = 'Stay motivated and have a great day!';
        }
    }
}

// Call on page load
loadMotivationalQuote();

function getNext7Days() {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(new Date(d));
    }
    return days;
}

async function getItemsByDate() {
    const modules = await fetchModules();
    let assignments = [];
    let tests = [];
    for (const mod of modules) {
        const as = await fetchAssignments(mod.id);
        as.forEach(a => {
            if (a.due_date) assignments.push({ ...a, module: mod });
        });
        const ts = await fetchTests(mod.id);
        ts.forEach(t => {
            if (t.date) tests.push({ ...t, module: mod });
        });
    }
    // Group by date string (YYYY-MM-DD)
    const byDate = {};
    assignments.forEach(a => {
        if (!byDate[a.due_date]) byDate[a.due_date] = { assignments: [], tests: [] };
        byDate[a.due_date].assignments.push(a);
    });
    tests.forEach(t => {
        if (!byDate[t.date]) byDate[t.date] = { assignments: [], tests: [] };
        byDate[t.date].tests.push(t);
    });
    return { byDate, assignments, tests };
}

async function getUpcomingEvents() {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const eventsRes = await fetch('/api/events');
    const events = (await eventsRes.json()).filter(e => {
        const d = new Date(e.date);
        return d >= today && d <= nextWeek;
    });
    return events;
}

function formatDate(dateObj) {
    return dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function render7DayAssignmentsTests(container, byDate) {
    container.innerHTML = '';
    const days = getNext7Days();
    let hasAny = false;
    days.forEach(dateObj => {
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayData = byDate[dateStr] || { assignments: [], tests: [] };
        if (dayData.assignments.length || dayData.tests.length) hasAny = true;
        const section = document.createElement('div');
        section.className = 'dashboard-day';
        section.innerHTML = `<div class="dashboard-day-header">${formatDate(dateObj)}</div>`;
        if (dayData.assignments.length === 0 && dayData.tests.length === 0) {
            section.innerHTML += `<div class="dashboard-day-empty">No assignments or tests.</div>`;
        } else {
            if (dayData.assignments.length) {
                section.innerHTML += `<div class="dashboard-day-title">Assignments</div>`;
                const ul = document.createElement('ul');
                ul.className = 'dashboard-day-list';
                dayData.assignments.forEach(a => {
                    const li = document.createElement('li');
                    li.innerHTML = `<b>${a.title}</b> <span style='color:#888;'>(${a.module.name})</span>`;
                    ul.appendChild(li);
                });
                section.appendChild(ul);
            }
            if (dayData.tests.length) {
                section.innerHTML += `<div class="dashboard-day-title">Tests/Quizzes</div>`;
                const ul = document.createElement('ul');
                ul.className = 'dashboard-day-list';
                dayData.tests.forEach(t => {
                    const li = document.createElement('li');
                    li.innerHTML = `<b>${t.title}</b> <span style='color:#888;'>(${t.module.name})</span>`;
                    ul.appendChild(li);
                });
                section.appendChild(ul);
            }
        }
        container.appendChild(section);
    });
    if (!hasAny) {
        container.innerHTML = '<div class="dashboard-day-empty">No upcoming assignments or tests.</div>';
    }
}

function renderSimpleUpcomingList(container, items, type) {
    container.innerHTML = '';
    if (!items.length) {
        container.innerHTML = `<div class="dashboard-day-empty">No upcoming ${type}.</div>`;
        return;
    }
    items.sort((a, b) => new Date((a.due_date || a.date)) - new Date((b.due_date || b.date)));
    items.slice(0, 7).forEach(item => {
        let text = '';
        if (type === 'tests') {
            text = `</br>${item.title}</br> <span style='color:#888;'>(${item.module.name})</span> <small>${item.date}</small>`;
        } else if (type === 'events') {
            text = `<b>${item.title}</b> <small>${item.date}</small>`;
        }
        const li = document.createElement('li');
        li.innerHTML = text;
        container.appendChild(li);
    });
}

function renderNextDeadline(assignments, tests) {
    const all = [
        ...assignments.map(a => ({ ...a, type: 'Assignment', date: a.due_date })),
        ...tests.map(t => ({ ...t, type: 'Test', date: t.date }))
    ].filter(item => item.date);
    all.sort((a, b) => new Date(a.date) - new Date(b.date));
    const next = all.find(item => new Date(item.date) >= new Date());
    const el = document.getElementById('dashboard-deadline');
    if (next) {
        el.innerHTML = `<b>Next Deadline: [${next.type}]  ${next.title} - ${next.module.name}</b>
          <span style='color:#b26a00;'>Due: ${next.date}</span>`;
    } else {
        el.textContent = 'No upcoming deadlines!';
    }
}

function renderTodaySchedule(assignments, tests) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAssignments = assignments.filter(a => a.due_date === todayStr);
    const todayTests = tests.filter(t => t.date === todayStr);
    const el = document.getElementById('dashboard-today');
    let html = '<div class="dashboard-day-header">Today’s Schedule</div>';
    if (!todayAssignments.length && !todayTests.length) {
        html += '<div class="dashboard-day-empty">No assignments or tests due today.</div>';
    } else {
        if (todayAssignments.length) {
            html += '<div class="dashboard-day-title">Assignments</div><ul class="dashboard-day-list">' +
                todayAssignments.map(a => `<li><b>${a.title}</b> <span style='color:#888;'>(${a.module.name})</span></li>`).join('') +
                '</ul>';
        }
        if (todayTests.length) {
            html += '<div class="dashboard-day-title">Tests/Quizzes</div><ul class="dashboard-day-list">' +
                todayTests.map(t => `<li><b>${t.title}</b> <span style='color:#888;'>(${t.module.name})</span></li>`).join('') +
                '</ul>';
        }
    }
    el.innerHTML = html;
}


window.addEventListener('DOMContentLoaded', async () => {
    // Assignments & Tests (7-day grouped)
    const container = document.getElementById('list-assignments');
    const { byDate, assignments, tests } = await getItemsByDate();
    render7DayAssignmentsTests(container, byDate);
    renderNextDeadline(assignments, tests);
    renderTodaySchedule(assignments, tests);
    // Mini calendar removed
    // Tests (flat upcoming)
    const testsCard = document.getElementById('card-tests');
    if (testsCard) {
        const list = document.getElementById('list-tests');
        renderSimpleUpcomingList(list, tests, 'tests');
        testsCard.style.display = '';
    }
    // Events (flat upcoming)
    const eventsCard = document.getElementById('card-events');
    if (eventsCard) {
        const list = document.getElementById('list-events');
        const events = await getUpcomingEvents();
        renderSimpleUpcomingList(list, events, 'events');
        eventsCard.style.display = '';
    }
});
