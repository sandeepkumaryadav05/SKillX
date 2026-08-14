<div align="center">

# SkillX

SkillX is a production-grade, AI-powered peer-to-peer skill exchange and gig collaboration ecosystem. Designed to bridge the gap between continuous learning and practical application, it enables users to seamlessly trade skills, collaborate on technical gigs in real-time, and grow through AI-driven roadmaps and contextual workspaces.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-a08021?style=for-the-badge&logo=firebase&logoColor=ffcd34)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

---

## 📌 Problem Statement

In today's fast-paced digital ecosystem, continuous learning and collaboration are essential. However, the current landscape is fragmented. 
* **Difficult Skill Discovery**: Finding reliable peers willing to barter highly specific technical skills is challenging.
* **Disconnected Learning**: Theoretical learning is rarely coupled with practical application environments.
* **Lack of Collaborative Exchange**: Most platforms are transactional rather than collaborative, lacking built-in tools for real-time engagement.
* **Difficulty Finding Opportunities**: Entry-level professionals struggle to find flexible gigs or skill-building collaborative projects to boost their portfolios.

---

## 🎯 Solution

SkillX solves these challenges by providing a centralized, intelligent ecosystem where skill exchange is contextual, collaborative, and rewarding. By integrating an AI-driven matching algorithm, users are instantly paired with complementary peers. Beyond just matching, SkillX facilitates the entire collaboration lifecycle—from contextual chat threads and dynamic scheduling, to real-time WebRTC video sessions and shared collaborative workspaces—creating a continuous loop of learning, building, and authentic feedback.

---

## 🚀 Recent Updates

* **Enhanced UI/UX & Accessibility**: Major styling updates across the platform, including dedicated loading spinners, improved accessibility, and a highly refined interface for video sessions and chat.
* **Robust Session Management**: Improved session join logic with comprehensive error handling. Advanced timezone validation logic ensures smooth coordination for global peer-to-peer collaboration.
* **Algorithm & Dashboard Syncing**: Optimized the skill exchange matching algorithm for more accurate peer pairings, coupled with seamless real-time dashboard data synchronization.
* **Codebase Audit & Production Readiness**: Conducted a thorough audit to remove unused code, orphaned components, and obsolete endpoints.
* **Standardized Documentation**: Implemented a strict, professional commenting strategy across frontend and backend logic to improve maintainability.
* **Backend Stability**: Enhanced environment configuration and backend error reporting for improved platform stability and easier debugging.

---

## ✨ Features

### Core Features
- **User Authentication**: Secure Firebase-based end-to-end auth system.
- **Dynamic User Profiles**: Comprehensive profiles with dynamic completion tracking.
- **Skill Matching Algorithm**: Intelligent pairing based on offered and desired skills.
- **Gig Marketplace**: Post, browse, and participate in collaborative project gigs.
- **Reviews & Ratings**: Reputation building through a verifiable trust score system.

### AI Features
- **AI Learning Roadmaps**: Gemini-powered personalized learning paths based on user goals.
- **AI Gig Enhancer**: Smart description generation to improve gig visibility and clarity.
- **Smart Recommendations**: AI-driven user and gig suggestions.

### Collaboration Features
- **Contextual Chat Threads**: Dedicated, context-aware messaging for both skill exchanges and gig coordination.
- **WebRTC Video Sessions**: High-quality, real-time video conferencing for 1:1 mentorship.
- **Shared Workspace**: Integrated environment featuring resource sharing, collaborative notes, and task tracking.

### Scheduling Features
- **Smart Scheduling**: Dynamic availability slots tailored to user timezones.
- **Session Countdowns**: Real-time tracking of upcoming collaborative sessions.
- **Conflict Detection**: Prevention of double-booking across gig and exchange sessions.

### User Experience Features
- **Dashboard Analytics**: Visual tracking of activities, gigs completed, and skill growth.
- **Gamification & Badges**: Achievement system rewarding continuous collaboration.
- **Real-time Notifications**: Instant alerts for messages, requests, and session updates.
- **Accessibility & Feedback**: Dedicated loading spinners and accessible UI components ensuring a smooth and inclusive experience.

