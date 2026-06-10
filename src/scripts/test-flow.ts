// Using global fetch (available in Node.js 18+)

// We will fetch from our local dev server
const BASE_URL = "http://localhost:3000";

async function runTest() {
  console.log("=== SIMULATING USER FLOW ===");

  // User credentials (Firdaus Nanda)
  const username = "199503122020121001"; // NIP of Firdaus Nanda
  const password = "password123";

  // Step 1: Resolve identifier to email
  console.log("1. Resolving identifier...");
  const resolveRes = await fetch(`${BASE_URL}/api/auth/resolve-identifier`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Origin": BASE_URL,
      "Referer": BASE_URL + "/login"
    },
    body: JSON.stringify({ identifier: username }),
  });
  if (!resolveRes.ok) {
    console.error("Failed to resolve identifier:", await resolveRes.text());
    return;
  }
  const { email } = await resolveRes.json();
  console.log(`Resolved email: ${email}`);

  // Step 2: Sign in (email and password)
  console.log("2. Signing in...");
  const signInRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Origin": BASE_URL,
      "Referer": BASE_URL + "/login"
    },
    body: JSON.stringify({ email, password }),
  });
  if (!signInRes.ok) {
    console.error("Failed to sign in:", await signInRes.text());
    return;
  }
  
  // Extract cookie
  const setCookieHeader = signInRes.headers.get("set-cookie");
  console.log(`Cookies received on login: ${setCookieHeader}`);
  if (!setCookieHeader) {
    console.error("No set-cookie header received!");
    return;
  }

  // Parse session cookie
  const cookie = setCookieHeader.split(";")[0];
  console.log(`Using cookie for subsequent requests: ${cookie}`);

  // Step 3: Fetch activities and RHKs
  console.log("3. Fetching activities...");
  const activitiesRes = await fetch(`${BASE_URL}/api/activity`, {
    headers: { 
      cookie,
      "Origin": BASE_URL,
      "Referer": BASE_URL + "/"
    },
  });
  console.log(`Activities fetch status: ${activitiesRes.status}`);
  if (activitiesRes.ok) {
    const activities = await activitiesRes.json();
    console.log(`Fetched ${activities.length} activities.`);
  }

  console.log("4. Fetching RHKs...");
  const rhksRes = await fetch(`${BASE_URL}/api/rhk`, {
    headers: { 
      cookie,
      "Origin": BASE_URL,
      "Referer": BASE_URL + "/"
    },
  });
  console.log(`RHKs fetch status: ${rhksRes.status}`);
  if (rhksRes.ok) {
    const rhks = await rhksRes.json();
    console.log(`Fetched ${rhks.length} RHKs.`);
  }

  // Step 4: Sign out
  console.log("5. Signing out...");
  const signOutRes = await fetch(`${BASE_URL}/api/auth/sign-out`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      cookie,
      "Origin": BASE_URL,
      "Referer": BASE_URL + "/account"
    },
    body: JSON.stringify({}),
  });
  console.log(`Sign out status: ${signOutRes.status}`);
  const signOutCookieHeader = signOutRes.headers.get("set-cookie");
  console.log(`Cookies received on sign out: ${signOutCookieHeader}`);

  const loggedOutCookie = signOutCookieHeader ? signOutCookieHeader.split(";")[0] : "";

  // Step 5: Fetch activities again (should fail)
  console.log("6. Fetching activities after sign out...");
  const activitiesRes2 = await fetch(`${BASE_URL}/api/activity`, {
    headers: { 
      cookie: loggedOutCookie,
      "Origin": BASE_URL,
      "Referer": BASE_URL + "/"
    },
  });
  console.log(`Activities fetch status (expected 401): ${activitiesRes2.status}`);

  // Step 6: Log back in and fetch again
  console.log("7. Signing in again...");
  const signInRes2 = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Origin": BASE_URL,
      "Referer": BASE_URL + "/login"
    },
    body: JSON.stringify({ email, password }),
  });
  console.log(`Sign in 2 status: ${signInRes2.status}`);
  const setCookieHeader2 = signInRes2.headers.get("set-cookie");
  if (!setCookieHeader2) {
    console.error("No set-cookie header received on second login!");
    return;
  }
  const cookie2 = setCookieHeader2.split(";")[0];

  console.log("8. Fetching activities after second login...");
  const activitiesRes3 = await fetch(`${BASE_URL}/api/activity`, {
    headers: { 
      cookie: cookie2,
      "Origin": BASE_URL,
      "Referer": BASE_URL + "/"
    },
  });
  console.log(`Activities fetch status: ${activitiesRes3.status}`);
  if (activitiesRes3.ok) {
    const activities = await activitiesRes3.json();
    console.log(`Fetched ${activities.length} activities after logging back in.`);
  }
}

runTest();
