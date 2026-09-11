(() => {
  const endpoint = "/api/gustavo";
  const history = [];
  const starters = [
    "What is Casa de SAM?",
    "I am a parent or caregiver",
    "How can I help right now?",
  ];

  const root = document.createElement("div");
  root.className = "gustavo";
  root.innerHTML = `
    <button class="gustavo-launch" type="button" aria-expanded="false" aria-controls="gustavo-panel">
      <span aria-hidden="true">G</span><span>Ask Gustavo</span>
    </button>
    <section class="gustavo-panel" id="gustavo-panel" aria-label="Ask Gustavo about Casa de SAM" hidden>
      <header class="gustavo-header">
        <div><strong>Gustavo</strong><small>Casa de SAM guide</small></div>
        <button class="gustavo-close" type="button" aria-label="Close Gustavo">×</button>
      </header>
      <div class="gustavo-messages" role="log" aria-live="polite">
        <div class="gustavo-message gustavo-answer">Hi. I’m Gustavo. I can explain what Casa de SAM is, what is only planned, and how you can be part of the conversation.</div>
      </div>
      <div class="gustavo-starters"></div>
      <form class="gustavo-chat-form">
        <label class="sr-only" for="gustavo-message">Your question</label>
        <textarea id="gustavo-message" maxlength="2400" rows="2" placeholder="Ask about Casa de SAM…" required></textarea>
        <button type="submit">Send</button>
      </form>
      <button class="gustavo-inquiry-toggle" type="button">Send Casa de SAM an inquiry</button>
      <form class="gustavo-inquiry" name="gustavo-inquiry" method="POST" data-netlify="true" netlify-honeypot="bot-field" hidden>
        <input type="hidden" name="form-name" value="gustavo-inquiry">
        <p class="gustavo-hidden"><label>Leave this empty <input name="bot-field"></label></p>
        <label>Name<input name="name" autocomplete="name" required></label>
        <label>Email<input name="email" type="email" autocomplete="email" required></label>
        <label>I’m reaching out as
          <select name="interest" required>
            <option value="">Choose one</option>
            <option>Family member or caregiver</option>
            <option>Future board or governance interest</option>
            <option>Professional or organizational partner</option>
            <option>Volunteer or community supporter</option>
            <option>Media or research</option>
            <option>General question or updates</option>
          </select>
        </label>
        <label>Message<textarea name="message" rows="3" maxlength="2000" required></textarea></label>
        <button type="submit">Send inquiry</button>
        <p class="gustavo-form-status" aria-live="polite"></p>
      </form>
      <p class="gustavo-note">Please don’t share medical records or sensitive personal details here.</p>
    </section>`;
  document.body.append(root);

  const launch = root.querySelector(".gustavo-launch");
  const panel = root.querySelector(".gustavo-panel");
  const close = root.querySelector(".gustavo-close");
  const messages = root.querySelector(".gustavo-messages");
  const chatForm = root.querySelector(".gustavo-chat-form");
  const input = root.querySelector("#gustavo-message");
  const starterWrap = root.querySelector(".gustavo-starters");
  const inquiryToggle = root.querySelector(".gustavo-inquiry-toggle");
  const inquiry = root.querySelector(".gustavo-inquiry");

  function toggle(open) {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  }
  launch.addEventListener("click", () => toggle(panel.hidden));
  close.addEventListener("click", () => toggle(false));

  function addMessage(text, kind) {
    const item = document.createElement("div");
    item.className = `gustavo-message gustavo-${kind}`;
    item.textContent = text;
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  async function ask(message) {
    addMessage(message, "question");
    input.value = "";
    starterWrap.hidden = true;
    const waiting = addMessage("Gustavo is thinking…", "answer");
    chatForm.querySelector("button").disabled = true;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, mode: "public" }),
      });
      const data = await response.json();
      waiting.textContent = response.ok ? data.answer : data.error;
      if (response.ok) {
        history.push({ role: "user", content: message }, { role: "assistant", content: data.answer });
        history.splice(0, Math.max(0, history.length - 8));
      }
    } catch {
      waiting.textContent = "I’m not available just now. Please try again, or send Casa de SAM an inquiry below.";
    } finally {
      chatForm.querySelector("button").disabled = false;
    }
  }

  starters.forEach((text) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => ask(text));
    starterWrap.append(button);
  });
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (message) ask(message);
  });

  inquiryToggle.addEventListener("click", () => {
    inquiry.hidden = !inquiry.hidden;
    inquiryToggle.textContent = inquiry.hidden ? "Send Casa de SAM an inquiry" : "Close inquiry form";
  });
  inquiry.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = inquiry.querySelector(".gustavo-form-status");
    const button = inquiry.querySelector("button[type='submit']");
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const data = new FormData(inquiry);
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      if (!response.ok) throw new Error("submission failed");
      inquiry.reset();
      status.textContent = "Thank you. Your inquiry has been sent.";
    } catch {
      status.textContent = "That didn’t send. Please try again in a moment.";
    } finally {
      button.disabled = false;
    }
  });
})();
