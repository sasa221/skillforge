import {
  UserRoleType,
  ContentStatus,
  CourseDifficulty,
  LessonBlockType,
  QuestionType,
  AchievementType,
  ContentRevisionTarget,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaClient } from './generated-client';

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

function courseRevisionSnapshot(course: {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  instructorId: string | null;
  coverImageAssetId: string | null;
  introVideoAssetId?: string | null;
  coverImageUrl?: string | null;
  introVideoUrl?: string | null;
  difficulty: CourseDifficulty;
  estimatedMinutes?: number | null;
  tags?: string[];
  requiresSequentialModules?: boolean;
  status: ContentStatus;
  order?: number;
  skills?: Array<{ skillId?: string | null; skill?: { id: string } | null }>;
}) {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    instructorId: course.instructorId,
    coverImageAssetId: course.coverImageAssetId ?? null,
    introVideoAssetId: course.introVideoAssetId ?? null,
    coverImageUrl: course.coverImageUrl ?? null,
    introVideoUrl: course.introVideoUrl ?? null,
    difficulty: course.difficulty,
    estimatedMinutes: course.estimatedMinutes ?? null,
    tags: course.tags ?? [],
    requiresSequentialModules: course.requiresSequentialModules ?? true,
    status: course.status,
    order: course.order ?? 0,
    skillIds: (course.skills ?? [])
      .map((item) => item.skillId ?? item.skill?.id ?? null)
      .filter(Boolean),
  };
}

function moduleRevisionSnapshot(module: {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  introVideoAssetId?: string | null;
  introVideoUrl?: string | null;
  order: number;
  status: ContentStatus;
}) {
  return {
    id: module.id,
    courseId: module.courseId,
    title: module.title,
    description: module.description ?? null,
    introVideoAssetId: module.introVideoAssetId ?? null,
    introVideoUrl: module.introVideoUrl ?? null,
    order: module.order,
    status: module.status,
  };
}

function lessonRevisionSnapshot(
  lesson: {
    id: string;
    moduleId: string;
    title: string;
    slug: string;
    learningObjective?: string | null;
    aiPromptSeed?: string | null;
    estimatedMinutes?: number | null;
    order: number;
    status: ContentStatus;
  },
  blocks: Array<{ type: LessonBlockType; order: number; content: any }>,
) {
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    title: lesson.title,
    slug: lesson.slug,
    learningObjective: lesson.learningObjective ?? null,
    aiPromptSeed: lesson.aiPromptSeed ?? null,
    estimatedMinutes: lesson.estimatedMinutes ?? null,
    order: lesson.order,
    status: lesson.status,
    blocks: blocks.map((block) => ({
      type: block.type,
      order: block.order,
      content: block.content,
    })),
  };
}

function quizRevisionSnapshot(
  quiz: {
    id: string;
    lessonId: string;
    title?: string | null;
    passingScore: number;
    status: ContentStatus;
  },
  questions: Array<{
    type: QuestionType;
    difficulty: number;
    prompt: string;
    explanation?: string | null;
    order: number;
    correctOptionId?: string | null;
    correctText?: string | null;
    correctOrder?: string[];
    options: Array<{ id?: string; text: string; order: number }>;
  }>,
) {
  return {
    id: quiz.id,
    lessonId: quiz.lessonId,
    title: quiz.title ?? null,
    passingScore: quiz.passingScore,
    status: quiz.status,
    questions: questions.map((question) => ({
      type: question.type,
      difficulty: question.difficulty,
      prompt: question.prompt,
      explanation: question.explanation ?? null,
      order: question.order,
      correctOptionIndex: question.options.findIndex(
        (option) => option.id && option.id === question.correctOptionId,
      ),
      correctText: question.correctText ?? null,
      correctOrder: question.correctOrder ?? [],
      options: question.options.map((option) => ({
        text: option.text,
        order: option.order,
      })),
    })),
  };
}

async function ensureInitialContentRevision(input: {
  target: ContentRevisionTarget;
  actorId: string;
  status: ContentStatus;
  summary: string;
  snapshot: any;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  quizId?: string;
}) {
  const where =
    input.target === ContentRevisionTarget.course
      ? { target: input.target, courseId: input.courseId ?? null }
      : input.target === ContentRevisionTarget.module
        ? { target: input.target, moduleId: input.moduleId ?? null }
        : input.target === ContentRevisionTarget.lesson
          ? { target: input.target, lessonId: input.lessonId ?? null }
          : { target: input.target, quizId: input.quizId ?? null };

  const existing = await prisma.contentRevision.count({ where });
  if (existing > 0) return;

  await prisma.contentRevision.create({
    data: {
      id: `revision_${input.target}_${input.courseId ?? input.moduleId ?? input.lessonId ?? input.quizId}`,
      target: input.target,
      actorId: input.actorId,
      courseId: input.courseId ?? null,
      moduleId: input.moduleId ?? null,
      lessonId: input.lessonId ?? null,
      quizId: input.quizId ?? null,
      status: input.status,
      summary: input.summary,
      snapshot: input.snapshot,
    },
  });
}

function buildExcelCover() {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#203f3a"/>
          <stop offset="55%" stop-color="#45685d"/>
          <stop offset="100%" stop-color="#7fa18d"/>
        </linearGradient>
        <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ecf3ee"/>
          <stop offset="100%" stop-color="#d9e4de"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)"/>
      <g opacity="0.14" stroke="#d4eadf">
        <path d="M0 130h1200M0 250h1200M0 370h1200M0 490h1200M0 610h1200"/>
        <path d="M120 0v720M260 0v720M400 0v720M540 0v720M680 0v720M820 0v720M960 0v720M1100 0v720"/>
      </g>
      <rect x="122" y="130" width="620" height="280" rx="34" fill="url(#paper)" transform="rotate(-6 122 130)"/>
      <g opacity="0.22" stroke="#9ab4a8">
        <path d="M168 190h500M160 235h520M152 280h540M144 325h560"/>
        <path d="M205 150v250M300 138v255M395 126v260M490 114v265M585 102v270"/>
      </g>
      <g>
        <rect x="230" y="430" width="84" height="150" rx="14" fill="#8fd18d"/>
        <rect x="346" y="390" width="84" height="190" rx="14" fill="#9fdb95"/>
        <rect x="462" y="350" width="84" height="230" rx="14" fill="#b0e598"/>
        <rect x="578" y="305" width="84" height="275" rx="14" fill="#c4f1a0"/>
        <rect x="694" y="256" width="84" height="324" rx="14" fill="#ffd18f"/>
      </g>
      <rect x="198" y="582" width="620" height="18" rx="9" fill="#d7e4db" opacity="0.95"/>
      <rect x="848" y="210" width="138" height="138" rx="28" fill="#6aa38d" opacity="0.72"/>
      <text x="917" y="288" text-anchor="middle" font-size="72" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#edf7f2">%</text>
      <rect x="870" y="442" width="180" height="24" rx="12" fill="#f4b870" opacity="0.92" transform="rotate(-12 870 442)"/>
      <circle cx="1030" cy="126" r="14" fill="#d5f1a0" opacity="0.9"/>
      <circle cx="1082" cy="168" r="10" fill="#fff3b0" opacity="0.65"/>
      <circle cx="986" cy="178" r="8" fill="#ffe2b8" opacity="0.6"/>
    </svg>
  `);
}

function buildSqlFundamentalsCover() {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#071928"/>
          <stop offset="48%" stop-color="#0b3346"/>
          <stop offset="100%" stop-color="#10273f"/>
        </linearGradient>
        <linearGradient id="core" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#74ecff"/>
          <stop offset="100%" stop-color="#1f7ea4"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)"/>
      <g opacity="0.38">
        <ellipse cx="770" cy="182" rx="170" ry="44" fill="#5de7ff"/>
        <rect x="600" y="182" width="340" height="210" fill="url(#core)"/>
        <ellipse cx="770" cy="392" rx="170" ry="44" fill="#1c6c8b"/>
        <ellipse cx="770" cy="332" rx="210" ry="54" fill="#0d5674" opacity="0.72"/>
        <ellipse cx="770" cy="272" rx="236" ry="60" fill="#1498c8" opacity="0.55"/>
      </g>
      <g opacity="0.85">
        <ellipse cx="320" cy="470" rx="116" ry="30" fill="#2ad6ff"/>
        <rect x="204" y="470" width="232" height="116" fill="#0d4264"/>
        <ellipse cx="320" cy="586" rx="116" ry="30" fill="#09283f"/>
      </g>
      <g fill="#75f0ff" opacity="0.9">
        <circle cx="1038" cy="226" r="14"/>
        <circle cx="940" cy="424" r="10"/>
        <circle cx="515" cy="188" r="9"/>
        <circle cx="175" cy="268" r="7"/>
      </g>
      <g stroke="#ff9f43" stroke-width="10" stroke-linecap="round" opacity="0.9">
        <path d="M585 585c44-58 96-92 156-102"/>
        <path d="M812 458c60-7 114 4 169 30"/>
        <path d="M226 372c42 20 78 52 110 96"/>
      </g>
      <g fill="#102b46" opacity="0.95">
        <rect x="254" y="192" width="102" height="154" rx="20" fill="#10324d"/>
        <rect x="882" y="258" width="126" height="186" rx="26" fill="#113750"/>
      </g>
      <g fill="#8befff" opacity="0.95" font-family="Arial, Helvetica, sans-serif" font-weight="700">
        <text x="276" y="250" font-size="34">SELECT</text>
        <text x="276" y="292" font-size="28" opacity="0.7">FROM users</text>
        <text x="276" y="332" font-size="28" opacity="0.7">WHERE active</text>
        <text x="904" y="320" font-size="28">JOIN</text>
        <text x="904" y="360" font-size="24" opacity="0.7">ON id = user_id</text>
      </g>
    </svg>
  `);
}

