// ─── Storage ───────────────────────────────────────────────────────────────────
const SK="earforge-progress",TK="earforge-tut-skip";
export async function loadP(){try{const v=localStorage.getItem(SK);return v?JSON.parse(v):null}catch{return null}}
export async function saveP(d:unknown){try{localStorage.setItem(SK,JSON.stringify(d))}catch{}}
export async function loadSkips(){try{const v=localStorage.getItem(TK);return v?JSON.parse(v):{}}catch{return{}}}
export async function saveSkips(d:unknown){try{localStorage.setItem(TK,JSON.stringify(d))}catch{}}

// ─── Profile Storage ────────────────────────────────────────────────────────────
const PK2="earforge-profiles",UK="earforge-active-user";
export type ProfileData={password:string,xp:number,level:number,streak:number,bestStreak:number,stats:{[k:string]:{ok:number,total:number}}};
export async function loadProfiles():Promise<{[k:string]:ProfileData}>{try{const v=localStorage.getItem(PK2);return v?JSON.parse(v):{}}catch{return{}}}
export async function saveProfiles(d:{[k:string]:ProfileData}){try{localStorage.setItem(PK2,JSON.stringify(d))}catch{}}
export function getActiveUser():string|null{return localStorage.getItem(UK);}
export function setActiveUser(n:string|null){if(n)localStorage.setItem(UK,n);else localStorage.removeItem(UK);}
