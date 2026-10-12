// 目安箱の送信先（Cloudflare Pages Functions。/api/inbox に POST される）
// 送られた内容を GitHub の非公開リポジトリに Issue として作る。設定は admin/SETUP.md の「目安箱」。
//   環境変数 GITHUB_TOKEN … Issues の書き込みができる fine-grained token（シークレット）
//   環境変数 INBOX_REPO   … 例 coconuts-milk/moka-inbox
const KINDS = { bug: "バグ", improve: "改善点", wish: "欲しいツール", other: "その他" };
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function onRequestPost({ request, env }) {
  if (!env.GITHUB_TOKEN || !env.INBOX_REPO) return json({ ok: false, error: "目安箱はまだ準備中です。X からご連絡ください。" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "送信の形式が正しくありません。" }, 400); }
  if (body.website) return json({ ok: true }); // 機械による送信よけ（人には見えない欄）
  const message = String(body.message || "").trim();
  if (!message) return json({ ok: false, error: "内容を入れてください。" }, 400);
  if (message.length > 4000) return json({ ok: false, error: "内容が長すぎます（4000 文字まで）。" }, 400);
  const kind = KINDS[body.kind] || KINDS.other;
  const name = String(body.name || "").trim().slice(0, 100) || "名無し";
  const contact = String(body.contact || "").trim().slice(0, 200);
  const tool = String(body.tool || "").trim().slice(0, 100);
  const title = `[${kind}] ${message.replace(/\s+/g, " ").slice(0, 40)}${message.length > 40 ? "…" : ""}`;
  const lines = [`**種類**: ${kind}`, `**お名前**: ${name}`, contact ? `**連絡先**: ${contact}` : "", tool ? `**対象**: ${tool}` : "", "", "---", "", message];
  const r = await fetch(`https://api.github.com/repos/${env.INBOX_REPO}/issues`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: "application/vnd.github+json", "content-type": "application/json", "user-agent": "moka-inbox" },
    body: JSON.stringify({ title, body: lines.filter(l => l !== "").join("\n"), labels: [kind] }),
  });
  if (!r.ok) return json({ ok: false, error: "送信に失敗しました。時間をおいて試すか、X からご連絡ください。" }, 502);
  return json({ ok: true });
}
