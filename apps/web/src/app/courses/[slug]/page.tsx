import { notFound } from 'next/navigation';

import { apiGet } from '@/lib/api';
import type { CourseDetail } from '@/lib/content/types';

import { CourseDetailsClient } from './CourseDetailsClient';

type Props = { params: Promise<{ slug: string }> };

export default async function CourseDetailsPage({ params }: Props) {
  const { slug } = await params;

  try {
    const initialCourse = await apiGet<CourseDetail>(`/courses/${slug}`);
    return <CourseDetailsClient slug={slug} initialCourse={initialCourse} />;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API 404')) {
      notFound();
    }

    throw error;
  }
}

