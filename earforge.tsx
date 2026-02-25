import { useReducer, useRef, useCallback, useState, useEffect } from "react";

const NOTES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const NAT_NOTES=["C","D","E","F","G","A","B"];
const INTERVALS=[
  {name:"м2",st:1},{name:"б2",st:2},{name:"м3",st:3},{name:"б3",st:4},
  {name:"ч4",st:5},{name:"тт",st:6},{name:"ч5",st:7},{name:"м6",st:8},
  {name:"б6",st:9},{name:"м7",st:10},{name:"б7",st:11},{name:"окт",st:12},
];
const EASY_IV=[1,3,4,7,12];
const MODES=[
  {id:"noteId",icon:"🎵",name:"Note ID",desc:"Угадай ноту",gr:"from-violet-500 to-purple-600",btn:"linear-gradient(135deg,#7c3aed,#6d28d9)"},
  {id:"intervals",icon:"🎼",name:"Intervals",desc:"Определи интервал",gr:"from-cyan-500 to-blue-600",btn:"linear-gradient(135deg,#0891b2,#0e7490)"},
  {id:"bpm",icon:"🥁",name:"BPM Tap",desc:"Поймай темп",gr:"from-amber-500 to-orange-600",btn:"linear-gradient(135deg,#d97706,#b45309)"},
  {id:"key",icon:"🎹",name:"Key Detect",desc:"Найди тональность",gr:"from-emerald-500 to-green-600",btn:"linear-gradient(135deg,#059669,#047857)"},
];
const DIFFS=[
  {id:"easy",label:"Легко",emoji:"🟢",desc:{noteId:"7 нот, 3 варианта",intervals:"5 интервалов, 3 варианта",bpm:"60–120, допуск ±12%",key:"Только мажор, 3 варианта"}},
  {id:"medium",label:"Средне",emoji:"🟡",desc:{noteId:"12 нот, 4 варианта",intervals:"12 интервалов, 4 варианта",bpm:"60–180, допуск ±8%",key:"Мажор + минор, 4 варианта"}},
  {id:"hard",label:"Сложно",emoji:"🔴",desc:{noteId:"12 нот, 2 октавы, 6 вариантов",intervals:"12 интервалов, 6 вариантов",bpm:"40–200, допуск ±5%",key:"Мажор + минор, 6 вариантов"}},
];
const XP_PER_LEVEL=200;
const MAJOR=[0,4,7],MINOR=[0,3,7];
const STREAK_MSGS=["","","Неплохо!","Огонь!","Мастер!","На волне!","Невероятно!","Легенда!","GODLIKE!","UNSTOPPABLE!"];

const TUTORIALS={
  noteId:{title:"🎵 Как угадывать ноты",steps:[
    {icon:"🎯",text:"Найди якорную ноту. Запомни как звучит A4 (440 Гц). Нажми кнопку A4 и запомни этот звук.",hasA4:true},
    {icon:"🔊",text:"Слушай «характер» ноты. Низкие (C, D) — тепло и глубоко. Высокие (A#, B) — ярко и напряжённо."},
    {icon:"🎹",text:"C# чуть выше C, но ниже D. Диезы всегда «между» — ищи ощущение промежутка."},
    {icon:"🧠",text:"Пой! Попробуй пропеть услышанную ноту. Голос «садится» легко — нашёл правильную высоту."},
  ]},
  intervals:{title:"🎼 Как слышать интервалы",steps:[
    {icon:"🎬",text:"Привяжи к мелодии. м2 — «Jaws», б3 — «Oh When the Saints», ч5 — «Star Wars», окт — «Somewhere Over the Rainbow»."},
    {icon:"📏",text:"Малые (м2, б2) — «тесно», напряжённо. Большие (б6, б7) — широко, дистанция."},
    {icon:"😊",text:"Мажорные (б3, б6) — светло, радостно. Минорные (м3, м6) — грустно."},
    {icon:"🎯",text:"Тритон (тт) — нестабильный. Квинта (ч5) — устойчива и пуста."},
  ]},
  bpm:{title:"🥁 Как ловить темп",steps:[
    {icon:"💓",text:"60 BPM = секунда (пульс в покое). 120 — быстрый шаг. 180 — бег."},
    {icon:"🦶",text:"Топай или кивай в ритм. Тело запоминает темп лучше головы."},
    {icon:"⏱️",text:"TAP — подсказка. Потапай и посмотри подсчитанный BPM."},
    {icon:"📐",text:"Ошибки: удвоение и половинение. Результат ×2 или ÷2 — ты в другой сетке."},
  ]},
  key:{title:"🎹 Как определять тональность",steps:[
    {icon:"😊",text:"Мажор — ярко, «солнечно». Минор — темнее, «дождливо»."},
    {icon:"👂",text:"Последний аккорд — «дом». Какая нота = «дом»? Это тональность."},
    {icon:"🎵",text:"Пой тонику! Спой самую «устойчивую» ноту после прослушивания."},
    {icon:"🔄",text:"I-IV-V-I: IV уходит, V напрягает, I разрешает. Фокус на разрешении."},
  ]},
};

