import { GLOSSARY_GROUPS } from './_website-glossary.mjs';

export const meta = {
  key: 'creator-website-blueprint',
  outFile: 'creator-website-blueprint.pdf',
  docTitle: 'Creator Website Blueprint™',
  cover: {
    eyebrow: 'Phase II · Infrastructure Planning & Management — a .LLab Creator Infrastructure™ Manual',
    title: 'Creator Website <strong>Blueprint</strong>™',
    subtitle: 'A manual for building and running a luxury-style website with Composio, GitHub, Netlify, Claude and ChatGPT. One edition for iPhone. One for computer. Base level to ceiling.',
    phase: 'II · Infrastructure Planning & Management',
    price: '$100',
    footerRight: '.LLab Creator Infrastructure™',
  },
};

/* ---------- helpers ---------- */
const a = (href, text) => `<a href="${href}">${text || href}</a>`;
const tbl = (head, rows) => `<table class="doc-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const call = (label, text) => `<div class="callout"><div class="callout-label">${label}</div><p>${text}</p></div>`;
const ul = (items) => `<ul class="doc-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const ol = (items) => `<ol class="doc-list">${items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
const chk = (items) => `<ul class="checklist">${items.map((i) => `<li><span class="checkbox"></span><span>${i}</span></li>`).join('')}</ul>`;
const code = (lines) => `<pre style="background:#16241a; color:#fbf5e9; font-size:10px; line-height:1.55; padding:12px 16px; border-radius:3px; margin:10px 0 16px; white-space:pre-wrap; word-break:break-word;">${lines.join('\n')}</pre>`;
const sec = (kicker, title, inner) => `<section class="page">
<div class="content-header"><span class="page-index">${kicker}</span><h2 class="section-title">${title}</h2></div>
${inner}
</section>`;
const h3 = (t) => `<h3 class="doc-h3">${t}</h3>`;
const p = (t) => `<p>${t}</p>`;

const LEVEL_HEAD = ['Level', 'Plan family', 'What changes', 'Your move'];
const PRICING_NOTE = call('Prices and limits move', 'Plan names, limits and prices change often, so this manual names plan families and links to each company\'s own pricing page instead of quoting dollar amounts. Check the page before you buy. A higher level is never required: finish the work at your current level first.');

/* ---------- the tools: roles, links, level ladders ---------- */
const TOOLS = {
  chatgpt: {
    name: 'ChatGPT', by: 'OpenAI', role: 'Your second opinion and your writer. Draft and tighten copy, plan a page, compare two ideas, check a table.',
    links: [['ChatGPT', 'https://chatgpt.com'], ['Plans and pricing', 'https://chatgpt.com/pricing'], ['Help center', 'https://help.openai.com']],
    levels: [
      ['1 · Base', 'Free', 'Chat, writing, simple planning. Lower limits.', 'Draft your headline, problem line and slogans. Paste a section and ask for three shorter versions.'],
      ['2 · Starter', 'Go (where offered)', 'More messages and files than Free.', 'Use it for daily copy edits when Free runs out.'],
      ['3 · Builder', 'Plus', 'Fuller model access, file uploads, Projects, custom GPTs.', 'Keep one Project per website. Upload the blueprint and the glossary as reference files.'],
      ['4 · Studio', 'Pro', 'The highest individual limits for heavy daily use.', 'Run long reviews: paste a whole page and ask for a contrast, wording and structure audit.'],
      ['5 · Ceiling', 'Business or Enterprise', 'Shared workspace, admin controls, data controls for teams.', 'Give every collaborator the same Project, the same rules and the same reference files.'],
    ],
  },
  claude: {
    name: 'Claude', by: 'Anthropic', role: 'Your builder. Reads your project, edits the pages, runs the tests, opens the pull request.',
    links: [['Claude', 'https://claude.ai'], ['Plans and pricing', 'https://claude.com/pricing'], ['Claude Code documentation', 'https://code.claude.com/docs']],
    levels: [
      ['1 · Base', 'Free', 'Chat and drafting. Claude Code is not included.', 'Use chat to write copy and plan the page. Paste code back by hand.'],
      ['2 · Starter', 'Pro', 'Adds Claude Code and higher limits.', 'Connect your GitHub repository. Ask for one small change at a time.'],
      ['3 · Builder', 'Max (5x usage)', 'Several times the Pro usage for daily building.', 'Run a full loop every day: change, test, pull request, merge.'],
      ['4 · Studio', 'Max (20x usage)', 'The largest individual allowance for all-day sessions.', 'Run long sessions and several tasks side by side.'],
      ['5 · Ceiling', 'Team, Enterprise or the API', 'Shared seats, admin controls, or pay-as-you-go use in your own tools.', 'Standardize one CLAUDE.md for the team, or build the loop into your own software.'],
    ],
  },
  github: {
    name: 'GitHub', by: 'GitHub', role: 'Your vault and your approval step. Holds every version, every change and every review.',
    links: [['GitHub', 'https://github.com'], ['Plans and pricing', 'https://github.com/pricing'], ['Documentation', 'https://docs.github.com'], ['GitHub CLI', 'https://cli.github.com']],
    levels: [
      ['1 · Base', 'Free', 'Repositories, pull requests, issues and a monthly allowance of automation minutes.', 'One repository, a protected main branch, and a pull request for every change.'],
      ['2 · Starter', 'Free plus Copilot (optional add-on)', 'Inline coding help in your editor.', 'Only add it if you edit code by hand. Claude already covers the loop.'],
      ['3 · Builder', 'Team', 'Shared private repositories, required reviews and branch rules for several people.', 'Require one review before anything reaches main.'],
      ['4 · Studio', 'Enterprise', 'Organization-wide controls, single sign-on and audit logs.', 'Standardize access for a company or a large collective.'],
      ['5 · Ceiling', 'Enterprise with security add-ons', 'Secret scanning and code scanning as paid add-ons.', 'Turn on secret scanning so a key can never be committed by accident.'],
    ],
  },
  netlify: {
    name: 'Netlify', by: 'Netlify', role: 'Your publisher. Watches your main branch and puts the new version on the web.',
    links: [['Netlify', 'https://www.netlify.com'], ['Plans and pricing', 'https://www.netlify.com/pricing/'], ['Documentation', 'https://docs.netlify.com'], ['Netlify CLI', 'https://docs.netlify.com/cli/get-started/']],
    levels: [
      ['1 · Base', 'Free', 'A monthly allowance of usage credits, deploy previews, custom domain with a certificate.', 'Connect the repository once. Every merge to main publishes.'],
      ['2 · Starter', 'Personal', 'A larger credit allowance and extra monitoring.', 'Move up when a launch or a busy month uses your credits.'],
      ['3 · Builder', 'Pro', 'A larger allowance, shared settings and private team features.', 'Use shared environment variables so every site reads the same keys.'],
      ['4 · Studio', 'Enterprise', 'Service commitments, single sign-on and support.', 'Reserve it for a company site with uptime requirements.'],
      ['5 · Ceiling', 'Enterprise (custom)', 'Custom limits and network options.', 'Talk to Netlify sales about the exact limits you need.'],
    ],
  },
  composio: {
    name: 'Composio', by: 'Composio', role: 'Your connector. Lets Claude or ChatGPT reach your other apps (GitHub, Stripe, Gmail and more) with managed sign-in.',
    links: [['Composio', 'https://composio.dev'], ['Plans and pricing', 'https://composio.dev/pricing'], ['Documentation', 'https://docs.composio.dev'], ['Dashboard', 'https://dashboard.composio.dev']],
    levels: [
      ['1 · Base', 'Free', 'A monthly allowance of tool calls to try the connection.', 'Connect one app (GitHub) and run one read-only check.'],
      ['2 · Starter', 'Pro', 'A larger monthly allowance of tool calls.', 'Add the apps you use every day, such as Stripe and your email.'],
      ['3 · Builder', 'Business', 'A much larger allowance and team features.', 'Share connections across a team and run checks on a schedule.'],
      ['4 · Studio', 'Enterprise', 'Custom limits, support and security reviews.', 'Use it when the connections touch customer data at scale.'],
    ],
  },
};

