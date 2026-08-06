// ─── Music theory & shared constants ───────────────────────────────────────────
export const NOTES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
export const NAT_NOTES=["C","D","E","F","G","A","B"];

// Interval sets per language (same semitone counts, different abbreviations)
export const INTERVALS={
  ua:[
    {name:"м2",st:1,full:"мала секунда"},{name:"б2",st:2,full:"велика секунда"},
    {name:"м3",st:3,full:"мала терція"},{name:"б3",st:4,full:"велика терція"},
    {name:"ч4",st:5,full:"чиста кварта"},{name:"тт",st:6,full:"тритон"},
    {name:"ч5",st:7,full:"чиста квінта"},{name:"м6",st:8,full:"мала секста"},
    {name:"б6",st:9,full:"велика секста"},{name:"м7",st:10,full:"мала септима"},
    {name:"б7",st:11,full:"велика септима"},{name:"окт",st:12,full:"октава"},
  ],
  en:[
    {name:"m2",st:1,full:"Minor 2nd"},{name:"M2",st:2,full:"Major 2nd"},
    {name:"m3",st:3,full:"Minor 3rd"},{name:"M3",st:4,full:"Major 3rd"},
    {name:"P4",st:5,full:"Perfect 4th"},{name:"TT",st:6,full:"Tritone"},
    {name:"P5",st:7,full:"Perfect 5th"},{name:"m6",st:8,full:"Minor 6th"},
    {name:"M6",st:9,full:"Major 6th"},{name:"m7",st:10,full:"Minor 7th"},
    {name:"M7",st:11,full:"Major 7th"},{name:"oct",st:12,full:"Octave"},
  ],
};
export const EASY_IV=[1,3,4,7,12];

// Scale types per language — index-aligned across languages (canonical order:
// major, natural minor, harmonic minor, dorian, mixolydian). iv = semitone offsets
// from the root for one ascending octave (includes the closing 12). Tier slices:
// easy=[0,3) medium=[0,4) hard=[0,5).
export const SCALES={
  ua:[
    {name:"мажор",iv:[0,2,4,5,7,9,11,12]},
    {name:"нат. мінор",iv:[0,2,3,5,7,8,10,12]},
    {name:"гарм. мінор",iv:[0,2,3,5,7,8,11,12]},
    {name:"дорійський",iv:[0,2,3,5,7,9,10,12]},
    {name:"міксолідійський",iv:[0,2,4,5,7,9,10,12]},
  ],
  en:[
    {name:"major",iv:[0,2,4,5,7,9,11,12]},
    {name:"natural minor",iv:[0,2,3,5,7,8,10,12]},
    {name:"harmonic minor",iv:[0,2,3,5,7,8,11,12]},
    {name:"dorian",iv:[0,2,3,5,7,9,10,12]},
    {name:"mixolydian",iv:[0,2,4,5,7,9,10,12]},
  ],
};
export type Dir="asc"|"desc"|"harm";
export const ALL_DIRS:Dir[]=["asc","desc","harm"];
export const MAJOR=[0,4,7],MINOR=[0,3,7];
export const XP_PER_LEVEL=200;

// Chord qualities per language — index-aligned across languages (canonical order:
// maj, min, dim, aug, maj7, dom7). Tier slices: easy=[0,3) medium=[0,4) hard=[0,6).
export const CHORDS={
  ua:[
    {name:"мажор",iv:[0,4,7]},{name:"мінор",iv:[0,3,7]},{name:"зменш.",iv:[0,3,6]},
    {name:"збільш.",iv:[0,4,8]},{name:"мажор7",iv:[0,4,7,11]},{name:"домін7",iv:[0,4,7,10]},
  ],
  en:[
    {name:"major",iv:[0,4,7]},{name:"minor",iv:[0,3,7]},{name:"dim",iv:[0,3,6]},
    {name:"aug",iv:[0,4,8]},{name:"maj7",iv:[0,4,7,11]},{name:"dom7",iv:[0,4,7,10]},
  ],
};

// Structural mode/diff data — text comes from translations.
// Per-mode accent colors are DELIBERATELY distinct (mode identity) and survive the
// global purple->red retheme untouched, EXCEPT noteId which used to be the odd
// violet one — moved to an orange->red ember that harmonizes with the forge theme.
// scaleId (6th mode) gets its own indigo/blue accent, appended LAST so the [0..3]
// index lookups other modes rely on don't shift.
export const MODES_META=[
  {id:"noteId", icon:"🎵",gr:"from-orange-500 to-red-600",  btn:"linear-gradient(135deg,#f97316,#ea580c)"},
  {id:"intervals",icon:"🎼",gr:"from-cyan-500 to-blue-600",  btn:"linear-gradient(135deg,#0891b2,#0e7490)"},
  {id:"bpm",     icon:"🥁", gr:"from-amber-500 to-orange-600",btn:"linear-gradient(135deg,#d97706,#b45309)"},
  {id:"key",     icon:"🎹", gr:"from-emerald-500 to-green-600",btn:"linear-gradient(135deg,#059669,#047857)"},
  {id:"chords",  icon:"🎸", gr:"from-rose-500 to-pink-600",   btn:"linear-gradient(135deg,#e11d48,#be123c)"},
  {id:"scaleId", icon:"🪜", gr:"from-indigo-500 to-blue-600", btn:"linear-gradient(135deg,#4f46e5,#2563eb)"},
];
export const DIFFS_META=[
  {id:"easy",  emoji:"🟢"},
  {id:"medium",emoji:"🟡"},
  {id:"hard",  emoji:"🔴"},
];

