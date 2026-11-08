// A small SMTP client on Node's built-in net/tls (no packages): enough to send one
// transactional email. Port 465 = TLS from the start; anything else (587, 25) =
// STARTTLS, which is required before signing in. AUTH PLAIN or LOGIN.
// Settings come from SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM.

import { randomBytes } from "node:crypto";
import net from "node:net";
import tls from "node:tls";
import type { SendStage } from "./otp";

export class SmtpError extends Error {
  constructor(
    message: string,
    readonly stage: SendStage,
    readonly code?: number,
  ) {
    super(message);
    this.name = "SmtpError";
  }
}

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  /** Extra trusted CA (tests with a local server only). */
  ca?: string;
};
export type Mail = { to: string; subject: string; text: string; html?: string };

const TIMEOUT_MS = 20_000;
/** Give up on reaching the server sooner than on the whole send. */
const CONNECT_TIMEOUT_MS = 10_000;

/** Settings from the environment, or null if any are missing. */
export function smtpConfigFromEnv(env: Record<string, string | undefined> = process.env): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim();
  const port = Number(env.SMTP_PORT ?? 587);
  const user = env.SMTP_USER?.trim();
  const password = env.SMTP_PASSWORD;
  const from = env.SMTP_FROM?.trim() || user;
  if (!host || !user || !password || !from || !Number.isInteger(port) || port <= 0) return null;
  return { host, port, user, password, from };
}

/** The bare address in `Name <addr>` (or the whole string if there are no brackets). */
export function addressOf(from: string): string {
  const m = /<([^<>\s]+@[^<>\s]+)>/.exec(from);
  return (m ? m[1] : from).trim();
}

const noBreaks = (s: string) => {
  if (/[\r\n]/.test(s)) throw new SmtpError("header contains a line break", "data");
  return s;
};

/** RFC 2047 encoded-word for non-ASCII header text. */
export function encodeHeader(s: string): string {
  noBreaks(s);
  return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

/** Display name encoded if needed, address left alone. */
function encodeFrom(from: string): string {
  const m = /^\s*"?([^"<]*?)"?\s*<([^<>]+)>\s*$/.exec(from);
  return m && m[1] ? `${encodeHeader(m[1])} <${m[2]}>` : noBreaks(from);
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/.{1,76}/g, "$&\r\n");

/** The full message (headers + MIME body), CRLF line endings. */
export function buildMessage(mail: Mail, from: string, now = new Date()): string {
  const boundary = `calmly-${randomBytes(12).toString("hex")}`;
  const domain = addressOf(from).split("@")[1] ?? "calmly.local";
  const headers = [
    `From: ${encodeFrom(from)}`,
    `To: ${noBreaks(mail.to)}`,
    `Subject: ${encodeHeader(mail.subject)}`,
    `Date: ${now.toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${randomBytes(16).toString("hex")}@${domain}>`,
    "MIME-Version: 1.0",
  ];
  if (!mail.html) {
    return [...headers, "Content-Type: text/plain; charset=utf-8", "Content-Transfer-Encoding: base64", "", b64(mail.text)].join("\r\n");
  }
  return [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(mail.text),
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(mail.html),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

/** Lines starting with "." get an extra "." (SMTP DATA transparency). */
export const dotStuff = (msg: string) => msg.replace(/(^|\r\n)\./g, "$1..");

type Reply = { code: number; text: string; lines: string[] };

/** Reads SMTP replies line by line from a socket (re-attachable after STARTTLS). */
function reader(sock: net.Socket) {
  let buf = "";
  const queue: string[] = [];
  let wake: (() => void) | null = null;
  let failure: Error | null = null;
  const onData = (d: Buffer) => {
    buf += d.toString("utf8");
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      queue.push(buf.slice(0, i));
      buf = buf.slice(i + 2);
    }
    wake?.();
  };
  const onError = (e: Error) => {
    failure = e;
    wake?.();
  };
  const onClose = () => {
    failure ??= new Error("connection closed by the server");
    wake?.();
  };
  sock.on("data", onData);
  sock.on("error", onError);
  sock.on("close", onClose);
  const line = async (): Promise<string> => {
    for (;;) {
      if (queue.length) return queue.shift()!;
      if (failure) throw failure;
      await new Promise<void>((r) => (wake = r));
      wake = null;
    }
  };
  return {
    async reply(): Promise<Reply> {
      const lines: string[] = [];
      for (;;) {
        const l = await line();
        lines.push(l);
        if (l.length < 4 || l[3] !== "-") break;
      }
      const last = lines[lines.length - 1];
      return { code: Number(last.slice(0, 3)) || 0, text: lines.map((l) => l.slice(4)).join(" "), lines };
    },
    detach() {
      sock.off("data", onData);
      sock.off("error", onError);
      sock.off("close", onClose);
    },
  };
}

function connect(cfg: SmtpConfig, track: (s: net.Socket) => void): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const fail = (e: Error) => reject(new SmtpError(`connect to ${cfg.host}:${cfg.port} failed: ${e.message}`, cfg.port === 465 ? "tls" : "connect"));
    const sock =
      cfg.port === 465
        ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host, ca: cfg.ca }, () => done())
        : net.connect({ host: cfg.host, port: cfg.port }, () => done());
    track(sock); // so a timeout can kill it even while it's still connecting
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new SmtpError(`could not connect to ${cfg.host}:${cfg.port} within ${CONNECT_TIMEOUT_MS / 1000}s`, "connect"));
    }, CONNECT_TIMEOUT_MS);
    const onError = (e: Error) => {
      clearTimeout(timer);
      fail(e);
    };
    const done = () => {
      clearTimeout(timer);
      sock.off("error", onError);
      resolve(sock);
    };
    sock.once("error", onError);
  });
}