const ladder = (t) => `${h3(`${t.name} — the levels`)}${tbl(LEVEL_HEAD, t.levels)}
<p style="font-size:10.5px;"><strong>Links:</strong> ${t.links.map(([l, h]) => a(h, l)).join(' · ')}</p>`;

/* ---------- pages ---------- */
const pages = [];

/* How to use this manual */
pages.push(sec('START HERE', 'How to use <strong>this manual</strong>', `
<p class="lead">This manual shows you how to build a luxury-style, ad-style website and keep it running with five tools: ChatGPT, Claude, GitHub, Netlify and Composio. You do not need to write code. You need to give clear instructions, check the result, and approve it.</p>
${call('The Streamlined Loop', 'One short loop, repeated for every change. <strong>Brief</strong> it (ChatGPT) → <strong>Build</strong> it (Claude) → <strong>Hold</strong> it (GitHub) → <strong>Publish</strong> it (Netlify) → <strong>Connect</strong> it (Composio) → <strong>Check</strong> the live page. Then start the next change.')}
${h3('Two editions, five levels')}
${p('Part 3 is the <strong>iPhone Edition</strong>. Part 4 is the <strong>Computer Edition</strong>. Read the one you work on, or both. Each edition runs from a <strong>base level</strong> (the least you need) to a <strong>ceiling level</strong> (the most the market offers today). Every tool also has its own five-level ladder in Part 2.')}
${tbl(['Part', 'What it holds', 'Read it when'], [
    ['1 · The Blueprint', 'The page pattern, the rules, and a build checklist.', 'You are planning the site.'],
    ['2 · The Five Tools', 'What each tool does, its level ladder, and links.', 'You are choosing plans or setting up.'],
    ['3 · iPhone Edition', 'A manual for building from an iPhone.', 'Your phone is your main device.'],
    ['4 · Computer Edition', 'A manual for building from a laptop or desktop.', 'You work at a desk.'],
    ['5 · Selling', 'How to put a product on the site and take payment.', 'You are ready to sell.'],
    ['6 · Appendices', 'Troubleshooting, the full glossary and a launch checklist.', 'Something broke, or you are about to launch.'],
  ])}
${call('How to read the links', 'Every link in this PDF is clickable. Pricing pages are linked, not quoted, so the numbers you see are current.')}
${PRICING_NOTE}
`));

