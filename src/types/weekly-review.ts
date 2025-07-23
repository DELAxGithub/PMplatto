import { Program, ProgramStatus } from './program';
import { CalendarTask } from './calendar-task';

export interface WeeklyReviewData {
  weeklySchedule: {
    broadcasts: Array<{
      date: string;
      program: Program;
    }>;
    recordings: Array<{
      date: string;
      program: Program;
    }>;
    tasks: Array<{
      date: string;
      task: CalendarTask;
      program?: Program;
    }>;
  };
  statusSummary: Record<ProgramStatus, number>;
  recentUpdates: {
    newPrograms: Program[];
    statusChanges: Array<{
      program: Program;
      oldStatus: ProgramStatus;
      newStatus: ProgramStatus;
    }>;
  };
}

export interface SlackMessage {
  text: string;
  blocks: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}