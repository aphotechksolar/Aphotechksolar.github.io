const SUPABASE_URL = "https://xeyuuydojhlhpsdvkfcj.supabase.co";
const SUPABASE_KEY = "sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN";
const adminClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allRequests = [];
let allProducts = [];

const $ = id => document.getElementById(id);
const money = value => value == null || value === "" ? "Contact Us" : "₦" + Number(value).toLocaleString("en-NG");

function flash(message, type="success") {
  const el = $("adminMessage");
  el.textContent = message;
  el.className = `admin-message ${type}`;
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => el.classList.add("hidden"), 3200);
}

async function requireAdmin() {
  const { data, error } = await adminClient.auth.getSession();
  if (error || !data.session) {
    location.replace("auth.html?redirect=admin.html");
    return false;
  }
  const user = data.session.user;
  const { data: profile, error: profileError } = await adminClient
    .from("profiles").select("role,full_name,email").eq("id", user.id).maybeSingle();
  if (profileError || !profile || profile.role !== "admin") {
    document.body.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;padding:30px;text-align:center;font-family:Arial"><div><h1>Admin access required</h1><p>This account is not an administrator.</p><a href="account.html">Back to My Account</a></div></main>`;
    return false;
  }
  return true;
}

async function loadRequests() {
  const { data, error } = await adminClient.from("quote_requests")
    .select("id,user_id,full_name,phone,email,location,property_type,preferred_package,loads,message,status,quoted_amount,admin_notes,created_at,updated_at")
    .order("created_at", { ascending:false });
  if (error) { flash(error.message || "Unable to load quote requests.", "error"); return; }
  allRequests = data || [];
  renderRequests();
  $("statAll").textContent = allRequests.length;
  $("statPending").textContent = allRequests.filter(r => r.status === "Pending").length;
  $("statQuoted").textContent = allRequests.filter(r => r.status === "Quoted").length;
}

function renderRequests() {
  const filter = $("statusFilter").value;
  const rows = allRequests.filter(r => filter === "all" || r.status === filter);
  const body = $("requestsBody");
  if (!rows.length) { body.innerHTML = `<tr><td colspan="6" class="empty">No quote requests found.</td></tr>`; return; }
  body.innerHTML = rows.map(r => `
    <tr>
      <td><span class="customer-name">${esc(r.full_name)}</span><span class="subtext">${esc(r.phone)}</span></td>
      <td><strong>${esc(r.preferred_package || "Custom request")}</strong><span class="subtext">${esc(r.location)} • ${esc(r.property_type)}</span></td>
      <td>${new Date(r.created_at).toLocaleDateString("en-NG", {day:"2-digit",month:"short",year:"numeric"})}</td>
      <td><select class="status-select" data-id="${r.id}" data-field="status">${["Pending","Reviewed","Quoted","Completed","Cancelled"].map(s => `<option ${s===r.status?"selected":""}>${s}</option>`).join("")}</select></td>
      <td><input class="amount-input" data-id="${r.id}" data-field="quoted_amount" type="number" min="0" value="${r.quoted_amount ?? ""}" placeholder="₦ amount"></td>
      <td><button class="small-btn view-request" data-id="${r.id}">View</button></td>
    </tr>`).join("");
}

function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }

async function updateRequest(id, field, value) {
  const patch = {};
  if (field === "quoted_amount") patch[field] = value === "" ? null : Number(value);
  else patch[field] = value;
  const { error } = await adminClient.from("quote_requests").update(patch).eq("id", id);
  if (error) { flash(error.message || "Update failed.", "error"); return; }
  const item = allRequests.find(r => r.id == id);
  if (item) item[field] = patch[field];
  if (field === "status") { $("statPending").textContent = allRequests.filter(r => r.status === "Pending").length; $("statQuoted").textContent = allRequests.filter(r => r.status === "Quoted").length; }
  flash("Quote request updated.");
}

function openRequest(id) {
  const r = allRequests.find(x => x.id == id);
  if (!r) return;
  $("requestDetails").innerHTML = `
    <h2>Customer Quote Request #${r.id}</h2>
    <div class="detail-grid">
      <div class="detail-item"><strong>Customer</strong>${esc(r.full_name)}</div>
      <div class="detail-item"><strong>Phone</strong><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></div>
      <div class="detail-item"><strong>Email</strong>${esc(r.email || "Not provided")}</div>
      <div class="detail-item"><strong>Location</strong>${esc(r.location)}</div>
      <div class="detail-item"><strong>Property</strong>${esc(r.property_type)}</div>
      <div class="detail-item"><strong>Preferred Package</strong>${esc(r.preferred_package || "Custom")}</div>
      <div class="detail-item"><strong>Requested Loads</strong>${esc((r.loads || []).join(", ") || "None selected")}</div>
      <div class="detail-item"><strong>Submitted</strong>${new Date(r.created_at).toLocaleString("en-NG")}</div>
    </div>
    <div class="detail-item" style="margin-top:14px"><strong>Customer Message</strong>${esc(r.message || "No additional message.")}</div>
    <label style="display:block;margin-top:14px;font-weight:700">Internal admin notes<textarea id="adminNotesInput" rows="4" style="width:100%;margin-top:6px;border:1px solid #ccd6d8;border-radius:10px;padding:10px">${esc(r.admin_notes || "")}</textarea></label>
    <div style="display:flex;gap:10px;margin-top:12px"><button class="primary-btn" id="saveNotes" data-id="${r.id}">Save Notes</button><a class="secondary-btn" href="https://wa.me/${String(r.phone).replace(/\D/g,"")}?text=${encodeURIComponent("Hello " + r.full_name + ", this is Aphotech Solar Solution regarding your solar quote request.")}" target="_blank" rel="noopener">WhatsApp Customer</a></div>`;
  $("requestModal").classList.remove("hidden");
}

