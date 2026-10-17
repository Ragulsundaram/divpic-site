// DivPic blog: article enhancements (TOC, read time, lightbox, feedback) and listing search.
(() => {
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // ---------- Listing page: filter pills as you type ----------
  const search = document.getElementById('blog-search');
  if (search) {
    const topics = [...document.querySelectorAll('.topic')];
    const featured = document.querySelector('.featured');
    const empty = document.querySelector('.empty');
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      topics.forEach((t) => {
        let inTopic = 0;
        t.querySelectorAll('.pills li').forEach((li) => {
          const hit = !q || li.textContent.toLowerCase().includes(q) || (li.dataset.keywords || '').includes(q);
          li.hidden = !hit;
          if (hit) inTopic++;
        });
        t.hidden = inTopic === 0;
        shown += inTopic;
      });
      if (featured) featured.hidden = !!q;
      if (empty) empty.style.display = shown ? 'none' : 'block';
    });
    return;
  }

  // ---------- Article page ----------
  const prose = document.querySelector('.prose');
  if (!prose) return;
  const headings = [...prose.querySelectorAll('h2')];

  // Stable ids + hover anchors so any section can be linked to.
  headings.forEach((h) => {
    if (!h.id) h.id = slugify(h.textContent);
    const a = document.createElement('a');
    a.className = 'anchor';
    a.href = '#' + h.id;
    a.setAttribute('aria-label', 'Link to this section');
    a.textContent = '#';
    h.prepend(a);
  });
  const label = (h) => h.dataset.toc || h.textContent.replace(/^#/, '').trim();

  // Read time at ~220 words per minute.
  const words = prose.textContent.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 220));
  document.querySelectorAll('[data-read-time]').forEach((el) => { el.textContent = mins + ' min read'; });

  // Desktop TOC.
  const aside = document.querySelector('.article-shell aside');
  const links = [];
  if (aside && headings.length) {
    aside.innerHTML = `
      <nav class="toc" aria-label="On this page">
        <div class="toc-progress"></div>
        <header><svg viewBox="0 0 24 24"><path d="M10 6h11M10 12h11M10 18h11M4 6h1M4 12h1M4 18h1"/></svg>On this page</header>
        <ol></ol>
        <footer><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${mins} min read</footer>
      </nav>`;
    const ol = aside.querySelector('ol');
    headings.forEach((h) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = label(h);
      li.append(a);
      ol.append(li);
      links.push(a);
    });
  }

  // Mobile TOC.
  const mobile = document.querySelector('.toc-mobile ol');
  if (mobile) headings.forEach((h) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${h.id}"></a>`;
    li.firstChild.textContent = label(h);
    mobile.append(li);
  });

  // Highlight the section being read, and show reading progress.
  const progress = document.querySelector('.toc-progress');
  const article = document.querySelector('.article');
  // A clicked TOC link stays highlighted until the reader scrolls again by hand.
  let pinned = -1;
  links.forEach((a, i) => a.addEventListener('click', () => { pinned = i; }));
  ['wheel', 'touchstart', 'keydown'].forEach((t) => window.addEventListener(t, () => { pinned = -1; }, { passive: true }));
  function spy() {
    // Each heading switches on once it scrolls past a line a third of the way down the screen.
    // Short sections at the end can never get that far, so those headings share the last stretch of scrolling evenly.
    const line = Math.max(140, window.innerHeight * 0.3);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const at = headings.map((h) => h.getBoundingClientRect().top + window.scrollY - line);
    const firstStuck = at.findIndex((a) => a > maxScroll - 1);
    if (firstStuck >= 0) {
      const from = firstStuck > 0 ? Math.min(at[firstStuck - 1], maxScroll) : 0;
      const n = at.length - firstStuck;
      for (let j = firstStuck; j < at.length; j++) at[j] = from + (maxScroll - from) * (j - firstStuck + 1) / n - 1;
    }
    let current = 0;
    at.forEach((a, i) => { if (window.scrollY >= a) current = i; });
    if (pinned >= 0) current = pinned;
    links.forEach((a, i) => a.classList.toggle('active', i === current));
    if (progress && article) {
      const r = article.getBoundingClientRect();
      const done = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
      progress.style.width = (done * 100).toFixed(1) + '%';
    }
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  // Click an image block to view it full size.
  const box = document.createElement('dialog');
  box.className = 'lightbox';
  box.innerHTML = '<img alt="">';
  document.body.append(box);
  const big = box.querySelector('img');
  box.addEventListener('click', () => box.close());
  document.querySelectorAll('.shot-block .frame').forEach((frame) => {
    frame.addEventListener('click', () => {
      const img = frame.querySelector('img');
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      box.showModal();
    });
  });

  // Was this helpful? Remembered per article in this browser only.
  const helpful = document.querySelector('.helpful');
  if (helpful) {
    const key = 'divpic-helpful:' + location.pathname;
    const thanks = helpful.querySelector('.thanks');
    const title = document.querySelector('.article h1')?.textContent || document.title;
    const answer = (yes) => {
      helpful.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.vote === (yes ? 'yes' : 'no')));
        b.classList.toggle('solid', b.dataset.vote === (yes ? 'yes' : 'no'));
      });
      thanks.hidden = false;
      if (yes) {
        thanks.textContent = 'Thanks! Glad it helped.';
      } else {
        const mail = 'mailto:ragulsundaram15@gmail.com?subject=' + encodeURIComponent('Blog feedback: ' + title);
        thanks.innerHTML = 'Thanks for telling us. <a>Tell us what was missing</a> and we\'ll fix the article.';
        thanks.querySelector('a').href = mail;
      }
    };
    helpful.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      try { localStorage.setItem(key, b.dataset.vote); } catch {}
      answer(b.dataset.vote === 'yes');
    }));
    try {
      const saved = localStorage.getItem(key);
      if (saved) answer(saved === 'yes');
    } catch {}
  }
})();
