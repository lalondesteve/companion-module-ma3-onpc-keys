import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'

type Log = (level: 'debug' | 'info' | 'warn' | 'error', msg: string) => void

const LOGIN_TIMEOUT_MS = 10000
const DEFAULT_RESTART_DELAY_MS = 3000
// Prompt the terminal prints once logged in, e.g. "Admin[Fixture]>" or "Admin@ShowData>".
const PROMPT = /[A-Za-z0-9_ .-]+(\[[^\]]*\]|@\S*)>/
const HOST_RE = /^[A-Za-z0-9.:_-]+$/

/**
 * A long-lived grandMA3 Terminal (app_terminal) session logged in with "cmdline <host>".
 * Commands are written one per line; the terminal prints a command's output only when the
 * next line arrives, so every command is followed by a blank line.
 */
export class TerminalSession {
	private proc: ChildProcessWithoutNullStreams | undefined
	private buffer = ''
	private listeners = new Set<(line: string) => void>()
	private cancelers = new Set<(reason: Error) => void>()
	private restartTimer: NodeJS.Timeout | undefined
	private stopped = false
	private readyPromise: Promise<void> | undefined
	ready = false

	constructor(
		private path: string,
		private host: string,
		private log: Log,
		private onState: (ready: boolean, reason?: string) => void,
		private restartDelayMs = DEFAULT_RESTART_DELAY_MS,
	) {}

	start(): void {
		this.stopped = false
		this.spawn()
	}

	stop(): void {
		this.stopped = true
		clearTimeout(this.restartTimer)
		this.restartTimer = undefined
		const proc = this.proc
		this.proc = undefined
		this.ready = false
		this.readyPromise = undefined
		for (const cancel of [...this.cancelers]) cancel(new Error('grandMA3 Terminal stopped'))
		if (proc) {
			proc.stdin.end('exit\n')
			setTimeout(() => proc.kill(), 500).unref()
		}
	}

	/** Resolves once logged in, or rejects if the session is not up. */
	async whenReady(): Promise<void> {
		if (this.ready) return
		if (!this.readyPromise) throw new Error('grandMA3 Terminal is not connected')
		return this.readyPromise
	}

	/** Run a command without waiting for its output. */
	send(command: string): void {
		if (!this.proc || !this.ready) throw new Error('grandMA3 Terminal is not connected')
		if (/[\r\n]/.test(command)) throw new Error('terminal command must be a single line')
		this.proc.stdin.write(`${command}\n\n`)
	}

	/** Run a command and wait for an output line that matches. */
	async query(command: string, match: RegExp, timeoutMs = 3000): Promise<RegExpMatchArray> {
		await this.whenReady()
		return new Promise((resolve, reject) => {
			const done = (fn: () => void) => {
				clearTimeout(timer)
				this.listeners.delete(onLine)
				this.cancelers.delete(onCancel)
				fn()
			}
			const onLine = (line: string) => {
				const m = line.match(match)
				if (m) done(() => resolve(m))
			}
			const onCancel = (err: Error) => done(() => reject(err))
			const timer = setTimeout(() => done(() => reject(new Error('no answer from grandMA3 Terminal'))), timeoutMs)
			this.listeners.add(onLine)
			this.cancelers.add(onCancel)
			try {
				this.send(command)
			} catch (e) {
				done(() => reject(e instanceof Error ? e : new Error(String(e))))
			}
		})
	}

	private spawn(): void {
		const host = this.host.trim()
		if (!HOST_RE.test(host)) {
			this.ready = false
			this.onState(false, `invalid onPC host "${this.host}"`)
			return
		}
		let proc: ChildProcessWithoutNullStreams
		try {
			proc = spawn(this.path, [], { stdio: 'pipe' })
		} catch (e) {
			this.fail(`cannot start grandMA3 Terminal: ${(e as Error).message}`)
			return
		}
		this.proc = proc
		this.buffer = ''
		this.ready = false

		let loggedIn: () => void = () => {}
		let loginFailed: (e: Error) => void = () => {}
		this.readyPromise = new Promise<void>((resolve, reject) => {
			loggedIn = resolve
			loginFailed = reject
		})
		this.readyPromise.catch(() => {})
		const loginTimer = setTimeout(() => {
			if (proc !== this.proc) return
			loginFailed(new Error('grandMA3 Terminal login timed out'))
			this.fail(`could not log in to onPC at ${host}`)
			proc.kill()
		}, LOGIN_TIMEOUT_MS)

		const onData = (chunk: Buffer) => {
			if (proc !== this.proc) return
			// eslint-disable-next-line no-control-regex
			this.buffer += chunk.toString('utf8').replace(/\x1b\[[0-9;]*m/g, '')
			const lines = this.buffer.split(/\r?\n/)
			this.buffer = lines.pop() ?? ''
			// A prompt without a newline after it still counts for login detection.
			for (const line of [...lines, this.buffer]) {
				if (!this.ready && PROMPT.test(line)) {
					clearTimeout(loginTimer)
					this.ready = true
					this.log('info', `grandMA3 Terminal logged in to ${host}`)
					this.onState(true)
					loggedIn()
				}
			}
			for (const line of lines) for (const l of this.listeners) l(line)
		}
		const handleDown = (reason: string, err: Error) => {
			clearTimeout(loginTimer)
			loginFailed(err)
			if (proc !== this.proc) return
			this.proc = undefined
			this.fail(reason)
		}
		proc.stdout.on('data', onData)
		proc.stderr.on('data', onData)
		proc.on('error', (e) => handleDown(`grandMA3 Terminal error: ${e.message}`, e))
		proc.on('exit', (code) =>
			handleDown(`grandMA3 Terminal exited (${code ?? 'signal'})`, new Error('grandMA3 Terminal exited')),
		)
		proc.on('close', (code) =>
			handleDown(`grandMA3 Terminal exited (${code ?? 'signal'})`, new Error('grandMA3 Terminal closed')),
		)
		proc.stdin.on('error', () => {})
		proc.stdin.write(`cmdline ${host}\n`)
	}

	private fail(reason: string): void {
		const wasReady = this.ready
		this.ready = false
		for (const cancel of [...this.cancelers]) cancel(new Error(reason))
		if (wasReady || !this.stopped) this.onState(false, reason)
		if (this.stopped) return
		if (this.proc) {
			// Login timed out; the exit/close handler restarts it.
			return
		}
		clearTimeout(this.restartTimer)
		this.restartTimer = setTimeout(() => this.spawn(), this.restartDelayMs)
	}
}
