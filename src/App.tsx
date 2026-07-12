import { useReducer, useRef, useCallback, useState, useEffect, createContext, useContext } from "react";

// ─── Music constants ───────────────────────────────────────────────────────────
const NOTES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const NAT_NOTES=["C","D","E","F","G","A","B"];
// Interval sets per language (same semitone counts, different abbreviations)
const INTERVALS={
  ua:[
    {name:"м2",st:1},{name:"б2",st:2},{name:"м3",st:3},{name:"б3",st:4},
    {name:"ч4",st:5},{name:"тт",st:6},{name:"ч5",st:7},{name:"м6",st:8},
    {name:"б6",st:9},{name:"м7",st:10},{name:"б7",st:11},{name:"окт",st:12},
  ],
  en:[
    {name:"m2",st:1},{name:"M2",st:2},{name:"m3",st:3},{name:"M3",st:4},
    {name:"P4",st:5},{name:"TT",st:6},{name:"P5",st:7},{name:"m6",st:8},
    {name:"M6",st:9},{name:"m7",st:10},{name:"M7",st:11},{name:"oct",st:12},
  ],
};
const EASY_IV=[1,3,4,7,12]; // semitone counts for easy difficulty
type Dir="asc"|"desc"|"harm";
const ALL_DIRS:Dir[]=["asc","desc","harm"];
const MAJOR=[0,4,7],MINOR=[0,3,7];
const XP_PER_LEVEL=200;

// Structural mode/diff data — text comes from translations
const MODES_META=[
  {id:"noteId", icon:"🎵",gr:"from-violet-500 to-purple-600",btn:"linear-gradient(135deg,#7c3aed,#6d28d9)"},
  {id:"intervals",icon:"🎼",gr:"from-cyan-500 to-blue-600",  btn:"linear-gradient(135deg,#0891b2,#0e7490)"},
  {id:"bpm",     icon:"🥁", gr:"from-amber-500 to-orange-600",btn:"linear-gradient(135deg,#d97706,#b45309)"},
  {id:"key",     icon:"🎹", gr:"from-emerald-500 to-green-600",btn:"linear-gradient(135deg,#059669,#047857)"},
];
const DIFFS_META=[
  {id:"easy",  emoji:"🟢"},
  {id:"medium",emoji:"🟡"},
  {id:"hard",  emoji:"🔴"},
];

