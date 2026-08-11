
const SUPABASE_URL = "https://xeyuuydojhlhpsdvkfcj.supabase.co";
const SUPABASE_KEY = "sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("quoteForm");
  const status = document.getElementById("quoteStatus");
  const submit = form?.querySelector('button[type="submit"]');
  const params = new URLSearchParams(window.location.search);
  const packageValue = params.get("package");
  const packageField = document.getElementById("quotePackage");

  if (packageValue && packageField) {
    const option = [...packageField.options].find(
      o => o.value.toLowerCase() === packageValue.toLowerCase()
    );
    if (option) packageField.value = option.value;
  }

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    if (status) {
      status.className = "quote-status error";
      status.innerHTML = 'Please <a href="auth.html?redirect=quote.html">log in</a> before submitting a quote request.';
    }
    if (submit) submit.disabled = true;
    return;
  }

  const user = sessionData.session.user;
  const meta = user.user_metadata || {};

  // Prefill known customer information.
  const profileResult = await supabaseClient
    .from("profiles")
    .select("full_name,phone,state,email")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileResult.data || {};
  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el && value && !el.value) el.value = value;
  };

  setValue("quoteName", profile.full_name || meta.full_name || "");
  setValue("quotePhone", profile.phone || meta.phone || "");
  setValue("quoteEmail", profile.email || user.email || "");
  setValue("quoteLocation", profile.state || meta.state || "");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submit) {
      submit.disabled = true;
      submit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }
    if (status) {
      status.className = "quote-status";
      status.textContent = "Saving your request...";
    }

    const loads = [...form.querySelectorAll('input[name="loads"]:checked')]
      .map(input => input.value);

    const payload = {
      user_id: user.id,
      full_name: document.getElementById("quoteName").value.trim(),
      phone: document.getElementById("quotePhone").value.trim(),
      email: document.getElementById("quoteEmail").value.trim() || user.email || null,
      location: document.getElementById("quoteLocation").value.trim(),
      property_type: document.getElementById("quoteType").value,
      preferred_package: document.getElementById("quotePackage").value || null,
      loads,
      message: document.getElementById("quoteMessage").value.trim() || null
    };

    const { error } = await supabaseClient
      .from("quote_requests")
      .insert(payload);

    if (error) {
      if (submit) {
        submit.disabled = false;
        submit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Quote Request';
      }
      if (status) {
        status.className = "quote-status error";
        status.textContent =
          "We couldn't save your request yet. Please make sure the quote_requests database setup has been completed.";
      }
      console.error(error);
      return;
    }

    if (status) {
      status.className = "quote-status success";
      status.innerHTML =
        'Quote request received successfully. <a href="account.html">View your request in My Account</a>.';
    }

    form.reset();
    setValue("quoteEmail", user.email || "");
  });
});
