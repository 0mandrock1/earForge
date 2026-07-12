import { useRef, useState, useEffect } from "react";
import { INTERVALS, EASY_IV, ALL_DIRS, NOTES, MODES_META, pickOpts, noteAt, randBuf } from "../constants";
import { useT, useLang } from "../i18n";
import { weightedPick, recordResult } from "../srs";
import { Btn, NextBtn, OptGrid, GWrap, useGameFB, useGameKeys } from "../components/common";

export default function IntervalsMode({audio,dispatch,streak,diff}:any){
  const t=useT();const fb=useGameFB(streak,dispatch);
  const {lang}=useLang();
  const allIntervals=INTERVALS[lang as "ua"|"en"]??INTERVALS.ua;
  const ivPool=diff==="easy"?allIntervals.filter(i=>EASY_IV.includes(i.st)):allIntervals;
  const names=ivPool.map(i=>i.name);
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  const lastAnsRef=useRef<string|null>(null);
  const newR=()=>{
    const fp=lastAnsRef.current?ivPool.filter(i=>i.name!==lastAnsRef.current):ivPool;
    const iv=weightedPick("intervals",fp.length>0?fp:ivPool,x=>x.name,()=>randBuf.get());
    const root=NOTES[Math.floor(randBuf.get()*NOTES.length)];
    lastAnsRef.current=iv.name;
    return{ans:iv.name,opts:pickOpts(iv.name,names,nOpts),n1:root+"4",n2:noteAt(root,4,iv.st),dir:ALL_DIRS[Math.floor(randBuf.get()*ALL_DIRS.length)],picked:null};
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
  const goNext=()=>{if(!lkRef.current)return;const n=newR();setR(n);setLk(false);fb.reset();setTimeout(()=>playR(n),100);};// eslint-disable-line
  useGameKeys(()=>playR(rRef.current),goNext);
  const dirLabel=(t.ui as any)[r.dir==="asc"?"dirAsc":r.dir==="desc"?"dirDesc":"dirHarm"];
  const meta=MODES_META[1];
  return(
    <GWrap {...fb} streak={streak}>
      <span style={{fontSize:40}}>🎼</span>
      <h2 className="text-lg font-bold text-white">{t.questions.intervals}</h2>
      <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:"rgba(8,145,178,.25)",color:"#67e8f9"}}>{dirLabel}</div>
      <Btn onClick={()=>playR(r)} label={t.ui.listen} color={meta.btn}/>
      <OptGrid opts={r.opts} picked={r.picked} ans={r.ans} locked={lk} cols={nOpts>4?3:2}
        onPick={(v:string)=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));const ok=v===r.ans;recordResult("intervals",r.ans,ok);ok?fb.onOk():fb.onBad();}}/>
      {lk&&<div className="flex flex-col items-center gap-2">
        <button onClick={()=>playR(r)} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>🔊 {t.ui.listen}</button>
        <NextBtn onClick={goNext} color={meta.btn}/>
      </div>}
    </GWrap>
  );
}
