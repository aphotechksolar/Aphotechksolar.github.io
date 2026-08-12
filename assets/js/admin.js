// Projects public-display compatibility fix v7.1
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
    <td><span class="visibility-pill ${p.active ? "is-active" : "is-hidden"}">${p.active ? "Visible" : "Hidden"}</span></td>
    <td class="product-actions"><button class="small-btn edit-product" data-id="${p.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button> <button class="small-btn toggle-product" data-id="${p.id}">${p.active ? '<i class="fa-solid fa-eye-slash"></i> Hide' : '<i class="fa-solid fa-eye"></i> Show'}</button> <button class="small-btn danger-small delete-product" data-id="${p.id}"><i class="fa-solid fa-trash"></i> Delete</button></td>
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


async function toggleProduct(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) return;
  const next = !product.active;
  if (!confirm(`${next ? "Show" : "Hide"} "${product.name}" on the public Packages page?`)) return;
  const { error } = await adminClient.from("products").update({ active: next }).eq("id", id);
  if (error) { flash(error.message || "Could not update product visibility.", "error"); return; }
  flash(next ? "Product is now visible." : "Product hidden from the public website.");
  await loadProducts();
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


let allProjects = [];

async function loadProjects() {
  const { data, error } = await adminClient.from("projects").select("*").order("sort_order").order("created_at", {ascending:false});
  if (error) { flash(error.message || "Unable to load projects. Run projects-media.sql first.", "error"); return; }
  allProjects = data || [];
  renderProjects();
}

function renderProjects() {
  const body = $("projectsBody");
  if (!allProjects.length) { body.innerHTML = `<tr><td colspan="5" class="empty">No projects yet. Add your first project above.</td></tr>`; return; }
  body.innerHTML = allProjects.map(p => {
    const thumb = p.thumbnail_url || p.media_url;
    const preview = p.media_type === "video" ? `<video src="${esc(p.media_url)}" muted preload="metadata"></video>` : `<img src="${esc(thumb)}" alt="${esc(p.title)}">`;
    return `<tr>
      <td><div class="project-admin-thumb">${preview}</div></td>
      <td><strong>${esc(p.title)}</strong><span class="subtext">${esc(p.location || "")}</span></td>
      <td>${p.media_type === "video" ? "Video" : "Image"}</td>
      <td><span class="visibility-pill ${p.active ? "is-active" : "is-hidden"}">${p.active ? "Visible" : "Hidden"}</span></td>
      <td class="product-actions"><button class="small-btn edit-project" data-id="${p.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button> <button class="small-btn toggle-project" data-id="${p.id}">${p.active ? '<i class="fa-solid fa-eye-slash"></i> Hide' : '<i class="fa-solid fa-eye"></i> Show'}</button> <button class="small-btn danger-small delete-project" data-id="${p.id}"><i class="fa-solid fa-trash"></i> Delete</button></td>
    </tr>`;
  }).join("");
}

function fillProjectForm(p) {
  $("projectId").value = p?.id || "";
  $("projectExistingMediaUrl").value = p?.media_url || "";
  $("projectTitle").value = p?.title || "";
  $("projectLocation").value = p?.location || "";
  $("projectDescription").value = p?.description || "";
  $("projectMediaType").value = p?.media_type || "image";
  $("projectMediaUrl").value = p?.media_url && !p.media_url.includes("project-media") ? p.media_url : "";
  $("projectSort").value = p?.sort_order ?? 100;
  $("projectActive").checked = p ? !!p.active : true;
  $("projectMediaFile").value = "";
  $("projectFormWrap").classList.remove("hidden");
  document.getElementById("projectsPanel").scrollIntoView({behavior:"smooth", block:"start"});
}

function makeSafeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}

