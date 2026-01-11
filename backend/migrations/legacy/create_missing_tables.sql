-- Script SQL pour créer toutes les tables manquantes
-- Convention: Tables en minuscules, colonnes en camelCase
-- Date: 2025-10-30

-- ============================================
-- TABLES POUR LE SYSTÈME DE COMMUNAUTÉ
-- ============================================

-- Table pour les groupes d'étude
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "subjectId" VARCHAR(255),
    level VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    "isActive" BOOLEAN DEFAULT true,
    "maxMembers" INTEGER DEFAULT 50,
    "currentMembersCount" INTEGER DEFAULT 0,
    "createdBy" UUID REFERENCES users(id) ON DELETE SET NULL,
    "moderatorId" UUID REFERENCES users(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON study_groups("subjectId");
CREATE INDEX IF NOT EXISTS idx_study_groups_level ON study_groups(level);
CREATE INDEX IF NOT EXISTS idx_study_groups_region ON study_groups(region);
CREATE INDEX IF NOT EXISTS idx_study_groups_active ON study_groups("isActive");

-- Table pour les membres des groupes d'étude
CREATE TABLE IF NOT EXISTS study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "groupId" UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    "studentId" UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMPTZ,
    "isActive" BOOLEAN DEFAULT true,
    UNIQUE("groupId", "studentId")
);

CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members("groupId");
CREATE INDEX IF NOT EXISTS idx_study_group_members_student ON study_group_members("studentId");

-- ============================================
-- TABLES POUR LE FORUM DE DISCUSSIONS
-- ============================================

-- Table pour les catégories de forum
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(50),
    "sortOrder" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les discussions du forum
CREATE TABLE IF NOT EXISTS forum_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    "categoryId" UUID REFERENCES forum_categories(id) ON DELETE SET NULL,
    "authorId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "authorType" VARCHAR(50) DEFAULT 'STUDENT',
    "isPinned" BOOLEAN DEFAULT false,
    "isLocked" BOOLEAN DEFAULT false,
    "isFeatured" BOOLEAN DEFAULT false,
    "viewsCount" INTEGER DEFAULT 0,
    "repliesCount" INTEGER DEFAULT 0,
    "likesCount" INTEGER DEFAULT 0,
    "lastReplyAt" TIMESTAMPTZ,
    "lastReplyBy" UUID REFERENCES users(id) ON DELETE SET NULL,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_forum_discussions_category ON forum_discussions("categoryId");
CREATE INDEX IF NOT EXISTS idx_forum_discussions_author ON forum_discussions("authorId");
CREATE INDEX IF NOT EXISTS idx_forum_discussions_created ON forum_discussions("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_forum_discussions_featured ON forum_discussions("isFeatured") WHERE "isFeatured" = true;

-- Table pour les réponses aux discussions
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "discussionId" UUID NOT NULL REFERENCES forum_discussions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "authorId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "authorType" VARCHAR(50) DEFAULT 'STUDENT',
    "parentPostId" UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    "isSolution" BOOLEAN DEFAULT false,
    "likesCount" INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_discussion ON forum_posts("discussionId");
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts("authorId");
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts("createdAt");

-- ============================================
-- TABLES POUR LE SYSTÈME DE BIEN-ÊTRE
-- ============================================

-- Table pour les exercices de relaxation et bien-être
CREATE TABLE IF NOT EXISTS wellness_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    duration INTEGER,
    difficulty VARCHAR(50) DEFAULT 'BEGINNER',
    instructions TEXT,
    "mediaUrl" VARCHAR(500),
    "mediaType" VARCHAR(50),
    "thumbnailUrl" VARCHAR(500),
    benefits JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    "isActive" BOOLEAN DEFAULT true,
    "sortOrder" INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wellness_exercises_type ON wellness_exercises(type);
CREATE INDEX IF NOT EXISTS idx_wellness_exercises_category ON wellness_exercises(category);
CREATE INDEX IF NOT EXISTS idx_wellness_exercises_active ON wellness_exercises("isActive");

-- Table pour le suivi du bien-être des étudiants
CREATE TABLE IF NOT EXISTS wellness_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    "stressLevel" INTEGER,
    mood VARCHAR(50),
    "sleepHours" NUMERIC(4,2),
    "energyLevel" INTEGER,
    "focusLevel" INTEGER,
    notes TEXT,
    "exercisesCompleted" JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("studentId", date)
);

CREATE INDEX IF NOT EXISTS idx_wellness_tracking_student ON wellness_tracking("studentId");
CREATE INDEX IF NOT EXISTS idx_wellness_tracking_date ON wellness_tracking(date);

-- ============================================
-- TABLES POUR L'ORIENTATION PROFESSIONNELLE
-- ============================================

-- Table pour les profils de carrière
CREATE TABLE IF NOT EXISTS career_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    characteristics TEXT,
    "strengthSubjects" JSONB DEFAULT '[]',
    "idealActivities" JSONB DEFAULT '[]',
    "recommendedPaths" JSONB DEFAULT '[]',
    icon VARCHAR(100),
    color VARCHAR(50),
    "isActive" BOOLEAN DEFAULT true,
    "sortOrder" INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les carrières/métiers
