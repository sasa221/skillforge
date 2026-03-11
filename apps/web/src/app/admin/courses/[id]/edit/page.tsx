type Props = { params: Promise<{ id: string }> };

export default async function EditCoursePage({ params }: Props) {
  const { id } = await params;
  const { EditCourseClient } = await import('./edit-course-client');
  return <EditCourseClient id={id} />;
}

