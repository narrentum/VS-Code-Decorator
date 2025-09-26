// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Interface for decoration rules
interface DecorationRule {
	condition: string;
	pattern: string;
	color?: string;
	backgroundColor?: string;
	borderColor?: string;
	textDecoration?: string; // New field for text decoration (strikethrough, underline, etc.)
	enabled?: boolean;
	description?: string;
}

// Map to store decoration types for each rule
let decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('Code Decorator extension is now active!');

	// Function to get current configuration
	function getConfiguration() {
		const config = vscode.workspace.getConfiguration('codeDecorator');
		return {
			rules: config.get<DecorationRule[]>('rules', []),
			enabled: config.get<boolean>('enabled', true)
		};
	}

	// Function to create/update decoration styles for all rules
	function updateDecorationStyles() {
		// Dispose all existing decoration types
		decorationTypes.forEach(decorationType => decorationType.dispose());
		decorationTypes.clear();

		const config = getConfiguration();
		
		// Create decoration type for each rule
		config.rules.forEach((rule, index) => {
			if (rule.enabled !== false) { // enabled by default
				const decorationOptions: any = {
					color: rule.color || '#0066ff',
					fontWeight: 'bold',
					borderRadius: '2px'
				};

				// Add background color if specified
				if (rule.backgroundColor && rule.backgroundColor.trim() !== '') {
					decorationOptions.backgroundColor = rule.backgroundColor;
				}

				// Only add border if borderColor is specified and not empty
				if (rule.borderColor && rule.borderColor.trim() !== '' && rule.borderColor !== 'transparent') {
					decorationOptions.border = `1px solid ${rule.borderColor}`;
				}

				// Add text decoration if specified (strikethrough, underline, etc.)
				if (rule.textDecoration && rule.textDecoration.trim() !== '') {
					decorationOptions.textDecoration = rule.textDecoration;
				}

				const decorationType = vscode.window.createTextEditorDecorationType(decorationOptions);
				decorationTypes.set(`rule-${index}`, decorationType);
			}
		});
	}

	// Initialize decoration styles
	updateDecorationStyles();

	// Function to apply decorations
	function updateDecorations() {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}

		const config = getConfiguration();
		
		// Check if decoration is globally enabled
		if (!config.enabled) {
			// Clear all decorations
			decorationTypes.forEach(decorationType => {
				activeEditor.setDecorations(decorationType, []);
			});
			return;
		}

		const document = activeEditor.document;
		const text = document.getText();

		console.log('Code Decorator: Processing', config.rules.length, 'rules');

		// Process each rule
		config.rules.forEach((rule, index) => {
			const ruleKey = `rule-${index}`;
			const decorationType = decorationTypes.get(ruleKey);
			
			if (!decorationType || rule.enabled === false) {
				// Clear decorations for disabled rules
				if (decorationType) {
					activeEditor.setDecorations(decorationType, []);
				}
				return;
			}

			console.log(`Code Decorator: Processing rule ${index}: condition="${rule.condition || 'ALWAYS'}", pattern="${rule.pattern}"`);

			let hasCondition = true;

			// Check condition only if it's specified
			if (rule.condition && rule.condition.trim() !== '') {
				let conditionRegex: RegExp;
				try {
					conditionRegex = new RegExp(rule.condition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
				} catch (e) {
					console.log(`Code Decorator: Invalid condition regex for rule ${index}:`, e);
					return;
				}

				hasCondition = conditionRegex.test(text);
				console.log(`Code Decorator: Rule ${index} condition found:`, hasCondition);
			} else {
				console.log(`Code Decorator: Rule ${index} has no condition - always active`);
			}

			if (!hasCondition) {
				// Clear decorations if condition not found
				activeEditor.setDecorations(decorationType, []);
				return;
			}

			// Find all pattern occurrences
			let patternRegex: RegExp;
			try {
				// Try to use as regex first
				patternRegex = new RegExp(rule.pattern, 'g');
			} catch (e) {
				// If not valid regex, escape and use as literal string
				const escapedPattern = rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				patternRegex = new RegExp(escapedPattern + '\\b', 'g');
			}

			const decorations: vscode.DecorationOptions[] = [];
			let match;
			let matchCount = 0;

			// Reset the regex lastIndex
			patternRegex.lastIndex = 0;

			while ((match = patternRegex.exec(text)) !== null) {
				const startPos = document.positionAt(match.index);
				const endPos = document.positionAt(match.index + match[0].length);
				
				const decoration = {
					range: new vscode.Range(startPos, endPos),
					hoverMessage: `Code Decorator Rule ${index + 1}: ${rule.description || rule.pattern}`
				};
				
				decorations.push(decoration);
				matchCount++;
			}

			console.log(`Code Decorator: Rule ${index} found ${matchCount} matches`);

			// Apply decorations for this rule
			activeEditor.setDecorations(decorationType, decorations);
		});
	}

	// Update decorations when active editor changes
	vscode.window.onDidChangeActiveTextEditor(updateDecorations, null, context.subscriptions);

	// Update decorations when document content changes
	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document === vscode.window.activeTextEditor?.document) {
			updateDecorations();
		}
	}, null, context.subscriptions);

	// Update decoration styles when configuration changes
	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('codeDecorator')) {
			updateDecorationStyles();
			updateDecorations();
		}
	}, null, context.subscriptions);

	// Initial decoration update
	updateDecorations();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('Decorator.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Code Decorator!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Clean up all decoration types
	decorationTypes.forEach(decorationType => decorationType.dispose());
	decorationTypes.clear();
}