CREATE TABLE IF NOT EXISTS careers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "profileId" UUID REFERENCES career_profiles(id) ON DELETE SET NULL,
    category VARCHAR(100),
    "requiredEducation" VARCHAR(255),
    "requiredSkills" JSONB DEFAULT '[]',
    "averageSalaryMin" INTEGER,
    "averageSalaryMax" INTEGER,
    "growthOutlook" VARCHAR(50),
    "growthPercentage" NUMERIC(5,2),
    "demandLevel" VARCHAR(50),
    "workEnvironment" TEXT,
    "relatedSubjects" JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    "isTrending" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    icon VARCHAR(100),
    "imageUrl" VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_careers_profile ON careers("profileId");
CREATE INDEX IF NOT EXISTS idx_careers_category ON careers(category);
CREATE INDEX IF NOT EXISTS idx_careers_trending ON careers("isTrending") WHERE "isTrending" = true;

-- Table pour les établissements d'enseignement
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    type VARCHAR(100),
    city VARCHAR(255),
    region VARCHAR(255),
    country VARCHAR(100) DEFAULT 'Cameroun',
    address TEXT,
    description TEXT,
    programs JSONB DEFAULT '[]',
    specializations JSONB DEFAULT '[]',
    "admissionRequirements" TEXT,
    "acceptanceRate" NUMERIC(5,2),
    "tuitionFees" JSONB,
    "rankingNational" INTEGER,
    "rankingInternational" INTEGER,
    accreditations JSONB DEFAULT '[]',
    facilities JSONB DEFAULT '[]',
    "contactInfo" JSONB,
    website VARCHAR(500),
    "logoUrl" VARCHAR(500),
    "isActive" BOOLEAN DEFAULT true,
    "isFeatured" BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(type);
CREATE INDEX IF NOT EXISTS idx_institutions_city ON institutions(city);
CREATE INDEX IF NOT EXISTS idx_institutions_region ON institutions(region);
CREATE INDEX IF NOT EXISTS idx_institutions_featured ON institutions("isFeatured") WHERE "isFeatured" = true;

-- Table pour les dates limites de candidature
CREATE TABLE IF NOT EXISTS application_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "institutionId" UUID REFERENCES institutions(id) ON DELETE CASCADE,
    "programName" VARCHAR(500),
    "academicYear" VARCHAR(50),
    "deadlineType" VARCHAR(100),
    "deadlineDate" DATE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'UPCOMING',
    requirements JSONB DEFAULT '[]',
    "applicationUrl" VARCHAR(500),
    "isActive" BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_application_deadlines_institution ON application_deadlines("institutionId");
CREATE INDEX IF NOT EXISTS idx_application_deadlines_date ON application_deadlines("deadlineDate");
CREATE INDEX IF NOT EXISTS idx_application_deadlines_status ON application_deadlines(status);

-- ============================================
-- TABLES POUR LES SESSIONS DE RÉVISION
-- ============================================

-- Table pour les sessions de révision actives
CREATE TABLE IF NOT EXISTS revision_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    "subjectId" VARCHAR(255),
    "sessionType" VARCHAR(50) DEFAULT 'STANDARD',
    "startTime" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMPTZ,
    "durationMinutes" INTEGER,
    "questionsAttempted" INTEGER DEFAULT 0,
    "questionsCorrect" INTEGER DEFAULT 0,
    "averageScore" NUMERIC(5,2),
    "difficultyLevel" VARCHAR(50),
    "isActive" BOOLEAN DEFAULT true,
    completed BOOLEAN DEFAULT false,
    "progressData" JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revision_sessions_student ON revision_sessions("studentId");
CREATE INDEX IF NOT EXISTS idx_revision_sessions_subject ON revision_sessions("subjectId");
CREATE INDEX IF NOT EXISTS idx_revision_sessions_active ON revision_sessions("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_revision_sessions_start_time ON revision_sessions("startTime");

-- ============================================
-- TABLES POUR LES PARTICIPATIONS AUX BATAILLES
-- ============================================

-- Table pour les participations aux batailles
CREATE TABLE IF NOT EXISTS battle_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "battleId" INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    "studentId" UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    rank INTEGER,
    "questionsAnswered" INTEGER DEFAULT 0,
    "questionsCorrect" INTEGER DEFAULT 0,
    "timeTaken" INTEGER,
    "powerUpsUsed" JSONB DEFAULT '[]',
    answers JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'REGISTERED',
    "joinedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ,
    rewards JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("battleId", "studentId")
);

CREATE INDEX IF NOT EXISTS idx_battle_participations_battle ON battle_participations("battleId");
CREATE INDEX IF NOT EXISTS idx_battle_participations_student ON battle_participations("studentId");
CREATE INDEX IF NOT EXISTS idx_battle_participations_status ON battle_participations(status);
CREATE INDEX IF NOT EXISTS idx_battle_participations_score ON battle_participations(score DESC);

-- ============================================
-- TABLES POUR LES ACHIEVEMENTS/BADGES
-- ============================================

