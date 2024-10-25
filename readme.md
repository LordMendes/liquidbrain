# LiquidBrain

A lightweight, framework-agnostic autocomplete library for input fields, textareas, and contenteditable elements. LiquidBrain provides dynamic suggestions based on a given data model, allowing for nested property access and customizable markers.

## Table of Contents

- [LiquidBrain](#liquidbrain)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
    - [Using NPM (Recommended)](#using-npm-recommended)
    - [Using Yarn](#using-yarn)
    - [Direct Download](#direct-download)
  - [Usage](#usage)
    - [Initialization](#initialization)
      - [Importing the Library](#importing-the-library)
    - [Basic Example](#basic-example)
  - [Options](#options)
  - [API Reference](#api-reference)
    - [LiquidBrainEngine](#liquidbrainengine)
      - [Constructor](#constructor)
      - [Methods](#methods)
    - [LiquidBrainUI](#liquidbrainui)
      - [Constructor](#constructor-1)
      - [Methods](#methods-1)
  - [Examples](#examples)
    - [Vanilla JavaScript Example](#vanilla-javascript-example)
  - [Custom Renderer](#custom-renderer)
  - [CSS Styles](#css-styles)
  - [Contributing](#contributing)
    - [Development Setup](#development-setup)
  - [License](#license)
  - [Contact](#contact)
  - [Acknowledgments](#acknowledgments)

---

## Features

- **Framework-Agnostic**: Works with plain JavaScript, React, Angular, or any other framework.
- **Flexible Input Support**: Supports `<input>`, `<textarea>`, and `contenteditable` elements.
- **Nested Suggestions**: Handles nested data models for deep property access.
- **Customizable Markers**: Define your own start and end markers for triggering autocomplete.
- **Custom Rendering**: Optionally provide a custom renderer for the suggestions modal.
- **Keyboard Navigation**: Navigate suggestions using arrow keys and select with Enter.

---

## Installation

### Using NPM (Recommended)

```bash
npm install liquidbrain
```

### Using Yarn

```bash
yarn add liquidbrain
```

### Direct Download

Download the `liquidbrain.umd.js` file from the [dist](#) directory and include it in your project.

---

## Usage

### Initialization

#### Importing the Library

**ES Modules:**

```javascript
import { LiquidBrainUI } from 'liquidbrain';
```

**CommonJS:**

```javascript
const { LiquidBrainUI } = require('liquidbrain');
```

**UMD (Browser):**

```html
<script src="path/to/liquidbrain.umd.js"></script>
<script>
  const { LiquidBrainUI } = LiquidBrain;
</script>
```

### Basic Example

```javascript
// Define your data model
const model = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    address: {
      city: 'Anytown',
      country: 'USA',
    },
  },
  company: {
    name: 'Example Corp',
    industry: 'Technology',
  },
};

// Get the input element
const inputElement = document.getElementById('myInput');

// Initialize LiquidBrainUI
const ui = new LiquidBrainUI({
  model,
  inputElement,
  markers: { start: '{{', end: '}}' }, // Optional
});
```

---

## Options

The `LiquidBrainUI` constructor accepts an options object with the following properties:

- **model** (`Model`, required): The data model used for generating suggestions.
- **inputElement** (`HTMLElement`, required): The element to attach the autocomplete functionality to (`<input>`, `<textarea>`, or `contenteditable` element).
- **markers** (`{ start: string; end: string }`, optional): Custom start and end markers for triggering autocomplete. Defaults to `{ start: '{{', end: '}}' }`.
- **customRenderer** (`Function`, optional): A function to customize the rendering of the suggestions modal.

---

## API Reference

### LiquidBrainEngine

The `LiquidBrainEngine` class manages autocomplete suggestions, text insertion, and cursor positioning.

#### Constructor

```typescript
new LiquidBrainEngine(
  model: Model,
  onValueChange: (newValue: string) => void,
  onSuggestionsChange: (newSuggestions: Suggestion[]) => void,
  markers?: { start: string; end: string }
)
```

**Parameters:**

- **model**: The data model for generating suggestions.
- **onValueChange**: Callback function when the input value changes.
- **onSuggestionsChange**: Callback function when the suggestions list changes.
- **markers**: Custom markers for triggering autocomplete.

#### Methods

- **handleFetchSuggestionsFromValue(value: string, cursor: number): void**

  Fetches suggestions based on the current input value and cursor position.

- **insertSuggestion(suggestion: Suggestion, value: string, cursor: number): { newValue: string; newCursor: number }**

  Inserts the selected suggestion into the input value.

- **isCaretWithinMarkers(value: string, cursor: number): boolean**

  Checks if the caret is within the defined markers.

- **getCurrentSuggestions(): Suggestion[]**

  Returns the current list of suggestions.

### LiquidBrainUI

The `LiquidBrainUI` class handles the user interface, integrating the engine with the DOM.

#### Constructor

```typescript
new LiquidBrainUI(options: LiquidBrainUIOptions)
```

**LiquidBrainUIOptions:**

- **model**: The data model for generating suggestions.
- **inputElement**: The target input element (`<input>`, `<textarea>`, or `contenteditable`).
- **markers**: Custom markers for triggering autocomplete.
- **customRenderer**: Function to customize the suggestions modal rendering.

#### Methods

- **destroy(): void**

  Cleans up event listeners and DOM elements created by the instance.

---

## Examples

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LiquidBrain Example</title>
  <link rel="stylesheet" href="path/to/liquidbrain.css">
</head>
<body>
  <input type="text" id="myInput" placeholder="Type here...">

  <script src="path/to/liquidbrain.umd.js"></script>
  <script>
    const { LiquidBrainUI } = LiquidBrain;

    const model = {
      user: {
        name: 'Alice',
        email: 'alice@example.com',
      },
      date: '2023-10-10',
    };

    const inputElement = document.getElementById('myInput');

    const ui = new LiquidBrainUI({
      model,
      inputElement,
      markers: { start: '{{', end: '}}' },
    });
  </script>
</body>
</html>
```

---

## Custom Renderer

You can provide a custom renderer function to change how the suggestions modal is displayed.

```javascript
const ui = new LiquidBrainUI({
  model,
  inputElement,
  customRenderer: (modalElement, suggestions, selectedIndex, applySuggestion) => {
    // Clear existing content
    modalElement.innerHTML = '';

    // Create your custom suggestions list
    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.textContent = suggestion.template;
      item.className = 'custom-suggestion-item';

      if (index === selectedIndex) {
        item.classList.add('selected');
      }

      item.addEventListener('click', () => applySuggestion(suggestion));

      modalElement.appendChild(item);
    });
  },
});
```

---

## CSS Styles

Include the following CSS styles to style the default suggestions modal. Adjust as needed for your application's design.

```css
/* liquidbrain.css */

.liquidbrain-modal {
  min-width: 250px;
  background-color: #fff;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-family: 'Roboto', sans-serif;
  z-index: 1000;
}

.liquidbrain-suggestion-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.liquidbrain-suggestion-item {
  display: flex;
  flex-direction: column;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
}

.liquidbrain-suggestion-item:last-child {
  border-bottom: none;
}

.liquidbrain-suggestion-item:hover,
.liquidbrain-suggestion-item.selected {
  background-color: #f5f5f5;
}

.primary-text {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
}

.secondary-text {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.54);
}
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](#) to contribute to this project.

### Development Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/LordMendes/liquidbrain.git
   ```

2. **Install Dependencies**

   ```bash
   cd liquidbrain
   npm install
   ```

3. **Build the Library**

   ```bash
   npm run build
   ```

4. **Run Tests (if any)**

   ```bash
   npm test
   ```

---

## License

This project is licensed under the MIT License.

---

## Contact

For questions or support, please open an issue on [GitHub](https://github.com/LordMendes/liquidbrain/issues)

---

## Acknowledgments

- Inspired by the need for a simple, flexible autocomplete solution.