function upgrade(plain: net.Socket, host: string, ca: string | undefined, track: (s: net.Socket) => void): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const s = tls.connect({ socket: plain, servername: host, ca }, () => resolve(s));
    track(s);
    s.once("error", (e) => reject(new SmtpError(`TLS handshake failed: ${e.message}`, "tls")));
  });
}

/** Send one email. Throws SmtpError with the stage that failed. */
export async function sendMail(mail: Mail, cfg: SmtpConfig | null = smtpConfigFromEnv()): Promise<void> {
  if (!cfg) throw new SmtpError("SMTP settings are missing (SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM)", "config");
  let sock: net.Socket | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SmtpError(`no answer from ${cfg.host} within ${TIMEOUT_MS / 1000}s`, "timeout")), TIMEOUT_MS);
  });

  const track = (s: net.Socket) => {
    sock = s;
  };
  const run = async () => {
    sock = await connect(cfg, track);
    let r = reader(sock);
    const expect = async (stage: SendStage, ok: number[], cmd?: string) => {
      if (cmd !== undefined) sock!.write(`${cmd}\r\n`);
      const rep = await r.reply().catch((e: Error) => {
        throw new SmtpError(e.message, stage);
      });
      if (!ok.includes(rep.code)) throw new SmtpError(`${stage}: ${rep.code} ${rep.text}`, stage, rep.code);
      return rep;
    };

    await expect("connect", [220]);
    let ehlo = await expect("connect", [250], "EHLO calmly");
    if (!(sock instanceof tls.TLSSocket)) {
      if (!ehlo.lines.some((l) => /STARTTLS/i.test(l))) throw new SmtpError("server does not offer STARTTLS", "tls");
      await expect("tls", [220], "STARTTLS");
      r.detach();
      sock = await upgrade(sock, cfg.host, cfg.ca, track);
      r = reader(sock);
      ehlo = await expect("connect", [250], "EHLO calmly");
    }

    const auth = ehlo.lines.find((l) => /^250[ -]AUTH/i.test(l)) ?? "";
    if (/\bPLAIN\b/i.test(auth) || !/\bLOGIN\b/i.test(auth)) {
      await expect("auth", [235], `AUTH PLAIN ${Buffer.from(`\0${cfg.user}\0${cfg.password}`).toString("base64")}`);
    } else {
      await expect("auth", [334], "AUTH LOGIN");
      await expect("auth", [334], Buffer.from(cfg.user).toString("base64"));
      await expect("auth", [235], Buffer.from(cfg.password).toString("base64"));
    }

    await expect("sender", [250], `MAIL FROM:<${addressOf(cfg.from)}>`);
    await expect("recipient", [250, 251], `RCPT TO:<${noBreaks(mail.to)}>`);
    await expect("data", [354], "DATA");
    sock.write(`${dotStuff(buildMessage(mail, cfg.from))}\r\n.\r\n`);
    await expect("data", [250]);
    sock.write("QUIT\r\n");
  };

  const sending = run();
  sending.catch(() => {}); // if the timeout wins, the late failure is expected and ignored
  try {
    await Promise.race([sending, timeout]);
    (sock as net.Socket | null)?.end();
  } catch (e) {
    (sock as net.Socket | null)?.destroy(); // never leave a half-open connection behind
    throw e instanceof SmtpError ? e : new SmtpError((e as Error).message, "connect");
  } finally {
    clearTimeout(timer);
  }
}
