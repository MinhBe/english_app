import { fsrs, Rating, State, type Card } from 'ts-fsrs';
import type { CardState } from '@prisma/client';
const scheduler=fsrs();
const toDb=(s:State):CardState=>({[State.New]:'NEW',[State.Learning]:'LEARNING',[State.Review]:'REVIEW',[State.Relearning]:'RELEARNING'} as Record<State,CardState>)[s];
const toFsrs=(s:CardState):State=>({NEW:State.New,LEARNING:State.Learning,REVIEW:State.Review,RELEARNING:State.Relearning}[s]);
const ratings={1:Rating.Again,2:Rating.Hard,3:Rating.Good,4:Rating.Easy} as const;
export function toFsrsCard(p:{due:Date;stability:number;difficulty:number;elapsedDays:number;scheduledDays:number;reps:number;lapses:number;learningSteps:number;state:CardState;lastReview:Date|null;}):Card{
 return {due:p.due,stability:p.stability,difficulty:p.difficulty,elapsed_days:p.elapsedDays,scheduled_days:p.scheduledDays,reps:p.reps,lapses:p.lapses,learning_steps:p.learningSteps,state:toFsrs(p.state),last_review:p.lastReview??undefined};
}
export function schedule(card:Card,rating:1|2|3|4,now=new Date()){const result=scheduler.next(card,now,ratings[rating]); return {card:result.card,log:result.log,stateAfter:toDb(result.card.state)};}
