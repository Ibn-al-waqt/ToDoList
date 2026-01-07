import bcrypt from "bcrypt";
import { createUser, findUserByEmail, findUserById } from "../repositories/usersRepository.js";

// Register
export async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, passwordHash);

    req.session.userId = user.id;
    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(400).json({ message: "Invalid credentials" });

    req.session.userId = user.id;
    res.json({ message: "Logged in", userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Logout
export function logout(req, res) {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.json({ message: "Logged out" });
  });
}

// Current user
export async function me(req, res) {
  try {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await findUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}






