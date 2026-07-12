import { useState } from "react";
import { useTutorial, DiffPicker, TutorialDialog } from "../components/common";
import NoteIdMode from "./NoteId";
import IntervalsMode from "./Intervals";
import BpmMode from "./Bpm";
import KeyMode from "./Key";
import ChordsMode from "./Chords";

const REGISTRY:any={noteId:NoteIdMode,intervals:IntervalsMode,bpm:BpmMode,key:KeyMode,chords:ChordsMode};

export default function ModeScreen({modeId,audio,dispatch,streak}:any){
  const tut=useTutorial(modeId);
  const [diff,setDiff]=useState<string|null>(null);
  if(!tut.ready)return null;
  if(tut.show)return <TutorialDialog modeId={modeId} onStart={tut.dismiss} onSkip={tut.skip} audio={audio}/>;
  if(!diff)return <DiffPicker modeId={modeId} onPick={setDiff}/>;
  const C=REGISTRY[modeId];
  return <C audio={audio} dispatch={dispatch} streak={streak} diff={diff}/>;
}
