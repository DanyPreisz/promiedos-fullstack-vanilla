import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#match-form");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/matches");
  listEl.innerHTML = "";
  data.matches.forEach((m) => {
    const box = document.createElement("div");
    box.className = "match";
    box.innerHTML = `
      <div><strong>${m.home}</strong><div class="status">${m.league}</div></div>
      <div class="score">${m.homeScore} - ${m.awayScore}<div class="status">${m.status} ${m.time}</div></div>
      <div style="text-align:right"><strong>${m.away}</strong></div>
    `;
    const del = document.createElement("button");
    del.className = "ghost";
    del.textContent = "Borrar";
    del.style.gridColumn = "1 / -1";
    del.addEventListener("click", async () => { await api(`/api/matches/${m.id}`, { method: "DELETE" }); await refresh(); });
    box.append(del);
    listEl.append(box);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/matches", { method: "POST", body: JSON.stringify({
      league: document.querySelector("#league").value.trim(),
      home: document.querySelector("#home").value.trim(),
      away: document.querySelector("#away").value.trim(),
      homeScore: document.querySelector("#homeScore").value,
      awayScore: document.querySelector("#awayScore").value,
      status: document.querySelector("#status").value,
      time: document.querySelector("#time").value.trim()
    }) });
    form.reset();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
