import { InstructorCourseEditClient } from './InstructorCourseEditClient';

export default async function InstructorCourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstructorCourseEditClient id={id} />;
}
