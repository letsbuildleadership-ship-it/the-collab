/* Gate the reveal-hidden CSS on this same script, so a blocked or failed
   main.js load can never leave content permanently hidden. */
document.documentElement.classList.add('js');

/* ------------------------------------------------------------------ *
 * CMS content loader
 *
 * Every page's real copy is already hand-authored in its HTML — that's
 * the fallback if this never runs. When /content/<page>.json (edited via
 * the /admin CMS) is reachable, this overwrites matching elements with
 * the edited copy. Elements opt in via data-field / data-field-href /
 * data-field-src for single values, or data-list (+ a data-list-item
 * template inside it) for repeating groups like cards or stats.
 * ------------------------------------------------------------------ */
async function loadContent() {
  const page = document.body.dataset.page;
  if (!page) return;

  const fetchJson = async (path) => {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  };

  const [site, pageData] = await Promise.all([
    fetchJson('/content/site.json'),
    fetchJson(`/content/${page}.json`),
  ]);

  const renderRich = (el, segments) => {
    el.innerHTML = '';
    segments.forEach((seg, i) => {
      if (seg.break_before && i > 0) el.appendChild(document.createElement('br'));
      let node;
      if (seg.style === 'white') node = document.createElement('em');
      else if (seg.style === 'glow') node = document.createElement('strong');
      if (node) {
        node.textContent = seg.text;
        el.appendChild(node);
      } else {
        el.appendChild(document.createTextNode(seg.text));
      }
    });
  };

  const applyScalars = (data) => {
    if (!data) return;
    document.querySelectorAll('[data-field]').forEach((el) => {
      const value = data[el.dataset.field];
      if (value === undefined) return;
      if (Array.isArray(value)) renderRich(el, value);
      else el.textContent = value;
    });
    document.querySelectorAll('[data-field-href]').forEach((el) => {
      const value = data[el.dataset.fieldHref];
      if (value !== undefined) el.setAttribute('href', value);
    });
    document.querySelectorAll('[data-field-src]').forEach((el) => {
      const value = data[el.dataset.fieldSrc];
      if (value !== undefined) el.setAttribute('src', value);
    });
  };

  const applyLists = (data) => {
    if (!data) return;
    document.querySelectorAll('[data-list]').forEach((container) => {
      const items = data[container.dataset.list];
      if (!Array.isArray(items)) return;
      const template = container.querySelector('[data-list-item]');
      if (!template) return;
      const templateClone = template.cloneNode(true);
      container.innerHTML = '';
      // a template's own root can carry data-item-* too, not just its
      // descendants — querySelectorAll alone would miss that.
      const withinNode = (root, selector) =>
        (root.matches(selector) ? [root] : []).concat([...root.querySelectorAll(selector)]);

      items.forEach((item, idx) => {
        const node = templateClone.cloneNode(true);
        node.removeAttribute('data-list-item');
        withinNode(node, '[data-item-field]').forEach((fieldEl) => {
          const value = item[fieldEl.dataset.itemField];
          if (value !== undefined) fieldEl.textContent = value;
        });
        withinNode(node, '[data-item-href]').forEach((hrefEl) => {
          const value = item[hrefEl.dataset.itemHref];
          if (value !== undefined) hrefEl.setAttribute('href', value);
        });
        withinNode(node, '[data-item-index]').forEach((idxEl) => {
          idxEl.textContent = String(idx + 1).padStart(2, '0');
        });
        container.appendChild(node);
      });
    });
  };

  // site-wide fields first, then page-specific (page wins on key collisions)
  applyScalars(site);
  applyLists(site);
  applyScalars(pageData);
  applyLists(pageData);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* scroll reveal */
  const revealTargets = document.querySelectorAll(
    'section .eyebrow, section .headline, section .display, section .subhead, .card, .phase-node'
  );

  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* cursor-reactive hero glow */
  if (!reduceMotion) {
    document.querySelectorAll('.hero').forEach((hero) => {
      hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--mx', `${x}%`);
        hero.style.setProperty('--my', `${y}%`);
      });
      hero.addEventListener('pointerleave', () => {
        hero.style.setProperty('--mx', '78%');
        hero.style.setProperty('--my', '12%');
      });
    });
  }

  /* count-up stat numbers */
  const statNumbers = document.querySelectorAll('.stat .n');

  const animateCount = (el) => {
    const raw = el.textContent.trim();
    const target = parseInt(raw, 10);
    if (Number.isNaN(target)) return;
    const pad = raw.length;
    const duration = 900;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = String(value).padStart(pad, '0');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window && !reduceMotion && statNumbers.length) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statNumbers.forEach((el) => statObserver.observe(el));
  }
});
