(() => {
const URL="https://xeyuuydojhlhpsdvkfcj.supabase.co",KEY="sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN",db=supabase.createClient(URL,KEY);
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])),money=n=>"₦"+Number(n||0).toLocaleString("en-NG");
let source={},sourceType="",sourceId="",invoice=null,session=null,rows=[],paymentApprovalConfirmed=false;
const defaultWarning="IMPORTANT PAYMENT & DELIVERY NOTICE: Please pay only into the official Aphotech account shown below. Do not rely on transfer screenshots, SMS alerts or payment receipts as proof of payment. Aphotech Solar Solution will confirm cleared funds directly in its Moniepoint account. Procurement, delivery, installation or work scheduling will begin only after payment has been verified. Contact us immediately if anyone gives you different account details.";
const defaultTerms="This invoice is valid for 7 days from the issue date unless otherwise stated. Product availability and installation dates are subject to confirmation. Any changes to the agreed scope or site conditions may affect the final price. Keep this invoice and your payment reference for your records.";
function notice(s,kind="warn"){const e=$("invoiceMessage");e.hidden=!s;e.className="store-alert "+(kind==="error"?"store-error":kind==="success"?"store-success":"");e.textContent=s;}
function n(v){const x=Number(v);return Number.isFinite(x)&&x>=0?x:0;}
function total(){return rows.reduce((a,r)=>a+n(r.amount),0)+n($("deliveryFee")?.value);}
function lineMarkup(r,i){return '<div class="invoice-line" data-line="'+i+'"><label>Description<input class="line-desc" value="'+esc(r.name)+'" maxlength="180"></label><label>Qty<input class="line-qty" type="number" min="1" step="1" value="'+Math.max(1,Math.floor(n(r.qty)||1))+'"></label><label>Amount (₦)<input class="line-amount" type="number" min="0" step="0.01" value="'+n(r.amount)+'"></label><button type="button" class="remove-line" aria-label="Remove item">×</button></div>';}
function renderRows(){ $("invoiceRows").innerHTML=rows.map(lineMarkup).join(""); bindRows();calc();}
function bindRows(){
 document.querySelectorAll(".invoice-line").forEach(el=>{
  const i=Number(el.dataset.line);
  el.querySelector(".line-desc").addEventListener("input",e=>{rows[i].name=e.target.value;calc();});
  el.querySelector(".line-qty").addEventListener("input",e=>{rows[i].qty=Math.max(1,Math.floor(n(e.target.value)));calc();});
  el.querySelector(".line-amount").addEventListener("input",e=>{rows[i].amount=n(e.target.value);calc();});
  el.querySelector(".remove-line").addEventListener("click",()=>{if(rows.length===1){notice("An invoice must contain at least one item.");return;}rows.splice(i,1);renderRows();});
 });
}
function calc(){
 const sub=rows.reduce((a,r)=>a+n(r.amount),0),fee=n($("deliveryFee")?.value),due=sub+fee;
 $("invoiceSubtotal").textContent=money(sub);$("invoiceTotal").textContent=money(due);
 const preview=$("invoicePreview");if(preview)preview.innerHTML=previewMarkup(sub,fee,due);
}
function previewMarkup(sub,fee,due){
 const items=rows.map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+Math.max(1,Math.floor(n(r.qty)||1))+'</td><td>'+money(r.amount)+'</td></tr>').join("");
 const status=$("paymentStatus")?.value||"unpaid";
 return '<div class="receipt-head"><div><p class="invoice-brand-kicker">APHOTECH SOLAR SOLUTION</p><h2>Aphotech Solar-solution Enterprises</h2><p>Solar products, packages, design & installation</p><p>Phone / WhatsApp: 08165029912</p><p>aphotechsolar.name.ng</p></div><img src="assets/images/logo.png" alt="Aphotech logo"></div><div class="invoice-meta"><div><h1>INVOICE</h1><strong>'+esc($("invoiceNumber").value)+'</strong><p>Issue date: '+esc($("invoiceDate").value)+'</p></div><div><strong>PAYMENT STATUS</strong><p class="invoice-state">'+esc(status.replace("_"," ").toUpperCase())+'</p><p>Payment method: Bank transfer</p></div></div><section class="invoice-customer"><strong>INVOICE TO</strong><h3>'+esc($("customerName").value)+'</h3><p>'+esc($("customerPhone").value)+'</p><p>'+esc($("customerEmail").value)+'</p><p>'+esc($("customerAddress").value)+'</p></section><table class="receipt-lines"><thead><tr><th>Description</th><th>Qty</th><th>Amount</th></tr></thead><tbody>'+items+'</tbody></table><div class="invoice-sums"><p><span>Subtotal</span><strong>'+money(sub)+'</strong></p><p><span>Delivery / logistics</span><strong>'+money(fee)+'</strong></p><p class="invoice-due"><span>AMOUNT DUE</span><strong>'+money(due)+'</strong></p></div><section class="invoice-bank"><h3>Bank transfer details</h3><p><strong>Account name:</strong> Aphotech Solar-solution Enterprises</p><p><strong>Account number:</strong> 6531397045</p><p><strong>Bank:</strong> Moniepoint MFB</p><p>Use the invoice number as your transfer narration and send your payment reference to Aphotech.</p></section><section class="invoice-warning"><h3>IMPORTANT NOTICE</h3><p>'+esc($("warningNote").value)+'</p></section><section class="invoice-terms"><h3>Terms & conditions</h3><p>'+esc($("invoiceTerms").value)+'</p></section><section class="invoice-authorisation"><div><strong>For Aphotech Solar-solution Enterprises</strong><p>Authorised signatory</p><p class="signature-line">________________________</p></div><img class="invoice-company-stamp" src="assets/images/company-stamp.svg" alt="Aphotech company stamp"></section><p class="invoice-thanks">Thank you for choosing Aphotech Solar Solution.</p>';
}
function formMarkup(){
 $("invoiceDocument").innerHTML='<div class="invoice-editor no-print"><div class="invoice-editor-head"><div><p class="invoice-brand-kicker">APHOTECH ADMIN</p><h1>Invoice editor</h1><p>Edit every detail before saving and sending to your customer.</p></div><span class="invoice-admin-tag">ADMIN ONLY</span></div><div class="invoice-form-grid"><label>Invoice number<input id="invoiceNumber" readonly></label><label>Issue date<input id="invoiceDate" type="date"></label><label>Customer name<input id="customerName" required></label><label>Phone / WhatsApp<input id="customerPhone" type="tel"></label><label>Email address<input id="customerEmail" type="email"></label><label>Delivery / site address<input id="customerAddress"></label></div><div class="invoice-edit-section"><div class="invoice-section-head"><h2>Invoice items</h2><button type="button" class="store-btn" id="addInvoiceLine">+ Add item</button></div><div class="invoice-lines-head"><span>Description</span><span>Qty</span><span>Amount (₦)</span><span></span></div><div id="invoiceRows"></div><div class="invoice-form-grid invoice-fees"><label>Delivery / logistics fee (₦)<input id="deliveryFee" type="number" min="0" step="0.01" value="0"></label><label>Payment status<select id="paymentStatus"><option value="unpaid">Awaiting payment</option><option value="partially_paid">Partially paid</option><option value="paid" disabled>Paid — funds verified</option><option value="cancelled">Cancelled</option></select></label></div><div class="invoice-total-editor"><p><span>Subtotal</span><strong id="invoiceSubtotal">₦0</strong></p><p><span>Amount due</span><strong id="invoiceTotal">₦0</strong></p></div></div><div class="invoice-edit-section"><h2>Important warning / protection note</h2><p class="invoice-hint">This note appears clearly on the customer invoice. Edit it to suit this job.</p><textarea id="warningNote" rows="5"></textarea><h2>Terms & conditions</h2><textarea id="invoiceTerms" rows="4"></textarea></div><div class="invoice-actions no-print"><button class="store-btn" id="saveInvoice"><i class="fa-solid fa-floppy-disk"></i> Save invoice</button><button class="store-btn secondary" id="markInvoicePaid">Confirm payment received</button></div><p class="invoice-hint no-print">Save before printing or sending. Only mark as paid after checking the actual Moniepoint account balance/transaction—not a screenshot or SMS.</p></div><div class="invoice-preview-wrap"><div class="invoice-preview-label no-print">CUSTOMER INVOICE PREVIEW</div><section class="store-receipt" id="invoicePreview"></section></div>';
 const date=new Date().toISOString().slice(0,10);$("invoiceDate").value=date;
 $("invoiceNumber").value=invoice?.invoice_number||"APH-"+new Date().getFullYear()+"-"+(sourceType==="quote"?"Q":"O")+String(sourceId).padStart(5,"0");
 $("customerName").value=invoice?.customer_name||source.customer_name||source.full_name||"";
 $("customerPhone").value=invoice?.customer_phone||source.customer_phone||source.phone||"";
 $("customerEmail").value=invoice?.customer_email||source.customer_email||source.email||"";
 $("customerAddress").value=invoice?.customer_address||source.customer_address||source.delivery_address||source.location||"";
 $("deliveryFee").value=invoice?.delivery_fee??0;
 $("paymentStatus").value=invoice?.payment_status||"unpaid";
 $("warningNote").value=invoice?.warning_note||defaultWarning;
 $("invoiceTerms").value=invoice?.terms||defaultTerms;
 rows=Array.isArray(invoice?.line_items)?invoice.line_items.map(x=>({name:x.name||"",qty:x.qty||1,amount:n(x.amount)})):sourceType==="quote"?[{name:source.preferred_package||"Custom solar solution",qty:1,amount:n(source.quoted_amount)}]:(source.items||[]).map(x=>({name:x.product_name,qty:x.quantity||1,amount:n(x.line_total)}));
 if(!rows.length)rows=[{name:"Solar products / services",qty:1,amount:0}];
 renderRows();
 ["invoiceNumber","invoiceDate","customerName","customerPhone","customerEmail","customerAddress","deliveryFee","paymentStatus","warningNote","invoiceTerms"].forEach(id=>$(id).addEventListener("input",calc));
 $("addInvoiceLine").onclick=()=>{rows.push({name:"",qty:1,amount:0});renderRows();};
 $("saveInvoice").onclick=saveInvoice;
 $("markInvoicePaid").textContent=invoice?.payment_status==="paid"?"Payment verified":"Confirm payment received";
 $("markInvoicePaid").disabled=invoice?.payment_status==="paid";
 $("markInvoicePaid").onclick=()=>{if(invoice?.payment_status==="paid"){notice("This invoice is already marked paid.");return;}if(!confirm("Have you personally verified cleared funds in Aphotech's Moniepoint account? Only continue if the money is actually received."))return;paymentApprovalConfirmed=true;$("paymentStatus").value="paid";calc();saveInvoice();};
}
async function saveInvoice(){
 if($("paymentStatus").value==="paid" && invoice?.payment_status!=="paid" && !paymentApprovalConfirmed){notice("Use Confirm payment received and verify the Moniepoint transaction before marking this invoice as paid.","error");return;}
 const name=$("customerName").value.trim();if(!name){notice("Enter the customer's name before saving.","error");return;}
 if(!rows.length||rows.some(r=>!String(r.name).trim())){notice("Every invoice item needs a description.","error");return;}
 if(total()<=0){notice("Invoice total must be greater than zero.","error");return;}
 if(rows.some(r=>n(r.qty)<1)){notice("Quantity must be at least 1.","error");return;}
 const payload={invoice_number:$("invoiceNumber").value.trim(),quote_request_id:sourceType==="quote"?Number(sourceId):null,order_id:sourceType==="order"?Number(sourceId):null,created_by:session.user.id,customer_name:name,customer_phone:$("customerPhone").value.trim(),customer_email:$("customerEmail").value.trim(),customer_address:$("customerAddress").value.trim(),line_items:rows.map(r=>({name:String(r.name).trim(),qty:Math.max(1,Math.floor(n(r.qty))),amount:n(r.amount)})),subtotal:rows.reduce((a,r)=>a+n(r.amount),0),delivery_fee:n($("deliveryFee").value),total_amount:total(),warning_note:$("warningNote").value.trim(),terms:$("invoiceTerms").value.trim(),payment_status:$("paymentStatus").value,updated_at:new Date().toISOString()};
 const button=$("saveInvoice");button.disabled=true;button.textContent="Saving…";
 let result;
 if(invoice?.id)result=await db.from("sales_invoices").update(payload).eq("id",invoice.id).select().single();
 else result=await db.from("sales_invoices").insert(payload).select().single();
 button.disabled=false;button.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Save invoice';
 if(result.error){notice("Could not save invoice: "+result.error.message,"error");return;}
 invoice=result.data;paymentApprovalConfirmed=false;
 $("markInvoicePaid").textContent=invoice.payment_status==="paid"?"Payment verified":"Confirm payment received";$("markInvoicePaid").disabled=invoice.payment_status==="paid";
 if(sourceType==="quote"){
  const {error}=await db.from("quote_requests").update({full_name:name,phone:payload.customer_phone,email:payload.customer_email,location:payload.customer_address,quoted_amount:payload.total_amount,status:"Quoted"}).eq("id",sourceId);
  if(error)notice("Invoice saved, but the original quote details could not be synced: "+error.message,"error");
 }
 notice("Invoice saved successfully. You can now print it and send it to the customer.","success");
 $("invoiceNumber").readOnly=true;calc();
}
async function init(){
 const {data:{session:s}}=await db.auth.getSession();session=s;if(!session){location.replace("auth.html?redirect=admin-invoice.html"+encodeURIComponent(location.search));return;}
 const {data:profile}=await db.from("profiles").select("role").eq("id",session.user.id).maybeSingle();if(profile?.role!=="admin"){document.body.innerHTML="<main style='padding:40px'>Administrator access required.</main>";return;}
 const q=new URLSearchParams(location.search);sourceType=q.get("type")==="order"?"order":"quote";sourceId=q.get("id");if(!sourceId){notice("Missing invoice reference.","error");return;}
 if(sourceType==="quote"){
  const {data,error}=await db.from("quote_requests").select("*").eq("id",sourceId).maybeSingle();if(error||!data){notice("Quote request not found: "+(error?.message||""),"error");return;}source=data;
 }else{
  const {data,error}=await db.from("orders").select("*").eq("id",sourceId).maybeSingle();if(error||!data){notice("Order not found: "+(error?.message||""),"error");return;}source=data;
  const {data:items}=await db.from("order_items").select("*").eq("order_id",sourceId).order("id");source.items=items||[];
 }
 const key=sourceType==="quote"?"quote_request_id":"order_id";
 const {data:existing,error}=await db.from("sales_invoices").select("*").eq(key,sourceId).maybeSingle();
 if(error){notice("Invoice storage is not ready: "+error.message,"error");return;}
 invoice=existing||null;formMarkup();
 $("printInvoice").onclick=()=>{if(!invoice){notice("Save the invoice before printing.","error");return;}window.print();};
 $("sendWhatsApp").onclick=()=>{if(!invoice){notice("Save the invoice before sending.","error");return;}if(!invoice.customer_phone){notice("Customer phone number is missing.","error");return;}const phone=invoice.customer_phone.replace(/\D/g,"").replace(/^0/,"234");const msg="Hello "+invoice.customer_name+", your Aphotech Solar invoice "+invoice.invoice_number+" for "+money(invoice.total_amount)+" is ready. Please see the attached invoice PDF. Account: Aphotech Solar-solution Enterprises, 6531397045, Moniepoint MFB.";window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank");};
 $("emailCustomer").onclick=()=>{if(!invoice){notice("Save the invoice before sending.","error");return;}const msg="Hello "+invoice.customer_name+", your Aphotech Solar invoice "+invoice.invoice_number+" for "+money(invoice.total_amount)+" is ready. Please see the attached invoice PDF. Account: Aphotech Solar-solution Enterprises, 6531397045, Moniepoint MFB.";location.href="mailto:"+encodeURIComponent(invoice.customer_email||"")+"?subject="+encodeURIComponent("Aphotech Solar Invoice "+invoice.invoice_number)+"&body="+encodeURIComponent(msg);};
 $("invoiceActions").hidden=false;
}
document.addEventListener("DOMContentLoaded",()=>{const b=$("printInvoice");if(b)b.onclick=()=>notice("Load and save an invoice first.");init();});
})();