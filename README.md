# SportsChat+

Sports Chat+ is a database-driven web platform for NCAA tournament discussions, statistics, and user engagement.

---

## **Project Structure**
This repository contains both frontend and backend code, as well as templates and documentation for the development team.

### **Folders & Their Purpose**
- **documents/** → Contains important project documentation for UI, API, and backend/frontend development.
- **sportschat-backend/** → Holds the backend code (server-side logic, database interactions, and API routes).
- **sportschat-frontend/** → Holds the frontend code (React components, styles, and services for interacting with the backend).
- **templates/** → Contains predefined module templates for backend and frontend components.

---

## **Technology Stack**

- **Frontend**: React.js, React Router
- **Backend**: Node.js, Express
- **Database**: Azure SQL
- **Authentication**: Express-session, bcrypt

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
| `backend-templates/server-template.js` | Express server setup | Backend (`sportschat-backend/`) |
| `backend-templates/route-template.js` | API endpoint structure | Backend (`sportschat-backend/`) |
| `backend-templates/auth-routes-template.js` | Authentication endpoints | Backend (`sportschat-backend/`) |
| `frontend-templates/page-template.js` | React page components | Frontend (`sportschat-frontend/src/pages/`) |
| `frontend-templates/form-component-template.js` | User input forms | Frontend (`sportschat-frontend/src/components/`) |
| `frontend-templates/data-display-template.js` | Data presentation | Frontend (`sportschat-frontend/src/components/`) |

### **How to Apply a Template**
1. Choose the appropriate template based on what you're building
2. Copy the template file to the correct location
3. Rename it according to your feature (e.g., `TeamsPage.js`, `teamRoutes.js`)
4. Modify the template code to implement your specific feature

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
3. **Create a `.env` file with the following configuration:**
   ```
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   DB_SERVER=your_azure_server_name.database.windows.net
   DB_NAME=your_database_name
   DB_PORT=1433
   DB_ENCRYPT=true
   PORT=5000
   ```
4. **Start the server:**
   ```sh
   npm start
   ```
   - For development with auto-reload:
   ```sh
   nodemon server.js
   ```
   - The backend runs on **http://localhost:5000**.

---

### **Frontend (React)**
📂 **sportschat-frontend/**
```
📂 public/                 # Static assets
📂 src/
 ┣ 📂 components/          # UI components
 ┣ 📂 pages/               # Full-page components
 ┃ ┣ 📜 HomePage.js
 ┃ ┣ 📜 LoginPage.js
 ┃ ┣ 📜 SignupPage.js
 ┃ ┣ 📜 ForgotPasswordPage.js
 ┃ ┣ 📜 SimplifiedDatabaseTestPage.js
 ┣ 📜 App.js               # Main app component with routes
 ┣ 📜 index.js             # Entry point
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

## **Database Configuration**

The application uses Azure SQL Database to store all data. The current database schema includes:

### **Key Tables**
- `Games`: Stores tournament game information (GameID, DatePlayed, Team1ID, Team2ID, ScoreTeam1, ScoreTeam2)
- `Teams`: Team data and statistics
- `Users`: User account information
- `ChatRooms`: Discussion rooms for games

### **Database Connection Test**
To verify your database connection, navigate to: 
```
http://localhost:3000/test-database
```

This page will display:
- Total game count
- Date range of games
- Recent games with scores

### **Frontend-Backend Communication**
The frontend uses a proxy configuration in `package.json` to route API requests to the backend:

```json
{
  "proxy": "http://localhost:5000"
}
```

This allows the React app to make relative URL requests (e.g., `/api/test-database`) that are automatically forwarded to the backend server.

---

## **Features**

- **User Authentication**
  - Signup (registration)
  - Login
  - Password reset
  
- **NCAA Tournament Data**
  - Real-time game statistics
  - Tournament bracket
  - Team information
  
- **User Interface**
  - Clean, modern design
  - Mobile-responsive layout
  - Sports-themed visual elements

---

## **Adding New Features**

To add a new feature to the application:

1. **Create the frontend component**:
   - Use the appropriate frontend template
   - Add the route to `App.js`
   - Implement the UI and data fetching

2. **Create the backend API**:
   - Use the route template for the API endpoint
   - Add the route to `server.js`
   - Implement database queries

3. **Test the feature**:
   - Make sure both frontend and backend servers are running
   - Test all functionality and edge cases

See the more detailed guides in the templates folder for step-by-step instructions.

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

## **Branch Protection Rules**
To maintain code quality and prevent breaking changes, the following rules apply:

1. **Require a pull request before merging**  
   - All changes must be reviewed via pull requests before merging into `main`.  

2. **Require approvals**  
   - At least one team member must approve a pull request before it is merged.  

3. **Dismiss stale pull request approvals when new commits are pushed**  
   - If new commits are added to a pull request, previous approvals will be dismissed, requiring another review.  

4. **Developers must frequently update their local main branch**  
   - Before starting new features, always fetch and rebase or merge the latest `main` branch to prevent conflicts.  

---

## **Next Steps**
Each developer should:
1. Set up their environment using the steps above.
2. Work on their assigned feature using the appropriate template.
3. Follow the branching workflow to push changes and submit pull requests.
4. Review the documentation in the `documents/` folder as needed.

---