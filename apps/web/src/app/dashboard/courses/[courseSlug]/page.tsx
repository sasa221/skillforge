type Props = { params: Promise<{ courseSlug: string }> };

export default async function DashboardCourseDetailsPage({ params }: Props) {
  const { courseSlug } = await params;
  const { DashboardCourseClient } = await import('./DashboardCourseClient');
  return <DashboardCourseClient courseSlug={courseSlug} />;
}

