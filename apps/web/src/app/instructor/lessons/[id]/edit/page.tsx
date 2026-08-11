import { InstructorLessonEditClient } from './InstructorLessonEditClient';

export default async function InstructorLessonEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstructorLessonEditClient id={id} />;
}
