# TaskWave

A real-time collaborative Kanban board inspired by Trello. Built with Node.js, Express, MongoDB, React, and Socket.IO. Collaborate, manage tasks, and see changes live with a beautiful, custom UI.

---

## ✅ Final Submission Quality Checklist

| Area                | Must-Haves (✅) | Enhancers (🚀) |
|---------------------|----------------|---------------|
| 🔐 Auth             | JWT-based, secure | Logout confirmation, welcome message |
| 📋 Task CRUD        | Create, update, delete | Confirm modals for delete |
| 🧠 Smart Assign     | Fair task distribution, tooltip explains logic | |
| 🔄 Conflict Handling| Modal, merge/overwrite/cancel, timestamps shown | |
| 🧱 Real-Time Sync   | All events synced | Animation on update |
| 🗂️ Activity Log     | Shows 20 latest actions | “View All” to load more |
| 🖼️ UI/UX            | Responsive, no framework | Hover/active effects |
| 🛠️ Code Quality     | Modular, clean, .env.example included | |

---

## 🚀 Features
- **User Registration & Login:** Secure JWT authentication, hashed passwords
- **Kanban Board:** Three columns (Todo, In Progress, Done), drag-and-drop, responsive design
- **Task Management:** Create, edit, delete, assign, and move tasks
- **Smart Assign:** Assigns a task to the user with the fewest active tasks. Tooltip: _"Assigns this task to the user with the fewest non-Done tasks. Ensures fair workload distribution."_
- **Real-Time Sync:** All changes update live for all users (Socket.IO)
- **Action Logging:** Every change is logged; view the last 20 actions in a live activity panel
- **Conflict Handling:** Detects simultaneous edits, lets users merge or overwrite (shows timestamps)
- **Custom UI:** No CSS frameworks, fully responsive, modern, and animated

---

## 🛠️ Tech Stack
- **Frontend:** React (Vite), Socket.IO Client, Axios
- **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.IO
- **Authentication:** JWT, bcrypt

---

## 📁 Project Structure
```
TaskWave/
  backend/    # Node.js/Express/MongoDB API
  frontend/   # React app (Vite)
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```sh
git clone https://github.com/yourusername/taskwave.git
cd taskwave
```

### 2. Backend Setup
```sh
cd backend
npm install
cp .env.example .env # Edit with your values
npm run dev
```

### 3. Frontend Setup
```sh
cd ../frontend
npm install
cp .env.example .env # Edit with your values
npm run dev
```

---

## 🌐 Deployment
- **Frontend:** Deploy `/frontend` to Vercel, Netlify, etc.
- **Backend:** Deploy `/backend` to Render, Railway, etc.
- **Environment Variables:**
  - Backend: `MONGO_URI`, `JWT_SECRET`
  - Frontend: `VITE_API_URL` (point to deployed backend `/api`)

---

## 📝 Usage Guide
- Register or log in
- Create, edit, delete, and move tasks on the board
- Assign tasks to users or use Smart Assign (hover for logic)
- See all changes live (open multiple browsers to test)
- View the activity log panel for the last 20 actions
- If a conflict occurs, resolve by merging or overwriting (timestamps shown)

---

## 🧠 Logic Explanations (Assignment Core)

### Smart Assign
When you click the Smart Assign button on a task, the backend finds the user with the fewest active (not Done) tasks and assigns the task to them. This ensures fair workload distribution among all users. If multiple users are tied, the first user found is chosen.

**How to Test:**
- Create several users and tasks.
- Assign some tasks manually, leave others unassigned.
- Click Smart Assign on an unassigned task; it should assign to the user with the fewest active tasks.
- Try with multiple users tied for fewest tasks; the first user will be chosen.

### Conflict Handling
If two users edit the same task at the same time, the backend detects the conflict using the `updatedAt` timestamp. If the task has changed since the user started editing, the backend returns both the latest (server) and the user's (client) version. The UI then shows both versions (with timestamps) and lets the user choose to merge (edit and resubmit) or overwrite (force update) the task. This prevents accidental overwrites and ensures collaborative integrity.

**How to Test:**
- Open the same task in two browser tabs.
- Edit and save in one tab, then try to save in the other.
- The conflict modal will appear, showing both versions and timestamps.
- Choose to merge (edit and resubmit) or overwrite (force update) as desired.

### Real-Time Sync
All task and log updates are broadcast to all connected clients using Socket.IO, ensuring everyone sees changes instantly.

**How to Test:**
- Open the app in two browsers.
- Create, move, or edit tasks in one; see updates appear live in the other.
- Watch the activity log update in real time.

### Activity Log
Shows the 20 most recent actions (create, update, delete, assign, etc.) in a visually consistent panel.

**How to Test:**
- Perform actions (add, edit, move, assign, delete tasks).
- See the log update instantly.
- (Optional) Add more than 20 actions to test the limit.

### UI/UX & Code Quality
- Fully responsive, modern, and accessible UI.
- No CSS frameworks used; all custom CSS.
- Code is modular, clean, and easy to maintain.
- `.env.example` files included for both frontend and backend.

---

## 🧪 How to Test (for Reviewers)
- Open the app in two browsers, log in as different users
- Create and move tasks, use Smart Assign, and see real-time updates
- Edit the same task in both browsers and save to trigger conflict resolution
- Try deleting tasks and confirm the modal
- Resize the window to test responsiveness

---

## 📄 .env.example
- Both `/backend` and `/frontend` include `.env.example` files for easy setup

---

## 🎥 Demo Video
- [Demo Video Link](https://your-demo-video-link)

---

## 🔗 Live App
- [Frontend Live URL](https://your-frontend-url)
- [Backend Live URL](https://your-backend-url)

---

## 🙏 Credits
- Developed by Navanish Mehta

---

## 📫 Contact
Email: navanishmehta@gmail.com

---

**Update all placeholder links and add your deployment/demo info before submission!** 