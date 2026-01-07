# ToDoList – Full-Stack Note & Task Manager

A full-stack note and task management application that allows users to create, tag, filter, and manage notes securely with authentication and persistent storage.

## Features
- User authentication (register, login, session-based access)
- Create, update, delete notes
- Tag-based filtering implemented at the database query level
- Secure API with protected routes
- Persistent data storage using PostgreSQL
- Deployed backend with environment-based configuration

## Tech Stack
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Database: Supabase (PostgreSQL)
- Authentication: JWT-based auth
- Hosting: Render (backend)

## Architecture Overview
Frontend communicates with a RESTful API hosted on Render.  
The backend handles authentication, authorization, and data access.  
Supabase provides a managed PostgreSQL database for persistent storage.

## Database Schema
- users
  - id
  - email
  - password_hash
  - created_at

- todos
  - id
  - user_id (foreign key to users)
  - title
  - content
  - tags
  - due_date
  - created_at
  - updated_at

Tags are stored directly on each todo record and are used for filtering via database queries scoped to the authenticated user.

Design Tradeoff:
Tags are stored directly on todos to simplify queries and reduce schema complexity at the current scale. A normalized tag table would be preferable for large-scale or shared tag systems.


## Authentication Flow
1. User registers or logs in
2. Server issues a JWT
3. Token is stored client-side
4. Protected routes validate token on each request
5. Invalid or expired tokens return 401 and trigger logout

## Environment Configuration
Secrets and credentials are stored using environment variables and are never exposed to the client.

## Deployment
- Backend deployed on Render
- Database hosted on Supabase

## Lessons Learned
- Designing RESTful APIs
- Handling authentication and authorization
- Debugging token expiration and 401 errors
- Structuring full-stack applications
- Managing environment variables in production

## Future Improvements
- Centralized error handling UI
- Pagination for notes
- Improved UI feedback for auth errors