-- Table pour les types d'achievements disponibles
CREATE TABLE IF NOT EXISTS achievement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),
    icon VARCHAR(100),
    color VARCHAR(50),
    criteria JSONB NOT NULL,
    "rewardPoints" INTEGER DEFAULT 0,
    rarity VARCHAR(50) DEFAULT 'COMMON',
    "isActive" BOOLEAN DEFAULT true,
    "sortOrder" INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les achievements gagnés par les étudiants
CREATE TABLE IF NOT EXISTS student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    "achievementTypeId" UUID NOT NULL REFERENCES achievement_types(id) ON DELETE CASCADE,
    "earnedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    progress NUMERIC(5,2) DEFAULT 100.00,
    metadata JSONB DEFAULT '{}',
    UNIQUE("studentId", "achievementTypeId")
);

CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON student_achievements("studentId");
CREATE INDEX IF NOT EXISTS idx_student_achievements_type ON student_achievements("achievementTypeId");
CREATE INDEX IF NOT EXISTS idx_student_achievements_earned ON student_achievements("earnedAt");

-- ============================================
-- VUES POUR LES STATISTIQUES
-- ============================================

-- Vue pour les statistiques de bataille par étudiant
CREATE OR REPLACE VIEW student_battle_stats AS
SELECT
    "studentId",
    COUNT(*) as battles_participated,
    SUM(CASE WHEN rank = 1 THEN 1 ELSE 0 END) as battles_won,
    SUM(CASE WHEN rank <= 3 THEN 1 ELSE 0 END) as top_3_finishes,
    AVG(score) as average_score,
    MAX(score) as best_score,
    SUM("questionsCorrect") as total_correct_answers,
    SUM("questionsAnswered") as total_questions_answered
FROM battle_participations
WHERE status = 'COMPLETED'
GROUP BY "studentId";

-- Vue pour les statistiques de groupes d'étude
CREATE OR REPLACE VIEW study_group_stats AS
SELECT
    sg.id as group_id,
    sg.name,
    sg."subjectId",
    sg.level,
    COUNT(sgm.id) as total_members,
    COUNT(CASE WHEN sgm."isActive" = true THEN 1 END) as active_members,
    MAX(sgm."lastActiveAt") as last_activity
FROM study_groups sg
LEFT JOIN study_group_members sgm ON sg.id = sgm."groupId"
WHERE sg."isActive" = true
GROUP BY sg.id, sg.name, sg."subjectId", sg.level;

-- ============================================
-- TRIGGERS POUR METTRE À JOUR LES COMPTEURS
-- ============================================

-- Trigger pour mettre à jour le compteur de membres des groupes
CREATE OR REPLACE FUNCTION update_study_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE study_groups
        SET "currentMembersCount" = "currentMembersCount" + 1,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = NEW."groupId";
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE study_groups
        SET "currentMembersCount" = GREATEST(0, "currentMembersCount" - 1),
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = OLD."groupId";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_study_group_member_count
AFTER INSERT OR DELETE ON study_group_members
FOR EACH ROW
EXECUTE FUNCTION update_study_group_member_count();

-- Trigger pour mettre à jour le compteur de réponses des discussions
CREATE OR REPLACE FUNCTION update_forum_discussion_replies()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_discussions
        SET "repliesCount" = "repliesCount" + 1,
            "lastReplyAt" = NEW."createdAt",
            "lastReplyBy" = NEW."authorId",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = NEW."discussionId";
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_discussions
        SET "repliesCount" = GREATEST(0, "repliesCount" - 1),
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = OLD."discussionId";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_forum_discussion_replies
AFTER INSERT OR DELETE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION update_forum_discussion_replies();

-- Trigger pour mettre à jour le compteur de participants des batailles
CREATE OR REPLACE FUNCTION update_battle_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE battles
        SET "currentParticipants" = "currentParticipants" + 1,
            "participantCount" = "participantCount" + 1,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = NEW."battleId";
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE battles
        SET "currentParticipants" = GREATEST(0, "currentParticipants" - 1),
            "participantCount" = GREATEST(0, "participantCount" - 1),
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = OLD."battleId";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_battle_participant_count
AFTER INSERT OR DELETE ON battle_participations
FOR EACH ROW
EXECUTE FUNCTION update_battle_participant_count();

-- Commentaires sur les tables
COMMENT ON TABLE study_groups IS 'Groupes d''étude pour la collaboration entre étudiants';
COMMENT ON TABLE forum_discussions IS 'Discussions du forum communautaire';
COMMENT ON TABLE wellness_exercises IS 'Exercices de relaxation et bien-être';
COMMENT ON TABLE career_profiles IS 'Profils de carrière pour l''orientation professionnelle';
COMMENT ON TABLE careers IS 'Métiers et carrières disponibles';
COMMENT ON TABLE institutions IS 'Établissements d''enseignement';
COMMENT ON TABLE revision_sessions IS 'Sessions de révision actives';
COMMENT ON TABLE battle_participations IS 'Participations aux batailles royales';
COMMENT ON TABLE achievement_types IS 'Types d''achievements/badges disponibles';
COMMENT ON TABLE student_achievements IS 'Achievements gagnés par les étudiants';
