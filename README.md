# MiniSocial 🚀

MiniSocial is a **minimal social media web application** built as an educational project.  
It demonstrates core concepts of **modern web development**, including authentication, CRUD operations, drafts, user profiles, and trending content — all wrapped in a clean **Apple-style dark UI**.

---

## ✨ Features

### 🔐 Authentication
- User registration and login (JWT-based)
- Secure password hashing with bcrypt
- Persistent sessions using localStorage

### 📰 Feed
- Public feed with published posts
- Like / Unlike posts
- Comment system with real-time updates

### ✍️ Create Posts
- Create and publish posts
- Add tags to posts
- Save posts as **Drafts**

### 🗂 Drafts
- Private drafts (visible only to the author)
- Publish drafts later
- Delete drafts

### 👤 My Posts
- View all your posts (published + drafts)
- Status badge (`published / draft`)

### 🙍 User Profile
- View profile information
- Update bio
- Update avatar using image URL

### 🔍 Explore / Trending
- Explore trending posts
- Filter by:
  - Time period (7 / 30 / 90 days)
  - Tags
  - Search (title + content)
- Sorted by popularity (likes & comments)

### 🎨 UI / Design
- Minimal **Apple-inspired dark design**
- Blue accent buttons (iOS style)
- Responsive layout (desktop & mobile)
- Clean, readable typography

---

## 🛠 Tech Stack

### Frontend
- HTML5
- CSS3 (custom, Apple-style dark theme)
- Vanilla JavaScript (no frameworks)

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (authentication)
- bcrypt (password hashing)

---

## 📁 Project Structure

MiniSocial/
├── client/
│ ├── index.html
│ ├── styles.css
│ └── app.js
│
├── server/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ └── index.js
│
└── README.md


---

## ⚙️ Setup & Run

### 1️⃣ Clone repository
```bash
git clone https://github.com/your-username/minisocial.git
cd minisocial

2️⃣ Install dependencies
cd server
npm install

3️⃣ Environment variables (.env)
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

4️⃣ Run server
npm run dev

5️⃣ Open client

Open client/index.html in your browser
(or serve it via Live Server)

🎓 Educational Purpose

This project was created for learning and academic purposes to demonstrate:

REST API design

Authentication & authorization

NoSQL database usage

Frontend-backend integration

UI/UX fundamentals

🚧 Future Improvements

Pagination & infinite scroll

Image upload instead of URL

Follow system

Notifications

Deployment (Docker / Vercel / Render)
