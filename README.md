# Code Decorator

A powerful VS Code extension that supports multiple decoration rules. Each rule consists of a condition (trigger), pattern (what to highlight), and custom styling.

![Code Decorator Preview](https://raw.githubusercontent.com/narrentum/VS-Code-Decorator/main/images/preview.png)

## ✨ Features

- **Multiple Decoration Rules**: Define unlimited number of (condition, pattern, color) rules
- **Flexible Pattern Matching**: Both condition and pattern support regex
- **Custom Styling**: Individual colors, backgrounds, and borders for each rule
- **Real-time Updates**: Decorations update instantly when typing or changing settings
- **Language Agnostic**: Works with any programming language
- **Theme Override**: Successfully overrides both theme colors and `editor.semanticTokenColorCustomizations`

## What's new in v1.2.0

- Top-level `codeDecorator` object support and global defaults: `ignoreInComments` and `ignoreInString`.
- Per-capture-group styling: `groupColors`, `groupBackgrounds`, and `groupTextDecorations` to target specific regex capture groups.
- Per-rule options: `flags`, `conditionFlags`, `ignoreInComments`, `ignoreInString` and `textDecoration` (strikethrough/underline).
- Settings UI improvements: color pickers enabled via `format: "color-hex"` for color fields.
- Runtime toggle command: `codeDecorator.toggle` to enable/disable decorations temporarily.
- Improved heuristics to ignore matches inside strings and comments (configurable per-rule).
- Packaged release `code-decorator-1.2.0.vsix` available.

## 🔧 Configuration

Open File → Preferences → Settings and search for "Code Decorator".

Main settings live under the top-level `codeDecorator` object:

- `codeDecorator.enabled` — global enable/disable toggle
- `codeDecorator.ignoreInComments` — global default; if true, rules will skip matches inside comments
- `codeDecorator.ignoreInString` — global default; if true, rules will skip matches inside string literals
- `codeDecorator.rules` — array of decoration rules

Each rule may override the global defaults and supports a number of fields. Color fields use the `color-hex` format so VS Code shows a color picker when editing settings.

Rule structure (valid JSON example):

```json
{
  "condition": "import React",
  "conditionFlags": "i",
  "pattern": "\\bReact\\b",
  "flags": "m",
  "ignoreInComments": true,
  "ignoreInString": true,
  "color": "#61dafb",
  "backgroundColor": "#61dafb1a",
  "borderColor": "#61dafb",
  "textDecoration": "",
  "groupColors": ["#ff8800"],
  "groupBackgrounds": ["#00000000"],
  "groupTextDecorations": ["underline"],
  "enabled": true,
  "description": "Example rule: highlights React when import exists"
}
```

Notes:
- `condition` and `pattern` accept regular expressions. Use `condition` to make a rule active only when some context exists in the file.
- `flags` control the main pattern (e.g., `g`, `m`, `s`, `i`). The extension ensures the `g` flag is present for global search when needed.
- `conditionFlags` control flags for the `condition` regex (no `g` required).
- Use `groupColors`, `groupBackgrounds`, and `groupTextDecorations` to style specific capture groups from your regex; the first array element targets the first capture group, etc.
- `ignoreInComments` / `ignoreInString` can be set per-rule or inherited from the top-level defaults.

## 📝 Example Configuration

```json
{
  "codeDecorator": {
    "enabled": true,
    "ignoreInComments": false,
    "ignoreInString": false,
    "rules": [
      {
        "enabled": true,
        "ignoreInString": false,
        "ignoreInComments": true,
        "condition": "using _this",
        "pattern": "\\b_this\\b",
        "color": "#569CD6",
        "backgroundColor": "#d0d65600",
        "borderColor": "#00000000",
        "textDecoration": "none",
        "description": "Выделять _this синим"
      },
      {
        "enabled": true,
        "ignoreInComments": true,
        "ignoreInString": true,
        "flags": "gm",
        "pattern": "^\\s*(?:\\bDebug.*\\..*)(LogWarning)",
        "groupColors": ["#ff8800"],
        "groupBackgrounds": [""],
        "groupTextDecorations": ["underline"],
        "description": "Debug.LogWarning"
      },
      {
        "enabled": true,
        "ignoreInComments": true,
        "ignoreInString": true,
        "flags": "gm",
        "pattern": "^\\s*(?:\\bDebug.*\\.)(LogError)",
        "groupColors": ["#ff0000"],
        "description": "Debug.LogError"
      },
      {
        "enabled": true,
        "ignoreInComments": true,
        "ignoreInString": true,
        "flags": "gm",
        "pattern": "^\\s*(?:\\bDebug.*\\.)(Log)\\b",
        "groupColors": ["#80b9ff"],
        "description": "Debug.Log"
      },
      {
        "enabled": true,
        "flags": "i",
        "pattern": "//\\s*TODO:.*?\\[Fixed\\].*",
        "color": "#888888",
        "textDecoration": "line-through",
        "description": "Перечёркнутые TODO с [Fixed]"
      },
      {
        "enabled": true,
        "flags": "ms",
        "pattern": "//\\s*TODO:.*?\\[QA\\].*",
        "color": "#ff8c00",
        "description": "TODO [QA] - orange text for TODO items under QA review"
      },
      {
        "enabled": true,
        "pattern": "//\\s*TODO:.*?\\[InProgress\\].*",
        "color": "#1e90ff",
        "description": "TODO [InProgress] - blue color for TODO items in progress"
      },
      {
        "enabled": true,
        "flags": "ms",
        "pattern": "/\\*\\s*TODO[\\s\\S]*?\\*/",
        "color": "#ff8c00",
        "description": "Multi-line block TODO"
      },
      {
        "enabled": true,
        "ignoreInComments": true,
        "ignoreInString": true,
        "condition": "import React",
        "conditionFlags": "i",
        "pattern": "\\bReact\\b",
        "color": "#61dafb",
        "description": "React components"
      },
      {
        "enabled": true,
        "ignoreInComments": true,
        "ignoreInString": true,
        "flags": "m",
        "pattern": "^\\s*console\\.(log|error|warn|info)",
        "color": "#ff6b35",
        "description": "Console calls (multiline aware)"
      }
    ]
  }
}
```

## Installation

Method 1: From VSIX

Option A — Manual download and install
1. Download the VSIX for the release (example):

  https://github.com/narrentum/VS-Code-Decorator/releases/download/v1.2.1/code-decorator-1.2.1.vsix

2. In VS Code: open the Command Palette (Ctrl+Shift+P) → "Extensions: Install from VSIX..."
3. Select the downloaded `.vsix` file and reload the editor.

Option B — Command line (macOS / Linux)
```bash
# Download and install
curl -L "https://github.com/narrentum/VS-Code-Decorator/releases/download/v1.2.1/code-decorator-1.2.1.vsix" -o code-decorator.vsix
code --install-extension code-decorator.vsix
```

Option C — PowerShell (Windows)
```powershell
# Download and install
Invoke-WebRequest -Uri "https://github.com/narrentum/VS-Code-Decorator/releases/download/v1.2.1/code-decorator-1.2.1.vsix" -OutFile "code-decorator.vsix"
code --install-extension code-decorator.vsix
```

Method 2: Build from source
1. Clone the repository and open it in VS Code:
```bash
git clone https://github.com/narrentum/VS-Code-Decorator.git
cd VS-Code-Decorator
code .
```
2. Install dependencies:
```bash
npm install
```
3. Build and package (creates a VSIX with the current version):
```bash
# install vsce if you don't have it
npm install -g vsce
# package extension (the produced file will include the version from package.json)
vsce package
```
4. Install the generated VSIX the same way as above (Command Palette → "Extensions: Install from VSIX...").
5. Test during development: press `F5` to launch the Extension Development Host.

## 🎯 Advanced Features

- **Regex Support**: Both condition and pattern support regular expressions
- **Rule Priority**: Rules are processed in order, each with independent styling
- **Individual Control**: Enable/disable individual rules without affecting others
- **Live Updates**: Changes in settings apply immediately without restart
- **Settings Override Priority**: Extension decorations take precedence over:
  - VS Code theme colors
  - `editor.semanticTokenColorCustomizations`
  - Other syntax highlighting extensions

> **💡 Pro Tip**: This extension's decorations will override your theme's token colors and semantic highlighting. Perfect for creating consistent code highlighting across different themes!

## 🤝 Development & Collaboration

This VS Code extension was developed in collaboration with **GitHub Copilot**, leveraging AI-assisted development for:
- Code architecture and implementation
- Advanced regex pattern matching
- TypeScript best practices
- VS Code API integration
- Documentation and examples

The combination of human creativity and AI assistance resulted in a robust, feature-rich extension that handles complex decoration scenarios with ease.

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📸 Screenshots & Demo

![Code Decorator in Action](https://raw.githubusercontent.com/narrentum/VS-Code-Decorator/main/images/preview.png)

*Example showing the Code Decorator extension highlighting different patterns:*
- `_this` variables in blue (when "using _this" condition is met)
- TODO comments with different statuses ([Fixed], [QA], [InProgress])
- Console statements always highlighted
- Critical comments with borders and underlines

---

💡 **Tip**: Use the `example-settings.json` file as a starting point for your configuration!

## Example settings (per-group highlights)

If you'd like to highlight only a specific capture group (for example, color only `LogWarning` and not the `Debug.` prefix), use capture groups in your pattern and the `groupColors` / `groupBackgrounds` / `groupTextDecorations` arrays to style each group.

Example (copy into your settings.json):

```json
"codeDecorator.rules": [
  {
    "pattern": "^(?!\\s*//).*?(?:Debug\\.)?(LogWarning)",
    "flags": "gm",
    "groupColors": ["#ff8800"],
    "groupTextDecorations": ["underline"],
    "description": "Highlight only the LogWarning part (orange underline) and skip lines that begin with //"
  }
]
```

Notes:
- The example uses a negative lookahead `^(?!\\s*//)` to skip lines that start with `//` (single-line comments).
- `groupColors` maps to the capture groups in your regex; the first entry colors the first capture group, and so on.
