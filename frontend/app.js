const API_BASE = '/api';
let authToken = localStorage.getItem('token') || '';
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

const authStatus = document.getElementById('auth-status');
const jobList = document.getElementById('job-list');
const panels = {
  employer: document.getElementById('employer-panel'),
  job_seeker: document.getElementById('job-seeker-panel'),
  admin: document.getElementById('admin-panel'),
};

const apiRequest = async (path, method = 'GET', body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const showPanelsByRole = () => {
  Object.values(panels).forEach((panel) => panel.classList.add('hidden'));
  if (currentUser && panels[currentUser.role]) {
    panels[currentUser.role].classList.remove('hidden');
  }
};

const renderJobs = async (query = '') => {
  try {
    const jobs = await apiRequest(`/jobs${query}`);
    jobList.innerHTML = jobs.map((job) => `
      <div class="job-item">
        <h3>${job.title}</h3>
        <p>${job.description}</p>
        <p><strong>Location:</strong> ${job.location} | <strong>Duration:</strong> ${job.duration_days} days | <strong>Salary:</strong> ₹${job.salary}</p>
        <p><strong>Skills:</strong> ${(job.skills || []).join(', ')}</p>
        ${currentUser?.role === 'job_seeker' ? `<button data-apply='${job.id}'>Apply</button>` : ''}
      </div>
    `).join('');

    document.querySelectorAll('[data-apply]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await apiRequest(`/applications/jobs/${btn.dataset.apply}/apply`, 'POST', {});
          alert('Applied successfully');
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (error) {
    jobList.innerHTML = `<p>${error.message}</p>`;
  }
};

document.getElementById('register-btn').addEventListener('click', async () => {
  try {
    const data = await apiRequest('/auth/register', 'POST', {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      role: document.getElementById('role').value,
    });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    authStatus.textContent = `Registered as ${currentUser.name}`;
    showPanelsByRole();
  } catch (error) {
    authStatus.textContent = error.message;
  }
});

document.getElementById('login-btn').addEventListener('click', async () => {
  try {
    const data = await apiRequest('/auth/login', 'POST', {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
    });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    authStatus.textContent = `Welcome ${currentUser.name}`;
    showPanelsByRole();
  } catch (error) {
    authStatus.textContent = error.message;
  }
});

document.getElementById('filter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const params = new URLSearchParams();
  const location = document.getElementById('filter-location').value;
  const minSalary = document.getElementById('filter-min-salary').value;
  const maxDuration = document.getElementById('filter-max-duration').value;
  if (location) params.set('location', location);
  if (minSalary) params.set('minSalary', minSalary);
  if (maxDuration) params.set('maxDuration', maxDuration);
  renderJobs(`?${params.toString()}`);
});

document.getElementById('job-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiRequest('/jobs', 'POST', {
      title: document.getElementById('job-title').value,
      description: document.getElementById('job-description').value,
      location: document.getElementById('job-location').value,
      duration_days: Number(document.getElementById('job-duration').value),
      salary: Number(document.getElementById('job-salary').value),
      required_skills: document.getElementById('job-skills').value.split(',').map((s) => s.trim()).filter(Boolean),
    });
    alert('Job posted');
    renderJobs();
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiRequest('/profiles/me', 'PUT', {
      availability: document.getElementById('availability').value,
      experience: document.getElementById('experience').value,
      skills: document.getElementById('profile-skills').value.split(',').map((s) => s.trim()).filter(Boolean),
    });
    alert('Profile saved');
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('load-applications').addEventListener('click', async () => {
  try {
    const applications = await apiRequest('/applications/me');
    document.getElementById('application-list').innerHTML = applications
      .map((app) => `<li>${app.title} - ${app.status}</li>`)
      .join('');
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('load-stats').addEventListener('click', async () => {
  try {
    const stats = await apiRequest('/admin/stats');
    document.getElementById('stats-output').textContent = JSON.stringify(stats, null, 2);
  } catch (error) {
    alert(error.message);
  }
});

showPanelsByRole();
renderJobs();
