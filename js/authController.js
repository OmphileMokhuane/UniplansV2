
// --- Auth Controller: Handles login, register, logout, and auth redirect logic ---

// Helper: login
async function login(email, password) {
    let res;
    try {
        res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    } catch (networkErr) {
        throw new Error('Network error. Please try again.');
    }
    let data;
    try {
        data = await res.json();
    } catch (jsonErr) {
        throw new Error('Unexpected server response. Please try again.');
    }
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

// Helper: register
async function register(username, email, password) {
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
    return await res.json();
}

// Helper: logout
function setupLogout() {
    document.querySelectorAll('a[href$="login.html"], a.logout').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/pages/login.html';
        });
    });
}

// On DOMContentLoaded, setup all auth logic
document.addEventListener('DOMContentLoaded', () => {
    // Redirect to dashboard if already logged in
    fetch('/api/me')
        .then(res => { if (res.ok) window.location.href = '/index.html'; });

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginSection = document.querySelector('.login-section');
    const registerSection = document.querySelector('.register-section');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    // Toggle between login/register
    if (showRegister) showRegister.onclick = (e) => {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    };
    if (showLogin) showLogin.onclick = (e) => {
        e.preventDefault();
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
    };

    // Login form submit
    if (loginForm) loginForm.onsubmit = async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const email = loginForm['login-email'] ? loginForm['login-email'].value : loginForm['login-username'].value;
        const password = loginForm['login-password'].value;
        try {
            // Try login
            await login(email, password);
            window.location.href = '/index.html';
        } catch (err) {
            loginError.textContent = err.message;
        }
    };

    // Register form submit
    if (registerForm) registerForm.onsubmit = async (e) => {
        e.preventDefault();
        registerError.textContent = '';
        const username = registerForm['register-username'].value;
        const email = registerForm['register-email'].value;
        const password = registerForm['register-password'].value;
        try {
            await register(username, email, password);
            registerError.style.color = 'green';
            registerError.textContent = 'Registration successful! You can now log in.';
        } catch (err) {
            registerError.style.color = '#c00';
            registerError.textContent = err.message;
        }
    };

    setupLogout();
});

// Add a user-facing message for session expiry
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
        const loginError = document.getElementById('login-error');
        if (loginError) {
            loginError.textContent = 'Your session has expired. Please log in again.';
        }
    }
});
