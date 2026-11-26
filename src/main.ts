import { randomBytes } from 'node:crypto'
import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { DEFAULT_CONFIG, GetConfigFields, type ModuleConfig } from './config.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema, type Phase } from './actions.js'
import { UpdatePresets } from './presets.js'
import { parseShortcut, type MaKey } from './keys.js'
import { buildKeyLua, buildShortcutsToggleLua, targetId, type KeyTarget } from './lua.js'
import { OscSender } from './osc.js'
import { TerminalSession } from './terminal.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: Record<string, never>
	variables: Record<string, never>
}

export { UpgradeScripts }

const PROBE_INTERVAL_MS = 15000
const OSC_RETRY_INTERVAL_MS = 2000
const PROBE_VAR_PREFIX = 'companion_ma3keys_probe'
const HOST_RE = /^[A-Za-z0-9.:_-]+$/

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config: ModuleConfig = DEFAULT_CONFIG
	private osc: OscSender | undefined
	private terminal: TerminalSession | undefined
	/** In auto mode: whether the last probe saw an OSC command arrive. */
	private oscWorks = false
	private probing = false
	private probeTimer: NodeJS.Timeout | undefined
	private pendingReleaseTimer: NodeJS.Timeout | undefined
	/** Unique global variable per module instance so concurrent instances do not collide or accumulate vars. */
	private readonly probeVar = `${PROBE_VAR_PREFIX}_${randomBytes(4).toString('hex')}`
	/** Keys currently held down, so they can be released on shutdown. */
	private held = new Map<string, KeyTarget>()
	/** Releases that failed while a transport was down, retried once it recovers. */
	private pendingReleases = new Map<string, KeyTarget>()
	/** Held keys already released by configUpdated(), so the upcoming button-up does not hit the new host. */
	private releasedByTeardown = new Set<string>()
	/** Serializes press/release and lifecycle transitions so rapid events stay ordered. */
	private sendQueue: Promise<void> = Promise.resolve()

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.updateActions()
		this.updatePresets()
		await this.configUpdated(config)
	}

	async destroy(): Promise<void> {
		await this.enqueue(async () => {
			await this.releaseAll(false)
			this.teardown()
		})
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		await this.enqueue(async () => {
			const nextConfig: ModuleConfig = { ...DEFAULT_CONFIG, ...config }
			const host = nextConfig.host.trim()
			nextConfig.host = host
			const sameTarget =
				host === this.config.host && nextConfig.user === this.config.user && nextConfig.display === this.config.display

			await this.releaseAll(sameTarget)
			this.teardown()
			this.config = nextConfig
			const { transport, oscPort, terminalPath } = this.config
			this.oscWorks = false

			if (transport !== 'terminal') {
				if (HOST_RE.test(host)) {
					this.osc = new OscSender(host, oscPort)
				} else if (transport === 'osc') {
					this.updateStatus(InstanceStatus.BadConfig, `invalid onPC host "${host}"`)
					return
				}
			}
			if (transport !== 'osc') {
				const term = new TerminalSession(
					terminalPath,
					host,
					(level, msg) => this.log(level, msg),
					(ready, reason) => {
						if (this.terminal !== term) return
						if (ready) {
							void this.enqueue(async () => {
								if (this.terminal === term && term.ready && this.pendingReleases.size > 0) {
									await this.flushPendingReleases(true)
								}
							})
							void this.probe()
						} else {
							this.refreshStatus(reason)
						}
					},
				)
				this.terminal = term
				this.updateStatus(InstanceStatus.Connecting)
				term.start()
			} else {
				this.updateStatus(InstanceStatus.Ok, `OSC to ${host}:${oscPort} (not verified)`)
				if (this.pendingReleases.size > 0) this.schedulePendingReleaseRetry()
			}
			if (transport === 'auto') {
				this.probeTimer = setInterval(() => void this.probe(), PROBE_INTERVAL_MS)
			}
		})
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	private async enqueue<T>(fn: () => Promise<T>): Promise<T> {
		const next = this.sendQueue.then(fn, fn)
		this.sendQueue = next.then(
			() => undefined,
			() => undefined,
		)
		return next
	}

	private clearPendingReleaseTimer(): void {
		clearInterval(this.pendingReleaseTimer)
		this.pendingReleaseTimer = undefined
	}

	private schedulePendingReleaseRetry(): void {
		if (this.config.transport !== 'osc' || this.pendingReleases.size === 0 || this.pendingReleaseTimer) return
		this.pendingReleaseTimer = setInterval(() => {
			void this.enqueue(async () => this.flushPendingReleases())
		}, OSC_RETRY_INTERVAL_MS)
		this.pendingReleaseTimer.unref()
	}

	private teardown(): void {
		clearInterval(this.probeTimer)
		this.probeTimer = undefined
		this.clearPendingReleaseTimer()
		this.probing = false
		this.terminal?.stop()
		this.terminal = undefined
		this.osc?.close()
		this.osc = undefined
	}

	/** Auto mode: send a nonce to this instance's global variable over OSC and read & delete it via Terminal. */
	private async probe(): Promise<void> {
		if (this.probing) return
		const { osc, terminal } = this
		if (!terminal?.ready) return this.refreshStatus()
		if (this.config.transport !== 'auto' || !osc) return this.refreshStatus()
		this.probing = true
		const nonce = randomBytes(4).toString('hex')
		let works = false
		try {
			await osc.send(`SetGlobalVariable "${this.probeVar}" "${nonce}"`)
			await new Promise((r) => setTimeout(r, 250))
			if (this.osc !== osc || this.terminal !== terminal) return
			const m = await terminal.query(
				`Lua "local g=GlobalVars() local v=tostring((GetVar(g,'${this.probeVar}'))) if v=='${nonce}' then DelVar(g,'${this.probeVar}') end Printf('MA3KPROBE_${nonce}='..v)"`,
				new RegExp(`MA3KPROBE_${nonce}=([A-Za-z0-9]+)`),
			)
			works = m[1] === nonce
		} catch (e) {
			this.log('debug', `OSC probe failed: ${(e as Error).message}`)
		} finally {
			if (this.osc === osc && this.terminal === terminal) this.probing = false
		}
		if (this.osc !== osc || this.terminal !== terminal) return
		if (works !== this.oscWorks) {
			this.log(
				'info',
				works ? 'OSC commands reach onPC; using OSC' : 'OSC commands do not reach onPC; using grandMA3 Terminal',
			)
		}
		this.oscWorks = works
		if (this.pendingReleases.size > 0) void this.enqueue(async () => this.flushPendingReleases())
		this.refreshStatus()
	}

	private refreshStatus(reason?: string): void {
		const { transport, host, oscPort } = this.config
		if (transport === 'osc') return
		if (!this.terminal?.ready) {
			this.updateStatus(InstanceStatus.ConnectionFailure, reason ?? 'grandMA3 Terminal not connected')
		} else if (transport === 'auto' && this.oscWorks) {
			this.updateStatus(InstanceStatus.Ok, `OSC ${host}:${oscPort}`)
		} else if (transport === 'auto') {
			this.updateStatus(InstanceStatus.Ok, `grandMA3 Terminal (OSC ${host}:${oscPort} not answering)`)
		} else {
			this.updateStatus(InstanceStatus.Ok, 'grandMA3 Terminal')
		}
	}

	private async run(command: string): Promise<void> {
		const { transport } = this.config
		if (this.osc && (transport === 'osc' || (transport === 'auto' && this.oscWorks))) {
			await this.osc.send(command)
		} else if (this.terminal) {
			this.terminal.send(command)
		} else {
			throw new Error('no transport')
		}
	}

	private async flushPendingReleases(preferTerminal = false): Promise<void> {
		const { user, display } = this.config
		for (const [id, target] of [...this.pendingReleases.entries()]) {
			const cmd = buildKeyLua(target, false, user, display)
			try {
				if (preferTerminal && this.terminal?.ready) {
					this.terminal.send(cmd)
				} else {
					await this.run(cmd)
				}
				this.pendingReleases.delete(id)
			} catch {
				if (!preferTerminal && this.config.transport === 'auto' && this.terminal?.ready) {
					try {
						this.terminal.send(cmd)
						this.pendingReleases.delete(id)
						continue
					} catch {
						// Terminal also failed; keep queued for the next retry.
					}
				}
				// Transport still down; keep queued for the next retry.
				break
			}
		}
		if (this.pendingReleases.size === 0) this.clearPendingReleaseTimer()
	}

	private async releaseAll(keepFailed: boolean): Promise<void> {
		const { user, display } = this.config
		const toRelease = new Map<string, KeyTarget>([...this.pendingReleases, ...this.held])
		const nextPending = new Map<string, KeyTarget>()
		for (const [id, target] of [...toRelease.entries()].reverse()) {
			const wasHeld = this.held.has(id)
			if (wasHeld) this.releasedByTeardown.add(id)
			try {
				await this.run(buildKeyLua(target, false, user, display))
			} catch {
				if (keepFailed) nextPending.set(id, target)
			}
		}
		this.held.clear()
		this.pendingReleases = nextPending
		if (this.pendingReleases.size === 0) this.clearPendingReleaseTimer()
	}

	private async dispatchTarget(target: KeyTarget, phase: Phase, what: string): Promise<void> {
		await this.enqueue(async () => {
			const id = targetId(target)
			if (phase === 'up' && this.releasedByTeardown.delete(id)) {
				// Release was already sent during configUpdated(); don't send a stale release to the new host.
				return
			}
			const send = async (down: boolean) => {
				try {
					await this.run(buildKeyLua(target, down, this.config.user, this.config.display))
					return true
				} catch (e) {
					this.log('warn', `${what} ${down ? 'press' : 'release'} failed: ${(e as Error).message}`)
					return false
				}
			}
			let sentAny = false
			if (phase === 'down' || phase === 'tap') {
				if (phase === 'down') this.releasedByTeardown.delete(id)
				if (await send(true)) {
					sentAny = true
					this.pendingReleases.delete(id)
					this.held.set(id, target)
				}
			}
			if (phase === 'up' || phase === 'tap') {
				const wasHeld = this.held.delete(id)
				const wasPending = this.pendingReleases.has(id)
				// Release even if the press failed, so a key can never stay stuck down.
				if (await send(false)) {
					sentAny = true
					this.pendingReleases.delete(id)
				} else if (wasHeld || wasPending) {
					this.pendingReleases.set(id, target)
					this.schedulePendingReleaseRetry()
				}
			}
			if (sentAny && this.config.transport === 'osc' && this.pendingReleases.size > 0) {
				await this.flushPendingReleases()
			}
		})
	}

	/** Press, release or tap a cataloged grandMA3 hardware key or special executor. */
	async sendMaKey(key: MaKey, phase: Phase): Promise<void> {
		if (key.kind === 'shortcuts_toggle') {
			if (phase === 'up') return
			await this.enqueue(async () => {
				try {
					await this.run(buildShortcutsToggleLua(this.config.user))
				} catch (e) {
					this.log('warn', `${key.label} toggle failed: ${(e as Error).message}`)
				}
			})
			return
		}
		await this.dispatchTarget(key, phase, key.label)
	}

	/** Press, release or tap a numbered executor key on the current page. */
	async sendExecutor(executorIndex: number, phase: Phase): Promise<void> {
		await this.dispatchTarget({ kind: 'exec', executorIndex }, phase, `Exec ${executorIndex}`)
	}

	/** Press, release or tap a key given in MA shortcut notation. */
	async sendShortcut(shortcut: string, phase: Phase, what: string): Promise<void> {
		const stroke = parseShortcut(shortcut)
		await this.dispatchTarget({ kind: 'raw_shortcut', stroke }, phase, what)
	}
}
