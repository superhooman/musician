// Basic init
const electron = require('electron')
const { app, BrowserWindow, globalShortcut } = electron;

// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname)

// To avoid being garbage collected
let mainWindow

var platform = process.platform

app.on('ready', () => {

    switch(platform){
      case 'win32': mainWindow = new BrowserWindow({
        width: 425,
        height: 650,
        resizable: true,
        autoHideMenuBar: true,
        frame: false,
        minWidth: 320,
        minHeight: 450
      });
      break
      default: mainWindow = new BrowserWindow({
        width: 425,
        height: 650,
        resizable: true,
        vibrancy: "popover",
        titleBarStyle: "hiddenInset",
        minWidth: 320,
        minHeight: 450
      });
    }

    mainWindow.loadURL('file://'+__dirname+'/app/index.html?platform='+platform)
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