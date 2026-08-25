// compat/no-local-store.ts
var idbListSearches = async () => [];
var idbGetUserPrefs = async () => ({});
var idbSetUserPrefs = async (_prefs) => {
};
var idbAddNotification = async (_value) => {
};

export {
  idbListSearches,
  idbGetUserPrefs,
  idbSetUserPrefs,
  idbAddNotification
};
