import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { InstanceStatus } from '@companion-module/base'
import { EXECUTOR_MAX, EXECUTOR_MIN, MA_KEY_MAP, MA_KEYS, parseExecutorIndex, parseShortcut } from '../keys.js'
import { buildKeyLua, buildShortcutsToggleLua, targetId } from '../lua.js'
import ModuleInstance from '../main.js'
import { DEFAULT_CONFIG, type ModuleConfig } from '../config.js'
import { TerminalSession } from '../terminal.js'

const LONG_USER = 'Lighting Designer Workstation 01' // 32 chars

function createTestInstance(): {
	instance: ModuleInstance
	statuses: Array<{ status: InstanceStatus; message: string | null }>
} {
	const statuses: Array<{ status: InstanceStatus; message: string | null }> = []
	const context = {
		_isInstanceContext: true,
		id: 'test-id',
		label: 'test-label',
		updateStatus: (status: InstanceStatus, message: string | null) => {
			statuses.push({ status, message })
		},
		setActionDefinitions: () => {},
		setPresetDefinitions: () => {},
		setFeedbackDefinitions: () => {},
		setVariableDefinitions: () => {},
		setVariableValues: () => {},
		checkFeedbacks: () => {},
		checkFeedbacksById: () => {},
		saveConfig: () => {},
		log: () => {},
	}
	return { instance: new ModuleInstance(context), statuses }
}

type FakeOsc = {
	send: (cmd: string) => Promise<void>
	close: () => void
}

type FakeTerminal = {
	ready: boolean
	send: (cmd: string) => void
	query: (cmd: string, match: RegExp) => Promise<RegExpMatchArray>
	start: () => void
	stop: () => void
}

type InternalInstance = {
	osc?: FakeOsc
	terminal?: FakeTerminal
	oscWorks: boolean
	pendingReleases: Map<string, unknown>
	sendQueue: Promise<void>
	probe: () => Promise<void>
	flushPendingReleases: (preferTerminal?: boolean) => Promise<void>
}

void describe('manifest', () => {
	void it('declares runtime.permissions["child-process"] for TerminalSession', () => {
		const raw = readFileSync(resolve(process.cwd(), 'companion/manifest.json'), 'utf8')
		const manifest = JSON.parse(raw) as { runtime?: { permissions?: Record<string, unknown> } }
		assert.equal(manifest.runtime?.permissions?.['child-process'], true)
	})
})

void describe('MA_KEYS catalog', () => {
	void it('has unique IDs and includes all 144 SCVirtualKeyCode keys plus 15 special executors and 2 toggles', () => {
		assert.equal(MA_KEYS.length, MA_KEY_MAP.size)
		const keycodes = MA_KEYS.filter((k) => k.kind === 'keycode')
		const specials = MA_KEYS.filter((k) => k.kind === 'special_exec')
		assert.equal(keycodes.length, 144)
		assert.equal(specials.length, 15)
		assert.equal(MA_KEYS.length, 161)

		// No duplicate keyCodes or specialExecs.
		assert.equal(new Set(keycodes.map((k) => k.keyCode)).size, 144)
		assert.equal(new Set(specials.map((k) => k.specialExec)).size, 15)
	})

	void it('preserves existing key IDs for backwards compatibility', () => {
		for (const id of ['STORE', 'CLEAR', 'PLEASE', 'MA', 'ESC', 'UNDO', 'SHORTCUTS', 'X1', 'X8']) {
			assert.ok(MA_KEY_MAP.has(id), `missing expected id ${id}`)
		}
		const ma = MA_KEY_MAP.get('MA')
		assert.equal(ma?.kind, 'keycode')
		if (ma?.kind === 'keycode') assert.equal(ma.keyCode, 'MA1')
		const undo = MA_KEY_MAP.get('UNDO')
		assert.equal(undo?.kind, 'keycode')
		if (undo?.kind === 'keycode') assert.equal(undo.keyCode, 'OOPS')
	})
})

