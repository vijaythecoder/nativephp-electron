var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import remote from "@electron/remote";
import { ipcRenderer, contextBridge } from "electron";
const Native = {
    on: (event, callback) => {
        ipcRenderer.on('native-event', (_, data) => {
            event = event.replace(/^(\\)+/, '');
            data.event = data.event.replace(/^(\\)+/, '');
            if (event === data.event) {
                return callback(data.payload, event);
            }
        });
    },
    contextMenu: (template) => {
        let menu = remote.Menu.buildFromTemplate(template);
        menu.popup({ window: remote.getCurrentWindow() });
    }
};
contextBridge.exposeInMainWorld('Native', Native);
contextBridge.exposeInMainWorld('remote', remote);
contextBridge.exposeInMainWorld('macPermissions', {
    checkPermission: (permissionType) => __awaiter(void 0, void 0, void 0, function* () {
        return yield ipcRenderer.invoke('permissions:check', permissionType);
    }),
    requestPermission: (permissionType) => __awaiter(void 0, void 0, void 0, function* () {
        return yield ipcRenderer.invoke('permissions:request', permissionType);
    }),
    getAllPermissions: () => __awaiter(void 0, void 0, void 0, function* () {
        return yield ipcRenderer.invoke('permissions:get-all');
    }),
    PERMISSION_TYPES: {
        CAMERA: 'camera',
        MICROPHONE: 'microphone',
        SCREEN: 'screen',
        DOCUMENTS: 'documents',
        DOWNLOADS: 'downloads'
    },
    PERMISSION_STATUS: {
        NOT_DETERMINED: 'not determined',
        DENIED: 'denied',
        AUTHORIZED: 'authorized',
        RESTRICTED: 'restricted',
        LIMITED: 'limited'
    },
    screenProtection: {
        checkSupport: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield ipcRenderer.invoke('screen-protection:check-support');
        }),
        set: (enabled) => __awaiter(void 0, void 0, void 0, function* () {
            return yield ipcRenderer.invoke('screen-protection:set', enabled);
        }),
        getStatus: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield ipcRenderer.invoke('screen-protection:get-status');
        }),
    },
    overlayMode: {
        checkSupport: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield ipcRenderer.invoke('overlay-mode:check-support');
        }),
        setAlwaysOnTop: (flag, level) => __awaiter(void 0, void 0, void 0, function* () {
            return yield ipcRenderer.invoke('overlay-mode:set-always-on-top', flag, level);
        }),
        setOpacity: (opacity) => __awaiter(void 0, void 0, void 0, function* () {
            return yield ipcRenderer.invoke('overlay-mode:set-opacity', opacity);
        }),
        getOpacity: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield ipcRenderer.invoke('overlay-mode:get-opacity');
        }),
        setBackgroundColor: (color) => __awaiter(void 0, void 0, void 0, function* () {
            return yield ipcRenderer.invoke('overlay-mode:set-background-color', color);
        }),
    },
});
contextBridge.exposeInMainWorld('audioLoopback', {
    enableLoopbackAudio: () => ipcRenderer.invoke('enable-loopback-audio'),
    disableLoopbackAudio: () => ipcRenderer.invoke('disable-loopback-audio')
});
ipcRenderer.on('log', (event, { level, message, context }) => {
    if (level === 'error') {
        console.error(`[${level}] ${message}`, context);
    }
    else if (level === 'warn') {
        console.warn(`[${level}] ${message}`, context);
    }
    else {
        console.log(`[${level}] ${message}`, context);
    }
});
ipcRenderer.on('native-event', (event, data) => {
    data.event = data.event.replace(/^(\\)+/, '');
    if (window.Livewire) {
        window.Livewire.dispatch('native:' + data.event, data.payload);
    }
    if (window.livewire) {
        window.livewire.components.components().forEach(component => {
            if (Array.isArray(component.listeners)) {
                component.listeners.forEach(event => {
                    if (event.startsWith('native')) {
                        let event_parts = event.split(/(native:|native-)|:|,/);
                        if (event_parts[1] == 'native:') {
                            event_parts.splice(2, 0, 'private', undefined, 'nativephp', undefined);
                        }
                        let [s1, signature, channel_type, s2, channel, s3, event_name,] = event_parts;
                        if (data.event === event_name) {
                            window.livewire.emit(event, data.payload);
                        }
                    }
                });
            }
        });
    }
});
