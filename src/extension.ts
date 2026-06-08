import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface DecorationRule {
	kind?: string;
	settings?: string[];
	condition?: string;
	pattern?: string;
	flags?: string;
	conditionFlags?: string;
	groupColors?: string[];
	groupBackgrounds?: string[];
	groupTextDecorations?: string[];
	ignoreInString?: boolean;
	ignoreInComments?: boolean;
	color?: string;
	backgroundColor?: string;
	borderColor?: string;
	textDecoration?: string;
	enabled?: boolean;
	description?: string;
	languageIds?: string[];
	on?: boolean | string;
	noStr?: boolean | string;
	noComm?: boolean | string;
	bg?: string;
	decor?: string;
	groups?: string[] | string;
}

interface DecorationRequest {
	documentText: string;
	languageId: string;
	fileName: string;
	maxFileLength: number;
	regexTimeoutMs: number;
	version: number;
	rules: DecorationRule[];
}

interface DecorationRange {
	startLine: number;
	startCharacter: number;
	endLine: number;
	endCharacter: number;
}

interface DecorationBucket {
	ruleId: string;
	ruleDescription: string;
	color?: string;
	backgroundColor?: string;
	borderColor?: string;
	textDecoration?: string;
	ranges: DecorationRange[];
}

interface DecorationDiagnostic {
	ruleDescription?: string;
	severity?: string;
	message: string;
}

interface DecorationResponse {
	success: boolean;
	skipped: boolean;
	skipReason?: string;
	elapsedMs: number;
	buckets: DecorationBucket[];
	diagnostics: DecorationDiagnostic[];
}

interface DecoratorConfiguration {
	rules: DecorationRule[];
	enabled: boolean;
	ignoreInCommentsDefault: boolean;
	ignoreInStringDefault: boolean;
	nativeEnabled: boolean;
	nativePath: string;
	maxFileLength: number;
	regexTimeoutMs: number;
	debounceMs: number;
}

let decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
let runtimeEnabled = true;
let updateTimer: NodeJS.Timeout | undefined;
let requestSerial = 0;
let outputChannel: vscode.OutputChannel;
let extensionContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
	extensionContext = context;
	outputChannel = vscode.window.createOutputChannel('Code Decorator');
	context.subscriptions.push(outputChannel);

	runtimeEnabled = getConfiguration().enabled;
	outputChannel.appendLine('Code Decorator extension is active.');

	vscode.window.onDidChangeActiveTextEditor(() => scheduleDecorationUpdate(), null, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document === vscode.window.activeTextEditor?.document) {
			scheduleDecorationUpdate();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('codeDecorator')) {
			disposeDecorationTypes();
			scheduleDecorationUpdate(0);
		}
	}, null, context.subscriptions);

	const helloDisposable = vscode.commands.registerCommand('Decorator.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Code Decorator!');
	});

	const toggleDisposable = vscode.commands.registerCommand('codeDecorator.toggle', () => {
		runtimeEnabled = !runtimeEnabled;
		scheduleDecorationUpdate(0);
		vscode.window.showInformationMessage(`Code Decorator ${runtimeEnabled ? 'enabled' : 'disabled'} (runtime)`);
	});

	context.subscriptions.push(helloDisposable, toggleDisposable);
	scheduleDecorationUpdate(0);
}

export function deactivate() {
	if (updateTimer) {
		clearTimeout(updateTimer);
	}
	disposeDecorationTypes();
}

function getConfiguration(): DecoratorConfiguration {
	const config = vscode.workspace.getConfiguration('codeDecorator');
	const rawRulesSetting: unknown = config.get('rules');
	let rules: DecorationRule[] = [];
	const topIgnoreInComments = config.get<boolean>('ignoreInComments', false);
	const topIgnoreInString = config.get<boolean>('ignoreInString', false);
	let ignoreInCommentsDefault = topIgnoreInComments;
	let ignoreInStringDefault = topIgnoreInString;

	if (Array.isArray(rawRulesSetting)) {
		rules = rawRulesSetting as DecorationRule[];
	} else if (rawRulesSetting && typeof rawRulesSetting === 'object') {
		const shaped = rawRulesSetting as { ignoreInCommentsDefault?: unknown; ignoreInStringDefault?: unknown; rules?: unknown };
		ignoreInCommentsDefault = typeof shaped.ignoreInCommentsDefault === 'boolean' ? shaped.ignoreInCommentsDefault : ignoreInCommentsDefault;
		ignoreInStringDefault = typeof shaped.ignoreInStringDefault === 'boolean' ? shaped.ignoreInStringDefault : ignoreInStringDefault;
		rules = Array.isArray(shaped.rules) ? shaped.rules as DecorationRule[] : [];
	}

	return {
		rules: rules.map(normalizeRule).filter((rule): rule is DecorationRule => rule !== undefined),
		enabled: config.get<boolean>('enabled', true),
		ignoreInCommentsDefault,
		ignoreInStringDefault,
		nativeEnabled: config.get<boolean>('native.enabled', true),
		nativePath: config.get<string>('native.path', ''),
		maxFileLength: config.get<number>('maxFileLength', 500_000),
		regexTimeoutMs: config.get<number>('regexTimeoutMs', 50),
		debounceMs: config.get<number>('debounceMs', 200)
	};
}

