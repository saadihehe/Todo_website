// Remove in-memory user store
// let users = [{ username: "test", password: "test" }];
let currentUser = null;
let authToken = null;

// Helper: API base URL
const API_BASE = 'http://localhost:5000/api';

// Modal logic
const modal = document.getElementById("auth-modal");
const loginBtn = document.getElementById("loginBtn");
const closeModal = document.getElementById("closeModal");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const switchAuth = document.getElementById("switchAuth");
const toggleAuth = document.getElementById("toggle-auth");
const userIcon = document.getElementById("userIcon");
const userDropdown = document.getElementById("userDropdown");
const userIconImg = document.getElementById("userIconImg");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const logoutBtn = document.getElementById("logoutBtn");
const changePasswordModal = document.getElementById("changePasswordModal");
const closeChangePasswordModal = document.getElementById("closeChangePasswordModal");
const changePasswordForm = document.getElementById("changePasswordForm");

let isLogin = true;

// Try to restore session
if (localStorage.getItem('authToken') && localStorage.getItem('currentUser')) {
  authToken = localStorage.getItem('authToken');
  currentUser = { username: localStorage.getItem('currentUser') };
  loginBtn.style.display = "none";
  userIcon.style.display = "flex";
}

loginBtn.onclick = () => {
  modal.style.display = "flex";
  setAuthMode(true);
};

closeModal.onclick = () => {
  modal.style.display = "none";
};

window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

switchAuth.onclick = (e) => {
  e.preventDefault();
  setAuthMode(!isLogin);
};

function setAuthMode(login) {
  isLogin = login;
  authTitle.textContent = login ? "Login" : "Sign Up";
  authSubmit.textContent = login ? "Login" : "Sign Up";
  toggleAuth.innerHTML = login
    ? `Don't have an account? <a href="#" id="switchAuth">Sign up</a>`
    : `Already have an account? <a href="#" id="switchAuth">Login</a>`;
  document.getElementById("switchAuth").onclick = switchAuth.onclick;
}

// Updated authForm.onsubmit for backend
authForm.onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (isLogin) {
    // LOGIN
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      currentUser = { username };
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', username);

      // Fetch tasks for this user
      const tasksRes = await fetch(`${API_BASE}/tasks?username=${encodeURIComponent(username)}`);
      const tasksData = await tasksRes.json();
      todos = tasksData.tasks || [];
      saveTodos();
      renderTodos();

      modal.style.display = "none";
      loginBtn.style.display = "none";
      userIcon.style.display = "flex";
      alert("Login successful!");
    } catch (err) {
      alert(err.message);
    }
  } else {
    // SIGNUP
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      alert("Signup successful! Please login.");
      setAuthMode(true);
    } catch (err) {
      alert(err.message);
    }
  }
  authForm.reset();
};

// To-Do logic
let todos = JSON.parse(localStorage.getItem('todos')) || [];

const categoryTitle = document.getElementById("category-title");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

// Helper: Save todos to backend if logged in
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
  if (currentUser && currentUser.username) {
    fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, tasks: todos })
    });
  }
}

function renderTodos() {
  todoList.innerHTML = "";
  todos.forEach((todo, idx) => {
    const li = document.createElement("li");
    li.className = todo.completed ? "completed" : "";
    let priorityLabel = "";
    if (todo.priority) {
      let pClass = "priority-medium";
      let pText = "Medium";
      if (todo.priority === "low") { pClass = "priority-low"; pText = "Low"; }
      if (todo.priority === "high") { pClass = "priority-high"; pText = "High"; }
      priorityLabel = `<span class="todo-priority ${pClass}">${pText}</span>`;
    }
    let dueInfo = "";
    if (todo.dueDate || todo.dueTime) {
      let dueString = "";
      if (todo.dueDate) dueString += todo.dueDate;
      if (todo.dueTime) dueString += (dueString ? " " : "") + todo.dueTime;
      dueInfo = `<span class="todo-due">Due: ${dueString}</span>`;
    }
    li.innerHTML = `
      <span onclick="toggleComplete(${idx})">${todo.text}</span>
      ${priorityLabel}
      ${dueInfo}
      <button class="delete-btn" onclick="deleteTodo(${idx})">&times;</button>
    `;
    todoList.appendChild(li);
  });
}

window.toggleComplete = function(idx) {
  todos[idx].completed = !todos[idx].completed;
  saveTodos();
  renderTodos();
};

window.deleteTodo = function(idx) {
  todos.splice(idx, 1);
  saveTodos();
  renderTodos();
};

todoForm.onsubmit = (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  const priority = document.getElementById('todo-priority').value;
  const dueDate = document.getElementById('todo-date').value;
  const dueTime = document.getElementById('todo-time').value;
  if (text) {
    todos.push({ text, completed: false, priority, dueDate, dueTime });
    todoInput.value = "";
    document.getElementById('todo-priority').value = "medium";
    document.getElementById('todo-date').value = "";
    document.getElementById('todo-time').value = "";
    saveTodos();
    renderTodos();
  }
};

