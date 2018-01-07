// Basic init
const electron = require('electron')
const {
  app,
  BrowserWindow,
  globalShortcut
} = electron;
const settings = require("electron-settings");

const getcolor = (theme) => {
  switch(theme){
    case 'dark':
      return '#000000'
      break
    case 'white':
      return '#ffffff'
      break
    default:
      return '#000000'
      break    
  }
}

// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname)


var platform = process.platform

app.on('ready', () => {

  const mainWindow = new BrowserWindow({
    width: 425,
    height: 650,
    resizable: true,
    autoHideMenuBar: true,
    frame: platform !== 'win32',
    backgroundColor: settings.has('settings.theme')? getcolor(settings.get('settings.theme')) : '#000000',
    titleBarStyle: "hiddenInset",
    minWidth: 390,
    minHeight: 450
  });


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