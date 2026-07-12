import { useState } from "react";
import { CSS, MODES_META } from "../constants";
import { useT } from "../i18n";
import LeaderboardModal from "./Leaderboard";

export default function Menu({dispatch,stats,bestStreak,nickname}:any){
  const t=useT();
  const [showLB,setShowLB]=useState(false);
  const total=Object.values(stats).reduce((a:any,s:any)=>a+s.total,0) as number;
  const ok=Object.values(stats).reduce((a:any,s:any)=>a+s.ok,0) as number;
  const pct=total>0?Math.round(ok/total*100):0;
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 pb-8" style={{animation:"fadeIn .4s"}}>
      <style>{CSS}</style>
      {showLB&&<LeaderboardModal onClose={()=>setShowLB(false)} currentNick={nickname}/>}
      {nickname&&<div className="text-purple-300 text-sm font-bold">👤 {nickname}</div>}
      <h2 className="text-2xl font-bold text-white mb-1">{t.ui.chooseMode}</h2>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {MODES_META.map((m,idx)=>{
          const s=(stats[m.id]||{ok:0,total:0}) as {ok:number,total:number};
          const mp=s.total>0?Math.round(s.ok/s.total*100):0;
          const tMode=(t.modes as any)[m.id];
          return(
            <button key={m.id} onClick={()=>dispatch({type:"GO",screen:m.id})}
              className={`rounded-2xl p-4 flex flex-col items-center gap-1 bg-gradient-to-br ${m.gr} hover:scale-105 active:scale-95 transition-transform shadow-lg`}
              style={{animation:`slideUp ${.3+idx*.08}s ease-out`}}>
              <span style={{fontSize:36}}>{m.icon}</span>
              <span className="text-white font-bold text-sm">{tMode.name}</span>
              <span className="text-white text-xs" style={{opacity:.7}}>{tMode.desc}</span>
              {s.total>0&&(
                <div className="w-full mt-1">
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{backgroundColor:"rgba(255,255,255,.2)"}}>
                    <div className="h-full rounded-full" style={{width:`${mp}%`,backgroundColor:"rgba(255,255,255,.7)",transition:"width .5s"}}/>
                  </div>
                  <span className="text-white text-xs mt-0.5 block" style={{opacity:.6}}>{mp}% · {s.ok}/{s.total}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {total>0&&(
        <div className="mt-2 text-center" style={{animation:"fadeIn .5s"}}>
          <div className="text-purple-300 text-sm">{t.ui.total}: {ok}/{total} ({pct}%)</div>
          <div className="text-purple-400 text-xs mt-1">{t.ui.bestStreak}: {bestStreak}</div>
        </div>
      )}
      <div className="flex gap-2 mt-1">
        <button onClick={()=>setShowLB(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-purple-200 hover:scale-105 active:scale-95 transition-transform"
          style={{backgroundColor:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.3)"}}>
          🏆 {t.ui.leaderboard}
        </button>
        <button onClick={()=>dispatch({type:"LOGOUT"})}
          className="px-4 py-2 rounded-xl text-sm font-bold text-red-300 hover:scale-105 active:scale-95 transition-transform"
          style={{backgroundColor:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.2)"}}>
          {t.ui.logout}
        </button>
      </div>
    </div>
  );
}
