# SportsChat+

Sports Chat+ is a database-driven web platform.

---

## **Project Structure**
This repository contains both frontend and backend code, as well as templates and documentation for the development team.

### **Folders & Their Purpose**
- **documents/** → Contains important project documentation for UI, API, and backend/frontend development.
- **sportschat-backend/** → Holds the backend code (server-side logic, database interactions, and API routes).
- **sportschat-frontend/** → Holds the frontend code (React components, styles, and services for interacting with the backend).
- **templates/** → Contains predefined module templates for backend and frontend components.

---

## **Important Documents**
📂 **documents/**
- `API-UI-FRONTEND-BACKEND_GUIDELINES.docx` → Defines the API structure, frontend-backend interaction, and team coding standards.
- `Sports Chat Plus Proposal Working Copy.docx` → The proposal outlining project goals, features, and structure.

---

## **Templates & How to Use Them**
Templates provide a consistent structure for all features. Each assigned module should use the appropriate template.

📂 **templates/**
| Template File | Purpose | Apply To |
|--------------|---------|----------|
| `server-template.js` | General backend structure for Express routes | Backend (`sportschat-backend/`) |
| `user-template.js` | Handles user-related API endpoints | Backend (`sportschat-backend/`) |
| `chat-template.js` | Handles chat-related API endpoints | Backend (`sportschat-backend/`) |
| `post-template.js` | Handles post-related API endpoints | Backend (`sportschat-backend/`) |
| `database-template.js` | Database connection & models | Backend (`sportschat-backend/`) |

### **How to Apply a Template**
1. Navigate to the `sportschat-backend/` folder.
2. Identify the module you are assigned (e.g., user authentication).
3. Copy the corresponding template file from `templates/` and rename it appropriately (e.g., `userRoutes.js`).
4. Implement your feature by following the structure in the template.

---

## **Setting Up & Running the Project**
### **Backend (Server)**
1. **Navigate to the backend folder:**
   ```sh
   cd sportschat-backend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Start the server:**
   ```sh
   npm start
   ```
   - The backend runs on **http://localhost:5000**.

---

### **Frontend (React)**
📂 **sportschat-frontend/**
```
📂 public/                 # Static assets (unchanged)
 ┣ 📜 favicon.ico
 ┣ 📜 index.html
 ┣ 📜 logo192.png
 ┣ 📜 logo512.png
 ┣ 📜 manifest.json
 ┣ 📜 robots.txt
📂 src/
 ┣ 📂 components/           # UI components
 ┣ 📂 pages/                # Full-page components
 ┣ 📂 services/             # API interactions
 ┃ ┣ 📜 api.js
 ┣ 📜 App.js                # Main app component
 ┣ 📜 index.js              # Entry point
 ┣ 📜 App.css               # Global styles
 ┣ 📜 index.css
 ┣ 📜 logo.svg
 ┣ 📜 reportWebVitals.js
 ┣ 📜 setupTests.js
```
1. **Navigate to the frontend folder:**
   ```sh
   cd sportschat-frontend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Start the React app:**
   ```sh
   npm start
   ```
   - The frontend runs on **http://localhost:3000**.

---

## **Frontend Navigation & Components**
### **React Router Setup**
To enable page navigation, install React Router:
```sh
npm install react-router-dom
```

**`App.js` to handle navigation between pages:**
```jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### **Reusable UI Components**

📂 `sportschat-frontend/src/components/Navbar.js`
```jsx
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/login">Login</Link>
      <Link to="/chat">Chat</Link>
    </nav>
  );
}

export default Navbar;
```

📂 `sportschat-frontend/src/components/Button.js`
```jsx
function Button({ text, onClick }) {
  return <button onClick={onClick}>{text}</button>;
}

export default Button;
```

---

## **Branching & Collaboration**
### **1️⃣ Create a New Branch for Each Feature**
To prevent conflicts, every feature should be developed in its own branch before merging into `main`:
```sh
git checkout -b feature-branch-name
```

### **2️⃣ Commit Your Changes Regularly**
```sh
git add .
git commit -m "Added feature: [describe the change]"
```

### **3️⃣ Push Your Branch to GitHub**
```sh
git push origin feature-branch-name
```

### **4️⃣ Open a Pull Request (PR)**
- Go to the **GitHub repository**.
- Navigate to the **Pull Requests** tab.
- Click **New Pull Request**.
- Select your branch and request a merge into `main`.

🚨 **Pull requests must be reviewed before merging to ensure code quality and prevent breaking the main branch.**

---

## **Next Steps**
Each developer should:
1. Set up their environment using the steps above.
2. Work on their assigned feature using the appropriate template.
3. Follow the branching workflow to push changes and submit pull requests.
4. Review the documentation in the `documents/` folder as needed.

---