const CSS=`
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes popIn{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes flashGreen{0%{background-color:rgba(22,163,74,.35)}100%{background-color:transparent}}
@keyframes flashRed{0%{background-color:rgba(220,38,38,.25)}100%{background-color:transparent}}
@keyframes streakPulse{0%{transform:scale(1)}50%{transform:scale(1.5)}100%{transform:scale(1)}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-70px) scale(1.3)}}
@keyframes lvlUp{0%{transform:scale(0);opacity:0}30%{transform:scale(1.3);opacity:1}60%{transform:scale(.95)}100%{transform:scale(1);opacity:1}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(167,139,250,.3)}50%{box-shadow:0 0 24px rgba(167,139,250,.7)}}
@keyframes slideUp{0%{transform:translateY(30px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
@keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.5);opacity:0}}
`;

/* ── Pure Web Audio Engine (Safari-safe) ── */
function midiFromNote(name) {
  const match = name.match(/^([A-G]#?)(\d)$/);
  if (!match) return 69;
  const note = match[1], oct = parseInt(match[2]);
  const idx = NOTES.indexOf(note);
  return 12 * (oct + 1) + idx;
}
function freqFromMidi(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
function freqFromNote(name) { return freqFromMidi(midiFromNote(name)); }

function useAudio() {
  const ctxRef = useRef(null);
  const activeRef = useRef([]);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const stopAll = useCallback(() => {
    const now = getCtx().currentTime;
    activeRef.current.forEach(n => {
      try { n.gain.gain.cancelScheduledValues(now); n.gain.gain.setValueAtTime(n.gain.gain.value, now); n.gain.gain.linearRampToValueAtTime(0, now + 0.05); } catch(e) {}
    });
    activeRef.current = [];
  }, [getCtx]);

  const playTone = useCallback((freq, startTime, duration, vol = 0.3) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
    gain.gain.setValueAtTime(vol, startTime + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
    activeRef.current.push({ gain, osc });
    osc.onended = () => { activeRef.current = activeRef.current.filter(n => n.osc !== osc); };
  }, [getCtx]);

  const playClick = useCallback((startTime, vol = 0.4) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1000, startTime);
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.05);
  }, [getCtx]);

  const playNote = useCallback((note, dur = 0.4) => {
    stopAll();
    const ctx = getCtx();
    playTone(freqFromNote(note), ctx.currentTime, dur);
  }, [stopAll, getCtx, playTone]);

  const playInterval = useCallback((n1, n2, del = 0.5) => {
    stopAll();
    const ctx = getCtx(), t = ctx.currentTime;
    playTone(freqFromNote(n1), t, 0.4);
    playTone(freqFromNote(n2), t + del, 0.4);
  }, [stopAll, getCtx, playTone]);

  const playMetronome = useCallback((bpm, beats = 8) => {
    stopAll();
    const ctx = getCtx(), t = ctx.currentTime, iv = 60 / bpm;
    for (let i = 0; i < beats; i++) playClick(t + i * iv);
  }, [stopAll, getCtx, playClick]);

  const playProgression = useCallback((chords, tempo = 0.7) => {
    stopAll();
    const ctx = getCtx(), t = ctx.currentTime;
    chords.forEach((ch, i) => ch.forEach(n => playTone(freqFromNote(n), t + i * tempo, 0.55, 0.2)));
  }, [stopAll, getCtx, playTone]);

  return { playNote, playInterval, playMetronome, playProgression, stopAll };
}

