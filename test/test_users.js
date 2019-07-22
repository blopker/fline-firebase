const firebase = require("@firebase/testing");
const assert = require("assert");
const { authedApp } = require("./util");

describe("App users", () => {
  it("require users to log in before creating a profile", async () => {
    const db = authedApp(null).firestore();
    const profile = db.collection("users").doc("alice");
    await firebase.assertFails(profile.set({ birthday: "January 1" }));
  });

  it("should only let users create their own profile", async () => {
    const db = authedApp({ uid: "alice" }).firestore();
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
    const db = authedApp(null).firestore();
    const profile = db.collection("users").doc("alice");
    await firebase.assertFails(profile.get());

    // Authed user, but not the right user
    const db2 = authedApp({ uid: "bob" }).firestore();
    const profile2 = db2.collection("users").doc("alice");
    await firebase.assertFails(profile2.get());
  });

  it("should only let the user update their own data", async () => {
    // create data
    let db = authedApp({ uid: "alice" }).firestore();
    let profile = db.collection("users").doc("alice");
    await firebase.assertSucceeds(profile.set({ myData: "isgreat" }));

    // get original
    db = authedApp({ uid: "alice" }).firestore();
    profile = db.collection("users").doc("alice");
    let data = await profile.get();
    assert.equal(data.data().myData, "isgreat");

    // update
    db = authedApp({ uid: "alice" }).firestore();
    profile = db.collection("users").doc("alice");
    await firebase.assertSucceeds(profile.set({ myData: "isgreat2" }));

    // get updated
    db = authedApp({ uid: "alice" }).firestore();
    profile = db.collection("users").doc("alice");
    data = await profile.get();
    assert.equal(data.data().myData, "isgreat2");

    // Authed user, but not the right user
    db = authedApp({ uid: "bob" }).firestore();
    profile = db.collection("users").doc("alice");
    await firebase.assertFails(profile.set({ myData: "isgreat3" }));
  });
});
