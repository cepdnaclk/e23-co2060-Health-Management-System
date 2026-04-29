const { spawn } = require("node:child_process");
const { join } = require("node:path");

const scriptName = process.argv[2];

if (!scriptName) {
  console.error("Usage: node ./scripts/run-script.js <script-name>");
  process.exit(1);
}

const scriptsDir = __dirname;
const isWindows = process.platform === "win32";
const command = isWindows ? "powershell" : "sh";
const args = isWindows
  ? ["-ExecutionPolicy", "Bypass", "-File", join(scriptsDir, `${scriptName}.ps1`)]
  : [join(scriptsDir, `${scriptName}.sh`)];

const child = spawn(command, args, { stdio: "inherit" });

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
