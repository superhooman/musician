// Basic init
const electron = require('electron')
const { app, BrowserWindow, globalShortcut } = electron;

// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname)

// To avoid being garbage collected
let mainWindow

app.on('ready', () => {

    let mainWindow = new BrowserWindow({
        width: 425,
        height: 650,
        resizable: true,
        vibrancy: "popover",
        titleBarStyle: "hiddenInset",
        minWidth: 320,
        minHeight: 450
      });

    mainWindow.loadURL(`file://${__dirname}/app/index.html`)
    globalShortcut.register("MediaPlayPause", () =>
      mainWindow.webContents.send("ping", "control:playPause")
    );
    globalShortcut.register("MediaNextTrack", () =>
      mainWindow.webContents.send("ping", "control:nextTrack")
    );
    globalShortcut.register("MediaPreviousTrack", () =>
      mainWindow.webContents.send("ping", "control:prevTrack")
    );
})