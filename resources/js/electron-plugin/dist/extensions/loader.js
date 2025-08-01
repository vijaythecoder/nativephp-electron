var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fs from "fs";
import * as path from "path";
import { getAppPath } from "../server/php.js";
export function loadUserExtensions() {
    return __awaiter(this, void 0, void 0, function* () {
        const extensions = [];
        try {
            const appPath = getAppPath();
            const extensionPath = path.join(appPath, 'resources/js/nativephp-extension.js');
            if (fs.existsSync(extensionPath)) {
                const ext = yield import(pathToFileURL(extensionPath).href);
                if (ext.default) {
                    extensions.push(ext.default);
                }
            }
        }
        catch (error) {
            console.error('[NativePHP] Error loading extension:', error);
        }
        return extensions;
    });
}
function pathToFileURL(filePath) {
    if (process.platform === 'win32') {
        return new URL(`file:///${filePath.replace(/\\/g, '/')}`);
    }
    return new URL(`file://${filePath}`);
}
