/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/
/************************************************************************/
var __webpack_exports__ = {};
/*!***********************!*\
  !*** ./src/worker.ts ***!
  \***********************/
__webpack_require__.r(__webpack_exports__);
const ctx = self;

// === WASM Protection Bypass ===
// WASM has time-limited protection keys valid near the download date.
// Offset Date.now() so WASM always thinks it's near that date.
// UPDATE THIS when re-downloading sim.wasm (run scripts/repull_graphing.js).
var WASM_DOWNLOAD_DATE = 1774224000000; // 2026-03-23T00:00:00Z
var _realDateNow = Date.now;
var _dateOffset = WASM_DOWNLOAD_DATE - _realDateNow();
if (true) { // PATCHED: always apply Date.now offset for WASM protection bypass
    Date.now = function() { return _realDateNow() + _dateOffset; };
    console.log('[WORKER] Date.now offset to WASM download date (delta=' + _dateOffset + 'ms)');
}

// Force browser to load fresh sim.wasm (not cached old version)
self.Module = {
    locateFile: function(path, scriptDirectory) {
        if (path.includes('.wasm')) {
            return scriptDirectory + path.split('?')[0] + '?v=' + _realDateNow();
        }
        return scriptDirectory + path;
    }
};

importScripts("sim.js?v=" + _realDateNow());
let emulatorRunning = false;
ctx.addEventListener("message", (event) => {
    if (!emulatorRunning) {
        // don't process any other commands until emulator is running
        return;
    }
    switch (event.data.command) {
        case 'setKiKo':
            const ki = event.data.ki;
            const ko = event.data.ko;
            const keycode = event.data.keycode || 0;
            const retKiKo = Module.ccall('setKiKo', 'number', ['number', 'number', 'number'], [ki, ko, keycode]);
            const queueLen = Module.ccall('getKiKoCount', 'number', [], []);
            ctx.postMessage({ command: 'keyPress', ki, ko, keycode, ret: retKiKo, queue: queueLen });
            break;
        case 'getVRAM':
            const vramBase64 = Module.ccall('getVRAM', 'string', ['number'], [true]);
            ctx.postMessage({ command: event.data.command, vram: vramBase64 });
            break;
        case 'getKeyQueueLength':
            const count = Module.ccall('getKiKoCount', 'number', [], []);
            ctx.postMessage({ command: event.data.command, length: count });
            break;
        case 'getKeyState':
            const keyState = Module.ccall('getKeyState', 'number', [], []);
            ctx.postMessage({ command: event.data.command, keyState: keyState });
            break;
        case 'getState':
            const state = Module.ccall('getState', 'string', [], []);
            ctx.postMessage({ command: event.data.command, state: state });
            break;
        case 'setState':
            Module.ccall('setState', null, ['string'], [event.data.state]);
            break;
        case 'toggleCursor':
            Module.ccall('toggleCursor');
            break;
        case 'flsCopyMove':
            const resultCopyMove = Module.ccall('flsCopyMove', 'number', ['string', 'string', 'string', 'number'], [event.data.srcFolder, event.data.destFolder, event.data.srcItems, event.data.move]);
            ctx.postMessage({ command: event.data.command, result: resultCopyMove, srcFolder: event.data.srcFolder, destFolder: event.data.destFolder, srcItems: event.data.srcItems, move: event.data.move });
            break;
        case 'flsDelete':
            const resultDel = Module.ccall('flsDelete', 'number', ['string'], [event.data.path]);
            ctx.postMessage({ command: event.data.command, result: resultDel, path: event.data.path });
            break;
        case 'flsDownload':
            const fdataBase64 = Module.ccall('flsDownload', 'string', ['string'], [event.data.path]);
            ctx.postMessage({ command: event.data.command, path: event.data.path, data: fdataBase64 });
            break;
        case 'flsMkdir':
            const resultMk = Module.ccall('flsMkdir', 'number', ['string'], [event.data.path]);
            ctx.postMessage({ command: event.data.command, result: resultMk, path: event.data.path });
            break;
        case 'flsReaddir':
            const dirJSON = Module.ccall('flsReaddir', 'string', ['string'], [event.data.path]);
            ctx.postMessage({ command: event.data.command, dirJSON: dirJSON });
            break;
        case 'flsRename':
            const resultRen = Module.ccall('flsRename', 'number', ['string', 'string'], [event.data.oldPath, event.data.newPath]);
            ctx.postMessage({ command: event.data.command, result: resultRen, oldPath: event.data.oldPath, newPath: event.data.newPath, entry: event.data.entry });
            break;
        case 'flsUpload':
            const bufferUp = new Uint8Array(event.data.buffer);
            const resultUp = Module.ccall('flsUpload', 'number', ['string', 'array', 'number'], [event.data.path, bufferUp, bufferUp.length]);
            ctx.postMessage({ command: event.data.command, result: resultUp, path: event.data.path });
            break;
        case 'testVRAM':
            console.log('worker::testVRAM');
            const testBase64 = Module.ccall('getVRAM', 'string', ['number'], [false]);
            ctx.postMessage({ command: event.data.command, vram: testBase64 });
            break;
        case 'testAnsData':
            console.log('worker::testAnsData');
            const ansData = Module.ccall('getAnsData', 'string', [], []);
            ctx.postMessage({ command: event.data.command, data: ansData });
            break;
        case 'testOtherData':
            console.log('worker::testOtherData');
            const otherData = Module.ccall('getOtherData', 'string', [], []);
            ctx.postMessage({ command: event.data.command, data: otherData });
            break;
        case 'testSetEndData':
            console.log('worker::testSetEndData');
            const flagData = event.data.flagData;
            const codeData = event.data.codeData;
            Module.ccall('setEndData', 'number', ['number', 'number'], [flagData, codeData]);
    }
});
Module['onRuntimeInitialized'] = function () {
    console.log('wasmInitialized');
    const version = Module.ccall('version', 'string');
    console.log('API ' + version);
    ctx.postMessage({ command: 'version', version: version });
    Module.ccall('setChecksumStatus', 'void', ['number'], [1]);
    Module.ccall('run', null, null, null, { async: true });
    emulatorRunning = true;
    ctx.postMessage({ command: 'emulatorRunning' });
};


/******/ })()
;