// ─── i18n ──────────────────────────────────────────────────────────────────────
const T={
  ua:{
    modes:{
      noteId:{name:"Note ID",desc:"Вгадай ноту"},
      intervals:{name:"Intervals",desc:"Визнач інтервал"},
      bpm:{name:"BPM Tap",desc:"Злови темп"},
      key:{name:"Key Detect",desc:"Знайди тональність"},
    },
    diffs:{
      easy:{  label:"Легко",  noteId:"7 нот, 3 варіанти",   intervals:"5 інтервалів, 3 варіанти", bpm:"60–120, допуск ±12%",key:"Лише мажор, 3 варіанти"},
      medium:{label:"Середньо",noteId:"12 нот, 4 варіанти",  intervals:"12 інтервалів, 4 варіанти",bpm:"60–180, допуск ±8%", key:"Мажор + мінор, 4 варіанти"},
      hard:{  label:"Складно",noteId:"12 нот, 2 октави, 6 варіантів",intervals:"12 інтервалів, 6 варіантів",bpm:"40–200, допуск ±5%",key:"Мажор + мінор, 6 варіантів"},
    },
    ui:{
      chooseMode:"Обери режим",chooseDiff:"Обери складність",
      listen:"🔊 Слухати",listenA4:"🔊 Послухати A4 (440 Гц)",
      next:"Далі →",back:"← Назад",startPlay:"🎮 Грати!",dontShow:"Більше не показувати",
      total:"Загальний рахунок",bestStreak:"🔥 Кращий стрік",levelUpSub:"Продовжуй у тому ж дусі",
      tapHint:"Підказка: потапай щоб виміряти",tapInsert:"Вставити",tapClear:"Очистити",
      target:"Ціль",answer:"Відповідь",correct:"✅ Точно!",
      higher:"⬆️ Більше! Темп швидший",lower:"⬇️ Менше! Темп повільніший",
      playMajor:"♩ Мажор",playMinor:"♩ Мінор",playCadence:"🔊 I-IV-V-I",
      tapToClose:"(натисни щоб закрити)",
      enterNickname:"Нікнейм",enterPassword:"Пароль (необов'язково)",
      loginBtn:"Увійти / Зареєструватись",wrongPassword:"Невірний пароль",
      nicknameRequired:"Введи нікнейм",
      leaderboard:"Таблиця лідерів",noEntries:"Поки немає записів",
      accuracy:"Точність",close:"Закрити",logout:"Вийти",
      dirAsc:"↑ Висхідний",dirDesc:"↓ Спадний",dirHarm:"♩ Гармонічний",volume:"Гучність",
    },
    questions:{noteId:"Яка це нота?",intervals:"Який інтервал?",bpm:"Який темп?",key:"Яка тональність?"},
    streakMsgs:["","","Непогано!","Вогонь!","Майстер!","На хвилі!","Неймовірно!","Легенда!","GODLIKE!","UNSTOPPABLE!"],
    tutorials:{
      noteId:{title:"🎵 Як вгадувати ноти",steps:[
        {icon:"🎯",text:"Знайди опорну ноту. Запам'ятай як звучить A4 (440 Гц). Натисни A4 і запам'ятай цей звук.",hasA4:true},
        {icon:"🔊",text:"Слухай «характер» ноти. Низькі (C, D) — тепло і глибоко. Високі (A#, B) — яскраво і напружено."},
        {icon:"🎹",text:"C# трохи вище C, але нижче D. Дієзи завжди «між» — шукай відчуття проміжку."},
        {icon:"🧠",text:"Співай! Спробуй проспівати почуту ноту. Голос «сідає» легко — знайшов правильну висоту."},
      ]},
      intervals:{title:"🎼 Як чути інтервали",steps:[
        {icon:"🎬",text:"Секунди. м2 (пів тону) — «Jaws» (тема акули, ре–ре#): дуже тісно, тривожно, хроматика. б2 (тон) — «Happy Birthday» перші дві ноти, крок по гамі: природно, спокійно."},
        {icon:"🎶",text:"Терції — найемоційніші. м3 — «Smoke on the Water» (рифф), «Greensleeves»: сумно, меланхолійно. б3 — «Oh When the Saints», перший стрибок у «Happy Birthday»: радісно, тепло."},
        {icon:"🎯",text:"Кварта і тритон. ч4 — «Here Comes the Bride», «Amazing Grace» (перший стрибок): чиста, стійка, «пуста». тт — «The Simpsons» тема, «Maria» (West Side Story): нестабільна, тривожна."},
        {icon:"⭐",text:"Квінта і сексти. ч5 — «Star Wars», «Twinkle Twinkle» (1→5): порожня, героїчна. м6 — «The Entertainer» (Joplin): ніжна, трохи сумна. б6 — «My Way» (Sinatra): широка, піднесена."},
        {icon:"🌊",text:"Септими й октава. м7 — «Somewhere» (West Side Story): романтична, напружена. б7 — «Take on Me» (A-ha): дуже широка, прагне вгору. окт — «Somewhere Over the Rainbow»: тріумфальний стрибок, максимальна дистанція."},
        {icon:"💡",text:"Наспівуй! Голос — найкращий тренажер. Починай від знайомої ноти (A4). Нисхідні важчі: «My Bonnie» стартує з нисхідної б6. Якщо сумніваєшся між ч4 і тт — це всього пів тону різниці, вчуйся у стабільність."},
      ]},
      bpm:{title:"🥁 Як ловити темп",steps:[
        {icon:"💓",text:"60 BPM = секунда (пульс у спокої). 120 — швидкий крок. 180 — біг."},
        {icon:"🦶",text:"Тупай або кивай в ритм. Тіло запам'ятовує темп краще голови."},
        {icon:"⏱️",text:"TAP — підказка. Потапай і подивись підрахований BPM."},
        {icon:"📐",text:"Помилки: подвоєння і половинення. Результат ×2 або ÷2 — ти в іншій сітці."},
      ]},
      key:{title:"🎹 Як визначати тональність",steps:[
        {icon:"😊",text:"Мажор — яскраво, «сонячно». Мінор — темніше, «дощово».",hasMajMin:true},
        {icon:"👂",text:"Останній акорд — «дім». Яка нота = «дім»? Це тональність."},
        {icon:"🎵",text:"Співай тоніку! Проспівай найбільш «стійку» ноту після прослуховування."},
        {icon:"🔄",text:"I-IV-V-I: IV іде, V напружує, I вирішує. Фокус на вирішенні.",hasCadence:true},
      ]},
    },
  },
  en:{
    modes:{
      noteId:{name:"Note ID",desc:"Guess the note"},
      intervals:{name:"Intervals",desc:"Identify the interval"},
      bpm:{name:"BPM Tap",desc:"Catch the tempo"},
      key:{name:"Key Detect",desc:"Find the key"},
    },
    diffs:{
      easy:{  label:"Easy",  noteId:"7 notes, 3 options",   intervals:"5 intervals, 3 options", bpm:"60–120, tolerance ±12%",key:"Major only, 3 options"},
      medium:{label:"Medium",noteId:"12 notes, 4 options",  intervals:"12 intervals, 4 options",bpm:"60–180, tolerance ±8%", key:"Major + minor, 4 options"},
      hard:{  label:"Hard",  noteId:"12 notes, 2 octaves, 6 options",intervals:"12 intervals, 6 options",bpm:"40–200, tolerance ±5%",key:"Major + minor, 6 options"},
    },
    ui:{
      chooseMode:"Choose mode",chooseDiff:"Choose difficulty",
      listen:"🔊 Listen",listenA4:"🔊 Listen to A4 (440 Hz)",
      next:"Next →",back:"← Back",startPlay:"🎮 Play!",dontShow:"Don't show again",
      total:"Total score",bestStreak:"🔥 Best streak",levelUpSub:"Keep it up!",
      tapHint:"Hint: tap to measure tempo",tapInsert:"Use",tapClear:"Clear",
      target:"Target",answer:"Answer",correct:"✅ Spot on!",
      higher:"⬆️ Higher! Tempo is faster",lower:"⬇️ Lower! Tempo is slower",
      playMajor:"♩ Major",playMinor:"♩ Minor",playCadence:"🔊 I-IV-V-I",
      tapToClose:"(tap to close)",
      enterNickname:"Nickname",enterPassword:"Password (optional)",
      loginBtn:"Log In / Register",wrongPassword:"Wrong password",
      nicknameRequired:"Enter a nickname",
      leaderboard:"Leaderboard",noEntries:"No entries yet",
      accuracy:"Accuracy",close:"Close",logout:"Log out",
      dirAsc:"↑ Ascending",dirDesc:"↓ Descending",dirHarm:"♩ Harmonic",volume:"Volume",
    },
    questions:{noteId:"What note is this?",intervals:"What interval?",bpm:"What's the tempo?",key:"What key is this?"},
    streakMsgs:["","","Not bad!","On fire!","Master!","In the zone!","Incredible!","Legend!","GODLIKE!","UNSTOPPABLE!"],
    tutorials:{
      noteId:{title:"🎵 How to identify notes",steps:[
        {icon:"🎯",text:"Find an anchor note. Memorize how A4 (440 Hz) sounds. Press A4 and remember that sound.",hasA4:true},
        {icon:"🔊",text:"Listen to the note's 'character'. Low (C, D) — warm and deep. High (A#, B) — bright and tense."},
        {icon:"🎹",text:"C# is just above C but below D. Sharps are always 'between' — feel the gap."},
        {icon:"🧠",text:"Sing it! Try singing the note you heard. Voice lands easily — you found the right pitch."},
      ]},
      intervals:{title:"🎼 How to hear intervals",steps:[
        {icon:"🎬",text:"Seconds. m2 (half step) — 'Jaws' shark theme (D–D#): creepy, tense, chromatic. M2 (whole step) — first two notes of 'Happy Birthday': natural, stepwise, calm."},
        {icon:"🎶",text:"Thirds — the most emotional. m3 — 'Smoke on the Water' riff, 'Greensleeves': sad, dark, minor color. M3 — 'Oh When the Saints', first leap in 'Happy Birthday': joyful, warm, major color."},
        {icon:"🎯",text:"Fourth & tritone. P4 — 'Here Comes the Bride', opening of 'Amazing Grace': pure, strong, resolved. TT — 'The Simpsons' theme, 'Maria' (West Side Story): unstable, tense, wants to move."},
        {icon:"⭐",text:"Fifth & sixths. P5 — 'Star Wars', 'Twinkle Twinkle' (note 1→5): open, heroic, hollow. m6 — 'The Entertainer' (Joplin): gentle, wistful. M6 — 'My Way' (Sinatra): wide, soaring, triumphant."},
        {icon:"🌊",text:"Sevenths & octave. m7 — 'Somewhere' (West Side Story): romantic, expansive. M7 — 'Take on Me' (A-ha): very wide, unstable, reaching upward. oct — 'Somewhere Over the Rainbow': maximum distance, triumphant leap."},
        {icon:"💡",text:"Sing every interval — your voice is the best ear-training tool! Anchor from A4. Descending intervals are harder: 'My Bonnie Lies Over the Ocean' opens with a descending M6. When unsure between P4 and TT — it's just a half step; feel the stability."},
      ]},
      bpm:{title:"🥁 How to catch the tempo",steps:[
        {icon:"💓",text:"60 BPM = 1 second (resting pulse). 120 — brisk walk. 180 — running."},
        {icon:"🦶",text:"Tap your foot or nod along. Your body remembers tempo better than your mind."},
        {icon:"⏱️",text:"TAP is a hint — tap along and see the calculated BPM."},
        {icon:"📐",text:"Common errors: doubling/halving. Result ×2 or ÷2 means you're in a different grid."},
      ]},
      key:{title:"🎹 How to identify keys",steps:[
        {icon:"😊",text:"Major — bright, 'sunny'. Minor — darker, 'rainy'.",hasMajMin:true},
        {icon:"👂",text:"The last chord is 'home'. Which note feels like 'home'? That's the key."},
        {icon:"🎵",text:"Sing the tonic! After listening, sing the most 'stable' note you feel."},
        {icon:"🔄",text:"I-IV-V-I: IV departs, V creates tension, I resolves. Focus on the resolution.",hasCadence:true},
      ]},
    },
  },
};

