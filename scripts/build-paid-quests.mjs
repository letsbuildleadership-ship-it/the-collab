// Builds guided quests for the paid workbooks (content/quests/<product-key>.json)
// by reading each product PDF's own steps, questions, tick-lists and 1-5
// statements, so the quest asks exactly what the workbook asks.
// Needs `pdftotext` (poppler). Re-run after a workbook PDF changes:
//   node scripts/build-paid-quests.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pricing = JSON.parse(fs.readFileSync(path.join(root, 'content/pricing.json'), 'utf8'));
const KEYS = [
  'strength-map', 'values-charter', 'leadership-identity-profile', 'decision-principles-playbook', 'foundations-assessment', 'foundations-manual', 'alignment-map', 'build-plan', 'legacy-profile', 'operating-system', 'legacy-map', 'diagnostic', 'blueprint', 'legacy-architecture',
  'creator-identity-map', 'creator-voice-values-map', 'creator-practice-profile', 'creator-audience-offer-map', 'creator-foundations-assessment', 'creator-foundations-manual', 'creator-alignment-map', 'creator-venture-build-plan', 'creator-operating-system', 'creative-estate-mapping', 'creator-legacy-architecture',
];
// Fixes for lines the PDF text extraction can't express cleanly.
const DROP = /^(Knowledge, leadership continuity|Clarity, purpose, identity|Strategy, decision-making, accountability|Culture, communication, execution)/;
const RENAME = new Map([
  [/^Your identity is not "I make paintings"/, 'What are you actually doing through your medium? Complete: I use [your medium] to …'],
]);

// The .LLab Creator Website Blueprint™ is a manual rather than a workbook, so its quest is written to follow
// the manual's Blueprint, Your First Site and Streamlined Loop™ parts, one phase at a time.
const WEBSITE_QUEST = [
  [0, 'Foundations', 'What is the one sentence your website must say about you and your work?'],
  [0, 'Foundations', 'Who is the one person the site is for first, and what do they need from you?'],
  [0, 'Foundations', 'What is the one action you want a visitor to take?'],
  [1, 'Infrastructure Planning & Management', 'Which pages will the site have, and what does each one do for the visitor?'],
  [1, 'Infrastructure Planning & Management', 'Which tool will you use for each step of the Streamlined Loop™: brief, build, hold, publish and connect?'],
  [1, 'Infrastructure Planning & Management', 'What will you offer or sell on it, and how will people pay or contact you?'],
  [2, 'Internal Operating Systems', 'What is your update loop: how often will you update the site, and what is the first ten-minute update you will do?'],
  [2, 'Internal Operating Systems', 'Which photographs, copy and links will you keep current, and where do you keep them?'],
  [3, 'Preservation', 'Who owns your domain, hosting account and code repository, and where are those logins safely kept?'],
  [3, 'Preservation', 'If you could not touch the site for six months, what would keep it running and who could update it?'],
  [3, 'Preservation', 'What will you write down so someone else could rebuild the site from your notes?'],
];
// A free member quest for any event (conference, fundraiser, festival, market, performance).
// Written in executive language: inside the membership it is a quest, in the world it is event infrastructure.
// "open" means every signed-in member can use it; it is not tied to a product.
const EVENT = [
  [0, 'Purpose and stakeholders', 'Define the purpose: what outcome should this event produce, and what should attendees carry away from it?'],
  [0, 'Purpose and stakeholders', 'Identify the stakeholders: attendees, presenters or artists, your team, the venue, sponsors and the surrounding community. Who is the event for first?'],
  [0, 'Purpose and stakeholders', 'State your non-negotiables: the standards this event will not trade for revenue or attendance.'],
  [1, 'Ownership and authority', 'Assign ownership: name one accountable owner for each of program and content, venue and setup, audio-visual and technical, security and crowd safety, welfare and first aid, registration and admission, vendors and hospitality, and volunteers and staff.'],
  [1, 'Ownership and authority', 'Secure authority: which permits, licenses, insurance and venue agreements are required, and who holds each? (Confirm requirements locally.)'],
  [1, 'Ownership and authority', 'Establish the financial plan: costs, revenue sources and the break-even point.'],
  [1, 'Ownership and authority', 'Design attendee flow: registration or ticketing, admission, capacity, circulation, accessibility, and entry and exit.'],
  [2, 'Operations', 'Set the operating rhythm: the run-of-show from opening to close, the owner of each segment, and who calls each cue.'],
  [2, 'Operations', 'Confirm technical readiness: sound, screens and lighting, power and redundancy, and a full test before admission.'],
  [2, 'Operations', 'Establish the safety and welfare protocol: first aid, hydration and climate, accessibility, emergency response, alcohol or other substances as law and venue require, and how an incident is reported and who acts.'],
  [2, 'Operations', 'Define command and communication: channels, decision rights, and the contingency when the plan fails.'],
  [3, 'Continuity and legacy', 'Capture results: attendance, outcomes against purpose, incidents and lessons learned.'],
  [3, 'Continuity and legacy', 'Sustain relationships: how presenters or artists, your team, the venue, sponsors and the community are thanked and retained, and what is owed to them after the event.'],
  [3, 'Continuity and legacy', 'Document for continuity: contacts, contracts, run sheets and setup plans, in enough detail for another leader to run the next one.'],
  [3, 'Continuity and legacy', 'Build the legacy: what would make this event a lasting series, collective or institution that someone else could carry on?'],
];
const PHASE_LABEL = { foundations: 'Phase I · Foundations', 'infrastructure-planning': 'Phase II · Infrastructure Planning & Management', 'operating-systems': 'Phase III · Internal Operating Systems', preservation: 'Phase IV · Preservation' };

