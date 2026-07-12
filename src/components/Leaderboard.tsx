import { useState, useEffect } from "react";
import { MODES_META } from "../constants";
import { useT } from "../i18n";
import { loadProfiles } from "../storage";

type LBEntry={nick:string,pct:number,ok:number,total:number,best:number};
type LBData={[mode:string]:LBEntry[]};

async function fetchLeaderboard():Promise<LBData>{
  const r=await fetch(import.meta.env.BASE_URL+"api/leaderboard");
  if(!r.ok)throw new Error("api_unavailable");
  return r.json();
}

async function localLeaderboard():Promise<LBData>{
  const profiles=await loadProfiles();
  const result:LBData={};
  for(const m of MODES_META){
    result[m.id]=Object.entries(profiles)
      .map(([nick,p])=>{const s=(p.stats||{})[m.id]||{ok:0,total:0};return{nick,ok:s.ok,total:s.total,pct:s.total>0?Math.round(s.ok/s.total*100):0,best:p.bestStreak||0};})
      .filter(e=>e.total>0)
      .sort((a,b)=>b.pct-a.pct||b.best-a.best);
  }
  return result;
}

export default function LeaderboardModal({onClose,currentNick}:{onClose:()=>void,currentNick?:string}){
  const t=useT();
  const [data,setData]=useState<LBData|null>(null);
  const [isRemote,setIsRemote]=useState(false);
  useEffect(()=>{
    fetchLeaderboard()
      .then(d=>{setData(d);setIsRemote(true);})
      .catch(()=>localLeaderboard().then(d=>{setData(d);setIsRemote(false);}));
  },[]);
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor:"rgba(0,0,0,.75)"}}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-5 flex flex-col gap-4"
        style={{backgroundColor:"#1e1b4b",border:"1px solid rgba(167,139,250,.3)",maxHeight:"80vh",overflowY:"auto"}}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🏆 {t.ui.leaderboard}</h2>
            {data&&<span className="text-xs" style={{color:isRemote?"#34d399":"rgba(255,255,255,.3)"}}>{isRemote?"🌐 global":"📱 local"}</span>}
          </div>
          <button onClick={onClose} className="text-purple-300 hover:text-white text-lg px-2 py-1">✕</button>
        </div>
        {!data&&<div className="text-purple-400 text-sm text-center py-4">...</div>}
        {data&&MODES_META.map(m=>{
          const entries=(data[m.id]||[]).slice(0,5);
          const tMode=(t.modes as any)[m.id];
          return(
            <div key={m.id}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{fontSize:18}}>{m.icon}</span>
                <span className="text-white font-bold text-sm">{tMode.name}</span>
              </div>
              {entries.length===0
                ?<div className="text-purple-400 text-xs pl-1">{t.ui.noEntries}</div>
                :<div className="flex flex-col gap-1">
                  {entries.map((e,i)=>(
                    <div key={e.nick} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{backgroundColor:i===0?"rgba(251,191,36,.12)":e.nick===currentNick?"rgba(167,139,250,.15)":"rgba(255,255,255,.06)"}}>
                      <span className="font-bold text-sm w-5" style={{color:i===0?"#fbbf24":i===1?"#d1d5db":"#a78bfa"}}>{i+1}.</span>
                      <span className="text-sm flex-1 truncate" style={{color:e.nick===currentNick?"#c4b5fd":"white"}}>{e.nick}{e.nick===currentNick?" ◀":""}</span>
                      <span className="text-green-400 text-xs font-bold">{e.pct}%</span>
                      <span className="text-xs" style={{color:"#fbbf24"}}>🔥{e.best}</span>
                      <span className="text-purple-400 text-xs">{e.ok}/{e.total}</span>
                    </div>
                  ))}
                </div>
              }
            </div>
          );
        })}
        <button onClick={onClose} className="mt-1 w-full py-2.5 rounded-xl text-white font-bold text-sm"
          style={{backgroundColor:"rgba(255,255,255,.1)"}}>{t.ui.close}</button>
      </div>
    </div>
  );
}
