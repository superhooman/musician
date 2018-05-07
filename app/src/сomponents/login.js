import React, { Component } from "react";
import logo from "../assets/logo.svg";
const { join } = require('path')
const { shell, remote } = require("electron");
class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: false,
      link: null,
      code_text: '',
      loading: false,
      captcha: {
        active: false,
        sid: ''
      },
      error: {
        active: false,
        text: ''
      }
    }
    this.authorize = this.authorize.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  login() {
      const modalPath = join("file://", __dirname, "/app/login.html");
      let win = new remote.BrowserWindow({
        autoHideMenuBar: true,
        minWidth: 660,
        minHeight: 420,
        width: 660,
        height: 420
      });
      let contents = win.webContents;
      win.on("close", () => {
        win = null;
        this.setState({
          loading: false
        })
      });
      win.webContents.on("did-navigate", (event, url) => {
        var urlcheck = url.split("#");
        if (urlcheck[0] == "https://oauth.vk.com/blank.html") {
          var i = url.indexOf("access_token=");
          var i2 = url.indexOf("&");
          token = url.substr(i + 13, i2 - i - 13);
          var i3 = url.indexOf("user_id=");
          uid = url.substr(i3 + 8);
          this.authorize()
          win.close();
        }
      });
      win.loadURL(
        "https://oauth.vk.com/authorize?client_id=4831307&scope=offline,audio&display=popup&redirect_uri=https://oauth.vk.com/blank.html&response_type=token"
      );
      this.setState({
        loading: true
      })
  }
  handleChange(event) {
    this.setState({code_text: event.target.value});
  }
  authorize(){
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function () {
          if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var data = eval("(" + xmlHttp.responseText + ")");
            settings.set('user.photo', data.response[0].photo_50)
          }
        }
      xmlHttp.open("POST", 'https://api.vk.com/method/users.get?user_ids=' + uid + '&fields=photo_50&v=5.73', true);
      xmlHttp.send(null);
          var time = new Date();
          settings.set("user.date", time);
          settings.set("user.id", uid);
          getaudio(-1, this.props.ondone);
  }
  render() {
    return (
      <div id="splash" className="screen">
        <div className="login-cont">
          <h1>Musician</h1>
          <p>Плеер для ВК</p>
          {this.state.error.active ? (<div className="error">{this.state.error.text}</div>):''}
              <input
              onClick={this.login.bind(this)}
                type="submit"
                className="button vk"
                id="login_button"
                value="Войти"
              />
        </div>
        <div className="bottom">
          <a
            onClick={() => {
              shell.openExternal("https://github.com/uenify/musician");
            }}
          >
            GitHub
          </a>
        </div>
        {this.state.loading ? (<div className="loader"/>):''}
      </div>
    );
  }
}

export default Login;
