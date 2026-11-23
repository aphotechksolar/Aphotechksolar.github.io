(() => {
const URL="https://xeyuuydojhlhpsdvkfcj.supabase.co",KEY="sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN",db=supabase.createClient(URL,KEY);
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])),money=n=>"₦"+Number(n||0).toLocaleString("en-NG");
let customer={};
function notice(s){$("invoiceMessage").hidden=!s;$("invoiceMessage").textContent=s;}
async function init(){
 const {data:{session}}=await db.auth.getSession();if(!session){location.replace("auth.html?redirect=admin-invoice.html"+encodeURIComponent(location.search));return;}
 const {data:profile}=await db.from("profiles").select("role").eq("id",session.user.id).maybeSingle();if(profile?.role!=="admin"){document.body.innerHTML="<main style='padding:40px'>Administrator access required.</main>";return;}
 const q=new URLSearchParams(location.search),type=q.get("type")||"order",id=q.get("id");if(!id){notice("Missing invoice reference.");return;}
 let rows=[],total=0,number="",status="Awaiting payment",date=new Date().toLocaleDateString("en-NG"),title="INVOICE";
 if(type==="quote"){
  const {data:r,error}=await db.from("quote_requests").select("*").eq("id",id).maybeSingle();if(error||!r){notice("Quote request not found.");return;}
  customer={name:r.full_name,phone:r.phone,email:r.email||"",address:r.location||"",description:r.preferred_package||"Custom solar solution"};
  total=Number(r.quoted_amount||0);number="APH-QINV-"+String(r.id).padStart(5,"0");status="Awaiting payment";date=new Date(r.created_at).toLocaleDateString("en-NG");
  rows=[{name:customer.description,qty:1,amount:total}];
 }else{
  const {data:o,error}=await db.from("orders").select("*").eq("id",id).maybeSingle();if(error||!o){notice("Order not found.");return;}
  const {data:items}=await db.from("order_items").select("*").eq("order_id",o.id).order("id");
  customer={name:o.customer_name,phone:o.customer_phone,email:o.customer_email||"",address:[o.delivery_address,o.delivery_state].filter(Boolean).join(", ")};
  total=Number(o.total_amount||0);number="APH-INV-"+String(o.receipt_number||o.id);status=o.payment_status||"Awaiting payment";date=new Date(o.created_at).toLocaleDateString("en-NG");
  rows=(items||[]).map(i=>({name:i.product_name,qty:i.quantity,amount:Number(i.line_total||0)}));
 }
 if(!total){notice("Add a quoted amount in the admin dashboard before generating this invoice.");return;}
 $("invoiceDocument").innerHTML='<div class="receipt-head"><div><p style="letter-spacing:.15em;font-weight:800;color:#c3a15b">APHOTECH SOLAR SOLUTION</p><h2 style="margin:8px 0">Aphotech Solar-solution Enterprises</h2><p>Solar products, packages, design & installation</p><p>Phone / WhatsApp: 08165029912</p><p>aphotechsolar.name.ng</p></div><img src="assets/images/logo.png" alt="Aphotech logo"></div><div style="display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;margin:24px 0"><div><h1 style="font-size:2rem">INVOICE</h1><strong>'+esc(number)+'</strong><p>Issue date: '+esc(date)+'</p></div><div><strong>Payment status</strong><p>'+esc(status.toUpperCase())+'</p><p>Payment method: Bank transfer</p></div></div><section style="padding:16px;background:#f6f3eb;border-radius:12px"><strong>INVOICE TO</strong><h3>'+esc(customer.name)+'</h3><p>'+esc(customer.phone)+'</p><p>'+esc(customer.email)+'</p><p>'+esc(customer.address)+'</p></section><table class="receipt-lines"><thead><tr><th>Description</th><th>Qty</th><th>Amount</th></tr></thead><tbody>'+rows.map(i=>'<tr><td>'+esc(i.name)+'</td><td>'+i.qty+'</td><td>'+money(i.amount)+'</td></tr>').join("")+'</tbody></table><div class="store-total final"><span>AMOUNT DUE</span><strong>'+money(total)+'</strong></div><section style="margin-top:24px;padding:17px;border:1px solid #e4e0d5;border-radius:12px"><h3>Bank transfer details</h3><p><strong>Account name:</strong> Aphotech Solar-solution Enterprises</p><p><strong>Account number:</strong> 6531397045</p><p><strong>Bank:</strong> Moniepoint MFB</p><p style="margin-top:10px">Please use the invoice number as your transfer narration and send payment confirmation to Aphotech.</p></section><p style="margin-top:24px;color:#69766f">Thank you for choosing Aphotech Solar Solution. Please contact us if you have any questions about this invoice.</p>';
 $("invoiceActions").hidden=false;
 const msg="Hello "+customer.name+", your Aphotech Solar invoice "+number+" for "+money(total)+" is ready. Please see the attached invoice PDF. Account: Aphotech Solar-solution Enterprises, 6531397045, Moniepoint MFB.";
 $("sendWhatsApp").onclick=()=>{if(!customer.phone){notice("Customer phone number is missing.");return;}const phone=customer.phone.replace(/\D/g,"").replace(/^0/,"234");window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank");};
 $("emailCustomer").href="mailto:"+encodeURIComponent(customer.email)+"?subject="+encodeURIComponent("Aphotech Solar Invoice "+number)+"&body="+encodeURIComponent(msg);
}
$("printInvoice").addEventListener("click",()=>window.print());init();
})();