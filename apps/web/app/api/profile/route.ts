import { profileUpdateSchema } from '@course/shared';
import { getProfile } from '@/lib/session';
import { profileState } from '@/lib/progress';
import { apiError, assertOrigin, json, readJson } from '@/lib/http';
import { db } from '@/lib/db';

export async function GET() {
  try {
    return json(await profileState((await getProfile()).id));
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    return json(await profileState((await getProfile()).id));
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const data = await readJson(request, profileUpdateSchema, 4_000);
    const profile = await getProfile();
    const { name, onboarded, dailyGoal, compiler, fontSize } = data;
    await db.$transaction([
      db.user.update({ where: { id: profile.id }, data: { name, onboarded } }),
      db.settings.update({
        where: { userId: profile.id },
        data: { dailyGoal, compiler, fontSize },
      }),
    ]);
    return json(await profileState(profile.id));
  } catch (error) {
    return apiError(error);
  }
}
