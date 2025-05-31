const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const USERS_FILE = './users.json';
const SECRET = 'your_jwt_secret'; // Change this in production!
const CONTACT_FILE = './contact_messages.json';

app.use(cors());
app.use(express.json());

// Helper: Read/Write users
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Helper: Read/Write contact messages
function readContacts() {
  if (!fs.existsSync(CONTACT_FILE)) return [];
  return JSON.parse(fs.readFileSync(CONTACT_FILE, 'utf-8'));
}
function writeContacts(messages) {
  fs.writeFileSync(CONTACT_FILE, JSON.stringify(messages, null, 2));
}

// Signup
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  let users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashedPassword, tasks: [] });
  writeUsers(users);
  res.json({ message: 'Signup successful' });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  let users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  // Create JWT token
  const token = jwt.sign({ username }, SECRET, { expiresIn: '2h' });
  res.json({ message: 'Login successful', token, username });
});

// Change Password
app.post('/api/change-password', (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  let users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(401).json({ message: 'Old password is incorrect' });
  }
  user.password = bcrypt.hashSync(newPassword, 10);
  writeUsers(users);
  res.json({ message: 'Password changed successfully' });
});

// Get tasks for a user
app.get('/api/tasks', (req, res) => {
  const { username } = req.query;
  let users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ tasks: user.tasks || [] });
});

// Save tasks for a user
app.post('/api/tasks', (req, res) => {
  const { username, tasks } = req.body;
  let users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.tasks = tasks;
  writeUsers(users);
  res.json({ message: 'Tasks saved' });
});

// Add this endpoint:
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  const messages = readContacts();
  messages.push({
    name,
    email,
    message,
    date: new Date().toISOString()
  });
  writeContacts(messages);
  res.json({ message: 'Message received!' });
});

// Admin endpoint to view all contact messages
app.get('/api/contact-messages', (req, res) => {
  const messages = readContacts();
  res.json(messages);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