async function saveNotes(id) {
  const notes = $("adminNotesInput").value.trim() || null;
  const { error } = await adminClient.from("quote_requests").update({ admin_notes: notes }).eq("id", id);
  if (error) { flash(error.message || "Could not save notes.", "error"); return; }
  const r = allRequests.find(x => x.id == id); if (r) r.admin_notes = notes;
  flash("Admin notes saved."); $("requestModal").classList.add("hidden");
}

async function loadProducts() {
  const { data, error } = await adminClient.from("products").select("*").order("category").order("sort_order").order("name");
  if (error) { flash(error.message || "Unable to load products. Run admin-upgrade.sql first.", "error"); return; }
  allProducts = data || [];
  renderProducts();
  $("statProducts").textContent = allProducts.filter(p => p.active).length;
}

function renderProducts() {
  const body = $("productsBody");
  if (!allProducts.length) { body.innerHTML = `<tr><td colspan="5" class="empty">No products found.</td></tr>`; return; }
  body.innerHTML = allProducts.map(p => `<tr>
    <td><strong>${esc(p.name)}</strong><span class="subtext">${esc(p.description || "")}</span></td>
    <td>${p.category === "package" ? "Solar Package" : "Appliance"}</td>
    <td>${money(p.price)}</td>
    <td>${p.active ? "Yes" : "No"}</td>
    <td><button class="small-btn edit-product" data-id="${p.id}">Edit</button> <button class="small-btn danger-small delete-product" data-id="${p.id}">Delete</button></td>
  </tr>`).join("");
}

function fillProductForm(p) {
  $("productId").value = p?.id || ""; $("productName").value = p?.name || ""; $("productCategory").value = p?.category || "package"; $("productPrice").value = p?.price ?? ""; $("productDescription").value = p?.description || ""; $("productImage").value = p?.image_path || ""; $("productBadge").value = p?.badge || ""; $("productCapacity").value = p?.capacity || ""; $("productSort").value = p?.sort_order ?? 100; $("productActive").checked = p ? !!p.active : true; $("productFormWrap").classList.remove("hidden"); window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
}

async function saveProduct(e) {
  e.preventDefault();
  const id = $("productId").value;
  const payload = {name:$("productName").value.trim(),category:$("productCategory").value,price:$("productPrice").value === "" ? null : Number($("productPrice").value),description:$("productDescription").value.trim() || null,image_path:$("productImage").value.trim() || null,badge:$("productBadge").value.trim() || null,capacity:$("productCapacity").value.trim() || null,sort_order:Number($("productSort").value || 100),active:$("productActive").checked};
  if (!payload.name) return flash("Product name is required.", "error");
  const result = id ? await adminClient.from("products").update(payload).eq("id", id) : await adminClient.from("products").insert(payload);
  if (result.error) { flash(result.error.message || "Could not save product.", "error"); return; }
  flash(id ? "Product updated." : "Product added."); $("productFormWrap").classList.add("hidden"); $("productForm").reset(); $("productActive").checked = true; await loadProducts();
}


async function deleteProduct(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) return;
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
  const { error } = await adminClient.from("products").delete().eq("id", id);
  if (error) { flash(error.message || "Could not delete product.", "error"); return; }
  flash("Product deleted.");
  await loadProducts();
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!await requireAdmin()) return;
  await Promise.all([loadRequests(), loadProducts()]);
  $("statusFilter").addEventListener("change", renderRequests);
  $("refreshAll").addEventListener("click", () => Promise.all([loadRequests(), loadProducts()]));
  $("logoutBtn").addEventListener("click", async () => { await adminClient.auth.signOut(); location.replace("auth.html"); });
  $("showAddProduct").addEventListener("click", () => { $("productForm").reset(); $("productId").value=""; $("productActive").checked=true; fillProductForm(); });
  $("cancelProduct").addEventListener("click", () => $("productFormWrap").classList.add("hidden"));
  $("productForm").addEventListener("submit", saveProduct);
  $("closeModal").addEventListener("click", () => $("requestModal").classList.add("hidden"));
  $("requestModal").addEventListener("click", e => { if (e.target.id === "requestModal") $("requestModal").classList.add("hidden"); });
  $("requestsBody").addEventListener("change", e => { if (e.target.dataset.id) updateRequest(e.target.dataset.id, e.target.dataset.field, e.target.value); });
  $("requestsBody").addEventListener("click", e => { if (e.target.classList.contains("view-request")) openRequest(e.target.dataset.id); });
  $("productsBody").addEventListener("click", e => {
    if (e.target.classList.contains("edit-product")) fillProductForm(allProducts.find(p => p.id == e.target.dataset.id));
    if (e.target.classList.contains("delete-product")) deleteProduct(e.target.dataset.id);
  });
  document.addEventListener("click", e => { if (e.target.id === "saveNotes") saveNotes(e.target.dataset.id); });
});
