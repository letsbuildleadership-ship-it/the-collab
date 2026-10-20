// The one-file starter website printed in the .LLab Creator Website Blueprint™ and
// tested in test/starter-site.test.js. It is the nine-part page pattern in the
// Co.LLab™ red-orange glow style, with every link working inside one page.
export const STARTER_SITE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>YOUR BRAND™</title>
<style>
:root{--bg:#0f1d13;--ink:#fff;--muted:#ffd9c4;--red:#ff2e12;--orange:#ff6a2e;--line:rgba(255,106,46,.3)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
a{color:inherit}
.wrap{max-width:1100px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line)}
header .wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-top:14px;padding-bottom:14px}
.logo{font-weight:800;text-decoration:none}
nav a{margin-left:16px;font-size:.85rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}
.ribbon .wrap{display:flex;gap:8px;overflow-x:auto;padding-top:12px;padding-bottom:14px}
.chip{white-space:nowrap;padding:.35em .9em;border:1.5px solid var(--orange);border-radius:999px;background:rgba(255,46,18,.18);box-shadow:0 0 12px rgba(255,96,46,.55);font-size:.75rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-decoration:none}
.hero{padding:72px 0 48px;background:radial-gradient(120% 90% at 0 0,rgba(255,46,18,.25),transparent 60%)}
.eyebrow{margin:0;color:#ff4a3a;font-size:.8rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
h1{margin:.4em 0;font-size:clamp(2.4rem,8vw,5rem);line-height:1;letter-spacing:-.02em;text-transform:uppercase}
h1 b{color:#ff4a3a;text-shadow:0 0 28px rgba(255,46,18,.65)}
h2{margin:.3em 0;font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.1}
.btn{display:inline-block;padding:.8em 1.4em;border-radius:999px;background:linear-gradient(90deg,var(--red),var(--orange));color:#000;font-weight:800;text-decoration:none;box-shadow:0 0 18px rgba(255,96,46,.7)}
section{padding:48px 0;border-top:1px solid var(--line)}
.split{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:20px}
.card{padding:20px;background:rgba(255,255,255,.05);border:1px solid var(--line);border-top:3px solid var(--orange)}
.card h3{margin:0 0 6px}
table{width:100%;margin-top:20px;border-collapse:collapse}
th,td{padding:12px;text-align:left;border-bottom:1px solid var(--line)}
th{background:rgba(255,46,18,.18);font-size:.8rem;letter-spacing:.12em;text-transform:uppercase}
.next{display:flex;flex-wrap:wrap;gap:16px;margin-top:16px}
footer{padding:32px 0;border-top:1px solid var(--line);color:var(--muted);font-size:.9rem}
@media(max-width:700px){.split{grid-template-columns:1fr}}
</style>
</head>
<body>
<header><div class="wrap"><a class="logo" href="#top">YOUR BRAND™</a><nav><a href="#problem">Problem</a><a href="#offer">Offer</a><a href="#paths">Paths</a></nav></div></header>
<div class="ribbon"><div class="wrap"><a class="chip" href="#paths">Direction one</a><a class="chip" href="#paths">Direction two</a><a class="chip" href="#paths">Direction three</a></div></div>
<main id="top">
<section class="hero"><div class="wrap"><p class="eyebrow">YOUR BRAND™ · YOUR FIELD</p><h1>Name the problem. <b>Show the solution.</b></h1><p>One sentence about who you help.</p><a class="btn" href="#offer">Explore YOUR OFFER™</a></div></section>
<section id="problem"><div class="wrap split"><div><p class="eyebrow">The problem</p><h2>What your visitor is up against.</h2><p>Two sentences. State the problem plainly.</p></div><div><p class="eyebrow">The solution</p><h2>What your IP does about it.</h2><p>Two sentences. Name your framework or product.</p></div></div></section>
<section id="offer"><div class="wrap"><p class="eyebrow">Main points</p><h2>Your offer.</h2><div class="cards"><div class="card"><h3>YOUR PRODUCT ONE™</h3><p>One sentence.</p><a class="btn" href="#paths">Learn more</a></div><div class="card"><h3>YOUR PRODUCT TWO™</h3><p>One sentence.</p><a class="btn" href="#paths">Learn more</a></div></div></div></section>
<section id="paths"><div class="wrap"><p class="eyebrow">Find your direction</p><h2>Every page. <b>Every direction.</b></h2><table><thead><tr><th>Page</th><th>Direction</th><th>The idea</th></tr></thead><tbody><tr><td><a href="#offer">YOUR PRODUCT ONE™</a></td><td>Direction one</td><td>One line.</td></tr><tr><td><a href="#offer">YOUR PRODUCT TWO™</a></td><td>Direction two</td><td>One line.</td></tr></tbody></table></div></section>
<section><div class="wrap"><p class="eyebrow">Continue</p><div class="next"><a class="btn" href="#problem">Back to the problem</a><a class="btn" href="#top">Back to the top</a></div></div></section>
</main>
<footer><div class="wrap">© YOUR NAME. YOUR BRAND™ is a name you coined. Add your legal note here.</div></footer>
</body>
</html>
`;
