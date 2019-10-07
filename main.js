// Basic init
const electron = require('electron')
const {
  join
} = require('path')
const isDev = require('electron-is-dev')
const {
  app,
  BrowserWindow,
  globalShortcut,
  Menu
} = electron;
const {
  download
} = require('electron-dl');
const settings = require("electron-settings");
const {
  autoUpdater
} = require("electron-updater");
const ipc = require('electron').ipcMain
let notifier
const getcolor = (theme) => {
  switch (theme) {
    case 'dark':
      return '#333333'
      break
    case 'white':
      return '#ffffff'
      break
    default:
      return '#ffffff'
      break
  }
}

const platform = process.platform

if (platform === 'darwin') {
  const NotificationCenter = require('node-notifier').NotificationCenter;
  notifier = new NotificationCenter({
    customPath: join(
      __dirname,
      'musician.app/Contents/MacOS/musician'
    )
  });
} else {
  notifier = require('node-notifier');
}

// Let electron reloads by itself when webpack watches changes in ./app/
if (isDev) require('electron-reload')(__dirname)

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    width: 425,
    height: 650,
    resizable: true,
    autoHideMenuBar: true,
    frame: platform !== 'win32',
    backgroundColor: settings.has('settings.theme') ? getcolor(settings.get('settings.theme')) : '#ffffff',
    icon: platform === 'win32' ? join(__dirname, 'app/img/logo.ico') : join(__dirname, 'app/img/logo.icns'),
    titleBarStyle: "hiddenInset",
    minWidth: 390,
    minHeight: 450,
    webPreferences: {
      experimentalFeatures: true,
      nodeIntegration: true
    }
  });
  const template = [{
      label: 'Управление',
      submenu: [{
          label: 'Вперед',
          click() {
            mainWindow.webContents.send("ping", "control:nextTrack")
          }
        },
        {
          label: 'Назад',
          click() {
            mainWindow.webContents.send("ping", "control:prevTrack")
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Плэй/Пауза',
          click() {
            mainWindow.webContents.send("ping", "control:playPause")
          }
        },
      ]
    },
    {
      label: 'Вид',
      submenu: [{
          role: 'reload'
        },
        {
          role: 'togglefullscreen'
        }
      ]
    }
  ]

  if (platform === 'darwin' && !isDev) {
    template.unshift({
      label: app.getName(),
      submenu: [{
          label: 'О musician',
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Сменить тему',
          click() {
            mainWindow.webContents.send("app", "theme:change")
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Сервисы',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Скрыть musician',
          role: 'hide'
        },
        {
          label: 'Скрыть остальное',
          role: 'hideothers'
        },
        {
          label: 'Показать',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Выйти',
          role: 'quit'
        }
      ]
    })
    var menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  ipc.on('notify', (event, arg) => {
    if (platform === 'darwin') {
      notifier.notify({
        title: arg.title,
        subtitle: arg.subtitle,
        message: arg.artist,
        contentImage: arg.image,
        sound: false
      });
    }
  })
  ipc.on('download', (event, args) => {
    download(BrowserWindow.getFocusedWindow(), args.url, {
      filename: args.filename,
      errorTitle: 'Ошибка',
      errorMessage: 'Не удалось скачать'
    })
  })
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
    app.quit()
  })
  autoUpdater.on('update-available', () => {
    notifier.notify({
      'title': 'Musician',
      'message': 'Плеер обновляется',
      'sound': false
    });
    mainWindow.hide()
  })
  if(isDev){
    autoUpdater.checkForUpdates()
  }
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


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})