// data/portfolioApi.js

export async function createPosition(position) {
  // 🔁 Later: replace with real API, e.g.
  // const res = await fetch("https://your-api/portfolio", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(position),
  // });
  // return await res.json();

  // For now, just mock:
  await new Promise((r) => setTimeout(r, 200));
  console.log("MOCK POST /portfolio", position);
  return { success: true };
}
