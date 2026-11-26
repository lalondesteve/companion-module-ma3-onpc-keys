import dgram from 'node:dgram'

function oscString(s: string): Buffer {
	const b = Buffer.from(s, 'utf8')
	// OSC strings are NUL-terminated and padded to a multiple of 4 bytes.
	return Buffer.concat([b, Buffer.alloc(4 - (b.length % 4))])
}

/** Sends grandMA3 command-line commands as OSC "/cmd,s,<command>" over UDP. */
export class OscSender {
	private sock = dgram.createSocket('udp4')

	private host: string

	constructor(
		host: string,
		private port: number,
	) {
		this.host = host.trim()
		this.sock.on('error', () => {
			// UDP send errors (e.g. ICMP unreachable) are not fatal; the probe reports OSC health.
		})
	}

	async send(command: string): Promise<void> {
		const msg = Buffer.concat([oscString('/cmd'), oscString(',s'), oscString(command)])
		await new Promise<void>((resolve, reject) => {
			this.sock.send(msg, this.port, this.host, (err) => (err ? reject(err) : resolve()))
		})
	}

	close(): void {
		this.sock.close()
	}
}
