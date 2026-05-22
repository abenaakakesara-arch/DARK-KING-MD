const {
default: makeWASocket,
useMultiFileAuthState,
downloadMediaMessage
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs-extra");
const { Sticker } = require("wa-sticker-formatter");

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

/* MESSAGES */

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0];

if (!msg.message) return;

const sender = msg.key.remoteJid;

const messageText =
msg.message.conversation ||
msg.message.extendedTextMessage?.text;

/* AUTO REPLY */

if (messageText?.toLowerCase() === "hi") {

await sock.sendMessage(sender, {
text: "👋 Hello Welcome To DARK-KING-MD"
});

}

/* STICKER COMMAND */

if (
messageText?.toLowerCase() === ".s" &&
msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
) {

try {

const quoted =
msg.message.extendedTextMessage.contextInfo;

const buffer = await downloadMediaMessage(
{
message: quoted.quotedMessage
},
"buffer",
{},
{
logger: P({ level: "silent" }),
reuploadRequest: sock.updateMediaMessage
}
);

const sticker = new Sticker(buffer, {
pack: "DARK-KING-MD",
author: "Rukshan",
type: "full"
});

const stickerBuffer = await sticker.toBuffer();

await sock.sendMessage(sender, {
sticker: stickerBuffer
});

} catch (err) {

console.log(err);

await sock.sendMessage(sender, {
text: "❌ Sticker Create Failed"
});

}

}

});

}

startBot();
