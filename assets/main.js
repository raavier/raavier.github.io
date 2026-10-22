document.getElementById('ano').textContent = new Date().getFullYear();

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Loops só tocam quando visíveis (economiza banda/CPU) e respeitam "reduzir movimento".
var observer = (!reduceMotion && 'IntersectionObserver' in window)
  ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !v.hidden) {
          if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
          v.play().catch(function () { v.setAttribute('controls', ''); });
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.3 })
  : null;

document.querySelectorAll('video.autoplay').forEach(function (v) {
  if (observer) observer.observe(v);
  else if (!v.classList.contains('summit__bg')) v.setAttribute('controls', '');
});

// Ao trocar painel/demo, o IntersectionObserver não dispara de novo: reavaliamos na mão.
function refreshVideos(scope) {
  scope.querySelectorAll('video.autoplay').forEach(function (v) {
    if (observer) { observer.unobserve(v); observer.observe(v); }
  });
}

// Abas de projetos (padrão WAI-ARIA tabs: setas, Home/End).
var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs__btn'));
function selectTab(tab) {
  tabs.forEach(function (t) {
    var on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    if (on) t.classList.remove('is-unseen');
    var panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.hidden = !on;
    if (!on) panel.querySelectorAll('video').forEach(function (v) { v.pause(); });
  });
  refreshVideos(document.getElementById(tab.getAttribute('aria-controls')));
}
tabs.forEach(function (tab, i) {
  tab.addEventListener('click', function () { selectTab(tab); });
  tab.addEventListener('keydown', function (e) {
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    var t = tabs[(next + tabs.length) % tabs.length];
    t.focus();
    selectTab(t);
  });
});
document.querySelectorAll('[data-next]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var tab = document.getElementById(btn.dataset.next);
    selectTab(tab);
    tab.focus({ preventScroll: true });
    document.querySelector('.tabs').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
});

// Seletor Connect Bot | Genie: alterna sozinho ao fim de cada demo (com barra de progresso no botão)
// até a pessoa escolher uma — aí a escolhida passa a repetir.
(function () {
  var vale = document.getElementById('painel-vale');
  var buttons = Array.prototype.slice.call(vale.querySelectorAll('.switch__btn'));
  var autoplayDemos = !reduceMotion;

  function show(demo) {
    buttons.forEach(function (b) {
      var on = b.dataset.demo === demo;
      b.setAttribute('aria-pressed', on);
      b.style.setProperty('--progress', 0);
    });
    vale.querySelectorAll('.demo, .demo__caption').forEach(function (el) {
      el.hidden = el.dataset.demo !== demo;
      if (el.tagName === 'VIDEO') {
        if (el.hidden) el.pause();
        else el.currentTime = 0;
      }
    });
    refreshVideos(vale);
  }

  vale.querySelectorAll('video.demo').forEach(function (v) {
    var btn = buttons.filter(function (b) { return b.dataset.demo === v.dataset.demo; })[0];
    v.addEventListener('timeupdate', function () {
      if (autoplayDemos && v.duration) btn.style.setProperty('--progress', v.currentTime / v.duration);
    });
    v.addEventListener('ended', function () {
      if (!autoplayDemos) { v.currentTime = 0; v.play(); return; }
      var other = buttons.filter(function (b) { return b !== btn; })[0];
      show(other.dataset.demo);
    });
  });

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      autoplayDemos = false;
      vale.classList.add('demo-chosen');
      show(btn.dataset.demo);
    });
  });
})();

// Modal do vídeo explicativo.
(function () {
  document.querySelectorAll('[data-open]').forEach(function (btn) {
    var dialog = document.getElementById(btn.dataset.open);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    var video = dialog.querySelector('video');
    btn.addEventListener('click', function () { dialog.showModal(); video.play().catch(function () {}); });
    dialog.querySelector('[data-close]').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () { video.pause(); });
  });
})();
