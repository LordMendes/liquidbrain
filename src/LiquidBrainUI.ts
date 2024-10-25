import { LiquidBrainEngine } from "./LiquidBrainEngine";
import { Suggestion, Model } from "./types";
import { styles } from "./defaultStyles";

interface LiquidBrainUIOptions {
  model: Model;
  inputElement: HTMLElement; // Accepts any HTMLElement
  customRenderer?: (
    modalElement: HTMLElement,
    suggestions: Suggestion[],
    selectedIndex: number,
    applySuggestion: (suggestion: Suggestion) => void
  ) => void;
  markers?: { start: string; end: string };
}

export class LiquidBrainUI {
  private engine: LiquidBrainEngine;
  private inputElement: HTMLElement;
  private customRenderer?: (
    modalElement: HTMLElement,
    suggestions: Suggestion[],
    selectedIndex: number,
    applySuggestion: (suggestion: Suggestion) => void
  ) => void;
  private markers: { start: string; end: string };
  private suggestions: Suggestion[];
  private selectedIndex: number;
  private modalElement: HTMLElement;
  private isContentEditable: boolean;
  private isInputElement: boolean;
  private isTextareaElement: boolean;
  private static stylesInjected = false;

  constructor(options: LiquidBrainUIOptions) {
    this.inputElement = options.inputElement;
    this.customRenderer = options.customRenderer;
    this.markers = options.markers || { start: "{{", end: "}}" };
    this.suggestions = [];
    this.selectedIndex = -1;

    // Determine if the inputElement is contenteditable
    this.isContentEditable = this.inputElement.isContentEditable;
    this.isInputElement = this.inputElement instanceof HTMLInputElement;
    this.isTextareaElement = this.inputElement instanceof HTMLTextAreaElement;

    // Create the engine
    this.engine = new LiquidBrainEngine(
      options.model,
      (newValue: string) => {
        this.setValue(newValue);
      },
      (newSuggestions: Suggestion[]) => {
        // Update suggestions
        this.suggestions = newSuggestions;
        if (this.suggestions.length > 0) {
          this.showModal();
        } else {
          this.hideModal();
        }
      },
      this.markers
    );

    if (!options.customRenderer) {
      this.injectStyles();
    }

    // Create modal container
    this.modalElement = document.createElement("div");
    this.modalElement.style.position = "absolute";
    this.modalElement.style.zIndex = "1000";
    this.modalElement.classList.add("liquidbrain-modal");
    document.body.appendChild(this.modalElement);

    this.init();
  }

  private init() {
    // Bind event listeners
    this.inputElement.addEventListener("input", this.handleInput);
    this.inputElement.addEventListener("keydown", this.handleKeyDown);
    this.inputElement.addEventListener("click", this.handleCaretPosition);
    this.inputElement.addEventListener("keyup", this.handleCaretPosition);
    document.addEventListener("click", this.handleDocumentClick);
  }

  private injectStyles() {
    if (LiquidBrainUI.stylesInjected) {
      return; // Styles already injected
    }

    // Create a <style> element
    const styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.textContent = styles;

    // Append the style to the <head>
    document.head.appendChild(styleElement);

    // Set the flag to true
    LiquidBrainUI.stylesInjected = true;
  }

  private handleInput = () => {
    const value = this.getValue();
    const cursorPosition = this.getCaretPosition();

    // Auto-insert complement markers if necessary
    const lastChar = value[cursorPosition - 1];
    if (lastChar === this.markers.start[0]) {
      const newValue =
        value.slice(0, cursorPosition) +
        this.markers.end[0] +
        value.slice(cursorPosition);
      this.setValue(newValue);
      this.setCaretPosition(cursorPosition);
    }

    // Fetch suggestions only if caret is within markers
    if (this.engine.isCaretWithinMarkers(value, cursorPosition)) {
      this.engine.handleFetchSuggestionsFromValue(value, cursorPosition);
      // Update modal position as caret moves
      this.showModal();
    } else {
      // Hide modal if caret is outside markers
      this.hideModal();
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.suggestions.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
        this.updateModal();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.selectedIndex =
          (this.selectedIndex - 1 + this.suggestions.length) %
          this.suggestions.length;
        this.updateModal();
        break;
      case "Enter":
        event.preventDefault();
        if (
          this.selectedIndex >= 0 &&
          this.selectedIndex < this.suggestions.length
        ) {
          this.applySuggestion(this.suggestions[this.selectedIndex]);
        }
        break;
      default:
        // For other keys, update the modal position
        setTimeout(() => {
          this.handleCaretPosition();
        }, 0);
        break;
    }
  };

