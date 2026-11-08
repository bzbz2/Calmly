// A one-connection fake SMTP server with STARTTLS, for tests/password-reset.test.ts.
// Runs under Node (Bun can't do the server side of a STARTTLS upgrade).
// Usage: node fake-smtp-server.mjs <key.pem> <cert.pem> <ok|badauth|badrcpt>
// Prints "PORT <n>" when listening and "GOT <json>" when the client hangs up.
import net from "node:net";
import tls from "node:tls";
import { readFileSync } from "node:fs";

const [keyPath, certPath, mode = "ok"] = process.argv.slice(2);
const key = readFileSync(keyPath, "utf8");
const cert = readFileSync(certPath, "utf8");
const got = { tls: false, auth: "", from: "", to: "", data: "" };

const server = net.createServer((raw) => {
  let sock = raw;
  let buf = "";
  let inData = false;
  let reported = false;
  const report = () => {
    if (reported) return;
    reported = true;
    console.log(`GOT ${JSON.stringify(got)}`);
    server.close();
    setTimeout(() => process.exit(0), 50);
  };
  const write = (l) => sock.write(`${l}\r\n`);
  const handle = (line) => {
    if (inData) {
      if (line === ".") {
        inData = false;
        write("250 2.0.0 queued");
      } else got.data += `${line}\n`;
      return;
    }
    const cmd = line.toUpperCase();
    if (cmd.startsWith("EHLO")) {
      write("250-fake.local");
      write(got.tls ? "250 AUTH PLAIN LOGIN" : "250 STARTTLS");
    } else if (cmd === "STARTTLS") {
      write("220 2.0.0 go ahead");
      raw.removeAllListeners("data");
      const t = new tls.TLSSocket(raw, { isServer: true, key, cert });
      t.on("error", report);
      t.on("close", report);
      sock = t;
      got.tls = true;
      buf = "";
      t.on("data", onData);
    } else if (cmd.startsWith("AUTH PLAIN ")) {
      got.auth = Buffer.from(line.slice(11), "base64").toString();
      write(mode === "badauth" ? "535 5.7.8 Username and Password not accepted" : "235 2.7.0 accepted");
    } else if (cmd.startsWith("MAIL FROM:")) {
      got.from = line;
      write("250 ok");
    } else if (cmd.startsWith("RCPT TO:")) {
      got.to = line;
      write(mode === "badrcpt" ? "550 5.1.1 no such user" : "250 ok");
    } else if (cmd === "DATA") {
      inData = true;
      write("354 go");
    } else if (cmd === "QUIT") {
      write("221 bye");
      sock.end();
    } else write("500 unknown");
  };
  function onData(d) {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      handle(line);
    }
  }
  raw.on("data", onData);
  raw.on("error", report);
  raw.on("close", report);
  write("220 fake ESMTP");
});
server.listen(0, "127.0.0.1", () => console.log(`PORT ${server.address().port}`));
setTimeout(() => process.exit(0), 15000);
