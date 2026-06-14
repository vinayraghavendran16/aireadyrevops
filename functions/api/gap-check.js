// Cloudflare Pages Function for the free Definition Gap Check.
// Path: /functions/api/gap-check.js  ->  serves /api/gap-check
// Requires a D1 binding named DB (adjust env.DB below if yours differs).
//
// POST  body { room, name, role, answers:{q1..q6} }  -> stores answer, returns aggregated split
// POST  body { type:"lead", room, email, company }   -> stores a lead
// GET   ?room=xxxx                                    -> returns aggregated split

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();

    // Lead capture branch
    if (body && body.type === "lead") {
      const room = clip(body.room, 32);
      const email = clip(body.email, 160);
      const company = clip(body.company, 160);
      if (!email) return json({ error: "missing_email" }, 400);
      await env.DB.prepare(
        "INSERT INTO gap_lead (room, email, company) VALUES (?, ?, ?)"
      ).bind(room, email, company).run();
      return json({ ok: true });
    }

    // Answer branch
    const room = clip(body.room, 32);
    if (!room) return json({ error: "missing_room" }, 400);
    const name = clip(body.name, 120);
    const role = clip(body.role, 60);
    const a = body.answers || {};
    const vals = ["q1", "q2", "q3", "q4", "q5", "q6"].map((k) => clip(a[k], 40));

    await env.DB.prepare(
      "INSERT INTO gap_check (room, name, role, q1, q2, q3, q4, q5, q6) VALUES (?,?,?,?,?,?,?,?,?)"
    ).bind(room, name, role, ...vals).run();

    return json(await aggregate(env, room));
  } catch (e) {
    return json({ error: "server_error", detail: String(e) }, 500);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const room = clip(url.searchParams.get("room"), 32);
  if (!room) return json({ error: "missing_room" }, 400);
  try {
    return json(await aggregate(env, room));
  } catch (e) {
    return json({ error: "server_error", detail: String(e) }, 500);
  }
}

async function aggregate(env, room) {
  const { results } = await env.DB.prepare(
    "SELECT q1,q2,q3,q4,q5,q6 FROM gap_check WHERE room = ?"
  ).bind(room).all();

  const qs = ["q1", "q2", "q3", "q4", "q5", "q6"];
  const distribution = {};
  let disagreements = 0;

  for (const q of qs) {
    const counts = {};
    for (const row of results) {
      const v = row[q];
      if (v) counts[v] = (counts[v] || 0) + 1;
    }
    distribution[q] = counts;
    if (Object.keys(counts).length >= 2) disagreements++;
  }

  return { room, respondents: results.length, disagreements, distribution };
}

function clip(v, n) {
  return (v == null ? "" : String(v)).trim().slice(0, n);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
