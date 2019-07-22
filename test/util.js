const firebase = require("@firebase/testing");
const fs = require("fs");
/*
 * ============
 *    Setup
 * ============
 */
const projectId = "firestore-emulator-example";
const rules = fs.readFileSync("firestore.rules", "utf8");

/**
 * Creates a new app with authentication data matching the input.
 *
 * @param {object} auth the object to use for authentication (typically {uid: some-uid})
 * @return {object} the app.
 */
function authedApp(auth) {
  return firebase.initializeTestApp({ projectId, auth });
}

exports.authedApp = authedApp;
exports.projectId = projectId;
exports.rules = rules;
