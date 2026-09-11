(() => {
  const history = [];
  const access = document.querySelector("#gustavo-access");
  const unlock = document.querySelector("#gustavo-unlock");
  const loginStatus = document.querySelector(".gustavo-admin-status");
  const workspace = document.querySelector(".gustavo-admin-workspace");
  const form = document.querySelector(".gustavo-admin-form");
  const input = document.querySelector("#gustavo-admin-message");
  const messages = document.querySelector(".gustavo-admin-messages");
  let token = "";

  function addMessage(text, kind) {
    const item = document.createElement("article");
    item.className = `gustavo-admin-message ${kind}`;
    item.textContent = text;
    messages.append(item);
    item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return item;
  }

  async function ask(message, unlocking = false) {
    if (!unlocking) addMessage(message, "question");
    const waiting = unlocking ? null : addMessage("Preparing…", "answer");
    const response = await fetch("/api/gustavo", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode: "private", message, history }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    if (waiting) {
      waiting.textContent = data.answer;
      history.push({ role: "user", content: message }, { role: "assistant", content: data.answer });
      history.splice(0, Math.max(0, history.length - 8));
    }
    return data;
  }

  unlock.addEventListener("click", async () => {
    token = access.value;
    loginStatus.textContent = "Checking…";
    try {
      await ask("Confirm private workspace access in one short sentence.", true);
      loginStatus.textContent = "Private workspace open.";
      workspace.hidden = false;
      access.value = "";
      input.focus();
    } catch (error) {
      token = "";
      loginStatus.textContent = error.message;
      workspace.hidden = true;
    }
  });
  access.addEventListener("keydown", (event) => {
    if (event.key === "Enter") unlock.click();
  });
  document.querySelectorAll(".gustavo-admin-prompts button").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.textContent;
      input.focus();
    });
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    form.querySelector("button").disabled = true;
    try {
      await ask(message);
    } catch (error) {
      addMessage(error.message, "answer");
    } finally {
      form.querySelector("button").disabled = false;
    }
  });
})();
