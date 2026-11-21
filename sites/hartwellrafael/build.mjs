// Hartwell & Rafael Enterprise — builds every page from one layout (header, model ribbon,
// footer), the same way The Co.LLab builds its menus from one source (scripts/build-nav.mjs).
// Run: node build.mjs   (writes the .html files in this folder; idempotent)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://hartwellrafael.com';
const BOOK = 'https://calendly.com/letsbuildleadership/hartwell-rafael-enterprise-conversation';
const WHEEL = fs.readFileSync(path.join(dir, 'partials-wheel.svg'), 'utf8').trim();

// ---- shared content -------------------------------------------------------------------
const NAV = [
  ['/', 'Home'],
  ['/about.html', 'About'],
  ['/omnidirectional-enterprise.html', 'Omnidirectional Enterprise™'],
  ['/iv-phases.html', 'The IV Phases™'],
  ['/services.html', 'Services'],
];

// The nine substations of the Omnidirectional Enterprise Model™ (same order as the wheel).
const BRANCHES = [
  ['enterprises', 'Enterprises', 'Clients', 'Businesses bring projects and commercial opportunity. Hartwell & Rafael Enterprise delivers integrated creative services with one accountable point of contact.', '/services.html'],
  ['nonprofits', 'Nonprofits', 'Organizations', 'Nonprofits and mission-driven organizations receive the same creative services and coordination, shaped to their purpose.', '/services.html'],
  ['communities', 'Communities', 'Professional community', 'The network of clients, independent professionals and partners that grows with every engagement and creates opportunity for its members.', '/about.html'],
  ['people', 'People', 'Independent professionals', 'Independent creative professionals bring their talent and skills, and are matched with work that fits their expertise through Talent Sourcing.', '/services.html#talent-sourcing'],
  ['products-services', 'Products & Services', 'Creative Services', 'The nine creative services Hartwell & Rafael Enterprise provides, organized by The IV Phases™.', '/services.html'],
  ['technology', 'Technology', 'Digital infrastructure', 'Web development and the digital tools that connect clients, professionals and partners and expand access to the work.', '/services.html#web-development'],
  ['capital', 'Capital', 'Commercial opportunity', 'Client projects and partner resources fund the work, scale what succeeds and build lasting enterprise value.', '/book.html'],
  ['knowledge-ip', 'Knowledge + IP', 'Preservation', 'The intellectual property and institutional knowledge created in every engagement, preserved in Phase IV.', '/iv-phases.html#phase-iv'],
  ['creators', 'Creators', 'Creative professionals', 'Designers, photographers, writers and makers bring ideas, create culture and build brands — for clients and for themselves.', '/services.html'],
];

const SERVICES = [
  ['branding', 'Branding', 'Identity, positioning, naming, and the visual and verbal systems that carry them.', 'I'],
  ['graphic-design', 'Graphic Design', 'Print, digital, editorial and presentation design built on a coherent system.', 'III'],
  ['web-development', 'Web Development', 'Websites and landing pages — designed, built, deployed, and kept fast and accessible.', 'III'],
  ['marketing', 'Marketing', 'Strategy, campaigns and channels planned around clear goals and measures.', 'I'],
  ['photography', 'Photography', 'Brand, product, editorial and event photography directed to your identity.', 'III'],
  ['content', 'Content', 'Writing, social and video content that tells your story consistently.', 'III'],
  ['product-design', 'Product Design', 'Concept through specification for physical and digital products.', 'I'],
  ['talent-sourcing', 'Talent Sourcing', 'Matching independent creative professionals to the work that fits their expertise.', 'II'],
  ['project-coordination', 'Project Coordination', 'Planning, scheduling, resourcing and communication from kickoff to delivery.', 'II'],
];

