require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const jobsRoutes = require('./routes/jobs');
const profileRoutes = require('./routes/profiles');
const appRoutes = require('./routes/applications');
const adminRoutes = require('./routes/admin');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, '../../frontend')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Temporary Manpower API running on port ${port}`);
});
