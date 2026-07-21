import { useRef, useCallback, useState, useEffect } from "react";
import { CSS, getMult, MAJOR, MINOR, buildChord, randBuf, MODES_META, DIFFS_META } from "../constants";
import { useT, useLang } from "../i18n";
import { audioVol, useAudio } from "../audio";
import { loadSkips, saveSkips } from "../storage";
import { recordRound } from "../adaptiveDiff";

// ─── Particles / Level Up / Lang Toggle ────────────────────────────────────────
export function Particles({trigger}:{trigger:number}){
  const [ps,setPs]=useState<any[]>([]);const prev=useRef(0);
  useEffect(()=>{if(trigger===prev.current)return;prev.current=trigger;
    const arr=Array.from({length:12},(_,i)=>{const ang=randBuf.get()*Math.PI*2,sp=60+randBuf.get()*80;
      return{id:Date.now()+i,x:Math.cos(ang)*sp,y:Math.sin(ang)*sp,
        c:["#fbbf24","#a78bfa","#34d399","#f472b6","#60a5fa"][i%5],s:4+randBuf.get()*6};
    });setPs(arr);setTimeout(()=>setPs([]),800);
  },[trigger]);
  if(!ps.length)return null;
  return <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
    {ps.map(p=><div key={p.id} className="absolute rounded-full" style={{width:p.s,height:p.s,backgroundColor:p.c,transform:`translate(${p.x}px,${p.y}px)`,opacity:0,animation:"floatUp .7s ease-out forwards"}}/>)}
  </div>;
}

export function LevelUp({level,onDone}:{level:number,onDone:()=>void}){
  const t=useT();
  const [exiting,setExiting]=useState(false);
  const canDismiss=useRef(false);

  useEffect(()=>{
    const minT=setTimeout(()=>{canDismiss.current=true;},1500);
    const autoT=setTimeout(()=>setExiting(true),5000);
    return()=>{clearTimeout(minT);clearTimeout(autoT);};
  },[]);

  useEffect(()=>{
    if(!exiting)return;
    const tid=setTimeout(onDone,400);
    return()=>clearTimeout(tid);
  },[exiting,onDone]);

  return(
    <div
      className="fixed inset-0 flex items-center justify-center z-50 cursor-pointer"
      onClick={()=>{if(canDismiss.current)setExiting(true);}}
      style={{animation:exiting?"fadeOut .4s ease-out forwards":"fadeIn .3s ease-out",backgroundColor:"rgba(0,0,0,.6)"}}
    >
      <div className="flex flex-col items-center gap-3" style={{animation:exiting?"lvlUpExit .4s ease-out forwards":"lvlUp .7s cubic-bezier(.34,1.56,.64,1)"}}>
        <div style={{fontSize:72}}>⭐</div>
        <div className="text-4xl font-bold text-white">Level {level}!</div>
        <div className="text-purple-300 text-lg">{t.ui.levelUpSub}</div>
        <div className="text-purple-400 text-xs mt-2">{t.ui.tapToClose}</div>
      </div>
    </div>
  );
}

export function LangToggle(){
  const {lang,setLang}=useLang();
  return(
    <button
      onClick={()=>setLang(lang==="ua"?"en":"ua")}
      className="px-2 py-1 rounded-lg text-xs font-bold"
      style={{backgroundColor:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.3)",color:"#c4b5fd"}}
    >{lang==="ua"?"EN":"UA"}</button>
  );
}

export function A4Btn({audio,size="sm"}:{audio:ReturnType<typeof useAudio>,size?:"sm"|"lg"}){
  const t=useT();
  const [p,setP]=useState(false);
  const play=()=>{audio.playNote("A4",0.5);setP(true);setTimeout(()=>setP(false),300)};
  if(size==="sm")return(
    <button onClick={play} className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-200"
      style={{backgroundColor:"rgba(167,139,250,.2)",border:"1px solid rgba(167,139,250,.3)",
        transform:p?"scale(.9)":"scale(1)",transition:"transform .15s"}}>A4 🔊</button>
  );
  return(
    <button onClick={play} className="px-5 py-2 rounded-xl text-sm font-bold text-white"
      style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",
        transform:p?"scale(.9)":"scale(1)",transition:"transform .15s"}}>{t.ui.listenA4}</button>
  );
}

