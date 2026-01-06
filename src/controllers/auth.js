// controllers/auth.js
import { createUser, findUserByEmail } from "../repositories/usersRepository.js";
import bcrypt from "bcrypt";

// ------------------ LOGIN ------------------
export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  // ✅ Set session
  req.session.userId = user.id;

  res.json({ id: user.id, email: user.email });
}

// ------------------ REGISTER ------------------
export async function register(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const existingUser = await findUserByEmail(email);
  if (existingUser) return res.status(400).json({ error: "Email already exists" });

  const hash = await bcrypt.hash(password, 10);
  const user = await createUser(email, hash);

  // ✅ Auto-login after registration
  req.session.userId = user.id;

  res.json({ id: user.id, email: user.email });
}

// ------------------ ME ------------------
export async function me(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

  // fetch user from DB
  const user = await findUserById(req.session.userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  res.json({ id: user.id, email: user.email });
}

// ------------------ LOGOUT ------------------
export async function logout(req, res) {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: "Failed to logout" });
    res.json({ message: "Logged out" });
  });
}


