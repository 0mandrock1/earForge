import { useRef, useState, useCallback, useEffect } from "react";
import { NOTES, SCALES, MODES_META, pickOpts, noteAt, randBuf } from "../constants";
import { useT, useLang } from "../i18n";
import { weightedPick, recordResult, getWeakKeys } from "../srs";
import { Btn, NextBtn, OptGrid, GWrap, useGameFB, useGameKeys } from "../components/common";

// 6th mode — identify a scale type by ear (major / natural minor / harmonic minor /
// dorian / mixolydian). A natural extension of Key/Chords: the scale is played back
// note-by-note (ascending) through the existing progression scheduler by handing it a
// sequence of single-note "chords". Tier slices mirror Chords: easy=3, medium=4, hard=5.
function newScaleRound(diff:string,lang:"ua"|"en",exclude:string|null,weakOnly?:boolean){
  const all=SCALES[lang]??SCALES.ua;
  const count=diff==="easy"?3:diff==="medium"?4:5;
  const pool=all.slice(0,count);
  const names=pool.map(s=>s.name);
  const weak=weakOnly?getWeakKeys("scaleId"):null;
  const base=weak?pool.filter(s=>weak.includes(s.name)):pool;
  const src=base.length>0?base:pool;
  const fp=exclude?src.filter(s=>s.name!==exclude):src;
  const q=weightedPick("scaleId",fp.length>0?fp:src,s=>s.name,()=>randBuf.get());
  const root=NOTES[Math.floor(randBuf.get()*NOTES.length)];
  // Ascending single-note melody: each step is a one-note "chord" for playProgression.
  const seq=q.iv.map(st=>[noteAt(root,4,st)]);
  return{ans:q.name,opts:pickOpts(q.name,names,count),seq,picked:null,nOpts:count};
}

export default function ScaleIdMode({audio,dispatch,streak,diff,onAdvance,weakOnly}:any){
  const t=useT();const {lang}=useLang();const fb=useGameFB(streak,dispatch,"scaleId");
  const lastAnsRef=useRef<string|null>(null);
  const nextRound=useCallback(()=>{const n=newScaleRound(diff,lang as "ua"|"en",lastAnsRef.current,weakOnly);lastAnsRef.current=n.ans;return n;},[diff,lang,weakOnly]);
  const [r,setR]=useState(nextRound);const [lk,setLk]=useState(false);
  const rRef=useRef(r);rRef.current=r;
  const lkRef=useRef(lk);lkRef.current=lk;
  const meta=MODES_META.find(m=>m.id==="scaleId")!;
  const playR=(round:typeof r)=>audio.playProgression(round.seq,0.34);
  useEffect(()=>{playR(rRef.current);},[]);// eslint-disable-line
  const goNext=()=>{
    if(!lkRef.current)return;
    if(onAdvance){onAdvance();return;}
    const n=nextRound();setR(n);setLk(false);fb.reset();setTimeout(()=>playR(n),100);
  };// eslint-disable-line
  useGameKeys(()=>playR(rRef.current),goNext);
  return(
    <GWrap {...fb} streak={streak}>
      <span style={{fontSize:40}}>🪜</span>
      <h2 className="text-lg font-bold text-white">{t.questions.scaleId}</h2>
      <Btn onClick={()=>playR(r)} label={t.ui.listen} color={meta.btn}/>
      <OptGrid opts={r.opts} picked={r.picked} ans={r.ans} locked={lk} cols={r.nOpts>4?3:2}
        onPick={(v:string)=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));const ok=v===r.ans;recordResult("scaleId",r.ans,ok);ok?fb.onOk():fb.onBad();}}/>
      {lk&&<div className="flex flex-col items-center gap-2">
        <button onClick={()=>playR(r)} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>🔊 {t.ui.listen}</button>
        <NextBtn onClick={goNext} color={meta.btn}/>
      </div>}
    </GWrap>
  );
}