void describe('parseShortcut', () => {
	void it('parses single keys and modifiers', () => {
		assert.deepEqual(parseShortcut('S'), { key: 'S', shift: false, ctrl: false, alt: false })
		assert.deepEqual(parseShortcut('Ctrl+Alt+S'), { key: 'S', shift: false, ctrl: true, alt: true })
		assert.deepEqual(parseShortcut('Option + Control + F12'), { key: 'F12', shift: false, ctrl: true, alt: true })
	})

	void it('rejects empty, malformed, or unsafe shortcuts', () => {
		assert.throws(() => parseShortcut(''))
		assert.throws(() => parseShortcut('   '))
		assert.throws(() => parseShortcut('Ctrl++'))
		assert.throws(() => parseShortcut('+S'))
		assert.throws(() => parseShortcut('Meta+S'))
		assert.throws(() => parseShortcut('S"'))
	})
})

void describe('parseExecutorIndex', () => {
	void it('accepts integers in 101..490 and rejects out-of-range or non-integer values', () => {
		assert.equal(parseExecutorIndex(EXECUTOR_MIN), 101)
		assert.equal(parseExecutorIndex(401), 401)
		assert.equal(parseExecutorIndex(EXECUTOR_MAX), 490)
		assert.throws(() => parseExecutorIndex(100))
		assert.throws(() => parseExecutorIndex(491))
		assert.throws(() => parseExecutorIndex(101.5))
		assert.throws(() => parseExecutorIndex('abc'))
	})
})

void describe('buildKeyLua', () => {
	void it('generates valid single-line Lua under 1024 bytes for every key in MA_KEYS even with long user and display', () => {
		for (const key of MA_KEYS) {
			if (key.kind === 'shortcuts_toggle') {
				const cmd = buildShortcutsToggleLua(LONG_USER)
				assert.ok(!/[\r\n]/.test(cmd))
				assert.ok(cmd.includes('KeyboardShortcutsActive=not p.KeyboardShortcutsActive'))
				continue
			}
			for (const down of [true, false]) {
				const cmd = buildKeyLua(key, down, LONG_USER, 99)
				assert.ok(!/[\r\n]/.test(cmd), `multiline Lua for ${key.id}`)
				assert.ok(cmd.length < 1024, `Lua too long (${cmd.length} bytes) for ${key.id}`)
				assert.ok(cmd.startsWith('Lua "') && cmd.endsWith('"'))
				assert.ok(cmd.includes(down ? "'press'" : "'release'"))
			}
		}
	})

	void it('passes Shift+, Ctrl+, and Alt+ modifier checks to Keyboard() and covers all 35 safe scratch chords', () => {
		const cmd = buildKeyLua({ kind: 'keycode', keyCode: 'STORE' }, true, 'steve', 1)
		assert.ok(
			cmd.includes("pcall(Keyboard,1,'press',k,s:find'Shift%+'~=nil,s:find'Ctrl%+'~=nil,s:find'Alt%+'~=nil)"),
			'Keyboard() must forward Shift+, Ctrl+, and Alt+ modifiers',
		)
		const match = cmd.match(/\('([A-Z0-9]+)'\):gmatch/)
		assert.ok(match, 'scratch pool missing')
		const pool = match[1]
		assert.equal(pool.length, 35)
		assert.equal(new Set(pool.split('')).size, 35)
		assert.ok(!pool.includes('D'), 'Ctrl+Alt+D must remain excluded')
	})

	void it('builds executor and special executor matching/setup clauses under 1024 bytes on release with long user', () => {
		const execCmd = buildKeyLua({ kind: 'exec', executorIndex: 490 }, false, LONG_USER, 99)
		assert.ok(execCmd.length < 1024, `exec Lua too long (${execCmd.length} bytes)`)
		assert.ok(execCmd.includes("g(c,K)=='EXEC' and g(c,'ExecutorIndex')=='490'"))
		assert.ok(execCmd.includes("e:Set('ExecutorIndex',490)"))
		assert.ok(execCmd.includes("pcall(Keyboard,99,'release'"))

		const spCmd = buildKeyLua({ kind: 'special_exec', specialExec: 'GrandKnob' }, false, LONG_USER, 99)
		assert.ok(spCmd.length < 1024, `special_exec Lua too long (${spCmd.length} bytes)`)
		assert.ok(spCmd.includes("g(c,K)=='EXEC' and g(c,'SpecialExec')=='GrandKnob'"))
		assert.ok(spCmd.includes("e:Set('SpecialExec','GrandKnob')"))
	})

	void it('does not save/restore ShCuts for raw F10 or Desk Lock F9', () => {
		const f10 = buildKeyLua(
			{ kind: 'raw_shortcut', stroke: { key: 'F10', shift: false, ctrl: false, alt: false } },
			true,
			'steve',
			1,
		)
		assert.equal(f10, `Lua "Keyboard(1,'press','F10',false,false,false)"`)

		const lock = buildKeyLua({ kind: 'desk_lock' }, true, 'steve', 1)
		assert.equal(lock, `Lua "Keyboard(1,'press','F9',false,false,false)"`)
	})

	void it('rejects unsafe user names and invalid keycodes', () => {
		assert.throws(() => buildKeyLua({ kind: 'keycode', keyCode: 'STORE' }, true, "steve']", 1))
		assert.throws(() => buildKeyLua({ kind: 'keycode', keyCode: "STORE'" }, true, 'steve', 1))
		assert.throws(() => buildKeyLua({ kind: 'special_exec', specialExec: 'Bad Name' }, true, 'steve', 1))
	})

	void it('produces distinct targetId values across target kinds', () => {
		const ids = [
			targetId({ kind: 'keycode', keyCode: 'STORE' }),
			targetId({ kind: 'exec', executorIndex: 101 }),
			targetId({ kind: 'special_exec', specialExec: 'GrandKnob' }),
			targetId({ kind: 'desk_lock' }),
			targetId({ kind: 'raw_shortcut', stroke: { key: 'S', shift: false, ctrl: false, alt: false } }),
		]
		assert.equal(new Set(ids).size, ids.length)
	})
})

