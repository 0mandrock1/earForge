import { useRef, useState, useEffect } from "react";
import { MODES_META, randInt } from "../constants";
import { useT } from "../i18n";
import { Btn, NextBtn, GWrap, useGameFB, useGameKeys } from "../components/common";

// No spaced repetition here on purpose — the target BPM is a continuous value, not a
// discrete label, so there's no stable "key" for the leaky-bucket weighting to attach to.
// Also excluded from Session/Weak-spots mode selection for the same reason.
export default function BpmMode({audio,dispatch,streak,diff,onAdvance}:any){
  const t=useT();const fb=useGameFB(streak,dispatch,"bpm");
  const [lo,hi,tol]=diff==="easy"?[60,120,.12]:diff==="medium"?[60,180,.08]:[40,200,.05];
  const bRef=useRef(randInt(lo,hi));
  const meta=MODES_META[2];
  const [input,setInput]=useState("");
  const [res,setRes]=useState<any>(null);
  const [taps,setTaps]=useState<number[]>([]);
  const [tapBpm,setTapBpm]=useState<number|null>(null);
  const [ta,setTa]=useState(false);
  const [rip,setRip]=useState(0);

  const play=()=>audio.playMetronome(bRef.current,8);
  const clearTaps=()=>{setTaps([]);setTapBpm(null);};
  const startNew=()=>{
    if(onAdvance){onAdvance();return;}
    bRef.current=randInt(lo,hi);setInput("");setRes(null);clearTaps();fb.reset();audio.playMetronome(bRef.current,8);
  };
  const submit=()=>{
    const v=parseInt(input);if(!v||v<20||v>300)return;
    const ok=Math.abs(v-bRef.current)<=bRef.current*tol;
    setRes({ok,dir:v<bRef.current?"higher":v>bRef.current?"lower":"exact",userBpm:v});
    ok?fb.onOk():fb.onBad();
  };
  const compare=()=>{
    if(!res)return;
    audio.playMetronome(bRef.current,4);
    setTimeout(()=>audio.playMetronome(res.userBpm,4),(60000/bRef.current)*4+400);
  };
  const tap=()=>{
    if(res)return;
    setTa(true);setRip(r=>r+1);setTimeout(()=>setTa(false),120);
    const now=performance.now();
    setTaps(prev=>{
      const arr=[...prev,now].slice(-10);
      if(arr.length>=3){
        const ivs=[];for(let i=1;i<arr.length;i++)ivs.push(arr[i]-arr[i-1]);
        setTapBpm(Math.round(60000/(ivs.reduce((a,b)=>a+b,0)/ivs.length)));
      }
      return arr;
    });
  };
  // "0" (top row or numpad) taps the rhythm, same as the TAP button — lets you tap
  // without taking a hand off the keyboard while the input has focus is intentionally
  // excluded so typing "0" into the BPM field never fires a spurious tap.
  const tapRef=useRef(tap);tapRef.current=tap;
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
      if(e.code==="Digit0"||e.code==="Numpad0"){e.preventDefault();tapRef.current();}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);
  useGameKeys(play,()=>{if(res)startNew();else submit();});

  return(
    <GWrap {...fb} streak={streak}>
      <span style={{fontSize:40}}>🥁</span>
      <h2 className="text-lg font-bold text-white">{t.questions.bpm}</h2>
      <Btn onClick={play} label={t.ui.listen} color={meta.btn}/>
      {!res&&(
        <>
          <div className="flex items-center gap-2 w-full max-w-xs">
            <input
              type="number" inputMode="numeric" placeholder={t.ui.tapHint.split(":")[0]||"BPM"}
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")submit();}}
              className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-center outline-none"
              style={{backgroundColor:"rgba(255,255,255,.1)",border:"2px solid rgba(255,255,255,.15)",fontSize:16}}
            />
            <button onClick={submit} className="py-3 px-5 rounded-xl text-white font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
              style={{background:meta.btn,opacity:input?"1":".4"}}>✓</button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-amber-300 text-xs">{t.ui.tapHint}</p>
            <div className="relative">
              <button onClick={tap} className="w-14 h-14 rounded-full text-white font-bold text-xs shadow-lg relative z-10"
                style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",transform:ta?"scale(.88)":"scale(1)",transition:"transform .08s"}}>TAP</button>
              <div key={rip} className="absolute inset-0 rounded-full pointer-events-none"
                style={{border:"2px solid #f59e0b",animation:"ripple .6s ease-out forwards",opacity:0}}/>
            </div>
            {(tapBpm!==null||taps.length>0)&&(
              <div className="flex items-center justify-center gap-2 flex-wrap min-h-[28px]">
                {tapBpm!==null&&(
                  <>
                    <div className="text-amber-400 font-bold">{tapBpm} <span className="text-xs text-amber-300">BPM</span></div>
                    <button onClick={()=>setInput(String(tapBpm))} className="px-2 py-1 rounded-lg text-xs font-bold text-amber-200"
                      style={{backgroundColor:"rgba(251,191,36,.15)",border:"1px solid rgba(251,191,36,.3)"}}>{t.ui.tapInsert}</button>
                  </>
                )}
                {taps.length>0&&(
                  <button onClick={clearTaps} className="px-2 py-1 rounded-lg text-xs font-bold text-red-300"
                    style={{backgroundColor:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.3)"}}>{t.ui.tapClear}</button>
                )}
              </div>
            )}
          </div>
        </>
      )}
      {res&&(
        <div className="flex flex-col items-center gap-3" style={{animation:"slideUp .4s ease-out"}}>
          <div className="text-white text-lg">{t.ui.target}: <span className="font-bold text-amber-400">{bRef.current} BPM</span></div>
          <div className="text-white text-lg">{t.ui.answer}: <span className={"font-bold "+(res.ok?"text-green-400":"text-red-400")}>{res.userBpm} BPM</span></div>
          {res.ok
            ?<div className="text-3xl" style={{animation:"popIn .3s ease-out"}}>{t.ui.correct}</div>
            :<div className="flex flex-col items-center gap-1">
              <div className="text-3xl" style={{animation:"shake .4s ease"}}>❌</div>
              <div className="text-lg font-bold" style={{color:res.dir==="higher"?"#60a5fa":"#f472b6",animation:"popIn .3s ease-out"}}>
                {res.dir==="higher"?t.ui.higher:t.ui.lower}
              </div>
            </div>
          }
          <button onClick={compare} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
            style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>{t.ui.compare}</button>
          <NextBtn onClick={startNew} color={meta.btn}/>
        </div>
      )}
    </GWrap>
  );
}
