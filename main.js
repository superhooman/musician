
// Basic init
const electron = require('electron')
const { join } = require('path')
const isDev = require('electron-is-dev')
const { appUpdater } = require('./autoupdater');
const {
  app,
  BrowserWindow,
  globalShortcut
} = electron;
const settings = require("electron-settings");
const ipc = require('electron').ipcMain
let notifier 
const getcolor = (theme) => {
  switch(theme){
    case 'dark':
      return '#000000'
      break
    case 'white':
      return '#ffffff'
      break
    default:
      return '#ffffff'
      break    
  }
}

// Let electron reloads by itself when webpack watches changes in ./app/
//require('electron-reload')(__dirname)


function isWindowsOrmacOS() {
	return process.platform === 'darwin' || process.platform === 'win32';
}

var platform = process.platform

if(platform === 'darwin'){
  const NotificationCenter = require('node-notifier').NotificationCenter;
  notifier = new NotificationCenter({
    customPath: join(
      __dirname,
      'Musician.app/Contents/MacOS/Musician'
    ),
  });
}else{
  notifier = require('node-notifier');
}

app.on('ready', () => {

  const mainWindow = new BrowserWindow({
    width: 425,
    height: 650,
    resizable: true,
    autoHideMenuBar: true,
    frame: platform !== 'win32',
    backgroundColor: settings.has('settings.theme')? getcolor(settings.get('settings.theme')) : '#ffffff',
    icon: platform === 'win32'? join(__dirname, 'app/img/logo.ico') : join(__dirname, 'app/img/logo.icns'),
    titleBarStyle: "hiddenInset",
    minWidth: 390,
    minHeight: 450
  });

  ipc.on('asynchronous-message', (event, arg) =>{
    notifier.notify({
      'title': arg.title,
      'message': arg.artist,
      'sound': false
    });
  })


  mainWindow.loadURL('file://' + __dirname + '/app/index.html?platform=' + platform)

  const page = mainWindow.webContents;
  
  page.once('did-frame-finish-load', () => {
    const checkOS = isWindowsOrmacOS();
    if (checkOS && !isDev) {
      // Initate auto-updates on macOs and windows
      appUpdater();
    }});

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