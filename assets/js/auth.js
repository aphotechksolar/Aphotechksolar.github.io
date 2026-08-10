/* =====================================================
   APHOTECH SOLAR
   SUPABASE AUTHENTICATION
===================================================== */


/* =====================================================
   SUPABASE CONFIGURATION
===================================================== */

const SUPABASE_URL =
  "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";https://xeyuuydojhlhpsdvkfcj.supabase.co

const SUPABASE_KEY =
  "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";sb_publishable_3AgCAUJYvcN4w7hSC3bS9Q_eR2VsIWN


const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =====================================================
   SWITCH TO LOGIN
===================================================== */

function showLogin() {

  document
    .getElementById("loginForm")
    .classList.remove("hidden");

  document
    .getElementById("signupForm")
    .classList.add("hidden");

}


/* =====================================================
   SWITCH TO SIGNUP
===================================================== */

function showSignup() {

  document
    .getElementById("signupForm")
    .classList.remove("hidden");

  document
    .getElementById("loginForm")
    .classList.add("hidden");

}


/* =====================================================
   LOGIN
===================================================== */

async function loginUser() {

  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("loginPassword")
      .value;


  const message =
    document.getElementById("loginMessage");


  message.className = "auth-message";

  message.textContent = "Logging in...";


  if (!email || !password) {

    message.classList.add("error");

    message.textContent =
      "Please enter your email and password.";

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient.auth.signInWithPassword({

      email: email,

      password: password

    });


  if (error) {

    message.classList.add("error");

    message.textContent =
      "Login failed. Please check your details.";

    console.error(error);

    return;

  }


  message.classList.add("success");

  message.textContent =
    "Login successful. Opening Aphotech...";


  setTimeout(function() {

    window.location.href =
      "packages.html";

  }, 700);

}


/* =====================================================
   SIGN UP
===================================================== */

async function signupUser() {

  const name =
    document
      .getElementById("signupName")
      .value
      .trim();


  const phone =
    document
      .getElementById("signupPhone")
      .value
      .trim();


  const state =
    document
      .getElementById("signupState")
      .value
      .trim();


  const email =
    document
      .getElementById("signupEmail")
      .value
      .trim();


  const password =
    document
      .getElementById("signupPassword")
      .value;


  const consent =
    document
      .getElementById("privacyConsent")
      .checked;


  const message =
    document.getElementById("signupMessage");


  message.className = "auth-message";

  message.textContent = "";


  /* VALIDATION */

  if (!name || !email || !password) {

    message.classList.add("error");

    message.textContent =
      "Please complete all required fields.";

    return;

  }


  if (password.length < 6) {

    message.classList.add("error");

    message.textContent =
      "Password must contain at least 6 characters.";

    return;

  }


  if (!consent) {

    message.classList.add("error");

    message.textContent =
      "Please agree to the privacy notice.";

    return;

  }


  message.textContent =
    "Creating your account...";


  /* CREATE ACCOUNT */

  const {
    data,
    error
  } =
    await supabaseClient.auth.signUp({

      email: email,

      password: password,

      options: {

        data: {

          full_name: name,

          phone: phone,

          state: state

        }

      }

    });


  if (error) {

    message.classList.add("error");

    message.textContent =
      error.message;

    console.error(error);

    return;

  }


  /* SUCCESS */

  message.classList.add("success");


  /*
    If email confirmation is enabled,
    Supabase will ask the customer
    to verify their email.
  */

  if (data.session) {

    message.textContent =
      "Account created successfully.";

    setTimeout(function() {

      window.location.href =
        "packages.html";

    }, 1000);

  } else {

    message.textContent =
      "Account created. Please check your email to verify your account.";

  }

}


/* =====================================================
   CHECK EXISTING SESSION
===================================================== */

async function checkExistingLogin() {

  const {
    data
  } =
    await supabaseClient.auth.getSession();


  if (data.session) {

    window.location.href =
      "packages.html";

  }

}


/* Run on auth page */

checkExistingLogin();
