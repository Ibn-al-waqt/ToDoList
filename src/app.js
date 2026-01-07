import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import cors from "cors";

import * as todosController from "./controllers/todos.js";
import * as authController from "./controllers/auth.js";

const app = express();

const pgStore = pgSession(session);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use(session({
  store: new pgStore({
    pool: supabaseClient.pool,  // supply a Postgres pool if available
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true } // secure true if using HTTPS
}));

// Auth routes
app.post("/api/register", authController.register);
app.post("/api/login", authController.login);
app.post("/api/logout", authController.logout);

// Todos routes
app.get("/api/todos", todosController.getTodos);
app.post("/api/todos", todosController.createTodo);
app.delete("/api/todos/:id", todosController.deleteTodo);
app.put("/api/todos/:id", todosController.updateTodo);

export default app;