export function XpBar({xp,level}:{xp:number,level:number}){
  const XP_PER_LEVEL=200;
  const p=(xp%XP_PER_LEVEL)/XP_PER_LEVEL*100;
  return(
    <div className="flex items-center gap-3 w-full max-w-md">
      <div className="text-sm font-bold text-purple-300 whitespace-nowrap" style={{animation:"glow 2s ease infinite"}}>LVL {level}</div>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{backgroundColor:"rgba(255,255,255,.12)"}}>
        <div className="h-full rounded-full" style={{width:`${p}%`,background:"linear-gradient(90deg,#a78bfa,#7c3aed,#c084fc)",transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/>
      </div>
      <div className="text-xs text-purple-300 whitespace-nowrap">{xp%XP_PER_LEVEL}/{XP_PER_LEVEL}</div>
    </div>
  );
}

export function Header({state,dispatch}:{state:any,dispatch:React.Dispatch<any>}){
  const t=useT();
  const back=state.screen!=="menu";
  const msg=t.streakMsgs[Math.min(state.streak,t.streakMsgs.length-1)]||"";
  return(
    <div className="w-full px-4 pt-4 pb-3 flex flex-col items-center gap-2">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="flex items-center gap-2">
          {back&&<button onClick={()=>dispatch({type:"GO",screen:"menu"})} className="text-purple-300 hover:text-white mr-1" style={{fontSize:22}}>←</button>}
          <span style={{fontSize:24}}>🎧</span>
          <span className="font-bold text-white text-lg tracking-tight">EarForge</span>
        </div>
        <div className="flex items-center gap-2">
          {state.streak>0&&(
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-sm font-bold">🔥{state.streak}</span>
              {state.streak>=2&&<span className="text-xs font-bold" style={{color:"#fbbf24"}}>{getMult(state.streak)}x</span>}
            </div>
          )}
          <LangToggle/>
        </div>
      </div>
      <XpBar xp={state.xp} level={state.level}/>
      <div className="flex items-center gap-2 w-full max-w-md">
        <span className="text-purple-400 text-xs">🔊</span>
        <input type="range" min="0" max="1" step="0.05" defaultValue={String(audioVol.v)}
          onChange={e=>{audioVol.v=parseFloat(e.target.value);localStorage.setItem("earforge-vol",e.target.value);}}
          className="flex-1 h-1 cursor-pointer accent-purple-400"/>
      </div>
      {msg&&state.streak>=2&&<div className="text-xs font-bold" style={{color:"#fbbf24",animation:"slideUp .3s ease-out"}}>{msg}</div>}
    </div>
  );
}

export function FloatXp({xp,id}:{xp:number,id:number}){
  return <div key={id} className="absolute text-amber-400 font-bold pointer-events-none"
    style={{animation:"floatUp .9s ease-out forwards",top:"25%",left:"50%",marginLeft:-20,fontSize:20}}>+{xp} XP</div>;
}

// modeId is passed explicitly (not inferred from the current screen) because in a
// mixed Session the top-level screen is "session" while several different modes
// cycle through underneath it — inferring from screen would bucket every session
// round\'s stats under a bogus "session" key instead of the real mode.
export function useGameFB(streak:number,dispatch:React.Dispatch<any>,modeId:string){
  const [flash,setFlash]=useState<string|null>(null);
  const [floats,setFloats]=useState<{xp:number,id:number}[]>([]);
  const [sPop,setSPop]=useState(false);
  const [ptrig,setPtrig]=useState(0);
  const fid=useRef(0);
  return{flash,floats,sPop,ptrig,
    onOk:useCallback(()=>{
      const g=10*getMult(streak);fid.current++;
      setFloats(f=>[...f.slice(-3),{xp:g,id:fid.current}]);
      if(streak>=2){setSPop(true);setTimeout(()=>setSPop(false),400);}
      setFlash("correct");setPtrig(p=>p+1);dispatch({type:"CORRECT",mode:modeId});recordRound(modeId,true);
    },[streak,dispatch,modeId]),
    onBad:useCallback(()=>{setFlash("wrong");dispatch({type:"WRONG",mode:modeId});recordRound(modeId,false);},[dispatch,modeId]),
    reset:useCallback(()=>setFlash(null),[]),
  };
}

// Keyboard shortcuts: Space=replay, Enter=next/submit. Uses refs so callbacks are always fresh.
export function useGameKeys(onSpace:()=>void,onEnter:()=>void){
  const spRef=useRef(onSpace),enRef=useRef(onEnter);
  spRef.current=onSpace;enRef.current=onEnter;
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
      if(e.code==="Space"){e.preventDefault();spRef.current();}
      else if(e.code==="Enter"){e.preventDefault();enRef.current();}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);
}

