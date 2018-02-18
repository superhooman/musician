
// Basic init
const electron = require('electron')
const { join } = require('path')
const isDev = require('electron-is-dev')
const {
  app,
  BrowserWindow,
  globalShortcut
} = electron;
const settings = require("electron-settings");
const { autoUpdater } = require("electron-updater");
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
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
    app.quit()
  })
  autoUpdater.on('update-available', () => {
    notifier.notify({
      'title': 'Musician',
      'message': 'Доступно обновление',
      'sound': false
    });
    mainWindow.hide()
  })
  autoUpdater.checkForUpdates()

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
})


app.on('window-all-closed', app.quit)