/* Part 1 */
pages.push(sec('PART 1 · THE BLUEPRINT', 'The page pattern, <strong>nine parts</strong>', `
${p('Build every page from the same nine parts, in this order. A visitor learns the pattern on the first page and trusts it on every page after.')}
${tbl(['Part', 'Design term', 'The idea', 'Build it like this'], [
    ['Header', 'Masthead and navigation bar', 'Orients the visitor and gives one way home.', 'Logo at left, six top-level links, one "More" dropdown, Sign in at the end. Identical on every page.'],
    ['Ribbon', 'Sub-navigation bar with chips', 'Shows where this page sits in the larger system.', 'One label, a row of chips, one join button. The chips for this page glow.'],
    ['Hero', 'Hero section', 'States the problem in one headline.', 'Background photo under a scrim, an eyebrow, a headline, one primary button.'],
    ['Problem and solution', 'Split block', 'Problem on one side, your IP as the solution on the other.', 'Two columns: eyebrow, headline and one short paragraph each. No promises.'],
    ['Main points', 'Cards and product groups', 'The page\'s own offer. Nothing repeated from another page.', 'One idea per page. A grid of cards, one primary button per card.'],
    ['Strategy table', 'Ad-style data table', 'Lets a visitor choose a path.', 'Gradient header band, page-name tags, glowing chips, one-line idea. Every cell links.'],
    ['Continue strip', 'Next-step links', 'Moves the visitor on without a dead end.', 'Two links per page, arranged as a one-way ring so no two pages link back and forth.'],
    ['Sticky button', 'Sticky call to action', 'Keeps the main action in reach on phones.', 'Appears after the first screen on pages that sell. One button, one destination.'],
    ['Footer', 'Footer', 'Legal text, contact and the menu again.', 'Footer menus mirror the header menu. Give the legal note clear space above it.'],
  ])}
`));

pages.push(sec('PART 1 · THE BLUEPRINT', 'Seven rules <strong>that hold it together</strong>', `
${tbl(['Rule', 'What it means', 'How to check it'], [
    ['One idea, one page', 'Each product or idea lives on exactly one page. Other pages link to it and never repeat it.', 'Search your site for a product name. It should have one home.'],
    ['Repeat only the model', 'The one shared element is the ribbon that shows the whole system.', 'Every other block is unique to its page.'],
    ['Problem, then solution', 'Copy names the problem and offers your IP as the solution. It makes no promises, claims or earnings statements.', 'Read each headline aloud. Delete any promise.'],
    ['Tag every tactic', 'Each ad, page, offer and email is tagged to a direction (who) and a phase (when).', 'Keep one table that lists every tactic with its tags.'],
    ['Legible by rule', 'Small text has a contrast ratio of at least 4.5:1. The smallest text is bold white. Text on photos sits on a frosted panel.', 'Run a contrast checker on every text and background pair.'],
    ['Mark what you coined', 'Every name you created carries the trademark symbol, every time it appears.', 'Keep a list of your coined names and search the site for each.'],
    ['Prices in one place', 'Prices and payment links come from one pricing file, never typed into a page.', 'Change a price in the file and confirm every page updates.'],
  ])}
${h3('Choosing your accent color')}
${p('Pick one accent and use it for actions and active states only. A red-to-orange gradient with a soft glow reads as energy on a dark ground. Test the accent against your background: black text on the gradient and white text on a deep red tag both pass the 4.5:1 rule, but white text on bright orange does not. Avoid yellow-orange, which looks off beside red.')}
${call('Plan the site on one page', 'List your pages, give each one a direction and a one-line slogan, then check that no two pages sell the same thing. That list becomes your strategy table.')}
`));

pages.push(sec('PART 1 · THE BLUEPRINT', 'The build <strong>checklist</strong>', `
${chk([
    'Write one sentence that names the problem your visitor has.',
    'Write one sentence that names your IP as the solution.',
    'List your pages. Give each page one direction and one slogan.',
    'Choose the six top-level menu items. Everything else goes in "More".',
    'Choose one accent color. Test it for contrast.',
    'Gather your own photographs. Blur any third-party logo before you use a photo.',
    'List every name you coined. Mark each one with ™ everywhere it appears.',
    'Decide where each product lives. One page per product.',
    'Put every price and payment link in one pricing file.',
    'Build the header, ribbon, footer and strategy table first. They repeat everywhere.',
    'Build each page from the nine parts, in order.',
    'Make the two-link Continue strip a one-way ring.',
    'Test every page at phone width and desktop width.',
    'Check that no page scrolls sideways.',
    'Read every headline aloud and delete any promise.',
    'Publish, then check the live page, not only your preview.',
  ])}
${call('Your loop', 'Do the checklist once with ChatGPT and Claude, then keep it as a template. Every new page starts from it.')}
`));

