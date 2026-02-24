const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth(['admin']));

router.get('/users', async (_req, res) => {
  const result = await db.query(
    'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC',
  );
  return res.json(result.rows);
});

router.delete('/users/:id', async (req, res) => {
  await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  return res.json({ message: 'User removed' });
});

router.delete('/jobs/:id', async (req, res) => {
  await db.query('DELETE FROM jobs WHERE id = $1', [req.params.id]);
  return res.json({ message: 'Job removed by admin' });
});

router.get('/stats', async (_req, res) => {
  const [users, jobs, applications, activeJobs] = await Promise.all([
    db.query('SELECT role, COUNT(*)::INT AS count FROM users GROUP BY role'),
    db.query('SELECT COUNT(*)::INT AS count FROM jobs'),
    db.query('SELECT status, COUNT(*)::INT AS count FROM applications GROUP BY status'),
    db.query('SELECT COUNT(*)::INT AS count FROM jobs WHERE is_active = TRUE'),
  ]);

  return res.json({
    usersByRole: users.rows,
    totalJobs: jobs.rows[0].count,
    applicationsByStatus: applications.rows,
    activeJobs: activeJobs.rows[0].count,
  });
});

module.exports = router;