type Lang="ua"|"en";
const LangCtx=createContext({lang:"ua" as Lang,setLang:(_l:Lang)=>{}});
function useT(){const {lang}=useContext(LangCtx);return T[lang];}
function useLang(){return useContext(LangCtx);}

// ─── CSS Animations ────────────────────────────────────────────────────────────
const CSS=`
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes popIn{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes flashGreen{0%{background-color:rgba(22,163,74,.35)}100%{background-color:transparent}}
@keyframes flashRed{0%{background-color:rgba(220,38,38,.25)}100%{background-color:transparent}}
@keyframes streakPulse{0%{transform:scale(1)}50%{transform:scale(1.5)}100%{transform:scale(1)}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-70px) scale(1.3)}}
@keyframes lvlUp{0%{transform:scale(0) rotate(-10deg);opacity:0}50%{transform:scale(1.2) rotate(3deg);opacity:1}75%{transform:scale(.97)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes lvlUpExit{0%{transform:scale(1);opacity:1}100%{transform:scale(1.1);opacity:0}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(167,139,250,.3)}50%{box-shadow:0 0 24px rgba(167,139,250,.7)}}
@keyframes slideUp{0%{transform:translateY(30px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
@keyframes fadeOut{0%{opacity:1}100%{opacity:0}}
@keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.5);opacity:0}}
`;
const audioVol={v:parseFloat(localStorage.getItem("earforge-vol")||"1")};

// ─── random.org buffer ─────────────────────────────────────────────────────────
// Fills a buffer with true random floats [0,1) from random.org.
// Falls back to Math.random() silently when the buffer is empty or request fails.
const randBuf={
  vals:[] as number[],
  busy:false,
  fill(){
    if(this.busy||this.vals.length>30)return;
    this.busy=true;
    fetch("https://www.random.org/integers/?num=100&min=0&max=999999&col=1&base=10&format=plain&rnd=new")
      .then(r=>r.ok?r.text():Promise.reject())
      .then(t=>{this.vals.push(...t.trim().split("\n").map(n=>parseInt(n)/1000000))})
      .catch(()=>{}) // silent fallback to Math.random()
      .finally(()=>{this.busy=false});
  },
  get():number{
    if(this.vals.length<20)this.fill();
    return this.vals.length>0?this.vals.pop()!:Math.random();
  },
};

// ─── Web Audio Engine (Safari-safe) ────────────────────────────────────────────
function midiFromNote(name){
  const m=name.match(/^([A-G]#?)(\d)$/);
  if(!m)return 69;
  return 12*(parseInt(m[2])+1)+NOTES.indexOf(m[1]);
}
function freqFromMidi(midi){return 440*Math.pow(2,(midi-69)/12);}
function freqFromNote(name){return freqFromMidi(midiFromNote(name));}

function useAudio(){
  const ctxRef=useRef<AudioContext|null>(null);
  const activeRef=useRef<{osc:OscillatorNode,gain:GainNode}[]>([]);

  // Async: creates context if needed, awaits resume().
  // iOS Safari requires resume() to fully resolve before scheduling any audio.
  // Also plays a 1-sample silent buffer on first creation to unlock the iOS audio session.
  const ensureCtx=useCallback(async()=>{
    const AC=window.AudioContext||(window as any).webkitAudioContext;
    if(!ctxRef.current||ctxRef.current.state==="closed"){
      ctxRef.current=new AC();
      // iOS unlock: playing a silent buffer forces the audio session to activate,
      // so subsequent oscillator scheduling actually produces sound.
      try{
        const buf=ctxRef.current.createBuffer(1,1,ctxRef.current.sampleRate);
        const src=ctxRef.current.createBufferSource();
        src.buffer=buf;src.connect(ctxRef.current.destination);src.start(0);
      }catch(e){}
    }
    if(ctxRef.current.state!=="running")await ctxRef.current.resume();
    return ctxRef.current;
  },[]);

  // stopAll is sync: just fades out whatever is playing, no context creation.
  const stopAll=useCallback(()=>{
    if(!ctxRef.current)return;
    const now=ctxRef.current.currentTime;
    activeRef.current.forEach(n=>{
      try{n.gain.gain.cancelScheduledValues(now);n.gain.gain.setValueAtTime(n.gain.gain.value,now);n.gain.gain.linearRampToValueAtTime(0,now+0.05);}catch(e){}
    });
    activeRef.current=[];
  },[]);

  // Internal tone scheduler — receives already-running ctx
  const _tone=useCallback((ctx:AudioContext,freq:number,t:number,dur:number,vol=0.3)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type="triangle";
    osc.frequency.setValueAtTime(freq,t);
    gain.gain.setValueAtTime(0,t);
    gain.gain.linearRampToValueAtTime(vol*audioVol.v,t+0.015);
    gain.gain.setValueAtTime(vol*audioVol.v,t+dur*0.7);
    gain.gain.linearRampToValueAtTime(0,t+dur);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(t);osc.stop(t+dur+0.1);
    activeRef.current.push({gain,osc});
    osc.onended=()=>{activeRef.current=activeRef.current.filter(n=>n.osc!==osc);};
  },[]);

  const _click=useCallback((ctx:AudioContext,t:number,vol=0.4)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type="square";osc.frequency.setValueAtTime(1000,t);
    gain.gain.setValueAtTime(vol*audioVol.v,t);gain.gain.linearRampToValueAtTime(0,t+0.03);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(t);osc.stop(t+0.05);
  },[]);

  // Public API — all async so iOS resume() is awaited before scheduling.
  // 0.15s offset ensures notes are never "in the past" on a fresh iOS context.
  const playNote=useCallback(async(note:string,dur=0.4)=>{
    stopAll();const ctx=await ensureCtx();
    _tone(ctx,freqFromNote(note),ctx.currentTime+0.15,dur);
  },[stopAll,ensureCtx,_tone]);

  // del<dur overlaps note2 attack with note1 release tail (independent gain envelopes
  // from _tone) -> audible crossfade instead of a silent gap between the two notes.
  const playInterval=useCallback(async(n1:string,n2:string,del=0.34)=>{
    stopAll();const ctx=await ensureCtx(),t=ctx.currentTime+0.15;
    _tone(ctx,freqFromNote(n1),t,0.4);_tone(ctx,freqFromNote(n2),t+del,0.4);
  },[stopAll,ensureCtx,_tone]);

  const playMetronome=useCallback(async(bpm:number,beats=8)=>{
    stopAll();const ctx=await ensureCtx(),t=ctx.currentTime+0.15,iv=60/bpm;
    for(let i=0;i<beats;i++)_click(ctx,t+i*iv);
  },[stopAll,ensureCtx,_click]);

  const playProgression=useCallback(async(chords:string[][],tempo=0.7)=>{
    stopAll();const ctx=await ensureCtx(),t=ctx.currentTime+0.15;
    chords.forEach((ch,i)=>ch.forEach(n=>_tone(ctx,freqFromNote(n),t+i*tempo,0.55,0.2)));
  },[stopAll,ensureCtx,_tone]);

  const playHarmonic=useCallback(async(n1:string,n2:string)=>{
    stopAll();const ctx=await ensureCtx(),t=ctx.currentTime+0.15;
    _tone(ctx,freqFromNote(n1),t,0.6,0.25);_tone(ctx,freqFromNote(n2),t,0.6,0.25);
  },[stopAll,ensureCtx,_tone]);

  return{playNote,playInterval,playHarmonic,playMetronome,playProgression,stopAll};
}

