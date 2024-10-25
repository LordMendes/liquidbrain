export interface Suggestion {
  template: string;
  preview: string;
  suggestions: Suggestion[];
}

export interface SuggestionsMap {
  [key: string]: Suggestion;
}

export interface Model {
  [key: string]: string | Model;
}
