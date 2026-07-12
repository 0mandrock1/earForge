import { useRef, useState, useEffect } from "react";
import { NOTES, NAT_NOTES, MODES_META, pickOpts, randBuf } from "../constants";
import { useT } from "../i18n";
import { weightedPick, recordResult } from "../srs";
import { A4Btn, Btn, NextBtn, OptGrid, GWrap, useGameFB, useGameKeys } from "../components/common";

export default function NoteIdMode({audio,dispatch,streak,diff}:any){
  const t=useT();const fb=useGameFB(streak,dispatch);
  const pool=diff==="easy"?NAT_NOTES:NOTES;
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  const octs=diff==="hard"?[3,4,5]:[4];
  const lastAnsRef=useRef<string|null>(null);
  const newR=()=>{
    const fp=lastAnsRef.current?pool.filter(x=>x!==lastAnsRef.current):pool;
    const a=weightedPick("noteId",fp.length>0?fp:pool,x=>x,()=>randBuf.get());
    const o=octs[Math.floor(randBuf.get()*octs.length)];
    lastAnsRef.current=a;
    return{ans:a,opts:pickOpts(a,pool,nOpts),note:a+o,picked:null};
  };
  const [r,setR]=useState(newR);const [lk,setLk]=useState(false);
  const rRef=useRef(r);rRef.current=r;
  const lkRef=useRef(lk);lkRef.current=lk;
  const meta=MODES_META[0];
  useEffect(()=>{audio.playNote(rRef.current.note);},[]);// eslint-disable-line
  const goNext=()=>{if(!lkRef.current)return;const n=newR();setR(n);setLk(false);fb.reset();setTimeout(()=>audio.playNote(n.note),100);};// eslint-disable-line
  useGameKeys(()=>audio.playNote(rRef.current.note),goNext);
  return(
    <GWrap {...fb} streak={streak}>
      <div className="absolute top-4 left-4"><A4Btn audio={audio}/></div>
      <span style={{fontSize:40}}>🎵</span>
      <h2 className="text-lg font-bold text-white">{t.questions.noteId}</h2>
      <Btn onClick={()=>audio.playNote(r.note)} label={t.ui.listen} color={meta.btn}/>
      <OptGrid opts={r.opts} picked={r.picked} ans={r.ans} locked={lk} cols={nOpts>4?3:2}
        onPick={(v:string)=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));const ok=v===r.ans;recordResult("noteId",r.ans,ok);ok?fb.onOk():fb.onBad();}}/>
      {lk&&<div className="flex flex-col items-center gap-2">
        <button onClick={()=>audio.playNote(r.note)} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>🔊 {t.ui.listen}</button>
        <NextBtn onClick={goNext} color={meta.btn}/>
      </div>}
    </GWrap>
  );
}