// ─── Storage ───────────────────────────────────────────────────────────────────
const SK="earforge-progress",TK="earforge-tut-skip";
async function loadP(){try{const v=localStorage.getItem(SK);return v?JSON.parse(v):null}catch{return null}}
async function saveP(d:unknown){try{localStorage.setItem(SK,JSON.stringify(d))}catch{}}
async function loadSkips(){try{const v=localStorage.getItem(TK);return v?JSON.parse(v):{}}catch{return{}}}
async function saveSkips(d:unknown){try{localStorage.setItem(TK,JSON.stringify(d))}catch{}}

// ─── Profile Storage ────────────────────────────────────────────────────────────
const PK2="earforge-profiles",UK="earforge-active-user";
type ProfileData={password:string,xp:number,level:number,streak:number,bestStreak:number,stats:{[k:string]:{ok:number,total:number}}};
async function loadProfiles():Promise<{[k:string]:ProfileData}>{try{const v=localStorage.getItem(PK2);return v?JSON.parse(v):{}}catch{return{}}}
async function saveProfiles(d:{[k:string]:ProfileData}){try{localStorage.setItem(PK2,JSON.stringify(d))}catch{}}
function getActiveUser():string|null{return localStorage.getItem(UK);}
function setActiveUser(n:string|null){if(n)localStorage.setItem(UK,n);else localStorage.removeItem(UK);}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(a:T[]):T[]{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(randBuf.get()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function pickOpts(c:string,pool:string[],n=4){const s=new Set([c]);for(const x of shuffle(pool.filter(v=>v!==c))){if(s.size>=n)break;s.add(x)}return shuffle([...s])}
function noteAt(r:string,o:number,semi:number){const i=NOTES.indexOf(r)+semi;return NOTES[i%12]+(o+Math.floor(i/12))}
function getMult(s:number){return s>=9?5:s>=5?3:s>=2?2:1}
function buildChord(r:string,o:number,p:number[]){return p.map(s=>noteAt(r,o,s))}
function randInt(a:number,b:number){return Math.floor(randBuf.get()*(b-a+1))+a}
function pick<T>(arr:T[]):T{return arr[Math.floor(randBuf.get()*arr.length)]}

// ─── Reducer ───────────────────────────────────────────────────────────────────
const initState={screen:"login",nickname:"",xp:0,level:1,streak:0,bestStreak:0,
  stats:{noteId:{ok:0,total:0},intervals:{ok:0,total:0},bpm:{ok:0,total:0},key:{ok:0,total:0}},
  loaded:false,lvlUp:false};

function reducer(st:typeof initState,a:any){
  switch(a.type){
    case "GO":return{...st,screen:a.screen};
    case "LOAD":return{...a.data,screen:"menu",loaded:true,lvlUp:false};
    case "LOADED":return{...st,loaded:true};
    case "CORRECT":{
      const m=getMult(st.streak),xp=st.xp+10*m,ns=st.streak+1,nl=Math.floor(xp/XP_PER_LEVEL)+1;
      const mode=st.screen,ms=(st.stats as any)[mode]||{ok:0,total:0};
      return{...st,xp,level:nl,streak:ns,bestStreak:Math.max(st.bestStreak,ns),
        stats:{...st.stats,[mode]:{ok:ms.ok+1,total:ms.total+1}},lvlUp:nl>st.level};
    }
    case "WRONG":{const mode=st.screen,ms=(st.stats as any)[mode]||{ok:0,total:0};
      return{...st,streak:0,stats:{...st.stats,[mode]:{ok:ms.ok,total:ms.total+1}},lvlUp:false};}
    case "CLR_LVL":return{...st,lvlUp:false};
    case "SET_USER":return{...st,...(a.data||{}),nickname:a.nickname,screen:"menu",loaded:true,lvlUp:false};
    case "LOGOUT":{setActiveUser(null);return{...initState,screen:"login",loaded:true};}
    default:return st;
  }
}

// ─── Shared Components ─────────────────────────────────────────────────────────
function Particles({trigger}:{trigger:number}){
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

function LevelUp({level,onDone}:{level:number,onDone:()=>void}){
  const t=useT();
  const [exiting,setExiting]=useState(false);
  const canDismiss=useRef(false);

  useEffect(()=>{
    // Allow manual dismiss after 1.5s; auto-dismiss after 5s
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

function LangToggle(){
  const {lang,setLang}=useLang();
  return(
    <button
      onClick={()=>setLang(lang==="ua"?"en":"ua")}
      className="px-2 py-1 rounded-lg text-xs font-bold"
      style={{backgroundColor:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.3)",color:"#c4b5fd"}}
    >{lang==="ua"?"EN":"UA"}</button>
  );
}

function A4Btn({audio,size="sm"}:{audio:ReturnType<typeof useAudio>,size?:"sm"|"lg"}){
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

function XpBar({xp,level}:{xp:number,level:number}){
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

function Header({state,dispatch}:{state:typeof initState,dispatch:React.Dispatch<any>}){
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

function FloatXp({xp,id}:{xp:number,id:number}){
  return <div key={id} className="absolute text-amber-400 font-bold pointer-events-none"
    style={{animation:"floatUp .9s ease-out forwards",top:"25%",left:"50%",marginLeft:-20,fontSize:20}}>+{xp} XP</div>;
}

function useGameFB(streak:number,dispatch:React.Dispatch<any>){
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
      setFlash("correct");setPtrig(p=>p+1);dispatch({type:"CORRECT"});
    },[streak,dispatch]),
    onBad:useCallback(()=>{setFlash("wrong");dispatch({type:"WRONG"});},[dispatch]),
    reset:useCallback(()=>setFlash(null),[]),
  };
}

// Keyboard shortcuts: Space=replay, Enter=next/submit. Uses refs so callbacks are always fresh.
function useGameKeys(onSpace:()=>void,onEnter:()=>void){
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

function GWrap({flash,floats,sPop,ptrig,streak,children}:any){
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

function Btn({onClick,label,color}:{onClick:()=>void,label:string,color:string}){
  return <button onClick={onClick} className="px-8 py-3 rounded-2xl text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-transform" style={{background:color}}>{label}</button>;
}
function NextBtn({onClick,color}:{onClick:()=>void,color:string}){
  const t=useT();
  return <button onClick={onClick} className="mt-1 px-8 py-3 rounded-2xl text-white font-bold hover:scale-105 active:scale-95 transition-transform" style={{background:color,animation:"popIn .3s ease-out"}}>{t.ui.next}</button>;
}
function OptGrid({opts,picked,ans,locked,onPick,cols=2}:any){
  // Digit keys 1-9 pick the corresponding option -> faster reps than mouse/tap.
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
        return <button key={o} onClick={()=>onPick(o)} className="relative py-3 rounded-xl text-white font-bold text-base hover:bg-white hover:bg-opacity-20"
          style={{backgroundColor:bg,animation:anim,border:brd,transition:"background-color .2s"}}>
          <span className="absolute top-1 left-2 text-[10px] opacity-40">{i+1}</span>{o}</button>;
      })}
    </div>
  );
}

// ─── Difficulty Picker ──────────────────────────────────────────────────────────
function DiffPicker({modeId,onPick}:{modeId:string,onPick:(d:string)=>void}){
  const t=useT();
  const meta=MODES_META.find(m=>m.id===modeId)!;
  const tMode=(t.modes as any)[modeId];
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5 pb-8" style={{animation:"fadeIn .3s"}}>
      <style>{CSS}</style>
      <span style={{fontSize:48}}>{meta.icon}</span>
      <h2 className="text-xl font-bold text-white">{tMode.name}</h2>
      <p className="text-purple-300 text-sm">{t.ui.chooseDiff}</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {DIFFS_META.map(d=>{
          const td=(t.diffs as any)[d.id];
          return(
            <button key={d.id} onClick={()=>onPick(d.id)}
              className="flex items-center gap-3 p-4 rounded-xl text-left hover:scale-[1.02] active:scale-95 transition-transform"
              style={{backgroundColor:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)"}}>
              <span style={{fontSize:24}}>{d.emoji}</span>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">{td.label}</div>
                <div className="text-purple-300 text-xs">{(td as any)[modeId]}</div>
              </div>
              <span className="text-purple-400">→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tutorial ──────────────────────────────────────────────────────────────────
function TutorialDialog({modeId,onStart,onSkip,audio}:{modeId:string,onStart:()=>void,onSkip:()=>void,audio:ReturnType<typeof useAudio>}){
  const t=useT();
  const tut=(t.tutorials as any)[modeId];
  const [step,setStep]=useState(0);
  const last=step>=tut.steps.length-1;
  const s=tut.steps[step];

  // Key tutorial: example chord playback
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
          {/* NoteId: A4 reference */}
          {s.hasA4&&<div className="flex justify-center"><A4Btn audio={audio} size="lg"/></div>}
          {/* Key: major vs minor comparison */}
          {s.hasMajMin&&(
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={playMaj} className="px-4 py-2 rounded-xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}}>{t.ui.playMajor}</button>
              <button onClick={playMin} className="px-4 py-2 rounded-xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#0891b2,#0e7490)"}}>{t.ui.playMinor}</button>
            </div>
          )}
          {/* Key: cadence example */}
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

function useTutorial(modeId:string){
  const [show,setShow]=useState(false),[ready,setReady]=useState(false);
  useEffect(()=>{let m=true;loadSkips().then(s=>{if(m){if(!(s as any)[modeId])setShow(true);setReady(true);}});return()=>{m=false;};},[modeId]);
  return{
    show,ready,
    dismiss:useCallback(()=>setShow(false),[]),
    skip:useCallback(()=>{setShow(false);loadSkips().then(s=>saveSkips({...(s as any),[modeId]:true}));},[modeId]),
  };
}

// ─── Game Modes ────────────────────────────────────────────────────────────────
function NoteIdMode({audio,dispatch,streak,diff}:any){
  const t=useT();const fb=useGameFB(streak,dispatch);
  const pool=diff==="easy"?NAT_NOTES:NOTES;
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  const octs=diff==="hard"?[3,4,5]:[4];
  const lastAnsRef=useRef<string|null>(null);
  const newR=()=>{const fp=lastAnsRef.current?pool.filter(x=>x!==lastAnsRef.current):pool;const a=pick(fp.length>0?fp:pool),o=pick(octs);lastAnsRef.current=a;return{ans:a,opts:pickOpts(a,pool,nOpts),note:a+o,picked:null};};
  const [r,setR]=useState(newR);const [lk,setLk]=useState(false);
  const rRef=useRef(r);rRef.current=r;
  const lkRef=useRef(lk);lkRef.current=lk;
  const meta=MODES_META[0];
  // Auto-play on mount
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
        onPick={(v:string)=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));v===r.ans?fb.onOk():fb.onBad();}}/>
      {lk&&<div className="flex flex-col items-center gap-2">
        <button onClick={()=>audio.playNote(r.note)} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>🔊 {t.ui.listen}</button>
        <NextBtn onClick={goNext} color={meta.btn}/>
      </div>}
    </GWrap>
  );
}

function IntervalsMode({audio,dispatch,streak,diff}:any){
  const t=useT();const fb=useGameFB(streak,dispatch);
  const {lang}=useLang();
  const allIntervals=INTERVALS[lang as "ua"|"en"]??INTERVALS.ua;
  const ivPool=diff==="easy"?allIntervals.filter(i=>EASY_IV.includes(i.st)):allIntervals;
  const names=ivPool.map(i=>i.name);
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  const lastAnsRef=useRef<string|null>(null);
  const newR=()=>{const fp=lastAnsRef.current?ivPool.filter(i=>i.name!==lastAnsRef.current):ivPool;const iv=pick(fp.length>0?fp:ivPool),root=pick(NOTES);lastAnsRef.current=iv.name;return{ans:iv.name,opts:pickOpts(iv.name,names,nOpts),n1:root+"4",n2:noteAt(root,4,iv.st),dir:pick(ALL_DIRS),picked:null};};
  const [r,setR]=useState(newR);const [lk,setLk]=useState(false);
  const rRef=useRef(r);rRef.current=r;
  const lkRef=useRef(lk);lkRef.current=lk;
  const playR=(round:typeof r)=>{
    if(round.dir==="harm")audio.playHarmonic(round.n1,round.n2);
    else if(round.dir==="desc")audio.playInterval(round.n2,round.n1);
    else audio.playInterval(round.n1,round.n2);
  };
  // On mount: auto-play. On lang change: reset round (skip on mount with ref).
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
        onPick={(v:string)=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));v===r.ans?fb.onOk():fb.onBad();}}/>
      {lk&&<div className="flex flex-col items-center gap-2">
        <button onClick={()=>playR(r)} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>🔊 {t.ui.listen}</button>
        <NextBtn onClick={goNext} color={meta.btn}/>
      </div>}
    </GWrap>
  );
}

function BpmMode({audio,dispatch,streak,diff}:any){
  const t=useT();const fb=useGameFB(streak,dispatch);
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
  const startNew=()=>{bRef.current=randInt(lo,hi);setInput("");setRes(null);clearTaps();fb.reset();audio.playMetronome(bRef.current,8);};
  const submit=()=>{
    const v=parseInt(input);if(!v||v<20||v>300)return;
    const ok=Math.abs(v-bRef.current)<=bRef.current*tol;
    setRes({ok,dir:v<bRef.current?"higher":v>bRef.current?"lower":"exact",userBpm:v});
    ok?fb.onOk():fb.onBad();
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
            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={tap} className="w-14 h-14 rounded-full text-white font-bold text-xs shadow-lg relative z-10"
                  style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",transform:ta?"scale(.88)":"scale(1)",transition:"transform .08s"}}>TAP</button>
                <div key={rip} className="absolute inset-0 rounded-full"
                  style={{border:"2px solid #f59e0b",animation:"ripple .6s ease-out forwards",opacity:0}}/>
              </div>
              {tapBpm!==null&&(
                <>
                  <div className="text-amber-400 font-bold">{tapBpm} <span className="text-xs text-amber-300">BPM</span></div>
                  <button onClick={()=>setInput(String(tapBpm))} className="px-2 py-1 rounded-lg text-xs font-bold text-amber-200"
                    style={{backgroundColor:"rgba(251,191,36,.15)",border:"1px solid rgba(251,191,36,.3)"}}>{t.ui.tapInsert}</button>
                </>
              )}
              {/* Clear button: visible whenever taps exist */}
              {taps.length>0&&(
                <button onClick={clearTaps} className="px-2 py-1 rounded-lg text-xs font-bold text-red-300"
                  style={{backgroundColor:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.3)"}}>{t.ui.tapClear}</button>
              )}
            </div>
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
          <NextBtn onClick={startNew} color={meta.btn}/>
        </div>
      )}
    </GWrap>
  );
}

function newKeyRound(diff:string,exclude:string|null=null){
  const keyPool=diff==="easy"?NOTES.map(k=>k+" maj"):NOTES.flatMap(k=>[k+" maj",k+" min"]);
  const nOpts=diff==="easy"?3:diff==="medium"?4:6;
  const fp=exclude?keyPool.filter(l=>l!==exclude):keyPool;
  const label=pick(fp.length>0?fp:keyPool);
  const isMin=label.endsWith(" min"),root=label.replace(/ (maj|min)$/,"");
  const ct=isMin?MINOR:MAJOR,ri=NOTES.indexOf(root);
  const chords=[buildChord(root,3,ct),buildChord(NOTES[(ri+5)%12],3,isMin?MINOR:MAJOR),buildChord(NOTES[(ri+7)%12],3,MAJOR),buildChord(root,3,ct)];
  return{ans:label,opts:pickOpts(label,keyPool,nOpts),chords,picked:null,nOpts};
}

function KeyMode({audio,dispatch,streak,diff}:any){
  const t=useT();const fb=useGameFB(streak,dispatch);
  const lastAnsRef=useRef<string|null>(null);
  const nextRound=useCallback(()=>{const n=newKeyRound(diff,lastAnsRef.current);lastAnsRef.current=n.ans;return n;},[diff]);
  const [r,setR]=useState(nextRound);const [lk,setLk]=useState(false);
  const rRef=useRef(r);rRef.current=r;
  const lkRef=useRef(lk);lkRef.current=lk;
  const meta=MODES_META[3];
  // Auto-play on mount
  useEffect(()=>{audio.playProgression(rRef.current.chords,.7);},[]);// eslint-disable-line
  const goNext=()=>{if(!lkRef.current)return;const n=nextRound();setR(n);setLk(false);fb.reset();setTimeout(()=>audio.playProgression(n.chords,.7),100);};// eslint-disable-line
  useGameKeys(()=>audio.playProgression(rRef.current.chords,.7),goNext);
  return(
    <GWrap {...fb} streak={streak}>
      <span style={{fontSize:40}}>🎹</span>
      <h2 className="text-lg font-bold text-white">{t.questions.key}</h2>
      <Btn onClick={()=>audio.playProgression(r.chords,.7)} label={t.ui.listen} color={meta.btn}/>
      <OptGrid opts={r.opts} picked={r.picked} ans={r.ans} locked={lk} cols={r.nOpts>4?3:2}
        onPick={(v:string)=>{if(lk)return;setLk(true);setR(p=>({...p,picked:v}));v===r.ans?fb.onOk():fb.onBad();}}/>
      {lk&&<div className="flex flex-col items-center gap-2">
        <button onClick={()=>audio.playProgression(r.chords,.7)} className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
          style={{backgroundColor:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)"}}>🔊 {t.ui.listen}</button>
        <NextBtn onClick={goNext} color={meta.btn}/>
      </div>}
    </GWrap>
  );
}

// ─── Mode Wrapper ──────────────────────────────────────────────────────────────
function ModeScreen({modeId,audio,dispatch,streak}:any){
  const tut=useTutorial(modeId);
  const [diff,setDiff]=useState<string|null>(null);
  if(!tut.ready)return null;
  if(tut.show)return <TutorialDialog modeId={modeId} onStart={tut.dismiss} onSkip={tut.skip} audio={audio}/>;
  if(!diff)return <DiffPicker modeId={modeId} onPick={setDiff}/>;
  const C:any={noteId:NoteIdMode,intervals:IntervalsMode,bpm:BpmMode,key:KeyMode}[modeId];
  return <C audio={audio} dispatch={dispatch} streak={streak} diff={diff}/>;
}

// ─── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({dispatch}:{dispatch:React.Dispatch<any>}){
  const t=useT();
  const [nick,setNick]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const onLogin=async()=>{
    const n=nick.trim();
    if(!n){setErr(t.ui.nicknameRequired);return;}
    const profiles=await loadProfiles();
    if(profiles[n]){
      if(profiles[n].password&&profiles[n].password!==pass){setErr(t.ui.wrongPassword);return;}
      setActiveUser(n);
      const{password:_,...data}=profiles[n];
      dispatch({type:"SET_USER",nickname:n,data});
    } else {
      const old=await loadP();
      const defaults={xp:0,level:1,streak:0,bestStreak:0,stats:{noteId:{ok:0,total:0},intervals:{ok:0,total:0},bpm:{ok:0,total:0},key:{ok:0,total:0}}};
      const newProf:ProfileData={password:pass,...defaults,...(old||{})};
      profiles[n]=newProf;
      await saveProfiles(profiles);
      setActiveUser(n);
      const{password:_,...data}=newProf;
      dispatch({type:"SET_USER",nickname:n,data});
    }
  };
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5 pb-8 relative" style={{animation:"fadeIn .4s"}}>
      <style>{CSS}</style>
      <div className="absolute top-4 right-4"><LangToggle/></div>
      <span style={{fontSize:56}}>🎧</span>
      <h1 className="text-3xl font-bold text-white tracking-tight">EarForge</h1>
      <div className="w-full max-w-xs flex flex-col gap-3">
        <input value={nick} onChange={e=>{setNick(e.target.value);setErr("");}}
          placeholder={t.ui.enterNickname} autoCapitalize="none" autoCorrect="off"
          className="w-full py-3 px-4 rounded-xl text-white font-bold text-center outline-none"
          style={{backgroundColor:"rgba(255,255,255,.1)",border:"2px solid rgba(167,139,250,.3)",fontSize:16}}
          onKeyDown={e=>{if(e.key==="Enter")onLogin();}}
        />
        <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}}
          placeholder={t.ui.enterPassword}
          className="w-full py-3 px-4 rounded-xl text-white text-center outline-none"
          style={{backgroundColor:"rgba(255,255,255,.08)",border:"2px solid rgba(255,255,255,.1)",fontSize:16}}
          onKeyDown={e=>{if(e.key==="Enter")onLogin();}}
        />
        {err&&<div className="text-red-400 text-sm text-center" style={{animation:"slideUp .3s ease-out"}}>{err}</div>}
        <button onClick={onLogin}
          className="w-full py-3 rounded-xl text-white font-bold text-base hover:scale-105 active:scale-95 transition-transform"
          style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}}>
          {t.ui.loginBtn}
        </button>
      </div>
    </div>
  );
}

