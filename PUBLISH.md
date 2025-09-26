# Publishing Instructions

## Steps to publish your Code Decorator extension:

### 1. Create GitHub Repository
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Code Decorator VS Code Extension"

# Create repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2. Update README.md Image Links
Replace both instances of:
```
https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/images/preview.png
```

With your actual repository path:
```
https://raw.githubusercontent.com/yourusername/code-decorator/main/images/preview.png
```

### 3. Publish to VS Code Marketplace (Optional)
```bash
# Install vsce globally if not installed
npm install -g vsce

# Create publisher account on https://marketplace.visualstudio.com/

# Publish extension
vsce publish
```

### 4. Install Locally
```bash
# Install the .vsix file
code --install-extension code-decorator-final.vsix
```

## Files Structure
```
code-decorator/
├── src/
│   └── extension.ts
├── images/
│   └── preview.png
├── icon.png
├── package.json
├── README.md
├── LICENSE
└── .vscodeignore
```

## Current Package
- **File**: `code-decorator-final.vsix`
- **Size**: 224.25KB
- **Version**: 0.0.4
- **Ready for**: Local installation and GitHub publishing