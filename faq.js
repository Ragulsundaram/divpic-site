// FAQ accordion: animate <details> open/close instead of snapping.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const timing = { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };

  document.querySelectorAll('.faq-list details').forEach((el) => {
    const summary = el.querySelector('summary');
    let anim = null;

    const run = (from, to, onEnd) => {
      anim?.cancel();
      anim = el.animate({ height: [`${from}px`, `${to}px`] }, timing);
      anim.onfinish = () => { anim = null; onEnd?.(); };
    };

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const start = el.offsetHeight;
      // Closing: the "open" attribute stays until the animation ends so the answer stays visible.
      if (el.open && !el.classList.contains('closing')) {
        el.classList.add('closing');
        run(start, summary.offsetHeight, () => { el.open = false; el.classList.remove('closing'); });
      } else {
        el.classList.remove('closing');
        el.open = true;
        run(start, el.scrollHeight);
      }
    });
  });
})();
