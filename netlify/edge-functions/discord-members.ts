export default async (request: Request) => {
  const url = new URL(request.url);
  const inviteCode = url.searchParams.get('code')!;

  const discordRes = await fetch(
    `https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`,
    {
      headers: {
        // Optional but helps avoid weird blocks
        'User-Agent': 'Netlify-Edge-Function',
      },
    }
  );

  if (!discordRes.ok) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch Discord data' }),
      { status: 500 }
    );
  }

  const data = await discordRes.json();

  return new Response(
    JSON.stringify({
      memberCount: data.approximate_member_count,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        // Allow your frontend to call this
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60', // cache 1 min
      },
    }
  );
};
