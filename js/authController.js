require('dotenv').config();

const bcryt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../data/users.json');

const SECRET = 'your_jwt_secret';

// Login/Register logic for Uniplans
async function login(username, password) {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return await res.json();
}

async function register(username, email, password) {
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
    return await res.json();
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginSection = document.querySelector('.login-section');
    const registerSection = document.querySelector('.register-section');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

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

    if (loginForm) loginForm.onsubmit = async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const username = loginForm['login-username'].value;
        const password = loginForm['login-password'].value;
        try {
            // Try login
            await login(username, password);
            window.location.href = '/index.html';
        } catch (err) {
            // If admin login, try auto-register admin
            if (username === 'admin1' && password === 'admin123!') {
                try {
                    await register('admin1', 'admin@admin.com', 'admin123!');
                    await login('admin1', 'admin123!');
                    window.location.href = '/index.html';
                    return;
                } catch (e) {}
            }
            loginError.textContent = err.message;
        }
    };

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
});
