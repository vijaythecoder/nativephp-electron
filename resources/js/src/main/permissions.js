import { ipcMain } from 'electron';
import permissions from 'node-mac-permissions';

/**
 * Available permission types for macOS
 * 
 * Note: Screen capture permission works differently than others:
 * - First request shows a system modal
 * - Subsequent requests can open System Preferences
 * - Use 'permissions:request-screen-capture' for more control
 */
const PERMISSION_TYPES = {
    camera: 'camera',       // camera access
    microphone: 'microphone', // microphone access
    screen: 'screen',       // screen capture (screen recording)
    documents: 'documents', // documents folder
    downloads: 'downloads'  // downloads folder
}

/**
 * Initialize permissions IPC handlers
 */
export function initializePermissions() {
    console.log('Initializing macOS permissions handlers...')

    // Handle permission status checks
    ipcMain.handle('permissions:check', async (event, permissionType) => {
        try {
            console.log(`Checking permission for: ${permissionType}`);
            
            if (!PERMISSION_TYPES[permissionType]) {
                return {
                    success: false,
                    permission: permissionType,
                    error: `Invalid permission type: ${permissionType}`
                };
            }

            const status = permissions.getAuthStatus(permissionType);
            console.log(`Permission status for ${permissionType}: ${status}`);
            
            return {
                success: true,
                permission: permissionType,
                status: status
            };
        } catch (error) {
            console.error(`Error checking permission for ${permissionType}:`, error);
            return {
                success: false,
                permission: permissionType,
                error: error.message
            };
        }
    });

    // Handle permission requests
    ipcMain.handle('permissions:request', async (event, permissionType) => {
        try {
            console.log(`Requesting permission for: ${permissionType}`);
            
            if (!PERMISSION_TYPES[permissionType]) {
                return {
                    success: false,
                    permission: permissionType,
                    error: `Invalid permission type: ${permissionType}`
                };
            }

            let status;
            
            // Use the appropriate method based on permission type
            switch (permissionType) {
                case 'camera':
                    status = await permissions.askForCameraAccess();
                    break;
                case 'microphone':
                    status = await permissions.askForMicrophoneAccess();
                    break;
                case 'screen':
                    // For screen capture, we don't get a status back
                    // The method opens system preferences if needed
                    permissions.askForScreenCaptureAccess();
                    // Check the current status after requesting
                    status = permissions.getAuthStatus('screen');
                    break;
                case 'documents':
                    status = await permissions.askForFoldersAccess('documents');
                    break;
                case 'downloads':
                    status = await permissions.askForFoldersAccess('downloads');
                    break;
                default:
                    return {
                        success: false,
                        permission: permissionType,
                        error: `Unsupported permission type: ${permissionType}`
                    };
            }
            
            console.log(`Permission request result for ${permissionType}: ${status}`);
            
            return {
                success: true,
                permission: permissionType,
                status: status
            };
        } catch (error) {
            console.error(`Error requesting permission for ${permissionType}:`, error);
            return {
                success: false,
                permission: permissionType,
                error: error.message
            };
        }
    });

    // Handle getting all permissions status
    ipcMain.handle('permissions:get-all', async (event) => {
        try {
            console.log('Getting all permissions status...');
            
            const allPermissions = {};
            
            for (const [key, permissionType] of Object.entries(PERMISSION_TYPES)) {
                try {
                    allPermissions[key] = permissions.getAuthStatus(permissionType);
                } catch (error) {
                    console.error(`Error getting status for ${permissionType}:`, error);
                    allPermissions[key] = 'error';
                }
            }
            
            return {
                success: true,
                permissions: allPermissions
            };
        } catch (error) {
            console.error('Error getting all permissions:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    // Handle screen capture permission request with optional preferences opening
    ipcMain.handle('permissions:request-screen-capture', async (event, openPreferences = false) => {
        try {
            console.log(`Requesting screen capture permission, openPreferences: ${openPreferences}`);
            
            // Check current status first
            const currentStatus = permissions.getAuthStatus('screen');
            
            if (currentStatus === 'authorized') {
                return {
                    success: true,
                    permission: 'screen',
                    status: 'authorized'
                };
            }
            
            // Request access - this will show a modal on first request
            // or open System Preferences if openPreferences is true
            permissions.askForScreenCaptureAccess(openPreferences);
            
            // Check status again after request
            const newStatus = permissions.getAuthStatus('screen');
            
            return {
                success: true,
                permission: 'screen',
                status: newStatus
            };
        } catch (error) {
            console.error('Error requesting screen capture permission:', error);
            return {
                success: false,
                permission: 'screen',
                error: error.message
            };
        }
    });

    console.log('macOS permissions handlers initialized successfully');
}

/**
 * Cleanup permissions handlers
 */
export function cleanupPermissions() {
    console.log('Cleaning up macOS permissions handlers...');
    
    // Remove IPC handlers
    ipcMain.removeHandler('permissions:check');
    ipcMain.removeHandler('permissions:request');
    ipcMain.removeHandler('permissions:get-all');
    ipcMain.removeHandler('permissions:request-screen-capture');
    
    console.log('macOS permissions handlers cleaned up');
}

/**
 * Export permission types for reference
 */
export { PERMISSION_TYPES };