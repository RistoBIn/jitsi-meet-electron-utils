/* global __dirname */
const electron = require('electron');

const { SCREEN_SHARE_EVENTS_CHANNEL, SCREEN_SHARE_EVENTS } = require('jitsi-meet-electron-utils/screensharing/constants');


/**
 * Indicator component to show the range of being captured screen or window
 * The class will process events from {@link ScreenShareIndicatorHook} initialized in the renderer, and the
 * always on top screen sharing indicator window.
 */
class ScreenShareIndicatorHook {

    /**
     * Create ScreenShareIndicatorHook.
     * 
     * @param {BrowserWindow} jitsiMeetWindow - BrowserWindow where jitsi-meet api is loaded.
     */
    constructor(jitsiMeetWindow) {
        this._jitsiMeetWindow = jitsiMeetWindow;
        this._onScreenSharingEvent = this._onScreenSharingEvent.bind(this);
        this._borderWidth = 5;
        this._indicatorTypes = ["top", "bottom", "left", "right"];
        this._indicators = {
            top: null,
            bottom: null,
            left: null,
            right: null
        }

        // Listen for events coming in from the main render window and the screen share tracker window.
        electron.ipcMain.on(SCREEN_SHARE_EVENTS_CHANNEL, this._onScreenSharingEvent);

        // Clean up ipcMain handlers to avoid leaks.
        this._jitsiMeetWindow.on('closed', () => {
            electron.ipcMain.removeListener(SCREEN_SHARE_EVENTS_CHANNEL, this._onScreenSharingEvent);
        });
    }

    /**
     * Listen for events coming on the screen sharing event channel.
     *
     * @param {Object} event - Electron event data.
     * @param {Object} data - Channel specific data.
     */
    _onScreenSharingEvent(event, { data }) {
        switch (data.name) {
            case SCREEN_SHARE_EVENTS.OPEN_TRACKER:
                this._createScreenShareIndicator();
                break;
            case SCREEN_SHARE_EVENTS.CLOSE_TRACKER:
                if (this._indicators.top) {
                    this._indicators.top.close();
                    this._indicators.top = undefined;
                }
                if (this._indicators.bottom) {
                    this._indicators.bottom.close();
                    this._indicators.bottom = undefined;
                }
                if (this._indicators.left) {
                    this._indicators.left.close();
                    this._indicators.left = undefined;
                }
                if (this._indicators.right) {
                    this._indicators.right.close();
                    this._indicators.right = undefined;
                }
                break;
            case SCREEN_SHARE_EVENTS.STOP_SCREEN_SHARE:

                break;
            default:
                console.warn(`Unhandled ${SCREEN_SHARE_EVENTS_CHANNEL}: ${data}`);
        }
    }

    _createScreenShareIndicator() {
        const commonWindowOption = {
            transparent: true,
            minimizable: true,
            maximizable: false,
            resizable: false,
            alwaysOnTop: true,
            fullscreen: false,
            fullscreenable: false,
            skipTaskbar: false,
            hasShadow: false,
            frame: false,
            show: false,
            webPreferences: {
                nodeIntegration: true
            },
        }
        let display = electron.screen.getPrimaryDisplay();
        const bounds = display.workArea;
        for (const no in this._indicatorTypes) {
            const type = this._indicatorTypes[no];
            if (!this._indicators[type]) {
                var width, height, offsetX, offsetY;
                switch (type) {
                    case "top":
                        width = bounds.width;
                        height = this._borderWidth;
                        offsetY = bounds.y;
                        offsetX = bounds.x;
                        break;
                    case "bottom":
                        width = bounds.width;
                        height = this._borderWidth;
                        offsetY = bounds.y + bounds.height - this._borderWidth;
                        offsetX = bounds.x;
                        break;
                    case "left":
                        width = this._borderWidth;
                        height = bounds.height;
                        offsetY = bounds.y;
                        offsetX = bounds.x;
                        break;
                    case "right":
                        width = this._borderWidth;
                        height = bounds.height;
                        offsetY = bounds.y;
                        offsetX = bounds.x + bounds.width - this._borderWidth;
                        break;
                    default:
                        width = 0;
                        height = 0;
                        offsetY = 0;
                        offsetX = 0;
                        break;
                }
                this._indicators[type] = new electron.BrowserWindow({
                    height: height,
                    width: width,
                    x: offsetX,
                    y: offsetY,
                    ...commonWindowOption
                });

                this._indicators[type].on('closed', () => {
                    this._indicators[type] = undefined;
                });

                // Prevent newly created window to take focus from main application.
                this._indicators[type].once('ready-to-show', () => {
                    if (this._indicators[type] && !this._indicators[type].isDestroyed()) {
                        this._indicators[type].showInactive();
                    }
                });

                this._indicators[type].loadURL(`file://${__dirname}/line.html`);
            }
        }
    }
}

/**
 * Initializes the screen sharing electron specific functionality in the main electron process.
 */
module.exports = function setupScreenSharingIndicator(jitsiMeetWindow) {
    return new ScreenShareIndicatorHook(jitsiMeetWindow);
};