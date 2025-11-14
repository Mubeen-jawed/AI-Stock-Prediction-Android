// data/profile.js

const SAMPLE_PROFILE = {
  emailMasked: "user***@****",
  uid: "UID: 506397710",
  region: "StockPort Global",
  verified: false,
  tier: "Standard",
  recentlyUsed: [
    { id: "watchlist", label: "Watchlist", icon: "eye-outline" },
    { id: "deposits", label: "Deposits", icon: "card-outline" },
    { id: "reports", label: "Reports", icon: "document-text-outline" },
  ],
};

export async function fetchProfile() {
  // later: call your API instead
  // const res = await fetch("https://api/profile/me");
  // return await res.json();

  await new Promise((r) => setTimeout(r, 150));
  return SAMPLE_PROFILE;
}