function buildSqlIntermediateCover() {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#5a31ec"/>
          <stop offset="50%" stop-color="#7c41f1"/>
          <stop offset="100%" stop-color="#9b59ff"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)"/>
      <rect x="78" y="96" width="1044" height="528" rx="42" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.22)" stroke-width="4"/>
      <rect x="148" y="212" width="904" height="296" rx="32" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
      <text x="600" y="388" text-anchor="middle" font-size="128" font-family="Arial, Helvetica, sans-serif" font-weight="800" fill="#ffffff">SQL+</text>
      <g opacity="0.55" fill="#f7e8ff" font-family="Arial, Helvetica, sans-serif" font-weight="700">
        <text x="200" y="162" font-size="34">WINDOW</text>
        <text x="882" y="162" font-size="34">RANK()</text>
        <text x="218" y="572" font-size="28">GROUP BY</text>
        <text x="858" y="572" font-size="28">PARTITION</text>
      </g>
    </svg>
  `);
}

function buildPythonCover() {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#061f24"/>
          <stop offset="52%" stop-color="#0f3842"/>
          <stop offset="100%" stop-color="#17313f"/>
        </linearGradient>
        <radialGradient id="gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffec9b"/>
          <stop offset="100%" stop-color="#d8a738"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)"/>
      <g opacity="0.2" stroke="#69d4ff">
        <path d="M140 160c230 18 400 88 560 246"/>
        <path d="M330 620c162-164 350-268 560-312"/>
        <path d="M90 520c220-12 420 8 740 90"/>
      </g>
      <g fill="none" stroke="url(#gold)" stroke-width="26" opacity="0.96">
        <ellipse cx="515" cy="350" rx="220" ry="116" transform="rotate(-24 515 350)"/>
        <ellipse cx="600" cy="362" rx="190" ry="98" transform="rotate(26 600 362)"/>
        <ellipse cx="565" cy="334" rx="132" ry="62"/>
      </g>
      <g fill="#c9f3ff" opacity="0.7" font-family="Courier New, monospace" font-size="28">
        <text x="172" y="206">&lt;variables&gt;</text>
        <text x="814" y="214">def add(a, b):</text>
        <text x="860" y="254">return a + b</text>
        <text x="860" y="542">print(result)</text>
      </g>
      <circle cx="820" cy="120" r="14" fill="#fff0a8"/>
      <circle cx="894" cy="164" r="10" fill="#8de8ff"/>
      <circle cx="230" cy="562" r="12" fill="#f7d86a"/>
    </svg>
  `);
}

async function upsertRoles() {
  const roles: Array<{ type: UserRoleType; name: string }> = [
    { type: UserRoleType.student, name: 'Student' },
    { type: UserRoleType.instructor, name: 'Instructor' },
    { type: UserRoleType.admin, name: 'Admin' },
    { type: UserRoleType.content_manager, name: 'Content Manager' },
    { type: UserRoleType.super_admin, name: 'Super Admin' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { type: r.type },
      update: { name: r.name },
      create: { type: r.type, name: r.name },
    });
  }
}

async function upsertAchievementsAndBadges() {
  await prisma.achievement.upsert({
    where: { type: AchievementType.first_lesson_completed },
    update: { title: 'First Lesson Completed', xpReward: 25 },
    create: { type: AchievementType.first_lesson_completed, title: 'First Lesson Completed', xpReward: 25, description: 'Completed your first lesson.' },
  });
  await prisma.achievement.upsert({
    where: { type: AchievementType.first_quiz_passed },
    update: { title: 'First Quiz Passed', xpReward: 50 },
    create: { type: AchievementType.first_quiz_passed, title: 'First Quiz Passed', xpReward: 50, description: 'Passed your first quiz.' },
  });
  await prisma.achievement.upsert({
    where: { type: AchievementType.first_course_completed },
    update: { title: 'First Course Completed', xpReward: 150 },
    create: { type: AchievementType.first_course_completed, title: 'First Course Completed', xpReward: 150, description: 'Completed your first course.' },
  });

  const badges = [
    { key: 'first-lesson', title: 'Starter', description: 'Completed your first lesson.' },
    { key: 'first-quiz', title: 'Quiz Ace', description: 'Passed your first quiz.' },
    { key: 'first-course', title: 'Finisher', description: 'Completed your first course.' },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { key: b.key },
      update: { title: b.title, description: b.description },
      create: b,
    });
  }
}

