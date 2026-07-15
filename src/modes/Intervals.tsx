import { useRef, useState, useEffect } from "react";
import { INTERVALS, EASY_IV, ALL_DIRS, NOTES, MODES_META, IV_MNEMONIC, pickOpts, noteAt, randBuf } from "../constants";
import { useT, useLang } from "../i18n";
import { weightedPick, recordResult, getWeakKeys } from "../srs";
import { Btn, NextBtn, OptGrid, GWrap, useGameFB, useGameKeys } from "../components/common";

export default function IntervalsMode({audio,dispatch,streak,diff,onAdvance,weakOnly}:any){
  const t=useT();const fb=useGameFB(streak,dispatch,"intervals");
  const {lang}=useLang();
  const allIntervals=INTERVALS[lang as "ua"|"en"]??INTERVALS.ua;
  const ivPool=diff==="easy"?allIntervals.filter(i=>EASY_IV.includes(i.st)):allIntervals;
  const names=ivPool.map(i=>i.name);
  const fullByName=Object.fromEntries(allIntervals.map(i=>[i.name,i.full]));
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  const lastAnsRef=useRef<string|null>(null);
  const [showRef,setShowRef]=useState(false);
  const newR=()=>{
    const weak=weakOnly?getWeakKeys("intervals"):null;
    const base=weak?ivPool.filter(i=>weak.includes(i.name)):ivPool;
    const src=base.length>0?base:ivPool;
    const fp=lastAnsRef.current?src.filter(i=>i.name!==lastAnsRef.current):src;
    const iv=weightedPick("intervals",fp.length>0?fp:src,x=>x.name,()=>randBuf.get());
    const root=NOTES[Math.floor(randBuf.get()*NOTES.length)];
    lastAnsRef.current=iv.name;
    return{ans:iv.name,st:iv.st,opts:pickOpts(iv.name,names,nOpts),n1:root+"4",n2:noteAt(root,4,iv.st),dir:ALL_DIRS[Math.floor(randBuf.get()*ALL_DIRS.length)],picked:null};
  };
  const [r,setR]=useState(newR);const [lk,setLk]=useState(false);
  const rRef=useRef(r);rRef.current=r;
  const lkRef=useRef(lk);lkRef.current=lk;
  const playR=(round:typeof r)=>{
    if(round.dir==="harm")audio.playHarmonic(round.n1,round.n2);
    else if(round.dir==="desc")audio.playInterval(round.n2,round.n1);
    else audio.playInterval(round.n1,round.n2);
  };
  const mountRef=useRef(true);
  useEffect(()=>{
    if(mountRef.current){mountRef.current=false;playR(rRef.current);return;}
    const n=newR();setR(n);setLk(false);fb.reset();setTimeout(()=>playR(n),100);
  },[lang]);// eslint-disable-line
  const goNext=()=>{
    if(!lkRef.current)return;
    if(onAdvance){onAdvance();return;}
    const n=newR();setR(n);setLk(false);fb.reset();setTimeout(()=>playR(n),100);
  };// eslint-disable-line
  useGameKeys(()=>playR(rRef.current),goNext);
  const dirLabel=(t.ui as any)[r.dir==="asc"?"dirAsc":r.dir==="desc"?"dirDesc":"dirHarm"];
  const meta=MODES_META[1];
  const wrong=lk&&r.picked!==r.ans;
  const hint=(IV_MNEMONIC as any)[lang]?.[r.st];
  return(
    <GWrap {...fb} streak={streak}>
      <span style={{fontSize:40}}>🎼</span>
      <h2 className="text-lg font-bold text-white">{t.questions.intervals}</h2>
      <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:"rgba(8,145,178,.25)",color:"#67e8f9"}}>{dirLabel}</div>
      <Btn onClick={()=>playR(r)} label={t.ui.listen} color={meta.btn}/>
      <OptGrid opts={r.opts} labels={r.opts.map((o:string)=>fullByName[o]??o)} picked={r.picked} ans={r.ans} locked={lk} cols={nOpts>4?3:2}
        onPick={(v:string)=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));const ok=v===r.ans;recordResult("intervals",r.ans,ok);ok?fb.onOk():fb.onBad();}}/>
      {wrong&&hint&&<div className="text-xs text-center px-6 max-w-xs" style={{color:"rgba(255,255,255,.55)",animation:"fadeIn .3s"}}>💡 {hint}</div>}
      <button onClick={()=>setShowRef(v=>!v)} className="text-xs font-bold px-3 py-1.5 rounded-lg"
        style={{backgroundColor:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.3)",color:"#c4b5fd"}}>
        {t.ui.ivRefToggle} {showRef?"▲":"▼"}
      </button>
      {showRef&&(
        <div className="w-full max-w-xs rounded-xl p-3 flex flex-col gap-1.5" style={{backgroundColor:"rgba(255,255,255,.06)",animation:"slideUp .25s ease-out"}}>
          <div className="grid grid-cols-[1fr_2fr_auto] gap-2 text-[10px] font-bold uppercase tracking-wide" style={{color:"rgba(255,255,255,.4)"}}>
            <span>{t.ui.ivRefShort}</span><span>{t.ui.ivRefFullCol}</span><span>{t.ui.ivRefSemi}</span>
          </div>
          {ivPool.map(iv=>(
            <div key={iv.name} className="grid grid-cols-[1fr_2fr_auto] gap-2 text-xs" style={{color:"rgba(255,255,255,.85)"}}>
              <span className="font-bold" style={{color:"#67e8f9"}}>{iv.name}</span>
              <span>{iv.full}</span>
              <span style={{color:"rgba(255,255,255,.5)"}}>{iv.st}</span>
            </div>
          ))}
        </div>
      )}
      {lk&&<div className="flex flex-col items-center gap-2">
        <button onClick={()=>playR(r)} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>🔊 {t.ui.listen}</button>
        <NextBtn onClick={goNext} color={meta.btn}/>
      </div>}
    </GWrap>
  );
}