/* ── Storage ── */
const SK="earforge-progress",TK="earforge-tut-skip";
async function loadP(){try{const r=await window.storage.get(SK);return r?JSON.parse(r.value):null}catch(e){return null}}
async function saveP(d){try{await window.storage.set(SK,JSON.stringify(d))}catch(e){}}
async function loadSkips(){try{const r=await window.storage.get(TK);return r?JSON.parse(r.value):{}}catch(e){return{}}}
async function saveSkips(d){try{await window.storage.set(TK,JSON.stringify(d))}catch(e){}}

/* ── Helpers ── */
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function pickOpts(c,pool,n=4){const s=new Set([c]);for(const x of shuffle(pool.filter(v=>v!==c))){if(s.size>=n)break;s.add(x)}return shuffle([...s])}
function noteAt(r,o,semi){const i=NOTES.indexOf(r)+semi;return NOTES[i%12]+(o+Math.floor(i/12))}
function getMult(s){return s>=9?5:s>=5?3:s>=2?2:1}
function buildChord(r,o,p){return p.map(s=>noteAt(r,o,s))}
function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}

/* ── Reducer ── */
const initState={screen:"menu",xp:0,level:1,streak:0,bestStreak:0,stats:{noteId:{ok:0,total:0},intervals:{ok:0,total:0},bpm:{ok:0,total:0},key:{ok:0,total:0}},loaded:false,lvlUp:false};
function reducer(st,a){
  switch(a.type){
    case "GO":return{...st,screen:a.screen};
    case "LOAD":return{...a.data,screen:"menu",loaded:true,lvlUp:false};
    case "LOADED":return{...st,loaded:true};
    case "CORRECT":{
      const m=getMult(st.streak),xp=st.xp+10*m,ns=st.streak+1,nl=Math.floor(xp/XP_PER_LEVEL)+1;
      const mode=st.screen,ms=st.stats[mode]||{ok:0,total:0};
      return{...st,xp,level:nl,streak:ns,bestStreak:Math.max(st.bestStreak,ns),stats:{...st.stats,[mode]:{ok:ms.ok+1,total:ms.total+1}},lvlUp:nl>st.level};
    }
    case "WRONG":{const mode=st.screen,ms=st.stats[mode]||{ok:0,total:0};
      return{...st,streak:0,stats:{...st.stats,[mode]:{ok:ms.ok,total:ms.total+1}},lvlUp:false};}
    case "CLR_LVL":return{...st,lvlUp:false};
    default:return st;
  }
}

/* ── Shared Components ── */
function Particles({trigger}){
  const [ps,setPs]=useState([]);const prev=useRef(0);
  useEffect(()=>{if(trigger===prev.current)return;prev.current=trigger;
    const arr=Array.from({length:12},(_,i)=>{const ang=Math.random()*Math.PI*2,sp=60+Math.random()*80;
      return{id:Date.now()+i,x:Math.cos(ang)*sp,y:Math.sin(ang)*sp,c:["#fbbf24","#a78bfa","#34d399","#f472b6","#60a5fa"][i%5],s:4+Math.random()*6};
    });setPs(arr);setTimeout(()=>setPs([]),800);
  },[trigger]);
  if(!ps.length)return null;
  return <div className="absolute inset-0 pointer-events-none flex items-center justify-center">{ps.map(p=><div key={p.id} className="absolute rounded-full" style={{width:p.s,height:p.s,backgroundColor:p.c,transform:`translate(${p.x}px,${p.y}px)`,opacity:0,animation:"floatUp .7s ease-out forwards"}}/>)}</div>;
}

function LevelUp({level,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2000);return()=>clearTimeout(t)},[onDone]);
  return <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none" style={{animation:"fadeIn .3s"}}>
    <div className="absolute inset-0" style={{backgroundColor:"rgba(0,0,0,.5)"}}/>
    <div className="relative flex flex-col items-center gap-3" style={{animation:"lvlUp .6s ease-out"}}>
      <div className="text-6xl">⭐</div><div className="text-3xl font-bold text-white">Level {level}!</div>
      <div className="text-purple-300 text-lg">Продолжай в том же духе</div>
    </div>
  </div>;
}

function A4Btn({audio,size="sm"}){
  const [p,setP]=useState(false);
  const play=()=>{audio.playNote("A4",0.5);setP(true);setTimeout(()=>setP(false),300)};
  if(size==="sm")return <button onClick={play} className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-200 active:scale-90" style={{backgroundColor:"rgba(167,139,250,.2)",border:"1px solid rgba(167,139,250,.3)",transform:p?"scale(.9)":"scale(1)",transition:"transform .15s"}}>A4 🔊</button>;
  return <button onClick={play} className="px-5 py-2 rounded-xl text-sm font-bold text-white active:scale-90" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",transform:p?"scale(.9)":"scale(1)",transition:"transform .15s"}}>🔊 Послушать A4 (440 Гц)</button>;
}