### Admin Features
- **Role-Based Access Control (RBAC)**: Secure separation between User and Admin privileges.
- **Platform Analytics**: High-level overview of platform engagement and growth metrics.
- **Moderation System**: Tools for user management and content moderation.

---

## 🏗 System Architecture

The SkillX platform leverages a scalable, event-driven architecture to handle real-time collaboration.

```text
Frontend Client (React.js)
        │
        ├── REST API
        └── WebSocket
        │
API / Middleware Layer
        │
Backend API (Node.js + Express.js)
        │
        ├── MongoDB + Mongoose
        ├── Socket.io + WebRTC
        └── Firebase / Cloudinary / Gemini AI
```

---

## 🗄 Database Schema (ER Diagram)

The database is modeled with **MongoDB + Mongoose** across 17 collections. Users are identified by `email` and Firebase UID, while relationships are represented through email/UID references or MongoDB `ObjectId` references and are enforced through application logic.

```mermaid
erDiagram
    UserProfile ||--o{ Gig : "posts"
    UserProfile ||--o{ GigApplication : "applies to"
    Gig ||--o{ GigApplication : "receives"
    UserProfile ||--o{ SkillExchange : "lists"
    SkillExchange ||--o{ ExchangeRequest : "targeted by"
    UserProfile ||--o{ ExchangeRequest : "sends / receives"
    UserProfile ||--o{ Session : "participates in"
    ChatRoom ||--o{ Session : "schedules"
    Session ||--o{ SessionAttendance : "logs"
    Session ||--o{ SessionNotes : "has"
    Session ||--o| VideoSession : "activates"
    UserProfile ||--o{ ChatRoom : "members"
    ChatRoom ||--o{ Message : "contains"
    UserProfile ||--o{ Review : "writes"
    UserProfile ||--o{ Review : "receives"
    Session ||--o{ Review : "rated in"
    UserProfile ||--o{ Notification : "receives"
    ChatRoom ||--o| Workspace : "owns"
    Workspace ||--o{ WorkspaceTask : "tracks"
    Workspace ||--o{ Resource : "stores"
    UserProfile ||--o{ Roadmap : "generates"

    UserProfile {
        string email PK "unique"
        string name
        string role "user | admin"
        string status "active | suspended"
        array permissions
        string location
        string avatar
        string bio
        array skills
        array socialLinks
        object stats
        array availability
        array customAvailability
        date createdAt
        date updatedAt
    }
    Gig {
        ObjectId _id PK
        string title
        string category
        string type
        array skills
        string description
        number budget
        string duration
        string location
        string postedBy FK "UserProfile.email"
        date createdAt
        date updatedAt
    }
    GigApplication {
        ObjectId _id PK
        ObjectId gigId FK "Gig._id"
        string gigTitle
        string gigOwnerEmail FK "UserProfile.email"
        string applicantEmail FK "UserProfile.email"
        string message
        string status "pending | accepted | rejected"
        date createdAt
        date updatedAt
    }
    SkillExchange {
        ObjectId _id PK
        string name
        string email
        string userId FK "UserProfile"
        string skillOffered
        string skillWanted
        string location
        number matchScore
        date createdAt
        date updatedAt
    }
    ExchangeRequest {
        ObjectId _id PK
        string fromUserId FK "UserProfile"
        string toUserId FK "UserProfile"
        string exchangeId FK "SkillExchange._id"
        string fromEmail FK "UserProfile.email"
        string toEmail FK "UserProfile.email"
        string message
        string status "pending | accepted | rejected"
        string chatRoomId FK "ChatRoom._id"
        date createdAt
        date updatedAt
    }
    ChatRoom {
        ObjectId _id PK
        array participants FK "UserProfile.email"
        string referenceId "Gig / ExchangeRequest id"
        string referenceType "gig | exchange"
        string title
        date lastMessageAt
        map unreadCounts
        date createdAt
        date updatedAt
    }
    Message {
        ObjectId _id PK
        ObjectId chatRoomId FK "ChatRoom._id"
        string senderEmail FK "UserProfile.email"
        string text
        boolean readStatus
        date createdAt
        date updatedAt
    }
    Session {
        ObjectId _id PK
        string roomId
        array participants FK "UserProfile.email"
        ObjectId chatRoomId FK "ChatRoom._id"
        string requestedBy FK "UserProfile.email"
        string date
        string time
        string startTime
        string endTime
        string duration "30/60/90/120 mins"
        string mode "Remote | Video | In Person | Chat"
        string notes
        string status "Pending | Accepted | Scheduled | Completed | Cancelled ..."
        boolean matchesAvailability
        boolean conflictDetected
        array reviewedBy FK "UserProfile.email"
        object exchangeRoles
        date createdAt
        date updatedAt
    }
    SessionAttendance {
        ObjectId _id PK
        ObjectId sessionId FK "Session._id"
        string userEmail FK "UserProfile.email"
        date joinedAt
        date leftAt
        number durationMinutes
        date createdAt
        date updatedAt
    }
    SessionNotes {
        ObjectId _id PK
        ObjectId sessionId FK "Session._id"
        string userEmail FK "UserProfile.email"
        string content
        date updatedAt
        date createdAt
    }
    VideoSession {
        ObjectId _id PK
        ObjectId sessionId FK "Session._id" "unique"
        string roomId "unique"
        array participants
        string status "waiting | active | ended"
        date startedAt
        date endedAt
        number durationMinutes
        date createdAt
        date updatedAt
    }
    Review {
        ObjectId _id PK
        string reviewerEmail FK "UserProfile.email"
        string reviewedUserEmail FK "UserProfile.email"
        ObjectId sessionId FK "Session._id"
        number rating "1-5"
        string feedback
        date createdAt
        date updatedAt
    }
    Notification {
        ObjectId _id PK
        string userId FK "UserProfile.email"
        string type "MESSAGE | REQUEST | SESSION | REVIEW | GIG | SYSTEM | ADMIN"
        string message
        string referenceId
        boolean isRead
        boolean isArchived
        date createdAt
        date updatedAt
    }
    Workspace {
        ObjectId _id PK
        ObjectId chatRoomId FK "ChatRoom._id" "unique"
        ObjectId sessionId FK "Session._id"
        array participants FK "UserProfile.email"
        string notes
        date createdAt
        date updatedAt
    }
    WorkspaceTask {
        ObjectId _id PK
        ObjectId workspaceId FK "Workspace._id"
        string createdBy FK "UserProfile.email"
        string title
        string description
        string assignedTo FK "UserProfile.email"
        string status "Pending | In Progress | Completed"
        string dueDate
        date createdAt
        date updatedAt
    }
    Resource {
        ObjectId _id PK
        ObjectId workspaceId FK "Workspace._id"
        string uploadedBy FK "UserProfile.email"
        string resourceType "PDF | VIDEO | LINK | IMAGE | ZIP | DOCUMENT | CODE | OTHER"
        string title
        string url
        number fileSize
        string publicId "Cloudinary"
        date createdAt
        date updatedAt
    }
    Roadmap {
        ObjectId _id PK
        string userEmail FK "UserProfile.email"
        string goal
        object generatedRoadmap
        boolean isSaved
        number progress
        array completedWeeks
        number totalWeeks
        string status "Active | Completed | Paused"
        date createdAt
        date updatedAt
    }
```

