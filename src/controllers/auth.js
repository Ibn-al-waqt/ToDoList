// auth.js
import express from "express";
import bcrypt from "bcrypt";
import { createUser, findUserByEmail, findUserById } from "../repositories/usersRepository.js";

const router = express.Router();

// ===== REGISTER =====
export async function register(req, res) {
  try {
    const { email, password } = req.body;
    console.log("Register attempt:", email);

    const existingUser = await findUserByEmail(email);
    console.log("Existing user:", existingUser);

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, passwordHash);
    console.log("Created user:", user);

    req.session.userId = user.id;
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("Register error:", err);  // ✅ shows exact Supabase error
    res.status(500).json({ message: "Internal server error" });
  }
}


// ===== LOGIN =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing email or password" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Internal server error", details: err.message });
  }
});

// ===== LOGOUT =====
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" }));
});

// ===== ME =====
router.get("/me", async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: "Not logged in" });
    const user = await findUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ message: "Internal server error", details: err.message });
  }
});

try {
  const user = await findUserByEmail(email);
  console.log("Fetched user:", user);
} catch (err) {
  console.error("Supabase error:", err);
}

export default router;




