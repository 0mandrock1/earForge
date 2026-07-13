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
  // Destination that raw oscillators connect to. Normally this is ctx.destination,
  // but on iOS/iPadOS Safari raw Web Audio output goes through the "ambient" audio
  // session category, which is muted by the hardware Ring/Silent switch (if the
  // device has one) even at full volume — while <audio>/<video> elements use the
  // "playback" category and ignore that switch (that's why e.g. YouTube still plays).
  // Fix: route our synthesized audio into a MediaStreamAudioDestinationNode and play
  // that stream through a real, invisible <audio> element — this forces the whole
  // page onto the "playback" category, so the switch position stops mattering.
  const mediaDestRef=useRef<MediaStreamAudioDestinationNode|null>(null);
  const audioElRef=useRef<HTMLAudioElement|null>(null);

  // Async: creates context if needed, awaits resume().
  // iOS Safari requires resume() to fully resolve before scheduling any audio.
  // Also plays a 1-sample silent buffer on first creation to unlock the iOS audio session.
  const ensureCtx=useCallback(async()=>{
    const AC=window.AudioContext||(window as any).webkitAudioContext;
    if(!ctxRef.current||ctxRef.current.state==="closed"){
      ctxRef.current=new AC();
      try{
        const buf=ctxRef.current.createBuffer(1,1,ctxRef.current.sampleRate);
        const src=ctxRef.current.createBufferSource();
        src.buffer=buf;src.connect(ctxRef.current.destination);src.start(0);
      }catch(e){}

      // Bridge to a real <audio> element so we land in the "playback" session
      // category (bypasses Ring/Silent switch on iOS/iPadOS).
      try{
        mediaDestRef.current=ctxRef.current.createMediaStreamDestination();
        const el=document.createElement("audio");
        el.srcObject=mediaDestRef.current.stream;
        el.setAttribute("playsinline","");
        (el as any).playsInline=true;
        el.autoplay=true;
        el.style.display="none";
        document.body.appendChild(el);
        audioElRef.current=el;
        el.play().catch(()=>{});
      }catch(e){}
    }
    if(ctxRef.current.state!=="running")await ctxRef.current.resume();
    if(audioElRef.current&&audioElRef.current.paused){
      try{await audioElRef.current.play();}catch(e){}
    }
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

  // Internal tone scheduler — receives already-running ctx. Connects to the
  // MediaStreamAudioDestination bridge when available, falling back to ctx.destination.
  const _tone=useCallback((ctx:AudioContext,freq:number,t:number,dur:number,vol=0.3)=>{
    const dest=mediaDestRef.current??ctx.destination;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type="triangle";
    osc.frequency.setValueAtTime(freq,t);
    gain.gain.setValueAtTime(0,t);
    gain.gain.linearRampToValueAtTime(vol*audioVol.v,t+0.015);
    gain.gain.setValueAtTime(vol*audioVol.v,t+dur*0.7);
    gain.gain.linearRampToValueAtTime(0,t+dur);
    osc.connect(gain);gain.connect(dest);
    osc.start(t);osc.stop(t+dur+0.1);
    activeRef.current.push({gain,osc});
    osc.onended=()=>{activeRef.current=activeRef.current.filter(n=>n.osc!==osc);};
  },[]);

  const _click=useCallback((ctx:AudioContext,t:number,vol=0.4)=>{
    const dest=mediaDestRef.current??ctx.destination;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type="square";osc.frequency.setValueAtTime(1000,t);
    gain.gain.setValueAtTime(vol*audioVol.v,t);gain.gain.linearRampToValueAtTime(0,t+0.03);
    osc.connect(gain);gain.connect(dest);
    osc.start(t);osc.stop(t+0.05);
  },[]);

  // Public API — all async so iOS resume() is awaited before scheduling.
  // 0.15s offset ensures notes are never "in the past" on a fresh iOS context.
  const playNote=useCallback(async(note:string,dur=0.4)=>{
    stopAll();const ctx=await ensureCtx();
    _tone(ctx,freqFromNote(note),ctx.currentTime+0.15,dur);
  },[stopAll,ensureCtx,_tone]);

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

  const playChord=useCallback(async(notes:string[])=>{
    stopAll();const ctx=await ensureCtx(),t=ctx.currentTime+0.15;
    notes.forEach(n=>_tone(ctx,freqFromNote(n),t,0.7,0.22));
  },[stopAll,ensureCtx,_tone]);

  return{playNote,playInterval,playHarmonic,playMetronome,playProgression,playChord,stopAll};
}
