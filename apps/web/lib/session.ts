import { db } from './db';

/** Локальная установка: один пользователь во всех вкладках и браузерах. */
export async function getProfile() {
  const user = await db.user.upsert({
    where: { localKey: 'local' },
    create: { localKey: 'local', name: 'Локальный ученик' },
    update: {},
  });
  await db.settings.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  return user;
}
