import { useState, useCallback, useEffect } from "react";
import { CSS, MODES_META, DIFFS_META, pick } from "../constants";
import { useT } from "../i18n";
import { getWeakKeys } from "../srs";
import NoteIdMode from "./NoteId";
import IntervalsMode from "./Intervals";
import BpmMode from "./Bpm";
import KeyMode from "./Key";
import ChordsMode from "./Chords";

const REGISTRY:any={noteId:NoteIdMode,intervals:IntervalsMode,bpm:BpmMode,key:KeyMode,chords:ChordsMode};
// BPM has no SRS weight (continuous target, see modes/Bpm.tsx), so it never has weak
// items and is left out of the weak-spots mode list automatically below.
const SRS_MODES=["noteId","intervals","key","chords"];
const LS_KEY="earforge-last-session";

function loadLastSession(){try{return JSON.parse(localStorage.getItem(LS_KEY)||"null")}catch{return null}}
function saveLastSession(d:any){try{localStorage.setItem(LS_KEY,JSON.stringify(d))}catch{}}

function SessionSetup({onStart}:{onStart:(cfg:any)=>void}){
  const t=useT();
  const [modes,setModes]=useState<string[]>(MODES_META.map(m=>m.id));
  const [diff,setDiff]=useState("medium");
  const [rounds,setRounds]=useState(15);
  const toggle=(id:string)=>setModes(m=>m.includes(id)?m.filter(x=>x!==id):[...m,id]);
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5 pb-8" style={{animation:"fadeIn .3s"}}>
      <style>{CSS}</style>
      <span style={{fontSize:44}}>📚</span>
      <h2 className="text-xl font-bold text-white">{t.ui.sessionTitle}</h2>
      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
        {MODES_META.map(m=>(
          <button key={m.id} onClick={()=>toggle(m.id)}
            className="px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 transition-opacity"
            style={{backgroundColor:modes.includes(m.id)?"rgba(167,139,250,.3)":"rgba(255,255,255,.06)",
              border:modes.includes(m.id)?"1px solid rgba(167,139,250,.6)":"1px solid rgba(255,255,255,.15)",
              opacity:modes.includes(m.id)?1:.5,color:"white"}}>
            {m.icon} {(t.modes as any)[m.id].name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {DIFFS_META.map(d=>(
          <button key={d.id} onClick={()=>setDiff(d.id)}
            className="px-3 py-2 rounded-xl text-sm font-bold"
            style={{backgroundColor:diff===d.id?"rgba(167,139,250,.3)":"rgba(255,255,255,.06)",
              border:diff===d.id?"1px solid rgba(167,139,250,.6)":"1px solid transparent",color:"white"}}>
            {d.emoji} {(t.diffs as any)[d.id].label}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-purple-300 text-xs">{t.ui.rounds}</span>
        <div className="flex gap-2">
          {[10,15,20,30].map(n=>(
            <button key={n} onClick={()=>setRounds(n)}
              className="w-12 h-12 rounded-xl text-sm font-bold"
              style={{backgroundColor:rounds===n?"rgba(167,139,250,.3)":"rgba(255,255,255,.06)",
                border:rounds===n?"1px solid rgba(167,139,250,.6)":"1px solid transparent",color:"white"}}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <button disabled={modes.length===0} onClick={()=>onStart({modes,diff,rounds,weakOnly:false})}
        className="px-8 py-3 rounded-2xl text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-transform"
        style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",opacity:modes.length===0?.4:1}}>
        {t.ui.startPlay}
      </button>
    </div>
  );
}

function SessionRunner({config,audio,dispatch,streak,onFinish}:any){
  const [idx,setIdx]=useState(0);
  const [modeSeq]=useState<string[]>(()=>Array.from({length:config.rounds},()=>pick(config.modes)));
  const advance=useCallback(()=>{
    if(idx+1>=config.rounds)onFinish();
    else setIdx(i=>i+1);
  },[idx,config.rounds,onFinish]);
  const modeId=modeSeq[idx];
  const C=REGISTRY[modeId];
  return(
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-3 text-center text-purple-300 text-xs font-bold tracking-wide">{idx+1} / {config.rounds}</div>
      <C key={idx} audio={audio} dispatch={dispatch} streak={streak} diff={config.diff} weakOnly={config.weakOnly} onAdvance={advance}/>
    </div>
  );
}

function SessionSummary({stats,xp,startStats,startXp,onDone}:any){
  const t=useT();
  const deltas:any={};
  let dOk=0,dTotal=0;
  for(const m of MODES_META){
    const s0=startStats[m.id]||{ok:0,total:0};
    const s1=stats[m.id]||{ok:0,total:0};
    const ok=s1.ok-s0.ok,total=s1.total-s0.total;
    if(total>0)deltas[m.id]={ok,total,pct:Math.round(ok/total*100)};
    dOk+=ok;dTotal+=total;
  }
  const pct=dTotal>0?Math.round(dOk/dTotal*100):0;
  const xpGained=xp-startXp;
  const last=loadLastSession();
  const diff=last?pct-last.pct:null;
  useEffect(()=>{saveLastSession({pct,xpGained,ts:Date.now()});},[]);// eslint-disable-line
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-3 pb-8" style={{animation:"fadeIn .4s"}}>
      <style>{CSS}</style>
      <span style={{fontSize:48}}>🏁</span>
      <h2 className="text-2xl font-bold text-white">{t.ui.sessionDone}</h2>
      <div className="text-purple-300 text-lg">{pct}% ({dOk}/{dTotal})</div>
      {diff!==null&&(
        <div className="text-sm font-bold" style={{color:diff>=0?"#34d399":"#f87171"}}>
          {diff>=0?"▲":"▼"} {Math.abs(diff)}% {t.ui.vsLastSession}
        </div>
      )}
      <div className="text-amber-400 font-bold">+{xpGained} XP</div>
      <div className="flex flex-col gap-1 w-full max-w-xs mt-2">
        {MODES_META.filter(m=>deltas[m.id]).map(m=>(
          <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{backgroundColor:"rgba(255,255,255,.06)"}}>
            <span className="text-white text-sm">{m.icon} {(t.modes as any)[m.id].name}</span>
            <span className="text-purple-300 text-sm">{deltas[m.id].pct}% ({deltas[m.id].ok}/{deltas[m.id].total})</span>
          </div>
        ))}
      </div>
      <button onClick={onDone} className="mt-2 px-8 py-3 rounded-2xl text-white font-bold text-lg"
        style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}}>{t.ui.close}</button>
    </div>
  );
}

function NoWeakSpots({onDone}:{onDone:()=>void}){
  const t=useT();
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 pb-8" style={{animation:"fadeIn .4s"}}>
      <style>{CSS}</style>
      <span style={{fontSize:48}}>🎉</span>
      <div className="text-white text-lg text-center">{t.ui.noWeakSpots}</div>
      <button onClick={onDone} className="px-8 py-3 rounded-2xl text-white font-bold text-lg"
        style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}}>{t.ui.close}</button>
    </div>
  );
}

// Top-level screen: setup -> running -> summary. Weak-spots mode (weak=true) skips
// setup entirely and auto-configures from whatever currently has SRS miss-weight.
export default function SessionFlow({audio,dispatch,streak,st,weak}:any){
  // Computed synchronously (not in an effect) so SessionRunner never mounts with an
  // empty modes array -- REGISTRY[undefined] would crash the render.
  const [config]=useState<any>(()=>{
    if(!weak)return null;
    const modes=SRS_MODES.filter(m=>getWeakKeys(m).length>0);
    const total=modes.reduce((a,m)=>a+getWeakKeys(m).length,0);
    return{modes,diff:"medium",rounds:Math.min(Math.max(total,1)*2,20),weakOnly:true};
  });
  const [phase,setPhase]=useState<"setup"|"running"|"summary"|"empty">(()=>{
    if(!weak)return "setup";
    return config&&config.modes.length>0?"running":"empty";
  });
  const [cfg,setCfg]=useState<any>(config);
  const [startSnap]=useState(()=>({stats:JSON.parse(JSON.stringify(st.stats)),xp:st.xp}));

  if(phase==="empty")return <NoWeakSpots onDone={()=>dispatch({type:"GO",screen:"menu"})}/>;
  if(phase==="setup")return <SessionSetup onStart={(c)=>{setCfg(c);setPhase("running");}}/>;
  if(phase==="running")return <SessionRunner config={cfg} audio={audio} dispatch={dispatch} streak={streak} onFinish={()=>setPhase("summary")}/>;
  return <SessionSummary stats={st.stats} xp={st.xp} startStats={startSnap.stats} startXp={startSnap.xp} onDone={()=>dispatch({type:"GO",screen:"menu"})}/>;
}
