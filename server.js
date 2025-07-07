const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to SQLite database and create tables if not exist
const dbPath = path.join(__dirname, 'uniplans.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to database:', err.message);
    } else {
        console.log('Connected to uniplans.db');
        // Create modules table (add user_id)
        db.run(`CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            credits INTEGER NOT NULL,
            semester INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
        // Create assignments table (add user_id)
        db.run(`CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            module_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            due_date TEXT,
            description TEXT,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
        // Create tests table (add user_id)
        db.run(`CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            module_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            date TEXT,
            description TEXT,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
        // Create events table (add user_id)
        db.run(`CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
        // Create users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('All tables are ready.');
    }
});

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
app.get('/api/modules', requireLogin, (req, res) => {
    db.all('SELECT * FROM modules WHERE user_id = ?', [req.session.userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// API: Add a new module
app.use(express.json());
app.post('/api/modules', requireLogin, (req, res) => {
    const { name, code, credits, semester } = req.body;
    if (!name || !code || !credits || !semester) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    db.run(
        'INSERT INTO modules (user_id, name, code, credits, semester) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, name, code, credits, semester],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.status(201).json({ id: this.lastID, name, code, credits, semester });
            }
        }
    );
});

// API: Update a module
app.put('/api/modules/:id', requireLogin, (req, res) => {
    const { name, code, credits, semester } = req.body;
    const { id } = req.params;
    db.run(
        'UPDATE modules SET name = ?, code = ?, credits = ?, semester = ? WHERE id = ? AND user_id = ?',
        [name, code, credits, semester, id, req.session.userId],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Module not found.' });
            } else {
                res.json({ id, name, code, credits, semester });
            }
        }
    );
});

// API: Delete a module
app.delete('/api/modules/:id', requireLogin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM modules WHERE id = ? AND user_id = ?', [id, req.session.userId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Module not found.' });
        } else {
            res.json({ success: true });
        }
    });
});

// API: Get assignments for a module (user only)
app.get('/api/modules/:moduleId/assignments', requireLogin, (req, res) => {
    const { moduleId } = req.params;
    db.all('SELECT * FROM assignments WHERE module_id = ? AND user_id = ?', [moduleId, req.session.userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// API: Add assignment to a module (user only)
app.post('/api/modules/:moduleId/assignments', requireLogin, (req, res) => {
    const { moduleId } = req.params;
    const { title, due_date, description } = req.body;
    db.run(
        'INSERT INTO assignments (user_id, module_id, title, due_date, description) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, moduleId, title, due_date, description],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.status(201).json({ id: this.lastID, module_id: moduleId, title, due_date, description });
            }
        }
    );
});

// API: Get tests for a module (user only)
app.get('/api/modules/:moduleId/tests', requireLogin, (req, res) => {
    const { moduleId } = req.params;
    db.all('SELECT * FROM tests WHERE module_id = ? AND user_id = ?', [moduleId, req.session.userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// API: Add test to a module (user only)
app.post('/api/modules/:moduleId/tests', requireLogin, (req, res) => {
    const { moduleId } = req.params;
    const { title, date, description } = req.body;
    db.run(
        'INSERT INTO tests (user_id, module_id, title, date, description) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, moduleId, title, date, description],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.status(201).json({ id: this.lastID, module_id: moduleId, title, date, description });
            }
        }
    );
});

// API: Delete assignment (user only)
app.delete('/api/assignments/:id', requireLogin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM assignments WHERE id = ? AND user_id = ?', [id, req.session.userId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Assignment not found.' });
        } else {
            res.json({ success: true });
        }
    });
});

// API: Delete test (user only)
app.delete('/api/tests/:id', requireLogin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tests WHERE id = ? AND user_id = ?', [id, req.session.userId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Test not found.' });
        } else {
            res.json({ success: true });
        }
    });
});

// API: Get all events (user only)
app.get('/api/events', requireLogin, (req, res) => {
    db.all('SELECT * FROM events WHERE user_id = ?', [req.session.userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// API: Add a new event (user only)
app.post('/api/events', requireLogin, (req, res) => {
    const { title, date, description } = req.body;
    if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required.' });
    }
    db.run(
        'INSERT INTO events (user_id, title, date, description) VALUES (?, ?, ?, ?)',
        [req.session.userId, title, date, description],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.status(201).json({ id: this.lastID, title, date, description });
            }
        }
    );
});

// API: Delete an event (user only)
app.delete('/api/events/:id', requireLogin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM events WHERE id = ? AND user_id = ?', [id, req.session.userId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Event not found.' });
        } else {
            res.json({ success: true });
        }
    });
});

// API: Register new user
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    const hash = await bcrypt.hash(password, 10);
    db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, hash],
        function (err) {
            if (err) {
                res.status(400).json({ error: 'Username or email already exists.' });
            } else {
                req.session.userId = this.lastID;
                res.status(201).json({ id: this.lastID, username, email });
            }
        }
    );
});

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        req.session.userId = user.id;
        res.json({ id: user.id, username: user.username, email: user.email });
    });
});

// API: Change password (user only)
app.post('/api/change-password', requireLogin, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Both old and new password are required.' });
    }
    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found.' });
        const match = await bcrypt.compare(oldPassword, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Old password is incorrect.' });
        const hash = await bcrypt.hash(newPassword, 10);
        db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.session.userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// API: Delete account (user only)
app.post('/api/delete-account', requireLogin, (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.session.userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            // Send redirect instruction to login page
            res.json({ success: true, redirect: '/pages/login.html' });
        });
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
app.get('/api/me', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in.' });
    db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Not logged in.' });
        res.json(user);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
