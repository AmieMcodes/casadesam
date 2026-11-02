(() => {
  const endpoint = "/api/gustavo";
  const history = [];
  const boardPage = document.body.dataset.gustavoContext === "board";
  let asking = false;
  let returnFocus;
  const root = document.createElement("div");
  root.className = "gustavo";
  root.innerHTML = `
    <button class="gustavo-launch" aria-label="Ask Gustavo" type="button" aria-expanded="false" aria-controls="gustavo-panel">
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

  // Android keyboards shrink and sometimes pan the visual viewport without
  // changing the layout viewport used by fixed-position elements.
  const mobileChat = window.matchMedia("(max-width: 520px)");
  function fitPanelToVisibleViewport() {
    const viewport = window.visualViewport;
    if (!mobileChat.matches || !viewport) {
      for (const property of ["top", "left", "right", "bottom", "width", "height"]) {
        panel.style.removeProperty(property);
      }
      return;
    }
    const gutter = 8;
    panel.style.top = `${Math.round(viewport.offsetTop + gutter)}px`;
    panel.style.left = `${Math.round(viewport.offsetLeft + gutter)}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.width = `${Math.max(0, Math.floor(viewport.width - gutter * 2))}px`;
    panel.style.height = `${Math.max(0, Math.floor(viewport.height - gutter * 2))}px`;
  }
  window.visualViewport?.addEventListener("resize", fitPanelToVisibleViewport);
  window.visualViewport?.addEventListener("scroll", fitPanelToVisibleViewport);
  window.addEventListener("resize", fitPanelToVisibleViewport);
  input.addEventListener("focus", () => requestAnimationFrame(fitPanelToVisibleViewport));

  function pageLanguage() { return document.documentElement.lang === "es" ? "es" : "en"; }
  function boardLabels() {
    if (!boardPage) return;
    const es = pageLanguage() === "es";
    launch.setAttribute("aria-label", es ? "Preguntale a Gus" : "Ask Gus");
    launch.lastElementChild.textContent = es ? "Preguntale a Gus" : "Ask Gus";
    root.querySelector(".gustavo-header strong").textContent = es ? "Gus · Consejo Directivo" : "Gus · Board questions";
    root.querySelector(".gustavo-header small").textContent = es ? "Guía de IA de Casa de SAM" : "Casa de SAM's AI guide";
    panel.setAttribute("aria-label", es ? "Preguntas sobre el Consejo Directivo" : "Questions about board service");
    close.setAttribute("aria-label", es ? "Cerrar la charla" : "Close chat");
    chatForm.querySelector("label").textContent = es ? "Tu pregunta" : "Your question";
    chatForm.querySelector("button").textContent = es ? "Enviar" : "Send";
    input.placeholder = es ? "Preguntá sobre la misión o el Consejo Directivo…" : "Ask about the mission or board service…";
    root.querySelector(".gustavo-note").textContent = es
      ? "Soy una guía de IA. Podés preguntar sin dar tus datos de contacto. Esta charla no se adjunta al formulario. Las conversaciones pueden revisarse para mejorar Casa de SAM; no compartas datos privados innecesarios."
      : "I’m an AI guide. You can ask without giving contact details. This chat is not attached to the form. Conversations may be reviewed to help Casa de SAM improve; please leave out unnecessary private information.";
    // Translate the welcome, not the visitor's existing conversation.
    messages.firstElementChild.textContent = es
      ? "¡Hola! Soy Gus. Acá podés conocer la visión de Casa de SAM y lo que implicaría integrar su Consejo Directivo fundador. Podés hacer preguntas sin completar el formulario. ¿Qué te gustaría entender primero?"
      : "Hi, I’m Gus. This is a place to explore Casa de SAM’s vision and what serving on its founding board could involve. You can ask questions without completing the form. What would you like to understand first?";
  }
  boardLabels();
  window.addEventListener("casa:languagechange", boardLabels);
  document.querySelectorAll("[data-gustavo-board-chat]").forEach(button => button.addEventListener("click", () => toggle(true)));

  function toggle(open) {
    if (open && panel.hidden) returnFocus = document.activeElement;
    if (open) boardLabels();
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
    if (open) {
      fitPanelToVisibleViewport();
      // Let mobile visitors read Gustavo's welcome before opening the keyboard.
      if (!mobileChat.matches) input.focus();
      else close.focus({ preventScroll: true });
    } else {
      returnFocus?.focus();
    }
  }
  launch.addEventListener("click", () => toggle(panel.hidden));
  close.addEventListener("click", () => toggle(false));
  root.addEventListener("keydown", event => { if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); toggle(false); } });

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

  let board;
  const boardReady = import("/js/gustavo-board.mjs")
    .then(({ mountBoardConversation }) => {
      board = mountBoardConversation({ root, messages, input, chatForm, addMessage });
    }).catch(() => {});

  async function ask(message) {
    if (asking) return;
    await boardReady;
    if (asking) return;
    if (board?.active) return board.handleMessage(message);
    asking = true;
    addMessage(message, "question");
    input.value = "";
    const waiting = addMessage(boardPage && pageLanguage() === "es" ? "Un momento…" : "One moment…", "answer");
    const sendButton = chatForm.querySelector("button");
    sendButton.disabled = true;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, entryContext: boardPage ? "board" : undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        waiting.textContent = data.error;
        return;
      }
      const answer = cleanAnswer(data.answer);
      waiting.textContent = answer;
      try {
        const { renderLinkedAnswer } = await import("/js/gustavo-links.mjs");
        renderLinkedAnswer(waiting, answer);
      } catch {
        // Keep the readable plain-text answer if the optional link renderer cannot load.
      }
      messages.scrollTop = messages.scrollHeight;
      history.push({ role: "user", content: message }, { role: "assistant", content: answer });
      history.splice(0, Math.max(0, history.length - 12));
      if (!boardPage && data.boardInterest) board?.offer(data.boardLanguage);
      else if (!boardPage && data.offerContact) handoff.hidden = false;
    } catch {
      waiting.textContent = boardPage && pageLanguage() === "es" ? "No estoy disponible en este momento. Podés volver a intentar en un momento." : "I’m not available just now. Please try again in a moment.";
    } finally {
      asking = false;
      sendButton.disabled = false;
      if (!panel.hidden) input.focus();
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
