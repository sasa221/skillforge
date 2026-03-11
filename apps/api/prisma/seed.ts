import { PrismaClient, UserRoleType, ContentStatus, CourseDifficulty, LessonBlockType, QuestionType, AchievementType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function upsertRoles() {
  const roles: Array<{ type: UserRoleType; name: string }> = [
    { type: UserRoleType.student, name: 'Student' },
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

  const adminPass = 'Admin123!';
  const studentPass = 'Student123!';

  const [adminRole, studentRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { type: UserRoleType.admin } }),
    prisma.role.findUniqueOrThrow({ where: { type: UserRoleType.student } }),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
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

  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
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

  return { adminUser, studentUser };
}

async function seedContent() {
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

  const courses: any[] = [
    {
      title: 'Excel Foundations: Formulas & Tables',
      description: 'Learn the spreadsheet basics that unlock real productivity.',
      difficulty: CourseDifficulty.beginner,
      tags: ['excel', 'productivity'],
      skillSlug: 'excel-basics',
      modules: [
        {
          title: 'Getting Comfortable',
          lessons: [
            {
              title: 'Cells, Ranges, and References',
              learningObjective: 'Understand cells vs ranges and write your first formula using cell references.',
              estimatedMinutes: 10,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Cells, Ranges, and References' } },
                { type: LessonBlockType.paragraph, content: { text: 'Excel is built on cells. A range is a group of cells. References let formulas point to values.' } },
                { type: LessonBlockType.example, content: { title: 'Example', text: 'Type 10 in A1 and 20 in A2, then in A3 type =A1+A2' } },
                { type: LessonBlockType.callout, content: { variant: 'tip', text: 'When you copy a formula, references adjust automatically unless you lock them with $ (absolute reference).' } },
                { type: LessonBlockType.recap, content: { bullets: ['A1 is a cell reference', 'A1:A10 is a range', 'Formulas start with ='] } },
              ],
              quiz: {
                passingScore: 70,
                questions: [
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 1,
                    prompt: 'What does the reference A1 represent?',
                    explanation: 'A1 points to the cell in column A, row 1.',
                    options: [{ text: 'A named table' }, { text: 'A single cell (column A, row 1)' }, { text: 'An entire column' }],
                    correctIndex: 1,
                  },
                  {
                    type: QuestionType.true_false,
                    difficulty: 1,
                    prompt: 'Excel formulas typically start with an equals sign (=).',
                    explanation: 'Formulas are recognized by starting with =.',
                    options: [{ text: 'True' }, { text: 'False' }],
                    correctIndex: 0,
                  },
                ],
              },
            },
            {
              title: 'SUM and Basic Math',
              learningObjective: 'Use SUM and basic operators to total ranges and build simple calculations.',
              estimatedMinutes: 8,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'SUM and Basic Math' } },
                { type: LessonBlockType.paragraph, content: { text: 'You can add values directly or use functions like SUM over a range.' } },
                { type: LessonBlockType.code_block, content: { language: 'excel', code: '=SUM(A1:A10)' } },
                { type: LessonBlockType.example, content: { title: 'Example', text: 'If A1:A3 are 5, 7, 2 then =SUM(A1:A3) returns 14.' } },
              ],
              quiz: {
                passingScore: 70,
                questions: [
                  {
                    type: QuestionType.multiple_choice,
                    difficulty: 1,
                    prompt: 'What does =SUM(A1:A3) do?',
                    explanation: 'SUM adds all values in the specified range.',
                    options: [{ text: 'Multiplies A1 by A3' }, { text: 'Adds the values in A1 through A3' }, { text: 'Counts the cells in A1:A3' }],
                    correctIndex: 1,
                  },
                ],
              },
            },
          ],
        },
        {
          title: 'Data Organization',
          lessons: [
            {
              title: 'Sorting and Filtering',
              learningObjective: 'Sort and filter a table without breaking row alignment.',
              estimatedMinutes: 7,
              blocks: [
                { type: LessonBlockType.heading, content: { text: 'Sorting and Filtering' } },
                { type: LessonBlockType.paragraph, content: { text: 'Sorting changes order; filtering hides rows that don’t match criteria.' } },
                { type: LessonBlockType.callout, content: { variant: 'tip', text: 'Always select the full table before sorting.' } },
                { type: LessonBlockType.recap, content: { bullets: ['Sort reorders rows', 'Filter hides non-matching rows', 'Use tables to keep ranges consistent'] } },
              ],
            },
          ],
        },
      ],
    },
    {
      title: 'SQL Fundamentals: SELECT to JOIN',
      description: 'Build query skills step-by-step using real datasets.',
      difficulty: CourseDifficulty.beginner,
      tags: ['sql', 'data'],
      skillSlug: 'sql-fundamentals',
      modules: [
        {
          title: 'Core Querying',
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
      difficulty: CourseDifficulty.intermediate,
      tags: ['sql', 'analytics'],
      skillSlug: 'sql-fundamentals',
      modules: [
        {
          title: 'Aggregations that matter',
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
      difficulty: CourseDifficulty.beginner,
      tags: ['python', 'programming'],
      skillSlug: 'python-basics',
      modules: [
        {
          title: 'Getting Started',
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
    const course = await prisma.course.upsert({
      where: { slug: courseSlug },
      update: {
        title: courseInput.title,
        description: courseInput.description,
        difficulty: courseInput.difficulty,
        tags: courseInput.tags,
        status: ContentStatus.published,
      },
      create: {
        title: courseInput.title,
        slug: courseSlug,
        description: courseInput.description,
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

    for (let m = 0; m < courseInput.modules.length; m++) {
      const modInput = courseInput.modules[m];
      const mod = await prisma.module.upsert({
        where: { courseId_title: { courseId: course.id, title: modInput.title } },
        update: { description: modInput.description ?? undefined, order: m, status: ContentStatus.published },
        create: {
          courseId: course.id,
          title: modInput.title,
          description: modInput.description ?? undefined,
          order: m,
          status: ContentStatus.published,
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
        for (let b = 0; b < lessonInput.blocks.length; b++) {
          const block = lessonInput.blocks[b];
          await prisma.lessonBlock.create({
            data: {
              lessonId: lesson.id,
              type: block.type,
              order: b,
              content: block.content as any,
            },
          });
        }

        if (lessonInput.quiz) {
          const quiz = await prisma.quiz.upsert({
            where: { lessonId: lesson.id },
            update: { status: ContentStatus.published, passingScore: lessonInput.quiz.passingScore },
            create: { lessonId: lesson.id, status: ContentStatus.published, passingScore: lessonInput.quiz.passingScore },
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
        }
      }
    }
  }
}

async function main() {
  await upsertRoles();
  await upsertAchievementsAndBadges();
  await upsertUsers();
  await seedContent();
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

