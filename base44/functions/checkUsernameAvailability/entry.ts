import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Called from the sign-up screen (user may be signed out) to check that a
// chosen username is still available before registering the account.
export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const username = String(body?.username || '').trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return Response.json({ error: 'Invalid username format' }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);
    const taken = await base44.asServiceRole.entities.Profile.filter({ username }, '-created_date', 1);
    return Response.json({ available: taken.length === 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}