async function upsertUsers() {
  const adminEmail = 'admin@skillforge.dev';
  const studentEmail = 'student@skillforge.dev';
  const instructorEmail = 'elena@skillforge.dev';

  const adminPass = 'Admin123!';
  const studentPass = 'Student123!';
  const instructorPass = 'Instructor123!';

  const [adminRole, studentRole, instructorRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { type: UserRoleType.admin } }),
    prisma.role.findUniqueOrThrow({ where: { type: UserRoleType.student } }),
    prisma.role.findUniqueOrThrow({ where: { type: UserRoleType.instructor } }),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      deletedAt: null,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        upsert: {
          update: {
            fullName: 'SkillForge Admin',
            interests: ['sql', 'excel', 'python'],
          },
          create: {
            fullName: 'SkillForge Admin',
            interests: ['sql', 'excel', 'python'],
          },
        },
      },
    },
    create: {
      email: adminEmail,
      passwordHash: await argon2.hash(adminPass),
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      profile: { create: { fullName: 'SkillForge Admin', interests: ['sql', 'excel', 'python'] } },
      roles: { create: [{ roleId: adminRole.id }] },
    },
    include: { profile: true },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      deletedAt: null,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        upsert: {
          update: {
            fullName: 'Demo Student',
            interests: ['sql', 'excel'],
          },
          create: {
            fullName: 'Demo Student',
            interests: ['sql', 'excel'],
          },
        },
      },
    },
    create: {
      email: studentEmail,
      passwordHash: await argon2.hash(studentPass),
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      profile: { create: { fullName: 'Demo Student', interests: ['sql', 'excel'] } },
      roles: { create: [{ roleId: studentRole.id }] },
    },
    include: { profile: true },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: studentUser.id,
        roleId: studentRole.id,
      },
    },
    update: {},
    create: {
      userId: studentUser.id,
      roleId: studentRole.id,
    },
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: instructorEmail },
    update: {
      deletedAt: null,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        upsert: {
          update: {
            fullName: 'Elena Rodriguez',
            interests: ['excel', 'productivity', 'analytics'],
          },
          create: {
            fullName: 'Elena Rodriguez',
            interests: ['excel', 'productivity', 'analytics'],
          },
        },
      },
    },
    create: {
      email: instructorEmail,
      passwordHash: await argon2.hash(instructorPass),
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          fullName: 'Elena Rodriguez',
          interests: ['excel', 'productivity', 'analytics'],
        },
      },
      roles: {
        create: [{ roleId: studentRole.id }, { roleId: instructorRole.id }],
      },
    },
    include: { profile: true },
  });
  for (const roleId of [studentRole.id, instructorRole.id]) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: instructorUser.id,
          roleId,
        },
      },
      update: {},
      create: {
        userId: instructorUser.id,
        roleId,
      },
    });
  }

  return { adminUser, studentUser, instructorUser };
}

async function upsertSiteSurfaces() {
  const surfaces = [
    {
      slug: 'home',
      title: 'Master New Skills with [[AI-Powered]] Learning',
      eyebrow: 'Guided AI learning',
      description:
        'Build real skills through guided courses, compact modules, and AI help that stays close to what learners are studying.',
      body: 'Learn through practical lessons, guided modules, and a cleaner flow that keeps progress, support, and course content in one place.',
      bullets: [
        'Start with focused courses built around practical outcomes.',
        'Move through modules, checkpoints, and course milestones with less friction.',
        'Use AI support when you need a simpler explanation or another example.',
        'Keep your catalog, progress, and next steps in one consistent experience.',
      ],
      cards: [
        {
          type: 'hero_media',
          imageUrl:
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
          imageAlt: 'A small team of learners collaborating around a laptop during a guided lesson session',
          badgeLabel: 'Course progress',
          badgeValue: '87%',
          floatingLabel: 'Guided session',
          captionEyebrow: 'Project-based learning',
          captionText:
            'Students learn together through short guided modules, practical tasks, and AI-supported coaching that stays close to the course content.',
        },
        {
          type: 'social_proof',
          prefix: 'Joined by',
          value: '3',
          suffix: 'active learners on SkillForge',
          avatars: [
            {
              name: 'Maya Hassan',
              avatarUrl: 'https://i.pravatar.cc/100?img=32',
              color: '#ffd4b7',
            },
            {
              name: 'Karim Adel',
              avatarUrl: 'https://i.pravatar.cc/100?img=12',
              color: '#b0d9ff',
            },
            {
              name: 'Salma Tarek',
              avatarUrl: 'https://i.pravatar.cc/100?img=5',
              color: '#f8e4a7',
            },
          ],
        },
      ],
      primaryCtaLabel: 'Start Learning Free',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'See how it works',
      secondaryCtaHref: '#how-it-works',
    },
    {
      slug: 'community',
      title: 'Connect with the SkillForge community',
      eyebrow: 'Community hub',
      description:
        'Join learners, mentors, and builders who share progress, questions, and ideas as they move through their courses.',
      body: 'Use this space to follow study groups, see useful updates, and stay close to learners working toward similar goals.',
      bullets: [
        'Follow group activity and stay close to other learners working on similar goals.',
        'See discussion highlights, shared wins, and mentor-led conversation threads in one place.',
        'Keep track of events, Q&A sessions, and practical prompts that make learning feel social.',
        'Move from course work into peer support without losing your place or momentum.',
      ],
      cards: [
        {
          icon: 'workflow',
          title: 'Study groups',
          description: 'Explore group spaces built around shared goals, pacing, and accountability.',
        },
        {
          icon: 'bot',
          title: 'Mentor replies',
          description: 'Find guidance and useful replies that help conversations stay practical and on-topic.',
        },
        {
          icon: 'clock3',
          title: 'Activity feed',
          description: 'Follow upcoming events, updates, and shared learner activity in one visible stream.',
        },
      ],
      primaryCtaLabel: 'Browse courses',
      primaryCtaHref: '/courses',
      secondaryCtaLabel: 'See pricing',
      secondaryCtaHref: '/pricing',
    },
    {
      slug: 'methodology',
      title: 'How SkillForge helps learners make progress',
      eyebrow: 'Methodology',
      description:
        'Our learning model combines short modules, clear checkpoints, and timely AI support so learners can build skill without getting lost.',
      body: 'This page explains the thinking behind pacing, practice, review, and guided support across the platform.',
      bullets: [
        'Short lessons make it easier to keep momentum and finish what you start.',
        'Checkpoints help learners confirm understanding before moving ahead.',
        'AI support stays close to the course context instead of drifting into generic advice.',
        'Progression rules keep roadmaps clear and make the next step easy to spot.',
      ],
      cards: [
        {
          icon: 'layers3',
          title: 'Curriculum flow',
          description: 'Understand how modules, sequencing, and checkpoints work together.',
        },
        {
          icon: 'sparkles',
          title: 'AI coaching',
          description: 'See how the tutor explains, quizzes, and supports learners inside each course.',
        },
        {
          icon: 'target',
          title: 'Learning outcomes',
          description: 'See what each path is designed to build and how progress is measured.',
        },
      ],
      primaryCtaLabel: 'View courses',
      primaryCtaHref: '/courses',
      secondaryCtaLabel: 'Explore learning path',
      secondaryCtaHref: '/learning-path',
    },
    {
      slug: 'learning-path',
      title: 'Learning paths that keep progress clear',
      eyebrow: 'Learning paths',
      description:
        'Follow a guided route from course to course, track milestones, and see what to tackle next with less guesswork.',
      body: 'Learning paths help learners stay focused, keep the next step visible, and connect day-to-day effort to a bigger goal.',
      bullets: [
        'Stay oriented with a clear sequence of milestones and checkpoints.',
        'See the next recommended step based on what you have already finished.',
        'Track completion across courses instead of managing each one in isolation.',
        'Keep long-term goals visible while still making daily progress.',
      ],
      cards: [
        {
          icon: 'map',
          title: 'Path structure',
          description: 'See how courses and milestones connect across a broader learning goal.',
        },
        {
          icon: 'award',
          title: 'Milestones',
          description: 'Track checkpoints, unlocks, and course completion across the path.',
        },
        {
          icon: 'rocket',
          title: 'Next step',
          description: 'Get a clearer recommendation on what to learn next based on recent progress.',
        },
      ],
      primaryCtaLabel: 'Browse course catalog',
      primaryCtaHref: '/courses',
      secondaryCtaLabel: 'See certificates',
      secondaryCtaHref: '/certificates',
    },
    {
      slug: 'certificates',
      title: 'Certificates that reflect completed work',
      eyebrow: 'Certificates',
      description:
        'Track course completion, milestone readiness, and the records learners can keep as they finish structured paths.',
      body: 'Certificates help learners keep a clear record of what they completed and where they demonstrated strong progress.',
      bullets: [
        'Track completion progress across courses and guided paths.',
        'Keep completion records tied to real learner activity and milestones.',
        'Make finished work easier to show, revisit, and organize later.',
        'Use one place for certificate history, status, and learner records.',
      ],
      cards: [
        {
          icon: 'award',
          title: 'Completion records',
          description: 'Keep a record of finished work and what each learner has completed.',
        },
        {
          icon: 'shield',
          title: 'Verification',
          description: 'Keep completion records organized and ready to support trusted, shareable proof.',
        },
        {
          icon: 'briefcase',
          title: 'Career profile',
          description: 'Help learners organize finished work in a way that supports career opportunities.',
        },
      ],
      primaryCtaLabel: 'See learning paths',
      primaryCtaHref: '/learning-path',
      secondaryCtaLabel: 'Browse courses',
      secondaryCtaHref: '/courses',
    },
    {
      slug: 'support',
      title: 'Support that helps learners keep moving',
      eyebrow: 'Support center',
      description:
        'Find answers, troubleshooting help, and the right next step when something interrupts your learning flow.',
      body: 'Support covers account questions, course access, billing help, and the practical issues that interrupt learning.',
      bullets: [
        'Browse helpful articles and practical answers in one place.',
        'Reach out for course, account, or billing support when you need it.',
        'Follow important notices and platform updates without hunting for them.',
        'Get back to learning faster with clearer troubleshooting guidance.',
      ],
      cards: [
        {
          icon: 'shield',
          title: 'Contact support',
          description: 'Start a support request and keep track of what needs attention.',
        },
        {
          icon: 'workflow',
          title: 'Help articles',
          description: 'Browse troubleshooting guides and onboarding answers without leaving the platform.',
        },
        {
          icon: 'clock3',
          title: 'Service updates',
          description: 'See important notices and current platform updates in one clear place.',
        },
      ],
      primaryCtaLabel: 'Browse courses',
      primaryCtaHref: '/courses',
      secondaryCtaLabel: 'View pricing',
      secondaryCtaHref: '/pricing',
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy policy',
      eyebrow: 'Legal',
      description:
        'Review how SkillForge handles account information, learning progress, and product data across the platform.',
      body: 'This page keeps privacy expectations, data scope, and policy details in one clear and consistent place.',
      bullets: [
        'Understand what information is collected and how it is used.',
        'Review how account, progress, and product data are handled.',
        'See policy updates and effective dates in one place.',
        'Keep legal information easy to find whenever you need it.',
      ],
      cards: [
        {
          icon: 'shield',
          title: 'Policy updates',
          description: 'Review revisions, effective dates, and the latest version of the policy.',
        },
        {
          icon: 'briefcase',
          title: 'Data scope',
          description: 'Understand the kinds of account and learning data that support the product experience.',
        },
        {
          icon: 'award',
          title: 'Privacy details',
          description: 'Keep privacy expectations, responsibilities, and references easy to review.',
        },
      ],
      primaryCtaLabel: 'Open support',
      primaryCtaHref: '/support',
      secondaryCtaLabel: 'Back home',
      secondaryCtaHref: '/',
    },
    {
      slug: 'terms-of-service',
      title: 'Terms of service',
      eyebrow: 'Legal',
      description:
        'Review the core rules for using SkillForge, including account access, course use, and billing expectations.',
      body: 'This page keeps the platform terms organized in one place so learners always know where to look.',
      bullets: [
        'Review the rules that guide account use and course access.',
        'Keep billing, subscription, and platform expectations easy to review.',
        'See the current terms and any updates in one dedicated place.',
        'Use one destination for the legal details that matter most to learners.',
      ],
      cards: [
        {
          icon: 'briefcase',
          title: 'Usage rules',
          description: 'Review the expectations that guide learner, mentor, and admin activity on the platform.',
        },
        {
          icon: 'layers3',
          title: 'Billing terms',
          description: 'See how subscriptions, refunds, and access boundaries are handled.',
        },
        {
          icon: 'shield',
          title: 'Agreement history',
          description: 'Keep track of the latest terms version and important updates over time.',
        },
      ],
      primaryCtaLabel: 'Open privacy policy',
      primaryCtaHref: '/privacy-policy',
      secondaryCtaLabel: 'Open support',
      secondaryCtaHref: '/support',
    },
  ];

  for (const surface of surfaces) {
    await prisma.siteSurface.upsert({
      where: { slug: surface.slug },
      update: {
        title: surface.title,
        eyebrow: surface.eyebrow,
        description: surface.description,
        body: surface.body,
        bullets: surface.bullets,
        cards: surface.cards as any,
        primaryCtaLabel: surface.primaryCtaLabel,
        primaryCtaHref: surface.primaryCtaHref,
        secondaryCtaLabel: surface.secondaryCtaLabel,
        secondaryCtaHref: surface.secondaryCtaHref,
        status: ContentStatus.published,
      },
      create: {
        id: `site_surface_${surface.slug}`,
        updatedAt: new Date(),
        slug: surface.slug,
        title: surface.title,
        eyebrow: surface.eyebrow,
        description: surface.description,
        body: surface.body,
        bullets: surface.bullets,
        cards: surface.cards as any,
        primaryCtaLabel: surface.primaryCtaLabel,
        primaryCtaHref: surface.primaryCtaHref,
        secondaryCtaLabel: surface.secondaryCtaLabel,
        secondaryCtaHref: surface.secondaryCtaHref,
        status: ContentStatus.published,
      },
    });
  }
}

