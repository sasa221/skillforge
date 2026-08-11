import { InstructorModuleEditClient } from './InstructorModuleEditClient';

export default async function InstructorModuleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstructorModuleEditClient id={id} />;
}