void describe('TerminalSession', () => {
	void it('retries after an asynchronous spawn failure (ENOENT)', async () => {
		let failures = 0
		let resolveSecond: () => void = () => {}
		let rejectSecond: (err: Error) => void = () => {}
		const secondFailure = new Promise<void>((resolve, reject) => {
			resolveSecond = resolve
			rejectSecond = reject
		})
		const deadline = setTimeout(() => rejectSecond(new Error('timed out waiting for ENOENT retry')), 5000)
		deadline.unref()
		const session = new TerminalSession(
			'/nonexistent/path/to/app_terminal',
			'127.0.0.1',
			() => {},
			(ready) => {
				if (!ready) {
					failures++
					if (failures >= 2) resolveSecond()
				}
			},
			20,
		)
		session.start()
		try {
			await secondFailure
			assert.ok(failures >= 2)
		} finally {
			clearTimeout(deadline)
			session.stop()
		}
	})
})

void describe('ModuleInstance lifecycle & release recovery', () => {
	void it('does not send a stale button-up to a new host after configUpdated() released it on the old host', async () => {
		const { instance } = createTestInstance()
		const priv = instance as unknown as InternalInstance
		const hostA: string[] = []
		const hostB: string[] = []

		const cfgA: ModuleConfig = { ...DEFAULT_CONFIG, transport: 'osc', host: '127.0.0.1' }
		await instance.configUpdated(cfgA)
		priv.osc?.close()
		priv.osc = {
			send: async (cmd) => {
				hostA.push(cmd)
			},
			close: () => {},
		}

		await instance.sendExecutor(101, 'down')
		assert.equal(hostA.length, 1)

		const cfgB: ModuleConfig = { ...DEFAULT_CONFIG, transport: 'osc', host: '127.0.0.2' }
		await instance.configUpdated(cfgB)
		priv.osc?.close()
		priv.osc = {
			send: async (cmd) => {
				hostB.push(cmd)
			},
			close: () => {},
		}
		// Release was already sent to host A during configUpdated().
		assert.equal(hostA.length, 2)
		assert.ok(hostA[1].includes("'release'"))

		// User now releases the button: must NOT hit host B.
		await instance.sendExecutor(101, 'up')
		assert.equal(hostB.length, 0)

		// Subsequent press+release on host B works normally.
		await instance.sendExecutor(101, 'down')
		await instance.sendExecutor(101, 'up')
		assert.equal(hostB.length, 2)
		await instance.destroy()
	})

	void it('preserves a failed release across reconfiguration to the same destination and flushes when recovered', async () => {
		const { instance } = createTestInstance()
		const priv = instance as unknown as InternalInstance
		let failSend = false
		const sent: string[] = []

		await instance.configUpdated({ ...DEFAULT_CONFIG, transport: 'osc', host: '127.0.0.1' })
		priv.osc?.close()
		priv.osc = {
			send: async (cmd) => {
				if (failSend) throw new Error('temporary failure')
				sent.push(cmd)
			},
			close: () => {},
		}

		await instance.sendExecutor(101, 'down')
		failSend = true
		await instance.sendExecutor(101, 'up')
		assert.equal(priv.pendingReleases.size, 1)

		// Reconfigure to the same host/user/display while old transport is still failing.
		await instance.configUpdated({ ...DEFAULT_CONFIG, transport: 'osc', host: '127.0.0.1', oscPort: 8082 })
		assert.equal(priv.pendingReleases.size, 1)

		// Once transport works again, another action (or retry timer) flushes the pending release.
		priv.osc?.close()
		failSend = false
		priv.osc = {
			send: async (cmd) => {
				sent.push(cmd)
			},
			close: () => {},
		}
		await instance.sendExecutor(102, 'tap')
		assert.equal(priv.pendingReleases.size, 0)
		assert.ok(
			sent.some((c) => c.includes("ExecutorIndex',101") && c.includes("'release'")),
			'pending release for exec 101 must be flushed',
		)
		await instance.destroy()
	})

	void it('flushes pending releases through Terminal when auto mode falls back from OSC', async () => {
		const { instance } = createTestInstance()
		const priv = instance as unknown as InternalInstance
		const termSent: string[] = []

		await instance.configUpdated({ ...DEFAULT_CONFIG, transport: 'osc', host: '127.0.0.1' })
		priv.osc?.close()
		instance.config = { ...DEFAULT_CONFIG, transport: 'auto', host: '127.0.0.1' }
		let failOsc = false
		priv.oscWorks = true
		priv.osc = {
			send: async () => {
				if (failOsc) throw new Error('osc down')
			},
			close: () => {},
		}
		priv.terminal = {
			ready: true,
			send: (cmd) => termSent.push(cmd),
			query: async () => {
				throw new Error('not called when osc send fails')
			},
			start: () => {},
			stop: () => {},
		}

		await instance.sendExecutor(101, 'down')
		failOsc = true
		await instance.sendExecutor(101, 'up')
		assert.equal(priv.pendingReleases.size, 1)

		// Probe detects OSC failure and switches to Terminal; pending release must flush via Terminal.
		await priv.probe()
		await priv.sendQueue
		assert.equal(priv.oscWorks, false)
		assert.equal(priv.pendingReleases.size, 0)
		assert.equal(termSent.length, 1)
		assert.ok(termSent[0].includes("'release'"))
		await instance.destroy()
	})

	void it('suppresses stale button-up after failed same-target reconfig followed by host switch and tap', async () => {
		const { instance } = createTestInstance()
		const priv = instance as unknown as InternalInstance
		const hostB: string[] = []
		let failA = false

		await instance.configUpdated({ ...DEFAULT_CONFIG, transport: 'osc', host: '127.0.0.1' })
		priv.osc?.close()
		priv.osc = {
			send: async () => {
				if (failA) throw new Error('A down')
			},
			close: () => {},
		}

		await instance.sendExecutor(101, 'down')
		failA = true
		// First reconfig: same host, release fails -> moves to pendingReleases but still marks stale-up.
		await instance.configUpdated({ ...DEFAULT_CONFIG, transport: 'osc', host: '127.0.0.1', oscPort: 8082 })
		// Second reconfig: switch to host B.
		await instance.configUpdated({ ...DEFAULT_CONFIG, transport: 'osc', host: '127.0.0.2' })
		priv.osc?.close()
		priv.osc = {
			send: async (cmd) => {
				hostB.push(cmd)
			},
			close: () => {},
		}

		// An intervening tap on B must not clear the stale-up marker.
		await instance.sendExecutor(101, 'tap')
		assert.equal(hostB.length, 2)
		// Original finger-up from host A must be consumed without hitting B.
		await instance.sendExecutor(101, 'up')
		assert.equal(hostB.length, 2)
		await instance.destroy()
	})

	void it('does not overwrite synchronous invalid-host ConnectionFailure with Connecting', async () => {
		const { instance, statuses } = createTestInstance()
		await instance.configUpdated({ ...DEFAULT_CONFIG, transport: 'terminal', host: 'bad host!' })
		const last = statuses.at(-1)
		assert.equal(last?.status, InstanceStatus.ConnectionFailure)
		await instance.destroy()
	})
})