  private handleCaretPosition = () => {
    const value = this.getValue();
    const cursorPosition = this.getCaretPosition();

    // Update modal position only if caret is within markers
    if (this.engine.isCaretWithinMarkers(value, cursorPosition)) {
      if (this.suggestions.length > 0) {
        this.showModal();
      }
    } else {
      this.hideModal();
    }
  };

  private handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as Node;
    if (
      this.modalElement.contains(target) ||
      this.inputElement.contains(target)
    ) {
      // Click inside modal or input element, do nothing
      return;
    }
    // Click outside, hide modal
    this.hideModal();
  };

  private showModal() {
    const caretPosition = this.getCaretCoordinates();
    this.modalElement.style.left = `${caretPosition.left}px`;
    this.modalElement.style.top = `${caretPosition.top + 20}px`;

    this.updateModal();
    this.modalElement.style.display = "block";
  }

  private hideModal() {
    this.modalElement.style.display = "none";
    this.selectedIndex = -1;
  }

  private updateModal() {
    // Clear existing content
    this.modalElement.innerHTML = "";

    // Use custom renderer if provided
    if (this.customRenderer) {
      this.customRenderer(
        this.modalElement,
        this.suggestions,
        this.selectedIndex,
        this.applySuggestion
      );
      return;
    }

    // Default rendering with Material UI styling
    const listElement = document.createElement("ul");
    listElement.classList.add("liquidbrain-suggestion-list");

    this.suggestions.forEach((suggestion, index) => {
      const listItem = document.createElement("li");
      listItem.classList.add("liquidbrain-suggestion-item");
      if (index === this.selectedIndex) {
        listItem.classList.add("selected");
      }

      const primaryText = document.createElement("div");
      primaryText.classList.add("primary-text");
      primaryText.textContent = suggestion.template;

      const secondaryText = document.createElement("div");
      secondaryText.classList.add("secondary-text");
      secondaryText.textContent = suggestion.preview;

      listItem.appendChild(primaryText);
      listItem.appendChild(secondaryText);

      listItem.addEventListener("click", () =>
        this.applySuggestion(suggestion)
      );

      listElement.appendChild(listItem);
    });

    this.modalElement.appendChild(listElement);
  }

  private applySuggestion = (suggestion: Suggestion) => {
    const value = this.getValue();
    const cursorPosition = this.getCaretPosition();

    const { newValue, newCursor } = this.engine.insertSuggestion(
      suggestion,
      value,
      cursorPosition
    );
    this.setValue(newValue);

    // Move cursor to the new cursor position
    this.setCaretPosition(newCursor);

    // If there are more suggestions (object), keep modal open
    if (suggestion.suggestions && suggestion.suggestions.length > 0) {
      // Fetch new suggestions
      this.engine.handleFetchSuggestionsFromValue(newValue, newCursor);
    } else {
      // Hide modal
      this.hideModal();
    }
  };

  private getValue(): string {
    if (this.isContentEditable) {
      return this.inputElement.textContent || "";
    } else if (this.isInputElement || this.isTextareaElement) {
      return (this.inputElement as HTMLInputElement | HTMLTextAreaElement)
        .value;
    } else {
      return "";
    }
  }

  private setValue(newValue: string) {
    if (this.isContentEditable) {
      this.inputElement.textContent = newValue;
    } else if (this.isInputElement || this.isTextareaElement) {
      (this.inputElement as HTMLInputElement | HTMLTextAreaElement).value =
        newValue;
    }
  }

  private getCaretPosition(): number {
    if (this.isContentEditable) {
      let position = 0;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return position;
      }
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(this.inputElement);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      position = preCaretRange.toString().length;
      return position;
    } else if (this.isInputElement || this.isTextareaElement) {
      return (
        (this.inputElement as HTMLInputElement | HTMLTextAreaElement)
          .selectionStart || 0
      );
    }
    return 0;
  }

  private setCaretPosition(position: number) {
    if (this.isContentEditable) {
      const setPosition = (node: Node, charsLeft: number): boolean => {
        if (charsLeft === 0) {
          const range = document.createRange();
          range.setStart(node, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          return true;
        }
        if (node.nodeType === Node.TEXT_NODE) {
          const textLength = node.textContent?.length || 0;
          if (charsLeft <= textLength) {
            const range = document.createRange();
            range.setStart(node, charsLeft);
            range.collapse(true);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            return true;
          } else {
            charsLeft -= textLength;
          }
        } else {
          for (let i = 0; i < node.childNodes.length; i++) {
            const found = setPosition(node.childNodes[i], charsLeft);
            if (found) return true;
            charsLeft =
              charsLeft - (node.childNodes[i].textContent?.length || 0);
          }
        }
        return false;
      };

      setPosition(this.inputElement, position);
    } else if (this.isInputElement || this.isTextareaElement) {
      (
        this.inputElement as HTMLInputElement | HTMLTextAreaElement
      ).selectionStart = position;
      (
        this.inputElement as HTMLInputElement | HTMLTextAreaElement
      ).selectionEnd = position;
    }
  }

  private getCaretCoordinates(): { left: number; top: number } {
    if (this.isContentEditable) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return { left: 0, top: 0 };
      }
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(true);

      const rect = range.getClientRects()[0];
      if (rect) {
        return {
          left: rect.left + window.pageXOffset,
          top: rect.top + window.pageYOffset,
        };
      }

      // Fallback to element position
      const elementRect = this.inputElement.getBoundingClientRect();
      return {
        left: elementRect.left + window.pageXOffset,
        top: elementRect.top + window.pageYOffset,
      };
    } else if (this.isInputElement || this.isTextareaElement) {
      const element = this.inputElement as
        | HTMLInputElement
        | HTMLTextAreaElement;
      const { selectionStart } = element;
      if (selectionStart === null) {
        return { left: 0, top: 0 };
      }

      const coordinates = this.getCaretCoordinatesForInput(
        element,
        selectionStart
      );

      return { left: coordinates.left, top: coordinates.top };
    } else {
      // Fallback to element position
      const elementRect = this.inputElement.getBoundingClientRect();
      return {
        left: elementRect.left + window.pageXOffset,
        top: elementRect.top + window.pageYOffset,
      };
    }
  }

  private getCaretCoordinatesForInput(
    element: HTMLInputElement | HTMLTextAreaElement,
    position: number
  ): { left: number; top: number } {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.whiteSpace = "pre-wrap";
    div.style.visibility = "hidden";

    // Copy styles from the input
    const computed = window.getComputedStyle(element);
    const properties = [
      "direction",
      "boxSizing",
      "width",
      "height",
      "overflowX",
      "overflowY",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "fontStyle",
      "fontVariant",
      "fontWeight",
      "fontStretch",
      "fontSize",
      "fontSizeAdjust",
      "lineHeight",
      "fontFamily",
      "textAlign",
      "textTransform",
      "textIndent",
      "textDecoration",
      "letterSpacing",
      "wordSpacing",
    ];

    properties.forEach((prop) => {
      if (prop !== "length" && prop !== "parentRule") {
        div.style.setProperty(prop, computed.getPropertyValue(prop));
      }
    });

    // Offset the mirror div
    const rect = element.getBoundingClientRect();
    div.style.left = rect.left + window.pageXOffset + "px";
    div.style.top = rect.top + window.pageYOffset + "px";

    // Set the content of the div
    const value = element.value.substring(0, position);
    div.textContent = value;

    // Create a span to represent the caret position
    const span = document.createElement("span");
    span.textContent = element.value.substring(position) || ".";
    div.appendChild(span);

    document.body.appendChild(div);

    const spanRect = span.getBoundingClientRect();
    const coordinates = { left: spanRect.left, top: spanRect.top };

    document.body.removeChild(div);

    return coordinates;
  }

  public destroy() {
    // Clean up event listeners and DOM elements
    this.inputElement.removeEventListener("input", this.handleInput);
    this.inputElement.removeEventListener("keydown", this.handleKeyDown);
    this.inputElement.removeEventListener("click", this.handleCaretPosition);
    this.inputElement.removeEventListener("keyup", this.handleCaretPosition);
    document.removeEventListener("click", this.handleDocumentClick);
    document.body.removeChild(this.modalElement);
  }
}
