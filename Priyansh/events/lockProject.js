const fs = require("fs");
const path = require("path");
const LOCKS_FILE = path.join(__dirname, "locks.json");
const locks = fs.existsSync(LOCKS_FILE) ? JSON.parse(fs.readFileSync(LOCKS_FILE, "utf8")) : { threads: {} };

if (event.logMessageType === "log:thread-name") {
  const t = locks.threads[event.threadID];
  if (t?.gclock?.enabled) {
    api.setTitle(t.gclock.title, event.threadID);
    api.sendMessage(`🔒 Group name lock active — reverted to "${t.gclock.title}"`, event.threadID);
  }
}

if (event.logMessageType === "log:thread-nickname") {
  const t = locks.threads[event.threadID];
  if (t?.nicklock?.enabled) {
    const uid = event.logMessageData.participant_id;
    api.changeNickname(t.nicklock.name, uid, event.threadID);
    api.sendMessage(`🔒 Nickname lock active — reverted.`, event.threadID);
  }
}￼Enter
