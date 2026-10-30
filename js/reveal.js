document.addEventListener("DOMContentLoaded", function () {
  const pathname = window.location.pathname;
  const articleImage = document.querySelector(".blog-feature-image");

  if (articleImage) {
    if (pathname.includes("life-skills-for-autistic-adults-with-significant-support-needs")) {
      articleImage.src = "../assets/blog/september-4-2026/life-skills-for-autistic-adults-with-significant-support-needs/hero-v2.webp";
    } else if (pathname.includes("how-daily-routines-create-safety-without-becoming-restrictive")) {
      articleImage.src = "../assets/blog/september-4-2026/how-daily-routines-create-safety-without-becoming-restrictive/hero-v2.webp";
    } else if (pathname.includes("supporting-choice-without-complete-independence")) {
      articleImage.src = "../assets/blog/september-4-2026/supporting-choice-without-complete-independence/hero-v2.webp";
      articleImage.style.maxWidth = "520px";
      articleImage.style.margin = "32px auto 16px";
    }
  }

  const reveals = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  reveals.forEach(el => observer.observe(el));
});

// Independent, first-party loader. Its disabled configuration makes no Google requests.
(() => {
  const analytics = document.createElement('script');
  analytics.type = 'module';
  analytics.src = '/js/analytics-consent.mjs';
  document.head.append(analytics);
})();
