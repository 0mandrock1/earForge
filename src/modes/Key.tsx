import { useRef, useState, useCallback, useEffect } from "react";
import { NOTES, MAJOR, MINOR, MODES_META, pickOpts, buildChord, randBuf } from "../constants";
import { useT } from "../i18n";
import { weightedPick, recordResult } from "../srs";
import { Btn, NextBtn, OptGrid, GWrap, useGameFB, useGameKeys } from "../components/common";

function newKeyRound(diff:string,exclude:string|null=null){
  const keyPool=diff==="easy"?NOTES.map(k=>k+" maj"):NOTES.flatMap(k=>[k+" maj",k+" min"]);
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  const fp=exclude?keyPool.filter(l=>l!==exclude):keyPool;
  const label=weightedPick("key",fp.length>0?fp:keyPool,x=>x,()=>randBuf.get());
  const isMin=label.endsWith(" min"),root=label.replace(/ (maj|min)$/,"");
  const ct=isMin?MINOR:MAJOR,ri=NOTES.indexOf(root);
  const chords=[buildChord(root,3,ct),buildChord(NOTES[(ri+5)%12],3,isMin?MINOR:MAJOR),buildChord(NOTES[(ri+7)%12],3,MAJOR),buildChord(root,3,ct)];
  return{ans:label,opts:pickOpts(label,keyPool,nOpts),chords,picked:null,nOpts};
}

export default function KeyMode({audio,dispatch,streak,diff}:any){
  const t=useT();const fb=useGameFB(streak,dispatch);
  const lastAnsRef=useRef<string|null>(null);
  const nextRound=useCallback(()=>{const n=newKeyRound(diff,lastAnsRef.current);lastAnsRef.current=n.ans;return n;},[diff]);
  const [r,setR]=useState(nextRound);const [lk,setLk]=useState(false);
  const rRef=useRef(r);rRef.current=r;
  const lkRef=useRef(lk);lkRef.current=lk;
  const meta=MODES_META[3];
  useEffect(()=>{audio.playProgression(rRef.current.chords,.7);},[]);// eslint-disable-line
  const goNext=()=>{if(!lkRef.current)return;const n=nextRound();setR(n);setLk(false);fb.reset();setTimeout(()=>audio.playProgression(n.chords,.7),100);};// eslint-disable-line
  useGameKeys(()=>audio.playProgression(rRef.current.chords,.7),goNext);
  return(
    <GWrap {...fb} streak={streak}>
      <span style={{fontSize:40}}>🎹</span>
      <h2 className="text-lg font-bold text-white">{t.questions.key}</h2>
      <Btn onClick={()=>audio.playProgression(r.chords,.7)} label={t.ui.listen} color={meta.btn}/>
      <OptGrid opts={r.opts} picked={r.picked} ans={r.ans} locked={lk} cols={r.nOpts>4?3:2}
        onPick={(v:string)=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));const ok=v===r.ans;recordResult("key",r.ans,ok);ok?fb.onOk():fb.onBad();}}/>
      {lk&&<div className="flex flex-col items-center gap-2">
        <button onClick={()=>audio.playProgression(r.chords,.7)} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>🔊 {t.ui.listen}</button>
        <NextBtn onClick={goNext} color={meta.btn}/>
      </div>}
    </GWrap>
  );
}
