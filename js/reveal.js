document.addEventListener("DOMContentLoaded", function () {
  const blogList = document.querySelector(".blog-index .blog-list");

  if (blogList && !blogList.querySelector('a[href="blog/life-skills-for-autistic-adults-with-significant-support-needs.html"]')) {
    const sept4Posts = `
      <article class="blog-card reveal">
        <a href="blog/life-skills-for-autistic-adults-with-significant-support-needs.html" aria-label="Read Life Skills for Autistic Adults With Significant Support Needs">
          <img src="assets/blog/september-4-2026/life-skills-for-autistic-adults-with-significant-support-needs/hero.jpg" alt="Young Sam smiling while receiving a haircut in a child-friendly salon in Colorado Springs, Colorado.">
        </a>
        <div class="blog-card-content">
          <p class="blog-meta">Adult Services &amp; Daily Life · September 4, 2026</p>
          <h2><a href="blog/life-skills-for-autistic-adults-with-significant-support-needs.html">Life Skills for Autistic Adults With Significant Support Needs</a></h2>
          <p>Life skills should make daily life safer, easier, more comfortable, or more enjoyable—not quietly become a test of whether someone can live without support.</p>
          <a class="blog-card-link" href="blog/life-skills-for-autistic-adults-with-significant-support-needs.html">Read the full article</a>
        </div>
      </article>

      <article class="blog-card reveal">
        <a href="blog/how-daily-routines-create-safety-without-becoming-restrictive.html" aria-label="Read How Daily Routines Can Create Safety Without Becoming Restrictive">
          <img src="assets/blog/september-4-2026/how-daily-routines-create-safety-without-becoming-restrictive/hero.jpg" alt="Sam waiting against the wall on a Santiago Metro platform in Chile.">
        </a>
        <div class="blog-card-content">
          <p class="blog-meta">Daily Life &amp; Safety · September 4, 2026</p>
          <h2><a href="blog/how-daily-routines-create-safety-without-becoming-restrictive.html">How Daily Routines Can Create Safety Without Becoming Restrictive</a></h2>
          <p>Predictable routines can protect autistic adults without turning daily life into an institutional schedule. The goal is structure that creates room for freedom.</p>
          <a class="blog-card-link" href="blog/how-daily-routines-create-safety-without-becoming-restrictive.html">Read the full article</a>
        </div>
      </article>

      <article class="blog-card reveal">
        <a href="blog/supporting-choice-without-complete-independence.html" aria-label="Read Supporting Choice When an Adult Cannot Live Completely Independently">
          <img src="assets/blog/september-4-2026/supporting-choice-without-complete-independence/hero.jpg" alt="Sam carrying a toy he selected while riding an escalator in a shopping mall in Santiago, Chile.">
        </a>
        <div class="blog-card-content">
          <p class="blog-meta">Choice, Dignity &amp; Lifelong Support · September 4, 2026</p>
          <h2><a href="blog/supporting-choice-without-complete-independence.html">Supporting Choice When an Adult Cannot Live Completely Independently</a></h2>
          <p>Adults can need significant lifelong support and still have preferences, decisions, and ordinary choices that belong to them.</p>
          <a class="blog-card-link" href="blog/supporting-choice-without-complete-independence.html">Read the full article</a>
        </div>
      </article>
    `;

    blogList.insertAdjacentHTML("afterbegin", sept4Posts);
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
    {
      threshold: 0.15
    }
  );

  reveals.forEach(el => observer.observe(el));
});
