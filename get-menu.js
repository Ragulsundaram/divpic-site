// Header "Get DivPic" dropdown: pick a browser store without leaving the page.
(() => {
  document.querySelectorAll('.get-menu').forEach((menu) => {
    const btn = menu.querySelector('button');
    const list = menu.querySelector('.get-menu-list');
    const items = () => [...list.querySelectorAll('a[role="menuitem"]')];

    const open = (focusFirst) => {
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      if (focusFirst) items()[0]?.focus();
    };
    const close = (refocus) => {
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus();
    };

    btn.addEventListener('click', () => (list.hidden ? open(false) : close(false)));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(true); }
    });
    list.addEventListener('keydown', (e) => {
      const all = items();
      const i = all.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); all[(i + 1) % all.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); all[(i - 1 + all.length) % all.length].focus(); }
      else if (e.key === 'Tab') close(false);
    });
    list.addEventListener('click', (e) => { if (e.target.closest('a')) close(false); });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) close(false); });
  });
})();
