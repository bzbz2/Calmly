import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CODE_ERRORS,
  OTP_TTL_MS,
  codeProblem,
  hashOtp,
  isValidEmail,
  newOtp,
  normalizeEmail,
  otpEmail,
  otpMatches,
  resendWait,
  sendFailureMessage,
} from "../src/lib/auth/otp";
import { SmtpError, addressOf, buildMessage, dotStuff, encodeHeader, sendMail, smtpConfigFromEnv } from "../src/lib/auth/smtp";

describe("email validation", () => {
  test("accepts real-looking addresses", () => {
    for (const e of ["a@b.co", "Name.Surname+tag@mail.example.com", "  MixedCase@Example.ORG ", "o'brien@ex-ample.io"]) expect(isValidEmail(e)).toBe(true);
  });
  test("rejects everything else", () => {
    for (const e of ["", "plain", "@x.com", "a@", "a@b", "a@b.c", "a b@c.com", "a@@b.com", "a@b..com", ".a@b.com", "a.@b.com", "a..b@c.com", "a@-b.com", "a@b-.com", "a@b.c0m", "a@b.com\r\nBcc: x@y.com", null, 42, `${"x".repeat(65)}@b.com`]) {
      expect(isValidEmail(e)).toBe(false);
    }
  });
  test("normalizes to trimmed lower case", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });
});

describe("one-time codes", () => {
  const secret = "test-secret";
  test("6 digits, varied", () => {
    const codes = new Set(Array.from({ length: 200 }, newOtp));
    for (const c of codes) expect(c).toMatch(/^\d{6}$/);
    expect(codes.size).toBeGreaterThan(190);
  });
  test("stored as a keyed hash tied to the email", () => {
    const h = hashOtp("ada@example.com", "123456", secret);
    expect(h).not.toContain("123456");
    expect(otpMatches(h, "ADA@example.com ", "123456", secret)).toBe(true);
    expect(otpMatches(h, "ada@example.com", "123457", secret)).toBe(false);
    expect(otpMatches(h, "bob@example.com", "123456", secret)).toBe(false);
    expect(otpMatches(h, "ada@example.com", "123456", "other-secret")).toBe(false);
    expect(otpMatches(h, "ada@example.com", "12345", secret)).toBe(false);
  });
  test("expires after 5 minutes", () => {
    expect(OTP_TTL_MS).toBe(300_000);
    const sent = new Date("2026-11-08T10:00:00Z");
    const c = { expiresAt: new Date(sent.getTime() + OTP_TTL_MS), usedAt: null, attempts: 0 };
    expect(codeProblem(c, new Date(sent.getTime() + 4 * 60_000 + 59_000))).toBeNull();
    expect(codeProblem(c, new Date(sent.getTime() + 5 * 60_000))).toBe("expired");
  });
  test("used, locked and missing codes", () => {
    const now = new Date();
    const later = new Date(now.getTime() + 60_000);
    expect(codeProblem(undefined, now)).toBe("missing");
    expect(codeProblem({ expiresAt: later, usedAt: now, attempts: 0 }, now)).toBe("used");
    expect(codeProblem({ expiresAt: later, usedAt: null, attempts: 5 }, now)).toBe("locked");
    expect(codeProblem({ expiresAt: later, usedAt: null, attempts: 4 }, now)).toBeNull();
    expect(CODE_ERRORS.expired).toContain("5 minutes");
  });
  test("resend waits 60 seconds", () => {
    const now = new Date("2026-11-08T10:01:00Z");
    expect(resendWait(undefined, now)).toBe(0);
    expect(resendWait(new Date("2026-11-08T10:00:30Z"), now)).toBe(30);
    expect(resendWait(new Date("2026-11-08T09:59:00Z"), now)).toBe(0);
  });
  test("email text says the code and the 5 minutes", () => {
    const m = otpEmail("042913");
    expect(m.text).toContain("042913");
    expect(m.text).toContain("5 minutes");
    expect(m.html).toContain("042913");
  });
});