**Notes:**
- `Gig.postedBy`, `ExchangeRequest.from/to*`, `Message.senderEmail`, `Notification.userId`, etc. store email/UID **strings** (no enforced FK) — matching is done in application code.
- `ChatRoom.referenceId` is a polymorphic reference to a `Gig` or `ExchangeRequest` depending on `referenceType`.
- `Workspace` → `ChatRoom` and `VideoSession` → `Session` are enforced **1:1** via unique indexes.
- Compound unique indexes enforce: one attendance record per session/user, one notes document per session/user, and one review per session/reviewer.

---

## 📂 Project Structure

```text
SkillX/
├── frontend/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page-level components & routing views
│   ├── hooks/           # Custom React hooks (e.g., useSocket)
│   └── services/        # API client integrations
└── backend/
    ├── controllers/     # Request handlers and business logic
    ├── models/          # Mongoose schemas and database models
    ├── routes/          # Express route definitions
    ├── middleware/      # Auth, validation, and error handling
    ├── services/        # External integrations (AI, Cloudinary)
    ├── socket/          # Socket.io event handlers and WebRTC signaling
    └── config/          # Environment and database configurations
```

---

## 🔄 Complete User Workflow

```text
[ User Registration ] ➔ [ Profile Creation & Skill Selection ]
                                      ↓
                         [ Smart Matching Algorithm ]
                                      ↓
                     [ Skill Exchange & Gig Requests ]
                                      ↓
                   [ Context-Aware Chat & Negotiation ]
                                      ↓
                     [ Smart Scheduling & Calendaring ]
                                      ↓
                     [ WebRTC Video & Shared Workspace ]
                                      ↓
                       [ Reviews, Ratings & Badges ]
```