// ─── CSS Animations ─────────────────────────────────────────────────────────────
export const CSS=`
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes popIn{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes flashGreen{0%{background-color:rgba(22,163,74,.35)}100%{background-color:transparent}}
@keyframes flashRed{0%{background-color:rgba(220,38,38,.25)}100%{background-color:transparent}}
@keyframes streakPulse{0%{transform:scale(1)}50%{transform:scale(1.5)}100%{transform:scale(1)}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-70px) scale(1.3)}}
@keyframes lvlUp{0%{transform:scale(0) rotate(-10deg);opacity:0}50%{transform:scale(1.2) rotate(3deg);opacity:1}75%{transform:scale(.97)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes lvlUpExit{0%{transform:scale(1);opacity:1}100%{transform:scale(1.1);opacity:0}}
@keyframes glow{0%,100%{box-shadow:0 0 10px rgba(239,68,68,.45)}50%{box-shadow:0 0 30px rgba(239,68,68,.9)}}
@keyframes emberPulse{0%,100%{box-shadow:0 0 12px rgba(220,38,38,.5),0 0 4px rgba(249,115,22,.6) inset}50%{box-shadow:0 0 26px rgba(220,38,38,.85),0 0 8px rgba(249,115,22,.5) inset}}
@keyframes slideUp{0%{transform:translateY(30px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
@keyframes fadeOut{0%{opacity:1}100%{opacity:0}}
@keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.5);opacity:0}}
`;

// ─── random.org buffer ──────────────────────────────────────────────────────────
// Fills a buffer with true random floats [0,1) from random.org.
// Falls back to Math.random() silently when the buffer is empty or request fails.
export const randBuf={
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
export function shuffle<T>(a:T[]):T[]{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(randBuf.get()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
export function pickOpts(c:string,pool:string[],n=4){const s=new Set([c]);for(const x of shuffle(pool.filter(v=>v!==c))){if(s.size>=n)break;s.add(x)}return shuffle([...s])}
export function noteAt(r:string,o:number,semi:number){const i=NOTES.indexOf(r)+semi;return NOTES[i%12]+(o+Math.floor(i/12))}
export function getMult(s:number){return s>=9?5:s>=5?3:s>=2?2:1}
export function buildChord(r:string,o:number,p:number[]){return p.map(s=>noteAt(r,o,s))}
export function randInt(a:number,b:number){return Math.floor(randBuf.get()*(b-a+1))+a}
export function pick<T>(arr:T[]):T{return arr[Math.floor(randBuf.get()*arr.length)]}

// ─── Mnemonics (used for inline "why did I mix this up" hints after a wrong answer) ──
// Interval mnemonics keyed by semitone count (language-independent identity, unlike
// the interval name which differs ua/en). Same source material as the tutorial text,
// condensed to one line so it fits under a wrong-answer without a modal.
export const IV_MNEMONIC={
  ua:{1:"«Jaws» (тема акули): тісно, тривожно, хроматика",2:"«Happy Birthday» перші дві ноти: природно, спокійно",
      3:"«Smoke on the Water» / «Greensleeves»: сумно, меланхолійно",4:"«Oh When the Saints»: радісно, тепло",
      5:"«Here Comes the Bride»: чиста, стійка, «пуста»",6:"«The Simpsons» тема: нестабільна, тривожна",
      7:"«Star Wars» / «Twinkle Twinkle»: порожня, героїчна",8:"«The Entertainer» (Joplin): ніжна, трохи сумна",
      9:"«My Way» (Sinatra): широка, піднесена",10:"«Somewhere» (West Side Story): романтична, напружена",
      11:"«Take on Me» (A-ha): дуже широка, прагне вгору",12:"«Somewhere Over the Rainbow»: тріумфальний стрибок"},
  en:{1:"'Jaws' shark theme: tight, tense, chromatic",2:"'Happy Birthday' first 2 notes: natural, calm",
      3:"'Smoke on the Water' riff / 'Greensleeves': sad, dark",4:"'Oh When the Saints': joyful, warm",
      5:"'Here Comes the Bride': pure, resolved",6:"'The Simpsons' theme: unstable, tense",
      7:"'Star Wars' / 'Twinkle Twinkle': open, heroic",8:"'The Entertainer' (Joplin): gentle, wistful",
      9:"'My Way' (Sinatra): wide, soaring",10:"'Somewhere' (West Side Story): romantic, expansive",
      11:"'Take on Me' (A-ha): very wide, reaching up",12:"'Over the Rainbow': triumphant leap"},
};

// Chord quality mnemonics — index-aligned with the CHORDS arrays above (0=maj..5=dom7).
export const CHORD_MNEMONIC={
  ua:["Стабільний, яскравий — основа мажору","Стабільний, темніший — основа мінору",
      "Обидва інтервали «стиснуті» — тривожно, нестійко","Розтягнутий, симетричний — нема відчуття «дому»",
      "Мажор + напружена нота зверху — більше кольору","Домінантний — тягне до вирішення в тоніку"],
  en:["Stable, bright — the major sound","Stable, darker — the minor sound",
      "Both intervals squeezed — tense, unstable","Stretched, symmetrical — no sense of 'home'",
      "Major + a tense note on top — more color","Dominant — wants to resolve to the tonic"],
};
