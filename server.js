require('dotenv').config();
const express = require('express');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch'); // Add this at the top if not present


const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_DB_URL, process.env.SUPABASE_KEY);

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use(cookieParser());


// Helper: Extract and verify Supabase JWT from httpOnly cookie
async function requireLogin(req, res, next) {
    const token = req.cookies['uniplans_jwt'];
    if (!token) {
        return res.status(401).json({ error: 'No token provided.' });
    }
    // Validate JWT with Supabase
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}



// API: Get all modules (user only)
app.get('/api/modules', requireLogin, async (req, res) => {
    const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('user_id', req.user.id);
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
        .insert([{ user_id: req.user.id, name, code, credits, semester }])
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
        .eq('user_id', req.user.id)
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
        .eq('user_id', req.user.id);
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
        .eq('user_id', req.user.id);
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
        .insert([{ user_id: req.user.id, module_id: moduleId, title, due_date, description }])
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
        .eq('user_id', req.user.id);
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
        .insert([{ user_id: req.user.id, module_id: moduleId, title, date, description }])
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
        .eq('user_id', req.user.id);
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
        .eq('user_id', req.user.id);
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
        .eq('user_id', req.user.id);
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
        .insert([{ user_id: req.user.id, title, date, description }])
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
        .eq('user_id', req.user.id);
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
        res.status(201).json({ id: data.user.id, username, email });
    }
});

// API: Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    // Wait for email confirmation if required by Supabase settings
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        if (error.message && error.message.toLowerCase().includes('confirm')) {
            return res.status(401).json({ error: 'Please confirm your email before logging in.' });
        }
        return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!data.session || !data.user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }
    // Set JWT as httpOnly, secure cookie
    res.cookie('uniplans_jwt', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    });
    res.json({
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username
    });
});

// API: Change password (user only)
app.post('/api/change-password', requireLogin, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Both old and new password are required.' });
    }
    // Get user email from Supabase Auth
    const user = req.user;
    const email = user.email;
    // Try to sign in with old password
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword
    });
    if (signInError) return res.status(401).json({ error: 'Old password is incorrect.' });
    // Update password (must use access token)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) return res.status(500).json({ error: updateError.message });
    res.json({ success: true });
});

// API: Delete account (user only)
app.post('/api/delete-account', requireLogin, async (req, res) => {
    // Delete user from Supabase Auth (requires service role key)
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, redirect: '/pages/login.html' });
});

// API: Logout (clear the cookie)
app.post('/api/logout', (req, res) => {
    res.clearCookie('uniplans_jwt', { path: '/' });
    res.json({ success: true });
});

// API: Get current user
app.get('/api/me', requireLogin, async (req, res) => {
    const user = req.user;
    res.json({
        id: user.id,
        username: user.user_metadata?.username,
        email: user.email,
        created_at: user.created_at
    });
});

// API: Get a motivational quote from ZenQuotes
app.get('/api/motivation', async (req, res) => {
    try {
        const response = await fetch('https://zenquotes.io/api/random');
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json([{ q: 'Stay motivated and have a great day!', a: 'Uniplans' }]);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
