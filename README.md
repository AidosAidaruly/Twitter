# MiniSocial – Social Media Platform

## Overview

MiniSocial is a full-stack social media web application inspired by modern social networking platforms. The project allows users to create and manage posts, interact through likes and comments, save private drafts, customize profiles, and discover trending content.

The application demonstrates practical implementation of authentication, authorization, database management, RESTful API development, and frontend-backend integration using modern web technologies.

## Key Features

### Authentication & Security

* User registration and login
* JWT-based authentication
* Password hashing using bcrypt
* Protected API routes
* Persistent user sessions

### Content Management

* Create posts
* Edit posts
* Delete posts
* Publish content
* Draft management system

### Social Interaction

* Like and unlike posts
* Comment system
* Public content feed
* User-generated content

### User Profiles

* Custom user biography
* Avatar customization
* Personal post management
* User account information

### Explore & Trending

* Trending post discovery
* Search functionality
* Tag filtering
* Popularity ranking
* Time-based filtering

### User Experience

* Responsive design
* Apple-inspired dark theme
* Mobile-friendly interface
* Clean and intuitive navigation

## Technologies Used

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcrypt

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

## System Architecture

The project follows a layered architecture:

* Client Layer (Frontend)
* API Layer (Express.js)
* Business Logic Layer
* Database Layer (MongoDB)

This architecture improves maintainability, scalability, and separation of concerns.

## Project Structure

```text
MiniSocial/
├── client/
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── index.js
│
└── README.md
```

## Core Functionality

### Authentication Module

Handles:

* Registration
* Login
* JWT token generation
* User authorization

### Posts Module

Supports:

* Creating posts
* Editing posts
* Deleting posts
* Publishing content
* Draft management

### Social Module

Supports:

* Likes
* Comments
* User interactions
* Content engagement

### Trending Module

Provides:

* Popularity-based ranking
* Search functionality
* Tag filtering
* Time-period analysis

## Learning Outcomes

Through this project, I gained practical experience in:

* Full-stack web development
* REST API design
* Authentication and authorization
* JWT implementation
* Password security using bcrypt
* MongoDB database design
* Mongoose ODM
* User session management
* Search and filtering systems
* Software architecture design
* Frontend-backend integration

## My Contribution

I independently implemented:

* Backend architecture
* MongoDB database integration
* JWT authentication system
* Password hashing and security
* CRUD functionality
* Draft management system
* Comment and like functionality
* Trending and search features
* User profile management
* Frontend user interface
* Error handling and validation

## Future Improvements

* Follow and follower system
* Real-time notifications
* Image upload support
* Direct messaging
* WebSocket integration
* Infinite scrolling
* Content recommendation system
* Docker deployment
* Cloud hosting
* Mobile application version



## License

This project was developed for educational purposes.
