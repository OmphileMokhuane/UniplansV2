import {
	fetchModules,
	fetchAssignments,
	addAssignment,
	deleteAssignment
} from './app.js';

const moduleSelect = document.getElementById('module-select');
const assignmentsTableBody = document.querySelector('.assignments-table tbody');
const assignmentForm = document.getElementById('assignment-form');
const assignmentModuleSelect = document.createElement('select');
assignmentModuleSelect.id = 'assignment-module-select';
assignmentModuleSelect.name = 'assignment-module-select';
assignmentModuleSelect.required = true;

// Insert module select into the assignment form
assignmentForm.insertBefore(
	(() => {
		const div = document.createElement('div');
		const label = document.createElement('label');
		label.setAttribute('for', 'assignment-module-select');
		label.textContent = 'Module:';
		div.appendChild(label);
		div.appendChild(assignmentModuleSelect);
		return div;
	})(),
	assignmentForm.firstChild
);

let currentModuleId = null;
let modulesList = [];

function renderAssignments(assignments) {
	assignmentsTableBody.innerHTML = '';
	assignments.forEach(a => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
		<td>${a.title}</td>
		<td>${a.due_date ? a.due_date : ''}</td>
		<td>${a.description ? a.description : ''}</td>
		<td><button class="delete-btn" data-id="${a.id}">Delete</button></td>
		`;
		assignmentsTableBody.appendChild(tr);
	});
}


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

async function loadAssignments() {
	if (!currentModuleId) return;
	try {
		const assignments = await fetchAssignments(currentModuleId);
		renderAssignments(assignments);
	} catch (err) {
		alert('Failed to load assignments: ' + err.message);
	}
}

async function loadModules() {
	try {
		const modules = await fetchModules();
		modulesList = modules;
		moduleSelect.innerHTML = '';
		assignmentModuleSelect.innerHTML = '';
		modules.forEach(m => {
		const option1 = document.createElement('option');
		option1.value = m.id;
		option1.textContent = m.name;
		moduleSelect.appendChild(option1);
		const option2 = document.createElement('option');
		option2.value = m.id;
		option2.textContent = m.name;
		assignmentModuleSelect.appendChild(option2);
	});
	if (modules.length > 0) {
		currentModuleId = modules[0].id;
		moduleSelect.value = currentModuleId;
		assignmentModuleSelect.value = currentModuleId;
		loadAssignments();
	}
  } catch (err) {
	alert('Failed to load modules: ' + err.message);
  }
}

moduleSelect.addEventListener('change', () => {
  currentModuleId = moduleSelect.value;
  assignmentModuleSelect.value = currentModuleId;
  loadAssignments();
});

assignmentModuleSelect.addEventListener('change', () => {
  // No-op, just allows user to pick module for assignment
});

assignmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const selectedModuleId = assignmentModuleSelect.value;
  if (!selectedModuleId) return;
  const assignment = {
	title: assignmentForm['assignment-title'].value,
	due_date: assignmentForm['assignment-due-date'].value,
	description: assignmentForm['assignment-description'].value
  };
  try {
	await addAssignment(selectedModuleId, assignment);
	assignmentForm.reset();
	assignmentModuleSelect.value = currentModuleId;
	if (selectedModuleId === currentModuleId) loadAssignments();
  } catch (err) {
	alert('Failed to add assignment: ' + err.message);
  }
});

assignmentsTableBody.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-btn')) {
	const id = e.target.dataset.id;
	if (confirm('Are you sure you want to delete this assignment?')) {
	  try {
		await deleteAssignment(id);
		loadAssignments();
	  } catch (err) {
		alert('Failed to delete assignment: ' + err.message);
	  }
	}
  }
});

// Initial load
loadModules();
