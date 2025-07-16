# 🎓 Backend_DICE – Distributed Infrastructure for Campus Engagement

**Backend_DICE** is the backend system for **DICE (Distributed Infrastructure for Campus Engagement)** — a modular and scalable communication platform built for real-time and asynchronous collaboration across academic institutions.

The platform enables role-based messaging, social post sharing, and notification broadcasting for students, faculty, and administrative users. It is developed using modern web technologies like **Node.js, Express, Sequelize, MongoDB, and WebSocket**, with frontend interaction via **React**.

---

## 🚀 Features

- 🔐 **User Authentication** – JWT-based auth with email verification & password reset  
- 🧑‍🎓 **User Profiles** – Role-based profiles (student, faculty, admin) with avatars and bios  
- 📝 **Social Feed** – Create posts, comments, likes, bookmarks, and tag-based filtering  
- 💬 **Group Chat** – Server-based channels with threads and real-time messaging  
- 📣 **Notifications** – Push notifications using Firebase Cloud Messaging (FCM)  
- 📂 **File Uploads** – Image and avatar uploads via Multer  
- 🛡️ **Moderation Tools** – Report users, ban management, and status control  
- ⚙️ **Robust APIs** – RESTful endpoints, modular controllers, input validation  
- 📄 **Logging** – Winston and Morgan-based request and error logging  
- 🧩 **Scalable & Extensible** – Easily plug in new services or features  

---

## 🛠️ Tech Stack

| Category         | Technologies                                       |
|------------------|----------------------------------------------------|
| Backend          | Node.js, Express.js                                |
| Database         | PostgreSQL (via Sequelize), MongoDB (via Mongoose) |
| Frontend Client  | React, Axios, Socket.IO-client                     |
| Auth & Security  | JWT, bcrypt, express-validator                     |
| File Uploads     | Multer                                             |
| Realtime Comm    | WebSocket, Socket.IO                               |
| Notifications    | Firebase Cloud Messaging (FCM)                     |
| Logging          | Winston, Morgan                                    |
| Email Services   | Mailtrap, Mailgen                                  |

---

## 🧩 Architecture Overview

The architecture follows a layered microservice-friendly model:

1. **Client Interaction Layer** – Interfaces for web/mobile clients, built in React.
2. **Middleware Layer** – Handles auth, session management, routing, and WebSocket setup.
3. **Service Node Layer** – Microservices for:
   - Authentication & Session
   - Chat (real-time messaging)
   - Messaging (announcements)
   - Social Media (posts/comments)
   - Admin Panel & Notifications

---

## 🗂️ Project Structure
<pre> ```bash Backend_DICE/ ├── controllers/ ├── middlewares/ ├── models/ ├── routes/ ├── services/ ├── utils/ ├── config/ ├── uploads/ ├── socket/ ├── app.js ├── server.js ├── .env └── README.md ``` </pre>


---

## ⚡ Getting Started

### 🔄 Clone the Repository

--> bash
 git clone https://github.com/sni-gdh/Backend_DICE.git
 cd Backend_DICE

---

### 📦 Install Dependencies
 npm install

### 🔐 Configure Environment Variables
 Create a .env file with the following:
 PORT=8000
 ACCESS_TOKEN_SECRET=your_jwt_secret
 REFRESH_TOKEN_SECRET=your_refresh_secret
 ACCESS_TOKEN_EXPIRY=1d
 REFRESH_TOKEN_EXPIRY=7d
 POSTGRES_URI=postgres://user:pass@localhost:5432/bulletinfeed
 MONGO_URI=mongodb://localhost:27017/bulletinfeed
 MAILTRAP_SMTP_HOST=smtp.mailtrap.io
 MAILTRAP_SMTP_PORT=2525
 MAILTRAP_SMTP_USER=your_mailtrap_user 
 MAILTRAP_SMTP_PASS=your_mailtrap_pass
 FCM_SERVER_KEY=your_firebase_server_key

### ▶️ Run the Backend Server
 npm run dev

## 📚 API Documentation
 All API routes are prefixed with /api/v1/.
 Example endpoints:
 POST   /api/v1/users/register
 POST   /api/v1/users/login
 GET    /api/v1/social-media/posts
 POST   /api/v1/chat/server/create
 POST   /api/v1/chat/server/:serverId/:channelId/Participant
 Explore the routes/ and controllers/ directories for all endpoints.

---

## 🧑‍💻 Contributing
We welcome contributions! Here's how to get started:
 1. Fork the repository

 2. Create your feature branch
 git checkout -b feature/your-feature

 3. Commit your changes
 git commit -am 'Add new feature'

 4. Push to the branch
 git push origin feature/your-feature

 5. Create a Pull Request

---

## 🙏 Acknowledgements
 Express.js
 Sequelize
 Mongoose
 Firebase Cloud Messaging
 Mailgen
 Socket.IO

---

## 📬 Contact
 For questions, feedback, or collaborations:
 📧 snigdhchamoli1@gmail.com
