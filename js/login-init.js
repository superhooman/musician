$('login-wrapper').hide();
var url;
const BrowserWindow = require('electron').remote.BrowserWindow
const path = require('path')
const ipc = require('electron').ipcRenderer
const newWindowBtn = document.getElementById('login_button')
newWindowBtn.addEventListener('click', function (event) {
    const modalPath = path.join('file://', __dirname, 'login.html')
    let win = new BrowserWindow({ width: 660, height: 420 })
    win.on('close', function () {
        win = null
        $('#splash').animate({left: '0%', opacity: 1}, 500);
    })
    win.loadURL(modalPath)
    win.show()
})
$('#login_button').click(function(){
    $('#splash').animate({left: '-100%', opacity: 0}, 500);
    $('#Playlists').animate({left: '0', opacity: 1}, 500);
})
ipc.on('success', function (event, arg) {
    $('#splash').remove();
    url = arg;
    check_uid();
})