---

## 🧠 Major Technical Implementations

### Skill Matching Algorithm
Implemented a weighted intersection algorithm that evaluates the overlap between a user's `skillsWanted` and other users' `skillsOffered`. The algorithm calculates a percentage-based match score in real-time, boosting profiles that have high trust scores and recent activity.

### Context-based Chat System
Engineered a scalable chat infrastructure where every conversation carries a context payload (`type: 'GIG' | 'EXCHANGE'`). This ensures that users jumping between different gigs and skill barters maintain strict separation of concerns, complete with contextual UI headers and linked references to the original request.

### Smart Scheduling System
Developed a robust scheduling engine that handles weekly availability matrixes and custom date overrides. The system includes backend conflict detection logic to ensure overlapping sessions are impossible, converting all local times to UTC for database storage and translating them back to local browser time seamlessly. Recent updates have further refactored session time validation to gracefully accommodate complex timezone discrepancies, relying on robust frontend enforcement and improved backend error logging.

### WebRTC Session System
Built a custom signaling server using Socket.io to facilitate peer-to-peer WebRTC connections. The implementation handles complex state changes including ICE candidate exchange, SDP offer/answer negotiations, and media stream tracking for robust 1:1 video collaboration without third-party API dependencies. The UI for video and chat within these sessions has been significantly revamped for a more immersive and intuitive collaborative experience.

### AI Roadmap Generator
Integrated the Google Gemini API to parse a user's current tech stack and desired career goals. The prompt engineering pipeline formats the AI's response into structured JSON, which the frontend renders as an interactive, step-by-step learning roadmap tree.

### RBAC System
Secured the platform using JWT-based Role-Based Access Control. Middleware layers actively inspect token payloads for `role` claims, ensuring that administrative endpoints (like user suspension or global analytics) immediately reject unauthorized access with `403 Forbidden` responses.

---

## 🛠 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React.js** | Dynamic UI construction and component state management. |
| **Tailwind CSS** | Utility-first styling for a highly responsive, modern interface. |
| **Node.js & Express.js** | High-performance backend runtime and API routing. |
| **MongoDB & Mongoose** | Flexible NoSQL database and schema modeling. |
| **Socket.io** | Low-latency, bidirectional event communication for chat/notifications. |
| **WebRTC** | Peer-to-peer, real-time video and audio streaming. |
| **Firebase Auth** | Robust social and email/password authentication. |
| **Gemini AI API** | Large Language Model integration for AI roadmaps and gig enhancement. |
| **Cloudinary** | Cloud-native media storage for profile pictures and workspace assets. |

---

## 📸 Screenshots

> Add your actual screenshots to `frontend/assets/` using the filenames below.

### Dashboard
![Dashboard](./frontend/assets/dashboard.png)

### Profile & Learning Roadmaps
![Profile & Learning Roadmaps](./frontend/assets/profile.png)

### Skill Exchange Ecosystem
![Skill Exchange](./frontend/assets/skill-exchange.png)

### Contextual Chat
![Contextual Chat](./frontend/assets/chat.png)

### Collaborative Workspace & Video Session
![Collaborative Workspace & Video Session](./frontend/assets/workspace.png)


---

## 🔌 API Overview

### Authentication APIs
* `POST /api/auth/register` - Create new user account
* `POST /api/auth/login` - Authenticate and retrieve JWT

### Profile APIs
* `GET /api/profile/:email` - Fetch detailed user profile
* `PUT /api/profile` - Update user information and availability