function XpBar({xp,level}){const p=(xp%XP_PER_LEVEL)/XP_PER_LEVEL*100;
  return <div className="flex items-center gap-3 w-full max-w-md">
    <div className="text-sm font-bold text-purple-300 whitespace-nowrap" style={{animation:"glow 2s ease infinite"}}>LVL {level}</div>
    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{backgroundColor:"rgba(255,255,255,.12)"}}><div className="h-full rounded-full" style={{width:`${p}%`,background:"linear-gradient(90deg,#a78bfa,#7c3aed,#c084fc)",transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/></div>
    <div className="text-xs text-purple-300 whitespace-nowrap">{xp%XP_PER_LEVEL}/{XP_PER_LEVEL}</div>
  </div>;
}

function Header({state,dispatch}){
  const back=state.screen!=="menu",msg=STREAK_MSGS[Math.min(state.streak,STREAK_MSGS.length-1)]||"";
  return <div className="w-full px-4 pt-4 pb-3 flex flex-col items-center gap-2">
    <div className="flex items-center justify-between w-full max-w-md">
      <div className="flex items-center gap-2">
        {back&&<button onClick={()=>dispatch({type:"GO",screen:"menu"})} className="text-purple-300 hover:text-white mr-1" style={{fontSize:22}}>←</button>}
        <span style={{fontSize:24}}>🎧</span><span className="font-bold text-white text-lg tracking-tight">EarForge</span>
      </div>
      {state.streak>0&&<div className="flex items-center gap-1"><span className="text-amber-400 text-sm font-bold">🔥{state.streak}</span>
        {state.streak>=2&&<span className="text-xs font-bold" style={{color:"#fbbf24"}}>{getMult(state.streak)}x</span>}</div>}
    </div>
    <XpBar xp={state.xp} level={state.level}/>
    {msg&&state.streak>=2&&<div className="text-xs font-bold" style={{color:"#fbbf24",animation:"slideUp .3s ease-out"}}>{msg}</div>}
  </div>;
}

function FloatXp({xp,id}){return <div key={id} className="absolute text-amber-400 font-bold pointer-events-none" style={{animation:"floatUp .9s ease-out forwards",top:"25%",left:"50%",marginLeft:-20,fontSize:20}}>+{xp} XP</div>}

function useGameFB(streak,dispatch){
  const [flash,setFlash]=useState(null),[floats,setFloats]=useState([]),[sPop,setSPop]=useState(false),[ptrig,setPtrig]=useState(0);const fid=useRef(0);
  return{flash,floats,sPop,ptrig,
    onOk:useCallback(()=>{const g=10*getMult(streak);fid.current++;setFloats(f=>[...f.slice(-3),{xp:g,id:fid.current}]);if(streak>=2){setSPop(true);setTimeout(()=>setSPop(false),400)}setFlash("correct");setPtrig(p=>p+1);dispatch({type:"CORRECT"})},[streak,dispatch]),
    onBad:useCallback(()=>{setFlash("wrong");dispatch({type:"WRONG"})},[dispatch]),
    reset:useCallback(()=>setFlash(null),[]),
  };
}

function GWrap({flash,floats,sPop,ptrig,streak,children}){
  return <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 pb-8 relative" style={{animation:flash==="correct"?"flashGreen .5s ease-out":flash==="wrong"?"flashRed .5s ease-out":"none"}}>
    <style>{CSS}</style>
    {floats.map(f=><FloatXp key={f.id} xp={f.xp} id={f.id}/>)}
    <Particles trigger={ptrig}/>
    {streak>=2&&<div className="absolute top-4 right-4 text-3xl pointer-events-none" style={{animation:sPop?"streakPulse .4s ease":"none"}}>🔥</div>}
    {children}
  </div>;
}

function Btn({onClick,label,color}){return <button onClick={onClick} className="px-8 py-3 rounded-2xl text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-transform" style={{background:color}}>{label}</button>}
function NextBtn({onClick,color}){return <button onClick={onClick} className="mt-1 px-8 py-3 rounded-2xl text-white font-bold hover:scale-105 active:scale-95 transition-transform" style={{background:color,animation:"popIn .3s ease-out"}}>Дальше →</button>}
function OptGrid({opts,picked,ans,locked,onPick,cols=2}){
  return <div className="grid gap-3 w-full max-w-xs" style={{gridTemplateColumns:`repeat(${cols},1fr)`,animation:"slideUp .3s ease-out"}}>
    {opts.map(o=>{let bg="rgba(255,255,255,.1)",anim="",brd="2px solid transparent";
      if(locked&&o===ans){bg="#16a34a";anim="popIn .3s ease-out";brd="2px solid #4ade80"}
      else if(locked&&o===picked&&o!==ans){bg="#dc2626";anim="shake .4s ease";brd="2px solid #f87171"}
      return <button key={o} onClick={()=>onPick(o)} className="py-3 rounded-xl text-white font-bold text-base hover:bg-white hover:bg-opacity-20" style={{backgroundColor:bg,animation:anim,border:brd,transition:"background-color .2s"}}>{o}</button>;
    })}
  </div>;
}

/* ── Difficulty Picker ── */
function DiffPicker({modeId,onPick}){
  const mode=MODES.find(m=>m.id===modeId);
  return <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5 pb-8" style={{animation:"fadeIn .3s"}}>
    <span style={{fontSize:48}}>{mode.icon}</span>
    <h2 className="text-xl font-bold text-white">{mode.name}</h2>
    <p className="text-purple-300 text-sm">Выбери сложность</p>
    <div className="flex flex-col gap-3 w-full max-w-xs">
      {DIFFS.map(d=>(
        <button key={d.id} onClick={()=>onPick(d.id)} className="flex items-center gap-3 p-4 rounded-xl text-left hover:scale-102 active:scale-95 transition-transform" style={{backgroundColor:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)"}}>
          <span style={{fontSize:24}}>{d.emoji}</span>
          <div className="flex-1"><div className="text-white font-bold text-sm">{d.label}</div><div className="text-purple-300 text-xs">{d.desc[modeId]}</div></div>
          <span className="text-purple-400">→</span>
        </button>
      ))}
    </div>
  </div>;
}

/* ── Tutorial ── */
function TutorialDialog({modeId,onStart,onSkip,audio}){
  const tut=TUTORIALS[modeId];const [step,setStep]=useState(0);
  const last=step>=tut.steps.length-1,s=tut.steps[step];
  return <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8" style={{animation:"fadeIn .3s"}}>
    <div className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4" style={{backgroundColor:"rgba(255,255,255,.08)"}}>
      <h2 className="text-xl font-bold text-white text-center">{tut.title}</h2>
      <div className="flex gap-1.5 justify-center">{tut.steps.map((_,i)=><div key={i} className="h-1.5 rounded-full" style={{width:i===step?24:12,backgroundColor:i===step?"#a78bfa":"rgba(255,255,255,.2)",transition:"all .3s"}}/>)}</div>
      <div key={step} className="rounded-xl p-4 flex flex-col gap-3" style={{backgroundColor:"rgba(255,255,255,.06)",animation:"slideUp .3s ease-out"}}>
        <div className="flex gap-3 items-start"><span style={{fontSize:28}}>{s.icon}</span><p className="text-white text-sm leading-relaxed">{s.text}</p></div>
        {s.hasA4&&audio&&<div className="flex justify-center"><A4Btn audio={audio} size="lg"/></div>}
      </div>
      <div className="flex gap-2 mt-1">
        {step>0&&<button onClick={()=>setStep(v=>v-1)} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm" style={{backgroundColor:"rgba(255,255,255,.1)"}}>← Назад</button>}
        {!last?<button onClick={()=>setStep(v=>v+1)} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}}>Далее →</button>
          :<button onClick={onStart} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}}>🎮 Играть!</button>}
      </div>
      <button onClick={onSkip} className="text-xs text-center" style={{color:"rgba(255,255,255,.35)"}}>Больше не показывать</button>
    </div>
  </div>;
}