export function GWrap({flash,floats,sPop,ptrig,streak,children}:any){
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 pb-8 relative"
      style={{animation:flash==="correct"?"flashGreen .5s ease-out":flash==="wrong"?"flashRed .5s ease-out":"none"}}>
      <style>{CSS}</style>
      {floats.map((f:any)=><FloatXp key={f.id} xp={f.xp} id={f.id}/>)}
      <Particles trigger={ptrig}/>
      {streak>=2&&<div className="absolute top-4 right-4 text-3xl pointer-events-none"
        style={{animation:sPop?"streakPulse .4s ease":"none"}}>🔥</div>}
      {children}
    </div>
  );
}

export function Btn({onClick,label,color}:{onClick:()=>void,label:string,color:string}){
  return <button onClick={onClick} className="px-8 py-3 rounded-2xl text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-transform" style={{background:color}}>{label}</button>;
}
export function NextBtn({onClick,color}:{onClick:()=>void,color:string}){
  const t=useT();
  return <button onClick={onClick} className="mt-1 px-8 py-3 rounded-2xl text-white font-bold hover:scale-105 active:scale-95 transition-transform" style={{background:color,animation:"popIn .3s ease-out"}}>{t.ui.next}</button>;
}

// Digit keys 1-9 (top row OR numpad — .key normalizes both to the same character
// as long as NumLock is on) pick the corresponding option. Works with an external
// Bluetooth/USB-OTG numpad on a phone exactly the same as a desktop keyboard.
export function OptGrid({opts,picked,ans,locked,onPick,cols=2,hints}:any){
  const [openHint,setOpenHint]=useState<string|null>(null);
  useEffect(()=>{setOpenHint(null);},[opts]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if(locked)return;
      const i=parseInt(e.key,10)-1;
      if(i>=0&&i<opts.length){e.preventDefault();onPick(opts[i]);}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[opts,locked,onPick]);
  return(
    <div className="grid gap-3 w-full max-w-xs" style={{gridTemplateColumns:`repeat(${cols},1fr)`,animation:"slideUp .3s ease-out"}}>
      {opts.map((o:string,i:number)=>{
        let bg="rgba(255,255,255,.1)",anim="",brd="2px solid transparent";
        if(locked&&o===ans){bg="#16a34a";anim="popIn .3s ease-out";brd="2px solid #4ade80";}
        else if(locked&&o===picked&&o!==ans){bg="#dc2626";anim="shake .4s ease";brd="2px solid #f87171";}
        const hint=hints?.[o];
        return (
          <div key={o} className="relative">
            <button onClick={()=>{setOpenHint(null);onPick(o);}} className="relative w-full py-3 rounded-xl text-white font-bold text-base hover:bg-white hover:bg-opacity-20"
              style={{backgroundColor:bg,animation:anim,border:brd,transition:"background-color .2s"}}>
              <span className="absolute top-1 left-2 text-[10px] opacity-40">{i+1}</span>{o}
            </button>
            {hint&&(
              <button type="button" aria-label="?" onClick={(e)=>{e.stopPropagation();setOpenHint(v=>v===o?null:o);}}
                className="absolute top-1 right-1 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center"
                style={{backgroundColor:"rgba(255,255,255,.18)",color:"rgba(255,255,255,.7)"}}>?</button>
            )}
            {hint&&openHint===o&&(
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-10 text-[11px] px-2 py-1 rounded-lg text-white text-center whitespace-nowrap"
                style={{backgroundColor:"rgba(15,10,40,.95)",border:"1px solid rgba(167,139,250,.3)",animation:"fadeIn .15s"}}>
                {hint}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tutorial ──────────────────────────────────────────────────────────────────
export function TutorialDialog({modeId,onStart,onSkip,audio}:{modeId:string,onStart:()=>void,onSkip:()=>void,audio:ReturnType<typeof useAudio>}){
  const t=useT();
  const tut=(t.tutorials as any)[modeId];
  const [step,setStep]=useState(0);
  const last=step>=tut.steps.length-1;
  const s=tut.steps[step];

  const playMaj=useCallback(()=>audio.playProgression([buildChord("C",4,MAJOR)],0),[audio]);
  const playMin=useCallback(()=>audio.playProgression([buildChord("C",4,MINOR)],0),[audio]);
  const playCad=useCallback(()=>audio.playProgression([
    buildChord("C",3,MAJOR),buildChord("F",3,MAJOR),
    buildChord("G",3,MAJOR),buildChord("C",3,MAJOR),
  ],0.7),[audio]);

  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8" style={{animation:"fadeIn .3s"}}>
      <style>{CSS}</style>
      <div className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4" style={{backgroundColor:"rgba(255,255,255,.08)"}}>
        <h2 className="text-xl font-bold text-white text-center">{tut.title}</h2>
        <div className="flex gap-1.5 justify-center">
          {tut.steps.map((_:any,i:number)=>(
            <div key={i} className="h-1.5 rounded-full" style={{width:i===step?24:12,backgroundColor:i===step?"#a78bfa":"rgba(255,255,255,.2)",transition:"all .3s"}}/>
          ))}
        </div>
        <div key={step} className="rounded-xl p-4 flex flex-col gap-3" style={{backgroundColor:"rgba(255,255,255,.06)",animation:"slideUp .3s ease-out"}}>
          <div className="flex gap-3 items-start">
            <span style={{fontSize:28}}>{s.icon}</span>
            <p className="text-white text-sm leading-relaxed">{s.text}</p>
          </div>
          {s.hasA4&&<div className="flex justify-center"><A4Btn audio={audio} size="lg"/></div>}
          {s.hasMajMin&&(
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={playMaj} className="px-4 py-2 rounded-xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}}>{t.ui.playMajor}</button>
              <button onClick={playMin} className="px-4 py-2 rounded-xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#0891b2,#0e7490)"}}>{t.ui.playMinor}</button>
            </div>
          )}
          {s.hasCadence&&(
            <div className="flex justify-center">
              <button onClick={playCad} className="px-4 py-2 rounded-xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#059669,#047857)"}}>{t.ui.playCadence}</button>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-1">
          {step>0&&(
            <button onClick={()=>setStep(v=>v-1)} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm" style={{backgroundColor:"rgba(255,255,255,.1)"}}>{t.ui.back}</button>
          )}
          {!last
            ?<button onClick={()=>setStep(v=>v+1)} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}}>{t.ui.next}</button>
            :<button onClick={onStart} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}}>{t.ui.startPlay}</button>
          }
        </div>
        <button onClick={onSkip} className="text-xs text-center" style={{color:"rgba(255,255,255,.35)"}}>{t.ui.dontShow}</button>
      </div>
    </div>
  );
}

export function useTutorial(modeId:string){
  const [show,setShow]=useState(false),[ready,setReady]=useState(false);
  useEffect(()=>{let m=true;loadSkips().then(s=>{if(m){if(!(s as any)[modeId])setShow(true);setReady(true);}});return()=>{m=false;};},[modeId]);
  return{
    show,ready,
    dismiss:useCallback(()=>setShow(false),[]),
    skip:useCallback(()=>{setShow(false);loadSkips().then(s=>saveSkips({...(s as any),[modeId]:true}));},[modeId]),
  };
}
