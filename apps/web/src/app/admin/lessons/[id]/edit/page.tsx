type Props = { params: Promise<{ id: string }> };

export default async function EditLessonPage({ params }: Props) {
  const { id } = await params;
  const { EditLessonClient } = await import('./edit-lesson-client');
  return <EditLessonClient id={id} />;
}