function normalizeRule(rawRule: DecorationRule): DecorationRule | undefined {
	if (!rawRule || typeof rawRule !== 'object') {
		outputChannel.appendLine('Code Decorator warning: invalid rule object skipped.');
		return undefined;
	}

	const normalized = parseSettings(rawRule.settings);
	applyRawRuleFields(normalized, rawRule, false);
	applyRawRuleFields(normalized, rawRule, true);

	return normalized;
}

function parseSettings(settings: unknown): DecorationRule {
	const normalized: DecorationRule = {};
	if (settings === undefined) {
		return normalized;
	}

	if (!Array.isArray(settings)) {
		outputChannel.appendLine('Code Decorator warning: rule settings must be an array of strings.');
		return normalized;
	}

	settings.forEach((entry, index) => {
		if (typeof entry !== 'string') {
			outputChannel.appendLine(`Code Decorator warning: settings[${index}] is not a string and was ignored.`);
			return;
		}

		const separatorIndex = entry.indexOf(':');
		if (separatorIndex === -1) {
			if (index === 0) {
				normalized.description = entry.trim();
			} else {
				outputChannel.appendLine(`Code Decorator warning: invalid settings entry "${entry}". Expected "key: value".`);
			}
			return;
		}

		const rawKey = entry.slice(0, separatorIndex).trim();
		const rawValue = entry.slice(separatorIndex + 1).trim();
		const key = mapSettingAlias(rawKey);
		if (!key) {
			outputChannel.appendLine(`Code Decorator warning: unknown settings key "${rawKey}" ignored.`);
			return;
		}

		assignNormalizedField(normalized, key, parseSettingValue(key, rawValue));
	});

	return normalized;
}

function mapSettingAlias(key: string): keyof DecorationRule | undefined {
	const aliases: Record<string, keyof DecorationRule> = {
		on: 'enabled',
		noStr: 'ignoreInString',
		noComm: 'ignoreInComments',
		bg: 'backgroundColor',
		decor: 'textDecoration',
		groups: 'groupColors'
	};

	const supported = new Set<keyof DecorationRule>([
		'kind',
		'enabled',
		'ignoreInString',
		'ignoreInComments',
		'backgroundColor',
		'textDecoration',
		'groupColors',
		'flags',
		'color',
		'pattern',
		'description',
		'condition',
		'conditionFlags',
		'groupBackgrounds',
		'groupTextDecorations',
		'borderColor',
		'languageIds'
	]);

	return aliases[key] ?? (supported.has(key as keyof DecorationRule) ? key as keyof DecorationRule : undefined);
}

function parseSettingValue(key: keyof DecorationRule, value: string): boolean | string | string[] {
	const lowered = value.toLowerCase();
	if (lowered === 'true' || lowered === 'on') {
		return true;
	}
	if (lowered === 'false' || lowered === 'off') {
		return false;
	}

	if (key === 'groupColors' || key === 'groupBackgrounds' || key === 'groupTextDecorations' || key === 'languageIds') {
		return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
	}

	return value;
}

function applyRawRuleFields(target: DecorationRule, rawRule: DecorationRule, fullNamesOnly: boolean) {
	const fields: Array<keyof DecorationRule> = fullNamesOnly
		? [
			'kind',
			'condition',
			'pattern',
			'flags',
			'conditionFlags',
			'groupColors',
			'groupBackgrounds',
			'groupTextDecorations',
			'ignoreInString',
			'ignoreInComments',
			'color',
			'backgroundColor',
			'borderColor',
			'textDecoration',
			'enabled',
			'description',
			'languageIds'
		]
		: ['on', 'noStr', 'noComm', 'bg', 'decor', 'groups'];

	for (const field of fields) {
		if (!hasOwn(rawRule, field) || rawRule[field] === undefined) {
			continue;
		}

		const normalizedField = fullNamesOnly ? field : mapSettingAlias(field);
		if (!normalizedField) {
			continue;
		}

		assignNormalizedField(target, normalizedField, rawRule[field]);
	}
}