/* Part 2 */
pages.push(sec('PART 2 · THE FIVE TOOLS', 'The Streamlined <strong>Loop</strong>', `
${p('Five tools, five jobs. Each one does one thing, so you always know which to open.')}
${tbl(['Step', 'Tool', 'Its job', 'You give it', 'You get back'], [
    ['1 · Brief', 'ChatGPT', 'Second opinion and writer', 'A rough idea and your rules', 'Clean copy and a page plan'],
    ['2 · Build', 'Claude', 'Builder', 'The plan and the repository', 'Edited pages and passing tests'],
    ['3 · Hold', 'GitHub', 'Vault and approval step', 'A branch of changes', 'A pull request you review and merge'],
    ['4 · Publish', 'Netlify', 'Publisher', 'The merged main branch', 'The live website'],
    ['5 · Connect', 'Composio', 'Connector to other apps', 'Permission to reach an app', 'Checks, payments data, drafts'],
  ])}
${h3('How one change travels')}
${ol([
    'You tell ChatGPT what you want and ask for the exact wording.',
    'You paste that wording to Claude and ask for the change on a new branch.',
    'Claude edits the files, runs the tests and pushes the branch to GitHub.',
    'GitHub shows the change as a pull request. You read it and merge it.',
    'Netlify sees the new main branch and publishes it.',
    'You open the live page and check it. If Composio is connected, Claude can check it for you.',
  ])}
${call('Why this order', 'The branch and pull request are your undo button. Nothing reaches the live site until you merge, and any merge can be reversed in one click on GitHub.')}
${call('Rule of thumb', 'Ask for one small change at a time. A small change is easy to read, easy to test and easy to undo.')}
`));

const USE = {
  chatgpt: ['Keep one Project (or one saved chat) for the website. Paste your rules at the top: no promises, mark coined names with ™, one idea per page.', 'Ask for three versions of every headline and choose the shortest that is still clear.', 'Before you publish, paste a finished section and ask: "Where is this vague, long or promising something?"', 'Do not paste secrets or customer data.'],
  claude: ['Start every session by telling Claude the one change you want, the page it belongs to, and the rules.', 'Ask it to work on a new branch and to run your tests before it pushes.', 'Read the summary it gives you, then read the pull request on GitHub. You approve; Claude does not.', 'Keep a short project file (CLAUDE.md) with your pages, rules and commands. Claude reads it at the start of every session.'],
  github: ['Keep one repository for the whole site. Protect the main branch so changes arrive only through pull requests.', 'Read the Files changed tab of every pull request. Green means tests passed; you still read it.', 'Merge with the Squash option so each change is one tidy step in your history.', 'To undo a merge, open the merged pull request and choose Revert.'],
  netlify: ['Connect the repository once and set main as the publish branch. After that you never upload files by hand.', 'Open Deploys after every merge and wait for Published.', 'Open the deploy preview link on a pull request to test on a real phone before you merge.', 'Keep secrets in Site configuration → Environment variables, never in the repository.'],
  composio: ['Connect one app at a time and test each with a read-only request first.', 'Ask Claude or ChatGPT to use the connection for checks: "Confirm the live page shows the new headline." or "List my Stripe products."', 'Reconnect an app in the dashboard if a request says the connection expired.', 'Give each connection the least access it needs.'],
};
['chatgpt', 'claude', 'github', 'netlify', 'composio'].forEach((k, i) => {
  const t = TOOLS[k];
  pages.push(sec('PART 2 · THE FIVE TOOLS', `${t.name} <strong>· ${['Brief', 'Build', 'Hold', 'Publish', 'Connect'][['chatgpt', 'claude', 'github', 'netlify', 'composio'].indexOf(k)]}</strong>`, `
${p(`<strong>Job in the loop.</strong> ${t.role}`)}
${ladder(t)}
${h3('Use it like this')}
${ul(USE[k])}
`));
});

/* Part 3: iPhone */
pages.push(sec('PART 3 · IPHONE EDITION', 'Build from <strong>your iPhone</strong>', `
<p class="lead">An iPhone is enough to run the whole loop. The heavy work happens in the cloud, on Claude's servers and Netlify's servers. Your phone is where you brief, review, approve and check.</p>
${h3('Choose your iPhone level')}
${p('Level means the device you hold, from the least you need to the most the market offers. Names of models change every year, so judge your phone by these capabilities.')}
${tbl(['Level', 'Your iPhone', 'What it handles well', 'What to watch'], [
    ['Base', 'The oldest iPhone that still updates to the current version of iOS. At least 64 GB free space is comfortable.', 'Briefing, reviewing a pull request, checking the live site, dictating copy.', 'Small screen for wide tables. Clear photos from Photos before uploading. Slower with big photo batches.'],
    ['Mid', 'A current standard iPhone with 128 GB or more.', 'Everything in Base, plus photo uploads, longer sessions and fast switching between apps.', 'Battery on long review days. Keep a USB-C or Lightning charger and a power bank.'],
    ['Ceiling', 'A current Pro or Pro Max class iPhone with 256 GB to 1 TB.', 'The largest screen for reading tables, the best camera for your own photographs, the best battery.', 'Do not buy it for the website. Buy it if the camera or screen serves your craft.'],
  ])}
${call('You can start at Base', 'Everything in this edition works at the base level. A higher level makes reviewing faster and photography better. It does not change what the tools can do.')}
${h3('Add-ons that help')}
${ul(['A Bluetooth keyboard for long drafting sessions.', 'A stand or case with a kickstand so the phone sits at eye level for reviews.', 'A power bank for a full day away from a desk.', 'An Apple Pencil is not needed. Use Dictation for long text.'])}
`));

