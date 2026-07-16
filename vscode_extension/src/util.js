// util.js — pure-Node shared utilities. Must NOT require('vscode')
// anywhere, so every module can use it — including the independently-
// requireable pure-Node ones (validator.js, mtlxNode.js, nodeSignature.js,
// specDocs.js, docScanner.js), which each enforce the same no-vscode rule
// for their own reasons (see their file banners).
'use strict';

// Safe error-message extraction: some rejects/throws (esp. from non-Error
// values) have no .message, so this is the one idiom used at every catch
// site across the extension that needs a display string for `e`.
function errMsg(e) {
    return e && e.message ? e.message : String(e);
}

// Escapes a literal string for safe interpolation into a `new RegExp(...)`
// pattern (regex metacharacters get a preceding backslash).
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { errMsg, escapeRegExp };
