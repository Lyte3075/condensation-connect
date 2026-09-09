import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Called from the sign-in screen (user is signed out) to resolve a username
// to the account email, so the platform's email+password login can be used.
export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const username = String(body?.username || '').trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return Response.json({ email: null });
    }
    const base44 = createClientFromRequest(req);
    const matches = await base44.asServiceRole.entities.Profile.filter({ username }, '-created_date', 1);
    return Response.json({ email: matches[0]?.email || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}