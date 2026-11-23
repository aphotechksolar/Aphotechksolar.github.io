/* Public package/product prices are loaded from Supabase.
   Product detail views use only information saved in the admin dashboard. */
const APHOTECH_SUPABASE_URL = "https://xeyuuydojhlhpsdvkfcj.supabase.co";
const APHOTECH_SUPABASE_KEY = "sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN";
const packageDb = window.supabase.createClient(APHOTECH_SUPABASE_URL, APHOTECH_SUPABASE_KEY);
const formatNaira = value => value == null ? "Contact Us" : "₦" + Number(value).toLocaleString("en-NG");
const wa = text => `https://wa.me/2348165029912?text=${encodeURIComponent(text)}`;
const safe = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
const productCache = new Map();

function productMessage(p){
  return p.price == null
    ? `Hello Aphotech Solar, I need more information about ${p.name}.`
    : `Hello Aphotech Solar, I am interested in the ${p.name} for ${formatNaira(p.price)}.`;
}
function packageCard(p){
  productCache.set(String(p.id), p);
  const isCustom = p.price == null;
  return `<article class="solar-listing product-open-card" data-product-id="${safe(p.id)}" data-name="${safe(p.name)}" data-description="${safe(p.description)}" tabindex="0" role="button" aria-label="View details for ${safe(p.name)}">
    <div class="listing-image"><img src="${safe(p.image_path || "assets/images/custom.jpg")}" alt="${safe(p.name)}" loading="lazy"><span class="listing-badge">${safe(p.badge || "Solar")}</span><button class="save-button" onclick="event.stopPropagation(); savePackage('${safe(p.name).replace(/'/g,"\\'")}')" aria-label="Save ${safe(p.name)}"><i class="fa-regular fa-heart"></i></button></div>
    <div class="listing-content"><h3>${safe(p.name)}</h3><div class="listing-price">${formatNaira(p.price)}</div><p class="listing-use">${safe(p.description || "Solar solution")}</p>
    <div class="listing-meta"><span><i class="fa-solid fa-location-dot"></i> ${safe(p.meta_text || "Nigeria")}</span><span><i class="fa-solid fa-solar-panel"></i> ${safe(p.capacity || "Solar")}</span></div>
    <div class="listing-actions"><button class="product-details-button" type="button" data-open-product="${safe(p.id)}">View details</button><a class="buy-button" href="${wa(productMessage(p))}" target="_blank" rel="noopener">${isCustom ? "Request Quote" : "Buy Now"}</a></div></div></article>`;
}
function applianceCard(p){
  productCache.set(String(p.id), p);
  return `<article class="appliance-card product-open-card" data-product-id="${safe(p.id)}" tabindex="0" role="button" aria-label="View details for ${safe(p.name)}">
    <div class="appliance-image"><img src="${safe(p.image_path || "assets/images/solar-freezer.jpg")}" alt="${safe(p.name)}" loading="lazy"><span class="appliance-badge">${safe(p.badge || "Solar Powered")}</span></div>
    <div class="appliance-content"><h3>${safe(p.name)}</h3><div class="appliance-price">${formatNaira(p.price)}</div><p>${safe(p.description || "Reliable solar appliance.")}</p>
    <div class="appliance-actions"><button class="product-details-button" type="button" data-open-product="${safe(p.id)}">View details</button><a class="appliance-buy" href="${wa(productMessage(p))}" target="_blank" rel="noopener">Buy Now</a></div></div></article>`;
}
function ensureProductModal(){
  if(document.getElementById("productDetailModal")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <div class="product-modal" id="productDetailModal" aria-hidden="true">
      <div class="product-modal-backdrop" data-close-product></div>
      <section class="product-modal-panel" role="dialog" aria-modal="true" aria-labelledby="productDetailTitle">
        <button class="product-modal-close" type="button" aria-label="Close product details" data-close-product><i class="fa-solid fa-xmark"></i></button>
        <div class="product-modal-image-wrap"><img id="productDetailImage" src="" alt=""></div>
        <div class="product-modal-info">
          <span class="product-modal-badge" id="productDetailBadge">Solar solution</span>
          <h2 id="productDetailTitle"></h2>
          <div class="product-modal-price" id="productDetailPrice"></div>
          <p class="product-modal-description" id="productDetailDescription"></p>
          <div class="product-detail-facts" id="productDetailFacts"></div>
          <p class="product-detail-note">Need the exact panel, inverter and battery specifications? Contact our team for a sizing check based on your appliances and daily usage.</p>
          <div class="product-modal-actions">
            <a class="product-modal-whatsapp" id="productDetailWhatsApp" href="#" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Ask on WhatsApp</a>
            <a class="product-modal-contact" href="contact.html">Contact us</a>
          </div>
        </div>
      </section>
    </div>`);
}
function openProductDetails(id){
  const p = productCache.get(String(id));
  if(!p) return;
  ensureProductModal();
  const modal = document.getElementById("productDetailModal");
  const image = document.getElementById("productDetailImage");
  image.src = p.image_path || "assets/images/custom.jpg";
  image.alt = p.name || "Solar product";
  document.getElementById("productDetailBadge").textContent = p.badge || (p.category === "appliance" ? "Solar powered" : "Solar package");
  document.getElementById("productDetailTitle").textContent = p.name || "Solar solution";
  document.getElementById("productDetailPrice").textContent = formatNaira(p.price);
  document.getElementById("productDetailDescription").textContent = p.description || "Speak with Aphotech Solar Solution for more information about this product.";
  const facts = [];
  if(p.capacity) facts.push(["Capacity",p.capacity]);
  if(p.category) facts.push(["Product type",p.category === "appliance" ? "Solar appliance" : "Solar package"]);
  if(p.meta_text) facts.push(["Location",p.meta_text]);
  document.getElementById("productDetailFacts").innerHTML = facts.map(([k,v]) => `<div class="product-fact"><span>${safe(k)}</span><strong>${safe(v)}</strong></div>`).join("");
  document.getElementById("productDetailWhatsApp").href = wa(productMessage(p));
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("product-modal-open");
  document.getElementById("productDetailTitle").focus?.();
}
function closeProductDetails(){
  const modal = document.getElementById("productDetailModal");
  if(!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("product-modal-open");
}
document.addEventListener("click", e => {
  const open = e.target.closest("[data-open-product]");
  if(open){ e.preventDefault(); e.stopPropagation(); openProductDetails(open.dataset.openProduct); return; }
  if(e.target.closest("[data-close-product]")) closeProductDetails();
  const card = e.target.closest(".product-open-card");
  if(card && !e.target.closest("a,button")) openProductDetails(card.dataset.productId);
});
document.addEventListener("keydown", e => {
  if(e.key === "Escape") closeProductDetails();
  if((e.key === "Enter" || e.key === " ") && e.target.matches(".product-open-card")){
    e.preventDefault(); openProductDetails(e.target.dataset.productId);
  }
});
async function loadPublicProducts(){
  try{
    const {data,error}=await packageDb.from("products").select("*").eq("active",true).order("category").order("sort_order").order("name");
    if(error || !data || !data.length) return;
    const packages=data.filter(p=>p.category === "package");
    const appliances=data.filter(p=>p.category === "appliance");
    const grid=document.getElementById("packageGrid");
    const applianceGrid=document.querySelector(".appliances-grid");
    if(grid && packages.length) grid.innerHTML=packages.map(packageCard).join("");
    if(applianceGrid && appliances.length) applianceGrid.innerHTML=appliances.map(applianceCard).join("");
    document.dispatchEvent(new Event("aphotechProductsLoaded"));
  }catch(e){console.warn("Public product price sync unavailable:",e);}
}
document.addEventListener("DOMContentLoaded", loadPublicProducts);