pages.push(sec('PART 3 · IPHONE EDITION', 'Set up <strong>in twenty minutes</strong>', `
${ol([
    `<strong>Secure your Apple ID.</strong> Turn on two-factor authentication. Use passkeys wherever a service offers them. Open Settings → your name → Sign-In & Security.`,
    `<strong>Install the apps.</strong> From the App Store, get ${a('https://chatgpt.com', 'ChatGPT')}, ${a('https://claude.ai', 'Claude')} and ${a('https://github.com/mobile', 'GitHub')}.`,
    `<strong>Make home-screen shortcuts for the dashboards.</strong> Netlify and Composio run in Safari. Open ${a('https://app.netlify.com', 'app.netlify.com')} and ${a('https://dashboard.composio.dev', 'dashboard.composio.dev')}, tap Share, then Add to Home Screen.`,
    `<strong>Sign in to each service once.</strong> Use Sign in with GitHub for Netlify and Composio if offered, so one login covers three tools.`,
    `<strong>Connect GitHub to Netlify.</strong> In the Netlify dashboard choose Add new site → Import an existing project → GitHub. Pick your repository. Set the publish branch to main.`,
    `<strong>Connect Claude to your repository.</strong> In the Claude app, open Claude Code and choose your GitHub repository. Follow the prompts to grant access.`,
    `<strong>Connect Composio.</strong> In the Composio dashboard, connect GitHub first. Then add the other apps you use. Follow ${a('https://docs.composio.dev', 'the Composio documentation')} to add Composio as a connector inside Claude or ChatGPT.`,
    `<strong>Turn on Dictation.</strong> Settings → General → Keyboard → Enable Dictation. Tap the microphone key to speak your changes.`,
  ])}
${call('Check', 'Open your live site in Safari. If it loads, Netlify is connected. Open the repository in the GitHub app. If you see your files, GitHub is connected.')}
${call('Never paste secrets', 'Do not paste passwords, API keys or the Stripe secret key into any chat. Put them in Netlify under Site configuration → Environment variables. Tools read them there.')}
`));

pages.push(sec('PART 3 · IPHONE EDITION', 'The ten-minute <strong>update loop</strong>', `
${p('This is the loop you will run every day from your phone.')}
${ol([
    `<strong>Brief (ChatGPT).</strong> Tap the microphone and speak the change: "Rewrite the Partnership headline to name the problem of working alone. Give me three short versions." Pick one.`,
    `<strong>Build (Claude).</strong> Open Claude Code on your repository. Paste the chosen wording and say: "On a new branch, change the Partnership headline to this exact text. Run the tests. Push the branch."`,
    `<strong>Hold (GitHub).</strong> Open the GitHub app. Tap the new pull request. Read the Files changed tab. Tap Review, then Approve if you are the reviewer. Tap Merge.`,
    `<strong>Publish (Netlify).</strong> Netlify publishes main by itself. Open the Netlify shortcut, then Deploys. Wait for a green Published label, usually within a minute or two.`,
    `<strong>Check (Safari).</strong> Open your live site. Pull down to refresh. If the old text appears, tap the page's reload button once more, then try a private tab.`,
    `<strong>Connect (Composio, optional).</strong> Ask Claude: "Fetch the live page and confirm the new headline appears." The check runs through your connection.`,
  ])}
${call('One change per loop', 'Keep each loop to one small change. Five small loops are safer than one big one, and each can be undone separately.')}
${h3('A useful prompt pattern')}
${code(['Change: <what you want, in one sentence>', 'Where: <the page or section>', 'Rules: keep my wording exact; no promises; mark coined names with ™;', '       run the tests; push to a new branch; do not merge.'])}
`));

pages.push(sec('PART 3 · IPHONE EDITION', 'Photographs, copy <strong>and shortcuts</strong>', `
${h3('Photographs from your phone')}
${ol([
    'Shoot in good light, one clear subject, room for text.',
    'Do not include readable third-party logos. If a logo is in the shot, ask Claude to blur it before it goes on the site.',
    'Open Photos, tap Share, then AirDrop to a computer, or attach the photo directly in the Claude app.',
    'Ask Claude to tone the photo to your palette, resize it and add it to the page you name.',
    'Write alternative text for each photo so screen readers can describe it.',
  ])}
${h3('Copy with ChatGPT on the phone')}
${ul([
    'Use voice mode to talk through a page, then ask for a one-paragraph summary.',
    'Keep a Project for the website. Attach your rules so every chat starts with them.',
    'Always ask for three versions, then choose and trim.',
  ])}
${h3('Shortcuts that save taps')}
${p(`Open the Shortcuts app, tap +, choose Add Action, search for Open URLs. Make four shortcuts, then add each to your Home Screen:`)}
${tbl(['Shortcut name', 'Opens'], [
    ['Live site', 'Your website address'],
    ['Pull requests', `Your repository's pull requests page on ${a('https://github.com', 'github.com')}`],
    ['Deploys', 'The Deploys page for your site in Netlify'],
    ['Connections', a('https://dashboard.composio.dev', 'dashboard.composio.dev')],
  ])}
