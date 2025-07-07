import {
  fetchModules,
  addModule,
  updateModule,
  deleteModule
} from './app.js';

const tableBody = document.querySelector('.modules-table tbody');
const form = document.getElementById('module-form');

let editingId = null;

function renderModules(modules) {
  tableBody.innerHTML = '';
  modules.forEach(module => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${module.name}</td>
      <td>${module.code}</td>
      <td>${module.credits}</td>
      <td>${module.semester}</td>
      <td>
        <button class="edit-btn" data-id="${module.id}">Edit</button>
        <button class="delete-btn" data-id="${module.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
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

async function loadModules() {
  try {
    const modules = await fetchModules();
    renderModules(modules);
  } catch (err) {
    alert('Failed to load modules: ' + err.message);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const module = {
    name: form['module-name'].value,
    code: form['module-code'].value,
    credits: parseInt(form['credits'].value, 10),
    semester: parseInt(form['semester'].value, 10)
  };
  try {
    if (editingId) {
      await updateModule(editingId, module);
      editingId = null;
      form.querySelector('button[type="submit"]').textContent = 'Add Module';
    } else {
      await addModule(module);
    }
    form.reset();
    loadModules();
  } catch (err) {
    alert('Failed to save module: ' + err.message);
  }
});

tableBody.addEventListener('click', async (e) => {
  if (e.target.classList.contains('edit-btn')) {
    const id = e.target.dataset.id;
    const row = e.target.closest('tr');
    form['module-name'].value = row.children[0].textContent;
    form['module-code'].value = row.children[1].textContent;
    form['credits'].value = row.children[2].textContent;
    form['semester'].value = row.children[3].textContent;
    editingId = id;
    form.querySelector('button[type="submit"]').textContent = 'Update Module';
    form.scrollIntoView({ behavior: 'smooth' });
  } else if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    if (confirm('Are you sure you want to delete this module?')) {
      try {
        await deleteModule(id);
        loadModules();
      } catch (err) {
        alert('Failed to delete module: ' + err.message);
      }
    }
  }
});

// Initial load
loadModules();