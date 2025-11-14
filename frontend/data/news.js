// data/news.js

const SAMPLE_NEWS = [
  {
    id: 1,
    title: "[Year-end edition] Daily Treasure Hunt: The Ultimate Gold Mine",
    date: "Nov 3, 2025",
    status: "Ongoing",
    image: "https://i.ibb.co/2kPzdvT/goldmine.jpg", // replace with your own placeholder
  },
  {
    id: 2,
    title: "Hot Tokens Trading Arena: Trade to share up to 95,000 USDT!",
    date: "Oct 30, 2025",
    status: "Ongoing",
    image: "https://i.ibb.co/hBZ7b7g/trophy.jpg",
  },
  {
    id: 3,
    title: "RLUSD Holder Fiesta: Grab a share of the 29,000 USDT Prize Pool",
    date: "Nov 12, 2025",
    status: "Ongoing",
    image: "https://i.ibb.co/tb3dNFb/ripple.jpg",
  },
  {
    id: 4,
    title: "[Year-end edition] Daily Treasure Hunt: The Ultimate Gold Mine",
    date: "Nov 3, 2025",
    status: "Ongoing",
    image: "https://i.ibb.co/2kPzdvT/goldmine.jpg", // replace with your own placeholder
  },
  {
    id: 5,
    title: "Hot Tokens Trading Arena: Trade to share up to 95,000 USDT!",
    date: "Oct 30, 2025",
    status: "Ongoing",
    image: "https://i.ibb.co/hBZ7b7g/trophy.jpg",
  },
  {
    id: 6,
    title: "RLUSD Holder Fiesta: Grab a share of the 29,000 USDT Prize Pool",
    date: "Nov 12, 2025",
    status: "Ongoing",
    image: "https://i.ibb.co/tb3dNFb/ripple.jpg",
  },
];

export async function fetchNews({ tab = "Latest Activities" } = {}) {
  // Later: call your backend:
  // const res = await fetch(`https://api/news?tab=${tab}`);
  // return await res.json();

  await new Promise((r) => setTimeout(r, 150)); // mock latency
  return SAMPLE_NEWS;
}
