// Complete catalog of grandMA3 hardware keys, special executors, and onPC control keys.
// Source: grandMA3 2.5.1 Enums.SCVirtualKeyCode, Enums.SpecialExecutor, and
// shared/resource/default_keyboard_shortcuts.xml.
//
// Each hardware key is dispatched by its MA3 KeyCode (or ExecutorIndex / SpecialExec) inside
// Lua: if the user's KeyboardShortCuts profile already binds a usable shortcut, onPC uses it
// directly; otherwise a temporary unused shortcut is bound for the duration of the Keyboard()
// call and removed immediately after.

export type KeyCategory =
	| 'command'
	| 'syntax'
	| 'objects'
	| 'playback'
	| 'modes'
	| 'navigation'
	| 'xkeys'
	| 'encoders'
	| 'displays'
	| 'special_exec'

export type MaKeyKind =
	| { kind: 'keycode'; keyCode: string }
	| { kind: 'special_exec'; specialExec: string }
	| { kind: 'shortcuts_toggle' }
	| { kind: 'desk_lock' }

export type MaKey = {
	id: string
	label: string
	category: KeyCategory
	/** Default shortcut in onPC's Default profile (informational only). */
	defaultShortcut?: string
} & MaKeyKind

export const MA_KEYS: readonly MaKey[] = [
	// Command & edit
	{ id: 'STORE', label: 'Store', category: 'command', kind: 'keycode', keyCode: 'STORE', defaultShortcut: 'S' },
	{ id: 'CLEAR', label: 'Clear', category: 'command', kind: 'keycode', keyCode: 'CLEAR', defaultShortcut: 'Delete' },
	{ id: 'PLEASE', label: 'Please', category: 'command', kind: 'keycode', keyCode: 'PLEASE', defaultShortcut: 'Enter' },
	{ id: 'MA', label: 'MA', category: 'command', kind: 'keycode', keyCode: 'MA1' },
	{ id: 'MA2', label: 'MA 2', category: 'command', kind: 'keycode', keyCode: 'MA2' },
	{ id: 'ESC', label: 'Esc', category: 'command', kind: 'keycode', keyCode: 'ESC', defaultShortcut: 'Escape' },
	// In grandMA3, UNDO and OOPS share keycode 86; Display role reports OOPS.
	{ id: 'UNDO', label: 'Oops', category: 'command', kind: 'keycode', keyCode: 'OOPS', defaultShortcut: 'Backspace' },
	{ id: 'UPDATE', label: 'Update', category: 'command', kind: 'keycode', keyCode: 'UPDATE', defaultShortcut: 'U' },
	{ id: 'EDIT', label: 'Edit', category: 'command', kind: 'keycode', keyCode: 'EDIT', defaultShortcut: 'E' },
	{ id: 'DELETE', label: 'Delete', category: 'command', kind: 'keycode', keyCode: 'DELETE', defaultShortcut: 'Ctrl+D' },
	{ id: 'COPY', label: 'Copy', category: 'command', kind: 'keycode', keyCode: 'COPY', defaultShortcut: 'Ctrl+C' },
	{ id: 'MOVE', label: 'Move', category: 'command', kind: 'keycode', keyCode: 'MOVE', defaultShortcut: 'Ctrl+M' },
	{ id: 'ASSIGN', label: 'Assign', category: 'command', kind: 'keycode', keyCode: 'ASSIGN', defaultShortcut: 'Alt+A' },
	{ id: 'SET', label: 'Set', category: 'command', kind: 'keycode', keyCode: 'SET', defaultShortcut: 'Q' },
	{ id: 'CLONE', label: 'Clone', category: 'command', kind: 'keycode', keyCode: 'CLONE' },
	{ id: 'FIX', label: 'Fix', category: 'command', kind: 'keycode', keyCode: 'FIX' },
	{ id: 'FLIP', label: 'Flip', category: 'command', kind: 'keycode', keyCode: 'FLIP' },
	{ id: 'LOCATE', label: 'Locate', category: 'command', kind: 'keycode', keyCode: 'LOCATE' },

	// Syntax & numbers
	{ id: 'AT', label: 'At', category: 'syntax', kind: 'keycode', keyCode: 'AT', defaultShortcut: 'A' },
	{ id: 'THRU', label: 'Thru', category: 'syntax', kind: 'keycode', keyCode: 'THRU', defaultShortcut: 'T' },
	{ id: 'PLUS', label: '+', category: 'syntax', kind: 'keycode', keyCode: 'PLUS', defaultShortcut: 'Equal' },
	{ id: 'MINUS', label: '-', category: 'syntax', kind: 'keycode', keyCode: 'MINUS', defaultShortcut: 'Minus' },
	{ id: 'ASTERISK', label: '*', category: 'syntax', kind: 'keycode', keyCode: 'ASTERISK' },
	{ id: 'SLASH', label: '/', category: 'syntax', kind: 'keycode', keyCode: 'SLASH', defaultShortcut: 'Slash' },
	{ id: 'DOT', label: '.', category: 'syntax', kind: 'keycode', keyCode: 'DOT', defaultShortcut: 'Period' },
	{ id: 'IF', label: 'If', category: 'syntax', kind: 'keycode', keyCode: 'IF', defaultShortcut: 'I' },
	{ id: 'FULL', label: 'Full', category: 'syntax', kind: 'keycode', keyCode: 'FULL', defaultShortcut: 'Ctrl+F' },
	{ id: 'NUM0', label: '0', category: 'syntax', kind: 'keycode', keyCode: 'NUM0', defaultShortcut: '0' },
	{ id: 'NUM1', label: '1', category: 'syntax', kind: 'keycode', keyCode: 'NUM1', defaultShortcut: '1' },
	{ id: 'NUM2', label: '2', category: 'syntax', kind: 'keycode', keyCode: 'NUM2', defaultShortcut: '2' },
	{ id: 'NUM3', label: '3', category: 'syntax', kind: 'keycode', keyCode: 'NUM3', defaultShortcut: '3' },
	{ id: 'NUM4', label: '4', category: 'syntax', kind: 'keycode', keyCode: 'NUM4', defaultShortcut: '4' },
	{ id: 'NUM5', label: '5', category: 'syntax', kind: 'keycode', keyCode: 'NUM5', defaultShortcut: '5' },
	{ id: 'NUM6', label: '6', category: 'syntax', kind: 'keycode', keyCode: 'NUM6', defaultShortcut: '6' },
	{ id: 'NUM7', label: '7', category: 'syntax', kind: 'keycode', keyCode: 'NUM7', defaultShortcut: '7' },
	{ id: 'NUM8', label: '8', category: 'syntax', kind: 'keycode', keyCode: 'NUM8', defaultShortcut: '8' },
	{ id: 'NUM9', label: '9', category: 'syntax', kind: 'keycode', keyCode: 'NUM9', defaultShortcut: '9' },

	// Objects
	{ id: 'FIXTURE', label: 'Fixture', category: 'objects', kind: 'keycode', keyCode: 'FIXTURE', defaultShortcut: 'F' },
	{ id: 'CHANNEL', label: 'Channel', category: 'objects', kind: 'keycode', keyCode: 'CHANNEL', defaultShortcut: 'C' },
	{ id: 'GROUP', label: 'Group', category: 'objects', kind: 'keycode', keyCode: 'GROUP', defaultShortcut: 'G' },
	{ id: 'PRESET', label: 'Preset', category: 'objects', kind: 'keycode', keyCode: 'PRESET', defaultShortcut: 'P' },
	{
		id: 'SEQUENCE',
		label: 'Sequence',
		category: 'objects',
		kind: 'keycode',
		keyCode: 'SEQUENCE',
		defaultShortcut: 'Alt+S',
	},
	{ id: 'CUE', label: 'Cue', category: 'objects', kind: 'keycode', keyCode: 'CUE', defaultShortcut: 'Alt+C' },
	{ id: 'TIME', label: 'Time', category: 'objects', kind: 'keycode', keyCode: 'TIME', defaultShortcut: 'Ctrl+T' },
	{ id: 'SELECT', label: 'Select', category: 'objects', kind: 'keycode', keyCode: 'SELECT', defaultShortcut: 'Ctrl+S' },
	{ id: 'ON', label: 'On', category: 'objects', kind: 'keycode', keyCode: 'ON', defaultShortcut: 'Ctrl+O' },
	{ id: 'OFF', label: 'Off', category: 'objects', kind: 'keycode', keyCode: 'OFF', defaultShortcut: 'O' },
	{ id: 'GOTO', label: 'Goto', category: 'objects', kind: 'keycode', keyCode: 'GOTO', defaultShortcut: 'Alt+G' },
	{ id: 'LIST', label: 'List', category: 'objects', kind: 'keycode', keyCode: 'LIST', defaultShortcut: 'L' },
	{ id: 'MACRO', label: 'Macro', category: 'objects', kind: 'keycode', keyCode: 'MACRO' },
	{ id: 'VIEW', label: 'View', category: 'objects', kind: 'keycode', keyCode: 'VIEW' },
	{ id: 'PAGE', label: 'Page', category: 'objects', kind: 'keycode', keyCode: 'PAGE' },
	{ id: 'EXECUTOR', label: 'Executor', category: 'objects', kind: 'keycode', keyCode: 'EXECUTOR' },
	{ id: 'LAYOUT', label: 'Layout', category: 'objects', kind: 'keycode', keyCode: 'LAYOUT' },
	{ id: 'GRID', label: 'Grid', category: 'objects', kind: 'keycode', keyCode: 'GRID' },
	{ id: 'TIMECODE', label: 'Timecode', category: 'objects', kind: 'keycode', keyCode: 'TIMECODE' },
	{ id: 'DMX', label: 'DMX', category: 'objects', kind: 'keycode', keyCode: 'DMX' },
	{ id: 'PHASER', label: 'Phaser', category: 'objects', kind: 'keycode', keyCode: 'PHASER' },

	// Playback
	{
		id: 'DEF_GO',
		label: 'Master Go',
		category: 'playback',
		kind: 'keycode',
		keyCode: 'DEF_GO',
		defaultShortcut: 'Space',
	},
	{
		id: 'DEF_GOBACK',
		label: 'Master Go-',
		category: 'playback',
		kind: 'keycode',
		keyCode: 'DEF_GOBACK',
		defaultShortcut: 'Ctrl+Space',
	},
	{
		id: 'DEF_PAUSE',
		label: 'Master Pause',
		category: 'playback',
		kind: 'keycode',
		keyCode: 'DEF_PAUSE',
		defaultShortcut: 'Alt+Space',
	},
	{ id: 'GO', label: 'Go+', category: 'playback', kind: 'keycode', keyCode: 'GO', defaultShortcut: 'Ctrl+G' },
	{
		id: 'GOBACK',
		label: 'Go-',
		category: 'playback',
		kind: 'keycode',
		keyCode: 'GOBACK',
		defaultShortcut: 'Ctrl+Alt+G',
	},
	{ id: 'PAUSE', label: 'Pause', category: 'playback', kind: 'keycode', keyCode: 'PAUSE', defaultShortcut: 'Ctrl+P' },
	{
		id: 'GOFAST',
		label: '>>>',
		category: 'playback',
		kind: 'keycode',
		keyCode: 'GOFAST',
		defaultShortcut: 'RightBracket',
	},
	{
		id: 'GOBACKFAST',
		label: '<<<',
		category: 'playback',
		kind: 'keycode',
		keyCode: 'GOBACKFAST',
		defaultShortcut: 'LeftBracket',
	},
	{ id: 'LEARN', label: 'Learn', category: 'playback', kind: 'keycode', keyCode: 'LEARN', defaultShortcut: 'Ctrl+L' },
	{ id: 'FLASH', label: 'Flash', category: 'playback', kind: 'keycode', keyCode: 'FLASH' },
	{ id: 'BLACK', label: 'Black', category: 'playback', kind: 'keycode', keyCode: 'BLACK' },
	{ id: 'KILL', label: 'Kill', category: 'playback', kind: 'keycode', keyCode: 'KILL' },
	{ id: 'TEMP', label: 'Temp', category: 'playback', kind: 'keycode', keyCode: 'TEMP' },
	{ id: 'TOGGLE', label: 'Toggle', category: 'playback', kind: 'keycode', keyCode: 'TOGGLE' },
	{ id: 'TOP', label: 'Top', category: 'playback', kind: 'keycode', keyCode: 'TOP' },
	{ id: 'LOAD', label: 'Load', category: 'playback', kind: 'keycode', keyCode: 'LOAD' },
	{ id: 'SWAP', label: 'Swap', category: 'playback', kind: 'keycode', keyCode: 'SWAP' },
	{ id: 'GOSTEP', label: 'GoStep', category: 'playback', kind: 'keycode', keyCode: 'GOSTEP' },
	{ id: 'RATE1', label: 'Rate 1', category: 'playback', kind: 'keycode', keyCode: 'RATE1' },
	{ id: 'HALF_SPEED', label: 'Half Speed', category: 'playback', kind: 'keycode', keyCode: 'HALF_SPEED' },
	{ id: 'DOUBLE_SPEED', label: 'Double Speed', category: 'playback', kind: 'keycode', keyCode: 'DOUBLE_SPEED' },
	{ id: 'RECORD', label: 'Record', category: 'playback', kind: 'keycode', keyCode: 'RECORD' },

	// Modes & system
	{ id: 'BLIND', label: 'Blind', category: 'modes', kind: 'keycode', keyCode: 'BLIND', defaultShortcut: 'B' },
	{
		id: 'HIGHLIGHT',
		label: 'Highlight',
		category: 'modes',
		kind: 'keycode',
		keyCode: 'HIGHLIGHT',
		defaultShortcut: 'H',
	},
	{ id: 'LOWLIGHT', label: 'Lowlight', category: 'modes', kind: 'keycode', keyCode: 'LOWLIGHT' },
	{ id: 'SOLO', label: 'Solo', category: 'modes', kind: 'keycode', keyCode: 'SOLO', defaultShortcut: 'Ctrl+Alt+S' },
	{ id: 'FREEZE', label: 'Freeze', category: 'modes', kind: 'keycode', keyCode: 'FREEZE', defaultShortcut: 'Alt+F' },
	{
		id: 'PREVIEW',
		label: 'Preview',
		category: 'modes',
		kind: 'keycode',
		keyCode: 'PREVIEW',
		defaultShortcut: 'Ctrl+Alt+P',
	},
	{
		id: 'SELFIX',
		label: 'SelFix',
		category: 'modes',
		kind: 'keycode',
		keyCode: 'SELFIX',
		defaultShortcut: 'Ctrl+Alt+F',
	},
	{ id: 'ALIGN', label: 'Align', category: 'modes', kind: 'keycode', keyCode: 'ALIGN', defaultShortcut: 'Ctrl+A' },
	{ id: 'STOMP', label: 'Stomp', category: 'modes', kind: 'keycode', keyCode: 'STOMP', defaultShortcut: 'Alt+T' },
	{ id: 'HELP', label: 'Help', category: 'modes', kind: 'keycode', keyCode: 'HELP', defaultShortcut: 'Ctrl+Alt+H' },
	{ id: 'MENU', label: 'Menu', category: 'modes', kind: 'keycode', keyCode: 'MENU', defaultShortcut: 'F12' },
	{ id: 'USER1', label: 'User 1', category: 'modes', kind: 'keycode', keyCode: 'USER1' },
	{ id: 'USER2', label: 'User 2', category: 'modes', kind: 'keycode', keyCode: 'USER2' },
	{ id: 'SHORTCUTS', label: 'ShCuts on/off', category: 'modes', kind: 'shortcuts_toggle', defaultShortcut: 'F10' },
	{ id: 'DESK_LOCK', label: 'Desk Lock', category: 'modes', kind: 'desk_lock', defaultShortcut: 'F9' },

	// Navigation, grid & MAtricks
	{ id: 'PREV', label: 'Prev', category: 'navigation', kind: 'keycode', keyCode: 'PREV', defaultShortcut: 'Left' },
	{ id: 'NEXT', label: 'Next', category: 'navigation', kind: 'keycode', keyCode: 'NEXT', defaultShortcut: 'Right' },
	{ id: 'UP', label: 'Up', category: 'navigation', kind: 'keycode', keyCode: 'UP', defaultShortcut: 'Up' },
	{ id: 'DOWN', label: 'Down', category: 'navigation', kind: 'keycode', keyCode: 'DOWN', defaultShortcut: 'Down' },
	{
		id: 'PAGE_UP',
		label: 'Page +',
		category: 'navigation',
		kind: 'keycode',
		keyCode: 'PAGE_UP',
		defaultShortcut: 'PageUp',
	},
	{
		id: 'PAGE_DOWN',
		label: 'Page -',
		category: 'navigation',
		kind: 'keycode',
		keyCode: 'PAGE_DOWN',
		defaultShortcut: 'PageDown',
	},
	{ id: 'PREV_X', label: 'Prev X', category: 'navigation', kind: 'keycode', keyCode: 'PREV_X' },
	{ id: 'NEXT_X', label: 'Next X', category: 'navigation', kind: 'keycode', keyCode: 'NEXT_X' },
	{ id: 'PREV_Y', label: 'Prev Y', category: 'navigation', kind: 'keycode', keyCode: 'PREV_Y' },
	{ id: 'NEXT_Y', label: 'Next Y', category: 'navigation', kind: 'keycode', keyCode: 'NEXT_Y' },
	{ id: 'PREV_Z', label: 'Prev Z', category: 'navigation', kind: 'keycode', keyCode: 'PREV_Z' },
	{ id: 'NEXT_Z', label: 'Next Z', category: 'navigation', kind: 'keycode', keyCode: 'NEXT_Z' },
	{ id: 'PREV_STEP', label: 'Prev Step', category: 'navigation', kind: 'keycode', keyCode: 'PREV_STEP' },
	{ id: 'NEXT_STEP', label: 'Next Step', category: 'navigation', kind: 'keycode', keyCode: 'NEXT_STEP' },
	{ id: 'STEP', label: 'Step', category: 'navigation', kind: 'keycode', keyCode: 'STEP' },
	{ id: 'TOGGLE_STEP', label: 'Toggle Step', category: 'navigation', kind: 'keycode', keyCode: 'TOGGLE_STEP' },
	{
		id: 'TOGGLE_MATRICKS',
		label: 'Toggle MAtricks',
		category: 'navigation',
		kind: 'keycode',
		keyCode: 'TOGGLE_MATRICKS',
	},
	{
		id: 'RESET_MATRICKS',
		label: 'Reset MAtricks',
		category: 'navigation',
		kind: 'keycode',
		keyCode: 'RESET_MATRICKS',
	},

	// X-Keys
	{ id: 'XKEYS', label: 'X-Keys', category: 'xkeys', kind: 'keycode', keyCode: 'XKEYS', defaultShortcut: 'Comma' },
	{ id: 'X1', label: 'X1', category: 'xkeys', kind: 'keycode', keyCode: 'X1', defaultShortcut: 'F1' },
	{ id: 'X2', label: 'X2', category: 'xkeys', kind: 'keycode', keyCode: 'X2', defaultShortcut: 'F2' },
	{ id: 'X3', label: 'X3', category: 'xkeys', kind: 'keycode', keyCode: 'X3', defaultShortcut: 'F3' },
	{ id: 'X4', label: 'X4', category: 'xkeys', kind: 'keycode', keyCode: 'X4', defaultShortcut: 'F4' },
	{ id: 'X5', label: 'X5', category: 'xkeys', kind: 'keycode', keyCode: 'X5', defaultShortcut: 'F5' },
	{ id: 'X6', label: 'X6', category: 'xkeys', kind: 'keycode', keyCode: 'X6', defaultShortcut: 'F6' },
	{ id: 'X7', label: 'X7', category: 'xkeys', kind: 'keycode', keyCode: 'X7', defaultShortcut: 'F7' },
	{ id: 'X8', label: 'X8', category: 'xkeys', kind: 'keycode', keyCode: 'X8', defaultShortcut: 'F8' },
	{ id: 'X9', label: 'X9', category: 'xkeys', kind: 'keycode', keyCode: 'X9' },
	{ id: 'X10', label: 'X10', category: 'xkeys', kind: 'keycode', keyCode: 'X10' },
	{ id: 'X11', label: 'X11', category: 'xkeys', kind: 'keycode', keyCode: 'X11' },
	{ id: 'X12', label: 'X12', category: 'xkeys', kind: 'keycode', keyCode: 'X12' },
	{ id: 'X13', label: 'X13', category: 'xkeys', kind: 'keycode', keyCode: 'X13' },
	{ id: 'X14', label: 'X14', category: 'xkeys', kind: 'keycode', keyCode: 'X14' },
	{ id: 'X15', label: 'X15', category: 'xkeys', kind: 'keycode', keyCode: 'X15' },
	{ id: 'X16', label: 'X16', category: 'xkeys', kind: 'keycode', keyCode: 'X16' },

	// Dual encoders (press)
	{ id: 'ENCODER_INSIDE1', label: 'Enc 1 In', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_INSIDE1' },
	{ id: 'ENCODER_OUTSIDE1', label: 'Enc 1 Out', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_OUTSIDE1' },
	{ id: 'ENCODER_INSIDE2', label: 'Enc 2 In', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_INSIDE2' },
	{ id: 'ENCODER_OUTSIDE2', label: 'Enc 2 Out', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_OUTSIDE2' },
	{ id: 'ENCODER_INSIDE3', label: 'Enc 3 In', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_INSIDE3' },
	{ id: 'ENCODER_OUTSIDE3', label: 'Enc 3 Out', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_OUTSIDE3' },
	{ id: 'ENCODER_INSIDE4', label: 'Enc 4 In', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_INSIDE4' },
	{ id: 'ENCODER_OUTSIDE4', label: 'Enc 4 Out', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_OUTSIDE4' },
	{ id: 'ENCODER_INSIDE5', label: 'Enc 5 In', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_INSIDE5' },
	{ id: 'ENCODER_OUTSIDE5', label: 'Enc 5 Out', category: 'encoders', kind: 'keycode', keyCode: 'ENCODER_OUTSIDE5' },

	// onPC display toggles
	{
		id: 'ONPC_SCREEN2',
		label: 'Display 2',
		category: 'displays',
		kind: 'keycode',
		keyCode: 'ONPC_SCREEN2',
		defaultShortcut: 'Ctrl+Alt+2',
	},
	{
		id: 'ONPC_SCREEN3',
		label: 'Display 3',
		category: 'displays',
		kind: 'keycode',
		keyCode: 'ONPC_SCREEN3',
		defaultShortcut: 'Ctrl+Alt+3',
	},
	{
		id: 'ONPC_SCREEN4',
		label: 'Display 4',
		category: 'displays',
		kind: 'keycode',
		keyCode: 'ONPC_SCREEN4',
		defaultShortcut: 'Ctrl+Alt+4',
	},
	{
		id: 'ONPC_SCREEN5',
		label: 'Display 5',
		category: 'displays',
		kind: 'keycode',
		keyCode: 'ONPC_SCREEN5',
		defaultShortcut: 'Ctrl+Alt+5',
	},
	{
		id: 'ONPC_SCREEN6',
		label: 'Display 6',
		category: 'displays',
		kind: 'keycode',
		keyCode: 'ONPC_SCREEN6',
		defaultShortcut: 'Ctrl+Alt+6',
	},
	{
		id: 'ONPC_SCREEN7',
		label: 'Display 7',
		category: 'displays',
		kind: 'keycode',
		keyCode: 'ONPC_SCREEN7',
		defaultShortcut: 'Ctrl+Alt+7',
	},

	// Special executors (master section buttons & clickable encoders)
	{
		id: 'SPECIAL_GRAND_KNOB',
		label: 'Blackout',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'GrandKnob',
		defaultShortcut: 'Ctrl+B',
	},
	{
		id: 'SPECIAL_XFADE1_BTN',
		label: 'XFade A Btn',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'XFade1Btn',
	},
	{
		id: 'SPECIAL_XFADE2_BTN',
		label: 'XFade B Btn',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'XFade2Btn',
	},
	{
		id: 'SPECIAL_RATE_BTN1',
		label: 'Rate Btn 1',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'RateBtn1',
	},
	{
		id: 'SPECIAL_RATE_BTN2',
		label: 'Rate Btn 2',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'RateBtn2',
	},
	{
		id: 'SPECIAL_SPEED_BTN1',
		label: 'Speed Btn 1',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'SpeedBtn1',
	},
	{
		id: 'SPECIAL_SPEED_BTN2',
		label: 'Speed Btn 2',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'SpeedBtn2',
	},
	{
		id: 'SPECIAL_EXEC_BTN1',
		label: 'Exec Time 1',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'ExecBtn1',
	},
	{
		id: 'SPECIAL_EXEC_BTN2',
		label: 'Exec Time 2',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'ExecBtn2',
	},
	{
		id: 'SPECIAL_EXEC_BTN3',
		label: 'Exec Time 3',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'ExecBtn3',
	},
	{
		id: 'SPECIAL_EXEC_ENCODER',
		label: 'Exec Time Enc',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'ExecEncoder',
	},
	{
		id: 'SPECIAL_PROG_BTN1',
		label: 'Prog Time 1',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'ProgBtn1',
	},
	{
		id: 'SPECIAL_PROG_BTN2',
		label: 'Prog Time 2',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'ProgBtn2',
	},
	{
		id: 'SPECIAL_PROG_BTN3',
		label: 'Prog Time 3',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'ProgBtn3',
	},
	{
		id: 'SPECIAL_PROG_ENCODER',
		label: 'Prog Time Enc',
		category: 'special_exec',
		kind: 'special_exec',
		specialExec: 'ProgEncoder',
	},
]

export const MA_KEY_MAP: ReadonlyMap<string, MaKey> = new Map(MA_KEYS.map((k) => [k.id, k]))

export const EXECUTOR_MIN = 101
export const EXECUTOR_MAX = 490

export function parseExecutorIndex(value: unknown): number {
	const n = Number(value)
	if (!Number.isInteger(n) || n < EXECUTOR_MIN || n > EXECUTOR_MAX) {
		throw new Error(
			`executor index must be an integer between ${EXECUTOR_MIN} and ${EXECUTOR_MAX}, got "${String(value)}"`,
		)
	}
	return n
}

export type KeyStroke = { key: string; shift: boolean; ctrl: boolean; alt: boolean }

/**
 * Parse an MA shortcut such as "Ctrl+Alt+S" into the key name and modifiers that onPC's
 * Lua Keyboard() function takes. Key names are the ones MA uses in its shortcut files
 * (S, Delete, Enter, Period, Equal, F10, PageUp, ...).
 */
export function parseShortcut(shortcut: string): KeyStroke {
	if (shortcut.trim() === '') throw new Error('empty shortcut')
	const parts = shortcut.split('+').map((p) => p.trim())
	if (parts.some((p) => p === '')) throw new Error(`malformed shortcut "${shortcut}"`)
	const key = parts.pop()!
	if (!/^[A-Za-z0-9]+$/.test(key)) throw new Error(`invalid key name "${key}"`)
	const stroke: KeyStroke = { key, shift: false, ctrl: false, alt: false }
	for (const mod of parts) {
		switch (mod.toLowerCase()) {
			case 'ctrl':
			case 'control':
				stroke.ctrl = true
				break
			case 'alt':
			case 'option':
				stroke.alt = true
				break
			case 'shift':
				stroke.shift = true
				break
			default:
				throw new Error(`unknown modifier "${mod}"`)
		}
	}
	return stroke
}