function useTutorial(modeId){
  const [show,setShow]=useState(false),[ready,setReady]=useState(false);
  useEffect(()=>{let m=true;loadSkips().then(s=>{if(m){if(!s[modeId])setShow(true);setReady(true)}});return()=>{m=false}},[modeId]);
  return{show,ready,dismiss:useCallback(()=>setShow(false),[]),skip:useCallback(()=>{setShow(false);loadSkips().then(s=>saveSkips({...s,[modeId]:true}))},[modeId])};
}

/* ── NoteID ── */
function NoteIdMode({audio,dispatch,streak,diff}){
  const fb=useGameFB(streak,dispatch);
  const pool=diff==="easy"?NAT_NOTES:NOTES;
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  const octs=diff==="hard"?[3,4,5]:[4];
  const newR=()=>{const a=pick(pool),o=pick(octs);return{ans:a,opts:pickOpts(a,pool,nOpts),note:a+o,picked:null}};
  const [r,setR]=useState(newR);const [lk,setLk]=useState(false);const mode=MODES[0];
  return <GWrap {...fb} streak={streak}>
    <div className="absolute top-4 left-4"><A4Btn audio={audio}/></div>
    <span style={{fontSize:40}}>🎵</span>
    <h2 className="text-lg font-bold text-white">Какая это нота?</h2>
    <Btn onClick={()=>audio.playNote(r.note)} label="🔊 Послушать" color={mode.btn}/>
    <OptGrid opts={r.opts} picked={r.picked} ans={r.ans} locked={lk} onPick={v=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));v===r.ans?fb.onOk():fb.onBad()}} cols={nOpts>4?3:2}/>
    {lk&&<NextBtn onClick={()=>{const n=newR();setR(n);setLk(false);fb.reset();setTimeout(()=>audio.playNote(n.note),100)}} color={mode.btn}/>}
  </GWrap>;
}

