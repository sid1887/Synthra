export function log(level, requestId, message, meta = {}) {
  const line = {
    ts: new Date().toISOString(),
    level,
    requestId,
    message,
    ...meta
  };
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

export function logInfo(requestId, message, meta = {}) {
  log("info", requestId, message, meta);
}

export function logError(requestId, message, meta = {}) {
  log("error", requestId, message, meta);
}
