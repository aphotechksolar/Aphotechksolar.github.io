/* Public package/product prices are loaded from Supabase.
   If the products table is unavailable, the original static cards remain visible. */
const APHOTECH_SUPABASE_URL = "https://xeyuuydojhlhpsdvkfcj.supabase.co";
const APHOTECH_SUPABASE_KEY = "sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN";
const packageDb = window.supabase.createClient(APHOTECH_SUPABASE_URL, APHOTECH_SUPABASE_KEY);
const formatNaira = value => value == null ? "Contact Us" : "₦" + Number(value).toLocaleString("en-NG");
const wa = text => `https://wa.me/2348165029912?text=${encodeURIComponent(text)}`;
const safe = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));

function packageCard(p){
  const isCustom = p.price == null;
  const amount = p.price == null ? "" : Number(p.price);
  const msg = isCustom ? `Hello Aphotech Solar, I need a custom solar solution.` : `Hello Aphotech Solar, I am interested in the ${p.name} for ${formatNaira(p.price)}.`;
  return `<article class="solar-listing" data-name="${safe(p.name)}" data-description="${safe(p.description)}"><div class="listing-image"><img src="${safe(p.image_path || "assets/images/custom.jpg")}" alt="${safe(p.name)}" loading="lazy"><span class="listing-badge ${p.badge === "Custom" ? "custom-badge" : ""}">${safe(p.badge || "Solar")}</span><button class="save-button" onclick="savePackage('${safe(p.name).replace(/'/g,"\\'")}')" aria-label="Save ${safe(p.name)}"><i class="fa-regular fa-heart"></i></button></div><div class="listing-content"><h3>${safe(p.name)}</h3><div class="listing-price">${formatNaira(p.price)}</div><p class="listing-use">${safe(p.description || "Solar solution")}</p><div class="listing-meta"><span><i class="fa-solid fa-location-dot"></i>${safe(p.meta_text || "Nigeria")}</span><span><i class="fa-solid fa-solar-panel"></i>${safe(p.capacity || "Solar")}</span></div><div class="listing-actions"><a class="buy-button" href="${wa(msg)}" target="_blank" rel="noopener">${isCustom ? "Request Quote" : "Buy Now"}</a><a class="whatsapp-button" href="${wa(msg)}" target="_blank" rel="noopener" aria-label="Ask about ${safe(p.name)}"><i class="fa-brands fa-whatsapp"></i></a></div></div></article>`;
}
function applianceCard(p){
  const msg = `Hello Aphotech Solar, I am interested in the ${p.name}${p.price == null ? "" : " for " + formatNaira(p.price)}.`;
  return `<article class="appliance-card"><div class="appliance-image"><img src="${safe(p.image_path || "assets/images/solar-freezer.jpg")}" alt="${safe(p.name)}" loading="lazy"><span class="appliance-badge">${safe(p.badge || "Solar Powered")}</span></div><div class="appliance-content"><h3>${safe(p.name)}</h3><div class="appliance-price">${formatNaira(p.price)}</div><p>${safe(p.description || "Reliable solar appliance.")}</p><div class="appliance-meta"><span><i class="fa-solid fa-solar-panel"></i> Solar Powered</span><span><i class="fa-solid fa-bolt"></i> Energy Efficient</span></div><div class="appliance-actions"><a class="appliance-buy" href="${wa(msg)}" target="_blank" rel="noopener">Buy Now</a><a class="appliance-whatsapp" href="${wa(msg)}" target="_blank" rel="noopener" aria-label="Ask about ${safe(p.name)}"><i class="fa-brands fa-whatsapp"></i></a></div></div></article>`;
}

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