const SKIP_SECTIONS = /^(THE CO\.LLAB PRINCIPLE|THE NEXT STEP|YOUR NEXT STEP|HOW TO RESPOND|BUILD FROM STRENGTH|YOUR CO\.LLAB™ INFRASTRUCTURE PROFILE|YOUR INFRASTRUCTURE ROADMAP|THE CO\.LLAB™? OPERATING RHYTHM|YOUR NEXT MOVE|THE LEGACY INFRASTRUCTURE MODEL|THE FINAL OUTPUT)/;
const INSTRUCTION = /^(build from|define|choose|complete|ask yourself|repeat|circle|select|use |check|identify the|note|key question|strengthen|explore)/i;
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s—–-])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bIv\b/g, 'IV').replace(/\bIi\b/g, 'II').replace(/\bIii\b/g, 'III').replace(/Co\.llab/g, 'Co.LLab').replace(/\bLlab\b/g, '.LLab').replace(/ And /g, ' and ').replace(/ Of /g, ' of ').replace(/ To /g, ' to ').replace(/ The /g, ' the ');
const PHASE_QUESTION = ['What should never be lost as we grow?', 'What depends on a person that should belong to the organization?', 'How do we make what matters part of how we operate?', 'What must exist for what we built to continue?'];
const phaseOf = (header, fallback) => {
  if (/PHASE IV|PRESERVATION/.test(header)) return 3;
  if (/PHASE III|OPERATING SYSTEMS/.test(header)) return 2;
  if (/PHASE II\b|PLANNING/.test(header)) return 1;
  if (/PHASE I\b|FOUNDATIONS/.test(header)) return 0;
  return fallback;
};

function workbookLines(key) {
  const txt = execFileSync('pdftotext', ['-layout', path.join(root, 'content/library', `${key}.pdf`), '-'], { encoding: 'utf8', maxBuffer: 20e6 });
  const lines = txt.split('\n')
    .map((l) => l.replace(/\s+/g, ' ').replace(/ The Co\.LLab™$/, '').replace(/(PAGE\s*)?\d+ OF \d+/g, '').trim())
    .filter((l) => l && l !== 'The Co.LLab™' && l !== 'PAGE');
  // The workbook starts at the first "The Co.LLab: Building Leadership Infrastructure™" line after the license page.
  const start = lines.findIndex((l) => l === 'The Co.LLab: Building Leadership Infrastructure™');
  const out = [];
  for (const l of lines.slice(start + 1)) {
    if (/^(Explore The Co\.LLab|G L O SS A RY|Glossary Of Terms|APPENDIX A)/.test(l)) break;
    if (/^THE CO\.LLAB™ — /.test(l)) continue;
    out.push(l);
  }
  return out;
}