describe("send failures become clear messages", () => {
  test("by stage and reply code", () => {
    expect(sendFailureMessage("config")).toEqual({ status: 503, error: expect.stringContaining("isn't set up") });
    expect(sendFailureMessage("connect").error).toContain("couldn't reach the email server");
    expect(sendFailureMessage("timeout").status).toBe(504);
    expect(sendFailureMessage("tls").error).toContain("secure connection");
    expect(sendFailureMessage("auth", 535).error).toContain("didn't accept our sign-in");
    expect(sendFailureMessage("recipient", 550)).toEqual({ status: 400, error: expect.stringContaining("rejected this email address") });
    expect(sendFailureMessage("recipient", 452).error).toContain("busy");
    expect(sendFailureMessage("sender", 553).error).toContain("sender address");
    expect(sendFailureMessage("data", 554).error).toContain("couldn't send the code");
  });
});

describe("SMTP client", () => {
  test("settings from env", () => {
    expect(smtpConfigFromEnv({})).toBeNull();
    expect(smtpConfigFromEnv({ SMTP_HOST: "smtp.x.com", SMTP_PORT: "587", SMTP_USER: "u@x.com", SMTP_PASSWORD: "p" })).toEqual({ host: "smtp.x.com", port: 587, user: "u@x.com", password: "p", from: "u@x.com" });
    expect(smtpConfigFromEnv({ SMTP_HOST: "h", SMTP_PORT: "abc", SMTP_USER: "u", SMTP_PASSWORD: "p" })).toBeNull();
  });
  test("addresses and headers", () => {
    expect(addressOf("Calmly Support Team <help@calmly.app>")).toBe("help@calmly.app");
    expect(addressOf("help@calmly.app")).toBe("help@calmly.app");
    expect(encodeHeader("Reset code")).toBe("Reset code");
    expect(encodeHeader("重置密码")).toBe(`=?UTF-8?B?${Buffer.from("重置密码").toString("base64")}?=`);
    expect(() => encodeHeader("a\r\nBcc: x@y.com")).toThrow(SmtpError);
  });
  test("message: headers, both parts, CRLF, dot-stuffing", () => {
    const msg = buildMessage({ to: "ada@example.com", subject: "Code", text: "Your code is 123456", html: "<b>123456</b>" }, "Calmly Support Team <help@calmly.app>");
    expect(msg).toContain("From: Calmly Support Team <help@calmly.app>\r\n");
    expect(msg).toContain("To: ada@example.com\r\n");
    expect(msg).toContain("multipart/alternative");
    expect(msg).toContain(Buffer.from("Your code is 123456").toString("base64"));
    expect(msg.replace(/\r\n/g, "")).not.toContain("\n");
    expect(dotStuff(".a\r\n.b\r\nc.d")).toBe("..a\r\n..b\r\nc.d");
  });

  /** A fake mail server that answers with the given script, one reply per command. */
  async function fakeServer(replies: string[]) {
    const server = net.createServer((s) => {
      const queue = [...replies];
      s.write(`${queue.shift()}\r\n`);
      s.on("data", () => {
        const r = queue.shift();
        if (r) s.write(`${r}\r\n`);
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    return { server, port: (server.address() as net.AddressInfo).port };
  }
  const cfg = (port: number) => ({ host: "127.0.0.1", port, user: "u@x.com", password: "p", from: "Calmly <u@x.com>" });
  const mail = { to: "ada@example.com", subject: "s", text: "t" };
  const failure = async (p: Promise<unknown>) => {
    try {
      await p;
    } catch (e) {
      return e as SmtpError;
    }
    throw new Error("expected a failure");
  };

  test("missing settings → config", async () => {
    expect((await failure(sendMail(mail, null))).stage).toBe("config");
  });
  test("nothing listening → connect", async () => {
    const { server, port } = await fakeServer([]);
    server.close();
    await Bun.sleep(20);
    expect((await failure(sendMail(mail, cfg(port)))).stage).toBe("connect");
  });
  test("server refuses us → connect, with its code", async () => {
    const { server, port } = await fakeServer(["554 no service"]);
    const e = await failure(sendMail(mail, cfg(port)));
    server.close();
    expect([e.stage, e.code]).toEqual(["connect", 554]);
  });
  test("no STARTTLS → we never send the password in the clear", async () => {
    const { server, port } = await fakeServer(["220 hi", "250-fake\r\n250 AUTH PLAIN LOGIN"]);
    const e = await failure(sendMail(mail, cfg(port)));
    server.close();
    expect(e.stage).toBe("tls");
  });

  describe("full send over STARTTLS (local fake server, throwaway certificate)", () => {
    const dir = mkdtempSync(join(tmpdir(), "calmly-smtp-"));
    const made = Bun.spawnSync(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost", "-keyout", join(dir, "key.pem"), "-out", join(dir, "cert.pem")], { stderr: "ignore" });
    const key = made.success ? readFileSync(join(dir, "key.pem"), "utf8") : "";
    const cert = made.success ? readFileSync(join(dir, "cert.pem"), "utf8") : "";

    const node = Bun.which("node");
    const ready = made.success && !!node;

    /** Start the Node fake server; resolves with its port and a promise of what it received. */
    async function tlsServer(mode: "ok" | "badauth" | "badrcpt" = "ok") {
      const proc = Bun.spawn([node!, join(import.meta.dir, "fixtures/fake-smtp-server.mjs"), join(dir, "key.pem"), join(dir, "cert.pem"), mode], { stdout: "pipe", stderr: "ignore" });
      const reader = proc.stdout.getReader();
      let out = "";
      const next = async (prefix: string) => {
        for (;;) {
          const line = out.split("\n").find((l) => l.startsWith(prefix));
          if (line) return line.slice(prefix.length + 1);
          const { value, done } = await reader.read();
          if (done) throw new Error(`fake server exited before ${prefix}`);
          out += new TextDecoder().decode(value);
        }
      };
      const port = Number(await next("PORT"));
      const cfg = { host: "localhost", port, user: "u@x.com", password: "p@ss", from: "Calmly Support Team <u@x.com>", ca: cert };
      return { cfg, got: async () => JSON.parse(await next("GOT")) as { tls: boolean; auth: string; from: string; to: string; data: string }, stop: () => proc.kill() };
    }

    test.skipIf(!ready)("sends the code: STARTTLS, then AUTH, then the message", async () => {
      const srv = await tlsServer();
      await sendMail({ to: "ada@example.com", ...otpEmail("481516") }, srv.cfg);
      const got = await srv.got();
      expect(got.tls).toBe(true);
      expect(got.auth).toBe("\0u@x.com\0p@ss");
      expect(got.from).toBe("MAIL FROM:<u@x.com>");
      expect(got.to).toBe("RCPT TO:<ada@example.com>");
      expect(got.data).toContain("Subject: Your Calmly password reset code");
      expect(got.data.replace(/\n/g, "")).toContain(Buffer.from(otpEmail("481516").text).toString("base64").slice(0, 60));
    });
    test.skipIf(!ready)("wrong SMTP password → auth stage, code 535", async () => {
      const srv = await tlsServer("badauth");
      const e = await failure(sendMail(mail, srv.cfg));
      srv.stop();
      expect([e.stage, e.code]).toEqual(["auth", 535]);
      expect(sendFailureMessage(e.stage, e.code).error).toContain("didn't accept our sign-in");
    });
    test.skipIf(!ready)("recipient refused → recipient stage, a message about the address", async () => {
      const srv = await tlsServer("badrcpt");
      const e = await failure(sendMail(mail, srv.cfg));
      srv.stop();
      expect([e.stage, e.code]).toEqual(["recipient", 550]);
      expect(sendFailureMessage(e.stage, e.code).status).toBe(400);
    });
    test.skipIf(!ready)("untrusted certificate → tls stage", async () => {
      const srv = await tlsServer();
      const e = await failure(sendMail(mail, { ...srv.cfg, ca: undefined }));
      srv.stop();
      expect(e.stage).toBe("tls");
    });
  });
});
