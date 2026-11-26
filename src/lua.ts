import { parseExecutorIndex, type KeyStroke } from './keys.js'

export type KeyTarget =
	| { kind: 'keycode'; keyCode: string }
	| { kind: 'exec'; executorIndex: number }
	| { kind: 'special_exec'; specialExec: string }
	| { kind: 'desk_lock' }
	| { kind: 'raw_shortcut'; stroke: KeyStroke }

/**
 * Safe single-char suffixes for Ctrl+Alt+<k> scratch shortcuts (all A-Z except D, plus 0-9).
 * Default-unused characters come first so the scan succeeds on the first iteration in the
 * common case, while still falling back to any other unbound chord if a user customized them.
 * D is excluded because Ctrl+Alt+D is MA3's framework shortcut to reset the color theme.
 */
const SCRATCH_KEYS = 'ZQXWJKYUIOVNM0189ABCEFGHLPRST234567'

const USER_RE = /^[A-Za-z0-9 _.-]+$/
const KEYCODE_RE = /^[A-Z0-9_]+$/
const SPECIAL_EXEC_RE = /^[A-Za-z0-9]+$/

export function validateUser(user: string): string {
	if (!USER_RE.test(user)) throw new Error(`invalid user name "${user}"`)
	return user
}

export function normalizeDisplay(display: number): number {
	return Math.max(1, Math.trunc(Number(display) || 1))
}

/** Stable identifier for tracking held keys across down/up events. */
export function targetId(target: KeyTarget): string {
	switch (target.kind) {
		case 'keycode':
			return `kc:${target.keyCode}`
		case 'exec':
			return `exec:${target.executorIndex}`
		case 'special_exec':
			return `sp:${target.specialExec}`
		case 'desk_lock':
			return 'desk_lock'
		case 'raw_shortcut': {
			const { key, shift, ctrl, alt } = target.stroke
			return `raw:${key}:${shift}:${ctrl}:${alt}`
		}
	}
}

/** Lua command that toggles ShCuts on/off for the configured user. */
export function buildShortcutsToggleLua(user: string): string {
	const u = validateUser(user)
	return (
		`Lua "local u=ShowData().Users['${u}'] ` +
		`local p=u and u.profile and u.profile.KeyboardShortCuts ` +
		`if p then p.KeyboardShortcutsActive=not p.KeyboardShortcutsActive end"`
	)
}

/**
 * Build the single-line Lua command that presses or releases any hardware key, executor,
 * special executor, Desk Lock, or raw keyboard shortcut on the configured display.
 */
export function buildKeyLua(target: KeyTarget, down: boolean, user: string, display: number): string {
	const u = validateUser(user)
	const d = normalizeDisplay(display)
	const action = down ? 'press' : 'release'

	if (target.kind === 'desk_lock') {
		// F9 is an onPC framework shortcut and works regardless of ShCuts state.
		return `Lua "Keyboard(${d},'${action}','F9',false,false,false)"`
	}

	if (target.kind === 'raw_shortcut') {
		const { key, shift, ctrl, alt } = target.stroke
		if (!/^[A-Za-z0-9]+$/.test(key)) throw new Error(`invalid key name "${key}"`)
		// F10 toggles ShCuts; saving and restoring KeyboardShortcutsActive would undo it.
		if (key === 'F10' && !shift && !ctrl && !alt) {
			return `Lua "Keyboard(${d},'${action}','F10',false,false,false)"`
		}
		return (
			`Lua "local u=ShowData().Users['${u}'] ` +
			`local p=u and u.profile and u.profile.KeyboardShortCuts ` +
			`local w=p and p.KeyboardShortcutsActive if p then p.KeyboardShortcutsActive=true end ` +
			`pcall(Keyboard,${d},'${action}','${key}',${shift},${ctrl},${alt}) ` +
			`if p then p.KeyboardShortcutsActive=w end"`
		)
	}

	let matchExpr: string
	let setupExpr: string
	if (target.kind === 'keycode') {
		if (!KEYCODE_RE.test(target.keyCode)) throw new Error(`invalid key code "${target.keyCode}"`)
		matchExpr = `g(c,K)=='${target.keyCode}'`
		setupExpr = `e:Set(K,'${target.keyCode}')`
	} else if (target.kind === 'exec') {
		const ex = parseExecutorIndex(target.executorIndex)
		// In MA3, ExecutorIndex returns the SpecialExec name (never a number) when SpecialExec ~= None.
		matchExpr = `g(c,K)=='EXEC' and g(c,'ExecutorIndex')=='${ex}'`
		setupExpr = `e:Set(K,'EXEC') e:Set('ExecutorIndex',${ex})`
	} else {
		if (!SPECIAL_EXEC_RE.test(target.specialExec)) throw new Error(`invalid special executor "${target.specialExec}"`)
		matchExpr = `g(c,K)=='EXEC' and g(c,'SpecialExec')=='${target.specialExec}'`
		setupExpr = `e:Set(K,'EXEC') e:Set('SpecialExec','${target.specialExec}')`
	}

	// Scan the user's KeyboardShortCuts once:
	// - Reuse an existing unshadowed non-keypad, non-framework shortcut if one is bound.
	// - Otherwise bind a temporary unused Ctrl+Alt+<char> entry, send Keyboard(), restore
	//   ShCuts, and delete the temporary entry even if Set() or Keyboard() errors.
	return (
		`Lua "local p=ShowData().Users['${u}'] ` +
		`p=p and p.profile and p.profile.KeyboardShortCuts ` +
		`if not p then return end ` +
		`local D,K,S,s,U,e=Enums.Roles.Display,'KeyCode','Shortcut','',{['']=1,None=1,F9=1,F10=1,['Ctrl+Alt+D']=1} ` +
		`local function g(c,n) return c:Get(n,D) or '' end ` +
		`for i=1,p:Count() do local c=p[i] local q=g(c,S) ` +
		`if not U[q] then if s=='' and not q:find'kp' and ${matchExpr} then s=q end U[q]=1 end end ` +
		`if s=='' then ` +
		`for k in ('${SCRATCH_KEYS}'):gmatch'.' do local q='Ctrl+Alt+'..k if not U[q] then s=q break end end ` +
		`e=s~='' and p:Append() if not e then return end ` +
		`if not pcall(function() ${setupExpr} e:Set(S,s) end) then p:Delete(e.index) return end end ` +
		`local k=s:match'[^+]+$' ` +
		`if k then local a='KeyboardShortcutsActive' local w=p[a] p[a]=true ` +
		`pcall(Keyboard,${d},'${action}',k,s:find'Shift%+'~=nil,s:find'Ctrl%+'~=nil,s:find'Alt%+'~=nil) ` +
		`p[a]=w end ` +
		`if e then p:Delete(e.index) end"`
	)
}