function assignNormalizedField(target: DecorationRule, key: keyof DecorationRule, value: unknown) {
	switch (key) {
		case 'enabled':
		case 'ignoreInString':
		case 'ignoreInComments':
			target[key] = normalizeBoolean(value, key);
			break;
		case 'groupColors':
		case 'groupBackgrounds':
		case 'groupTextDecorations':
		case 'languageIds':
			target[key] = normalizeStringArray(value, key);
			break;
		default:
			if (typeof value === 'string') {
				target[key] = value as never;
			} else {
				outputChannel.appendLine(`Code Decorator warning: setting "${key}" expects a string value.`);
			}
			break;
	}
}

function normalizeBoolean(value: unknown, key: keyof DecorationRule): boolean | undefined {
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'string') {
		const lowered = value.trim().toLowerCase();
		if (lowered === 'true' || lowered === 'on') {
			return true;
		}
		if (lowered === 'false' || lowered === 'off') {
			return false;
		}
	}

	outputChannel.appendLine(`Code Decorator warning: setting "${key}" expects true/false or on/off.`);
	return undefined;
}

function normalizeStringArray(value: unknown, key: keyof DecorationRule): string[] | undefined {
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === 'string');
	}
	if (typeof value === 'string') {
		return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
	}

	outputChannel.appendLine(`Code Decorator warning: setting "${key}" expects a string array or comma-separated string.`);
	return undefined;
}

function hasOwn<T extends object>(value: T, key: PropertyKey): boolean {
	return Object.prototype.hasOwnProperty.call(value, key);
}

function scheduleDecorationUpdate(delay?: number) {
	const config = getConfiguration();
	const debounceMs = typeof delay === 'number' ? delay : config.debounceMs;

	if (updateTimer) {
		clearTimeout(updateTimer);
	}

	updateTimer = setTimeout(() => {
		void updateDecorations();
	}, Math.max(0, debounceMs));
}

async function updateDecorations() {
	const activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) {
		return;
	}

	const config = getConfiguration();
	if (!config.enabled || !runtimeEnabled || !config.nativeEnabled) {
		clearAllDecorations(activeEditor);
		return;
	}

	const helper = resolveHelper(config.nativePath);
	if (!helper) {
		clearAllDecorations(activeEditor);
		outputChannel.appendLine('Code Decorator warning: native helper was not found. Build it with npm run compile:native or set codeDecorator.native.path.');
		return;
	}

	const document = activeEditor.document;
	const serial = ++requestSerial;
	const version = document.version;
	const request = buildRequest(document, config);

	try {
		const response = await runHelper(helper, request);
		if (serial !== requestSerial || document.version !== version || vscode.window.activeTextEditor?.document !== document) {
			return;
		}

		logDiagnostics(response);
		if (!response.success || response.skipped) {
			clearAllDecorations(activeEditor);
			return;
		}

		applyDecorationBuckets(activeEditor, response.buckets);
	} catch (error) {
		if (serial === requestSerial) {
			clearAllDecorations(activeEditor);
		}
		outputChannel.appendLine(`Code Decorator helper error: ${error instanceof Error ? error.message : String(error)}`);
	}
}

function buildRequest(document: vscode.TextDocument, config: DecoratorConfiguration): DecorationRequest {
	return {
		documentText: document.getText(),
		languageId: document.languageId,
		fileName: document.fileName,
		maxFileLength: config.maxFileLength,
		regexTimeoutMs: config.regexTimeoutMs,
		version: document.version,
		rules: config.rules.map(rule => ({
			...rule,
			enabled: rule.enabled !== false,
			ignoreInComments: typeof rule.ignoreInComments === 'boolean' ? rule.ignoreInComments : config.ignoreInCommentsDefault,
			ignoreInString: typeof rule.ignoreInString === 'boolean' ? rule.ignoreInString : config.ignoreInStringDefault
		}))
	};
}

function resolveHelper(configuredPath: string): string | undefined {
	const candidates = [
		configuredPath,
		path.join(extensionContext.extensionPath, 'native', 'CodeDecorator.Core', 'publish', 'CodeDecorator.Core.dll'),
		path.join(extensionContext.extensionPath, 'native', 'CodeDecorator.Core', 'bin', 'Release', 'net10.0', 'CodeDecorator.Core.dll'),
		path.join(extensionContext.extensionPath, 'native', 'CodeDecorator.Core', 'bin', 'Debug', 'net10.0', 'CodeDecorator.Core.dll')
	].filter(Boolean);

	return candidates.find(candidate => fs.existsSync(candidate));
}

