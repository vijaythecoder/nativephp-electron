import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { getAppPath } from "../server/php.js";

export interface Extension {
    beforeReady?: (app: Electron.App) => void | Promise<void>;
    afterReady?: (app: Electron.App, mainWindow?: Electron.BrowserWindow) => void | Promise<void>;
    beforeQuit?: () => void | Promise<void>;
    ipcHandlers?: Record<string, (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any>;
    apiRoutes?: (router: any) => void;
}

export async function loadUserExtensions(): Promise<Extension[]> {
    const extensions: Extension[] = [];
    
    try {
        // Get the Laravel app path
        const appPath = getAppPath();
        
        // Load the extension file
        const extensionPath = path.join(appPath, 'resources/js/nativephp-extension.js');
        if (fs.existsSync(extensionPath)) {
            const ext = await import(pathToFileURL(extensionPath).href);
            if (ext.default) {
                extensions.push(ext.default);
            }
        }
    } catch (error) {
        console.error('[NativePHP] Error loading extension:', error);
    }
    
    return extensions;
}

// Convert file path to file URL for dynamic imports
function pathToFileURL(filePath: string): URL {
    if (process.platform === 'win32') {
        // Windows paths need special handling
        return new URL(`file:///${filePath.replace(/\\/g, '/')}`);
    }
    return new URL(`file://${filePath}`);
}