async function uploadProjectMedia(file, projectId) {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${crypto.randomUUID()}-${makeSafeFileName(file.name)}`;
  const { error: uploadError } = await adminClient.storage.from("project-media").upload(path, file, {upsert:false, contentType:file.type || undefined});
  if (uploadError) throw uploadError;
  const { data } = adminClient.storage.from("project-media").getPublicUrl(path);
  return data.publicUrl;
}

async function saveProject(e) {
  e.preventDefault();
  const id = $("projectId").value;
  const title = $("projectTitle").value.trim();
  if (!title) return flash("Project title is required.", "error");
  const file = $("projectMediaFile").files[0];
  const mediaType = $("projectMediaType").value;
  if (file) {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if ((mediaType === "image" && !isImage) || (mediaType === "video" && !isVideo)) return flash("The selected file does not match the media type.", "error");
  }
  const button = $("projectForm").querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Saving...";
  try {
    let mediaUrl = $("projectMediaUrl").value.trim();
    if (!mediaUrl) mediaUrl = $("projectExistingMediaUrl").value.trim();
    if (file) {
      flash("Uploading media...", "success");
      mediaUrl = await uploadProjectMedia(file, id || crypto.randomUUID());
    }
    if (!mediaUrl) throw new Error("Please upload a file or enter a media URL.");
    const payload = {title, location:$("projectLocation").value.trim() || null, description:$("projectDescription").value.trim() || null, media_type:mediaType, media_url:mediaUrl, thumbnail_url:mediaType === "image" ? mediaUrl : null, active:$("projectActive").checked, sort_order:Number($("projectSort").value || 100)};
    const result = id ? await adminClient.from("projects").update(payload).eq("id", id) : await adminClient.from("projects").insert(payload);
    if (result.error) throw result.error;
    flash(id ? "Project updated." : "Project added.");
    $("projectForm").reset(); $("projectId").value=""; $("projectExistingMediaUrl").value=""; $("projectActive").checked=true; $("projectFormWrap").classList.add("hidden");
    await loadProjects();
  } catch (err) {
    flash(err.message || "Could not save project.", "error");
  } finally {
    button.disabled = false; button.textContent = "Save Project";
  }
}

async function toggleProject(id) {
  const project = allProjects.find(p => p.id == id); if (!project) return;
  const next = !project.active;
  if (!confirm(`${next ? "Show" : "Hide"} "${project.title}" on the public Projects page?`)) return;
  const { error } = await adminClient.from("projects").update({active:next}).eq("id", id);
  if (error) return flash(error.message || "Could not update project visibility.", "error");
  flash(next ? "Project is now visible." : "Project hidden."); await loadProjects();
}

async function deleteProject(id) {
  const project = allProjects.find(p => p.id == id); if (!project) return;
  if (!confirm(`Delete "${project.title}" and remove its database record? This cannot be undone.`)) return;
  const { error } = await adminClient.from("projects").delete().eq("id", id);
  if (error) return flash(error.message || "Could not delete project.", "error");
  // Also remove uploaded storage media when it belongs to our bucket.
  try {
    const marker = "/storage/v1/object/public/project-media/";
    const index = project.media_url.indexOf(marker);
    if (index >= 0) await adminClient.storage.from("project-media").remove([decodeURIComponent(project.media_url.slice(index + marker.length))]);
  } catch (_) {}
  flash("Project deleted."); await loadProjects();
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!await requireAdmin()) return;
  await Promise.all([loadRequests(), loadProducts(), loadProjects()]);
  $("statusFilter").addEventListener("change", renderRequests);
  $("refreshAll").addEventListener("click", () => Promise.all([loadRequests(), loadProducts(), loadProjects()]));
  $("logoutBtn").addEventListener("click", async () => { await adminClient.auth.signOut(); location.replace("auth.html"); });
  $("showAddProduct").addEventListener("click", () => { $("productForm").reset(); $("productId").value=""; $("productActive").checked=true; fillProductForm(); });
  $("cancelProduct").addEventListener("click", () => $("productFormWrap").classList.add("hidden"));
  $("productForm").addEventListener("submit", saveProduct);
  $("closeModal").addEventListener("click", () => $("requestModal").classList.add("hidden"));
  $("requestModal").addEventListener("click", e => { if (e.target.id === "requestModal") $("requestModal").classList.add("hidden"); });
  $("requestsBody").addEventListener("change", e => { if (e.target.dataset.id) updateRequest(e.target.dataset.id, e.target.dataset.field, e.target.value); });
  $("requestsBody").addEventListener("click", e => { if (e.target.classList.contains("view-request")) openRequest(e.target.dataset.id); });
  $("productsBody").addEventListener("click", e => {
    if (e.target.closest(".edit-product")) fillProductForm(allProducts.find(p => p.id == e.target.closest(".edit-product").dataset.id));
    if (e.target.closest(".toggle-product")) toggleProduct(e.target.closest(".toggle-product").dataset.id);
    if (e.target.closest(".delete-product")) deleteProduct(e.target.closest(".delete-product").dataset.id);
  });
  $("showAddProject").addEventListener("click", () => { $("projectForm").reset(); $("projectId").value=""; $("projectExistingMediaUrl").value=""; $("projectActive").checked=true; fillProjectForm(); });
  $("cancelProject").addEventListener("click", () => $("projectFormWrap").classList.add("hidden"));
  $("projectForm").addEventListener("submit", saveProject);
  $("projectsBody").addEventListener("click", e => {
    const edit=e.target.closest(".edit-project"), toggle=e.target.closest(".toggle-project"), del=e.target.closest(".delete-project");
    if(edit) fillProjectForm(allProjects.find(p => p.id == edit.dataset.id));
    if(toggle) toggleProject(toggle.dataset.id);
    if(del) deleteProject(del.dataset.id);
  });
  document.addEventListener("click", e => { if (e.target.id === "saveNotes") saveNotes(e.target.dataset.id); });
});
