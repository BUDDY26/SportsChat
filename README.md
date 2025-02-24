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

## **Branching & Collaboration**
### **1️⃣ Create a New Branch for Each Feature**
To prevent conflicts, every feature should be developed in its own branch before merging into `main`:

```sh
git checkout -b feature-branch-name
```
Example:
```sh
git checkout -b login-api
```

### **2️⃣ Commit Your Changes Regularly**
After making updates, commit your changes:

```sh
git add .
git commit -m "Added feature: [describe the change]"
```
Example:
```sh
git commit -m "Added login endpoint with bcrypt authentication"
```

### **3️⃣ Push Your Branch to GitHub**
Once the feature is complete, push it to GitHub:

```sh
git push origin feature-branch-name
```
Example:
```sh
git push origin login-api
```

### **4️⃣ Open a Pull Request (PR)**
- Go to the **GitHub repository**.
- Navigate to the **Pull Requests** tab.
- Click **New Pull Request**.
- Select your branch and request a merge into `main`.

🚨 **Pull requests must be reviewed before merging to ensure code quality and prevent breaking the main branch.**

---

## **Branch Protection Rules**
🛠 **Direct commits to `main` are restricted** to maintain stability. Instead:
- All contributions must be made via pull requests.
- Pull requests require at least **one approval** before merging.
- Any conflicts must be resolved before merging.
- Automated tests (if set up) must pass before merging.

---

## **Contributing Guidelines**
- Follow the **API-UI-FRONTEND-BACKEND_GUIDELINES.docx** for a standardized approach.
- Use the corresponding template file when adding new features.
- Keep commits small and descriptive.
- Always create a **pull request** for review before merging.

---

## **Error Handling & Logging**
For consistency, error handling should follow a structured approach:
1. Use `try/catch` blocks to handle errors in API routes.
2. Log errors for debugging purposes.
3. Ensure meaningful error messages are returned to the frontend.

### **CORS Setup**
Cross-Origin Resource Sharing (CORS) allows the frontend to communicate with the backend. It should be enabled in `server.js`:

```js
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true
}));
```

---

## **Next Steps**
Each developer should:
1. Set up their environment using the steps above.
2. Work on their assigned feature using the appropriate template.
3. Follow the branching workflow to push changes and submit pull requests.
4. Review the documentation in the `documents/` folder as needed.

---
 

