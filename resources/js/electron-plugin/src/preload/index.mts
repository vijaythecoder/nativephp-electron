import remote from "@electron/remote";
import {ipcRenderer, contextBridge} from "electron";

const Native = {
    on: (event, callback) => {
        ipcRenderer.on('native-event', (_, data) => {
            // Strip leading slashes
            event = event.replace(/^(\\)+/, '');
            data.event = data.event.replace(/^(\\)+/, '');

            if (event === data.event) {
                return callback(data.payload, event);
            }
        })
    },
    contextMenu: (template) => {
        let menu = remote.Menu.buildFromTemplate(template);
        menu.popup({ window: remote.getCurrentWindow() });
    }
};

// Expose Native and remote APIs using contextBridge
contextBridge.exposeInMainWorld('Native', Native);
contextBridge.exposeInMainWorld('remote', remote);

// Expose macOS permissions API using contextBridge
contextBridge.exposeInMainWorld('macPermissions', {
    /**
     * Check the current status of a permission
     * @param {string} permissionType - One of: camera, microphone, screen, documents, downloads
     * @returns {Promise<{success: boolean, permission: string, status?: string, error?: string}>}
     */
    checkPermission: async (permissionType: string) => {
        return await ipcRenderer.invoke('permissions:check', permissionType)
    },

    /**
     * Request a specific permission
     * @param {string} permissionType - One of: camera, microphone, screen, documents, downloads
     * @returns {Promise<{success: boolean, permission: string, status?: string, error?: string}>}
     */
    requestPermission: async (permissionType: string) => {
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
    },
    
    /**
     * Screen protection methods
     */
    screenProtection: {
        checkSupport: async () => {
            return await ipcRenderer.invoke('screen-protection:check-support');
        },
        
        set: async (enabled: boolean) => {
            return await ipcRenderer.invoke('screen-protection:set', enabled);
        },
        
        getStatus: async () => {
            return await ipcRenderer.invoke('screen-protection:get-status');
        },
    },
    
    /**
     * Overlay mode methods
     */
    overlayMode: {
        checkSupport: async () => {
            return await ipcRenderer.invoke('overlay-mode:check-support');
        },
        
        setAlwaysOnTop: async (flag: boolean, level?: string) => {
            return await ipcRenderer.invoke('overlay-mode:set-always-on-top', flag, level);
        },
        
        setOpacity: async (opacity: number) => {
            return await ipcRenderer.invoke('overlay-mode:set-opacity', opacity);
        },
        
        getOpacity: async () => {
            return await ipcRenderer.invoke('overlay-mode:get-opacity');
        },
        
        setBackgroundColor: async (color: string) => {
            return await ipcRenderer.invoke('overlay-mode:set-background-color', color);
        },
    },
});

// Expose audio loopback API to renderer process (for manual mode)
contextBridge.exposeInMainWorld('audioLoopback', {
    /**
     * Enable audio loopback capture
     * This will override the default getDisplayMedia behavior
     */
    enableLoopbackAudio: () => ipcRenderer.invoke('enable-loopback-audio'),
    
    /**
     * Disable audio loopback capture
     * This will restore full getDisplayMedia functionality
     */
    disableLoopbackAudio: () => ipcRenderer.invoke('disable-loopback-audio')
});

ipcRenderer.on('log', (event, {level, message, context}) => {
    if (level === 'error') {
      console.error(`[${level}] ${message}`, context)
    } else if (level === 'warn') {
      console.warn(`[${level}] ${message}`, context)
    } else {
      console.log(`[${level}] ${message}`, context)
    }
});

// Add Livewire event listeners
ipcRenderer.on('native-event', (event, data) => {

  // Strip leading slashes
  data.event = data.event.replace(/^(\\)+/, '');

  // add support for livewire 3
  // @ts-ignore
  if (window.Livewire) {
    // @ts-ignore
    window.Livewire.dispatch('native:' + data.event, data.payload);
  }

  // add support for livewire 2
  // @ts-ignore
  if (window.livewire) {
    // @ts-ignore
    window.livewire.components.components().forEach(component => {
      if (Array.isArray(component.listeners)) {
        component.listeners.forEach(event => {
          if (event.startsWith('native')) {
            let event_parts = event.split(/(native:|native-)|:|,/)

            if (event_parts[1] == 'native:') {
              event_parts.splice(2, 0, 'private', undefined, 'nativephp', undefined)
            }

            let [
              s1,
              signature,
              channel_type,
              s2,
              channel,
              s3,
              event_name,
            ] = event_parts

            if (data.event === event_name) {
              // @ts-ignore
              window.livewire.emit(event, data.payload)
            }
          }
        })
      }
    })
  }
})
