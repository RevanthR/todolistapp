import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getWeekStart } from '@/lib/utils';
import { getSpillovers } from '@/lib/spillovers';

// GET — fetch unfinished items from any past week, plus past-week items
// completed during the current week
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const spillovers = await getSpillovers(auth.userId, getWeekStart());

  return NextResponse.json({ spillovers });
}
