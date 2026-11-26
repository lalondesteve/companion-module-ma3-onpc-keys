import type { SomeCompanionConfigField } from '@companion-module/base'

export type Transport = 'auto' | 'osc' | 'terminal'

export type ModuleConfig = {
	transport: Transport
	host: string
	oscPort: number
	terminalPath: string
	user: string
	display: number
}

export const DEFAULT_CONFIG: ModuleConfig = {
	transport: 'auto',
	host: '127.0.0.1',
	oscPort: 8081,
	terminalPath: '/Applications/grandMA3 Terminal 2.5.1.1.app/Contents/MacOS/app_terminal',
	user: 'steve',
	display: 1,
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'How it works',
			width: 12,
			value:
				'Each press runs Lua Keyboard() inside onPC on the chosen display, so onPC does not need focus. ' +
				'Keys with no default shortcut are bound to a temporary unused shortcut for the moment of the press and cleaned up right after, ' +
				'and ShCuts is only turned on for the press itself. ' +
				'Commands go over OSC (/cmd) when onPC accepts them, otherwise through a grandMA3 Terminal session. ' +
				'For OSC, enable an OSC line in onPC (In & Out → OSC) with Receive Command on this port, and Enable Input.',
		},
		{
			type: 'dropdown',
			id: 'transport',
			label: 'Transport',
			width: 6,
			default: DEFAULT_CONFIG.transport,
			choices: [
				{ id: 'auto', label: 'OSC first, grandMA3 Terminal fallback' },
				{ id: 'osc', label: 'OSC only' },
				{ id: 'terminal', label: 'grandMA3 Terminal only' },
			],
		},
		{ type: 'textinput', id: 'host', label: 'onPC IP', width: 3, default: DEFAULT_CONFIG.host },
		{
			type: 'number',
			id: 'oscPort',
			label: 'OSC port',
			width: 3,
			default: DEFAULT_CONFIG.oscPort,
			min: 1,
			max: 65535,
		},
		{
			type: 'textinput',
			id: 'user',
			label: 'grandMA3 user (whose ShCuts are used)',
			width: 6,
			default: DEFAULT_CONFIG.user,
			regex: '/^[A-Za-z0-9 _.-]+$/',
		},
		{
			type: 'number',
			id: 'display',
			label: 'Display number',
			width: 6,
			default: DEFAULT_CONFIG.display,
			min: 1,
			max: 99,
		},
		{
			type: 'textinput',
			id: 'terminalPath',
			label: 'grandMA3 Terminal executable (app_terminal)',
			width: 12,
			default: DEFAULT_CONFIG.terminalPath,
		},
	]
}
