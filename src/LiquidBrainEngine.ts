import { Model, Suggestion, SuggestionsMap } from './types';

/**
 * LiquidBrainEngine Class
 * Manages autocomplete suggestions, text insertion, and cursor positioning.
 */
export class LiquidBrainEngine {
  private suggestionsMap: SuggestionsMap;
  private markers: { start: string; end: string };
  private onValueChange: (newValue: string) => void;
  private onSuggestionsChange: (newSuggestions: Suggestion[]) => void;
  private currentSuggestions: Suggestion[] = [];

  constructor(
    model: Model,
    onValueChange: (newValue: string) => void,
    onSuggestionsChange: (newSuggestions: Suggestion[]) => void,
    markers: { start: string; end: string } = { start: '{{', end: '}}' }
  ) {
    this.suggestionsMap = this.generateSuggestionsMap(model);
    this.markers = markers;
    this.onValueChange = onValueChange;
    this.onSuggestionsChange = onSuggestionsChange;
  }

  private getPreview = (value: string | Model): string => {
    if (typeof value === 'string') {
      return value;
    } else {
      // Properly return a string representation of the object
      return `{${Object.keys(value).join(' , ')}}`;
    }
  };

  /**
   * Generates a SuggestionsMap from the provided model.
   * @param model The model object containing keys and their previews or nested models.
   * @param parentKey The accumulated key path for nested models.
   * @returns A SuggestionsMap with all possible suggestions.
   */
  private generateSuggestionsMap(model: Model, parentKey = ''): SuggestionsMap {
    const suggestions: SuggestionsMap = {};

    Object.keys(model).forEach((key) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      const value = model[key];

      if (typeof value === 'string') {
        suggestions[key] = {
          template: fullKey,
          preview: value,
          suggestions: [],
        };
      } else if (typeof value === 'object' && value !== null) {
        const nestedSuggestionsMap = this.generateSuggestionsMap(value as Model, fullKey);
        const nestedSuggestions = Object.values(nestedSuggestionsMap);

        suggestions[key] = {
          template: fullKey,
          preview: this.getPreview(value),
          suggestions: nestedSuggestions,
        };
      }
    });

