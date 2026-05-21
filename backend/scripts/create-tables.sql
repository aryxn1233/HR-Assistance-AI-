-- ============================================================
--  HR Assistance AI – Full Schema Migration
--  Safe to run multiple times (uses IF NOT EXISTS / DO blocks)
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('admin', 'recruiter', 'candidate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_difficulty_enum AS ENUM ('Easy', 'Medium', 'Hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hiring_recommendation_enum AS ENUM ('Strong Hire', 'Hire', 'No Hire');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS "users" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "clerkId"      VARCHAR     UNIQUE,
  "email"        VARCHAR     NOT NULL UNIQUE,
  "passwordHash" VARCHAR     NOT NULL,
  "role"         user_role_enum NOT NULL DEFAULT 'candidate',
  "firstName"    VARCHAR,
  "lastName"     VARCHAR,
  "avatarUrl"    VARCHAR,
  "createdAt"    TIMESTAMP   NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMP   NOT NULL DEFAULT now(),
  CONSTRAINT "PK_users" PRIMARY KEY ("id")
);

-- ============================================================
-- 3. CANDIDATES
-- ============================================================

CREATE TABLE IF NOT EXISTS "candidates" (
  "id"              UUID      NOT NULL DEFAULT gen_random_uuid(),
  "userId"          UUID      NOT NULL,
  "resumeUrl"       VARCHAR,
  "avatarUrl"       VARCHAR,
  "title"           VARCHAR,
  "bio"             TEXT,
  "location"        VARCHAR,
  "linkedinUrl"     VARCHAR,
  "portfolioUrl"    VARCHAR,
  "resumeText"      TEXT,
  "skills"          TEXT,        -- TypeORM simple-array stores as CSV
  "experienceYears" FLOAT       NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP   NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMP   NOT NULL DEFAULT now(),
  CONSTRAINT "PK_candidates" PRIMARY KEY ("id"),
  CONSTRAINT "FK_candidates_userId"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_candidates_userId" ON "candidates"("userId");

-- ============================================================
-- 4. CANDIDATE EXPERIENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS "candidate_experiences" (
  "id"          UUID      NOT NULL DEFAULT gen_random_uuid(),
  "candidateId" UUID      NOT NULL,
  "employer"    VARCHAR   NOT NULL,
  "role"        VARCHAR   NOT NULL,
  "startDate"   DATE,
  "endDate"     DATE,
  "isCurrent"   BOOLEAN   NOT NULL DEFAULT false,
  "description" TEXT,
  "location"    VARCHAR,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_candidate_experiences" PRIMARY KEY ("id"),
  CONSTRAINT "FK_candidate_experiences_candidateId"
    FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE
);

-- ============================================================
-- 5. RESUMES
-- ============================================================

CREATE TABLE IF NOT EXISTS "resumes" (
  "id"            UUID      NOT NULL DEFAULT gen_random_uuid(),
  "candidateId"   UUID      NOT NULL,
  "fileUrl"       VARCHAR   NOT NULL,
  "extractedText" TEXT,
  "uploadedAt"    TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_resumes" PRIMARY KEY ("id"),
  CONSTRAINT "FK_resumes_candidateId"
    FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE
);

-- ============================================================
-- 6. JOBS
-- ============================================================

CREATE TABLE IF NOT EXISTS "jobs" (
  "id"             UUID      NOT NULL DEFAULT gen_random_uuid(),
  "title"          VARCHAR   NOT NULL,
  "description"    TEXT      NOT NULL,
  "department"     VARCHAR,
  "location"       VARCHAR,
  "type"           VARCHAR   NOT NULL DEFAULT 'Full-time',
  "requiredSkills" TEXT,        -- TypeORM simple-array stores as CSV
  "minExperience"  FLOAT     NOT NULL DEFAULT 0,
  "status"         VARCHAR   NOT NULL DEFAULT 'Active',
  "createdBy"      UUID,
  "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_jobs" PRIMARY KEY ("id")
);

-- ============================================================
-- 7. APPLICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS "applications" (
  "id"                   UUID      NOT NULL DEFAULT gen_random_uuid(),
  "candidateId"          UUID      NOT NULL,
  "jobId"                UUID      NOT NULL,
  "resumeId"             UUID,
  "resumeScore"          INT,
  "resumeBreakdown"      JSON,
  "category"             VARCHAR,
  "rank"                 INT,
  "interviewScore"       INT,
  "finalHiringScore"     INT,
  "shortlisted"          BOOLEAN   NOT NULL DEFAULT false,
  "interviewUnlocked"    BOOLEAN   NOT NULL DEFAULT false,
  "feedback"             JSON,
  "status"               VARCHAR   NOT NULL DEFAULT 'applied',
  "interviewQuestions"   JSON,
  "currentQuestionIndex" INT       NOT NULL DEFAULT 0,
  "parsedResume"         JSON,
  "interviewStatus"      VARCHAR   NOT NULL DEFAULT 'not_started',
  "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_applications" PRIMARY KEY ("id"),
  CONSTRAINT "FK_applications_candidateId"
    FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_applications_jobId"
    FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE
);

-- ============================================================
-- 8. INTERVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS "interviews" (
  "id"                   UUID      NOT NULL DEFAULT gen_random_uuid(),
  "applicationId"        UUID,
  "jobId"                UUID      NOT NULL,
  "candidateId"          UUID      NOT NULL,
  "completed"            BOOLEAN   NOT NULL DEFAULT false,
  "status"               VARCHAR   NOT NULL DEFAULT 'created',
  "score"                INT       NOT NULL DEFAULT 0,
  "currentQuestionIndex" INT       NOT NULL DEFAULT 0,
  "feedback"             JSONB,
  "transcript"           JSONB     DEFAULT '[]',
  "skipCounter"          INT       NOT NULL DEFAULT 0,
  "endedAt"              TIMESTAMP,
  "terminationReason"    VARCHAR,
  "history"              JSONB     DEFAULT '[]',
  "fitDecision"          VARCHAR,
  "joinProbability"      INT,
  "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_interviews" PRIMARY KEY ("id"),
  CONSTRAINT "FK_interviews_jobId"
    FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_interviews_candidateId"
    FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_interviews_applicationId"
    FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL
);

-- ============================================================
-- 9. INTERVIEW QUESTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS "interview_questions" (
  "id"           UUID      NOT NULL DEFAULT gen_random_uuid(),
  "interviewId"  UUID      NOT NULL,
  "questionText" TEXT      NOT NULL,
  "skillFocus"   VARCHAR   NOT NULL,
  "difficulty"   question_difficulty_enum NOT NULL,
  "orderNumber"  INT       NOT NULL,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_interview_questions" PRIMARY KEY ("id"),
  CONSTRAINT "FK_interview_questions_interviewId"
    FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE
);

-- ============================================================
-- 10. INTERVIEW ANSWERS
-- ============================================================

CREATE TABLE IF NOT EXISTS "interview_answers" (
  "id"                 UUID    NOT NULL DEFAULT gen_random_uuid(),
  "questionId"         UUID    NOT NULL,
  "transcript"         TEXT    NOT NULL,
  "technicalScore"     FLOAT   NOT NULL DEFAULT 0,
  "accuracyScore"      FLOAT   NOT NULL DEFAULT 0,
  "communicationScore" FLOAT   NOT NULL DEFAULT 0,
  "confidenceScore"    FLOAT   NOT NULL DEFAULT 0,
  "feedback"           TEXT,
  "createdAt"          TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_interview_answers" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_interview_answers_questionId" UNIQUE ("questionId"),
  CONSTRAINT "FK_interview_answers_questionId"
    FOREIGN KEY ("questionId") REFERENCES "interview_questions"("id") ON DELETE CASCADE
);

-- ============================================================
-- 11. INTERVIEW REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS "interview_reports" (
  "id"               UUID      NOT NULL DEFAULT gen_random_uuid(),
  "interviewId"      UUID      NOT NULL,
  "overallScore"     FLOAT     NOT NULL,
  "strengths"        JSONB,
  "weaknesses"       JSONB,
  "recommendation"   hiring_recommendation_enum NOT NULL,
  "detailedAnalysis" JSONB,
  "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_interview_reports" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_interview_reports_interviewId" UNIQUE ("interviewId"),
  CONSTRAINT "FK_interview_reports_interviewId"
    FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE
);

-- ============================================================
-- Done!
-- ============================================================
SELECT 'Schema created successfully' AS status;
