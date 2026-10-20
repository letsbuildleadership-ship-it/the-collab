// Inserts the approved Problem / Solution positioning after each page's hero
// and sets the page meta description. Idempotent: re-running replaces the
// block between the ps-block markers.   node scripts/apply-positioning.mjs
import fs from 'node:fs';

const P = {
  founders: ['Founders Organization™ · Community Economic Development',
    'Unequal access to entrepreneurial education, business infrastructure, capital networks, and professional relationships can constrain small-business formation, local investment, economic mobility, and regional development.',
    'Founders Organization™ is being developed as a community-based nonprofit initiative intended to pursue 501(c)(3) status, with the aim of expanding access to entrepreneurial education, business resources, and leadership infrastructure that support community-based enterprise development and local economic participation.'],
  llab: ['The .LLab · Research & Intellectual Property Development',
    'Fragmented research and weak connections between theory, applied practice, and implementation can slow innovation and prevent intellectual assets from becoming practically useful or commercially applicable.',
    'The .LLab develops research, theory, applied practices, and proprietary intellectual property into structured knowledge resources that support innovation, strategic decision-making, and enterprise development.'],
  phases: ['The IV Phases™ · Leadership & Organizational Infrastructure',
    'Weak organizational foundations, fragmented operations, inadequate governance, and insufficient succession planning can increase execution risk, reduce productivity, and expose organizations to operational and financial instability.',
    'The IV Phases™ provides a four-phase leadership infrastructure model—Foundations, Infrastructure Planning &amp; Management, Internal Operating Systems, and Preservation—to support organizational alignment, operational continuity, risk management, and long-term enterprise value.'],
  tools: ['Free Tools · Business & Strategic Resources',
    'Unequal access to practical business knowledge, analytical resources, and decision-making tools can create barriers to effective planning and commercial execution.',
    'Free Tools provides accessible resources that support business literacy, strategic analysis, organizational capability, and informed resource allocation.'],
  think: ['Think · Strategic Research & Analysis',
    'Geopolitical realignment, trade policy shifts, market volatility, technological disruption, and regulatory change increase uncertainty for businesses, investors, and institutions.',
    'Think analyzes business, economic, political, and geopolitical systems to identify structural shifts, evaluate strategic risks, assess market exposure, and interpret emerging commercial opportunities.'],
  journal: ['Journal · Business, Economics & Geopolitics Magazine',
    'Business, economic, and geopolitical developments are often examined in isolation, obscuring their interconnected effects on markets, industries, labor, technology, and everyday economic conditions.',
    'Journal publishes magazine-style analysis connecting business, economics, geopolitics, technology, culture, and society to explain market developments and their implications for enterprise strategy and economic participation.'],
  preview: ['Free Journal Preview · Editorial Access',
    'Financial and information barriers can restrict access to analysis connecting economic policy, market developments, technological change, and commercial strategy.',
    'Free Journal Preview offers selected magazine content introducing readers to The Co.LLab™ analysis of business, economics, geopolitics, and emerging market conditions.'],
  about: ['About · Corporate Identity & Strategic Positioning',
    'Unclear corporate positioning and disconnected organizational objectives can weaken stakeholder alignment, strategic execution, and communication of long-term economic value.',
    'About establishes The Co.LLab™ corporate identity, mission, strategic positioning, and operating philosophy around leadership infrastructure, proprietary intellectual property, and sustainable enterprise development.'],
  creator: ['Creator™ · Creative Enterprise & IP Commercialization',
    'Platform dependency, unequal bargaining power, fragmented distribution channels, and limited intellectual property control can prevent creators from capturing a fair share of the economic value their work generates.',
    'Creator develops creative enterprise infrastructure that strengthens intellectual property ownership, commercialization, revenue diversification, and creators’ ability to capture and retain economic value within the creative economy.'],
  impact: ['Impact™ · Community Sustainability & Institutional Governance',
    'Fragmented governance, misaligned incentives, inefficient resource allocation, and weak stakeholder communication can undermine institutional coordination, community sustainability, and measurable social and economic outcomes.',
    'Impact integrates strategic planning, communication, governance, and resource allocation to support community development, institutional coordination, sustainability, and measurable social and economic performance.'],
  atelier: ['.LLab Atelier™ · Design, Products & Creative Enterprise',
    'Fragmented design and product markets can make it difficult for people and organizations to access thoughtfully developed goods that support the environments, identities, and practical demands of enterprise.',
    '.LLab Atelier™ develops a design-led product portfolio spanning home design, home-office design, workplace and office design, furniture, clothing, and related products, connecting design, intellectual property, and commercial enterprise.'],
  plus: ['Co.LLab+™ · Member E-Commerce',
    'A member’s products and services are only as useful as the people who can find them.',
    'Co.LLab+™ is intended to be the e-commerce side of The Co.LLab™, where members list their website, highlight a product or service, and advertise.'],
  tech: ['Technology · Legacy Ventures™ · Technology Commercialization & Enterprise Development',
    'Gaps between technological innovation, intellectual property ownership, capital allocation, regulatory strategy, and commercialization can prevent emerging technologies from achieving market adoption, attracting investment, and generating durable enterprise value.',
    'Technology · Legacy Ventures™ connects technology development, intellectual property strategy, capital pathways, and enterprise development to support commercialization, market competitiveness, and the long-term economic value of innovative assets.'],
  home: ['The Co.LLab™ · Corporate Positioning',
    'The global economy faces a structural coordination problem: capital, labor, intellectual property, technology, and decision-making authority operate through institutions and markets whose incentives do not always align with productive contribution. Market concentration, information asymmetry, unequal bargaining power, and fragmented governance can constrain competition, impede entrepreneurship, weaken regional economic development, and concentrate the financial returns from innovation.',
    'The Co.LLab™ develops proprietary products, intellectual property, and leadership infrastructure organized around the Omnidirectional Enterprise™ operating model — designed to improve resource coordination, strengthen organizational capability, connect intellectual assets with practical and commercial applications, and expand access to opportunities for economic participation.'],
};