// ─── Leaderboard Modal ─────────────────────────────────────────────────────────
type LBEntry={nick:string,pct:number,ok:number,total:number,best:number};
type LBData={[mode:string]:LBEntry[]};

async function fetchLeaderboard():Promise<LBData>{
  const r=await fetch(import.meta.env.BASE_URL+"api/leaderboard");
  if(!r.ok)throw new Error("api_unavailable");
  return r.json();
}

async function localLeaderboard():Promise<LBData>{
  const profiles=await loadProfiles();
  const result:LBData={};
  for(const m of MODES_META){
    result[m.id]=Object.entries(profiles)
      .map(([nick,p])=>{const s=(p.stats||{})[m.id]||{ok:0,total:0};return{nick,ok:s.ok,total:s.total,pct:s.total>0?Math.round(s.ok/s.total*100):0,best:p.bestStreak||0};})
      .filter(e=>e.total>0)
      .sort((a,b)=>b.pct-a.pct||b.best-a.best);
  }
  return result;
}

function LeaderboardModal({onClose,currentNick}:{onClose:()=>void,currentNick?:string}){
  const t=useT();
  const [data,setData]=useState<LBData|null>(null);
  const [isRemote,setIsRemote]=useState(false);
  useEffect(()=>{
    fetchLeaderboard()
      .then(d=>{setData(d);setIsRemote(true);})
      .catch(()=>localLeaderboard().then(d=>{setData(d);setIsRemote(false);}));
  },[]);
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor:"rgba(0,0,0,.75)"}}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-5 flex flex-col gap-4"
        style={{backgroundColor:"#1e1b4b",border:"1px solid rgba(167,139,250,.3)",maxHeight:"80vh",overflowY:"auto"}}>
        <style>{CSS}</style>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🏆 {t.ui.leaderboard}</h2>
            {data&&<span className="text-xs" style={{color:isRemote?"#34d399":"rgba(255,255,255,.3)"}}>{isRemote?"🌐 global":"📱 local"}</span>}
          </div>
          <button onClick={onClose} className="text-purple-300 hover:text-white text-lg px-2 py-1">✕</button>
        </div>
        {!data&&<div className="text-purple-400 text-sm text-center py-4">...</div>}
        {data&&MODES_META.map(m=>{
          const entries=(data[m.id]||[]).slice(0,5);
          const tMode=(t.modes as any)[m.id];
          return(
            <div key={m.id}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{fontSize:18}}>{m.icon}</span>
                <span className="text-white font-bold text-sm">{tMode.name}</span>
              </div>
              {entries.length===0
                ?<div className="text-purple-400 text-xs pl-1">{t.ui.noEntries}</div>
                :<div className="flex flex-col gap-1">
                  {entries.map((e,i)=>(
                    <div key={e.nick} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{backgroundColor:i===0?"rgba(251,191,36,.12)":e.nick===currentNick?"rgba(167,139,250,.15)":"rgba(255,255,255,.06)"}}>
                      <span className="font-bold text-sm w-5" style={{color:i===0?"#fbbf24":i===1?"#d1d5db":"#a78bfa"}}>{i+1}.</span>
                      <span className="text-sm flex-1 truncate" style={{color:e.nick===currentNick?"#c4b5fd":"white"}}>{e.nick}{e.nick===currentNick?" ◀":""}</span>
                      <span className="text-green-400 text-xs font-bold">{e.pct}%</span>
                      <span className="text-xs" style={{color:"#fbbf24"}}>🔥{e.best}</span>
                      <span className="text-purple-400 text-xs">{e.ok}/{e.total}</span>
                    </div>
                  ))}
                </div>
              }
            </div>
          );
        })}
        <button onClick={onClose} className="mt-1 w-full py-2.5 rounded-xl text-white font-bold text-sm"
          style={{backgroundColor:"rgba(255,255,255,.1)"}}>{t.ui.close}</button>
      </div>
    </div>
  );
}

