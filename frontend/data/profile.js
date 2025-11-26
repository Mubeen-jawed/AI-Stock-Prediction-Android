// data/profile.js
import { API_URL } from "../config/config";

// const SAMPLE_PROFILE = {
//   emailMasked: "user***@****",
//   uid: "UID: 506397710",
//   region: "StockPort Global",
//   verified: false,
//   tier: "Standard",
//   recentlyUsed: [
//     { id: "watchlist", label: "Watchlist", icon: "eye-outline" },
//     { id: "deposits", label: "Deposits", icon: "card-outline" },
//     { id: "reports", label: "Reports", icon: "document-text-outline" },
//   ],
// };

export async function fetchProfile(token, router) {
  const res = await fetch(`${API_URL}/api/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    router.replace("/login");
    return;
  }

  return await res.json();
}
