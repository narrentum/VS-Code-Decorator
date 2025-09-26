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

## 🔧 Configuration

Go to **File > Preferences > Settings** and search for "Code Decorator".

### Main Settings:

- **`codeDecorator.rules`** - Array of decoration rules
- **`codeDecorator.enabled`** - Global enable/disable toggle

### Rule Structure:
```json
{
  "condition": "trigger pattern",      // When this is found...
  "pattern": "what to highlight",      // ...highlight this
  "color": "#hex-color",              // Text color
  "backgroundColor": "rgba(...)",      // Background color
  "borderColor": "#hex-color",        // Border color
  "textDecoration": "line-through",   // Text decoration: line-through, underline, etc.
  "enabled": true,                    // Enable this rule
  "description": "Rule description"   // For reference
}
```

## 📝 Example Configuration

```json
{
  "codeDecorator.rules": [
    // Rule 1: Main _this functionality
    {
      "condition": "using _this",
      "pattern": "(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)(?=(?:[^']*'[^']*')*[^']*$)(?=(?:[^`]*`[^`]*`)*[^`]*$)\\b_this\\b",
      "color": "#569CD6",
      "backgroundColor": "rgba(0, 102, 255, 0.1)",
      "enabled": true,
      "description": "Highlight _this variables in blue (excluding strings)"
    },
    
    // Rule 2: TODO [Fixed] - strike through with gray
    {
      "condition": "",
      "pattern": "//\\s*TODO:.*?\\[Fixed\\].*",
      "color": "#888888",
      "backgroundColor": "",
      "borderColor": "",
      "textDecoration": "line-through",
      "enabled": true,
      "description": "Strike through completed TODO items with [Fixed] status"
    },
    
    // Rule 3: TODO [QA] - orange text
    {
      "condition": "",
      "pattern": "//\\s*TODO:.*?\\[QA\\].*",
      "color": "#ff8c00",
      "backgroundColor": "",
      "borderColor": "",
      "enabled": true,
      "description": "TODO items under QA review - orange text"
    },
    
    // Rule 4: TODO [InProgress] - blue text
    {
      "condition": "",
      "pattern": "//\\s*TODO:.*?\\[InProgress\\].*",
      "color": "#1e90ff",
      "backgroundColor": "",
      "borderColor": "",
      "enabled": true,
      "description": "TODO items in progress - blue color"
    },
    
    // Rule 5: FIXME [Fixed] - also strike through
    {
      "condition": "",
      "pattern": "//\\s*FIXME:.*?\\[Fixed\\].*",
      "color": "#888888",
      "backgroundColor": "",
      "borderColor": "",
      "textDecoration": "line-through",
      "enabled": true,
      "description": "Strike through fixed FIXME items"
    },
    
    // Rule 6: React components (with condition)
    {
      "condition": "import React",
      "pattern": "React",
      "color": "#61dafb",
      "backgroundColor": "rgba(97, 218, 251, 0.1)",
      "borderColor": "",
      "enabled": true,
      "description": "Highlight React in cyan"
    },
    
    // Rule 7: Console (always active)
    {
      "condition": "",
      "pattern": "console\\.(log|error|warn|info)",
      "color": "#ff6b35",
      "backgroundColor": "rgba(255, 107, 53, 0.1)",
      "borderColor": "",
      "enabled": true,
      "description": "Always highlight console calls"
    },
    
    // Rule 8: Critical comments
    {
      "condition": "",
      "pattern": "//\\s*(\\[CRITICAL\\]|\\[URGENT\\]|\\[SECURITY\\]).*",
      "color": "#ff0000",
      "backgroundColor": "rgba(255, 0, 0, 0.1)",
      "borderColor": "",
      "enabled": true,
      "description": "Critical comments - red color"
    }
  ],
  "codeDecorator.enabled": true
}
```

##  Installation

### Method 1: From VSIX

**Option A: Manual Download**
1. Download `code-decorator-v1.1.0.vsix` from [Releases](https://github.com/narrentum/VS-Code-Decorator/raw/main/code-decorator-v1.1.0.vsix)
2. In VS Code: `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
3. Select the downloaded .vsix file
4. Reload VS Code

**Option B: Command Line (Linux/Mac)**
```bash
# Download and install
curl -L "https://github.com/narrentum/VS-Code-Decorator/raw/main/code-decorator-v1.1.0.vsix" -o code-decorator.vsix
code --install-extension code-decorator.vsix
```

**Option C: PowerShell (Windows)**
```powershell
# Download and install
Invoke-WebRequest -Uri "https://github.com/narrentum/VS-Code-Decorator/raw/main/code-decorator-v1.1.0.vsix" -OutFile "code-decorator.vsix"
code --install-extension code-decorator.vsix
```

### Method 2: Build from Source
1. **Clone repository:**
   ```bash
   git clone https://github.com/narrentum/VS-Code-Decorator.git
   cd VS-Code-Decorator
   ```

2. **Open in VS Code:**
   ```bash
   code .
   ```

3. **Install dependencies:**
   - Open terminal in VS Code: `Ctrl+Shift+`` (backtick)
   - Run: `npm install`

4. **Build the extension:**
   - Install VSCE globally: `npm install -g vsce`
   - Create VSIX package: `vsce package`
   - This creates `code-decorator-1.1.0.vsix`

5. **Install your build:**
   - Press `Ctrl+Shift+P`
   - Type "Extensions: Install from VSIX..."
   - Select your generated `.vsix` file
   - Reload VS Code

6. **Test during development:**
   - Press `F5` to launch Extension Development Host (for testing changes)

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
