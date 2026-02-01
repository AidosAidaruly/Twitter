# MiniSocial

MiniSocial is a mini social networking web application built using Node.js, Express, and MongoDB.  
The project demonstrates the use of NoSQL databases, RESTful APIs, and JWT-based authentication.

---

## 🚀 Features

- User registration and login
- JWT authentication and authorization
- Create, view, and delete posts
- Like and unlike posts
- Comment system
- Soft delete for posts and comments
- Pagination and sorting
- MongoDB references and population
- Optimized counters for likes and comments

---

## 🛠 Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt
- dotenv

### Frontend
- HTML
- CSS
- Vanilla JavaScript (fetch API)

---

## 🗄 Database Design

The application uses MongoDB with the following collections:
- Users
- Posts
- Comments

Relationships between collections are implemented using ObjectId references and populated using Mongoose.

---

## ⚙️ Installation and Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/minisocial.git

Install dependencies:

npm install


Create .env file in the server folder:

PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/minisocial
JWT_SECRET=your_secret_key


Run the server:

npm run dev
```
🔗 API Overview
Authentication

POST /api/auth/register – Register user

POST /api/auth/login – Login user

GET /api/auth/me – Get current user

Posts

POST /api/posts – Create post

GET /api/posts – Get posts feed

POST /api/posts/:id/like – Like post

DELETE /api/posts/:id/like – Unlike post

DELETE /api/posts/:id – Delete post (soft delete)

Comments

POST /api/posts/:id/comments – Add comment

GET /api/posts/:id/comments – Get comments

DELETE /api/comments/:id – Delete comment

📈 Optimization Techniques

MongoDB indexes on frequently queried fields

Soft delete instead of hard delete

Counters for likes and comments instead of aggregation pipeline
Pagination using skip and limit

limit

👤 Author
Aidos
