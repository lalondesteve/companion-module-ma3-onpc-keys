import type { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'
import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import { MA_KEYS, type KeyCategory } from './keys.js'

const KEYPAD_KEYS = [
	'NUM7',
	'NUM8',
	'NUM9',
	'STORE',
	'NUM4',
	'NUM5',
	'NUM6',
	'CLEAR',
	'NUM1',
	'NUM2',
	'NUM3',
	'MA',
	'NUM0',
	'DOT',
	'PLEASE',
]

const CATEGORY_GROUPS: ReadonlyArray<{ id: KeyCategory; name: string }> = [
	{ id: 'command', name: 'Command & edit' },
	{ id: 'syntax', name: 'Syntax & numbers' },
	{ id: 'objects', name: 'Objects' },
	{ id: 'playback', name: 'Playback' },
	{ id: 'modes', name: 'Modes & system' },
	{ id: 'navigation', name: 'Navigation, grid & MAtricks' },
	{ id: 'xkeys', name: 'X-Keys' },
	{ id: 'encoders', name: 'Encoders' },
	{ id: 'displays', name: 'onPC displays' },
	{ id: 'special_exec', name: 'Special executors' },
]

const EXECUTOR_ROWS: ReadonlyArray<{ id: string; name: string; start: number; count: number }> = [
	{ id: 'exec_100', name: 'Row 100 (101–115)', start: 101, count: 15 },
	{ id: 'exec_200', name: 'Row 200 (201–215)', start: 201, count: 15 },
	{ id: 'exec_300', name: 'Row 300 (301–315)', start: 301, count: 15 },
	{ id: 'exec_400', name: 'Row 400 (401–415)', start: 401, count: 15 },
]

const COLORS: Record<string, number> = {
	STORE: 0xb00000,
	CLEAR: 0xb08a00,
	PLEASE: 0x007a2a,
	ESC: 0x404040,
	MA: 0x8a8a8a,
	MA2: 0x8a8a8a,
	SPECIAL_GRAND_KNOB: 0x8a0000,
}

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}

	for (const key of MA_KEYS) {
		const isToggle = key.kind === 'shortcuts_toggle'
		presets[`key_${key.id}`] = {
			type: 'simple',
			name: key.label,
			style: {
				text: key.label,
				size: 'auto',
				color: 0xffffff,
				bgcolor: COLORS[key.id] ?? 0x1a1a1a,
				show_topbar: false,
			},
			steps: [
				isToggle
					? {
							down: [{ actionId: 'ma_key', options: { key: key.id, phase: 'tap' } }],
							up: [],
						}
					: {
							down: [{ actionId: 'ma_key', options: { key: key.id, phase: 'down' } }],
							up: [{ actionId: 'ma_key', options: { key: key.id, phase: 'up' } }],
						},
			],
			feedbacks: [],
		}
	}

	const execDefinitions = EXECUTOR_ROWS.map((row) => {
		const ids: string[] = []
		for (let i = 0; i < row.count; i++) {
			const num = row.start + i
			const presetId = `exec_${num}`
			ids.push(presetId)
			presets[presetId] = {
				type: 'simple',
				name: `Exec ${num}`,
				style: {
					text: `Exec\\n${num}`,
					size: 'auto',
					color: 0xffffff,
					bgcolor: 0x1a1a1a,
					show_topbar: false,
				},
				steps: [
					{
						down: [{ actionId: 'ma_exec', options: { executor: num, phase: 'down' } }],
						up: [{ actionId: 'ma_exec', options: { executor: num, phase: 'up' } }],
					},
				],
				feedbacks: [],
			}
		}
		return { id: row.id, name: row.name, type: 'simple' as const, presets: ids }
	})

	const known = new Set(MA_KEYS.map((k) => k.id))
	const structure: CompanionPresetSection[] = [
		{
			id: 'keys',
			name: 'grandMA3 keys',
			definitions: [
				{
					id: 'keypad',
					name: 'Keypad',
					type: 'simple' as const,
					presets: KEYPAD_KEYS.filter((id) => known.has(id)).map((id) => `key_${id}`),
				},
				...CATEGORY_GROUPS.map((g) => ({
					id: g.id,
					name: g.name,
					type: 'simple' as const,
					presets: MA_KEYS.filter((k) => k.category === g.id).map((k) => `key_${k.id}`),
				})),
			],
		},
		{
			id: 'executors',
			name: 'Executors',
			definitions: execDefinitions,
		},
	]

	self.setPresetDefinitions(structure, presets)
}
