const {
default: makeWASocket,
useMultiFileAuthState
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

/* AUTO REPLY */

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0];

if (!msg.message) return;

const messageText =
msg.message.conversation ||
msg.message.extendedTextMessage?.text;

const sender = msg.key.remoteJid;

if (!messageText) return;

console.log("Message :", messageText);

/* REPLIES */

if (messageText.toLowerCase() === "hi") {

await sock.sendMessage(sender, {
text: "👋 Hello Welcome To DARK-KING-MD"
});

}

if (messageText.toLowerCase() === "menu") {

await sock.sendMessage(sender, {
text:
`🌟 DARK-KING-MD MENU 🌟

1️⃣ alive
2️⃣ owner
3️⃣ ping

Type Command`
});

}

if (messageText.toLowerCase() === "alive") {

await sock.sendMessage(sender, {
text: "✅ Bot Is Running Successfully"
});

}

});

}

startBot();
