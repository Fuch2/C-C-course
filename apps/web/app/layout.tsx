import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
import { ProfileProvider } from '@/components/profile-provider';
import { LearningTools } from '@/components/learning-tools';
import { UpdateWatcher } from '@/components/update-watcher';
import { loadCourse, summarize } from '@course/course-engine';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Код / Система — C и C++', template: '%s · Код / Система' },
  description:
    'C/C++: от основ до системного программирования. Авторский курс с практикой, изолированным выполнением кода и сохранением прогресса.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { course, lessons } = loadCourse();
  return (
    <html lang="ru">
      <body>
        <ProfileProvider>
          <LearningTools lessons={lessons.map(summarize)} />
          <UpdateWatcher />
          <Shell course={course} lessons={lessons.map(summarize)}>
            {children}
          </Shell>
        </ProfileProvider>
      </body>
    </html>
  );
}
