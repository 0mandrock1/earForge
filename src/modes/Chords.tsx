import { useRef, useState, useCallback, useEffect } from "react";
import { NOTES, CHORDS, MODES_META, pickOpts, buildChord, randInt, randBuf } from "../constants";
import { useT, useLang } from "../i18n";
import { weightedPick, recordResult } from "../srs";
import { Btn, NextBtn, OptGrid, GWrap, useGameFB, useGameKeys } from "../components/common";

function newChordRound(diff:string,lang:"ua"|"en",exclude:string|null){
  const all=CHORDS[lang]??CHORDS.ua;
  const count=diff==="easy"?3:diff==="medium"?4:6;
  const pool=all.slice(0,count);
  const names=pool.map(c=>c.name);
  const fp=exclude?pool.filter(c=>c.name!==exclude):pool;
  const q=weightedPick("chords",fp.length>0?fp:pool,c=>c.name,()=>randBuf.get());
  const root=NOTES[Math.floor(randBuf.get()*NOTES.length)],oct=randInt(3,4);
  return{ans:q.name,opts:pickOpts(q.name,names,count),notes:buildChord(root,oct,q.iv),picked:null,nOpts:count};
}

export default function ChordsMode({audio,dispatch,streak,diff}:any){
  const t=useT();const {lang}=useLang();const fb=useGameFB(streak,dispatch);
  const lastAnsRef=useRef<string|null>(null);
  const nextRound=useCallback(()=>{const n=newChordRound(diff,lang as "ua"|"en",lastAnsRef.current);lastAnsRef.current=n.ans;return n;},[diff,lang]);
  const [r,setR]=useState(nextRound);const [lk,setLk]=useState(false);
  const rRef=useRef(r);rRef.current=r;
  const lkRef=useRef(lk);lkRef.current=lk;
  const meta=MODES_META.find(m=>m.id==="chords")!;
  useEffect(()=>{audio.playChord(rRef.current.notes);},[]);// eslint-disable-line
  const goNext=()=>{if(!lkRef.current)return;const n=nextRound();setR(n);setLk(false);fb.reset();setTimeout(()=>audio.playChord(n.notes),100);};// eslint-disable-line
  useGameKeys(()=>audio.playChord(rRef.current.notes),goNext);
  return(
    <GWrap {...fb} streak={streak}>
      <span style={{fontSize:40}}>🎸</span>
      <h2 className="text-lg font-bold text-white">{t.questions.chords}</h2>
      <Btn onClick={()=>audio.playChord(r.notes)} label={t.ui.listen} color={meta.btn}/>
      <OptGrid opts={r.opts} picked={r.picked} ans={r.ans} locked={lk} cols={r.nOpts>4?3:2}
        onPick={(v:string)=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));const ok=v===r.ans;recordResult("chords",r.ans,ok);ok?fb.onOk():fb.onBad();}}/>
      {lk&&<div className="flex flex-col items-center gap-2">
        <button onClick={()=>audio.playChord(r.notes)} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>🔊 {t.ui.listen}</button>
        <NextBtn onClick={goNext} color={meta.btn}/>
      </div>}
    </GWrap>
  );
}
