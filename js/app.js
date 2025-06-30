// Functions for modules page API interaction (frontend only)

export async function fetchModules() {
    const res = await fetch('/api/modules');
    if (!res.ok) throw new Error('Failed to fetch modules');
    return res.json();
}

export async function addModule(module) {
    const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(module)
    });
    if (!res.ok) throw new Error('Failed to add module');
    return res.json();
}

export async function updateModule(id, module) {
    const res = await fetch(`/api/modules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(module)
    });
    if (!res.ok) throw new Error('Failed to update module');
    return res.json();
}

export async function deleteModule(id) {
    const res = await fetch(`/api/modules/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete module');
    return res.json();
}

// Assignments API
export async function fetchAssignments(moduleId) {
    const res = await fetch(`/api/modules/${moduleId}/assignments`);
    if (!res.ok) throw new Error('Failed to fetch assignments');
    return res.json();
}

export async function addAssignment(moduleId, assignment) {
    const res = await fetch(`/api/modules/${moduleId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment)
    });
    if (!res.ok) throw new Error('Failed to add assignment');
    return res.json();
}

export async function deleteAssignment(id) {
    const res = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete assignment');
    return res.json();
}

// Toast notification logic
export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}
