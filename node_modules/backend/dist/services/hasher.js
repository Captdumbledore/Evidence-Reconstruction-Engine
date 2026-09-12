"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashBuffer = hashBuffer;
exports.hashString = hashString;
const crypto_1 = require("crypto");
/**
 * Compute SHA-256 hash of a buffer.
 * Returns the hex digest string.
 */
function hashBuffer(buf) {
    return (0, crypto_1.createHash)('sha256').update(buf).digest('hex');
}
/**
 * Compute SHA-256 hash of a string.
 */
function hashString(content) {
    return (0, crypto_1.createHash)('sha256').update(content, 'utf8').digest('hex');
}