    return suggestions;
  }

  /**
   * Converts an array of Suggestion objects into a SuggestionsMap.
   * @param suggestionsArray The array of Suggestion objects.
   * @returns A SuggestionsMap for easier lookup.
   */
  private arrayToMap(suggestionsArray: Suggestion[]): SuggestionsMap {
    const map: SuggestionsMap = {};
    suggestionsArray.forEach((sugg) => {
      const key = sugg.template.split('.').slice(-1)[0];
      map[key] = sugg;
    });
    return map;
  }

  /**
   * Handles fetching suggestions based on the current input.
   * @param value The current input value.
   * @param cursor The current cursor position.
   */
  public handleFetchSuggestionsFromValue(value: string, cursor: number): void {
    const triggerInfo = this.getTriggerInfo(value, cursor);
    if (triggerInfo) {
      const { query } = triggerInfo;
      this.fetchSuggestions(query);
    } else {
      // Clear suggestions if not within markers
      this.currentSuggestions = [];
      this.onSuggestionsChange([]);
    }
  }

  /**
   * Fetches suggestions based on the current input query.
   * @param query The current input query.
   */
  private fetchSuggestions(query: string): void {
    try {
      const results = this.getSuggestions(this.suggestionsMap, query);
      this.currentSuggestions = results;
      this.onSuggestionsChange(results);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      this.currentSuggestions = [];
      this.onSuggestionsChange([]);
    }
  }

  /**
   * Recursively fetches suggestions based on the current input.
   * @param suggestionsMap The map of all possible suggestions.
   * @param query The current input query.
   * @returns An array of matching suggestions.
   */
  private getSuggestions(suggestionsMap: SuggestionsMap, query: string): Suggestion[] {
    const results: Suggestion[] = [];
    const queryParts = query.split('.');

    let currentMaps: SuggestionsMap[] = [suggestionsMap];

    for (let i = 0; i < queryParts.length; i++) {
      const part = queryParts[i];
      const isLast = i === queryParts.length - 1;

      if (part === '') {
        // If the query is empty, fetch all suggestions at the current level
        currentMaps.forEach((map) => {
          Object.values(map).forEach((sugg) => {
            results.push(sugg);
          });
        });
        break;
      }

      const matchedSuggestions: Suggestion[] = [];

      currentMaps.forEach((map) => {
        Object.keys(map).forEach((key) => {
          if (key.startsWith(part)) {
            matchedSuggestions.push(map[key]);
          }
        });
      });

      if (matchedSuggestions.length === 0) {
        break;
      }

      if (isLast) {
        results.push(...matchedSuggestions);
      } else {
        const nextLevelMaps: SuggestionsMap[] = [];
        matchedSuggestions.forEach((sugg) => {
          if (sugg.suggestions && sugg.suggestions.length > 0) {
            nextLevelMaps.push(this.arrayToMap(sugg.suggestions));
          }
        });
        currentMaps = nextLevelMaps;
      }
    }

    return results;
  }

  /**
   * Determines if the cursor is within the trigger markers and extracts the current query.
   * @param value The current input value.
   * @param cursor The current cursor position.
   * @returns An object containing the start and end positions of the trigger and the query string, or null if not within markers.
   */
  private getTriggerInfo(
    value: string,
    cursor: number
  ): { start: number; end: number; query: string } | null {
    const { start: startMarker, end: endMarker } = this.markers;
    const lastStart = value.lastIndexOf(startMarker, cursor - 1);
    const lastEnd = value.lastIndexOf(endMarker, cursor - 1);

    if (lastStart > lastEnd) {
      const query = value.substring(lastStart + startMarker.length, cursor).trim();
      return { start: lastStart, end: cursor, query };
    }

    return null;
  }

  /**
   * Checks if the caret is within the markers.
   * @param value The current input value.
   * @param cursor The current cursor position.
   * @returns True if the caret is within the markers, false otherwise.
   */
  public isCaretWithinMarkers(value: string, cursor: number): boolean {
    return this.getTriggerInfo(value, cursor) !== null;
  }

  /**
   * Inserts the selected suggestion into the input.
   * @param suggestion The selected suggestion to insert.
   * @param value The current input value.
   * @param cursor The current cursor position.
   * @returns The new value and new cursor position after insertion.
   */
  public insertSuggestion(
    suggestion: Suggestion,
    value: string,
    cursor: number
  ): { newValue: string; newCursor: number } {
    const triggerInfo = this.getTriggerInfo(value, cursor);
    if (!triggerInfo) return { newValue: value, newCursor: cursor };

    const { start, end } = triggerInfo;
    const beforeTrigger = value.substring(0, start);
    const afterTrigger = value.substring(end);
    let newText = '';
    let newCursor = cursor;

    if (suggestion.suggestions && suggestion.suggestions.length > 0) {
      // If the suggestion has nested suggestions, add the key and dot, keep markers open
      newText = `${beforeTrigger}${this.markers.start}${suggestion.template}.${afterTrigger}`;
      newCursor = newText.length - afterTrigger.length;
    } else {
      // Last element or single element, complete the template
      newText = `${beforeTrigger}${this.markers.start}${suggestion.template}${afterTrigger}`;
      newCursor = newText.length;
      // Clear suggestions after insertion
      this.currentSuggestions = [];
      this.onSuggestionsChange([]);
    }

    // Use the callback to update the value
    this.onValueChange(newText);

    return { newValue: newText, newCursor };
  }

  /**
   * Returns the current suggestions.
   * @returns The current suggestions array.
   */
  public getCurrentSuggestions(): Suggestion[] {
    return this.currentSuggestions;
  }
}
