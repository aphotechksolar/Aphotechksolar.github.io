/* =====================================================
   APHOTECH SOLAR SOLUTION
   SUPABASE AUTHENTICATION
===================================================== */

const SUPABASE_URL =
  "https://xeyuuydojhlhpsdvkfcj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

function getRedirectTarget() {
  const value = new URLSearchParams(window.location.search).get("redirect");

  if (!value) return "index.html";

  /* Only allow same-site paths. */
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  if (!value.includes("://") && !value.startsWith("\\")) return value;

  return "index.html";
}

function goAfterLogin() {
  window.location.replace(getRedirectTarget());
}

function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("signupForm").classList.add("hidden");
}

function showSignup() {
  document.getElementById("signupForm").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
}

async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const message = document.getElementById("loginMessage");

  message.className = "auth-message";

  if (!email || !password) {
    message.classList.add("error");
    message.textContent = "Please enter your email and password.";
    return;
  }

  message.textContent = "Logging in...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.classList.add("error");
    message.textContent =
      error.message || "Login failed. Please check your details.";
    console.error(error);
    return;
  }

  if (!data.session) {
    message.classList.add("error");
    message.textContent =
      "Login did not create an active session. Please try again.";
    return;
  }

  message.classList.add("success");
  message.textContent = "Login successful. Opening Aphotech...";

  setTimeout(goAfterLogin, 500);
}

async function signupUser() {
  const name = document.getElementById("signupName").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const state = document.getElementById("signupState").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const consent = document.getElementById("privacyConsent").checked;
  const message = document.getElementById("signupMessage");

  message.className = "auth-message";

  if (!name || !phone || !state || !email || !password) {
    message.classList.add("error");
    message.textContent =
      "Please complete your name, phone, state, email and password.";
    return;
  }

  if (password.length < 6) {
    message.classList.add("error");
    message.textContent = "Password must contain at least 6 characters.";
    return;
  }

  if (!consent) {
    message.classList.add("error");
    message.textContent = "Please agree to the privacy notice.";
    return;
  }

  message.textContent = "Creating your account...";

  const consentAt = new Date().toISOString();

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone,
        state,
        privacy_consent: true,
        privacy_consent_at: consentAt
      }
    }
  });

  if (error) {
    message.classList.add("error");

    if (error.message && error.message.toLowerCase().includes("rate limit")) {
      message.textContent =
        "Too many signup emails were requested. Please wait a while and try again.";
    } else {
      message.textContent = error.message || "Unable to create your account.";
    }

    console.error(error);
    return;
  }

  /*
    The database trigger creates public.profiles automatically.
    If a session is immediately available, sync the profile as a
    second safety measure. The SQL migration included in this ZIP
    adds the required own-profile INSERT policy.
  */
  if (data.user) {
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          full_name: name,
          phone,
          state,
          email,
          privacy_consent: true,
          privacy_consent_at: consentAt
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.warn("Profile sync warning:", profileError);
    }
  }

  if (data.session) {
    message.classList.add("success");
    message.textContent =
      "Account created successfully. Opening Aphotech...";
    setTimeout(goAfterLogin, 700);
    return;
  }

  /*
    If email confirmation is enabled, Supabase creates the account
    but does not return a session. This message is intentionally
    neutral so the site works whether confirmation is enabled or off.
  */
  message.classList.add("success");
  message.textContent =
    "Account created. Please check your email if confirmation is required, then log in.";
}

async function checkExistingLogin() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    goAfterLogin();
  }
}

checkExistingLogin();
