import { execFileSync } from "child_process";
import os from "os";


export function computeBackendCores() {
  const total = os.cpus().length;
  const half = Math.max(1, Math.floor(total / 2));
  return Array.from({ length: half }, (_, i) => i);
}

export function pinProcessToCore(pid, coreIndex) {
  return pinProcessToCores(pid, [coreIndex]);
}

export function pinProcessToCores(pid, coreIndexes) {
  try {
    let combinedMask = 0n;
    for (const coreIndex of coreIndexes) {
      combinedMask |= 1n << BigInt(coreIndex);
    }

    if (process.platform === "win32") {
      const mask = combinedMask.toString();
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `(Get-Process -Id ${pid}).ProcessorAffinity = [IntPtr]${mask}`,
        ],
        { stdio: "ignore" }
      );
    } else {
      execFileSync("taskset", ["-pc", coreIndexes.join(","), String(pid)], {
        stdio: "ignore",
      });
    }
  } catch (err) {
    console.error(
      `[CPU AFFINITY] Falha ao fixar worker ${pid} nos núcleos ${coreIndexes.join(",")}: ${err.message}`
    );
  }
}