async function seedContent(actorId: string, users: { instructorUser: { id: string } }) {
  const skills = [
    { title: 'Excel Basics', description: 'Spreadsheets, formulas, and practical workflows.' },
    { title: 'SQL Fundamentals', description: 'Query data with confidence using SQL.' },
    { title: 'Python Basics', description: 'Core Python programming for real tasks.' },
  ];

  const skillRecords = await Promise.all(
    skills.map((s, order) =>
      prisma.skill.upsert({
        where: { slug: slugify(s.title) },
        update: { title: s.title, description: s.description, status: ContentStatus.published, order },
        create: { title: s.title, slug: slugify(s.title), description: s.description, status: ContentStatus.published, order },
      }),
    ),
  );

  const instructors = [
    {
      fullName: 'Elena Rodriguez',
      slug: 'elena-rodriguez',
      title: 'Excel Productivity Coach',
      bio: 'Helps learners build confidence in spreadsheets, reporting, and day-to-day Excel workflows.',
      avatarUrl: 'https://i.pravatar.cc/200?img=45',
      order: 0,
    },
    {
      fullName: 'Prof. Marcus Thorne',
      slug: 'prof-marcus-thorne',
      title: 'SQL Analytics Instructor',
      bio: 'Teaches practical SQL through real datasets, query reviews, and business-facing reporting examples.',
      avatarUrl: 'https://i.pravatar.cc/200?img=15',
      order: 1,
    },
    {
      fullName: 'Dr. Sarah Chen',
      slug: 'dr-sarah-chen',
      title: 'Python Foundations Mentor',
      bio: 'Breaks Python concepts into small mental models that make beginner lessons easier to retain.',
      avatarUrl: 'https://i.pravatar.cc/200?img=32',
      order: 2,
    },
  ];

  const mediaAssets = [
    ...instructors.map((instructor) => ({
      title: `${instructor.fullName} Avatar`,
      url: instructor.avatarUrl,
      altText: `${instructor.fullName} profile portrait`,
      type: 'image',
      sourceType: 'external',
      mimeType: null,
    })),
    {
      title: 'Excel Foundations Cover',
      url: buildExcelCover(),
      altText: 'Excel course cover showing a stylized dashboard, sheet, and bar chart composition',
      type: 'image',
      sourceType: 'generated',
      mimeType: 'image/svg+xml',
    },
    {
      title: 'SQL Fundamentals Cover',
      url: buildSqlFundamentalsCover(),
      altText: 'SQL fundamentals cover with a database-inspired blue interface and query blocks',
      type: 'image',
      sourceType: 'generated',
      mimeType: 'image/svg+xml',
    },
    {
      title: 'SQL Intermediate Cover',
      url: buildSqlIntermediateCover(),
      altText: 'Purple SQL intermediate course cover featuring SQL+ typography and analytics motifs',
      type: 'image',
      sourceType: 'generated',
      mimeType: 'image/svg+xml',
    },
    {
      title: 'Python Basics Cover',
      url: buildPythonCover(),
      altText: 'Python basics cover with abstract loops and code fragments on a dark teal background',
      type: 'image',
      sourceType: 'generated',
      mimeType: 'image/svg+xml',
    },
    {
      title: 'Module Walkthrough Demo',
      url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
      altText: 'Short sample walkthrough video for module intros',
      type: 'video',
      sourceType: 'external',
      mimeType: 'video/mp4',
      durationSeconds: 5,
    },
  ] as const;

  const mediaAssetRecords = await Promise.all(
    mediaAssets.map((asset, index) =>
      prisma.mediaAsset.upsert({
        where: { url: asset.url },
        update: {
          title: asset.title,
          altText: asset.altText,
          type: asset.type,
          sourceType: asset.sourceType,
          mimeType: asset.mimeType,
          durationSeconds: 'durationSeconds' in asset ? asset.durationSeconds ?? null : null,
          status: ContentStatus.published,
          deletedAt: null,
        },
        create: {
          id: `media_asset_${index + 1}`,
          updatedAt: new Date(),
          ...asset,
          durationSeconds: 'durationSeconds' in asset ? asset.durationSeconds ?? null : null,
          status: ContentStatus.published,
        },
      }),
    ),
  );

  const instructorRecords = await Promise.all(
    instructors.map((instructor, index) =>
      prisma.instructor.upsert({
        where: { slug: instructor.slug },
        update: {
          fullName: instructor.fullName,
          title: instructor.title,
          bio: instructor.bio,
          avatarUrl: instructor.avatarUrl,
          avatarAssetId:
            mediaAssetRecords.find((record) => record.title === `${instructor.fullName} Avatar`)?.id ?? null,
          userId: instructor.slug === 'elena-rodriguez' ? users.instructorUser.id : null,
          order: instructor.order,
          status: ContentStatus.published,
          deletedAt: null,
        },
        create: {
          id: `instructor_${index + 1}`,
          updatedAt: new Date(),
          ...instructor,
          avatarAssetId:
            mediaAssetRecords.find((record) => record.title === `${instructor.fullName} Avatar`)?.id ?? null,
          userId: instructor.slug === 'elena-rodriguez' ? users.instructorUser.id : null,
          status: ContentStatus.published,
        },
      }),
    ),
  );

  const courses: any[] = [
    {
      title: 'Excel Foundations: Formulas & Tables',
      description:
        'Build a practical Excel foundation from cells and references to tables, sorting, filtering, and the roadmap toward formulas, charts, and advanced modeling.',
      instructorSlug: 'elena-rodriguez',
      coverAssetTitle: 'Excel Foundations Cover',
      coverImageUrl: buildExcelCover(),
      difficulty: CourseDifficulty.beginner,
      tags: ['excel', 'productivity'],
      skillSlug: 'excel-basics',
      modules: [
        {
          title: 'Getting Comfortable',
          description:
            'Learn the basics of Excel, including understanding cells, ranges, formulas, and the difference between relative and absolute references.',
          introVideoAssetTitle: 'Module Walkthrough Demo',
          lessons: [
            {
              title: 'Cells vs Ranges',
              learningObjective:
                'Understand what cells and ranges are, how they differ, and how Excel identifies them.',
              estimatedMinutes: 12,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Cells vs Ranges' } },
                {
                  type: LessonBlockType.paragraph,
                  content: {
                    text: 'A cell is the smallest building block in Excel and stores one value at a specific address such as A1 or B2. A range is a collection of cells grouped together, such as A1:B5.',
                  },
                },
                {
                  type: LessonBlockType.bullet_list,
                  content: {
                    items: [
                      'Cells store a single value or formula.',
                      'Ranges describe a block of nearby cells.',
                      'Addresses help Excel know exactly where to read or write data.',
                    ],
                  },
                },
                {
                  type: LessonBlockType.example,
                  content: {
                    title: 'Examples',
                    text: 'Cell reference: A1. Range reference: A1:B5. You can select a range by clicking and dragging or by typing it directly in the name box or formula bar.',
                  },
                },
                {
                  type: LessonBlockType.callout,
                  content: {
                    variant: 'tip',
                    text: 'When someone says “work on A1:B3,” they mean all cells inside that rectangle, including A1, A2, A3, B1, B2, and B3.',
                  },
                },
                {
                  type: LessonBlockType.recap,
                  content: {
                    bullets: [
                      'A1 is a single cell.',
                      'A1:B5 is a range.',
                      'Knowing addresses is the first step to writing formulas.',
                    ],
                  },
                },
              ],
            },
            {
              title: 'Cell References in Formulas',
              learningObjective:
                'Use cell references inside formulas and understand how Excel calculates based on those references.',
              estimatedMinutes: 14,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Cell References in Formulas' } },
                {
                  type: LessonBlockType.paragraph,
                  content: {
                    text: 'Excel formulas always begin with an equals sign. Instead of typing numbers directly every time, you can point to cells so the result updates automatically when the data changes.',
                  },
                },
                {
                  type: LessonBlockType.code_block,
                  content: {
                    language: 'excel',
                    code: '=A1 + B1',
                  },
                },
                {
                  type: LessonBlockType.example,
                  content: {
                    title: 'Worked example',
                    text: 'If A1 contains 12 and B1 contains 8, then =A1 + B1 returns 20. If B1 changes to 10, the result automatically updates to 22.',
                  },
                },
                {
                  type: LessonBlockType.callout,
                  content: {
                    variant: 'tip',
                    text: 'To quickly copy a formula into nearby cells, drag the small square at the bottom-right corner of the selected cell.',
                  },
                },
                {
                  type: LessonBlockType.recap,
                  content: {
                    bullets: [
                      'Every Excel formula starts with =.',
                      'Cell references keep calculations dynamic.',
                      'When source values change, formulas recalculate automatically.',
                    ],
                  },
                },
              ],
            },
            {
              title: 'Relative vs Absolute References',
              learningObjective:
                'Know when a reference should change as you copy a formula and when it must stay fixed.',
              estimatedMinutes: 16,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Relative vs Absolute References' } },
                {
                  type: LessonBlockType.paragraph,
                  content: {
                    text: 'Relative references change when you copy a formula to another cell. Absolute references stay fixed. This is one of the most important ideas in Excel because it affects whether copied formulas behave correctly.',
                  },
                },
                {
                  type: LessonBlockType.bullet_list,
                  content: {
                    items: [
                      'Relative reference example: A1',
                      'Absolute reference example: $A$1',
                      'Use F4 while editing a formula to toggle reference modes quickly.',
                    ],
                  },
                },
                {
                  type: LessonBlockType.code_block,
                  content: {
                    language: 'excel',
                    code: '=A1 + B1\n=$A$1 + $B$1',
                  },
                },
                {
                  type: LessonBlockType.example,
                  content: {
                    title: 'Practice idea',
                    text: 'Write a formula that adds A1 and A2. Then create another formula that always adds $A$1 to B1 so the A1 reference stays fixed while copying across columns.',
                  },
                },
                {
                  type: LessonBlockType.checkpoint_intro,
                  content: {
                    text: 'Checkpoint: answer the quiz below to unlock the next module in the roadmap.',
                  },
                },
                {
                  type: LessonBlockType.recap,
                  content: {
                    bullets: [
                      'Relative references move when copied.',
                      'Absolute references stay fixed.',
                      'Use absolute references when one value must remain constant across many formulas.',
                    ],
                  },
                },
              ],
              quiz: {
                passingScore: 70,
                questions: [
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 1,
                    prompt: 'What does the reference A1 represent?',
                    explanation: 'A1 points to one specific cell: column A, row 1.',
                    options: [
                      { text: 'A single cell' },
                      { text: 'A range of cells' },
                      { text: 'A formula' },
                      { text: 'A constant value' },
                    ],
                    correctIndex: 0,
                  },
                  {
                    type: QuestionType.true_false,
                    difficulty: 1,
                    prompt: 'Excel formulas typically start with an equal sign (=).',
                    explanation: 'Excel recognizes formulas because they begin with =.',
                    options: [{ text: 'True' }, { text: 'False' }],
                    correctIndex: 0,
                  },
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 2,
                    prompt: 'Which of the following is an example of an absolute reference in Excel?',
                    explanation: 'Absolute references lock both the column and row using dollar signs.',
                    options: [{ text: 'A1' }, { text: '$A$1' }, { text: 'A$1' }, { text: 'B1' }],
                    correctIndex: 1,
                  },
                ],
              },
            },
          ],
        },
        {
          title: 'Data Organization',
          description:
            'Organize large data sets with tables, sorting, filtering, and structured references so your sheets stay readable and analysis-ready.',
          introVideoAssetTitle: 'Module Walkthrough Demo',
          lessons: [
            {
              title: 'Creating and Formatting Tables',
              learningObjective:
                'Turn plain ranges into Excel tables and understand why tables make data easier to manage.',
              estimatedMinutes: 12,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Creating and Formatting Tables' } },
                {
                  type: LessonBlockType.paragraph,
                  content: {
                    text: 'Excel tables add built-in structure to your data. They make formatting, formulas, sorting, and filtering more reliable and easier to work with over time.',
                  },
                },
                {
                  type: LessonBlockType.bullet_list,
                  content: {
                    items: [
                      'Select the data range and press Ctrl + T to create a table.',
                      'Tables automatically add headers and filtering controls.',
                      'Formatting stays consistent as your data grows.',
                    ],
                  },
                },
                {
                  type: LessonBlockType.example,
                  content: {
                    title: 'Example table',
                    text: 'Create a product table with columns such as Product Name, Quantity, and Price. Once formatted as a table, Excel gives each column a clear structure.',
                  },
                },
                {
                  type: LessonBlockType.recap,
                  content: {
                    bullets: [
                      'Tables make data easier to manage.',
                      'Ctrl + T is the fastest way to create a table.',
                      'Headers and filters are built into the table structure.',
                    ],
                  },
                },
              ],
            },
            {
              title: 'Sorting and Filtering Data',
              learningObjective:
                'Sort rows and apply filters to focus on only the data that matters for a given task.',
              estimatedMinutes: 13,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Sorting and Filtering Data' } },
                {
                  type: LessonBlockType.paragraph,
                  content: {
                    text: 'Sorting changes the order of rows based on one or more columns. Filtering hides rows that do not match your criteria so you can focus on a subset of the data.',
                  },
                },
                {
                  type: LessonBlockType.example,
                  content: {
                    title: 'Examples',
                    text: 'Sort a list of products by Price from lowest to highest. Then apply a filter to display only products where Quantity is greater than 10.',
                  },
                },
                {
                  type: LessonBlockType.callout,
                  content: {
                    variant: 'tip',
                    text: 'When sorting, always work inside a properly formatted table so related data moves together and rows do not become misaligned.',
                  },
                },
                {
                  type: LessonBlockType.recap,
                  content: {
                    bullets: [
                      'Sorting reorders rows.',
                      'Filtering temporarily hides rows.',
                      'Both are essential for quick analysis and decision-making.',
                    ],
                  },
                },
              ],
            },
            {
              title: 'Structured References in Tables',
              learningObjective:
                'Write easier-to-read formulas by referencing table columns by name instead of raw cell addresses.',
              estimatedMinutes: 15,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Structured References in Tables' } },
                {
                  type: LessonBlockType.paragraph,
                  content: {
                    text: 'A structured reference refers to a table column by its name. This makes formulas easier to read, maintain, and explain to other people working in the same sheet.',
                  },
                },
                {
                  type: LessonBlockType.code_block,
                  content: {
                    language: 'excel',
                    code: '=SUM(Table1[Price])',
                  },
                },
                {
                  type: LessonBlockType.example,
                  content: {
                    title: 'Practice exercise',
                    text: 'Create a table to track Product Name, Price, and Stock Level. Then write a formula that sums the entire Price column using a structured reference.',
                  },
                },
                {
                  type: LessonBlockType.checkpoint_intro,
                  content: {
                    text: 'Checkpoint: pass this module quiz to unlock the next Excel roadmap stage.',
                  },
                },
                {
                  type: LessonBlockType.recap,
                  content: {
                    bullets: [
                      'Structured references use column names instead of addresses.',
                      'They make formulas easier to read.',
                      'They work best when your data is stored in tables.',
                    ],
                  },
                },
              ],
              quiz: {
                passingScore: 70,
                questions: [
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 1,
                    prompt: 'How do you filter data in an Excel table?',
                    explanation: 'Filtering is done from the drop-down menu in the column header.',
                    options: [
                      { text: 'Use conditional formatting' },
                      { text: 'Click the filter drop-down menu in the column header' },
                      { text: 'Use the Sort function only' },
                      { text: 'None of the above' },
                    ],
                    correctIndex: 1,
                  },
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 1,
                    prompt: 'What is a structured reference in Excel?',
                    explanation: 'A structured reference uses table and column names, not just raw cell addresses.',
                    options: [
                      { text: 'A reference to a range using cell addresses' },
                      { text: 'A reference to table columns by their name' },
                      { text: 'A reference to one specific cell only' },
                      { text: 'None of the above' },
                    ],
                    correctIndex: 1,
                  },
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 2,
                    prompt: 'Which of the following is true about Excel tables?',
                    explanation: 'Table data can be referenced by column names, which is one of their biggest advantages.',
                    options: [
                      { text: 'Tables automatically sort data at all times' },
                      { text: 'Tables cannot be filtered' },
                      { text: 'Table data is referenced by column names' },
                      { text: 'Tables do not allow formatting' },
                    ],
                    correctIndex: 2,
                  },
                ],
              },
            },
          ],
        },
        {
          title: 'Formulas & Functions',
          description:
            'Coming soon: use built-in Excel functions such as SUM, AVERAGE, IF, and VLOOKUP, and learn how to combine them into stronger business formulas.',
          lessons: [],
        },
        {
          title: 'Data Visualization',
          description:
            'Coming soon: create charts, graphs, and pivot tables, and learn how to choose the right visual format for each dataset.',
          lessons: [],
        },
        {
          title: 'Advanced Excel Techniques',
          description:
            'Coming soon: explore advanced formulas, automation, and Excel analysis tools used in business and financial workflows.',
          lessons: [],
        },
      ],
    },
    {
      title: 'SQL Fundamentals: SELECT to JOIN',
      description: 'Build query skills step-by-step using real datasets.',
      instructorSlug: 'prof-marcus-thorne',
      coverAssetTitle: 'SQL Fundamentals Cover',
      coverImageUrl: buildSqlFundamentalsCover(),
      difficulty: CourseDifficulty.beginner,
      tags: ['sql', 'data'],
      skillSlug: 'sql-fundamentals',
      modules: [
        {
          title: 'Core Querying',
          introVideoAssetTitle: 'Module Walkthrough Demo',
          lessons: [
            {
              title: 'SELECT and WHERE',
              learningObjective: 'Write a basic SELECT query and filter rows with WHERE.',
              estimatedMinutes: 10,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'SELECT and WHERE' } },
                { type: LessonBlockType.paragraph, content: { text: 'SELECT chooses columns. WHERE filters rows.' } },
                { type: LessonBlockType.code_block, content: { language: 'sql', code: 'SELECT name, email FROM users WHERE is_active = true;' } },
                { type: LessonBlockType.example, content: { title: 'Mini exercise', text: 'Modify the query to select only email for users where plan = \"pro\".' } },
              ],
              quiz: {
                passingScore: 70,
                questions: [
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 1,
                    prompt: 'What does the WHERE clause do?',
                    explanation: 'WHERE filters rows that match a condition.',
                    options: [{ text: 'Sorts the results' }, { text: 'Filters the rows' }, { text: 'Renames columns' }],
                    correctIndex: 1,
                  },
                  {
                    type: QuestionType.true_false,
                    difficulty: 1,
                    prompt: 'SELECT * returns all columns from a table.',
                    explanation: 'The asterisk means “all columns”.',
                    options: [{ text: 'True' }, { text: 'False' }],
                    correctIndex: 0,
                  },
                ],
              },
            },
            {
              title: 'JOIN Basics',
              learningObjective: 'Combine rows from related tables using JOIN and an ON condition.',
              estimatedMinutes: 12,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'JOIN Basics' } },
                { type: LessonBlockType.paragraph, content: { text: 'JOIN combines rows from two tables using a relationship.' } },
                { type: LessonBlockType.code_block, content: { language: 'sql', code: 'SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id;' } },
                { type: LessonBlockType.callout, content: { variant: 'tip', text: 'Start by writing the FROM table, then JOIN the second table, and always sanity-check row counts.' } },
              ],
              quiz: {
                passingScore: 70,
                questions: [
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 2,
                    prompt: 'What does the ON clause define in a JOIN?',
                    explanation: 'ON defines how rows from two tables match (the join condition).',
                    options: [{ text: 'Which columns to select' }, { text: 'How to match rows between tables' }, { text: 'How to sort results' }],
                    correctIndex: 1,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      title: 'SQL Intermediate: Aggregations & Window Functions',
      description: 'Level up: group data, compute metrics, and rank results with windows.',
      instructorSlug: 'prof-marcus-thorne',
      coverAssetTitle: 'SQL Intermediate Cover',
      coverImageUrl: buildSqlIntermediateCover(),
      difficulty: CourseDifficulty.intermediate,
      tags: ['sql', 'analytics'],
      skillSlug: 'sql-fundamentals',
      modules: [
        {
          title: 'Aggregations that matter',
          introVideoAssetTitle: 'Module Walkthrough Demo',
          lessons: [
            {
              title: 'GROUP BY and HAVING',
              learningObjective: 'Aggregate rows with GROUP BY and filter groups with HAVING.',
              estimatedMinutes: 14,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'GROUP BY and HAVING' } },
                { type: LessonBlockType.paragraph, content: { text: 'GROUP BY collapses rows into groups. HAVING filters groups after aggregation.' } },
                { type: LessonBlockType.code_block, content: { language: 'sql', code: 'SELECT plan, COUNT(*) AS users\\nFROM users\\nGROUP BY plan\\nHAVING COUNT(*) >= 10;' } },
                { type: LessonBlockType.recap, content: { bullets: ['WHERE filters rows', 'HAVING filters groups', 'Aggregates: COUNT/SUM/AVG'] } },
              ],
              quiz: {
                passingScore: 70,
                questions: [
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 2,
                    prompt: 'When do you use HAVING instead of WHERE?',
                    explanation: 'HAVING filters after aggregation; WHERE filters before.',
                    options: [{ text: 'To filter groups based on aggregate results' }, { text: 'To rename columns' }, { text: 'To sort rows' }],
                    correctIndex: 0,
                  },
                ],
              },
            },
            {
              title: 'Window functions: ROW_NUMBER()',
              learningObjective: 'Rank rows within a partition using ROW_NUMBER() OVER (...).',
              estimatedMinutes: 16,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Window functions: ROW_NUMBER()' } },
                { type: LessonBlockType.paragraph, content: { text: 'Window functions keep row-level detail while computing over a “window” of rows.' } },
                { type: LessonBlockType.code_block, content: { language: 'sql', code: 'SELECT user_id, created_at,\\n  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn\\nFROM events;' } },
                { type: LessonBlockType.callout, content: { variant: 'tip', text: 'A good mental model: GROUP BY reduces rows; windows annotate rows.' } },
              ],
              quiz: {
                passingScore: 70,
                questions: [
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 3,
                    prompt: 'What does PARTITION BY do in a window function?',
                    explanation: 'It resets the window calculation for each partition (group) of rows.',
                    options: [{ text: 'Sorts the entire result set' }, { text: 'Groups rows for window calculations' }, { text: 'Filters rows before SELECT' }],
                    correctIndex: 1,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      title: 'Python Basics: Variables to Functions',
      description: 'Learn Python fundamentals with tiny hands-on exercises.',
      instructorSlug: 'dr-sarah-chen',
      coverAssetTitle: 'Python Basics Cover',
      coverImageUrl: buildPythonCover(),
      difficulty: CourseDifficulty.beginner,
      tags: ['python', 'programming'],
      skillSlug: 'python-basics',
      modules: [
        {
          title: 'Getting Started',
          introVideoAssetTitle: 'Module Walkthrough Demo',
          lessons: [
            {
              title: 'Variables and Types',
              learningObjective: 'Store values in variables and recognize common Python types.',
              estimatedMinutes: 10,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Variables and Types' } },
                { type: LessonBlockType.paragraph, content: { text: 'Variables store values. Types describe what kind of value it is (int, str, bool, ...).' } },
                { type: LessonBlockType.code_block, content: { language: 'python', code: "x = 3\\nname = 'Amina'\\nis_active = True" } },
              ],
              quiz: {
                passingScore: 70,
                questions: [
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 1,
                    prompt: 'Which of these is a boolean value in Python?',
                    explanation: 'Booleans are True/False in Python.',
                    options: [{ text: '"true"' }, { text: 'True' }, { text: '1' }],
                    correctIndex: 1,
                  },
                ],
              },
            },
            {
              title: 'Functions',
              learningObjective: 'Write a function and call it with arguments.',
              estimatedMinutes: 12,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Functions' } },
                { type: LessonBlockType.paragraph, content: { text: 'Functions bundle logic so you can reuse it.' } },
                { type: LessonBlockType.code_block, content: { language: 'python', code: 'def add(a, b):\\n    return a + b' } },
              ],
            },
          ],
        },
      ],
    },
  ];

  for (const courseInput of courses) {
    const courseSlug = slugify(courseInput.title);
    const moduleTitles = courseInput.modules.map((module: any) => module.title);
    const instructor = instructorRecords.find((record) => record.slug === courseInput.instructorSlug);
    const coverAsset = mediaAssetRecords.find((record) => record.title === courseInput.coverAssetTitle);
    const course = await prisma.course.upsert({
      where: { slug: courseSlug },
      update: {
        title: courseInput.title,
        description: courseInput.description,
        instructorId: instructor?.id ?? null,
        coverImageAssetId: coverAsset?.id ?? null,
        coverImageUrl: courseInput.coverImageUrl ?? null,
        difficulty: courseInput.difficulty,
        tags: courseInput.tags,
        status: ContentStatus.published,
      },
      create: {
        title: courseInput.title,
        slug: courseSlug,
        description: courseInput.description,
        instructorId: instructor?.id ?? null,
        coverImageAssetId: coverAsset?.id ?? null,
        coverImageUrl: courseInput.coverImageUrl ?? null,
        difficulty: courseInput.difficulty,
        tags: courseInput.tags,
        status: ContentStatus.published,
      },
    });

    const skill = skillRecords.find((s) => s.slug === courseInput.skillSlug);
    if (skill) {
      await prisma.courseSkill.upsert({
        where: { courseId_skillId: { courseId: course.id, skillId: skill.id } },
        update: {},
        create: { courseId: course.id, skillId: skill.id },
      });
    }

    const seededCourse = await prisma.course.findUniqueOrThrow({
      where: { id: course.id },
      include: { skills: { include: { skill: true } } },
    });

    await ensureInitialContentRevision({
      target: ContentRevisionTarget.course,
      actorId,
      courseId: course.id,
      status: seededCourse.status,
      summary: seededCourse.status === ContentStatus.published ? 'Initial published course version' : 'Initial course draft',
      snapshot: courseRevisionSnapshot(seededCourse),
    });

    await prisma.module.deleteMany({
      where: {
        courseId: course.id,
        title: { notIn: moduleTitles },
      },
    });

    for (let m = 0; m < courseInput.modules.length; m++) {
      const modInput = courseInput.modules[m];
      const mod = await prisma.module.upsert({
        where: { courseId_title: { courseId: course.id, title: modInput.title } },
        update: {
          description: modInput.description ?? undefined,
          introVideoAssetId:
            mediaAssetRecords.find((record) => record.title === modInput.introVideoAssetTitle)?.id ?? null,
          introVideoUrl:
            mediaAssetRecords.find((record) => record.title === modInput.introVideoAssetTitle)?.url ?? null,
          order: m,
          status: ContentStatus.published,
        },
        create: {
          courseId: course.id,
          title: modInput.title,
          description: modInput.description ?? undefined,
          introVideoAssetId:
            mediaAssetRecords.find((record) => record.title === modInput.introVideoAssetTitle)?.id ?? null,
          introVideoUrl:
            mediaAssetRecords.find((record) => record.title === modInput.introVideoAssetTitle)?.url ?? null,
          order: m,
          status: ContentStatus.published,
        },
      });

      await ensureInitialContentRevision({
        target: ContentRevisionTarget.module,
        actorId,
        moduleId: mod.id,
        status: mod.status,
        summary: mod.status === ContentStatus.published ? 'Initial published module version' : 'Initial module draft',
        snapshot: moduleRevisionSnapshot(mod),
      });

      const lessonSlugs = modInput.lessons.map((lesson: any) =>
        slugify(`${courseSlug}-${modInput.title}-${lesson.title}`),
      );

      await prisma.lesson.deleteMany({
        where: {
          moduleId: mod.id,
          slug: { notIn: lessonSlugs.length ? lessonSlugs : ['__seed_placeholder__'] },
        },
      });

      for (let l = 0; l < modInput.lessons.length; l++) {
        const lessonInput = modInput.lessons[l];
        const lessonSlug = slugify(`${courseSlug}-${modInput.title}-${lessonInput.title}`);

        const lesson = await prisma.lesson.upsert({
          where: { slug: lessonSlug },
          update: {
            title: lessonInput.title,
            order: l,
            status: ContentStatus.published,
            learningObjective: (lessonInput as any).learningObjective ?? undefined,
            estimatedMinutes: (lessonInput as any).estimatedMinutes ?? undefined,
            aiPromptSeed: `You are tutoring the lesson "${lessonInput.title}". Objective: ${(lessonInput as any).learningObjective ?? 'Help the student learn the key concept.'}\n\nKeep responses short, practical, and aligned to the lesson blocks. Use numbered steps and tiny examples when helpful. End with a quick check-for-understanding question.`,
          },
          create: {
            moduleId: mod.id,
            title: lessonInput.title,
            slug: lessonSlug,
            order: l,
            status: ContentStatus.published,
            learningObjective: (lessonInput as any).learningObjective ?? undefined,
            estimatedMinutes: (lessonInput as any).estimatedMinutes ?? undefined,
            aiPromptSeed: `You are tutoring the lesson "${lessonInput.title}". Objective: ${(lessonInput as any).learningObjective ?? 'Help the student learn the key concept.'}\n\nKeep responses short, practical, and aligned to the lesson blocks. Use numbered steps and tiny examples when helpful. End with a quick check-for-understanding question.`,
          },
        });

        // blocks: replace on reseed
        await prisma.lessonBlock.deleteMany({ where: { lessonId: lesson.id } });
        const seededBlocks = lessonInput.blocks.map((block: any, index: number) => ({
          type: block.type,
          order: index,
          content: block.content as any,
        }));
        for (let b = 0; b < seededBlocks.length; b++) {
          const block = seededBlocks[b];
          await prisma.lessonBlock.create({
            data: {
              lessonId: lesson.id,
              type: block.type,
              order: block.order,
              content: block.content as any,
            },
          });
        }

        await ensureInitialContentRevision({
          target: ContentRevisionTarget.lesson,
          actorId,
          lessonId: lesson.id,
          status: lesson.status,
          summary: lesson.status === ContentStatus.published ? 'Initial published lesson version' : 'Initial lesson draft',
          snapshot: lessonRevisionSnapshot(lesson, seededBlocks),
        });

        if (lessonInput.quiz) {
          const quiz = await prisma.quiz.upsert({
            where: { lessonId: lesson.id },
            update: {
              title: lessonInput.quiz.title ?? lesson.title,
              status: ContentStatus.published,
              passingScore: lessonInput.quiz.passingScore,
            },
            create: {
              lessonId: lesson.id,
              title: lessonInput.quiz.title ?? lesson.title,
              status: ContentStatus.published,
              passingScore: lessonInput.quiz.passingScore,
            },
          });

          // Clear questions/options for deterministic reseed
          await prisma.questionOption.deleteMany({ where: { question: { quizId: quiz.id } } });
          await prisma.question.deleteMany({ where: { quizId: quiz.id } });

          for (let q = 0; q < lessonInput.quiz.questions.length; q++) {
            const qInput = lessonInput.quiz.questions[q];
            const question = await prisma.question.create({
              data: {
                quizId: quiz.id,
                type: qInput.type,
                difficulty: qInput.difficulty,
                prompt: qInput.prompt,
                explanation: qInput.explanation,
                order: q,
              },
            });

            const optionRecords = await Promise.all(
              qInput.options.map((opt: any, idx: number) =>
                prisma.questionOption.create({
                  data: { questionId: question.id, text: opt.text, order: idx },
                }),
              ),
            );

            const correct = optionRecords[qInput.correctIndex];
            if (correct) {
              await prisma.question.update({
                where: { id: question.id },
                data: { correctOptionId: correct.id },
              });
            }
          }

          const seededQuiz = await prisma.quiz.findUniqueOrThrow({
            where: { id: quiz.id },
            include: {
              questions: {
                where: { deletedAt: null },
                orderBy: { order: 'asc' },
                include: {
                  options: {
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          });

          await ensureInitialContentRevision({
            target: ContentRevisionTarget.quiz,
            actorId,
            quizId: seededQuiz.id,
            status: seededQuiz.status,
            summary:
              seededQuiz.status === ContentStatus.published
                ? 'Initial published quiz version'
                : 'Initial quiz draft',
            snapshot: quizRevisionSnapshot(seededQuiz, seededQuiz.questions),
          });
        } else {
          await prisma.quiz.deleteMany({ where: { lessonId: lesson.id } });
        }
      }
    }
  }
}

async function seedDemoEnrollments() {
  const student = await prisma.user.findUnique({
    where: { email: 'student@skillforge.dev' },
  });
  if (!student) return;

  const courses = await prisma.course.findMany({
    where: { status: ContentStatus.published, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  for (const course of courses.slice(0, 3)) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId: student.id,
        courseId: course.id,
      },
    });
  }
}

async function main() {
  await upsertRoles();
  await upsertAchievementsAndBadges();
  const users = await upsertUsers();
  await upsertSiteSurfaces();
  await seedContent(users.adminUser.id, { instructorUser: users.instructorUser });
  await seedDemoEnrollments();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

