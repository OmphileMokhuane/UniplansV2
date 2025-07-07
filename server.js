const express = require('express');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_DB_URL, process.env.SUPABASE_KEY);

// Serve static files
app.use(express.static(path.join(__dirname)));

// Add session middleware
app.use(session({
    secret: 'uniplans_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Middleware: Require login
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in.' });
    }
    next();
}

// API: Get all modules (user only)
app.get('/api/modules', requireLogin, async (req, res) => {
    const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('user_id', req.session.userId);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json(data);
    }
});

// API: Add a new module
app.use(express.json());
app.post('/api/modules', requireLogin, async (req, res) => {
    const { name, code, credits, semester } = req.body;
    if (!name || !code || !credits || !semester) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    const { data, error } = await supabase
        .from('modules')
        .insert([{ user_id: req.session.userId, name, code, credits, semester }])
        .select();
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.status(201).json(data[0]);
    }
});

// API: Update a module
app.put('/api/modules/:id', requireLogin, async (req, res) => {
    const { name, code, credits, semester } = req.body;
    const { id } = req.params;
    const { data, error } = await supabase
        .from('modules')
        .update({ name, code, credits, semester })
        .eq('id', id)
        .eq('user_id', req.session.userId)
        .select();
    if (error) {
        res.status(500).json({ error: error.message });
    } else if (!data || data.length === 0) {
        res.status(404).json({ error: 'Module not found.' });
    } else {
        res.json(data[0]);
    }
});

// API: Delete a module
app.delete('/api/modules/:id', requireLogin, async (req, res) => {
    const { id } = req.params;
    const { error, count } = await supabase
        .from('modules')
        .delete()
        .eq('id', id)
        .eq('user_id', req.session.userId);
    if (error) {
        res.status(500).json({ error: error.message });
    } else if (count === 0) {
        res.status(404).json({ error: 'Module not found.' });
    } else {
        res.json({ success: true });
    }
});

// API: Get assignments for a module (user only)
app.get('/api/modules/:moduleId/assignments', requireLogin, async (req, res) => {
    const { moduleId } = req.params;
    const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('module_id', moduleId)
        .eq('user_id', req.session.userId);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json(data);
    }
});

// API: Add assignment to a module (user only)
app.post('/api/modules/:moduleId/assignments', requireLogin, async (req, res) => {
    const { moduleId } = req.params;
    const { title, due_date, description } = req.body;
    const { data, error } = await supabase
        .from('assignments')
        .insert([{ user_id: req.session.userId, module_id: moduleId, title, due_date, description }])
        .select();
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.status(201).json(data[0]);
    }
});

// API: Get tests for a module (user only)
app.get('/api/modules/:moduleId/tests', requireLogin, async (req, res) => {
    const { moduleId } = req.params;
    const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('module_id', moduleId)
        .eq('user_id', req.session.userId);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json(data);
    }
});

// API: Add test to a module (user only)
app.post('/api/modules/:moduleId/tests', requireLogin, async (req, res) => {
    const { moduleId } = req.params;
    const { title, date, description } = req.body;
    const { data, error } = await supabase
        .from('tests')
        .insert([{ user_id: req.session.userId, module_id: moduleId, title, date, description }])
        .select();
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.status(201).json(data[0]);
    }
});

// API: Delete assignment (user only)
app.delete('/api/assignments/:id', requireLogin, async (req, res) => {
    const { id } = req.params;
    const { error, count } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)
        .eq('user_id', req.session.userId);
    if (error) {
        res.status(500).json({ error: error.message });
    } else if (count === 0) {
        res.status(404).json({ error: 'Assignment not found.' });
    } else {
        res.json({ success: true });
    }
});

// API: Delete test (user only)
app.delete('/api/tests/:id', requireLogin, async (req, res) => {
    const { id } = req.params;
    const { error, count } = await supabase
        .from('tests')
        .delete()
        .eq('id', id)
        .eq('user_id', req.session.userId);
    if (error) {
        res.status(500).json({ error: error.message });
    } else if (count === 0) {
        res.status(404).json({ error: 'Test not found.' });
    } else {
        res.json({ success: true });
    }
});

// API: Get all events (user only)
app.get('/api/events', requireLogin, async (req, res) => {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', req.session.userId);
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json(data);
    }
});

// API: Add a new event (user only)
app.post('/api/events', requireLogin, async (req, res) => {
    const { title, date, description } = req.body;
    if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required.' });
    }
    const { data, error } = await supabase
        .from('events')
        .insert([{ user_id: req.session.userId, title, date, description }])
        .select();
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.status(201).json(data[0]);
    }
});

// API: Delete an event (user only)
app.delete('/api/events/:id', requireLogin, async (req, res) => {
    const { id } = req.params;
    const { error, count } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', req.session.userId);
    if (error) {
        res.status(500).json({ error: error.message });
    } else if (count === 0) {
        res.status(404).json({ error: 'Event not found.' });
    } else {
        res.json({ success: true });
    }
});

// API: Register new user
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username }
        }
    });
    if (error) {
        res.status(400).json({ error: error.message });
    } else {
        req.session.userId = data.user.id;
        res.status(201).json({ id: data.user.id, username, email });
    }
});

// API: Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }
    req.session.userId = data.user.id;
    res.json({ id: data.user.id, email: data.user.email, username: data.user.user_metadata?.username });
});

// API: Change password (user only)
app.post('/api/change-password', requireLogin, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Both old and new password are required.' });
    }
    // Get user email from Supabase
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', req.session.userId)
        .single();
    if (userError || !userData) return res.status(400).json({ error: 'User not found.' });
    // Try to sign in with old password
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: oldPassword
    });
    if (signInError) return res.status(401).json({ error: 'Old password is incorrect.' });
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) return res.status(500).json({ error: updateError.message });
    res.json({ success: true });
});

// API: Delete account (user only)
app.post('/api/delete-account', requireLogin, async (req, res) => {
    // Delete user from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(req.session.userId);
    if (error) return res.status(500).json({ error: error.message });
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ success: true, redirect: '/pages/login.html' });
    });
});

// API: Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// API: Get current user
app.get('/api/me', requireLogin, async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, username, email, created_at')
        .eq('id', req.session.userId)
        .single();
    if (error || !data) return res.status(401).json({ error: 'Not logged in.' });
    res.json(data);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
