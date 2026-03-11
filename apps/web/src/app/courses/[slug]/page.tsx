import { CourseDetailsClient } from './CourseDetailsClient';

type Props = { params: Promise<{ slug: string }> };

export default async function CourseDetailsPage({ params }: Props) {
  const { slug } = await params;
  return <CourseDetailsClient slug={slug} />;
}

