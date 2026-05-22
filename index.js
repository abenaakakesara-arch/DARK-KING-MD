const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const readline = require("readline")
const config = require("./config")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("./session")

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    version
  })

  if (!sock.authState.creds.registered) {

    rl.question("📱 Enter Your WhatsApp Number : ", async (number) => {

      const code = await sock.requestPairingCode(number)

      console.log(`
╔════════════════════╗
   DARK-KING-MD 🤖
╚════════════════════╝

🔑 PAIR CODE : ${code}

👑 OWNER : ${config.ownername}
⚡ DEVELOPED BY RUKSHAN
      `)

    })

  }

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {

    const { connection, lastDisconnect } = update

    if (connection === "close") {

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log("❌ Connection Closed")

      if (shouldReconnect) {
        startBot()
      }

    } else if (connection === "open") {

      console.log(`
╔════════════════════╗
   ${config.botname}
╚════════════════════╝

✅ BOT CONNECTED

👑 OWNER : ${config.ownername}

⚡ DEVELOPED BY RUKSHAN
      `)

    }

  })

  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0]

    if (!msg.message) return

    const from = msg.key.remoteJid

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    if (!body.startsWith(config.prefix)) return

    const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()

    if (command === "alive") {

      await sock.sendMessage(from, {
        text: `
🤖 ${config.botname}

✅ Bot Is Alive

👑 Owner : ${config.ownername}

⚡ Developed By Rukshan
        `
      })

    }

    if (command === "ping") {

      const speed = `${Math.floor(Math.random() * 100)} ms`

      await sock.sendMessage(from, {
        text: `🏓 Pong : ${speed}`
      })

    }

    if (command === "menu") {

      await sock.sendMessage(from, {
        text: `
╔══〔 ${config.botname} 〕══╗

.alive
.ping
.menu
.owner
.song
.video
.sticker

⚡ Developed By Rukshan

╚══════════════════╝
        `
      })

    }

    if (command === "owner") {

      await sock.sendMessage(from, {
        text: `
👑 OWNER DETAILS

Name : ${config.ownername}

Number : wa.me/${config.ownernumber}
        `
      })

    }

  })

}

startBot()
