type Props = { params: Promise<{ lessonSlug: string }> };

export default async function LessonPage({ params }: Props) {
  const { lessonSlug } = await params;
  const { LessonClient } = await import('./LessonClient');
  return <LessonClient lessonSlug={lessonSlug} />;
}