### Skill Exchange APIs
* `GET /api/skill-exchange/recommendations` - Get AI-driven match suggestions
* `POST /api/exchange-requests` - Send a skill exchange request

### Chat APIs
* `POST /api/chat/create` - Initialize a context-based chat room
* `GET /api/chat/:roomId/messages` - Retrieve message history

### Session APIs
* `POST /api/sessions/schedule` - Book a new collaboration session
* `PUT /api/sessions/:id/status` - Update session status (Complete/Cancel)

### Review APIs
* `POST /api/reviews` - Submit a rating and feedback for a peer

### Admin APIs
* `GET /api/admin/analytics` - Fetch platform-wide statistics (Protected)

---

## ⚙ Installation & Setup

### Prerequisites
* Node.js (v16+)
* MongoDB instance (Local or Atlas)
* API Keys (Firebase, Gemini, Cloudinary)

### 1. Clone the Repository
```bash
git clone https://github.com/sandeepkumaryadav05/skillx.git
cd skillx
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

The platform will now be running on `http://localhost:5173` (Frontend) and `http://localhost:5000` (Backend).

---

## 🌐 Environment Variables

Create a `.env` file in the `backend` directory. Never commit this file to GitHub:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/skillx

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret

GEMINI_API_KEY=your_google_gemini_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

PORT=5000
```

Create a `.env` file in the `frontend` directory. Never commit this file to GitHub:

```env
VITE_API_URL=http://localhost:5000
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_storage_bucket
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id
```


---

## 🔒 Environment File Safety

Add these files to `.gitignore`:

```gitignore
backend/.env
frontend/.env
.env
```

Never commit Firebase Admin `private_key`, service-account JSON files, MongoDB passwords, Cloudinary secrets, or Gemini API keys to the repository.

## 🔐 Security Features

* **Firebase Auth**: Secure Firebase ID tokens with robust backend verification using `firebase-admin`.
* **Protected Routes**: Frontend routing guards to block unauthenticated views.
* **Role-based Access Control**: Hardened backend endpoints strictly verifying Admin/User payloads.
* **Permission Handling**: Users can only modify their own profiles and delete their own gigs.
* **Input Validation**: Sanitization of incoming request bodies to prevent NoSQL injection.
* **Secure API Access**: CORS policies restricted to trusted frontend origins.

---

## 📈 Performance Optimizations

* **Pagination**: Implemented on Gig lists and Notification history to reduce initial load payloads.
* **Memoization**: React `useMemo` and `useCallback` employed heavily in real-time WebRTC and Socket components to prevent unnecessary re-renders.
* **Lazy Loading**: Code splitting via dynamic imports for heavier routes (e.g., Video Session rooms).
* **Debouncing**: Search inputs and complex form fields utilize debouncing to minimize backend query overload.
* **Socket Optimization**: Event listeners are strictly attached and cleaned up in `useEffect` lifecycle methods to prevent memory leaks.
* **MongoDB Indexing**: Compound indexes applied to `skillsOffered`, `skillsWanted`, and `email` fields to ensure sub-millisecond query execution.
* **Enhanced Client-Side Rendering**: Added loading states across the application and optimized dashboard syncing for smoother data transitions.

---

## 🚧 Future Scope

* **Mobile Application**: Porting the core matching and chat experience to React Native for iOS/Android.
* **Push Notifications**: Integrating Firebase Cloud Messaging (FCM) for offline browser and mobile alerts.
* **Workspace Extensions**: Integrating live code editors (like Monaco) directly into the shared workspace.
* **AI Enhancements**: Expanding Gemini integration for automated code reviews and live interview question generation during WebRTC sessions.

---

## 👨‍💻 Author

**Sandeep Kumar Yadav**  

* **GitHub**: [github.com/sandeepkumaryadav05](https://github.com/sandeepkumaryadav05)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/sandeepkumaryadav05/skillx/issues). If you're looking to contribute:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⭐ Support

If you found this project helpful, please give it a ⭐ on GitHub! It helps the repository grow and reach more developers looking for collaborative ecosystems.

<div align="center">
  <sub>Built with ❤️ for the Developer Community</sub>
</div>
