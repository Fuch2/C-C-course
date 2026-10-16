import { json } from '@/lib/http';
export function GET() {
  return json({ build: process.env.NEXT_PUBLIC_BUILD_STAMP ?? null });
}