// ─── Menu ──────────────────────────────────────────────────────────────────────
function Menu({dispatch,stats,bestStreak,nickname}:any){
  const t=useT();
  const [showLB,setShowLB]=useState(false);
  const total=Object.values(stats).reduce((a:any,s:any)=>a+s.total,0) as number;
  const ok=Object.values(stats).reduce((a:any,s:any)=>a+s.ok,0) as number;
  const pct=total>0?Math.round(ok/total*100):0;
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 pb-8" style={{animation:"fadeIn .4s"}}>
      <style>{CSS}</style>
      {showLB&&<LeaderboardModal onClose={()=>setShowLB(false)} currentNick={nickname}/>}
      {nickname&&<div className="text-purple-300 text-sm font-bold">👤 {nickname}</div>}
      <h2 className="text-2xl font-bold text-white mb-1">{t.ui.chooseMode}</h2>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {MODES_META.map((m,idx)=>{
          const s=(stats[m.id]||{ok:0,total:0}) as {ok:number,total:number};
          const mp=s.total>0?Math.round(s.ok/s.total*100):0;
          const tMode=(t.modes as any)[m.id];
          return(
            <button key={m.id} onClick={()=>dispatch({type:"GO",screen:m.id})}
              className={`rounded-2xl p-4 flex flex-col items-center gap-1 bg-gradient-to-br ${m.gr} hover:scale-105 active:scale-95 transition-transform shadow-lg`}
              style={{animation:`slideUp ${.3+idx*.08}s ease-out`}}>
              <span style={{fontSize:36}}>{m.icon}</span>
              <span className="text-white font-bold text-sm">{tMode.name}</span>
              <span className="text-white text-xs" style={{opacity:.7}}>{tMode.desc}</span>
              {s.total>0&&(
                <div className="w-full mt-1">
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{backgroundColor:"rgba(255,255,255,.2)"}}>
                    <div className="h-full rounded-full" style={{width:`${mp}%`,backgroundColor:"rgba(255,255,255,.7)",transition:"width .5s"}}/>
                  </div>
                  <span className="text-white text-xs mt-0.5 block" style={{opacity:.6}}>{mp}% · {s.ok}/{s.total}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {total>0&&(
        <div className="mt-2 text-center" style={{animation:"fadeIn .5s"}}>
          <div className="text-purple-300 text-sm">{t.ui.total}: {ok}/{total} ({pct}%)</div>
          <div className="text-purple-400 text-xs mt-1">{t.ui.bestStreak}: {bestStreak}</div>
        </div>
      )}
      <div className="flex gap-2 mt-1">
        <button onClick={()=>setShowLB(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-purple-200 hover:scale-105 active:scale-95 transition-transform"
          style={{backgroundColor:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.3)"}}>
          🏆 {t.ui.leaderboard}
        </button>
        <button onClick={()=>dispatch({type:"LOGOUT"})}
          className="px-4 py-2 rounded-xl text-sm font-bold text-red-300 hover:scale-105 active:scale-95 transition-transform"
          style={{backgroundColor:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.2)"}}>
          {t.ui.logout}
        </button>
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App(){
  const [lang,setLang]=useState<Lang>(()=>(localStorage.getItem("earforge-lang") as Lang)||"ua");
  const [st,dispatch]=useReducer(reducer,initState);
  const audio=useAudio();
  const prevRef=useRef<string|null>(null);

  // Persist language choice
  useEffect(()=>{localStorage.setItem("earforge-lang",lang);},[lang]);

  // Load saved progress & pre-fill random buffer
  useEffect(()=>{
    randBuf.fill();
    const activeUser=getActiveUser();
    if(!activeUser){dispatch({type:"LOADED"});return;}
    loadProfiles().then(profiles=>{
      const p=profiles[activeUser];
      if(p){const{password:_,...data}=p;dispatch({type:"SET_USER",nickname:activeUser,data});}
      else{setActiveUser(null);dispatch({type:"LOADED"});}
    });
  },[]);

  // Save progress on change (profile-based)
  useEffect(()=>{
    if(!st.loaded||!st.nickname)return;
    const{screen,loaded,lvlUp,nickname,...save}=st;
    const k=JSON.stringify(save);
    if(prevRef.current!==k){
      prevRef.current=k;
      saveP(save);
      loadProfiles().then(profiles=>{
        profiles[nickname]={...profiles[nickname],password:profiles[nickname]?.password||"",...save};
        saveProfiles(profiles);
      });
      // Submit to global leaderboard (fire and forget — fails silently if offline)
      fetch(import.meta.env.BASE_URL+"api/leaderboard",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({nick:nickname,stats:save.stats,bestStreak:save.bestStreak}),
      }).catch(()=>{});
    }
  },[st]);

  const isLogin=!st.loaded||st.screen==="login"||!st.nickname;
  let content;
  if(!st.loaded)content=null;
  else if(isLogin)content=<LoginScreen dispatch={dispatch}/>;
  else if(st.screen==="menu")content=<Menu dispatch={dispatch} stats={st.stats} bestStreak={st.bestStreak} nickname={st.nickname}/>;
  else content=<ModeScreen modeId={st.screen} audio={audio} dispatch={dispatch} streak={st.streak}/>;

  return(
    <LangCtx.Provider value={{lang,setLang}}>
      <div className="app-root flex flex-col" style={{background:"linear-gradient(135deg,#1e1b4b 0%,#0f0a2e 50%,#1a0a2e 100%)"}}>
        {!isLogin&&<Header state={st} dispatch={dispatch}/>}
        {content}
        {st.lvlUp&&<LevelUp level={st.level} onDone={()=>dispatch({type:"CLR_LVL"})}/>}
      </div>
    </LangCtx.Provider>
  );
}
