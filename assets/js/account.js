
const SUPABASE_URL = "https://xeyuuydojhlhpsdvkfcj.supabase.co";
const SUPABASE_KEY = "sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

async function loadDashboard() {
  const accountMessage = document.getElementById("accountMessage");
  const requestsMessage = document.getElementById("requestsMessage");

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    const redirect = encodeURIComponent("account.html");
    window.location.replace(`auth.html?redirect=${redirect}`);
    return;
  }

  const user = sessionData.session.user;
  const meta = user.user_metadata || {};
  const fallbackName = meta.full_name || user.email?.split("@")[0] || "Customer";

  document.getElementById("welcomeName").textContent = fallbackName;

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("full_name,phone,state,email,created_at")
    .eq("id", user.id)
    .maybeSingle();

  const actualProfile = profile || {
    full_name: fallbackName,
    phone: meta.phone || "",
    state: meta.state || "",
    email: user.email || ""
  };

  document.getElementById("welcomeName").textContent =
    actualProfile.full_name || fallbackName;

  if (profileError) {
    console.warn("Profile load warning:", profileError);
  }

  document.getElementById("profileData").innerHTML = `
    <div class="profile-item"><span>Full Name</span><strong>${escapeHtml(actualProfile.full_name || "—")}</strong></div>
    <div class="profile-item"><span>Email</span><strong>${escapeHtml(actualProfile.email || user.email || "—")}</strong></div>
    <div class="profile-item"><span>Phone / WhatsApp</span><strong>${escapeHtml(actualProfile.phone || "—")}</strong></div>
    <div class="profile-item"><span>State</span><strong>${escapeHtml(actualProfile.state || "—")}</strong></div>
  `;
  accountMessage.textContent = "Your account is active.";

  const { data: requests, error: requestsError } = await supabaseClient
    .from("quote_requests")
    .select("id,full_name,location,property_type,preferred_package,loads,message,status,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (requestsError) {
    requestsMessage.className = "dashboard-message error";
    requestsMessage.textContent =
      "Your dashboard is ready, but quote history is not available yet. Please make sure the quote_requests SQL setup has been run in Supabase.";
    console.error(requestsError);
    return;
  }

  const list = document.getElementById("requestsList");
  const total = requests.length;
  const pending = requests.filter(r => r.status === "Pending").length;
  const quoted = requests.filter(r => r.status === "Quoted").length;

  document.getElementById("quoteCount").textContent = total;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("quotedCount").textContent = quoted;

  requestsMessage.textContent = "";

  if (!requests.length) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-file-circle-plus"></i>
        <p>You haven't submitted a quote request yet.</p>
        <a class="secondary-action" href="quote.html">Request Your First Quote</a>
      </div>`;
    return;
  }

  list.innerHTML = requests.map(request => {
    const statusClass = String(request.status || "").toLowerCase();
    const loads = Array.isArray(request.loads) ? request.loads.join(", ") : "";
    return `
      <article class="request-item">
        <div class="request-top">
          <div>
            <h3>Solar Quote Request #${escapeHtml(request.id)}</h3>
            <span class="request-date">${escapeHtml(formatDate(request.created_at))}</span>
          </div>
          <span class="status-badge ${escapeHtml(statusClass)}">${escapeHtml(request.status || "Pending")}</span>
        </div>

        <div class="request-meta">
          <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(request.location)}</span>
          <span><i class="fa-solid fa-building"></i> ${escapeHtml(request.property_type)}</span>
          ${request.preferred_package ? `<span><i class="fa-solid fa-bolt"></i> ${escapeHtml(request.preferred_package)}</span>` : ""}
          ${loads ? `<span><i class="fa-solid fa-plug"></i> ${escapeHtml(loads)}</span>` : ""}
        </div>

        ${request.message ? `<p class="request-message">${escapeHtml(request.message)}</p>` : ""}
      </article>`;
  }).join("");
}

document.getElementById("logoutBtn").addEventListener("click", async function () {
  const button = this;
  button.disabled = true;
  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging out...';

  try {
    await supabaseClient.auth.signOut();
  } catch (error) {
    console.warn("Supabase signout warning:", error);
  }

  try { localStorage.clear(); } catch (e) {}
  try { sessionStorage.clear(); } catch (e) {}

  window.location.replace("auth.html?loggedout=1&v=" + Date.now());
});

loadDashboard();
