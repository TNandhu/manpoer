const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.put('/me', auth(['job_seeker']), async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { availability, experience, skills = [] } = req.body;
    const profileResult = await client.query(
      `INSERT INTO profiles (user_id, availability, experience)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET availability = EXCLUDED.availability, experience = EXCLUDED.experience, updated_at = NOW()
       RETURNING *`,
      [req.user.id, availability, experience],
    );

    await client.query('DELETE FROM user_skills WHERE user_id = $1', [req.user.id]);
    for (const skill of skills) {
      const skillResult = await client.query(
        `INSERT INTO skills (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [skill.toLowerCase()],
      );
      await client.query(
        'INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)',
        [req.user.id, skillResult.rows[0].id],
      );
    }

    await client.query('COMMIT');
    return res.json(profileResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Profile update failed', error: error.message });
  } finally {
    client.release();
  }
});

router.get('/me', auth(['job_seeker']), async (req, res) => {
  const result = await db.query(
    `SELECT p.*, COALESCE(array_remove(array_agg(s.name), NULL), '{}') AS skills
     FROM profiles p
     LEFT JOIN user_skills us ON us.user_id = p.user_id
     LEFT JOIN skills s ON s.id = us.skill_id
     WHERE p.user_id = $1
     GROUP BY p.id`,
    [req.user.id],
  );

  if (!result.rowCount) return res.status(404).json({ message: 'Profile not found' });
  return res.json(result.rows[0]);
});

module.exports = router;
