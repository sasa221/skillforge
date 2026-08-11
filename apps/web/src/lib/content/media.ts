import type { Course, Instructor, MediaAsset, ModuleSummary } from '@/lib/content/types';

export function resolveMediaUrl(asset: MediaAsset | null | undefined, fallbackUrl?: string | null) {
  return asset?.url ?? fallbackUrl ?? null;
}

export function resolveCourseCoverUrl(course: Pick<Course, 'coverImageAsset' | 'coverImageUrl'>) {
  return resolveMediaUrl(course.coverImageAsset, course.coverImageUrl);
}

export function resolveCourseIntroVideoUrl(
  course: Pick<Course, 'introVideoAsset' | 'introVideoUrl'>,
) {
  return resolveMediaUrl(course.introVideoAsset, course.introVideoUrl);
}

export function resolveModuleIntroVideoUrl(
  module: Pick<ModuleSummary, 'introVideoAsset' | 'introVideoUrl'>,
) {
  return resolveMediaUrl(module.introVideoAsset, module.introVideoUrl);
}

export function resolveInstructorAvatarUrl(
  instructor: Pick<Instructor, 'avatarAsset' | 'avatarUrl'> | null | undefined,
) {
  if (!instructor) return null;
  return resolveMediaUrl(instructor.avatarAsset, instructor.avatarUrl);
}
