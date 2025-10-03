// Stub auditLog function for auth middleware
async function auditLog(userId, action, details) {
  // no-op or log to console for development
  return { userId, action, details };
}

module.exports = { auditLog };
