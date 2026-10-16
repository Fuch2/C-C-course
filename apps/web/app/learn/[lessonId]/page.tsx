import { redirect } from 'next/navigation';
export default async function LegacyLesson({ params }: { params: Promise<{ lessonId: string }> }) {
  redirect(`/lesson/${(await params).lessonId}`);
}
