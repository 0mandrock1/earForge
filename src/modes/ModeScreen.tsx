import { useTutorial, TutorialDialog } from "../components/common";
import { useT } from "../i18n";
import { getTier } from "../adaptiveDiff";
import { DIFFS_META } from "../constants";
import NoteIdMode from "./NoteId";
import IntervalsMode from "./Intervals";
import BpmMode from "./Bpm";
import KeyMode from "./Key";
import ChordsMode from "./Chords";

const REGISTRY:any={noteId:NoteIdMode,intervals:IntervalsMode,bpm:BpmMode,key:KeyMode,chords:ChordsMode};

// No manual difficulty screen here anymore — difficulty is picked automatically
// per mode by adaptiveDiff (rolling accuracy, see adaptiveDiff.ts) and read fresh
// on every render, so it live-updates a round or two after a tier shift instead
// of only on remount. Manual difficulty is still available in Session setup.
export default function ModeScreen({modeId,audio,dispatch,streak}:any){
  const t=useT();
  const tut=useTutorial(modeId);
  if(!tut.ready)return null;
  if(tut.show)return <TutorialDialog modeId={modeId} onStart={tut.dismiss} onSkip={tut.skip} audio={audio}/>;
  const diff=getTier(modeId);
  const dMeta=DIFFS_META.find(d=>d.id===diff)!;
  const C=REGISTRY[modeId];
  return(
    <>
      <div className="w-full flex justify-center pt-1">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:"rgba(255,255,255,.08)",color:"#c4b5fd"}}>
          {dMeta.emoji} {(t.diffs as any)[diff].label} · {t.ui.autoDiff}
        </span>
      </div>
      <C audio={audio} dispatch={dispatch} streak={streak} diff={diff}/>
    </>
  );
}