`));

pages.push(sec('PART 3 · IPHONE EDITION', 'iPhone levels, <strong>base to ceiling</strong>', `
${p('Combine your device level with your plan levels. This table shows a sensible starting point at each step. Move up only when you hit a real limit.')}
${tbl(['Stage', 'iPhone level', 'Plan levels', 'What you can run'], [
    ['Base', 'Base', 'ChatGPT Free · Claude Free · GitHub Free · Netlify Free · Composio Free', 'Write and plan in chat. Edit pages by pasting changes into GitHub. Publish with Netlify. No Claude Code yet.'],
    ['Starter', 'Base or Mid', 'Claude Pro with Claude Code · others at Free', 'The full loop from your phone, one change at a time.'],
    ['Builder', 'Mid', 'ChatGPT Plus · Claude Max · GitHub Free · Netlify Personal · Composio Pro', 'Daily loops, photo work, several apps connected.'],
    ['Studio', 'Mid or Ceiling', 'Claude Max (higher) · Netlify Pro · Composio Pro or Business', 'All-day sessions and a busy launch week.'],
    ['Ceiling', 'Ceiling', 'Team or Enterprise plans where a company needs them', 'A shared workflow across a team, reviewed on phones.'],
  ])}
${h3('What a phone cannot do')}
${ul([
    'Run the website on your own device. You preview on Netlify instead, using a deploy preview link for each pull request.',
    'Run heavy photo editing. Do batches on a computer, or send the photos to Claude to process in the cloud.',
    'Show a very wide table at full size. Rotate to landscape or use Safari\'s Request Desktop Website.',
  ])}
${call('Preview on your phone', 'When Claude opens a pull request, Netlify builds a deploy preview with its own link. Open that link in Safari to test the change before you merge.')}
`));

/* Part 4: Computer */
pages.push(sec('PART 4 · COMPUTER EDITION', 'Build from <strong>a computer</strong>', `
<p class="lead">A computer gives you the fastest loop: a local preview, a terminal, and room to run tests. You can start with nothing installed and add each tool as you need it.</p>
${h3('Choose your computer level')}
${tbl(['Level', 'Your computer', 'How you work', 'What to watch'], [
    ['Base', 'Any laptop or Chromebook with a current browser and a reliable connection. 4 to 8 GB of memory is enough.', 'Cloud only. Use Claude Code on the web, the browser editor at github.dev (press the period key in a repository) and the Netlify dashboard.', 'No local preview. Use Netlify deploy previews. Close extra tabs to keep it fast.'],
    ['Mid', 'A current Windows, Mac or Linux laptop or desktop with 8 to 16 GB of memory and room for photos.', 'Local tools: Git, Node.js, an editor, Claude Code in the terminal, the GitHub CLI and the Netlify CLI.', 'Keep the system and tools updated. Back up your photographs.'],
    ['Ceiling', 'A high-memory desktop or workstation, 32 GB or more, with one or two large monitors.', 'Run the site, the tests and a browser test suite at once. Several Claude sessions side by side. Large photo batches.', 'Buy it for photo and video work, not for the website alone.'],
  ])}
${call('You can start at Base', 'A base computer runs the whole loop in the browser. Add local tools when waiting for previews slows you down.')}
${h3('Install the tools (Mid and Ceiling)')}
${tbl(['Tool', 'Get it', 'Check it works'], [
    ['Git', a('https://git-scm.com', 'git-scm.com'), '<code>git --version</code>'],
    ['Node.js (LTS)', a('https://nodejs.org', 'nodejs.org'), '<code>node --version</code>'],
    ['Editor', a('https://code.visualstudio.com', 'code.visualstudio.com') + ' or any editor you like', 'Open a folder and a file'],
    ['GitHub CLI', a('https://cli.github.com', 'cli.github.com'), '<code>gh --version</code>'],
    ['Netlify CLI', a('https://docs.netlify.com/cli/get-started/', 'docs.netlify.com/cli'), '<code>netlify --version</code>'],
    ['Claude Code', a('https://code.claude.com/docs', 'code.claude.com/docs'), '<code>claude --version</code>'],
  ])}
`));

pages.push(sec('PART 4 · COMPUTER EDITION', 'Set up <strong>the loop</strong>', `
${ol([
    `<strong>Sign in to GitHub from the terminal.</strong> Run <code>gh auth login</code> and follow the prompts.`,
    `<strong>Get your repository.</strong> Run <code>gh repo clone your-name/your-repo</code>, then <code>cd your-repo</code>.`,
    `<strong>Install Claude Code.</strong> Follow the install steps at ${a('https://code.claude.com/docs', 'code.claude.com/docs')}. A common way is <code>npm install -g @anthropic-ai/claude-code</code>. Then run <code>claude</code> in your repository folder and sign in.`,
    `<strong>Install the Netlify CLI.</strong> Run <code>npm install -g netlify-cli</code>, then <code>netlify login</code> and <code>netlify link</code> to connect this folder to your site.`,
    `<strong>Connect Netlify to GitHub once.</strong> In the Netlify dashboard choose Add new site → Import an existing project → GitHub. Set the publish branch to main. After this, every merge to main publishes by itself.`,
    `<strong>Connect Composio.</strong> In the ${a('https://dashboard.composio.dev', 'Composio dashboard')}, connect GitHub, then your other apps. Add Composio to Claude or ChatGPT as a connector using ${a('https://docs.composio.dev', 'the documentation')}.`,
    `<strong>Add your project file.</strong> Create CLAUDE.md in the repository with your pages, rules and commands. Commit it.`,
  ])}
