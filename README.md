# Project Collaboration Tool

This project is a full-stack application designed to facilitate team collaboration on projects, featuring AI-powered project task generation and comprehensive user, team, project, and task management.

## Table of Contents

- [Project Collaboration Tool](#project-collaboration-tool)
  - [Table of Contents](#table-of-contents)
  - [Description](#description)
  - [Features](#features)
    - [User Authentication](#user-authentication)
    - [Team Management](#team-management)
    - [Project Management](#project-management)
    - [Task Management](#task-management)
  - [Technologies Used](#technologies-used)
  - [Setup Instructions](#setup-instructions)
    - [Prerequisites](#prerequisites)
    - [Backend Setup (Server)](#backend-setup-server)
    - [Frontend Setup (Client)](#frontend-setup-client)
  - [Usage Notes / Important Information](#usage-notes--important-information)
  - [Folder Structure Overview](#folder-structure-overview)

## Description

This application provides a platform for users to manage projects, form teams, and organize tasks efficiently. It leverages AI to assist in breaking down project goals into actionable tasks, streamlining the initial planning phase. Secure user authentication, robust team management, and detailed project and task tracking are core to its functionality.

## Features

### User Authentication

Manages user registration, login, and session management.

-   **Register (`/register`)**:
    -   **Fields**: Name, Email, Password, Confirm Password.
    -   **"Register" Button**: Submits the provided details to create a new user account. Upon successful registration, the user is automatically logged in and redirected.
    -   **"Have an Account? Login" Link**: Navigates to the login screen for existing users.
-   **Login (`/login`)**:
    -   **Fields**: Email, Password.
    -   **"Sign In" Button**: Authenticates the user with the provided credentials. On successful login, the user's session is established, and they are redirected to the application dashboard.
    -   **"New Customer? Register" Link**: Navigates to the registration screen for new users.
-   **Logout (Navigation Bar)**:
    -   **"Logout" Dropdown Item**: Clears the user's session information from local storage and Redux state, effectively logging them out and redirecting to the login page.

### Team Management

Allows users to create, join, and manage teams, including approval workflows for join requests.

-   **View Teams (`/teams`)**: Displays a table of all teams the logged-in user is either an owner or a member of.
    -   **Table Columns**: Team ID, Team Name, Owner's Name, List of Members, List of Pending Join Requests.
    -   **"Create Team" Button (Header)**: Opens a modal form to create a new team.
        -   **Modal Field**: Team Name.
        -   **Modal "Create" Button**: Submits the team name. The current user becomes the owner and a default member of the new team.
    -   **"Join Team" Button (Header)**: Opens a modal form to send a request to join an existing team.
        -   **Modal Field**: Team ID.
        -   **Modal "Join" Button**: Sends a join request to the specified team. The request will appear in the "Pending Requests" column of the target team for its owner to review.
    -   **"Edit" Button (Pencil Icon, Table Row)**: (Functionality for editing team details not explicitly detailed but typically allows modification of team name or other properties).
    -   **"Delete" Button (Trash Icon, Table Row)**: *Visible only to the team owner.* Deletes the team after a confirmation prompt. This also removes the team from all members' user profiles and deletes associated tasks.
    -   **Join Request Management (Table Row, for Team Owners)**:
        -   **"Approve" Button (Checkmark Icon)**: *Visible only to the team owner.* Approves a user's pending join request, adding them to the team.
        -   **"Reject" Button (Times Icon)**: *Visible only to the team owner.* Rejects a user's pending join request.

### Project Management

Enables creation of projects, with AI assistance for task generation, and viewing/managing existing projects.

-   **Create Project with AI (`/create-project`)**: Allows users to define a new project and use AI to generate an initial task roadmap.
    -   **Fields**:
        -   **Project Name**: Select an existing task name or enter a new one.
        -   **Project Goal**: Select an existing task description or provide a detailed goal for the AI.
        -   **Due Date**: Specify the target completion date for the project.
        -   **Assign Team (Optional)**: Assign the project to an existing team.
    -   **"Generate Project" Button**: Submits the project details. The AI (via Groq API) processes the "Project Goal" to generate a list of tasks, durations, and dependencies, which are then used to create the project and its initial tasks.
-   **View Ongoing Projects (`/ongoing-projects`)**: Displays a list of all projects where the logged-in user is either the owner or a member of the assigned team.
    -   **Project Card**: Each card provides a summary of a project, including:
        -   Project Name
        -   Project Goal
        -   Due Date
        -   Assigned Team (if any)
        -   Project Owner
        -   Number of Tasks
    -   **"View Project" Link (on Project Card)**: Navigates to the detailed view of the specific project.
    -   **"Delete" Button (Trash Icon, on Project Card)**: *Visible only to the project owner.* Deletes the project and all its associated tasks after a confirmation prompt.
-   **View Project Details (`/project/:id`)**: Provides a comprehensive view of a specific project.
    -   Displays project overview, details of associated tasks, and potentially options to add new tasks or edit project information (functionality to be confirmed/implemented).

### Task Management

Facilitates the creation, viewing, updating, and deletion of individual tasks.

-   **View Tasks (`/tasks` or within a Project Detail screen)**: Displays a list of tasks relevant to the user or project.
    -   **Table Columns**: Task Name, Description, Status, Due Date, Assigned To.
    -   **"Edit" Button (Pencil Icon, Table Row)**: Navigates to the task editing screen.
    -   **"Delete" Button (Trash Icon, Table Row)**: Deletes the task after a confirmation prompt.
-   **Create Task**: While not explicitly a dedicated screen, tasks are created as part of the "Generate Project" AI feature, or can typically be added manually within a project's detail view.
    -   **Fields (expected for manual creation)**: Task Name, Description, Due Date, Assignee, Status, Associated Project.
-   **Update Task (`/tasks/:id/edit`)**: Allows modification of an existing task's details.
    -   **Fields**: Task Name, Description, Due Date, Assignee, Status.
    -   **"Update Task" Button**: Saves the changes made to the task.

## Technologies Used

### Frontend (Client)

-   **React**: A JavaScript library for building user interfaces.
-   **Redux**: A predictable state container for JavaScript apps.
-   **React Router DOM**: For declarative routing in React applications.
-   **Axios**: Promise-based HTTP client for the browser and Node.js.
-   **Bootstrap & React-Bootstrap**: For responsive and mobile-first frontend component styling.
-   **Vite**: A fast build tool for modern web projects.

### Backend (Server)

-   **Node.js**: JavaScript runtime environment.
-   **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
-   **Mongoose**: MongoDB object data modeling (ODM) for Node.js.
-   **JSON Web Tokens (JWT)**: For secure authentication and authorization.
-   **Bcryptjs**: For hashing passwords securely.
-   **Dotenv**: To load environment variables from a `.env` file.
-   **Groq SDK**: For integrating AI capabilities, specifically for task generation.

### Database

-   **MongoDB**: A NoSQL document database.

## Setup Instructions

### Prerequisites

-   Node.js (LTS version recommended)
-   MongoDB instance (local or cloud-based, e.g., MongoDB Atlas)
-   A Groq API Key (for AI-powered project creation)

### Backend Setup (Server)

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server` directory with the following variables:
    ```env
    NODE_ENV=development
    PORT=3002
    MONGO_URI=<Your MongoDB Connection String>
    JWT_SECRET=<A strong, random secret key for JWT>
    GROQ_API_KEY=<Your Groq API Key>
    ```
    *   Replace `<Your MongoDB Connection String>` with your MongoDB URI (e.g., from MongoDB Atlas).
    *   Replace `<A strong, random secret key for JWT>` with a unique, secure string. You can generate one using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
    *   Replace `<Your Groq API Key>` with your API key obtained from Groq for AI services.
4.  Start the server:
    ```bash
    npm start
    ```
    The server should start on `http://localhost:3002`.

### Frontend Setup (Client)

1.  Navigate to the `client` directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the client development server:
    ```bash
    npm run dev
    ```
    The client application should be accessible via your browser, typically at `http://localhost:5173`.

## Usage Notes / Important Information

-   **JWT Token Staleness**: When a user's team memberships or permissions change (e.g., joining a new team, being approved for a team), their active JSON Web Token (JWT) on the client-side might not immediately reflect these changes. To ensure the application correctly recognizes updated roles or team affiliations, **users must log out and log back in** after any such changes. This will procure a new, updated JWT.
-   **401 Unauthorized Errors**: If you encounter 401 errors, ensure you are logged in and your session is active. If issues persist after logging in, try clearing your browser's local storage and logging in again to refresh your authentication token.
-   **AI Task Generation**: The "Create Project with AI" feature relies on the Groq API. Ensure your `GROQ_API_KEY` is correctly configured in the server's `.env` file.
-   **Error Handling**: The application includes client-side and server-side error handling, displaying messages for invalid inputs, authentication failures, and API issues.

## Folder Structure Overview

-   `client/`: Contains the React frontend application.
    -   `src/`: Main source code.
        -   `actions/`: Redux actions for API calls.
        -   `components/`: Reusable React components.
        -   `constants/`: Redux action types and other constants.
        -   `reducers/`: Redux reducers to manage state.
        -   `screens/`: Top-level React components representing different views/pages.
    -   `public/`: Static assets.
-   `server/`: Contains the Node.js/Express.js backend application.
    -   `config/`: Database connection setup.
    -   `controllers/`: Logic for handling API requests.
    -   `middleware/`: Express middleware (e.g., authentication, error handling).
    -   `models/`: Mongoose schemas for MongoDB collections.
    -   `routes/`: API route definitions.
    -   `utils/`: Utility functions (e.g., JWT token generation).
-   `mobile/`: (Present in the repository, but not detailed in this README; likely a Flutter or similar mobile application).
-   `.env`: (Located in `server/`) Environment variables for backend configuration (ignored by Git).
-   `.gitignore`: Specifies intentionally untracked files to ignore.
-   `GEMINI.md`: Notes related to project interactions with Gemini.