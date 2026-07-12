import { getMult, XP_PER_LEVEL } from "./constants";
import { setActiveUser } from "./storage";

// ─── Reducer ───────────────────────────────────────────────────────────────────
export const initState={screen:"login",nickname:"",xp:0,level:1,streak:0,bestStreak:0,
  stats:{noteId:{ok:0,total:0},intervals:{ok:0,total:0},bpm:{ok:0,total:0},key:{ok:0,total:0},chords:{ok:0,total:0}},
  loaded:false,lvlUp:false};

export function reducer(st:typeof initState,a:any){
  switch(a.type){
    case "GO":return{...st,screen:a.screen};
    case "LOAD":return{...a.data,screen:"menu",loaded:true,lvlUp:false};
    case "LOADED":return{...st,loaded:true};
    case "CORRECT":{
      const m=getMult(st.streak),xp=st.xp+10*m,ns=st.streak+1,nl=Math.floor(xp/XP_PER_LEVEL)+1;
      const mode=st.screen,ms=(st.stats as any)[mode]||{ok:0,total:0};
      return{...st,xp,level:nl,streak:ns,bestStreak:Math.max(st.bestStreak,ns),
        stats:{...st.stats,[mode]:{ok:ms.ok+1,total:ms.total+1}},lvlUp:nl>st.level};
    }
    case "WRONG":{const mode=st.screen,ms=(st.stats as any)[mode]||{ok:0,total:0};
      return{...st,streak:0,stats:{...st.stats,[mode]:{ok:ms.ok,total:ms.total+1}},lvlUp:false};}
    case "CLR_LVL":return{...st,lvlUp:false};
    case "SET_USER":return{...st,...(a.data||{}),nickname:a.nickname,screen:"menu",loaded:true,lvlUp:false};
    case "LOGOUT":{setActiveUser(null);return{...initState,screen:"login",loaded:true};}
    default:return st;
  }
}
