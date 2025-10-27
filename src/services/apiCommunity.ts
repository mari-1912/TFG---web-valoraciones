import communityData from "../data/community.json";

export async function getCommunityFeed() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(communityData);
    }, 500);
  });
}

//SUSTITUIR MAS ADELANTE POR EL BACKEND REAL
/*EJEMPLO DE BACKEND FUTURO
export async function getCommunityFeed() {
  const res = await fetch("https://api.valorapp.com/community");
  return await res.json();
}*/