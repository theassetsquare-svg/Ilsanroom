/* FAQ Accordion */
(function () {
  var items = document.querySelectorAll('.faq-item');

  items.forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Close all
      items.forEach(function (other) {
        other.classList.remove('open');
        var otherAnswer = other.querySelector('.faq-answer');
        if (otherAnswer) otherAnswer.style.maxHeight = null;
        var otherBtn = other.querySelector('.faq-question');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Smooth scroll for nav links */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
