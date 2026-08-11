import { apiGet } from '@/lib/api';
import type { Course } from '@/lib/content/types';

import { CoursesCatalogClient } from './CoursesCatalogClient';

export default async function CoursesCatalogPage() {
  const res = await apiGet<any>('/courses');
  const initialCourses = Array.isArray(res) ? res : (res.courses || []);
  return <CoursesCatalogClient initialCourses={initialCourses} />;
}
