import React, { Component } from "react";
import logo from "../assets/logo.svg";
const { shell } = require("electron");
const { remote } = require("electron");
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
    var form = document.querySelector(".login-form");
    var data = new FormData(form);
    var comp = this
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        comp.authorize(this.responseText)
      }
    };
    this.setState({
      loading: true
    })
    xmlHttp.open("POST", vk, true); // true for asynchronous
    xmlHttp.send(data);
    
  }
  handleChange(event) {
    this.setState({code_text: event.target.value});
  }
  insertCode(){
    var form = document.querySelector(".code-form");
    var data = new FormData(form);
    var xmlHttp = new XMLHttpRequest();
    var comp = this
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        comp.authorize(this.responseText)
      }
    };
    this.setState({
      loading: true
    })
    xmlHttp.open("POST", "https://m.vk.com" + this.state.link, true);
    xmlHttp.send(data);
  }
  authorize(responseText){
    var done = this.props.ondone;
      if (responseText.search("/restore") == -1) {
        if (responseText.search("authcheck_code") == -1) {
          uid = responseText.split("pid=")[1].split(";")[0];
          var photo = responseText
            .split('data-photo="')[1]
            .split('"')[0];
          var logout_url =
            "https://login.vk.com/" +
            responseText.split("https://login.vk.com/")[1].split('"')[0];
          var time = new Date();
          settings.set("user.photo", photo);
          settings.set("user.date", time);
          settings.set("user.id", uid);
          settings.set("user.logout", logout_url);
          getaudio(-1, done);
        } else {
          var link = responseText.split('action="')[1].split('"')[0];
          this.setState({
            loading: false,
            code: true,
            link: link
          })
        }
      } else {
        if (responseText.search("sid=") == -1){
          this.setState({
            loading: false,
            error: {
              active: true,
              text: 'Неверный пароль, либо ошибка на сервере'
            }
          })
          remote.BrowserWindow.getFocusedWindow().webContents.session.clearStorageData();
          ajax(
            "https://m.vk.com/login",
            e => {
              vk = e.split('action="')[1].split('"')[0];
            },
            "text"
          );
        }else{
          var link = responseText.split('action="')[1].split('"')[0];
          var sid = responseText.split('sid=')[1].split('"')[0]
          this.setState({
            loading: false,
            link: link,
            captcha: {
              active: true,
              sid: sid
            }
          })
        }
      }
  }
  render() {
    return (
      <div id="splash" className="screen">
        <div className="login-cont">
          {this.state.error.active ? (<div className="error">{this.state.error.text}</div>):''}
          {this.state.code ? (
            <form
              className="code-form"
              noValidate
              action="javascript:void(0)"
              onSubmit={this.insertCode.bind(this)}
            >
              <input type="text" name="code" value={this.state.code_text} onChange={this.handleChange} placeholder="Код" />
              <input
                type="submit"
                className="button vk"
                id="login_button"
                value="Войти"
              />
            </form>
          ) : (
            <form
              className="login-form"
              noValidate
              action="javascript:void(0)"
              onSubmit={this.login.bind(this)}
            >
              <input type="text" name="email" placeholder="Почта или номер" />
              <br />
              <input type="password" placeholder="••••••" name="pass" />
              <br />
              {this.state.captcha.active ? (
                <div>
                  <img src={"https://m.vk.com/captcha.php?s=0&sid="+ this.state.captcha.sid} id="captcha" className="captcha" />
                  <input type="hidden" name="captcha_sid" value={ this.state.captcha.sid } />
                  <input type="text" placeholder="Код с картинки" name="captcha_key" />
                </div>
              ):''}
              <input
                type="submit"
                className="button vk"
                id="login_button"
                value="Войти"
              />
            </form>
          )}
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
