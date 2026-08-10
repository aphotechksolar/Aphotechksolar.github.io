/* =====================================================
   APHOTECH SOLAR SOLUTION
   LOGIN PROTECTION FOR ALL CUSTOMER PAGES
===================================================== */

const SUPABASE_URL =
  "https://xeyuuydojhlhpsdvkfcj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* Hide the page while the session is being checked. */
document.documentElement.style.visibility = "hidden";

async function protectPage() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
      const loginUrl = new URL("auth.html", window.location.href);
      loginUrl.searchParams.set("redirect", window.location.pathname + window.location.search);
      window.location.replace(loginUrl.href);
      return;
    }

    document.documentElement.style.visibility = "visible";
  } catch (error) {
    console.error("Authentication check failed:", error);
    const loginUrl = new URL("auth.html", window.location.href);
    window.location.replace(loginUrl.href);
  }
}

protectPage();
