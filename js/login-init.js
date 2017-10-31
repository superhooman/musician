$("login-wrapper").hide();
var resp;
const BrowserWindow = require("electron").remote.BrowserWindow;
const ipc = require("electron").ipcRenderer;
function login_window(e) {
  const modalPath = path.join("file://", __dirname, "login.html");
  let win = new BrowserWindow({
    minWidth: 660,
    minHeight: 420,
    width: 660,
    height: 420
  });
  let contents = win.webContents;
  win.on("close", function() {
    win = null;
    $("#splash").animate({ left: "0%", opacity: 1 }, 500);
  });
  win.webContents.on("did-navigate", (event, url) => {
    var urlcheck = url.split("#");
    if (urlcheck[0] == "https://oauth.vk.com/blank.html") {
      $("#splash").remove();
      resp = url;
      check_uid();
      win.close();
    }
  });
  const logout = () => {
    win.webContents.session.clearStorageData(function(){
      num_track = 0;
      get_offset = 0;
      audio_count = 50;
      not_loaded = true;
      get_id = undefined;
      get_token = undefined;
      console.log('done')
    });
  };
  win.loadURL(
    "https://oauth.vk.com/authorize?client_id=4831307&scope=offline,audio&display=popup&redirect_uri=https://oauth.vk.com/blank.html&response_type=token"
  );
  if(e == 'logout'){
    logout()
    var app = require("electron").remote.app // or from BrowserWindow: app = require("remote").require('app');
    app.relaunch()
    app.exit(0)
  }
  win.show();
}
$("#login_button").click(function() {
  $("#splash").animate({ left: "-100%", opacity: 0 }, 500);
  $("#Playlists").animate({ left: "0", opacity: 1 }, 500);
});
