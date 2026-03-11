type Props = { params: Promise<{ id: string }> };

export default async function EditQuizPage({ params }: Props) {
  const { id } = await params;
  const { EditQuizClient } = await import('./edit-quiz-client');
  return <EditQuizClient id={id} />;
}

