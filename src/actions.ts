import type { DropdownChoice } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { EXECUTOR_MAX, EXECUTOR_MIN, MA_KEY_MAP, MA_KEYS, parseExecutorIndex } from './keys.js'

export type Phase = 'tap' | 'down' | 'up'

export type ActionsSchema = {
	ma_key: { options: { key: string; phase: Phase } }
	ma_exec: { options: { executor: number; phase: Phase } }
	shortcut: { options: { shortcut: string; phase: Phase } }
}

const PHASES: DropdownChoice<Phase>[] = [
	{ id: 'down', label: 'Press (put on button down)' },
	{ id: 'up', label: 'Release (put on button up)' },
	{ id: 'tap', label: 'Tap (press and release)' },
]

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		ma_key: {
			name: 'Hardware key',
			description:
				'Press or release any grandMA3 hardware key or special executor. For console-like behavior, ' +
				'use Press on button down and Release on button up (the presets do this).',
			options: [
				{
					id: 'key',
					type: 'dropdown',
					label: 'Key',
					default: 'STORE',
					choices: MA_KEYS.map((k) => ({
						id: k.id,
						label: k.defaultShortcut ? `${k.label}  (${k.defaultShortcut})` : k.label,
					})),
					minChoicesForSearch: 0,
				},
				{ id: 'phase', type: 'dropdown', label: 'Phase', default: 'tap', choices: PHASES },
			],
			callback: async (event) => {
				const key = MA_KEY_MAP.get(event.options.key)
				if (!key) throw new Error(`unknown key ${event.options.key}`)
				await self.sendMaKey(key, event.options.phase)
			},
		},
		ma_exec: {
			name: 'Executor key',
			description:
				'Press or release an executor key on the current page (101–190, 201–290, 301–390, 401–490). ' +
				'For console-like behavior (Flash, Temp, Swop), use Press on button down and Release on button up.',
			options: [
				{
					id: 'executor',
					type: 'number',
					label: 'Executor number',
					default: 101,
					min: EXECUTOR_MIN,
					max: EXECUTOR_MAX,
				},
				{ id: 'phase', type: 'dropdown', label: 'Phase', default: 'tap', choices: PHASES },
			],
			callback: async (event) => {
				const exec = parseExecutorIndex(event.options.executor)
				await self.sendExecutor(exec, event.options.phase)
			},
		},
		shortcut: {
			name: 'Custom shortcut',
			description: 'Press any onPC keyboard shortcut in MA notation, e.g. "S", "Ctrl+Alt+S", "Delete", "F10".',
			options: [
				{ id: 'shortcut', type: 'textinput', label: 'Shortcut', default: 'S' },
				{ id: 'phase', type: 'dropdown', label: 'Phase', default: 'tap', choices: PHASES },
			],
			callback: async (event) => {
				await self.sendShortcut(event.options.shortcut, event.options.phase, event.options.shortcut)
			},
		},
	})
}
