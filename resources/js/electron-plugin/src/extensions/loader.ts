import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

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
        // Check for single extension file
        const singleExtPath = path.join(process.cwd(), 'resources/js/nativephp-extension.js');
        if (fs.existsSync(singleExtPath)) {
            const ext = await import(pathToFileURL(singleExtPath).href);
            if (ext.default) {
                extensions.push(ext.default);
                console.log('[NativePHP] Loaded extension from:', singleExtPath);
            }
        }
        
        // Check for extensions directory
        const extensionsDir = path.join(process.cwd(), 'resources/js/nativephp-extensions');
        if (fs.existsSync(extensionsDir)) {
            const files = fs.readdirSync(extensionsDir);
            for (const file of files) {
                if (file.endsWith('.js') || file.endsWith('.mjs')) {
                    const extPath = path.join(extensionsDir, file);
                    const ext = await import(pathToFileURL(extPath).href);
                    if (ext.default) {
                        extensions.push(ext.default);
                        console.log('[NativePHP] Loaded extension from:', extPath);
                    }
                }
            }
        }
    } catch (error) {
        console.error('[NativePHP] Error loading extensions:', error);
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