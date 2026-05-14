-- ============================================================
-- Ghana Education Service — Lesson Observation Platform
-- Database Schema (PostgreSQL)
-- Tema Metro District
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- REFERENCE / LOOKUP TABLES
-- ============================================================

CREATE TABLE districts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    region      VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE circuits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES districts(id),
    name        VARCHAR(150) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schools (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circuit_id  UUID NOT NULL REFERENCES circuits(id),
    name        VARCHAR(200) NOT NULL,
    location    VARCHAR(200),
    gps_lat     NUMERIC(10,7),
    gps_lng     NUMERIC(10,7),
    type        VARCHAR(50) CHECK (type IN ('Primary','JHS','SHS','KG')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS & ROLES
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(200) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(30) NOT NULL CHECK (role IN ('observer','headteacher','director','admin')),
    district_id     UUID REFERENCES districts(id),
    school_id       UUID REFERENCES schools(id),   -- for headteachers
    password_hash   TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

-- ============================================================
-- TEACHERS
-- ============================================================

CREATE TABLE teachers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id   UUID NOT NULL REFERENCES schools(id),
    full_name   VARCHAR(200) NOT NULL,
    sex         CHAR(1) CHECK (sex IN ('M','F')),
    subject     VARCHAR(100),
    staff_id    VARCHAR(50) UNIQUE,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OBSERVATIONS (HEADER)
-- ============================================================

CREATE TABLE observations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id          UUID NOT NULL REFERENCES teachers(id),
    school_id           UUID NOT NULL REFERENCES schools(id),
    observer_id         UUID NOT NULL REFERENCES users(id),
    class_name          VARCHAR(50),           -- e.g. "JHS 2A"
    subject             VARCHAR(100),
    number_on_roll      SMALLINT CHECK (number_on_roll > 0),
    number_present      SMALLINT,
    obs_date            DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    gps_lat             NUMERIC(10,7),         -- auto-captured on mobile
    gps_lng             NUMERIC(10,7),
    submitted_at        TIMESTAMPTZ DEFAULT NOW(),
    is_draft            BOOLEAN DEFAULT FALSE,
    sync_status         VARCHAR(20) DEFAULT 'synced'
                            CHECK (sync_status IN ('pending','synced','failed')),
    -- Computed totals (denormalised for fast queries)
    score_a             SMALLINT,              -- Planning & Preparation  /15
    score_b             SMALLINT,              -- Instructional Skills    /55
    score_c             SMALLINT,              -- Class Management        /20
    score_d             SMALLINT,              -- Assessment              /10
    total_score         SMALLINT,              -- Grand total             /100
    grade               VARCHAR(20),           -- Poor / Good / Very Good / Excellent
    CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- ============================================================
-- SECTION A — PLANNING & PREPARATION (15 marks, 3 indicators × 5)
-- ============================================================

CREATE TABLE obs_planning (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id          UUID NOT NULL UNIQUE REFERENCES observations(id) ON DELETE CASCADE,
    lesson_plan_alignment   SMALLINT NOT NULL CHECK (lesson_plan_alignment BETWEEN 1 AND 5),
    indicators_alignment    SMALLINT NOT NULL CHECK (indicators_alignment BETWEEN 1 AND 5),
    rpk_considered          SMALLINT NOT NULL CHECK (rpk_considered BETWEEN 1 AND 5)
);

-- ============================================================
-- SECTION B — INSTRUCTIONAL SKILLS (55 marks, 11 indicators × 5)
-- ============================================================

CREATE TABLE obs_instructional (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id          UUID NOT NULL UNIQUE REFERENCES observations(id) ON DELETE CASCADE,
    child_centred_intro     SMALLINT NOT NULL CHECK (child_centred_intro BETWEEN 1 AND 5),
    clarity_of_instruction  SMALLINT NOT NULL CHECK (clarity_of_instruction BETWEEN 1 AND 5),
    teaching_strategies     SMALLINT NOT NULL CHECK (teaching_strategies BETWEEN 1 AND 5),
    pupil_motivation        SMALLINT NOT NULL CHECK (pupil_motivation BETWEEN 1 AND 5),
    lesson_structure        SMALLINT NOT NULL CHECK (lesson_structure BETWEEN 1 AND 5),
    subject_mastery         SMALLINT NOT NULL CHECK (subject_mastery BETWEEN 1 AND 5),
    questioning_skill       SMALLINT NOT NULL CHECK (questioning_skill BETWEEN 1 AND 5),
    gender_balance          SMALLINT NOT NULL CHECK (gender_balance BETWEEN 1 AND 5),
    use_of_tlrs             SMALLINT NOT NULL CHECK (use_of_tlrs BETWEEN 1 AND 5),
    critical_thinking       SMALLINT NOT NULL CHECK (critical_thinking BETWEEN 1 AND 5),
    learner_involvement     SMALLINT NOT NULL CHECK (learner_involvement BETWEEN 1 AND 5)
);

-- ============================================================
-- SECTION C — CLASS MANAGEMENT (20 marks, 4 indicators × 5)
-- ============================================================

CREATE TABLE obs_class_management (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id          UUID NOT NULL UNIQUE REFERENCES observations(id) ON DELETE CASCADE,
    rapport_with_learners   SMALLINT NOT NULL CHECK (rapport_with_learners BETWEEN 1 AND 5),
    facilitator_appearance  SMALLINT NOT NULL CHECK (facilitator_appearance BETWEEN 1 AND 5),
    learner_output          SMALLINT NOT NULL CHECK (learner_output BETWEEN 1 AND 5),
    classroom_environment   SMALLINT NOT NULL CHECK (classroom_environment BETWEEN 1 AND 5)
);

-- ============================================================
-- SECTION D — ASSESSMENT (10 marks, 2 indicators × 5)
-- ============================================================

CREATE TABLE obs_assessment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id      UUID NOT NULL UNIQUE REFERENCES observations(id) ON DELETE CASCADE,
    lesson_evaluation   SMALLINT NOT NULL CHECK (lesson_evaluation BETWEEN 1 AND 5),
    time_management     SMALLINT NOT NULL CHECK (time_management BETWEEN 1 AND 5)
);

-- ============================================================
-- QUALITATIVE FEEDBACK
-- ============================================================

CREATE TABLE obs_feedback (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id      UUID NOT NULL UNIQUE REFERENCES observations(id) ON DELETE CASCADE,
    observer_comments   TEXT,
    improvement_areas   TEXT,
    teacher_remarks     TEXT    -- teacher's own response (optional)
);

-- ============================================================
-- AUTO-SCORING TRIGGER
-- Recalculates section scores and grade whenever
-- section tables are inserted or updated.
-- ============================================================

CREATE OR REPLACE FUNCTION compute_observation_scores()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_obs_id UUID;
    v_a SMALLINT; v_b SMALLINT; v_c SMALLINT; v_d SMALLINT;
    v_total SMALLINT; v_grade VARCHAR(20);
BEGIN
    v_obs_id := NEW.observation_id;

    SELECT COALESCE(lesson_plan_alignment + indicators_alignment + rpk_considered, 0)
    INTO v_a FROM obs_planning WHERE observation_id = v_obs_id;

    SELECT COALESCE(
        child_centred_intro + clarity_of_instruction + teaching_strategies +
        pupil_motivation + lesson_structure + subject_mastery + questioning_skill +
        gender_balance + use_of_tlrs + critical_thinking + learner_involvement, 0)
    INTO v_b FROM obs_instructional WHERE observation_id = v_obs_id;

    SELECT COALESCE(rapport_with_learners + facilitator_appearance + learner_output + classroom_environment, 0)
    INTO v_c FROM obs_class_management WHERE observation_id = v_obs_id;

    SELECT COALESCE(lesson_evaluation + time_management, 0)
    INTO v_d FROM obs_assessment WHERE observation_id = v_obs_id;

    v_total := COALESCE(v_a,0) + COALESCE(v_b,0) + COALESCE(v_c,0) + COALESCE(v_d,0);

    v_grade := CASE
        WHEN v_total >= 80 THEN 'Excellent'
        WHEN v_total >= 65 THEN 'Very Good'
        WHEN v_total >= 50 THEN 'Good'
        ELSE 'Needs Improvement'
    END;

    UPDATE observations
    SET score_a = v_a, score_b = v_b, score_c = v_c, score_d = v_d,
        total_score = v_total, grade = v_grade
    WHERE id = v_obs_id;

    RETURN NEW;
END;
$$;

-- Attach trigger to all four section tables
CREATE TRIGGER trg_score_planning
    AFTER INSERT OR UPDATE ON obs_planning
    FOR EACH ROW EXECUTE FUNCTION compute_observation_scores();

CREATE TRIGGER trg_score_instructional
    AFTER INSERT OR UPDATE ON obs_instructional
    FOR EACH ROW EXECUTE FUNCTION compute_observation_scores();

CREATE TRIGGER trg_score_class_mgmt
    AFTER INSERT OR UPDATE ON obs_class_management
    FOR EACH ROW EXECUTE FUNCTION compute_observation_scores();

CREATE TRIGGER trg_score_assessment
    AFTER INSERT OR UPDATE ON obs_assessment
    FOR EACH ROW EXECUTE FUNCTION compute_observation_scores();

-- ============================================================
-- INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================

CREATE INDEX idx_obs_school       ON observations(school_id);
CREATE INDEX idx_obs_teacher      ON observations(teacher_id);
CREATE INDEX idx_obs_observer     ON observations(observer_id);
CREATE INDEX idx_obs_date         ON observations(obs_date);
CREATE INDEX idx_obs_grade        ON observations(grade);
CREATE INDEX idx_teachers_school  ON teachers(school_id);
CREATE INDEX idx_schools_circuit  ON schools(circuit_id);
CREATE INDEX idx_circuits_district ON circuits(district_id);

-- ============================================================
-- CONVENIENCE VIEW — Full observation with all section scores
-- ============================================================

CREATE VIEW vw_observations_full AS
SELECT
    o.id,
    o.obs_date,
    o.start_time,
    o.end_time,
    o.class_name,
    o.subject,
    o.number_on_roll,
    o.number_present,
    o.grade,
    o.total_score,
    o.score_a,
    o.score_b,
    o.score_c,
    o.score_d,
    t.full_name          AS teacher_name,
    t.sex                AS teacher_sex,
    s.name               AS school_name,
    c.name               AS circuit_name,
    d.name               AS district_name,
    u.full_name          AS observer_name,
    -- Section B breakdown (most granular)
    bi.child_centred_intro,
    bi.clarity_of_instruction,
    bi.teaching_strategies,
    bi.subject_mastery,
    bi.questioning_skill,
    bi.gender_balance,
    bi.use_of_tlrs,
    bi.critical_thinking,
    bi.learner_involvement,
    f.observer_comments,
    f.improvement_areas
FROM observations o
JOIN teachers        t  ON t.id = o.teacher_id
JOIN schools         s  ON s.id = o.school_id
JOIN circuits        c  ON c.id = s.circuit_id
JOIN districts       d  ON d.id = c.district_id
JOIN users           u  ON u.id = o.observer_id
LEFT JOIN obs_instructional bi ON bi.observation_id = o.id
LEFT JOIN obs_feedback       f ON f.observation_id = o.id
WHERE o.is_draft = FALSE;

-- ============================================================
-- SEED DATA — Tema Metro
-- ============================================================

INSERT INTO districts (id, name, region)
VALUES ('00000000-0000-0000-0000-000000000001', 'Tema Metro', 'Greater Accra');

INSERT INTO circuits (id, district_id, name) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Tema West Circuit'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Tema East Circuit'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Tema Central Circuit');

-- ============================================================
-- END OF SCHEMA
-- ============================================================
