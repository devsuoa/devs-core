export type RSVPQuestionType = "text" | "single_select" | "multi_select";

export interface RSVPQuestion {
  id: string;
  prompt: string;
  type: RSVPQuestionType;
  required: boolean;
  options: string[];
}
