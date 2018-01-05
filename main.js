// Basic init
const electron = require('electron')
const {
  app,
  BrowserWindow,
  globalShortcut
} = electron;

// Let electron reloads by itself when webpack watches changes in ./app/
//require('electron-reload')(__dirname)

// To avoid being garbage collected
let mainWindow

var platform = process.platform

app.on('ready', () => {

  switch (platform) {
    case 'win32':
      mainWindow = new BrowserWindow({
        width: 425,
        height: 650,
        resizable: true,
        autoHideMenuBar: true,
        frame: false,
        backgroundColor: '#36a9f5',
        minWidth: 320,
        minHeight: 450
      });
      break
    default:
      mainWindow = new BrowserWindow({
        width: 425,
        height: 650,
        resizable: true,
        vibrancy: "popover",
        titleBarStyle: "hiddenInset",
        minWidth: 320,
        minHeight: 450
      });
  }

  require('electron-context-menu')({
    showInspectElement: false,
    prepend: (params, browserWindow) => {
      console.log(params)
      return([{
        label: 'Rainbow',
        // Only show it when right-clicking images 
        visible: params.y > 132
    }])
    }
});

  mainWindow.loadURL('file://' + __dirname + '/app/index.html?platform=' + platform)
  globalShortcut.register("MediaPlayPause", () =>
    mainWindow.webContents.send("ping", "control:playPause")
  );
  globalShortcut.register("MediaNextTrack", () =>
    mainWindow.webContents.send("ping", "control:nextTrack")
  );
  globalShortcut.register("MediaPreviousTrack", () =>
    mainWindow.webContents.send("ping", "control:prevTrack")
  );
  /*mainWindow.webContents.executeJavaScript(`
    var path = require('path');
    module.paths.push(path.resolve('node_modules'));
    module.paths.push(path.resolve('../node_modules'));
    module.paths.push(path.resolve(__dirname, '..', '..', 'electron', 'node_modules'));
    module.paths.push(path.resolve(__dirname, '..', '..', 'resources/electron.asar', 'node_modules'));
    module.paths.push(path.resolve(__dirname, '..', '..', 'app', 'node_modules'));
    module.paths.push(path.resolve(__dirname, '..', '..', 'resources/app.asar', 'node_modules'));
    path = undefined;
  `);*/
})

app.on('window-all-closed', app.quit)