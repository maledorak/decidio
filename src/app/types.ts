
export interface DialogItem {
  actor: string;
  text: string;
}

export interface CrisisLLMResult {
  round: number;
  think: string;
  answer: {
    speakers: string[];
    dialog: DialogItem[];
  };
};
