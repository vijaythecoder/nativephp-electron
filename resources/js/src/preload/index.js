import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import * as remote from '@electron/remote/index.js'

window.electron = electronAPI
window.remote = remote;

// Expose macOS permissions API to renderer process
contextBridge.exposeInMainWorld('macPermissions', {
    /**
     * Check the current status of a permission
     * @param {string} permissionType - One of: camera, microphone, screen, documents, downloads
     * @returns {Promise<{success: boolean, permission: string, status?: string, error?: string}>}
     */
    checkPermission: async (permissionType) => {
        return await ipcRenderer.invoke('permissions:check', permissionType)
    },

    /**
     * Request a specific permission
     * @param {string} permissionType - One of: camera, microphone, screen, documents, downloads
     * @returns {Promise<{success: boolean, permission: string, status?: string, error?: string}>}
     */
    requestPermission: async (permissionType) => {
        return await ipcRenderer.invoke('permissions:request', permissionType)
    },

    /**
     * Get status of all supported permissions
     * @returns {Promise<{success: boolean, permissions?: object, error?: string}>}
     */
    getAllPermissions: async () => {
        return await ipcRenderer.invoke('permissions:get-all')
    },

    /**
     * Available permission types
     */
    PERMISSION_TYPES: {
        CAMERA: 'camera',
        MICROPHONE: 'microphone',
        SCREEN: 'screen',
        DOCUMENTS: 'documents',
        DOWNLOADS: 'downloads'
    },

    /**
     * Permission status values
     */
    PERMISSION_STATUS: {
        NOT_DETERMINED: 'not determined',
        DENIED: 'denied',
        AUTHORIZED: 'authorized',
        RESTRICTED: 'restricted',
        LIMITED: 'limited'
    }
});