function runHelper(helperPath: string, request: DecorationRequest): Promise<DecorationResponse> {
	return new Promise((resolve, reject) => {
		const isDll = helperPath.toLowerCase().endsWith('.dll');
		const child = isDll ? spawn('dotnet', [helperPath]) : spawn(helperPath, []);
		let stdout = '';
		let stderr = '';
		const timeout = setTimeout(() => {
			child.kill();
			reject(new Error('Native helper process timed out.'));
		}, 10_000);

		child.stdout.setEncoding('utf8');
		child.stderr.setEncoding('utf8');
		child.stdout.on('data', chunk => stdout += chunk);
		child.stderr.on('data', chunk => stderr += chunk);
		child.on('error', error => {
			clearTimeout(timeout);
			reject(error);
		});
		child.on('close', () => {
			clearTimeout(timeout);
			if (!stdout.trim()) {
				reject(new Error(stderr.trim() || 'Native helper produced no JSON response.'));
				return;
			}

			try {
				const response = JSON.parse(stdout) as DecorationResponse;
				if (stderr.trim()) {
					outputChannel.appendLine(`Code Decorator helper stderr: ${stderr.trim()}`);
				}
				resolve(response);
			} catch (error) {
				reject(new Error(`Native helper returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`));
			}
		});

		child.stdin.end(JSON.stringify(request));
	});
}

function applyDecorationBuckets(editor: vscode.TextEditor, buckets: DecorationBucket[]) {
	const activeKeys = new Set<string>();

	for (const bucket of buckets) {
		const key = styleKey(bucket);
		activeKeys.add(key);
		let decorationType = decorationTypes.get(key);
		if (!decorationType) {
			decorationType = vscode.window.createTextEditorDecorationType(toDecorationRenderOptions(bucket));
			decorationTypes.set(key, decorationType);
		}

		const options = bucket.ranges.map(range => ({
			range: new vscode.Range(
				new vscode.Position(range.startLine, range.startCharacter),
				new vscode.Position(range.endLine, range.endCharacter)
			),
			hoverMessage: bucket.ruleDescription
		}));
		editor.setDecorations(decorationType, options);
	}

	for (const [key, decorationType] of decorationTypes) {
		if (!activeKeys.has(key)) {
			editor.setDecorations(decorationType, []);
		}
	}
}

function toDecorationRenderOptions(bucket: DecorationBucket): vscode.DecorationRenderOptions {
	const options: vscode.DecorationRenderOptions = {
		color: bucket.color || '#0066ff',
		fontWeight: 'bold',
		borderRadius: '2px'
	};

	if (bucket.backgroundColor && bucket.backgroundColor.trim() !== '') {
		options.backgroundColor = bucket.backgroundColor;
	}

	if (bucket.borderColor && bucket.borderColor.trim() !== '' && bucket.borderColor !== 'transparent' && bucket.borderColor !== '#00000000') {
		options.border = `1px solid ${bucket.borderColor}`;
	}

	if (bucket.textDecoration && bucket.textDecoration.trim() !== '' && bucket.textDecoration !== 'none') {
		options.textDecoration = bucket.textDecoration;
	}

	return options;
}

function styleKey(bucket: DecorationBucket): string {
	return [
		bucket.ruleId,
		bucket.color || '',
		bucket.backgroundColor || '',
		bucket.borderColor || '',
		bucket.textDecoration || ''
	].join('|');
}

function logDiagnostics(response: DecorationResponse) {
	if (response.skipped && response.skipReason) {
		outputChannel.appendLine(`Code Decorator skipped: ${response.skipReason}`);
	}

	for (const diagnostic of response.diagnostics || []) {
		const source = diagnostic.ruleDescription ? `${diagnostic.ruleDescription}: ` : '';
		outputChannel.appendLine(`Code Decorator ${diagnostic.severity || 'info'}: ${source}${diagnostic.message}`);
	}

	outputChannel.appendLine(`Code Decorator native elapsed: ${response.elapsedMs} ms`);
}

function clearAllDecorations(editor: vscode.TextEditor) {
	for (const decorationType of decorationTypes.values()) {
		editor.setDecorations(decorationType, []);
	}
}

function disposeDecorationTypes() {
	for (const decorationType of decorationTypes.values()) {
		decorationType.dispose();
	}
	decorationTypes.clear();
}
