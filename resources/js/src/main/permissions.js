import { ipcMain } from 'electron';
import permissions from 'node-mac-permissions';

/**
 * Available permission types for macOS
 */
const PERMISSION_TYPES = {
    camera: 'camera',       // camera access
    microphone: 'microphone', // microphone access
    screen: 'screen',       // screen capture
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

            const status = permissions.getAuthorizationStatus(permissionType);
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

            const status = await permissions.askForPermission(permissionType);
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
                    allPermissions[key] = permissions.getAuthorizationStatus(permissionType);
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
    
    console.log('macOS permissions handlers cleaned up');
}

/**
 * Export permission types for reference
 */
export { PERMISSION_TYPES };
