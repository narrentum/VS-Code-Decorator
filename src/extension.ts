// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Interface for decoration rules
interface DecorationRule {
	condition: string;
	pattern: string;
	// Optional RegExp flags for the main pattern (e.g. "gim", "ms")
	flags?: string;
	// Optional RegExp flags for the condition check (no 'g' needed, recommended "i" or "m")
	conditionFlags?: string;
	// Optional per-capture-group colors/backgrounds/textDecorations. Index 0 => first capture group
	groupColors?: string[];
	groupBackgrounds?: string[];
	groupTextDecorations?: string[];
	ignoreInString?: boolean;
	ignoreInComments?: boolean;
	color?: string;
	backgroundColor?: string;
	borderColor?: string;
	textDecoration?: string; // New field for text decoration (strikethrough, underline, etc.)
	enabled?: boolean;
	description?: string;
}

// Map to store decoration types for each rule
let decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

// Global runtime enabled flag (reads from configuration on activate)
let runtimeEnabled: boolean = true;

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
				// Base decoration for whole match
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

				// Create per-capture-group decoration types if arrays provided
				if (rule.groupColors && Array.isArray(rule.groupColors)) {
					rule.groupColors.forEach((gc, gi) => {
						const opts: any = { color: gc };
						if (rule.groupBackgrounds && rule.groupBackgrounds[gi]) {
							opts.backgroundColor = rule.groupBackgrounds[gi];
						}
						if (rule.groupTextDecorations && rule.groupTextDecorations[gi]) {
							opts.textDecoration = rule.groupTextDecorations[gi];
						}
						const gDec = vscode.window.createTextEditorDecorationType(opts);
						decorationTypes.set(`rule-${index}-group-${gi}`, gDec);
					});
				}
			}
		});
	}

	// Initialize decoration styles
	updateDecorationStyles();

	// Initialize runtimeEnabled from configuration
	runtimeEnabled = getConfiguration().enabled;

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
					// Use optional conditionFlags (defaults to case-insensitive 'i')
					const condFlags = rule.conditionFlags && rule.conditionFlags.length > 0 ? rule.conditionFlags : 'i';
					conditionRegex = new RegExp(rule.condition, condFlags);
				} catch (e) {
					console.log(`Code Decorator: Invalid condition regex for rule ${index}:`, e);
					return;
				}

					hasCondition = conditionRegex.test(text);
					console.log(`Code Decorator: Rule ${index} condition found:`, hasCondition);
			}

			if (!hasCondition) {
				// Clear decorations if condition not found
				activeEditor.setDecorations(decorationType, []);
				return;
			}

			// Find all pattern occurrences
			let patternRegex: RegExp;
			try {
				// Try to use as regex first. Allow rule.flags to control regex modes (multiline, dotAll, etc.).
				// Ensure 'g' is present so we can iterate over all matches.
				const userFlags = rule.flags || '';
				const flags = userFlags.includes('g') ? userFlags : (userFlags + 'g');
				patternRegex = new RegExp(rule.pattern, flags);
			} catch (e) {
				// If not valid regex, escape and use as literal string
				const escapedPattern = rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const userFlags = rule.flags || '';
				const flags = userFlags.includes('g') ? userFlags : (userFlags + 'g');
				patternRegex = new RegExp(escapedPattern + '\\b', flags);
			}

			const decorations: vscode.DecorationOptions[] = [];
			// Prepare per-group decoration arrays when groupColors are used
			const groupDecorations: { [key: number]: vscode.DecorationOptions[] } = {};
			if (rule.groupColors && Array.isArray(rule.groupColors)) {
				for (let gi = 0; gi < rule.groupColors.length; gi++) {
					groupDecorations[gi] = [];
				}
			}
			let match;
			let matchCount = 0;

			// Reset the regex lastIndex
			patternRegex.lastIndex = 0;

			while ((match = patternRegex.exec(text)) !== null) {
			// If rule requests ignoring matches inside strings, do a quick check
			const matchStart = match.index;
			const matchEnd = match.index + match[0].length;
				// If this rule wants to ignore matches inside string literals, run a quick check on the match position
				if (rule.ignoreInString) {
					// We'll check the character counts of quotes before the match in the whole document up to matchStart
					// This is a heuristic: counts of unescaped quotes (", ', `) mod 2 indicate if inside a literal.
					const before = text.slice(0, matchStart);
					const countUnescaped = (s: string, q: string) => {
						let c = 0;
						for (let i = 0; i < s.length; i++) {
							if (s[i] === q) {
								// count only if not escaped
								if (i === 0 || s[i - 1] !== '\\') c++;
							}
						}
						return c;
					};

					const dbl = countUnescaped(before, '"');
					const sgl = countUnescaped(before, "'");
					const tpl = countUnescaped(before, '`');

					// If any of the counts is odd, we assume the match is inside that type of string and skip
					if ((dbl % 2) === 1 || (sgl % 2) === 1 || (tpl % 2) === 1) {
						// skip this match entirely
						continue;
					}
				}

				// If rule requests ignoring matches inside comments, do a quick check
				if (rule.ignoreInComments) {
					// Quick check for single-line comment: if '//' appears before match on the same line
					const lineStart = text.lastIndexOf('\n', matchStart) + 1; // 0 if not found
					const linePrefix = text.slice(lineStart, matchStart);
					if (linePrefix.indexOf('//') !== -1) {
						continue; // inside single-line comment
					}

					// Quick check for block comment by searching for nearest '/*' before and '*/' after
					const lastOpen = text.lastIndexOf('/*', matchStart);
					if (lastOpen !== -1) {
						const nextClose = text.indexOf('*/', lastOpen);
						if (nextClose === -1 || nextClose > matchStart) {
							// We're inside a /* ... */ block (no closing before match)
							continue;
						}
					}
				}

				// If capture groups are present and there are per-group decoration types, collect decorations per group
				if (match.length > 1 && rule.groupColors && Array.isArray(rule.groupColors) && rule.groupColors.length > 0) {
					for (let gi = 0; gi < rule.groupColors.length; gi++) {
						const captured = match[gi + 1];
						if (!captured) continue;
						const offsetInMatch = match[0].indexOf(captured);
						if (offsetInMatch < 0) continue;
						const startIndex = match.index + offsetInMatch;
						const endIndex = startIndex + captured.length;
						const startPos = document.positionAt(startIndex);
						const endPos = document.positionAt(endIndex);
						const hover = `Code Decorator Rule ${index + 1} (group ${gi + 1}): ${rule.description || rule.pattern}`;
						// push into the group's decoration array (will be applied later)
						if (!groupDecorations[gi]) groupDecorations[gi] = [];
						groupDecorations[gi].push({ range: new vscode.Range(startPos, endPos), hoverMessage: hover });
					}
					matchCount++;
				} else {
					const startPos = document.positionAt(match.index);
					const endPos = document.positionAt(match.index + match[0].length);
					const decoration = {
						range: new vscode.Range(startPos, endPos),
						hoverMessage: `Code Decorator Rule ${index + 1}: ${rule.description || rule.pattern}`
					};
					decorations.push(decoration);
					matchCount++;
				}
			}

			console.log(`Code Decorator: Rule ${index} found ${matchCount} matches`);

			// Apply decorations for this rule
			// If group decorations were collected, apply them to their corresponding decoration types
			if (rule.groupColors && Array.isArray(rule.groupColors) && rule.groupColors.length > 0) {
				for (let gi = 0; gi < rule.groupColors.length; gi++) {
					const gDec = decorationTypes.get(`rule-${index}-group-${gi}`);
					const arr = groupDecorations[gi] || [];
					if (gDec) {
						activeEditor.setDecorations(gDec, arr);
					}
				}
				// Ensure base decoration is cleared when group-specific decorations are used
				activeEditor.setDecorations(decorationType, []);
			} else {
				activeEditor.setDecorations(decorationType, decorations);
			}
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

	// The commands have been defined in the package.json file
	// Implement the Hello World command
	const helloDisposable = vscode.commands.registerCommand('Decorator.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Code Decorator!');
	});

	// Implement runtime toggle command (does not persist to settings)
	const toggleDisposable = vscode.commands.registerCommand('codeDecorator.toggle', () => {
		runtimeEnabled = !runtimeEnabled;
		updateDecorations();
		vscode.window.showInformationMessage(`Code Decorator ${runtimeEnabled ? 'enabled' : 'disabled'} (runtime)`);
	});

	context.subscriptions.push(helloDisposable, toggleDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Clean up all decoration types
	decorationTypes.forEach(decorationType => decorationType.dispose());
	decorationTypes.clear();
}
