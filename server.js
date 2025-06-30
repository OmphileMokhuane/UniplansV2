// Express server setup for Uniplans
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to SQLite database and create tables if not exist
const dbPath = path.join(__dirname, 'uniplans.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to database:', err.message);
    } else {
        console.log('Connected to uniplans.db');
        // Create modules table
        db.run(`CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            credits INTEGER NOT NULL,
            semester INTEGER NOT NULL
        )`);
        // Create assignments table
        db.run(`CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            due_date TEXT,
            description TEXT,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
        )`);
        // Create tests table
        db.run(`CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            date TEXT,
            description TEXT,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
        )`);
        console.log('All tables are ready.');
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// API: Get all modules
app.get('/api/modules', (req, res) => {
    db.all('SELECT * FROM modules', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// API: Add a new module
app.use(express.json());
app.post('/api/modules', (req, res) => {
    const { name, code, credits, semester } = req.body;
    if (!name || !code || !credits || !semester) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    db.run(
        'INSERT INTO modules (name, code, credits, semester) VALUES (?, ?, ?, ?)',
        [name, code, credits, semester],
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
app.put('/api/modules/:id', (req, res) => {
    const { name, code, credits, semester } = req.body;
    const { id } = req.params;
    db.run(
        'UPDATE modules SET name = ?, code = ?, credits = ?, semester = ? WHERE id = ?',
        [name, code, credits, semester, id],
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
app.delete('/api/modules/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM modules WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Module not found.' });
        } else {
            res.json({ success: true });
        }
    });
});

// API: Get assignments for a module
app.get('/api/modules/:moduleId/assignments', (req, res) => {
    const { moduleId } = req.params;
    db.all('SELECT * FROM assignments WHERE module_id = ?', [moduleId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// API: Add assignment to a module
app.post('/api/modules/:moduleId/assignments', (req, res) => {
    const { moduleId } = req.params;
    const { title, due_date, description } = req.body;
    db.run(
        'INSERT INTO assignments (module_id, title, due_date, description) VALUES (?, ?, ?, ?)',
        [moduleId, title, due_date, description],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.status(201).json({ id: this.lastID, module_id: moduleId, title, due_date, description });
            }
        }
    );
});

// API: Get tests for a module
app.get('/api/modules/:moduleId/tests', (req, res) => {
    const { moduleId } = req.params;
    db.all('SELECT * FROM tests WHERE module_id = ?', [moduleId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// API: Add test to a module
app.post('/api/modules/:moduleId/tests', (req, res) => {
    const { moduleId } = req.params;
    const { title, date, description } = req.body;
    db.run(
        'INSERT INTO tests (module_id, title, date, description) VALUES (?, ?, ?, ?)',
        [moduleId, title, date, description],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.status(201).json({ id: this.lastID, module_id: moduleId, title, date, description });
            }
        }
    );
});

// API: Delete assignment
app.delete('/api/assignments/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM assignments WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Assignment not found.' });
        } else {
            res.json({ success: true });
        }
    });
});

// API: Delete test
app.delete('/api/tests/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tests WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Test not found.' });
        } else {
            res.json({ success: true });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
