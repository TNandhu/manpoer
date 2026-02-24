const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  auth(['employer']),
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('location').notEmpty(),
    body('duration_days').isInt({ min: 1 }),
    body('salary').isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const {
        title, description, location, duration_days: durationDays, salary, required_skills: requiredSkills = [],
      } = req.body;
      const jobResult = await client.query(
        `INSERT INTO jobs (employer_id, title, description, location, duration_days, salary)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.user.id, title, description, location, durationDays, salary],
      );
      const job = jobResult.rows[0];

      for (const skillName of requiredSkills) {
        const skillResult = await client.query(
          `INSERT INTO skills (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [skillName.toLowerCase()],
        );
        await client.query(
          'INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [job.id, skillResult.rows[0].id],
        );
      }

      await client.query('COMMIT');
      return res.status(201).json(job);
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ message: 'Job creation failed', error: error.message });
    } finally {
      client.release();
    }
  },
);

router.get('/', async (req, res) => {
  const { location, minSalary, maxDuration, skill, q } = req.query;
  const filters = [];
  const values = [];

  if (location) {
    values.push(`%${location}%`);
    filters.push(`j.location ILIKE $${values.length}`);
  }
  if (minSalary) {
    values.push(Number(minSalary));
    filters.push(`j.salary >= $${values.length}`);
  }
  if (maxDuration) {
    values.push(Number(maxDuration));
    filters.push(`j.duration_days <= $${values.length}`);
  }
  if (q) {
    values.push(`%${q}%`);
    filters.push(`(j.title ILIKE $${values.length} OR j.description ILIKE $${values.length})`);
  }
  if (skill) {
    values.push(skill.toLowerCase());
    filters.push(`EXISTS (
      SELECT 1 FROM job_skills js2
      JOIN skills s2 ON s2.id = js2.skill_id
      WHERE js2.job_id = j.id AND s2.name = $${values.length}
    )`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const query = `
    SELECT
      j.*,
      u.name AS employer_name,
      COALESCE(array_remove(array_agg(DISTINCT s.name), NULL), '{}') AS skills
    FROM jobs j
    JOIN users u ON u.id = j.employer_id
    LEFT JOIN job_skills js ON js.job_id = j.id
    LEFT JOIN skills s ON s.id = js.skill_id
    ${whereClause}
    GROUP BY j.id, u.name
    ORDER BY j.created_at DESC;
  `;

  const result = await db.query(query, values);
  return res.json(result.rows);
});

router.put('/:id', auth(['employer', 'admin']), async (req, res) => {
  const { id } = req.params;
  const fields = ['title', 'description', 'location', 'duration_days', 'salary', 'is_active'];
  const updates = [];
  const values = [];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      values.push(req.body[field]);
      updates.push(`${field} = $${values.length}`);
    }
  });

  if (!updates.length) return res.status(400).json({ message: 'No updates provided' });

  const job = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
  if (!job.rowCount) return res.status(404).json({ message: 'Job not found' });
  if (req.user.role === 'employer' && job.rows[0].employer_id !== req.user.id) {
    return res.status(403).json({ message: 'Can only edit your own jobs' });
  }

  values.push(id);
  const result = await db.query(
    `UPDATE jobs SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values,
  );
  return res.json(result.rows[0]);
});

router.delete('/:id', auth(['employer', 'admin']), async (req, res) => {
  const { id } = req.params;
  const job = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
  if (!job.rowCount) return res.status(404).json({ message: 'Job not found' });

  if (req.user.role === 'employer' && job.rows[0].employer_id !== req.user.id) {
    return res.status(403).json({ message: 'Can only delete your own jobs' });
  }

  await db.query('DELETE FROM jobs WHERE id = $1', [id]);
  return res.json({ message: 'Job removed' });
});

router.get('/:id/applicants', auth(['employer']), async (req, res) => {
  const jobId = req.params.id;
  const job = await db.query('SELECT employer_id FROM jobs WHERE id = $1', [jobId]);
  if (!job.rowCount) return res.status(404).json({ message: 'Job not found' });
  if (job.rows[0].employer_id !== req.user.id) {
    return res.status(403).json({ message: 'Can only view applicants for your jobs' });
  }

  const result = await db.query(
    `SELECT a.id, a.status, a.cover_letter, a.applied_at,
            u.id AS job_seeker_id, u.name, u.email,
            p.availability, p.experience
      FROM applications a
      JOIN users u ON u.id = a.job_seeker_id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE a.job_id = $1
      ORDER BY a.applied_at DESC`,
    [jobId],
  );
  return res.json(result.rows);
});

module.exports = router;