const split = ([label, problem, solution]) => `
      <p class="eyebrow" style="margin-bottom:1.5rem;">${label}</p>
      <div class="split">
        <div><p class="eyebrow">The problem</p><p class="subhead" style="max-width:none; margin-top:1rem;">${problem}</p></div>
        <div><p class="eyebrow">The solution</p><p class="subhead" style="max-width:none; margin-top:1rem;">${solution}</p></div>
      </div>`;

const HOME_EXTRA = `
      <div class="split" style="margin-top:2.5rem;">
        <div><p class="eyebrow">Market conditions</p><p class="subhead" style="max-width:none; margin-top:1rem;">These pressures intersect with geopolitical realignment, supply-chain restructuring, automation, changing investment patterns, and the growing economic importance of intangible assets — raising the strategic importance of productivity, institutional adaptability, intellectual property ownership, effective governance, and access to commercial infrastructure.</p></div>
        <div><p class="eyebrow">The central economic proposition</p><p class="subhead" style="max-width:none; margin-top:1rem;">Economic performance depends not only on creating value, but on the systems governing how resources are coordinated, intellectual property is owned, decisions are made, innovations reach markets, and returns are captured and reinvested. <strong>Generating value and capturing value are different processes.</strong></p></div>
      </div>
      <div class="grid-3" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.5rem; margin-top:2.5rem;">
        <div><p class="eyebrow">The company</p><p style="margin-top:0.75rem;"><strong>The Co.LLab™</strong> — an enterprise infrastructure and intellectual property company developing proprietary products, business models, leadership infrastructure, research, and commercial ventures.</p></div>
        <div><p class="eyebrow">The operating model</p><p style="margin-top:0.75rem;"><strong>Omnidirectional Enterprise™</strong> — connects people, organizations, products, intellectual property, capital, and resources in one ecosystem. Mechanisms: shared IP licensed across participants; a common governance model (The IV Phases™); a cross-sector network of businesses, nonprofits, creators, and communities; and revenue reinvested across the portfolio.</p></div>
        <div><p class="eyebrow">The portfolio</p><p style="margin-top:0.75rem;">Distinct products, IP, research, resources, and ventures — <a href="pages/founders.html">Founders Organization™</a>, <a href="pages/products.html">.LLab</a>, <a href="pages/think.html">Think</a>, <a href="pages/journal.html">Journal</a>, <a href="pages/partnership.html">Partnership™</a>, <a href="pages/creator.html">Creator™</a>, <a href="pages/impact.html">Impact™</a> — each applying this infrastructure to a specific market or function.</p></div>
      </div>`;

const PAGES = [
  ['index.html', ['home'], HOME_EXTRA],
  ['pages/founders.html', ['founders']],
  ['pages/products.html', ['llab', 'phases', 'tools']],
  ['pages/think.html', ['think']],
  ['pages/journal.html', ['journal']],
  ['pages/journal-preview.html', ['preview']],
  ['pages/about.html', ['about']],
  ['pages/creator.html', ['creator']],
  ['pages/impact.html', ['impact']],
  ['pages/atelier.html', ['atelier']],
  ['pages/community.html', ['plus']],
  ['pages/technology.html', ['tech']],
];

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/"/g, '&quot;');
for (const [file, keys, extra = ''] of PAGES) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/\n?<!-- ps-block -->[\s\S]*?<!-- \/ps-block -->\n?/, '\n');
  const block = `<!-- ps-block -->
  <hr class="hairline" />
  <section class="ps-block">
    <div class="wrap">${keys.map((k, i) => (i ? '<hr class="hairline" style="margin:2.5rem 0;" />' : '') + split(P[k])).join('')}${extra}
    </div>
  </section>
<!-- /ps-block -->`;
  const h1 = html.indexOf('<h1');
  const end = html.indexOf('</section>', h1) + '</section>'.length;
  html = html.slice(0, end) + '\n' + block + html.slice(end);
  const desc = strip(P[keys[0]][2]);
  html = html.replace(/(<meta name="description" content=")[^"]*/, `$1${desc}`)
             .replace(/(<meta property="og:description" content=")[^"]*/, `$1${desc}`);
  fs.writeFileSync(file, html);
  console.log('✓', file);
}
