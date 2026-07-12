import { useReducer, useRef, useState, useEffect } from "react";
import { LangCtx, Lang } from "./i18n";
import { useAudio } from "./audio";
import { initState, reducer } from "./reducer";
import { getActiveUser, setActiveUser, loadProfiles, saveP, saveProfiles } from "./storage";
import { Header, LevelUp } from "./components/common";
import LoginScreen from "./components/Login";
import Menu from "./components/Menu";
import ModeScreen from "./modes/ModeScreen";
import { randBuf } from "./constants";

export default function App(){
  const [lang,setLang]=useState<Lang>(()=>(localStorage.getItem("earforge-lang") as Lang)||"ua");
  const [st,dispatch]=useReducer(reducer,initState);
  const audio=useAudio();
  const prevRef=useRef<string|null>(null);

  // Persist language choice
  useEffect(()=>{localStorage.setItem("earforge-lang",lang);},[lang]);

  // Load saved progress & pre-fill random buffer
  useEffect(()=>{
    randBuf.fill();
    const activeUser=getActiveUser();
    if(!activeUser){dispatch({type:"LOADED"});return;}
    loadProfiles().then(profiles=>{
      const p=profiles[activeUser];
      if(p){const{password:_,...data}=p;dispatch({type:"SET_USER",nickname:activeUser,data});}
      else{setActiveUser(null);dispatch({type:"LOADED"});}
    });
  },[]);

  // Save progress on change (profile-based)
  useEffect(()=>{
    if(!st.loaded||!st.nickname)return;
    const{screen,loaded,lvlUp,nickname,...save}=st;
    const k=JSON.stringify(save);
    if(prevRef.current!==k){
      prevRef.current=k;
      saveP(save);
      loadProfiles().then(profiles=>{
        const password=profiles[nickname]?.password||"";
        profiles[nickname]={...profiles[nickname],password,...save};
        saveProfiles(profiles);
        // Submit to global leaderboard (fire and forget — fails silently if offline).
        // password is sent so the server can enforce it if this nick set one; nicks
        // registered with no password stay open (see server/leaderboard.js).
        fetch(import.meta.env.BASE_URL+"api/leaderboard",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({nick:nickname,stats:save.stats,bestStreak:save.bestStreak,password}),
        }).catch(()=>{});
      });
    }
  },[st]);

  const isLogin=!st.loaded||st.screen==="login"||!st.nickname;
  let content;
  if(!st.loaded)content=null;
  else if(isLogin)content=<LoginScreen dispatch={dispatch}/>;
  else if(st.screen==="menu")content=<Menu dispatch={dispatch} stats={st.stats} bestStreak={st.bestStreak} nickname={st.nickname}/>;
  else content=<ModeScreen modeId={st.screen} audio={audio} dispatch={dispatch} streak={st.streak}/>;

  return(
    <LangCtx.Provider value={{lang,setLang}}>
      <div className="app-root flex flex-col" style={{background:"linear-gradient(135deg,#1e1b4b 0%,#0f0a2e 50%,#1a0a2e 100%)"}}>
        {!isLogin&&<Header state={st} dispatch={dispatch}/>}
        {content}
        {st.lvlUp&&<LevelUp level={st.level} onDone={()=>dispatch({type:"CLR_LVL"})}/>}
      </div>
    </LangCtx.Provider>
  );
}
