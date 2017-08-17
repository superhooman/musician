const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow(){ //создаем окно
  mainWindow = new BrowserWindow({width: 350, height: 650, resizable: true, titleBarStyle: "hidden", vibrancy: 'ultra-dark', minWidth: 320, minHeight: 450, maxWidth: 549})
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  mainWindow.on('closed', function () {
      app.quit() //Чтобы не остался активным
      mainWindow = null
  })
}

app.on('ready', createWindow)

// Когда на макоси закрывают все окна
// Это понадобится в будущем, а пока что просто выход
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Когда на макоси апп все еще активен, но окон нет
// и апп запускают опять
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
