const fs = require("fs");
const path = require("path");
const config = require("../../config.json"); // ADMINBOT yahan se le raha hai

const LOCKS_FILE = path.join(__dirname, "..", "..", "locks.json");
const cooldown = new Map();

function loadLocks() {
  try {
    if (!fs.existsSync(LOCKS_FILE)) return { threads: {} };
    return JSON.parse(fs.readFileSync(LOCKS_FILE, "utf8") || "{}");
  } catch {
    return { threads: {} };
  }
}
function saveLocks(data) {
  fs.writeFileSync(LOCKS_FILE, JSON.stringify(data, null, 2));
}
function ensureThread(threadID) {
  const data = loadLocks();
  if (!data.threads[threadID]) {
    data.threads[threadID] = { gclock: { enabled: false, title: "" }, nicklock: { enabled: false, name: "" } };
    saveLocks(data);
  }
  return data.threads[threadID];
}

module.exports.config = {
  name: "nicklock",
  version: "1.1",
  hasPermission: 1,
  credits: "Anurag Mishra",
  description: "Lock nicknames for all members (admin only)",
  commandCategory: "group",
  usages: "[name/off]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  // ✅ Only ADMINBOT allowed
  if (event.senderID !== config.ADMINBOT) {
    return api.sendMessage("❌ Ye command sirf ADMINBOT ke liye hai.", event.threadID);
  }

  // ✅ Cooldown check
  const last = cooldown.get(event.senderID) || 0;
  if (Date.now() - last < 5000) {
    return api.sendMessage("⚠️ Bhai thoda ruk ja, cooldown chal raha hai (5s).", event.threadID);
  }
  cooldown.set(event.senderID, Date.now());

  const data = loadLocks();
  const tRec = ensureThread(event.threadID);

  if (!args[0]) {
    return api.sendMessage(
      `Nickname lock: ${tRec.nicklock.enabled ? `ON — "${tRec.nicklock.name}"` : "OFF"}`,
      event.threadID
    );
  }

  if (args[0].toLowerCase() === "off") {
    tRec.nicklock.enabled = false;
    tRec.nicklock.name = "";
    data.threads[event.threadID] = tRec;
    saveLocks(data);
    return api.sendMessage("✅ Nickname lock disabled.", event.threadID);
  }

  const name = args.join(" ");
  tRec.nicklock.enabled = true;
  tRec.nicklock.name = name;
  data.threads[event.threadID] = tRec;
  saveLocks(data);

  api.getThreadInfo(event.threadID, (err, info) => {
    if (err) return api.sendMessage("❌ Members list fetch nahi ho paayi.", event.threadID);

    info.participantIDs.forEach((id) => {
      if (id !== api.getCurrentUserID()) {
        api.changeNickname(name, event.threadID, id);
      }
    });

    api.sendMessage(`✅ Nickname locked to "${name}"`, event.threadID);
  });
};