${h3('Preview the site on your computer')}
${p('For a static site, any local server works. These two commands each start one:')}
${code(['npx serve .', '# or', 'python3 -m http.server 8000', '', '# with Netlify features (redirects, functions):', 'netlify dev'])}
${call('Check', 'Open the address the command prints. If your home page loads, the local setup works.')}
`));

pages.push(sec('PART 4 · COMPUTER EDITION', 'The daily <strong>build loop</strong>', `
${ol([
    `<strong>Start fresh.</strong> <code>git checkout main</code> then <code>git pull</code>.`,
    `<strong>Branch.</strong> <code>git checkout -b change-headline</code>.`,
    `<strong>Brief.</strong> Ask ChatGPT for the exact wording. Ask for three versions and pick one.`,
    `<strong>Build.</strong> In your repository folder run <code>claude</code>. Say what to change, where, and which rules apply.`,
    `<strong>Preview.</strong> Run <code>netlify dev</code> or <code>npx serve .</code>. Open the page at desktop width, then narrow the window to phone width.`,
    `<strong>Test.</strong> Run <code>npm test</code> if your project has tests. Ask Claude to fix any failure.`,
    `<strong>Commit and push.</strong> <code>git add -A</code>, <code>git commit -m "Change the Partnership headline"</code>, <code>git push -u origin change-headline</code>.`,
    `<strong>Open the pull request.</strong> <code>gh pr create --fill</code>. Read the Files changed view on GitHub.`,
    `<strong>Merge.</strong> <code>gh pr merge --squash</code> (or the Merge button on GitHub).`,
    `<strong>Check live.</strong> Watch Deploys in Netlify until it says Published. Open the live page and check it at both widths.`,
  ])}
${call('If something is wrong', 'Open the merged pull request on GitHub and choose Revert. GitHub creates a new pull request that undoes it. Merge that, and Netlify publishes the previous version.')}
`));

pages.push(sec('PART 4 · COMPUTER EDITION', 'Netlify <strong>in practice</strong>', `
${tbl(['Need', 'Where to do it', 'Notes'], [
    ['See why a publish failed', 'Netlify → your site → Deploys → the failed deploy → Deploy log', 'Copy the first error line to Claude and ask for a fix.'],
    ['Preview a change before merge', 'The deploy preview link on the pull request', 'Use it to test on a real phone.'],
    ['Redirect an old address', 'A netlify.toml or _redirects file in your repository', 'Ask Claude to add it and test it.'],
    ['Hide a private file from the public', 'A forced 404 redirect in netlify.toml', 'Files in a published folder are public. A redirect with force turned on blocks the address.'],
    ['Store a secret key', 'Site configuration → Environment variables', 'Never put keys in the repository.'],
    ['Run server code', 'A Netlify Function in your functions folder', 'Use for checkout, sign-up and downloads.'],
    ['Roll back', 'Deploys → an earlier deploy → Publish deploy', 'The fastest undo for a bad publish.'],
    ['Use your own domain', 'Domain management → Add a domain', 'Netlify provides a free certificate.'],
  ])}
${call('Public means public', 'Anything in a folder that Netlify publishes can be opened by anyone who knows the address. Keep paid files out of the public path, or block the path with a forced redirect, and serve paid files through a function that checks the purchase first.')}
`));

pages.push(sec('PART 4 · COMPUTER EDITION', 'Computer levels, <strong>base to ceiling</strong>', `
${tbl(['Stage', 'Computer level', 'Plan levels', 'What you can run'], [
    ['Base', 'Base', 'All five tools at Free (Claude without Claude Code)', 'Plan in chat. Edit in the browser at github.dev. Publish with Netlify.'],
    ['Starter', 'Base or Mid', 'Claude Pro with Claude Code · others at Free', 'The full loop with a local preview at Mid.'],
    ['Builder', 'Mid', 'ChatGPT Plus · Claude Max · Netlify Personal · Composio Pro', 'Daily builds with tests, deploy previews and connected apps.'],
    ['Studio', 'Mid or Ceiling', 'Claude Max (higher) · Netlify Pro · Composio Pro or Business', 'Several tasks at once. Scripts that rebuild images, ads and tables.'],
    ['Ceiling', 'Ceiling', 'Team or Enterprise plans', 'A team workflow with required reviews, shared keys and shared checks.'],
  ])}
${h3('Level-ups that pay off at a computer')}
${ul([
    '<strong>Write scripts for anything you repeat.</strong> Ask Claude to write one command that rebuilds your ad images or tables from your data.',
    '<strong>Add tests.</strong> A test that checks every price against your pricing file, and every link against your page map, catches mistakes before they publish.',
    '<strong>Use a browser test tool.</strong> Ask Claude to check every page at desktop and phone width for sideways scrolling and console errors.',
    '<strong>Run checks through Composio.</strong> After each publish, have Claude fetch the live page and confirm the change is there.',
  ])}
`));

/* Part 5: selling */
pages.push(sec('PART 5 · SELLING', 'Put a product <strong>on your site</strong>', `
${p('When a page is ready to sell, add the product in four places, in this order.')}
${ol([
    `<strong>Create the product and price in Stripe.</strong> Use ${a('https://docs.stripe.com/payment-links', 'Stripe Payment Links')}. Set the name, the price and a one-time payment. Copy the price ID and the link.`,
    `<strong>Add one entry to your pricing file.</strong> Name, phase, price, price ID, payment link and the file you deliver. Nothing else on the site types a price by hand.`,
    `<strong>Add the card to its one page.</strong> A name, one sentence, three bullet points and one button. Use the price from the file.`,
    `<strong>Deliver the file safely.</strong> Serve it through a function that checks the purchase. Block the public address with a forced redirect.`,
  ])}
