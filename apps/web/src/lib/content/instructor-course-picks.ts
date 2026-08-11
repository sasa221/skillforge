type Difficulty = 'beginner' | 'intermediate' | 'advanced';

type CourseLike = {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  estimatedMinutes: number | null;
  description?: string | null;
  skills?: Array<{ skill: { title: string } }>;
};

export type CoursePick<T extends CourseLike> = {
  label: string;
  reason: string;
  course: T;
};

const difficultyRank: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export function buildInstructorCoursePicks<T extends CourseLike>(
  currentCourse: T,
  instructorCourses: T[],
) {
  const otherCourses = instructorCourses.filter((course) => course.id !== currentCourse.id);
  if (!otherCourses.length) {
    return [];
  }

  const picks: Array<CoursePick<T>> = [];
  const used = new Set<string>();

  const easier = pickClosestByDifficulty(otherCourses, currentCourse.difficulty, -1);
  if (easier) {
    used.add(easier.id);
    picks.push({
      label: 'Need an easier start?',
      reason: `Start with ${easier.title} if you want a lighter entry point before coming back to this course.`,
      course: easier,
    });
  }

  const nextChallenge =
    pickClosestByDifficulty(
      otherCourses.filter((course) => !used.has(course.id)),
      currentCourse.difficulty,
      1,
    ) ?? pickLongestCourse(otherCourses.filter((course) => !used.has(course.id)));

  if (nextChallenge) {
    used.add(nextChallenge.id);
    picks.push({
      label: 'Ready for the next challenge?',
      reason: `Move into ${nextChallenge.title} when you want a stronger stretch after this course.`,
      course: nextChallenge,
    });
  }

  const complementary = pickComplementaryCourse(
    otherCourses.filter((course) => !used.has(course.id)),
    currentCourse,
  );

  if (complementary) {
    picks.push({
      label: 'Explore a related angle',
      reason:
        complementary.skills?.[0]?.skill.title
          ? `${complementary.title} helps you apply this instructor's approach to ${complementary.skills[0].skill.title}.`
          : `${complementary.title} is a strong related follow-up if you want another practical path with the same instructor.`,
      course: complementary,
    });
  }

  return picks;
}

export function describeCourseFit(difficulty: Difficulty) {
  switch (difficulty) {
    case 'beginner':
      return 'Best if you want a clean starting point and guided practice from the ground up.';
    case 'intermediate':
      return 'Best if you already know the basics and want a more applied, faster-paced course.';
    case 'advanced':
      return 'Best if you are ready for deeper material, denser checkpoints, and fewer beginner explanations.';
    default:
      return 'A guided course designed to help you build practical progress at a steady pace.';
  }
}

export function pickStartingInstructorCourse<T extends CourseLike>(courses: T[]) {
  if (!courses.length) return null;

  return [...courses].sort((left, right) => {
    const difficultyDelta = difficultyRank[left.difficulty] - difficultyRank[right.difficulty];
    if (difficultyDelta !== 0) return difficultyDelta;
    const leftMinutes = left.estimatedMinutes ?? Number.MAX_SAFE_INTEGER;
    const rightMinutes = right.estimatedMinutes ?? Number.MAX_SAFE_INTEGER;
    if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
    return left.title.localeCompare(right.title);
  })[0];
}

export function pickNextInstructorCourse<T extends CourseLike>(
  courses: T[],
  anchorCourse?: T | null,
) {
  if (!courses.length) return null;

  const sourceCourse = anchorCourse ?? pickStartingInstructorCourse(courses);
  if (!sourceCourse) return null;

  const otherCourses = courses.filter((course) => course.id !== sourceCourse.id);
  if (!otherCourses.length) return null;

  return (
    pickClosestByDifficulty(otherCourses, sourceCourse.difficulty, 1) ??
    pickComplementaryCourse(otherCourses, sourceCourse) ??
    pickLongestCourse(otherCourses)
  );
}

export function buildInstructorLevelPicks<T extends CourseLike>(
  courses: T[],
  startCourse?: T | null,
) {
  if (!courses.length) return [];

  const picks: Array<CoursePick<T>> = [];
  const used = new Set<string>();

  const addPick = (label: string, reason: string, candidate: T | null | undefined) => {
    if (!candidate || used.has(candidate.id)) return;
    used.add(candidate.id);
    picks.push({ label, reason, course: candidate });
  };

  addPick(
    'Just getting started?',
    'Begin here if you want the clearest entry point with more guidance and less pressure up front.',
    pickInstructorCourseByDifficulty(courses, 'beginner') ?? startCourse,
  );

  addPick(
    'Already know the basics?',
    'This is the best next step if you want applied practice without jumping straight into the hardest material.',
    pickInstructorCourseByDifficulty(courses, 'intermediate') ??
      pickNextInstructorCourse(courses, startCourse),
  );

  addPick(
    'Want the deepest challenge?',
    'Choose this if you are ready for denser material, stronger checkpoints, and more advanced practice.',
    pickInstructorCourseByDifficulty(courses, 'advanced'),
  );

  return picks;
}

export function pickInstructorCourseByDifficulty<T extends CourseLike>(
  courses: T[],
  difficulty: T['difficulty'],
) {
  const matches = courses.filter((course) => course.difficulty === difficulty);
  if (!matches.length) return null;

  return [...matches].sort((left, right) => {
    const leftMinutes = left.estimatedMinutes ?? Number.MAX_SAFE_INTEGER;
    const rightMinutes = right.estimatedMinutes ?? Number.MAX_SAFE_INTEGER;
    if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
    return left.title.localeCompare(right.title);
  })[0];
}

function pickClosestByDifficulty<T extends CourseLike>(
  courses: T[],
  currentDifficulty: Difficulty,
  direction: -1 | 1,
) {
  const currentRank = difficultyRank[currentDifficulty];
  const filtered = courses.filter((course) => {
    const delta = difficultyRank[course.difficulty] - currentRank;
    return direction === -1 ? delta < 0 : delta > 0;
  });

  if (!filtered.length) {
    return null;
  }

  return [...filtered].sort((left, right) => {
    const leftDelta = Math.abs(difficultyRank[left.difficulty] - currentRank);
    const rightDelta = Math.abs(difficultyRank[right.difficulty] - currentRank);
    if (leftDelta !== rightDelta) return leftDelta - rightDelta;
    const leftMinutes = left.estimatedMinutes ?? Number.MAX_SAFE_INTEGER;
    const rightMinutes = right.estimatedMinutes ?? Number.MAX_SAFE_INTEGER;
    if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
    return left.title.localeCompare(right.title);
  })[0];
}

function pickLongestCourse<T extends CourseLike>(courses: T[]) {
  if (!courses.length) return null;

  return [...courses].sort((left, right) => {
    const leftMinutes = left.estimatedMinutes ?? 0;
    const rightMinutes = right.estimatedMinutes ?? 0;
    if (leftMinutes !== rightMinutes) return rightMinutes - leftMinutes;
    return left.title.localeCompare(right.title);
  })[0];
}

function pickComplementaryCourse<T extends CourseLike>(courses: T[], currentCourse: T) {
  if (!courses.length) return null;

  const currentSkillTitles = new Set(
    (currentCourse.skills ?? []).map((entry) => entry.skill.title.toLowerCase()),
  );

  const exactDifferentSkill = courses.find((course) => {
    const title = course.skills?.[0]?.skill.title?.toLowerCase();
    return title ? !currentSkillTitles.has(title) : false;
  });

  if (exactDifferentSkill) {
    return exactDifferentSkill;
  }

  return [...courses].sort((left, right) => left.title.localeCompare(right.title))[0];
}
