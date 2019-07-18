const firebase = require("@firebase/testing");
const fs = require("fs");
const assert = require("assert");

/*
 * ============
 *    Setup
 * ============
 */
const projectId = "firestore-emulator-example";
const coverageUrl = `http://localhost:8080/emulator/v1/projects/${projectId}:ruleCoverage.html`;

const rules = fs.readFileSync("firestore.rules", "utf8");

/**
 * Creates a new app with authentication data matching the input.
 *
 * @param {object} auth the object to use for authentication (typically {uid: some-uid})
 * @return {object} the app.
 */
function authedApp(auth) {
  return firebase.initializeTestApp({ projectId, auth }).firestore();
}

/*
 * ============
 *  Test Cases
 * ============
 */
beforeEach(async () => {
  // Clear the database between tests
  await firebase.clearFirestoreData({ projectId });
});

before(async () => {
  await firebase.loadFirestoreRules({ projectId, rules });
});

after(async () => {
  await Promise.all(firebase.apps().map(app => app.delete()));
  console.log(`View rule coverage information at ${coverageUrl}\n`);
});

describe("App", () => {
  it("require users to log in before creating a profile", async () => {
    const db = authedApp(null);
    const profile = db.collection("users").doc("alice");
    await firebase.assertFails(profile.set({ birthday: "January 1" }));
  });

  it("should only let users create their own profile", async () => {
    const db = authedApp({ uid: "alice" });
    await firebase.assertSucceeds(
      db
        .collection("users")
        .doc("alice")
        .set({
          birthday: "January 1",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
    );
    await firebase.assertFails(
      db
        .collection("users")
        .doc("bob")
        .set({
          birthday: "January 1",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
    );
  });

  it("should only let the user read their own data", async () => {
    // Unauthed user
    const db = authedApp(null);
    const profile = db.collection("users").doc("alice");
    await firebase.assertFails(profile.get());

    // Authed user, but not the right user
    const db2 = authedApp({ uid: "bob" });
    const profile2 = db2.collection("users").doc("alice");
    await firebase.assertFails(profile2.get());
  });

  it("should only let the user update their own data", async () => {
    // create data
    let db = authedApp({ uid: "alice" });
    let profile = db.collection("users").doc("alice");
    await firebase.assertSucceeds(profile.set({ myData: "isgreat" }));

    // get original
    db = authedApp({ uid: "alice" });
    profile = db.collection("users").doc("alice");
    let data = await profile.get();
    assert.equal(data.data().myData, "isgreat");

    // update
    db = authedApp({ uid: "alice" });
    profile = db.collection("users").doc("alice");
    await firebase.assertSucceeds(profile.set({ myData: "isgreat2" }));

    // get updated
    db = authedApp({ uid: "alice" });
    profile = db.collection("users").doc("alice");
    data = await profile.get();
    assert.equal(data.data().myData, "isgreat2");

    // Authed user, but not the right user
    db = authedApp({ uid: "bob" });
    profile = db.collection("users").doc("alice");
    await firebase.assertFails(profile.set({ myData: "isgreat3" }));
  });
});
