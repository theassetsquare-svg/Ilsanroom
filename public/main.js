/* ─── Premium Directory — main.js ─── */
(function () {
  'use strict';

  /* FAQ Accordion */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      faqItems.forEach(function (other) {
        other.classList.remove('open');
        var a = other.querySelector('.faq-answer');
        if (a) a.style.maxHeight = null;
        var b = other.querySelector('.faq-question');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Smooth scroll */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ─── Search Bar ─── */
  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var query = this.value.trim().toLowerCase();
      var cards = document.querySelectorAll('.venue-card, .thumb-card');
      cards.forEach(function (card) {
        var name = (card.getAttribute('data-venue-name') || '').toLowerCase();
        var text = card.textContent.toLowerCase();
        if (!query || name.indexOf(query) !== -1 || text.indexOf(query) !== -1) {
          card.classList.remove('hidden-by-filter');
        } else {
          card.classList.add('hidden-by-filter');
        }
      });
    });
  }

  /* ─── Category Tabs ─── */
  var catTabs = document.querySelectorAll('.cat-tab');
  var sections = document.querySelectorAll('.section[data-section-cat]');

  catTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      catTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var cat = tab.getAttribute('data-cat');
      sections.forEach(function (sec) {
        if (cat === 'all' || sec.getAttribute('data-section-cat') === cat) {
          sec.classList.remove('hidden-by-filter');
        } else {
          sec.classList.add('hidden-by-filter');
        }
      });
    });
  });

  /* ─── Region Chips ─── */
  var regionChips = document.querySelectorAll('.region-chip');

  regionChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      regionChips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      var region = chip.getAttribute('data-region');
      sections.forEach(function (sec) {
        if (region === 'all' || sec.getAttribute('data-section-region') === region) {
          sec.classList.remove('hidden-by-filter');
        } else {
          sec.classList.add('hidden-by-filter');
        }
      });
      /* also reset cat tabs to "all" */
      catTabs.forEach(function (t) { t.classList.remove('active'); });
      var allTab = document.querySelector('.cat-tab[data-cat="all"]');
      if (allTab) allTab.classList.add('active');
    });
  });

  /* ─── Inquiry Form (placeholder) ─── */
  var form = document.getElementById('inquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('inqMessage');
      if (msg && msg.value.trim()) {
        alert('문의가 접수되었습니다. 확인 후 안내드리겠습니다.');
        form.reset();
      }
    });
  }
})();
