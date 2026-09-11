(() => {
  const endpoint = "/api/gustavo";
  const history = [];
  const root = document.createElement("div");
  root.className = "gustavo";
  root.innerHTML = `
    <button class="gustavo-launch" type="button" aria-expanded="false" aria-controls="gustavo-panel">
      <span aria-hidden="true">G</span><span>Ask Gustavo</span>
    </button>
    <section class="gustavo-panel" id="gustavo-panel" aria-label="Ask Gustavo about Casa de SAM" hidden>
      <header class="gustavo-header">
        <div><strong>Ask Gustavo</strong><small>Casa de SAM's AI guide</small></div>
        <button class="gustavo-close" type="button" aria-label="Close Gustavo">×</button>
      </header>
      <div class="gustavo-messages" role="log" aria-live="polite">
        <div class="gustavo-message gustavo-answer">Hi! I’m Gustavo. Casa de SAM is still taking shape, and I’d love to tell you about it—or hear what brought you here. Big ideas, personal questions, and messy first thoughts are all welcome. What would you like to talk about?</div>
      </div>
      <form class="gustavo-chat-form">
        <label class="sr-only" for="gustavo-message">Your message</label>
        <textarea id="gustavo-message" maxlength="2400" rows="2" placeholder="Ask me anything… (También hablo español)" required></textarea>
        <button type="submit">Send</button>
      </form>
      <div class="gustavo-handoff" hidden>
        <button class="gustavo-inquiry-toggle" type="button">Yes, help me contact Amie</button>
        <form class="gustavo-inquiry" name="gustavo-inquiry" method="POST" data-netlify="true" netlify-honeypot="bot-field" hidden>
          <input type="hidden" name="form-name" value="gustavo-inquiry">
          <input type="hidden" name="conversation" value="">
          <p class="gustavo-hidden"><label>Leave this empty <input name="bot-field"></label></p>
          <label>Name<input name="name" autocomplete="name" required></label>
          <label>Email<input name="email" type="email" autocomplete="email" required></label>
          <label>Anything you’d like to add<textarea name="message" rows="3" maxlength="2000"></textarea></label>
          <label class="gustavo-consent"><input name="include-conversation" type="checkbox" value="yes"> Include what I shared with Gustavo so I don’t have to repeat myself.</label>
          <button type="submit">Send to Amie</button>
          <p class="gustavo-form-status" aria-live="polite"></p>
        </form>
      </div>
      <p class="gustavo-note">I’m an AI guide, and conversations may be reviewed to help Casa de SAM improve. Please don’t share medical records or unnecessary identifying details.</p>
    </section>`;
  document.body.append(root);

  const launch = root.querySelector(".gustavo-launch");
  const panel = root.querySelector(".gustavo-panel");
  const close = root.querySelector(".gustavo-close");
  const messages = root.querySelector(".gustavo-messages");
  const chatForm = root.querySelector(".gustavo-chat-form");
  const input = root.querySelector("#gustavo-message");
  const handoff = root.querySelector(".gustavo-handoff");
  const inquiryToggle = root.querySelector(".gustavo-inquiry-toggle");
  const inquiry = root.querySelector(".gustavo-inquiry");

  function toggle(open) {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  }
  launch.addEventListener("click", () => toggle(panel.hidden));
  close.addEventListener("click", () => toggle(false));

  function cleanAnswer(text) {
    return text.replace(/\[OFFER_CONTACT\]/gi, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").trim();
  }

  function addMessage(text, kind) {
    const item = document.createElement("div");
    item.className = `gustavo-message gustavo-${kind}`;
    item.textContent = text;
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  function conversationText() {
    return history.map((item) => `${item.role === "user" ? "Visitor" : "Gustavo"}: ${item.content}`).join("\n\n");
  }

  async function ask(message) {
    addMessage(message, "question");
    input.value = "";
    const waiting = addMessage("One moment…", "answer");
    const sendButton = chatForm.querySelector("button");
    sendButton.disabled = true;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await response.json();
      if (!response.ok) {
        waiting.textContent = data.error;
        return;
      }
      const answer = cleanAnswer(data.answer);
      waiting.textContent = answer;
      history.push({ role: "user", content: message }, { role: "assistant", content: answer });
      history.splice(0, Math.max(0, history.length - 12));
      if (data.offerContact) handoff.hidden = false;
    } catch {
      waiting.textContent = "I’m not available just now. Please try again in a moment.";
    } finally {
      sendButton.disabled = false;
      input.focus();
    }
  }

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (message) ask(message);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  inquiryToggle.addEventListener("click", () => {
    inquiry.hidden = !inquiry.hidden;
    inquiryToggle.textContent = inquiry.hidden ? "Yes, help me contact Amie" : "Close contact form";
    if (!inquiry.hidden) inquiry.querySelector("input[name='name']").focus();
  });
  inquiry.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = inquiry.querySelector(".gustavo-form-status");
    const button = inquiry.querySelector("button[type='submit']");
    const includeConversation = inquiry.elements.namedItem("include-conversation").checked;
    inquiry.elements.namedItem("conversation").value = includeConversation ? conversationText() : "Visitor did not consent to include the conversation.";
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const data = new FormData(inquiry);
      data.delete("include-conversation");
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      if (!response.ok) throw new Error("submission failed");
      inquiry.reset();
      status.textContent = "Thank you. Your note has been sent to Amie.";
    } catch {
      status.textContent = "That didn’t send. Please try again in a moment.";
    } finally {
      button.disabled = false;
    }
  });
})();
