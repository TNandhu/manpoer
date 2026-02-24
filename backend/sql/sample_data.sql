-- Password for all seeded users: password
INSERT INTO users (name, email, password_hash, role)
VALUES
  ('System Admin', 'admin@tempmanpower.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5x1Jm8YVYdQ4CPrl/c/pX9nuSUXG6', 'admin'),
  ('Cafe Owner', 'employer@tempmanpower.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5x1Jm8YVYdQ4CPrl/c/pX9nuSUXG6', 'employer'),
  ('Student Worker', 'worker@tempmanpower.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5x1Jm8YVYdQ4CPrl/c/pX9nuSUXG6', 'job_seeker')
ON CONFLICT (email) DO NOTHING;

INSERT INTO skills (name) VALUES ('cashier'), ('cleaning'), ('delivery'), ('customer service')
ON CONFLICT (name) DO NOTHING;

INSERT INTO profiles (user_id, availability, experience)
SELECT id, 'Weekends and evenings', '1 year of part-time retail support.'
FROM users WHERE email = 'worker@tempmanpower.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, s.id
FROM users u
JOIN skills s ON s.name IN ('cashier', 'customer service')
WHERE u.email = 'worker@tempmanpower.local'
ON CONFLICT DO NOTHING;

INSERT INTO jobs (employer_id, title, description, location, duration_days, salary)
SELECT u.id, 'Weekend Counter Assistant', 'Help customers, billing, and stocking at a busy cafe.', 'Coimbatore', 30, 7000
FROM users u WHERE u.email = 'employer@tempmanpower.local'
ON CONFLICT DO NOTHING;

INSERT INTO job_skills (job_id, skill_id)
SELECT j.id, s.id
FROM jobs j
JOIN skills s ON s.name IN ('cashier', 'customer service')
WHERE j.title = 'Weekend Counter Assistant'
ON CONFLICT DO NOTHING;
