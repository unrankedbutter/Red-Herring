/*
 * RED HERRING — cloud/local persistence and accounts.
 *
 * To use cloud mode, define window.RedHerringConfig = { firebase: { apiKey, authDomain,
 * projectId, appId } } before this file and load the Firebase compat v11 SDK tags
 * (firebase-app-compat.js, firebase-auth-compat.js, firebase-firestore-compat.js) first.
 * These config values are PUBLIC BY DESIGN in a browser app; protect player data with
 * Firebase Security Rules, not with secret keys. If config or SDK is missing, or init
 * fails, the game quietly falls back to a localStorage-only mode.
 */
(function () {
  "use strict";

  const config = (function () {
    try { return window.RedHerringConfig || {}; } catch (_) { return {}; }
  })();
  const firebaseConfig = (config.firebase && typeof config.firebase === "object") ? config.firebase : {};

  const ACCOUNTS_KEY = "red-herring:v1:accounts";
  const SESSION_KEY = "red-herring:v1:session";
  const DATA_PREFIX = "red-herring:v1:data:";
  const CLOUD_CACHE_PREFIX = "red-herring:v1:cloud:";
  const GUEST = "guest";
  const BLOCKED_KEYS = ["__proto__", "constructor", "prototype"];

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* private mode */ } }
  };

  function readJSON(key, fallback) {
    try {
      const raw = store.get(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  }

  function writeJSON(key, value) {
    try { store.set(key, JSON.stringify(value)); } catch (_) { /* private mode */ }
  }

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function defaultData() {
    return {
      fish: 0,
      fishCaught: 0,
      owned: ["classic", "classic-theme", "solid"],
      skin: "classic",
      theme: "classic-theme",
      pattern: "solid",
      themeV: 2,
      stats: { played: 0, wins: 0, streak: 0, best: 0, totalScore: 0, lastPlayed: null, lastWin: null },
      redeemed: [],
      sound: "on"
    };
  }

  // Guarantees every documented field exists, even when a save is old or corrupt.
  // Extra fields (for example name/photo written by updateProfile) are preserved.
  function mergeData(raw) {
    const base = defaultData();
    if (!isObject(raw)) return base;
    Object.keys(raw).forEach((key) => {
      if (key === "stats" || BLOCKED_KEYS.indexOf(key) >= 0) return;
      const value = raw[key];
      const isDefault = Object.prototype.hasOwnProperty.call(base, key);
      if (value === undefined || (value === null && isDefault)) return;
      base[key] = value;
    });
    if (isObject(raw.stats)) {
      Object.keys(base.stats).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(raw.stats, key)) return;
        const value = raw.stats[key];
        if (value === undefined || (value === null && typeof base.stats[key] === "number")) return;
        base.stats[key] = value;
      });
    }
    if (!Array.isArray(base.owned) || !base.owned.length) base.owned = defaultData().owned.slice();
    // Don't stamp legacy saves as migrated; app.js performs that one-time swap.
    if (raw.themeV == null) delete base.themeV;
    return base;
  }

  function cloneData(value) { return mergeData(value); }

  // Firebase reports Google as "google.com". Show a clean label in the UI.
  function normalizeProvider(value) {
    const p = String(value || "").toLowerCase();
    if (p.indexOf("google") >= 0) return "google";
    if (p.indexOf("password") >= 0) return "email";
    return p || "cloud";
  }

  function makeUser(fields) {
    const source = isObject(fields) ? fields : {};
    return {
      uid: source.uid == null ? "" : String(source.uid),
      name: source.name == null ? "" : String(source.name),
      email: source.email == null ? "" : String(source.email),
      photo: source.photo == null ? null : String(source.photo),
      provider: source.provider == null ? "" : normalizeProvider(source.provider)
    };
  }

  function cloneUser(user) { return user ? makeUser(user) : null; }

  function hashPassword(value) {
    // Simple non-crypto hash: NOT SECURE. Local fallback only — never use for real accounts.
    let hash = 0;
    const text = String(value || "");
    for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    return "h" + (hash >>> 0).toString(16);
  }

  function accounts() {
    const list = readJSON(ACCOUNTS_KEY, []);
    return Array.isArray(list) ? list.filter(isObject) : [];
  }

  function saveAccounts(list) { writeJSON(ACCOUNTS_KEY, list); }

  function findAccount(uid) {
    const id = String(uid || "");
    if (!id || id === GUEST) return null;
    return accounts().find((account) => String(account.uid || "") === id) || null;
  }

  function findAccountByEmail(email) {
    const wanted = String(email || "").trim().toLowerCase();
    if (!wanted) return null;
    return accounts().find((account) => String(account.email || "").toLowerCase() === wanted) || null;
  }

  function sessionUid() {
    const value = store.get(SESSION_KEY);
    return !value || value === GUEST ? GUEST : value;
  }

  function setSession(uid) { store.set(SESSION_KEY, uid || GUEST); }

  function dataKey(uid) { return DATA_PREFIX + (uid || GUEST); }
  function cloudCacheKey(uid) { return CLOUD_CACHE_PREFIX + uid; }

  function loadLocalData(uid) { return mergeData(readJSON(dataKey(uid), null)); }
  function saveLocalData(uid, value) { writeJSON(dataKey(uid), value); }
  function hasLocalData(uid) { return store.get(dataKey(uid)) !== null; }

  function userFromAccount(account) {
    return makeUser({
      uid: account.uid,
      name: account.name,
      email: account.email,
      photo: account.photo,
      provider: "password"
    });
  }

  function firebaseUserObject(user) {
    if (!user) return null;
    const first = Array.isArray(user.providerData) ? user.providerData[0] : null;
    return makeUser({
      uid: user.uid,
      name: user.displayName || (user.email ? String(user.email).split("@")[0] : ""),
      email: user.email,
      photo: user.photoURL,
      provider: first && first.providerId ? first.providerId : (user.email ? "password" : "")
    });
  }

  const authListeners = [];
  const dataListeners = [];
  const syncListeners = [];
  let syncState = { status: "idle", error: "", lastSync: 0 };
  let initialized = false;
  let resolveReady = null;
  const ready = new Promise((resolve) => { resolveReady = resolve; });

  let mode = "local";
  let currentUser = null;
  let data = defaultData();
  let auth = null;
  let db = null;
  let firebaseUser = null;
  let cloudAuthEpoch = 0;
  // Dev mode swaps in a memory-only copy of the save. Nothing is written to
  // storage while it is active; turning it off restores the original save.
  let devActive = false;
  let devSavedData = null;

  function safeCall(cb, value) {
    try { cb(value); } catch (err) { console.warn("Red Herring: listener error", err); }
  }

  function notifyAuth() {
    authListeners.slice().forEach((cb) => safeCall(cb, cloneUser(currentUser)));
  }

  function notifyData() {
    dataListeners.slice().forEach((cb) => safeCall(cb, cloneData(data)));
  }

  function getSyncState() { return Object.assign({}, syncState); }

  function setSyncState(patch) {
    syncState = Object.assign({}, syncState, patch);
    syncListeners.slice().forEach((cb) => safeCall(cb, getSyncState()));
  }

  function onSync(cb) {
    if (typeof cb !== "function") return function () {};
    syncListeners.push(cb);
    if (initialized) safeCall(cb, getSyncState());
    return function () {
      const i = syncListeners.indexOf(cb);
      if (i >= 0) syncListeners.splice(i, 1);
    };
  }

  function finishInit() {
    if (initialized) return;
    initialized = true;
    if (resolveReady) resolveReady();
    authListeners.slice().forEach((cb) => safeCall(cb, cloneUser(currentUser)));
    dataListeners.slice().forEach((cb) => safeCall(cb, cloneData(data)));
  }

  function onAuth(cb) {
    if (typeof cb !== "function") return function () {};
    authListeners.push(cb);
    if (initialized) safeCall(cb, cloneUser(currentUser));
    return function () {
      const i = authListeners.indexOf(cb);
      if (i >= 0) authListeners.splice(i, 1);
    };
  }

  function onData(cb) {
    if (typeof cb !== "function") return function () {};
    dataListeners.push(cb);
    if (initialized) safeCall(cb, cloneData(data));
    return function () {
      const i = dataListeners.indexOf(cb);
      if (i >= 0) dataListeners.splice(i, 1);
    };
  }

  function getData() { return cloneData(data); }

  function setData(next) {
    data = mergeData(next);
    notifyData();
    return cloneData(data);
  }

  function persistData() {
    if (devActive) return Promise.resolve();
    if (mode === "cloud" && currentUser) {
      const uid = currentUser.uid;
      const payload = cloneData(data);
      // Always keep a local copy so a failed/offline write never loses progress.
      writeJSON(cloudCacheKey(uid), payload);
      if (!db) return Promise.resolve();
      setSyncState({ status: "syncing" });
      return Promise.resolve()
        .then(() => db.collection("users").doc(uid).set(payload, { merge: true }))
        .then(() => {
          setSyncState({ status: "saved", error: "", lastSync: Date.now() });
        })
        .catch((err) => {
          const error = asError(err, "COULD NOT SAVE PLAYER DATA");
          setSyncState({ status: "error", error: error.message });
          console.warn("Red Herring: cloud save failed", error);
        });
    }
    saveLocalData(mode === "cloud" ? GUEST : sessionUid(), data);
    return Promise.resolve();
  }

  function persistDataAsync() {
    if (devActive) return Promise.resolve();
    if (mode !== "cloud" || !currentUser || !db) {
      persistData();
      return Promise.resolve();
    }
    const uid = currentUser.uid;
    const payload = cloneData(data);
    writeJSON(cloudCacheKey(uid), payload);
    setSyncState({ status: "syncing" });
    return Promise.resolve()
      .then(() => db.collection("users").doc(uid).set(payload, { merge: true }))
      .then(() => { setSyncState({ status: "saved", error: "", lastSync: Date.now() }); })
      .catch((err) => {
        const error = asError(err, "COULD NOT SAVE PLAYER DATA");
        setSyncState({ status: "error", error: error.message });
        throw error;
      });
  }

  // Force a fresh read of the signed-in player's cloud document. Used after
  // sign-in and by the SYNC NOW button so a device always picks up the latest
  // saved progress instead of trusting a stale local cache.
  function refreshCloud() {
    if (devActive || mode !== "cloud" || !db) {
      return Promise.resolve(getSyncState());
    }
    const uid = (currentUser && currentUser.uid) || (firebaseUser && firebaseUser.uid);
    if (!uid) return Promise.resolve(getSyncState());
    setSyncState({ status: "syncing" });
    return Promise.resolve()
      .then(() => db.collection("users").doc(uid).get())
      .then((snap) => {
        const docData = snap && snap.exists && typeof snap.data === "function" ? snap.data() : null;
        const cached = readJSON(cloudCacheKey(uid), null);
        const carry = cloneData(data);
        const hasCloud = !!docData || isObject(cached);
        const next = mergeData(Object.assign(
          {}, hasCloud ? {} : carry,
          isObject(cached) ? cached : {}, isObject(docData) ? docData : {}));
        setData(next);
        writeJSON(cloudCacheKey(uid), next);
        setSyncState({ status: "saved", error: "", lastSync: Date.now() });
        return cloneData(data);
      })
      .catch((err) => {
        const error = asError(err, "COULD NOT LOAD PLAYER DATA");
        setSyncState({ status: "error", error: error.message });
        throw error;
      });
  }

  // Shallow merge for top-level fields; stats gets one extra level of merging so
  // partial stat patches cannot erase unrelated counters.
  function applyPatch(patch, persist) {
    const source = isObject(patch) ? patch : {};
    const next = Object.assign({}, data);
    Object.keys(source).forEach((key) => {
      if (BLOCKED_KEYS.indexOf(key) >= 0) return;
      if (key === "stats" && isObject(source.stats) && isObject(next.stats)) {
        next.stats = Object.assign({}, next.stats, source.stats);
      } else {
        next[key] = source[key];
      }
    });
    data = mergeData(next);
    notifyData();
    if (persist !== false) persistData();
    return cloneData(data);
  }

  function updateData(patch) { return applyPatch(patch, true); }

  function asError(err, fallback) {
    if (err && typeof err.message === "string" && err.message) {
      return err instanceof Error ? err : new Error(err.message);
    }
    return new Error((err === undefined || err === null ? fallback || "FIREBASE ERROR" : String(err)));
  }

  function configured() {
    return ["apiKey", "authDomain", "projectId", "appId"].every((key) =>
      typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim() !== "");
  }

  function hasFirebaseSdk() {
    const sdk = window.firebase;
    return !!sdk && Array.isArray(sdk.apps) && typeof sdk.initializeApp === "function" &&
      typeof sdk.auth === "function" && typeof sdk.firestore === "function";
  }

  function initCloud() {
    if (!configured() || !hasFirebaseSdk()) return false;
    try {
      if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
      auth = window.firebase.auth();
      db = window.firebase.firestore();
      if (!auth || !db || typeof auth.onAuthStateChanged !== "function" ||
          typeof auth.createUserWithEmailAndPassword !== "function" ||
          typeof auth.signInWithEmailAndPassword !== "function" ||
          typeof auth.signInWithPopup !== "function" || typeof auth.signOut !== "function" ||
          typeof db.collection !== "function") return false;
      mode = "cloud";
      api.mode = "cloud";
      auth.onAuthStateChanged(onCloudAuth, (err) => {
        console.warn("Red Herring: auth state error", asError(err));
      });
      return true;
    } catch (err) {
      console.warn("Red Herring: Firebase init failed, using local mode", asError(err));
      auth = null;
      db = null;
      firebaseUser = null;
      mode = "local";
      api.mode = "local";
      return false;
    }
  }

  function initLocal() {
    mode = "local";
    api.mode = "local";
    auth = null;
    db = null;
    firebaseUser = null;
    setSyncState({ status: "local", error: "", lastSync: 0 });
    const uid = sessionUid();
    const account = findAccount(uid);
    currentUser = account ? userFromAccount(account) : null;
    if (!account && uid !== GUEST) setSession(GUEST);
    data = loadLocalData(account ? uid : GUEST);
    finishInit();
  }

  function onCloudAuth(user) {
    if (mode !== "cloud") return;
    const epoch = ++cloudAuthEpoch;
    handleCloudAuth(user, epoch).catch((err) => {
      console.warn("Red Herring: cloud auth update failed", asError(err));
    });
  }

  // Compat equivalent of setDoc(..., { merge: true }) is docRef.set(..., { merge: true }).
  // We use .get() only — no Firestore snapshot subscription, so writes cannot loop.
  async function handleCloudAuth(user, epoch) {
    if (epoch !== cloudAuthEpoch || mode !== "cloud") return;
    const carryOver = cloneData(data);
    firebaseUser = user || null;
    currentUser = cloneUser(firebaseUserObject(user));
    notifyAuth();
    try {
      if (user && db) {
        const ref = db.collection("users").doc(user.uid);
        let snap = null;
        try { snap = await ref.get(); }
        catch (err) { throw asError(err, "COULD NOT LOAD PLAYER DATA"); }
        const exists = !!(snap && snap.exists);
        const docData = exists && typeof snap.data === "function" ? snap.data() : null;
        const cached = readJSON(cloudCacheKey(user.uid), null);
        const hasCloudData = exists || isObject(cached);
        // First-time cloud accounts keep the progress earned as a guest.
        const next = mergeData(Object.assign(
          {}, hasCloudData ? {} : carryOver,
          isObject(cached) ? cached : {}, isObject(docData) ? docData : {}));
        setData(next);
        if (!devActive) writeJSON(cloudCacheKey(user.uid), next);
        let created = true;
        if (!exists && !devActive) {
          try { await ref.set(next, { merge: true }); }
          catch (err) {
            created = false;
            setSyncState({ status: "error", error: asError(err, "COULD NOT CREATE PLAYER DATA").message });
          }
        }
        if (created) setSyncState({ status: "saved", error: "", lastSync: Date.now() });
      } else {
        setData(loadLocalData(GUEST));
        setSyncState({ status: "idle", error: "", lastSync: 0 });
      }
    } catch (err) {
      const error = asError(err, "COULD NOT LOAD PLAYER DATA");
      console.warn("Red Herring: cloud data load failed", error);
      setData(user ? mergeData(readJSON(cloudCacheKey(user.uid), null)) : loadLocalData(GUEST));
      setSyncState({ status: "error", error: error.message });
    }
    if (epoch === cloudAuthEpoch && mode === "cloud") finishInit();
  }

  function localSignUp(email, password, name) {
    return Promise.resolve().then(() => {
      const address = String(email || "").trim();
      const secret = String(password || "");
      const displayName = String(name || "").trim();
      if (!displayName) throw new Error("NAME IS REQUIRED");
      if (!address) throw new Error("EMAIL IS REQUIRED");
      if (!secret) throw new Error("PASSWORD IS REQUIRED");
      if (findAccountByEmail(address)) throw new Error("AN ACCOUNT WITH THAT EMAIL ALREADY EXISTS");
      const account = {
        uid: "local-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
        email: address,
        passwordHash: hashPassword(secret),
        name: displayName,
        photo: null
      };
      const list = accounts();
      list.push(account);
      saveAccounts(list);
      const isNew = !hasLocalData(account.uid);
      setSession(account.uid);
      currentUser = userFromAccount(account);
      // A brand-new account inherits the guest's fish, stats and unlocks
      // instead of starting from an empty save.
      data = isNew ? loadLocalData(GUEST) : loadLocalData(account.uid);
      if (isNew && !devActive) saveLocalData(account.uid, data);
      notifyAuth();
      notifyData();
      return cloneUser(currentUser);
    });
  }

  function localSignIn(email, password) {
    return Promise.resolve().then(() => {
      const address = String(email || "").trim();
      const secret = String(password || "");
      if (!address || !secret) throw new Error("EMAIL AND PASSWORD ARE REQUIRED");
      const account = findAccountByEmail(address);
      if (!account || account.passwordHash !== hashPassword(secret)) {
        throw new Error("INVALID EMAIL OR PASSWORD");
      }
      setSession(account.uid);
      currentUser = userFromAccount(account);
      data = loadLocalData(account.uid);
      notifyAuth();
      notifyData();
      return cloneUser(currentUser);
    });
  }

  function localSignOut() {
    setSession(GUEST);
    currentUser = null;
    data = loadLocalData(GUEST);
    notifyAuth();
    notifyData();
    return Promise.resolve();
  }

  function localUpdateProfile(patch) {
    return Promise.resolve().then(() => {
      const source = isObject(patch) ? patch : {};
      const uid = sessionUid();
      const list = accounts();
      const index = list.findIndex((account) => String(account.uid || "") === uid);
      if (index >= 0) {
        const account = Object.assign({}, list[index]);
        if (source.name !== undefined) account.name = String(source.name || "");
        if (source.photo !== undefined) account.photo = source.photo ? String(source.photo) : null;
        list[index] = account;
        saveAccounts(list);
        currentUser = userFromAccount(account);
      } else if (currentUser) {
        const next = cloneUser(currentUser);
        if (source.name !== undefined) next.name = String(source.name || "");
        if (source.photo !== undefined) next.photo = source.photo ? String(source.photo) : null;
        currentUser = next;
      }
      notifyAuth();
    });
  }

  function cloudSignUp(email, password, name) {
    const displayName = String(name || "");
    return Promise.resolve()
      .then(() => auth.createUserWithEmailAndPassword(String(email || ""), String(password || "")))
      .then((credential) => {
        const user = credential && credential.user;
        if (!user) throw new Error("SIGN UP FAILED");
        firebaseUser = user;
        return Promise.resolve(user.updateProfile({ displayName: displayName, photoURL: null }))
          .then(() => {
            currentUser = cloneUser(firebaseUserObject(user));
            notifyAuth();
            applyPatch({ name: displayName, photo: null }, false);
            return persistDataAsync();
          })
          .then(() => cloneUser(currentUser));
      })
      .catch((err) => Promise.reject(asError(err)));
  }

  function cloudSignIn(email, password) {
    return Promise.resolve()
      .then(() => auth.signInWithEmailAndPassword(String(email || ""), String(password || "")))
      .then((credential) => {
        const user = credential && credential.user;
        if (!user) throw new Error("SIGN IN FAILED");
        firebaseUser = user;
        // Set the user now so an immediate refreshCloud() after sign-in has a uid.
        currentUser = cloneUser(firebaseUserObject(user));
        notifyAuth();
        return cloneUser(currentUser);
      })
      .catch((err) => Promise.reject(asError(err)));
  }

  function cloudSignInWithGoogle() {
    return Promise.resolve()
      .then(() => {
        const sdk = window.firebase;
        if (!sdk || !sdk.auth || typeof sdk.auth.GoogleAuthProvider !== "function") {
          throw new Error("GOOGLE SIGN-IN IS NOT AVAILABLE");
        }
        return auth.signInWithPopup(new sdk.auth.GoogleAuthProvider());
      })
      .then((credential) => {
        const user = credential && credential.user;
        if (!user) throw new Error("GOOGLE SIGN-IN FAILED");
        firebaseUser = user;
        currentUser = cloneUser(firebaseUserObject(user));
        notifyAuth();
        return cloneUser(currentUser);
      })
      .catch((err) => Promise.reject(asError(err)));
  }

  function cloudSignOut() {
    return Promise.resolve()
      .then(() => auth.signOut())
      .catch((err) => Promise.reject(asError(err)));
  }

  function cloudUpdateProfile(patch) {
    const source = isObject(patch) ? patch : {};
    const fbPatch = {};
    const dataPatch = {};
    if (source.name !== undefined) {
      fbPatch.displayName = String(source.name || "");
      dataPatch.name = fbPatch.displayName;
    }
    if (source.photo !== undefined) {
      fbPatch.photoURL = source.photo ? String(source.photo) : null;
      dataPatch.photo = fbPatch.photoURL;
    }
    return Promise.resolve()
      .then(() => (firebaseUser && Object.keys(fbPatch).length) ?
        Promise.resolve(firebaseUser.updateProfile(fbPatch)) : null)
      .then(() => {
        if (Object.keys(dataPatch).length) applyPatch(dataPatch, false);
        if (firebaseUser) {
          currentUser = cloneUser(firebaseUserObject(firebaseUser));
          notifyAuth();
        }
        return persistDataAsync();
      })
      .catch((err) => Promise.reject(asError(err, "COULD NOT UPDATE PROFILE")));
  }

  function devStart() {
    if (devActive) return;
    devSavedData = cloneData(data);
    devActive = true;
  }

  function devStop() {
    if (!devActive) return;
    devActive = false;
    data = devSavedData || defaultData();
    devSavedData = null;
    notifyData();
  }

  function devIsActive() { return devActive; }

  const api = {
    mode: "local",
    ready: ready,
    onAuth: onAuth,
    onData: onData,
    auth: {
      currentUser() { return cloneUser(currentUser); },
      signUp(email, password, name) {
        return mode === "cloud" ? cloudSignUp(email, password, name) : localSignUp(email, password, name);
      },
      signIn(email, password) {
        return mode === "cloud" ? cloudSignIn(email, password) : localSignIn(email, password);
      },
      signInWithGoogle() {
        if (mode !== "cloud") {
          return Promise.reject(new Error("GOOGLE SIGN-IN NEEDS FIREBASE CONFIG"));
        }
        return cloudSignInWithGoogle();
      },
      signOut() { return mode === "cloud" ? cloudSignOut() : localSignOut(); },
      updateProfile(patch) {
        return mode === "cloud" ? cloudUpdateProfile(patch) : localUpdateProfile(patch);
      }
    },
    getData: getData,
    updateData: updateData,
    onSync: onSync,
    getSyncState: getSyncState,
    refreshCloud: refreshCloud,
    dev: { start: devStart, stop: devStop, active: devIsActive }
  };

  window.RedHerringBackend = api;

  try {
    if (!initCloud()) initLocal();
  } catch (err) {
    console.warn("Red Herring: backend init failed, using local mode", asError(err));
    initLocal();
  }
})();
