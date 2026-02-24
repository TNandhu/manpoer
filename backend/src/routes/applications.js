const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/jobs/:jobId/apply', auth(['job_seeker']), async (req, res) => {
  const { jobId } = req.params;
  const { cover_letter: coverLetter } = req.body;

  const job = await db.query('SELECT id, is_active FROM jobs WHERE id = $1', [jobId]);
  if (!job.rowCount || !job.rows[0].is_active) return res.status(404).json({ message: 'Job unavailable' });

  const existing = await db.query(
    'SELECT id FROM applications WHERE job_id = $1 AND job_seeker_id = $2',
    [jobId, req.user.id],
  );
  if (existing.rowCount) return res.status(409).json({ message: 'Already applied to this job' });

  const result = await db.query(
    `INSERT INTO applications (job_id, job_seeker_id, cover_letter)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [jobId, req.user.id, coverLetter || null],
  );
  return res.status(201).json(result.rows[0]);
});

router.get('/me', auth(['job_seeker']), async (req, res) => {
  const result = await db.query(
    `SELECT a.*, j.title, j.location, j.salary, u.name AS employer_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN users u ON u.id = j.employer_id
     WHERE a.job_seeker_id = $1
     ORDER BY a.applied_at DESC`,
    [req.user.id],
  );
  return res.json(result.rows);
});

router.patch('/:applicationId/status', auth(['employer']), async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be accepted or rejected' });
  }

  const application = await db.query(
    `SELECT a.id, j.employer_id
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.id = $1`,
    [applicationId],
  );

  if (!application.rowCount) return res.status(404).json({ message: 'Application not found' });
  if (application.rows[0].employer_id !== req.user.id) {
    return res.status(403).json({ message: 'Can only update applications for your jobs' });
  }

  const result = await db.query(
    'UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, applicationId],
  );

  return res.json(result.rows[0]);
});

module.exports = router;