function parse(key) {
  const lines = workbookLines(key);
  const nodes = [];
  const scaleHint = [];
  let header = '';
  let skipping = false;
  let phase = null;
  let pendingQuestion = null;
  let pick = { min: 1, max: 1 };
  let lastChoose = null;
  let sectionNodeStart = 0;
  let sectionNarrative = [];
  let stemSection = false;

  const isHeader = (l) => /^(STEP \d+|PHASE (I|II|III|IV)\b|WEEK \d|PART [A-Z0-9]+|MODULE \d|PILLAR \d)/.test(l) || (/^[A-Z0-9 &™.\-—–’']+$/.test(l) && /[A-Z]{3}/.test(l) && !/^\d+\.?$/.test(l) && l.length < 70);
  const bullets = (l) => l.replace(/^[^A-Za-z0-9"“]+/, '').trim();

  // join wrapped sentences: a line without terminal punctuation followed by a lowercase-starting line
  const joined = [];
  for (let i = 0; i < lines.length; i += 1) {
    let l = lines[i];
    while (i + 1 < lines.length && !/[?:.!↓™]$/.test(l) && !isHeader(l) && /^[a-z]/.test(lines[i + 1]) && !/^☐/.test(l) && l.length > 30) { l = `${l} ${lines[i + 1]}`; i += 1; }
    joined.push(l);
  }

  const push = (n) => {
    const pm = /^(FOUNDATIONS|INFRASTRUCTURE PLANNING & MANAGEMENT|INTERNAL OPERATING SYSTEMS|PRESERVATION) — /.exec(n.prompt || '');
    if (/^Offer \/ Price/.test(n.prompt || '') || DROP.test(n.prompt || '')) return {};
    for (const [re, to] of RENAME) if (re.test(n.prompt || '')) n = { ...n, prompt: to };
    nodes.push({ id: `n${nodes.length + 1}`, section: titleCase(header), phase: pm ? phaseOf(pm[1], phase) : phase, ...n });
    return nodes[nodes.length - 1];
  };
  const closeSection = (nextHeader = '') => {
    if (/^(PHASE|FOUNDATIONS|INFRASTRUCTURE|INTERNAL|PRESERVATION)/.test(nextHeader)) { sectionNarrative = []; return; }
    // a section that asked for something in plain sentences (no "?" or ":" prompt) still becomes one prompt
    if (header && !skipping && !stemSection && nodes.length === sectionNodeStart && sectionNarrative.length) {
      const text = sectionNarrative.join(' ').replace(/\s+/g, ' ');
      const sentences = text.match(/[^.?!]+[.?!]+/g) || [text];
      push({ type: 'text', prompt: sentences.slice(0, 2).join(' ').trim().slice(0, 260) });
    }
    sectionNarrative = [];
  };

  for (let i = 0; i < joined.length; i += 1) {
    const l = joined[i];
    const next = joined[i + 1] || '';
    if (/^\d — /.test(l)) { scaleHint.push(l.replace(' — ', ' = ')); continue; }

    if (isHeader(l) && !/^[A-Z]$/.test(l)) {
      closeSection(l);
      header = l;
      skipping = SKIP_SECTIONS.test(l);
      stemSection = /STATEMENT|COMMITMENT/.test(l);
      phase = phaseOf(l, null);
      pendingQuestion = null;
      lastChoose = null;
      sectionNodeStart = nodes.length;
      continue;
    }
    if (skipping || l === '↓' || l === '.' || /^\d+\.$/.test(l)) continue;

    const scale = l.match(/^\s*(\d+)\.\s+(.+?)\s+1 2 3 4 5$/);
    if (scale) { push({ type: 'scale', prompt: scale[2], min: 1, max: 5 }); continue; }
    if (/^\d+\.\s+.+/.test(l) && /^1 2 3 4 5$/.test(next)) { push({ type: 'scale', prompt: l.replace(/^\d+\.\s+/, ''), min: 1, max: 5 }); i += 1; continue; }
    if (/^1 2 3 4 5$/.test(l)) continue;

    if (l.startsWith('☐')) {
      const opt = l.replace(/^☐\s*/, '').trim();
      if (/^Other:?$/i.test(opt)) continue;
      if (!lastChoose) lastChoose = push({ type: 'choose', prompt: pendingQuestion || 'Choose what fits', options: [], pickMin: pick.min, pickMax: pick.max });
      lastChoose.options.push(opt);
      continue;
    }
    lastChoose = null;

    // "Explore:" / "Build from:" tick-lists become a coverage question: which of these exist today?
    if (/^(Explore|Build from):?$/i.test(l)) {
      const options = [];
      let j = i + 1;
      while (j < joined.length && !isHeader(joined[j]) && !/[:.?!]$/.test(joined[j]) && joined[j].length <= 45 && !/^(Define|Strengthen)/.test(joined[j])) { options.push(bullets(joined[j])); j += 1; }
      if (options.length >= 3) push({ type: 'choose', coverage: true, prompt: 'Which of these are already in place in your organization today?', options, pickMin: 0, pickMax: options.length });
      i = j - 1;
      continue;
    }
    if (/^Key question:?$/i.test(l)) {
      const hasQ = /\?$/.test(next);
      if (!hasQ && phase !== null) push({ type: 'text', prompt: PHASE_QUESTION[phase] });
      continue;
    }

    const choose = l.match(/^Choose (\d+)[–-](\d+):?$/i);
    if (choose) { pick = { min: Number(choose[1]), max: Number(choose[2]) }; continue; }
    if (/^Choose one:?$/i.test(l)) { pick = { min: 1, max: 1 }; continue; }
    if (/^Complete( this| each section)?:?$/i.test(l)) continue;
    if (INSTRUCTION.test(l) && l.length < 60 && /[:.]$/.test(l)) continue;

    if (/^Strengthen:/.test(l)) continue;

    const startsChoice = () => { let j = i + 1; while (joined[j] && /^(Choose|☐)/.test(joined[j]) && !joined[j].startsWith('☐')) j += 1; return joined[j] && joined[j].startsWith('☐'); };

    if (/\?$/.test(l)) {
      pendingQuestion = l;
      if (startsChoice()) continue;
      push({ type: 'text', prompt: l });
      continue;
    }
    if (/:$/.test(l) && l.length < 160) {
      pendingQuestion = l;
      if (startsChoice()) continue;
      push({ type: 'text', prompt: l });
      continue;
    }
    // sentence stems in "statement" / "commitment" sections: "I create / for / because" is one sentence
    if (stemSection && !/[.!?]$/.test(l) && l.length < 80) {
      const prev = nodes[nodes.length - 1];
      if (/^[a-z]/.test(l) && l.split(' ').length <= 4 && prev && prev.stem && nodes.length > sectionNodeStart) prev.prompt = `${prev.prompt.replace(/ …$/, '')} … ${l} …`;
      else push({ type: 'text', stem: true, prompt: `${l} …` });
      continue;
    }
    if (next === '.') { push({ type: 'text', prompt: `${l} …` }); continue; }
    if (header && /\.$/.test(l)) sectionNarrative.push(l);
  }
  closeSection();
  nodes.forEach((n) => delete n.stem);
  return { nodes, scaleHint };
}


// Quests for products that are manuals, guides and magazines rather than step-by-step workbooks. Their prompts
// follow each document's own sections, reflection questions and The IV Phases™ guiding questions, one phase at a time.
const IV = ['What should never be lost as we grow?', 'What depends on a person that should belong to the organization?', 'How do we make what matters part of how we operate?', 'What must exist for what we built to continue?'];
const BP = {
  welcome: [[0, 'Reflections As You Begin', 'What do you want your leadership infrastructure to make possible?'], [0, 'Reflections As You Begin', IV[0]], [1, 'Reflections As You Begin', IV[1]], [2, 'Reflections As You Begin', IV[2]], [3, 'Reflections As You Begin', IV[3]]],
  phase1: [[0, 'Phase One · Foundations', 'How do my daily decisions reinforce or weaken the organizational mission?'], [0, 'Phase One · Foundations', 'Where have I allowed misalignment to persist?'], [0, 'Phase One · Foundations', 'How can I engage my team to close these gaps?'], [0, 'Phase One · Foundations', 'Where does current infrastructure support or hinder execution of the vision?'], [0, 'Phase One · Foundations', 'Which interventions will have the highest structural impact?'], [0, 'Phase One · Foundations', 'Who is underutilized in the infrastructure? Where do structural weaknesses exist?'], [0, 'Phase One · Foundations', IV[0]]],
  phase2: [[1, 'Phase Two · Infrastructure Planning', 'Where is the organization one absence away from a bottleneck?'], [1, 'Phase Two · Infrastructure Planning', 'Where does ownership currently live only in someone’s head, not on paper?'], [1, 'Phase Two · Infrastructure Planning', 'If your best person left tomorrow, what would break first?'], [1, 'Phase Two · Infrastructure Planning', IV[1]]],
  phase3: [[2, 'Phase Three · Internal Operating Systems', 'Which rhythms, decisions and commitments run on habit rather than on a written system today?'], [2, 'Phase Three · Internal Operating Systems', 'Where does the work depend on someone remembering how it is done?'], [2, 'Phase Three · Internal Operating Systems', IV[2]]],
  phase4: [[3, 'Phase Four · Preservation', 'Where is the infrastructure most vulnerable?'], [3, 'Phase Four · Preservation', 'Which systems need reinforcement first?'], [3, 'Phase Four · Preservation', 'Is growth aligned with purpose? Are cultural norms being preserved?'], [3, 'Phase Four · Preservation', 'What did you build that you are proudest of?'], [3, 'Phase Four · Preservation', 'What almost broke, and what held it together?'], [3, 'Phase Four · Preservation', 'What do you need them to protect, no matter what changes?'], [3, 'Phase Four · Preservation', IV[3]]],
};
const FOUNDER_GUIDE = [[0, 'Getting Started', 'What are you building, and what infrastructure does it need to survive, perform, grow, and become legacy?'], [0, 'The IV Phases™', IV[0]], [1, 'The IV Phases™', IV[1]], [2, 'The IV Phases™', IV[2]], [3, 'The IV Phases™', IV[3]]];
const HAND = {
  'blueprint-welcome': BP.welcome, 'blueprint-phase1': BP.phase1, 'blueprint-phase2': BP.phase2, 'blueprint-phase3': BP.phase3, 'blueprint-phase4': BP.phase4,
  'blueprint-complete': [...BP.welcome, ...BP.phase1, ...BP.phase2, ...BP.phase3, ...BP.phase4],
  'friends-family': FOUNDER_GUIDE, 'premium-friends-family': FOUNDER_GUIDE, founder: FOUNDER_GUIDE,
  'legacy-foundations-framework': [
    [0, '01 · Founding Vision', 'The problem we were founded to solve:'], [0, '01 · Founding Vision', 'Who we exist to serve:'], [0, '01 · Founding Vision', 'What would be missing from the world if we were gone?'], [0, '01 · Founding Vision', 'Our founding vision statement in one sentence:'],
    [0, '02 · Core Values & Non-Negotiables', 'Our core values, what each looks like here, and the line we never cross for each:'], [0, '02 · Core Values & Non-Negotiables', 'Our non-negotiables:'],
    [0, '03 · Leadership Identity', 'The founder’s leadership in three words:'], [0, '03 · Leadership Identity', 'The leadership principles that built this company:'], [0, '03 · Leadership Identity', 'How decisions get made when it matters most:'], [0, '03 · Leadership Identity', 'What every future leader here must understand:'],
    [0, '04 · Strengths Assessment', 'Our strongest foundation:'], [0, '04 · Strengths Assessment', 'Our greatest exposure:'],
    [0, '05 · Legacy Definition', 'What our people will say about working here:'], [0, '05 · Legacy Definition', 'What our customers will say we gave them:'], [0, '05 · Legacy Definition', 'What our community will say we built:'], [0, '05 · Legacy Definition', 'Our legacy statement:'],
  ],
  'legacy-infrastructure-plan': [
    [1, '01 · Legacy Priorities', 'Our legacy priorities in rank order, why each protects the legacy, and the measure of success for each:'], [1, '01 · Legacy Priorities', 'What we will stop doing:'],
    [1, '02 · Decision Rights', 'For each type of decision: who decides, who is consulted, who is informed, and which value guides it?'],
    [1, '03 · Ownership Map', 'For each area of the organization: the owner, the backup, and whether it is documented (yes or no):'],
    [1, '04 · Dependency Map', 'What depends on one person, who that person is, how high the risk is (low, medium or high), and the plan to transfer it:'],
    [1, '05 · Connections', 'Each priority, the value it serves, the team that carries it, and who it serves:'], [1, '05 · Connections', 'Where things break down:'],
    [1, '06 · 12-Month Legacy Plan', 'For each quarter: what we build, who owns it, and what done looks like:'],
  ],
  'legacy-operating-systems-manual': [
    [2, '01 · Operating Rhythm', 'Each rhythm (daily, weekly, monthly, quarterly), who attends, its purpose, and the legacy question asked:'], [2, '01 · Operating Rhythm', 'Our legacy question:'],
    [2, '02 · Decision System', 'The decisions we have made, who decided, and the value that guided each:'], [2, '02 · Decision System', 'Our standard for a decision that must be written down:'],
    [2, '03 · Accountability', 'Each commitment, its owner, the check-in cadence, and what happens if it slips:'], [2, '03 · Accountability', 'How we recognize people who keep their commitments:'],
    [2, '04 · Culture Practices', 'For each core value: the practice, how often it happens, and who owns it:'],
    [2, '05 · Department Systems', 'How each department serves the founding vision:'], [2, '05 · Department Systems', 'The standard operating practices that protect the legacy:'],
    [2, '06 · Onboarding', 'For each week: what a new person learns and who teaches it:'],
  ],
  'legacy-preservation-vault': [
    [3, 'Article I · Purpose', 'The purpose of the company, as intended by its founder:'], [3, 'Article I · Purpose', 'The values that shall govern its conduct:'], [3, 'Article I · Purpose', 'The commitments that shall not be changed without the approval set out in Article VI:'],
    [3, 'Article II · Stakeholders', 'For each stakeholder: what the legacy gives them and what they give the legacy:'],
    [3, 'Article III · Stewardship', 'Each stewardship seat, who holds it, how they are appointed, and the term:'], [3, 'Article III · Stewardship', 'The authority of the stewards: what they can approve, review, or stop:'],
    [3, 'Article IV · Value Flow', 'Each value flow, the commitment, and how we measure it:'], [3, 'Article IV · Value Flow', 'Our profit priorities, in order:'],
    [3, 'Article V · Succession and Sale', 'The conditions any new owner or controlling party must accept:'], [3, 'Article V · Succession and Sale', 'The provisions that protect the founder’s intent in a sale or merger:'], [3, 'Article V · Succession and Sale', 'Who holds authority if the founder is unable to serve:'],
    [3, 'Article VI · Review and Amendment', 'Each review item, its owner, and the month it is reviewed:'], [3, 'Article VI · Review and Amendment', 'The approval required to amend Articles I to V:'], [3, 'Article VI · Review and Amendment', 'For each role or responsibility: the current holder, the successor, when they are ready, and the knowledge to transfer:'],
    [3, 'Letter to the Next Leader', 'What this company is for:'], [3, 'Letter to the Next Leader', 'What I would want you to protect above all:'], [3, 'Letter to the Next Leader', 'What I would want you to change:'],
  ],
};

const outDir = path.join(root, 'content/quests');
{
  const nodes = EVENT.map(([phase, section, prompt], i) => ({ id: `n${i + 1}`, section: `Phase ${['I', 'II', 'III', 'IV'][phase]} — ${section}`, phase, type: 'text', prompt }));
  const quest = {
    key: 'event-infrastructure', open: true, title: 'Event Infrastructure Plan™', phase: 'Phase II · Infrastructure Planning & Management', archetype: 'workbook',
    intro: 'Build the infrastructure behind any event, a conference, fundraiser, festival, market or performance, through The IV Phases™: purpose, ownership, operations and continuity.',
    pdfTitle: 'Event Infrastructure Plan™', minAnswered: 0.6, upsell: null, nodes,
    closing: { id: 'commit', type: 'text', prompt: 'The one infrastructure commitment for this event, its owner and its date:' },
  };
  fs.writeFileSync(path.join(outDir, 'event-infrastructure.json'), `${JSON.stringify(quest, null, 2)}\n`);
}
{
  const entry = pricing.products.find((p) => p.key === 'creator-website-blueprint');
  const nodes = WEBSITE_QUEST.map(([phase, section, prompt], i) => ({ id: `n${i + 1}`, section: `Phase ${['I', 'II', 'III', 'IV'][phase]} — ${section}`, phase, type: 'text', prompt }));
  const quest = {
    key: entry.key, title: entry.name, phase: PHASE_LABEL[entry.phase_key], archetype: 'workbook',
    intro: 'Plan your creator website one phase at a time, so it is built to keep working and to be carried forward.',
    pdfTitle: entry.name, minAnswered: 0.6, upsell: null, nodes,
    closing: { id: 'commit', type: 'text', prompt: 'The one change we will make next, who will own it, and by when:' },
  };
  fs.writeFileSync(path.join(outDir, `${entry.key}.json`), `${JSON.stringify(quest, null, 2)}\n`);
}
{
  const ALL = [...pricing.products, ...(pricing.partner_ip || []), ...(pricing.blueprint_series || [])];
  for (const [key, rows] of Object.entries(HAND)) {
    const entry = ALL.find((p) => p.key === key);
    const nodes = rows.map(([phase, section, prompt], i) => ({ id: `n${i + 1}`, section, phase, type: 'text', prompt }));
    const quest = {
      key, title: entry.name, phase: PHASE_LABEL[entry.phase_key] || entry.phase || 'The IV Phases™', archetype: 'workbook',
      intro: entry.description || `Work through ${entry.name} step by step.`, pdfTitle: entry.name, minAnswered: 0.6, upsell: null, nodes,
      closing: { id: 'commit', type: 'text', prompt: 'The one change we will make next, who will own it, and by when:' },
    };
    fs.writeFileSync(path.join(outDir, `${key}.json`), `${JSON.stringify(quest, null, 2)}\n`);
  }
  console.log(`built ${Object.keys(HAND).length} guide, manual and magazine quests`);
}
let n = 0;
for (const key of KEYS) {
  const entry = pricing.products.find((p) => p.key === key);
  const { nodes, scaleHint } = parse(key);
  const textNodes = nodes.filter((x) => x.type === 'text');
  const quest = {
    key,
    title: entry.name,
    phase: PHASE_LABEL[entry.phase_key] || entry.phase_key,
    archetype: 'workbook',
    intro: entry.description || `Work through ${entry.name} step by step.`,
    pdfTitle: entry.name,
    minAnswered: 0.6,
    upsell: null,
    ...(scaleHint.length ? { scaleHint: scaleHint.join('  ·  ') } : {}),
    nodes,
    closing: { id: 'commit', type: 'text', prompt: 'The one change we will make next, who will own it, and by when:' },
  };
  fs.writeFileSync(path.join(outDir, `${key}.json`), `${JSON.stringify(quest, null, 2)}\n`);
  console.log(key.padEnd(30), String(nodes.length).padStart(3), 'nodes', `(text ${textNodes.length}, choose ${nodes.filter((x) => x.type === 'choose').length}, scale ${nodes.filter((x) => x.type === 'scale').length})`);
  n += 1;
}
console.log(`built ${n} workbook quests`);