${h3('Rules for sale pages')}
${ul(['Describe the problem and your IP as the solution. Do not promise results.', 'State what the buyer receives and the format.', 'State the license in plain words: a right to use, not ownership.', 'Say whether the payment is one-time or a subscription.', 'Link to your refund and sales policy.'])}
${call('Test before you announce', 'Do a real test purchase, then confirm the file arrives and the account page shows the product. Use ' + a('https://docs.stripe.com/webhooks', 'Stripe webhooks') + ' to deliver automatically after payment.')}
`));

/* Part 6: appendices */
pages.push(sec('PART 6 · APPENDICES', 'Troubleshooting', `
${tbl(['Problem', 'Likely cause', 'Fix'], [
    ['My change is not on the live site', 'The pull request was not merged, or the deploy is still running.', 'Check GitHub for the merge. Check Netlify Deploys for a Published label.'],
    ['The live site shows the old version', 'Your browser or phone is showing a saved copy.', 'Reload, then try a private tab.'],
    ['The deploy failed', 'A build error or a missing file.', 'Open the Deploy log. Send the first error line to Claude.'],
    ['Claude changed more than I asked', 'The request was too broad.', 'Ask it to undo, then repeat with one change and the words "change only".'],
    ['Claude cannot see my repository', 'GitHub access was not granted.', 'Reconnect GitHub in Claude and grant the repository.'],
    ['Composio says a connection is inactive', 'The sign-in expired.', 'Reconnect the app in the Composio dashboard.'],
    ['A page scrolls sideways on my phone', 'An element is wider than the screen.', 'Ask Claude to find the widest element and constrain it.'],
    ['Text is hard to read', 'Low contrast.', 'Run a contrast check. Use white or black text on strong colors.'],
    ['A buyer cannot download', 'The price ID in the pricing file does not match Stripe.', 'Compare the two. Fix the file and publish.'],
    ['I ran out of messages or credits', 'You reached a plan limit.', 'Wait for the reset, or move up one level for that tool.'],
  ])}
`));

pages.push(sec('PART 6 · APPENDICES', 'Links <strong>in one place</strong>', `
${tbl(['Tool', 'Home', 'Plans and pricing', 'Learn'], [
    ['ChatGPT', a('https://chatgpt.com', 'chatgpt.com'), a('https://chatgpt.com/pricing', 'Pricing'), a('https://help.openai.com', 'Help center')],
    ['Claude', a('https://claude.ai', 'claude.ai'), a('https://claude.com/pricing', 'Pricing'), a('https://code.claude.com/docs', 'Claude Code docs')],
    ['GitHub', a('https://github.com', 'github.com'), a('https://github.com/pricing', 'Pricing'), a('https://docs.github.com', 'Docs')],
    ['Netlify', a('https://www.netlify.com', 'netlify.com'), a('https://www.netlify.com/pricing/', 'Pricing'), a('https://docs.netlify.com', 'Docs')],
    ['Composio', a('https://composio.dev', 'composio.dev'), a('https://composio.dev/pricing', 'Pricing'), a('https://docs.composio.dev', 'Docs')],
    ['Stripe', a('https://stripe.com', 'stripe.com'), a('https://stripe.com/pricing', 'Pricing'), a('https://docs.stripe.com/payment-links', 'Payment Links')],
  ])}
${h3('Standards worth knowing')}
${ul([
    `${a('https://www.w3.org/WAI/WCAG22/quickref/', 'WCAG quick reference')} for contrast and accessibility.`,
    `${a('https://developer.mozilla.org', 'MDN Web Docs')} for the exact meaning of any web term.`,
    `${a('https://www.uspto.gov/trademarks', 'USPTO trademarks')} if you want to register the names you coined. Ask a lawyer before you file.`,
  ])}
${call('A note on names', 'The ™ symbol shows you claim a name. It is not a registration. Registration is a separate legal step.')}
`));

pages.push(sec('PART 6 · APPENDICES', 'The full <strong>glossary</strong>', GLOSSARY_GROUPS.map((g) => `${h3(g.name)}${tbl(['Term', 'Meaning', 'Use it for'], g.terms)}`).join('')));

pages.push(sec('PART 6 · APPENDICES', 'Launch <strong>checklist</strong>', `
${chk([
    'Every page uses the nine-part pattern.',
    'The header, ribbon and footer are identical on every page.',
    'Every coined name carries ™ wherever it appears.',
    'No headline makes a promise or an earnings claim.',
    'Every price and payment link comes from the pricing file.',
    'Every paid file is blocked from the public address and delivered by a function.',
    'A test purchase works end to end: payment, file, account page.',
    'Every page passes a contrast check at small sizes.',
    'No page scrolls sideways at phone width.',
    'Every link goes where its label says.',
    'The Continue strips form a one-way ring.',
    'The live site was checked on a phone and on a computer, not only in a preview.',
    'Secrets live only in Netlify environment variables.',
    'You know how to revert a bad publish.',
  ])}
${call('Build the infrastructure. Strengthen the practice. Create the legacy.', 'The free version of the glossary, as a one-page infographic, is on the Creator page of the Co.LLab™ website.')}
`));

export const contentHtml = pages.join('\n');
