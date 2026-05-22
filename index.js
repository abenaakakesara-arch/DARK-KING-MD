const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState("session");

const sock = makeWASocket({
logger: P({ level: "silent" }),
auth: state
});

sock.ev.on("connection.update", (update) => {

const { connection, qr } = update;

if (qr) {
qrcode.generate(qr, { small: true });
}

if (connection === "open") {
console.log("✅ DARK-KING-MD Connected");
}
});

sock.ev.on("creds.update", saveCreds);
}

startBot();
