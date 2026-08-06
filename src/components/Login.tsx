import { useState } from "react";
import { CSS } from "../constants";
import { useT } from "../i18n";
import { loadProfiles, saveProfiles, setActiveUser, loadP, ProfileData } from "../storage";
import { LangToggle } from "./common";

// Password is optional by design: leaving it blank keeps the nickname open forever
// (anyone can post progress under it — fine for a low-stakes leaderboard). Setting one
// locks future submissions to that nick behind it (enforced server-side, see server/leaderboard.js).
export default function LoginScreen({dispatch}:{dispatch:React.Dispatch<any>}){
  const t=useT();
  const [nick,setNick]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const onLogin=async()=>{
    const n=nick.trim();
    if(!n){setErr(t.ui.nicknameRequired);return;}
    const profiles=await loadProfiles();
    if(profiles[n]){
      if(profiles[n].password&&profiles[n].password!==pass){setErr(t.ui.wrongPassword);return;}
      setActiveUser(n);
      const{password:_,...data}=profiles[n];
      dispatch({type:"SET_USER",nickname:n,data});
    } else {
      const old=await loadP();
      const defaults={xp:0,level:1,streak:0,bestStreak:0,stats:{noteId:{ok:0,total:0},intervals:{ok:0,total:0},bpm:{ok:0,total:0},key:{ok:0,total:0},chords:{ok:0,total:0},scaleId:{ok:0,total:0}}};
      const newProf:ProfileData={password:pass,...defaults,...(old||{})};
      profiles[n]=newProf;
      await saveProfiles(profiles);
      setActiveUser(n);
      const{password:_,...data}=newProf;
      dispatch({type:"SET_USER",nickname:n,data});
    }
  };
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5 pb-8 relative" style={{animation:"fadeIn .4s"}}>
      <style>{CSS}</style>
      <div className="absolute top-4 right-4"><LangToggle/></div>
      <span style={{fontSize:56}}>🎧</span>
      <h1 className="text-3xl font-bold text-white tracking-tight">EarForge</h1>
      <div className="w-full max-w-xs flex flex-col gap-3">
        <input value={nick} onChange={e=>{setNick(e.target.value);setErr("");}}
          placeholder={t.ui.enterNickname} autoCapitalize="none" autoCorrect="off"
          className="w-full py-3 px-4 rounded-xl text-white font-bold text-center outline-none"
          style={{backgroundColor:"rgba(255,255,255,.1)",border:"2px solid rgba(239,68,68,.4)",fontSize:16}}
          onKeyDown={e=>{if(e.key==="Enter")onLogin();}}
        />
        <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}}
          placeholder={t.ui.enterPassword}
          className="w-full py-3 px-4 rounded-xl text-white text-center outline-none"
          style={{backgroundColor:"rgba(255,255,255,.08)",border:"2px solid rgba(255,255,255,.1)",fontSize:16}}
          onKeyDown={e=>{if(e.key==="Enter")onLogin();}}
        />
        <div className="text-xs text-center" style={{color:"rgba(255,255,255,.35)"}}>{t.ui.passwordHint}</div>
        {err&&<div className="text-red-400 text-sm text-center" style={{animation:"slideUp .3s ease-out"}}>{err}</div>}
        <button onClick={onLogin}
          className="w-full py-3 rounded-xl text-white font-bold text-base hover:scale-105 active:scale-95 transition-transform"
          style={{background:"linear-gradient(135deg,#dc2626,#991b1b)"}}>
          {t.ui.loginBtn}
        </button>
      </div>
    </div>
  );
}
