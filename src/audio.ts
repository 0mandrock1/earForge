import { useRef, useCallback } from "react";
import { NOTES } from "./constants";

export const audioVol={v:parseFloat(localStorage.getItem("earforge-vol")||"1")};

// ─── Web Audio Engine (Safari-safe) ────────────────────────────────────────────
export function midiFromNote(name:string){
  const m=name.match(/^([A-G]#?)(\d)$/);
  if(!m)return 69;
  return 12*(parseInt(m[2])+1)+NOTES.indexOf(m[1]);
}
export function freqFromMidi(midi:number){return 440*Math.pow(2,(midi-69)/12);}
export function freqFromNote(name:string){return freqFromMidi(midiFromNote(name));}

export function useAudio(){
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

  // N-note chord, all struck together — used by Chords mode and the Key tutorial.
  const playChord=useCallback(async(notes:string[])=>{
    stopAll();const ctx=await ensureCtx(),t=ctx.currentTime+0.15;
    notes.forEach(n=>_tone(ctx,freqFromNote(n),t,0.7,0.22));
  },[stopAll,ensureCtx,_tone]);

  return{playNote,playInterval,playHarmonic,playMetronome,playProgression,playChord,stopAll};
}
