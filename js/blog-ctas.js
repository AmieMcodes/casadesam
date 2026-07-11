const blogCtas = {
top: `
  <section class="blog-cta blog-cta-top" data-cta-slot="top">
    <p class="blog-cta-label">About Casa de SAM</p>
    <h2 class="blog-cta-title">Casa de SAM is a developing lifelong residential community in Paraguay.</h2>
    <p class="blog-cta-copy">
      We are building a long-term vision where adults with developmental disabilities
      can live with safety, dignity, and meaningful daily life. We believe joyful living
      is inherently valuable. Our promise to families is that, once a resident is fully
      accepted, Casa de SAM will care for their adult child for life.
    </p>
    <a
      class="blog-cta-button"
      href="https://casadesam.org/casa-de-sam-vision.pdf"
    >
      Read Our Full Vision
    </a>
  </section>
`,

  bottom: `
    <section class="blog-cta blog-cta-bottom" data-cta-slot="bottom">
      <p class="blog-cta-label">Help Shape the Beginning</p>
      <h2 class="blog-cta-title">Casa de SAM plans to open its doors in 2035.</h2>
      <p class="blog-cta-copy">
        There is so much work to do between now and then. We are currently
        looking for thoughtful, mission-aligned founding board members.
      </p>
      <button
        class="blog-cta-button"
        type="button"
        data-open-gustavo
      >
        Ask Gustavo for More Information
      </button>
    </section>
  `
};

document.querySelectorAll("[data-blog-cta]").forEach((slot) => {
  const type = slot.dataset.blogCta;

  if (blogCtas[type]) {
    slot.innerHTML = blogCtas[type];
  }
});