/* ── Intervals ── */
function IntervalsMode({audio,dispatch,streak,diff}){
  const fb=useGameFB(streak,dispatch);
  const ivPool=diff==="easy"?INTERVALS.filter(i=>EASY_IV.includes(i.st)):INTERVALS;
  const names=ivPool.map(i=>i.name);
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  const newR=()=>{const iv=pick(ivPool),root=pick(NOTES);return{ans:iv.name,opts:pickOpts(iv.name,names,nOpts),n1:root+"4",n2:noteAt(root,4,iv.st),picked:null}};
  const [r,setR]=useState(newR);const [lk,setLk]=useState(false);const mode=MODES[1];
  return <GWrap {...fb} streak={streak}>
    <span style={{fontSize:40}}>🎼</span>
    <h2 className="text-lg font-bold text-white">Какой интервал?</h2>
    <Btn onClick={()=>audio.playInterval(r.n1,r.n2)} label="🔊 Послушать" color={mode.btn}/>
    <OptGrid opts={r.opts} picked={r.picked} ans={r.ans} locked={lk} onPick={v=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));v===r.ans?fb.onOk():fb.onBad()}} cols={nOpts>4?3:2}/>
    {lk&&<NextBtn onClick={()=>{const n=newR();setR(n);setLk(false);fb.reset();setTimeout(()=>audio.playInterval(n.n1,n.n2),100)}} color={mode.btn}/>}
  </GWrap>;
}

