# 🏨 Smart Hostel Management System

A modern, full-stack (MERN) web application integrated with **Firebase Authentication** and styled with **Tailwind CSS**. Designed to automate, streamline, and simplify hostel management operations for students and administration.

---

## 🚀 Key Features

*   **🔒 Secure Authentication:**
    *   Secure register and login with Email & Password.
    *   Seamless single-click login with **Google Sign-In** via Firebase Auth.
*   **💻 Comprehensive Student Dashboard:**
    *   **Overview:** At-a-glance status of room details, outstanding fees, and quick action panels.
    *   **Room & Allocation:** Track assigned block, room, bed, and view roommate information.
    *   **Fees & Payments:** Review total due, view payment history, and execute fee payments through an interactive modal.
    *   **Requests & Complaints:** File maintenance issues (Electrical, Plumbing, Housekeeping, etc.) with priority levels, tracking repair/action status in real-time.
    *   **Gate Pass & Outings:** Apply for outing gate passes by specifying departure/return times and track attendance history.
*   **🎨 Premium UI/UX Experience:**
    *   Built-in **Dark Mode** support.
    *   Fluid theme transitions with a customized sliding-pill toggle.
    *   Responsive layouts using standard sidebar navigation.
    *   Modern CSS animations (fade-in, slide-up, pill-swiping).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React (v19), Vite, Tailwind CSS (v4), HTML5/CSS3 |
| **Backend** | Node.js, Express.js |
| **Database & Auth** | MongoDB (via Mongoose), Firebase Client SDK |
| **Utilities & Security** | JWT, bcryptjs, CORS, Dotenv |

---

## 📁 Repository Structure

```text
Hostel-Management-System/
├── backend/                  # Express server code
│   ├── data/                 # Local database backup files
│   ├── middleware/           # Auth and validation middlewares
│   ├── routes/               # API endpoints (e.g. auth routes)
│   ├── app.js                # Express app configuration
│   ├── db.js                 # MongoDB connection logic
│   ├── server.js             # Server startup entry point
│   ├── .env                  # Backend environment variables
│   └── package.json          # Node dependencies and scripts
│
└── frontend/                 # Client React code
    ├── public/               # Static public assets
    ├── src/                  # React source components
    │   ├── assets/           # Icons and images
    │   ├── components/       # Reusable UI elements (Navbar, ThemeToggle, ProtectedRoute, etc.)
    │   ├── context/          # React Context providers (Auth, Theme)
    │   ├── pages/            # Page layouts (LandingPage, Login, StudentDashboard)
    │   ├── services/         # API connection handlers
    │   ├── utils/            # Helper utilities
    │   ├── main.jsx          # Vite react entry point
    │   └── App.jsx           # Main routing and layout wrapper
    ├── .env                  # Frontend firebase configuration
    ├── vite.config.js        # Vite compiler settings
    └── package.json          # Vite frontend dependencies and scripts
```

---

## ⚙️ Installation & Setup

Follow these steps to run the application locally on your machine.

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm or yarn
*   A running MongoDB database (local or MongoDB Atlas cluster)
*   A Firebase Project configuration

---

### 1. Clone the Repository
```bash
git clone https://github.com/Rishiiii-i/Hostel-Management-System.git
cd Hostel-Management-System
```

---

### 2. Backend Setup
1. Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Create a `.env` file in the `backend/` root directory:
    ```env
    PORT=5000
    JWT_SECRET=your_jwt_secret_here
    MONGODB_URI=your_mongodb_connection_uri_here
    ```
4. Start the backend development server:
    ```bash
    npm run dev
    ```
    *The server will start running on port `5000` (or the port defined in your `.env` file).*

---

### 3. Frontend Setup
1. Open a new terminal window and navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Create a `.env` file in the `frontend/` root directory:
    ```env
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_firebase_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
    ```
4. Start the frontend development server:
    ```bash
    npm run dev
    ```
    *The client app will compile and start running, usually at `http://localhost:5173`.*

---

## 🧪 Available Scripts

### Frontend (`/frontend`)
*   `npm run dev` - Starts Vite dev server with hot reload.
*   `npm run build` - Builds production-ready static assets in `/dist`.
*   `npm run lint` - Runs `oxlint` to lint and detect issues.

### Backend (`/backend`)
*   `npm run dev` - Starts Express dev server with hot reload using `nodemon`.
*   `npm start` - Runs the node production server directly.
