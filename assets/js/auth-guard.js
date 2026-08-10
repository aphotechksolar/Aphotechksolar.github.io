/* =====================================================
   APHOTECH SOLAR
   PAGE PROTECTION
===================================================== */

const SUPABASE_URL =
  "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";

const SUPABASE_KEY =
  "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";


const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


async function protectPage() {

  const {
    data
  } =
    await supabaseClient.auth.getSession();


  if (!data.session) {

    window.location.href =
      "auth.html";

  }

}


protectPage();￼Enter