/* ── BPM ── */
function BpmMode({audio,dispatch,streak,diff}){
  const fb=useGameFB(streak,dispatch);
  const [lo,hi,tol]=diff==="easy"?[60,120,.12]:diff==="medium"?[60,180,.08]:[40,200,.05];
  const bRef=useRef(randInt(lo,hi));const mode=MODES[2];
  const [input,setInput]=useState("");const [res,setRes]=useState(null);
  const [taps,setTaps]=useState([]);const [tapBpm,setTapBpm]=useState(null);
  const [ta,setTa]=useState(false);const [rip,setRip]=useState(0);

  const play=()=>audio.playMetronome(bRef.current,8);
  const startNew=()=>{bRef.current=randInt(lo,hi);setInput("");setRes(null);setTaps([]);setTapBpm(null);fb.reset();audio.playMetronome(bRef.current,8)};
  const submit=()=>{const v=parseInt(input);if(!v||v<20||v>300)return;const ok=Math.abs(v-bRef.current)<=bRef.current*tol;
    setRes({ok,dir:v<bRef.current?"higher":v>bRef.current?"lower":"exact",userBpm:v});ok?fb.onOk():fb.onBad()};
  const tap=()=>{if(res)return;setTa(true);setRip(r=>r+1);setTimeout(()=>setTa(false),120);
    const now=performance.now();setTaps(prev=>{const t=[...prev,now].slice(-10);
      if(t.length>=3){const ivs=[];for(let i=1;i<t.length;i++)ivs.push(t[i]-t[i-1]);setTapBpm(Math.round(60000/(ivs.reduce((a,b)=>a+b,0)/ivs.length)))}return t})};

  return <GWrap {...fb} streak={streak}>
    <span style={{fontSize:40}}>🥁</span>
    <h2 className="text-lg font-bold text-white">Какой темп?</h2>
    <Btn onClick={play} label="🔊 Послушать" color={mode.btn}/>
    {!res&&<>
      <div className="flex items-center gap-2 w-full max-w-xs">
        <input type="number" inputMode="numeric" placeholder="BPM..." value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")submit()}}
          className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-lg text-center outline-none"
          style={{backgroundColor:"rgba(255,255,255,.1)",border:"2px solid rgba(255,255,255,.15)"}}/>
        <button onClick={submit} className="py-3 px-5 rounded-xl text-white font-bold text-lg hover:scale-105 active:scale-95 transition-transform" style={{background:mode.btn,opacity:input?"1":".4"}}>✓</button>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-amber-300 text-xs">Подсказка: потапай чтоб измерить</p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={tap} className="w-14 h-14 rounded-full text-white font-bold text-xs shadow-lg relative z-10" style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",transform:ta?"scale(.88)":"scale(1)",transition:"transform .08s"}}>TAP</button>
            <div key={rip} className="absolute inset-0 rounded-full" style={{border:"2px solid #f59e0b",animation:"ripple .6s ease-out forwards",opacity:0}}/>
          </div>
          {tapBpm!==null&&<>
            <div className="text-amber-400 font-bold">{tapBpm} <span className="text-xs text-amber-300">BPM</span></div>
            <button onClick={()=>setInput(String(tapBpm))} className="px-2 py-1 rounded-lg text-xs font-bold text-amber-200" style={{backgroundColor:"rgba(251,191,36,.15)",border:"1px solid rgba(251,191,36,.3)"}}>Вставить</button>
            <button onClick={()=>{setTaps([]);setTapBpm(null)}} className="text-amber-400 text-xs">↺</button>
          </>}
        </div>
      </div>
    </>}
    {res&&<div className="flex flex-col items-center gap-3" style={{animation:"slideUp .4s ease-out"}}>
      <div className="text-white text-lg">Цель: <span className="font-bold text-amber-400">{bRef.current} BPM</span></div>
      <div className="text-white text-lg">Ответ: <span className={"font-bold "+(res.ok?"text-green-400":"text-red-400")}>{res.userBpm} BPM</span></div>
      {res.ok?<div className="text-3xl" style={{animation:"popIn .3s ease-out"}}>✅ Точно!</div>
        :<div className="flex flex-col items-center gap-1"><div className="text-3xl" style={{animation:"shake .4s ease"}}>❌</div>
          <div className="text-lg font-bold" style={{color:res.dir==="higher"?"#60a5fa":"#f472b6",animation:"popIn .3s ease-out"}}>{res.dir==="higher"?"⬆️ Больше! Темп быстрее":"⬇️ Меньше! Темп медленнее"}</div>
        </div>}
      <NextBtn onClick={startNew} color={mode.btn}/>
    </div>}
  </GWrap>;
}

/* ── KeyDetect ── */
function newKeyRound(diff){
  const root=pick(NOTES),isMin=diff==="easy"?false:Math.random()>.5;
  const label=root+(isMin?" min":" maj"),ct=isMin?MINOR:MAJOR,ri=NOTES.indexOf(root);
  const chords=[buildChord(root,3,ct),buildChord(NOTES[(ri+5)%12],3,isMin?MINOR:MAJOR),buildChord(NOTES[(ri+7)%12],3,MAJOR),buildChord(root,3,ct)];
  const pool=diff==="easy"?NOTES.map(k=>k+" maj"):NOTES.flatMap(k=>[k+" maj",k+" min"]);
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  return{ans:label,opts:pickOpts(label,pool,nOpts),chords,picked:null,nOpts};
}
function KeyMode({audio,dispatch,streak,diff}){
  const fb=useGameFB(streak,dispatch);
  const [r,setR]=useState(()=>newKeyRound(diff));const [lk,setLk]=useState(false);const mode=MODES[3];
  return <GWrap {...fb} streak={streak}>
    <span style={{fontSize:40}}>🎹</span>
    <h2 className="text-lg font-bold text-white">Какая тональность?</h2>
    <Btn onClick={()=>audio.playProgression(r.chords,.7)} label="🔊 Послушать" color={mode.btn}/>
    <OptGrid opts={r.opts} picked={r.picked} ans={r.ans} locked={lk} onPick={v=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));v===r.ans?fb.onOk():fb.onBad()}} cols={r.nOpts>4?3:2}/>
    {lk&&<NextBtn onClick={()=>{const n=newKeyRound(diff);setR(n);setLk(false);fb.reset();setTimeout(()=>audio.playProgression(n.chords,.7),100)}} color={mode.btn}/>}
  </GWrap>;
}

