import {app} from 'electron'
import NativePHP from '#plugin'
import path from 'path'
import defaultIcon from '../../resources/icon.png?asset&asarUnpack'
import certificate from '../../resources/cacert.pem?asset&asarUnpack'
import { initializePermissions, cleanupPermissions } from './permissions.js'

let phpBinary = process.platform === 'win32' ? 'php.exe' : 'php';

phpBinary = path.join(import.meta.dirname, '../../resources/php', phpBinary).replace("app.asar", "app.asar.unpacked");

/**
 * Turn on the lights for the NativePHP app.
 */
NativePHP.bootstrap(
    app,
    defaultIcon,
    phpBinary,
    certificate
);

// Initialize macOS permissions handlers
app.whenReady().then(() => {
    console.log('App ready, initializing permissions...');
    initializePermissions();
});

// Cleanup on app exit
app.on('before-quit', () => {
    console.log('App quitting, cleaning up permissions...');
    cleanupPermissions();
});
