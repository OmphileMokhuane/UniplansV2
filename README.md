# Uniplans

A modern web app for managing university modules, assignments, tests, and schedules.

## Features

- Dashboard with motivational quotes, upcoming deadlines, and today's schedule
- Calendar view with assignments and tests
- Module and assignment management
- Responsive, modern UI

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Setup Instructions

1. **Clone or Download the Repository**
   - Place all files in a folder (e.g., `Uniplans`).

2. **Install Dependencies**
   - Open a terminal in the project folder.
   - Run:

     ```sh
     npm install
     ```

3. **Configure API Keys (Optional)**
   - For motivational quotes, the app uses a public API by default. If you want to use your own API key, edit `js/dashboard.js` and update the fetch logic as needed.

4. **Start the Server**
   - In the terminal, run:

     ```sh
     node server.js
     ```

   - The app will be available at [http://localhost:3000](http://localhost:3000) by default.

5. **Open in Browser**
   - Go to [http://localhost:3000](http://localhost:3000) to use Uniplans.

## File Structure

- `index.html` — Dashboard
- `pages/` — Calendar, modules, assignments, tests, settings, login
- `js/` — JavaScript logic for each page
- `css/` — Stylesheets
- `server.js` — Simple Node.js/Express backend
- `uniplans.db` — SQLite database (if used)

## Customization

- Edit CSS in `css/` for theming
- Add/modify widgets in `index.html` and `js/dashboard.js`
- Extend backend logic in `server.js`

## Troubleshooting

- If you see errors, make sure Node.js is installed and you are in the correct folder.
- For database issues, ensure `uniplans.db` is present or let the app create it on first run.

## License

MIT