/* ── Mode Wrapper ── */
function ModeScreen({modeId,audio,dispatch,streak}){
  const tut=useTutorial(modeId);const [diff,setDiff]=useState(null);
  if(!tut.ready)return null;
  if(tut.show)return <TutorialDialog modeId={modeId} onStart={tut.dismiss} onSkip={tut.skip} audio={audio}/>;
  if(!diff)return <DiffPicker modeId={modeId} onPick={setDiff}/>;
  const C={noteId:NoteIdMode,intervals:IntervalsMode,bpm:BpmMode,key:KeyMode}[modeId];
  return <C audio={audio} dispatch={dispatch} streak={streak} diff={diff}/>;
}

/* ── Menu ── */
function Menu({dispatch,stats,bestStreak}){
  const total=Object.values(stats).reduce((a,s)=>a+s.total,0),ok=Object.values(stats).reduce((a,s)=>a+s.ok,0),pct=total>0?Math.round(ok/total*100):0;
  return <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 pb-8" style={{animation:"fadeIn .4s"}}>
    <h2 className="text-2xl font-bold text-white mb-1">Выбери режим</h2>
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
      {MODES.map((m,idx)=>{const s=stats[m.id]||{ok:0,total:0},mp=s.total>0?Math.round(s.ok/s.total*100):0;
        return <button key={m.id} onClick={()=>dispatch({type:"GO",screen:m.id})} className={`rounded-2xl p-4 flex flex-col items-center gap-1 bg-gradient-to-br ${m.gr} hover:scale-105 active:scale-95 transition-transform shadow-lg`} style={{animation:`slideUp ${.3+idx*.08}s ease-out`}}>
          <span style={{fontSize:36}}>{m.icon}</span><span className="text-white font-bold text-sm">{m.name}</span>
          <span className="text-white text-xs" style={{opacity:.7}}>{m.desc}</span>
          {s.total>0&&<div className="w-full mt-1"><div className="w-full h-1.5 rounded-full overflow-hidden" style={{backgroundColor:"rgba(255,255,255,.2)"}}><div className="h-full rounded-full" style={{width:`${mp}%`,backgroundColor:"rgba(255,255,255,.7)",transition:"width .5s"}}/></div>
            <span className="text-white text-xs mt-0.5 block" style={{opacity:.6}}>{mp}% · {s.ok}/{s.total}</span></div>}
        </button>;
      })}
    </div>
    {total>0&&<div className="mt-2 text-center" style={{animation:"fadeIn .5s"}}>
      <div className="text-purple-300 text-sm">Общий счёт: {ok}/{total} ({pct}%)</div>
      <div className="text-purple-400 text-xs mt-1">🔥 Лучший стрик: {bestStreak}</div>
    </div>}
  </div>;
}

export default function App(){
  const [st,dispatch]=useReducer(reducer,initState);const audio=useAudio();const prevRef=useRef(null);
  useEffect(()=>{loadP().then(d=>{if(d)dispatch({type:"LOAD",data:d});else dispatch({type:"LOADED"})})},[]);
  useEffect(()=>{if(!st.loaded)return;const{screen,loaded,lvlUp,...save}=st;const k=JSON.stringify(save);if(prevRef.current!==k){prevRef.current=k;saveP(save)}},[st]);
  let content;
  if(st.screen==="menu")content=<Menu dispatch={dispatch} stats={st.stats} bestStreak={st.bestStreak}/>;
  else content=<ModeScreen modeId={st.screen} audio={audio} dispatch={dispatch} streak={st.streak}/>;
  return <div className="min-h-screen flex flex-col" style={{background:"linear-gradient(135deg,#1e1b4b 0%,#0f0a2e 50%,#1a0a2e 100%)"}}>
    <Header state={st} dispatch={dispatch}/>{content}
    {st.lvlUp&&<LevelUp level={st.level} onDone={()=>dispatch({type:"CLR_LVL"})}/>}
  </div>;
}