const PHASES = [
  ['I', 'phase-i', 'Foundations', 'Define it.', 'Purpose, capabilities, organizational direction, and opportunity.',
    'Every engagement starts by defining what the enterprise is for, what it can do and where the opportunity lies — for a client, a project or a professional.'],
  ['II', 'phase-ii', 'Infrastructure Planning & Management', 'Plan it.', 'Talent sourcing, project planning, resource allocation, and coordination.',
    'The right people and resources are planned and put in place: who does the work, when, with what, and how it is coordinated.'],
  ['III', 'phase-iii', 'Internal Operating Systems', 'Live it.', 'Relationships, workflows, communication, execution, and delivery.',
    'The work runs: relationships, workflows and communication carry the project through execution to delivery.'],
  ['IV', 'phase-iv', 'Preservation', 'Pass it on.', 'Intellectual property, institutional knowledge, relationships, sustainable enterprise value, and legacy.',
    'What the work created is kept: intellectual property, knowledge and relationships become sustainable enterprise value and legacy.'],
];

const PROGRESSION = ['Human Capability', 'Intelligence', 'Infrastructure', 'Enterprise Value', 'Legacy'];

const esc = (s) => s.replace(/&(?!amp;|#)/g, '&amp;');

// ---- layout ---------------------------------------------------------------------------
function layout({ file, title, description, body, continueLinks }) {
  const url = file === 'index.html' ? `${SITE}/` : `${SITE}/${file}`;
  const fullTitle = file === 'index.html' ? 'Hartwell & Rafael Enterprise — Creative Services, Omnidirectional Enterprise' : `${title} — Hartwell & Rafael Enterprise`;
  const navHtml = NAV.map(([href, label]) => {
    const here = (href === '/' && file === 'index.html') || href === `/${file}`;
    return `<a href="${href}"${here ? ' aria-current="page"' : ''}>${esc(label)}</a>`;
  }).join('\n      ');
  const ribbon = BRANCHES.map(([id, name]) => `<li><a href="/omnidirectional-enterprise.html#${id}">${esc(name)}</a></li>`).join('');
  const cont = continueLinks ? `
  <section class="continue" aria-label="Continue">
    <div class="wrap continue-row">
      ${continueLinks.map(([href, eyebrow, label]) => `<a class="continue-link" href="${href}"><span class="label">${esc(eyebrow)}</span><span class="continue-title">${esc(label)} <span aria-hidden="true">→</span></span></a>`).join('\n      ')}
    </div>
  </section>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#0b0a09">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Hartwell &amp; Rafael Enterprise">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/og-image.jpg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icon-32.png">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
${file === 'index.html' ? `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Hartwell & Rafael Enterprise","url":"${SITE}/","logo":"${SITE}/assets/icon-512.png","description":"${description}","knowsAbout":[${SERVICES.map((s) => `"${s[1]}"`).join(',')}]}</script>\n` : ''}</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="site-header" id="top">
  <div class="wrap header-row">
    <a class="brand" href="/" aria-label="Hartwell &amp; Rafael Enterprise home">
      <img src="/assets/hr-monogram-alpha.png" alt="" width="52" height="36">
      <span class="brand-name">Hartwell <i>&amp;</i> Rafael<small>Enterprise</small></span>
    </a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      ${navHtml}
      <a class="btn btn--gold btn--sm" href="/book.html"${file === 'book.html' ? ' aria-current="page"' : ''}>Book a Conversation</a>
    </nav>
  </div>
</header>

<div class="model-ribbon" aria-label="Omnidirectional Enterprise™">
  <div class="wrap ribbon-row">
    <a class="ribbon-label" href="/omnidirectional-enterprise.html">Omnidirectional Enterprise™</a>
    <ul>${ribbon}</ul>
  </div>
</div>

<main id="main">
${body.trim()}
${cont}
</main>

<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <img src="/assets/hr-monogram-alpha.png" alt="Hartwell &amp; Rafael Enterprise" width="104" height="72" loading="lazy">
      <p>Hartwell &amp; Rafael Enterprise<br><span>An Omnidirectional Enterprise</span></p>
    </div>
    <nav aria-label="Footer">
      <p class="label">Navigate</p>
      ${NAV.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('')}
    </nav>
    <div>
      <p class="label">Get in touch</p>
      <a href="/book.html">Book a Conversation</a>
      <a href="/book.html#contact">Send a note</a>
      <a href="/photo-consent.html">Photo Consent Form</a>
    </div>
  </div>
  <div class="wrap footer-base">
    <p>© <span id="year">2026</span> Hartwell &amp; Rafael Enterprise. All rights reserved.</p>
    <p class="ip-note">Omnidirectional Enterprise™, The IV Phases™ and Leadership Infrastructure™ are trademarks of <a href="https://wearethellab.com" rel="noopener">The Co.LLab™</a>.</p>
  </div>
</footer>

<script src="/main.js" defer></script>${file === 'book.html' ? `\n<script src="https://assets.calendly.com/assets/external/widget.js" async></script>` : ''}
</body>
</html>
`;
}

// ---- reusable blocks ------------------------------------------------------------------
const pageHero = (eyebrow, h1, lede, actions = '') => `
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${h1}</h1>
      ${lede ? `<p class="lede">${lede}</p>` : ''}
      ${actions}
    </div>
  </section>`;

const progression = () => `
      <div class="progression" aria-label="The Result">
        <p class="label">The Result</p>
        <ol>${PROGRESSION.map((p) => `<li>${p}</li>`).join('')}</ol>
      </div>`;

const steps = () => `
      <ol class="steps">
        <li><span class="step-n">1</span><h3>Choose a time</h3><p>Open the scheduler and pick any open 30-minute slot. Times show in your own time zone.</p></li>
        <li><span class="step-n">2</span><h3>Tell us a little</h3><p>Add your name, email and a line about your project or the expertise you bring.</p></li>
        <li><span class="step-n">3</span><h3>Get your confirmation</h3><p>A confirmation email with the calendar invite and Google Meet link arrives right away.</p></li>
      </ol>`;

// ---- pages ----------------------------------------------------------------------------
const pages = [];

pages.push({
  file: 'index.html',
  title: 'Home',
  description: 'Hartwell & Rafael Enterprise connects businesses, organizations, and independent creative professionals through creative services, specialized expertise, project coordination, and commercial opportunity.',
  continueLinks: [['/about.html', 'Who we are', 'About & Mission'], ['/omnidirectional-enterprise.html', 'How we are built', 'Omnidirectional Enterprise™']],
  body: `
  <section class="hero" aria-labelledby="hero-title">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">An Omnidirectional Enterprise</p>
        <h1 id="hero-title">Human capability,<br><em>connected to</em><br>commercial opportunity.</h1>
        <p class="lede">Creative services, specialized expertise and project coordination for businesses, organizations, and independent creative professionals.</p>
        <div class="hero-actions">
          <a class="btn btn--gold btn--lg" href="/book.html">Book a Conversation</a>
          <a class="btn btn--ghost" href="#services">Services we provide</a>
        </div>
      </div>
      <figure class="hero-mark" aria-hidden="true">
        <img src="/assets/hr-monogram-alpha.png" alt="" width="780" height="540">
        <figcaption>Hartwell &amp; Rafael<span>Enterprise</span></figcaption>
      </figure>
    </div>
  </section>

  <section class="section" id="services" aria-labelledby="services-title">
    <div class="wrap">
      <header class="sec-head split-head">
        <div>
          <p class="num">Services we provide</p>
          <h2 id="services-title">Nine capabilities, <em>one enterprise.</em></h2>
        </div>
        <p class="sec-intro">Engage one service or combine several. Each engagement is scoped in conversation and coordinated end to end.</p>
      </header>
      <ul class="services">
        ${SERVICES.map(([id, name, d], i) => `<li><a href="/services.html#${id}"><span class="s-num">${String(i + 1).padStart(2, '0')}</span><h3>${name}</h3><p>${d}</p></a></li>`).join('\n        ')}
      </ul>
    </div>
  </section>

  <section class="section section--ink" id="how-to-book" aria-labelledby="book-title">
    <div class="wrap">
      <header class="sec-head sec-head--center">
        <p class="num">How to book</p>
        <h2 id="book-title">Start with <em>a 30-minute conversation.</em></h2>
      </header>
      ${steps()}
      <p class="center-cta"><a class="btn btn--gold btn--lg" href="/book.html">Book a Conversation</a></p>
    </div>
  </section>`,
});

pages.push({
  file: 'about.html',
  title: 'About',
  description: 'About Hartwell & Rafael Enterprise: an Omnidirectional Enterprise connecting businesses, organizations, and independent creative professionals. Mission and vision.',
  continueLinks: [['/omnidirectional-enterprise.html', 'The model', 'Omnidirectional Enterprise™'], ['/iv-phases.html', 'How we are structured', 'The IV Phases™']],
  body: `${pageHero('About', 'One enterprise. <em>Every direction.</em>', 'Hartwell &amp; Rafael Enterprise is an Omnidirectional Enterprise connecting businesses, organizations, and independent creative professionals through creative services, specialized expertise, project coordination, and commercial opportunity.')}

  <section class="section" aria-labelledby="who-title">
    <div class="wrap split">
      <header class="sec-head">
        <p class="num">Who we are</p>
        <h2 id="who-title">The coordinating <em>enterprise.</em></h2>
      </header>
      <div class="prose">
        <p class="big">We bring together the people who need creative and specialized work done and the professionals who do it best, then coordinate the work from first conversation to delivery.</p>
        <p>Businesses and organizations come with a goal: a brand to build, a product to launch, a campaign to run, a team to assemble. Independent creative professionals come with capability: design, development, photography, content, strategy. Hartwell &amp; Rafael Enterprise sits at the centre as the coordinating enterprise, so expertise, resources and opportunity reach the place they create the most value.</p>
        <p>Hartwell &amp; Rafael Enterprise is built on the Omnidirectional Enterprise Model™ and runs every engagement through The IV Phases™ of Leadership Infrastructure™.</p>
      </div>
    </div>
  </section>

  <section class="section section--ink" id="mission" aria-labelledby="mission-title">
    <div class="wrap">
      <header class="sec-head sec-head--center">
        <p class="num">Mission &amp; Vision</p>
        <h2 id="mission-title">Why we exist, <em>and where we are going.</em></h2>
      </header>
      <div class="mv">
        <article class="mv-card" id="mission-statement">
          <p class="label">Mission</p>
          <blockquote>To connect human capabilities with commercial opportunity through integrated creative services, strategic coordination, and collaborative enterprise infrastructure — creating sustainable value for businesses and professionals.</blockquote>
        </article>
        <article class="mv-card" id="vision">
          <p class="label">Vision</p>
          <blockquote>To advance an interconnected creative economy where expertise, intelligence, resources, and opportunity move across traditional organizational boundaries, enabling collaboration, sustainable enterprise growth, and lasting legacy.</blockquote>
        </article>
      </div>
    </div>
  </section>`,
});

pages.push({
  file: 'omnidirectional-enterprise.html',
  title: 'Omnidirectional Enterprise™',
  description: 'The Omnidirectional Enterprise Model™ at Hartwell & Rafael Enterprise: one Source, nine substations, and value that moves in every direction.',
  continueLinks: [['/iv-phases.html', 'How we are structured', 'The IV Phases™'], ['/services.html', 'What we provide', 'Services']],
  body: `${pageHero('Omnidirectional Enterprise™', 'Multiple pathways. <em>One ecosystem.</em>', 'Not a ladder, but a network where value moves in every direction, because nobody builds alone.')}

  <section class="section" id="model" aria-labelledby="model-title">
    <div class="wrap oe-mid">
      <div class="oe-map">
        ${WHEEL}
      </div>
      <div class="oe-side">
        <p class="num">The model</p>
        <h2 id="model-title">One Source, its substations, <em>and the lines between them.</em></h2>
        <dl class="oe-legend">
          <div><dt>The Source</dt><dd>The centre: Hartwell &amp; Rafael Enterprise running the Omnidirectional Enterprise Model™. It powers the whole system and every substation draws from it.</dd></div>
          <div><dt>Substations</dt><dd>The nine places where economic activity happens. Each exchanges with the Source and with the substations beside it.</dd></div>
          <div><dt>Transmission lines</dt><dd>Carry power from the Source out to a substation and carry value back. Two-way.</dd></div>
          <div><dt>Interconnections</dt><dd>Let two substations exchange directly, without going through the Source. Every substation connects with every other. This is what makes the model omnidirectional.</dd></div>
        </dl>
      </div>
    </div>
    <div class="wrap">${progression()}
    </div>
  </section>

  <section class="section section--ink" id="blueprint" aria-labelledby="bp-title">
    <div class="wrap">
      <header class="sec-head">
        <p class="num">The blueprint</p>
        <h2 id="bp-title">Our enterprise, <em>built on the model.</em></h2>
        <p class="sec-intro">Each substation of the model, and where it lives inside Hartwell &amp; Rafael Enterprise.</p>
      </header>
      <ol class="bp-list">
        ${BRANCHES.map(([id, name, where, what, href]) => `<li class="bp-row" id="${id}"><a href="${href}"><span class="bp-node">${esc(name)}</span><span class="bp-where">${esc(where)}</span><span class="bp-what">${esc(what)}</span></a></li>`).join('\n        ')}
      </ol>
    </div>
  </section>`,
});

pages.push({
  file: 'iv-phases.html',
  title: 'The IV Phases™',
  description: 'The IV Phases™ of Leadership Infrastructure™ — Foundations, Infrastructure Planning & Management, Internal Operating Systems, and Preservation — the structure of Hartwell & Rafael Enterprise.',
  continueLinks: [['/services.html', 'What we provide', 'Services by phase'], ['/book.html', 'Start Phase I', 'Book a Conversation']],
  body: `${pageHero('The IV Phases™ of Leadership Infrastructure™', 'One model, <em>four phases.</em>', 'Hartwell &amp; Rafael Enterprise is structured on The IV Phases™. Every engagement — a single project or an ongoing relationship — moves through the same four phases, from Foundations to Preservation.')}

  <section class="section" aria-label="The four phases">
    <div class="wrap">
      <ol class="phase-rows">
        ${PHASES.map(([n, id, name, verb, scope, what]) => {
          const svc = SERVICES.filter((s) => s[3] === n);
          return `<li class="phase-row" id="${id}">
          <p class="phase-num">${n}</p>
          <div>
            <p class="label">Phase ${n} · ${verb}</p>
            <h2>${esc(name)}</h2>
            <p class="phase-scope">${scope}</p>
            <p>${what}</p>
            ${svc.length ? `<p class="phase-svc"><span>Services in this phase:</span> ${svc.map((s) => `<a href="/services.html#${s[0]}">${s[1]}</a>`).join(' · ')}</p>` : `<p class="phase-svc"><span>In every engagement:</span> the work, knowledge and relationships created are carried into Preservation.</p>`}
          </div>
        </li>`;
        }).join('\n        ')}
      </ol>
    </div>
  </section>`,
});

pages.push({
  file: 'services.html',
  title: 'Services',
  description: 'Creative services from Hartwell & Rafael Enterprise: branding, graphic design, web development, marketing, photography, content, product design, talent sourcing, and project coordination.',
  continueLinks: [['/book.html', 'Next step', 'Book a Conversation'], ['/iv-phases.html', 'How we work', 'The IV Phases™']],
  body: `${pageHero('Creative Services', 'The capabilities <em>we coordinate.</em>', 'Engage one service or combine several. Each is organized by The IV Phases™, scoped in conversation and coordinated end to end by the enterprise.', '<div class="hero-actions"><a class="btn btn--gold" href="/book.html">Book a Conversation</a></div>')}

  ${PHASES.filter(([n]) => SERVICES.some((s) => s[3] === n)).map(([n, id, name, verb]) => `
  <section class="section${n === 'II' ? ' section--ink' : ''}" aria-labelledby="svc-${id}">
    <div class="wrap">
      <header class="sec-head">
        <p class="num">Phase ${n} · ${verb}</p>
        <h2 id="svc-${id}">${esc(name)}</h2>
      </header>
      <ul class="services services--detail">
        ${SERVICES.filter((s) => s[3] === n).map(([sid, sname, d]) => `<li id="${sid}"><h3>${sname}</h3><p>${d}</p><a class="svc-link" href="/book.html">Discuss ${sname.toLowerCase()} →</a></li>`).join('\n        ')}
      </ul>
    </div>
  </section>`).join('')}`,
});

pages.push({
  file: 'book.html',
  title: 'Book a Conversation',
  description: 'Book a 30-minute conversation with Hartwell & Rafael Enterprise. Live availability, instant confirmation, Google Meet.',
  continueLinks: [['/services.html', 'Before you book', 'Services'], ['/about.html', 'Who we are', 'About & Mission']],
  body: `${pageHero('Book a Conversation', 'Start with <em>a conversation.</em>', 'Thirty minutes by video call to talk through your goals, your project, or the expertise you bring.')}

  <section class="section" id="schedule" aria-labelledby="sched-title">
    <div class="wrap book-grid">
      <header class="sec-head">
        <p class="num">How it works</p>
        <h2 id="sched-title" class="visually-h">Pick any open time.</h2>
        ${steps()}
        <p class="book-alt">Prefer the scheduler in its own window? <a href="${BOOK}" target="_blank" rel="noopener">Open the booking page ↗</a></p>
      </header>
      <div class="scheduler">
        <div class="calendly-inline-widget" data-url="${BOOK}?hide_gdpr_banner=1&amp;background_color=f6f1e7&amp;text_color=1a1712&amp;primary_color=8a6a33" style="min-width:280px;height:700px;"></div>
        <noscript><p class="noscript">Scheduling needs JavaScript. <a href="${BOOK}">Book on the scheduling page</a>.</p></noscript>
      </div>
    </div>
  </section>

  <section class="section section--ink" id="contact" aria-labelledby="contact-title">
    <div class="wrap split">
      <header class="sec-head">
        <p class="num">Contact</p>
        <h2 id="contact-title">Or send <em>a note.</em></h2>
        <p class="sec-intro">Clients, creative professionals and partners are all welcome. Tell us a little about what you have in mind and we will reply by email.</p>
      </header>
      <form class="contact-form" name="contact" method="POST" action="/" data-netlify="true" netlify-honeypot="company_website">
        <input type="hidden" name="form-name" value="contact">
        <p class="hp"><label>Leave this empty <input name="company_website" tabindex="-1" autocomplete="off"></label></p>
        <div class="row2">
          <label>Name<input name="name" type="text" autocomplete="name" required></label>
          <label>Email<input name="email" type="email" autocomplete="email" required></label>
        </div>
        <div class="row2">
          <label>Organization <span class="opt">(optional)</span><input name="organization" type="text" autocomplete="organization"></label>
          <label>I am a…
            <select name="role" required>
              <option value="">Choose one</option>
              <option>Business or organization</option>
              <option>Independent creative professional</option>
              <option>Prospective partner</option>
              <option>Other</option>
            </select>
          </label>
        </div>
        <label>How can we help?<textarea name="message" rows="5" required></textarea></label>
        <button class="btn btn--gold" type="submit">Send message</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>`,
});

pages.push({
  file: 'photo-consent.html',
  title: 'Photo Consent Form',
  description: 'Digital photo consent and release form for Hartwell & Rafael Enterprise photography.',
  continueLinks: [['/services.html#photography', 'Our work', 'Photography'], ['/book.html', 'Questions?', 'Book a Conversation']],
  body: `${pageHero('Photo Consent Form', 'Photo consent <em>&amp; release.</em>', 'Please read and complete this form before you are photographed by or for Hartwell &amp; Rafael Enterprise. It takes about two minutes.')}

  <section class="section" aria-label="Consent form">
    <div class="wrap narrow">
      <form class="contact-form consent-form" name="photo-consent" method="POST" action="/" data-netlify="true" netlify-honeypot="company_website">
        <input type="hidden" name="form-name" value="photo-consent">
        <p class="hp"><label>Leave this empty <input name="company_website" tabindex="-1" autocomplete="off"></label></p>

        <fieldset><legend>1 · Your details</legend>
          <div class="row2">
            <label>Full legal name<input name="full_name" type="text" autocomplete="name" required></label>
            <label>Email<input name="email" type="email" autocomplete="email" required></label>
          </div>
          <div class="row2">
            <label>Phone <span class="opt">(optional)</span><input name="phone" type="tel" autocomplete="tel"></label>
            <label>Date of photo session or event<input name="session_date" type="date" required></label>
          </div>
          <label>Session, event or project<input name="session" type="text" placeholder="e.g. brand photo session, product launch event" required></label>
        </fieldset>

        <fieldset><legend>2 · How the photos may be used</legend>
          <p class="fine">Tick every use you allow. Leave a box unticked to say no to that use.</p>
          <label class="check"><input type="checkbox" name="use_client_project" value="yes"> Delivered to the client for the project named above</label>
          <label class="check"><input type="checkbox" name="use_website" value="yes"> Hartwell &amp; Rafael Enterprise website</label>
          <label class="check"><input type="checkbox" name="use_social" value="yes"> Social media</label>
          <label class="check"><input type="checkbox" name="use_print_marketing" value="yes"> Print, advertising and marketing materials</label>
          <label class="check"><input type="checkbox" name="use_portfolio" value="yes"> Professional portfolios of the photographer and Hartwell &amp; Rafael Enterprise</label>
          <label>May we identify you by name with the photos?
            <select name="name_credit" required><option value="">Choose one</option><option>Yes, you may use my name</option><option>No, do not identify me by name</option></select>
          </label>
        </fieldset>

        <fieldset><legend>3 · Terms</legend>
          <ul class="terms">
            <li>I give Hartwell &amp; Rafael Enterprise permission to photograph me and to use those photos only for the uses I ticked above.</li>
            <li>I understand I will not receive payment for these uses unless agreed separately in writing.</li>
            <li>I may withdraw this consent at any time by writing to Hartwell &amp; Rafael Enterprise. Withdrawal applies to future uses; it cannot recall materials already printed or published.</li>
            <li>Photos may be edited for color, cropping and quality, but will not be altered to misrepresent me.</li>
          </ul>
        </fieldset>

        <fieldset><legend>4 · If the person photographed is under 18</legend>
          <p class="fine">A parent or legal guardian must complete this section and sign below on the minor's behalf.</p>
          <div class="row2">
            <label>Minor's full name <span class="opt">(if applicable)</span><input name="minor_name" type="text"></label>
            <label>Your relationship to the minor<input name="guardian_relationship" type="text" placeholder="e.g. parent, legal guardian"></label>
          </div>
        </fieldset>

        <fieldset><legend>5 · Signature</legend>
          <label>Type your full legal name to sign<input name="signature" type="text" class="sig" autocomplete="off" required></label>
          <label class="check"><input type="checkbox" name="agree" value="I agree" required> I have read this form, I am 18 or older (or the parent/guardian named above), and I agree that my typed name is my electronic signature.</label>
          <input type="hidden" name="signed_at" value="">
        </fieldset>

        <button class="btn btn--gold" type="submit">Sign and submit</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>`,
});

for (const p of pages) fs.writeFileSync(path.join(dir, p.file), layout(p));
fs.writeFileSync(path.join(dir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE}/${p.file === 'index.html' ? '' : p.file}</loc></url>`).join('\n')}
</urlset>
`);
console.log(`built ${pages.length} pages`);
