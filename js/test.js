import { fetchModules, fetchTests, addTest, deleteTest, showToast } from './app.js';

const moduleSelect = document.getElementById('test-module-select');
const testsTableBody = document.querySelector('.tests-table tbody');
const testForm = document.getElementById('test-form');
let modulesList = [];
let currentModuleId = null;

async function loadModules() {
    try {
        const modules = await fetchModules();
        modulesList = modules;
        moduleSelect.innerHTML = '';
        modules.forEach(m => {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = m.name;
            moduleSelect.appendChild(option);
        });
        if (modules.length > 0) {
            currentModuleId = modules[0].id;
            moduleSelect.value = currentModuleId;
            loadTests();
        }
    } catch (err) {
        showToast('Failed to load modules: ' + err.message, 'error');
    }
}

async function loadTests() {
    if (!currentModuleId) return;
    try {
        const tests = await fetchTests(currentModuleId);
        renderTests(tests);
    } catch (err) {
        showToast('Failed to load tests: ' + err.message, 'error');
    }
}

function renderTests(tests) {
    testsTableBody.innerHTML = '';
    if (!tests.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = 'No tests or quizzes for this module.';
        tr.appendChild(td);
        testsTableBody.appendChild(tr);
        return;
    }
    tests.forEach(test => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${test.title}</td>
            <td>${test.date ? test.date : ''}</td>
            <td>${test.description ? test.description : ''}</td>
            <td><button class="btn btn-danger" data-id="${test.id}">Delete</button></td>
        `;
        testsTableBody.appendChild(tr);
    });
}

moduleSelect.addEventListener('change', () => {
    currentModuleId = moduleSelect.value;
    loadTests();
});

testForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentModuleId) return;
    const test = {
        title: testForm['test-title'].value,
        date: testForm['test-date'].value,
        description: testForm['test-description'].value
    };
    try {
        await addTest(currentModuleId, test);
        testForm.reset();
        loadTests();
        showToast('Test/Quiz added!', 'success');
    } catch (err) {
        showToast('Failed to add test: ' + err.message, 'error');
    }
});

testsTableBody.addEventListener('click', async (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.dataset.id) {
        const id = e.target.dataset.id;
        if (confirm('Delete this test/quiz?')) {
            try {
                await deleteTest(id);
                loadTests();
                showToast('Test/Quiz deleted.', 'success');
            } catch (err) {
                showToast('Failed to delete test: ' + err.message, 'error');
            }
        }
    }
});

window.addEventListener('DOMContentLoaded', loadModules);