// Navbar category switching
document.getElementById("athletes-tab").onclick = (e) => {
  e.preventDefault();
  categoryTitle.textContent = "Athletes";
  renderTodos();
};
document.getElementById("routine-tab").onclick = (e) => {
  e.preventDefault();
  categoryTitle.textContent = "Routine Work";
  renderTodos();
};
document.getElementById("business-tab").onclick = (e) => {
  e.preventDefault();
  categoryTitle.textContent = "Business / Jobs";
  renderTodos();
};

// Initial render
renderTodos();

// Carousel logic
const carouselSlides = document.querySelectorAll('.carousel-slide');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
let carouselIndex = 0;
let carouselInterval = null;

function showCarouselSlide(idx) {
  carouselSlides.forEach((slide, i) => {
    slide.classList.toggle('active', i === idx);
  });
}

function nextCarouselSlide() {
  carouselIndex = (carouselIndex + 1) % carouselSlides.length;
  showCarouselSlide(carouselIndex);
}

function prevCarouselSlide() {
  carouselIndex = (carouselIndex - 1 + carouselSlides.length) % carouselSlides.length;
  showCarouselSlide(carouselIndex);
}

carouselNext.addEventListener('click', () => {
  nextCarouselSlide();
  resetCarouselInterval();
});
carouselPrev.addEventListener('click', () => {
  prevCarouselSlide();
  resetCarouselInterval();
});

function startCarouselInterval() {
  carouselInterval = setInterval(nextCarouselSlide, 5000);
}
function resetCarouselInterval() {
  clearInterval(carouselInterval);
  startCarouselInterval();
}

showCarouselSlide(carouselIndex);
startCarouselInterval();

// Dropdown toggle
userIconImg.onclick = (e) => {
  e.stopPropagation();
  userDropdown.style.display = userDropdown.style.display === "flex" ? "none" : "flex";
};
document.addEventListener("click", (e) => {
  if (userDropdown.style.display === "flex" && !userDropdown.contains(e.target) && e.target !== userIconImg) {
    userDropdown.style.display = "none";
  }
});

// Logout functionality
logoutBtn.onclick = () => {
  if (currentUser && currentUser.username) {
    fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, tasks: todos })
    });
  }
  currentUser = null;
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  todos = [];
  saveTodos();
  renderTodos();
  loginBtn.textContent = "Login / Signup";
  loginBtn.style.display = "inline-block";
  userIcon.style.display = "none";
  userDropdown.style.display = "none";
  loginBtn.onclick = () => {
    modal.style.display = "flex";
    setAuthMode(true);
  };
};

// Change Password Modal
changePasswordBtn.onclick = () => {
  userDropdown.style.display = "none";
  changePasswordModal.style.display = "flex";
};
closeChangePasswordModal.onclick = () => {
  changePasswordModal.style.display = "none";
  changePasswordForm.reset();
};
window.addEventListener("click", (e) => {
  if (e.target === changePasswordModal) {
    changePasswordModal.style.display = "none";
    changePasswordForm.reset();
  }
});

// Change Password Functionality (backend)
changePasswordForm.onsubmit = async (e) => {
  e.preventDefault();
  const oldPassword = document.getElementById("oldPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();
  if (!currentUser) {
    alert("No user logged in.");
    return;
  }
  if (newPassword !== confirmNewPassword) {
    alert("New passwords do not match.");
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Change password failed');
    alert("Password changed successfully!");
    changePasswordModal.style.display = "none";
    changePasswordForm.reset();
  } catch (err) {
    alert(err.message);
  }
};

// Contact Us form functionality
const contactForm = document.getElementById("contactForm");
const contactSuccess = document.getElementById("contactSuccess");
if (contactForm) {
  contactForm.onsubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const message = document.getElementById("contactMessage").value.trim();
    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send message');
      contactSuccess.innerHTML = `
        <b>Thank you, ${name}!</b><br>
        <span style="color:#4f46e5;">We have received your message:</span><br>
        <i>"${message}"</i><br>
        <span style="font-size:0.95em;color:#64748b;">(We will contact you at <b>${email}</b>)</span>
      `;
      contactSuccess.style.display = "block";
      contactForm.reset();
      setTimeout(() => {
        contactSuccess.style.display = "none";
        contactSuccess.innerHTML = "Thank you for contacting us!";
      }, 7000);
    } catch (err) {
      contactSuccess.innerHTML = `<span style="color:#dc2626;">${err.message}</span>`;
      contactSuccess.style.display = "block";
    }
  };
}

// Home logo click functionality
const homeLogo = document.getElementById("homeLogo");
if (homeLogo) {
  homeLogo.onclick = () => {
    window.location.href = window.location.pathname;
  };
}
