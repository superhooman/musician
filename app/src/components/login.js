import React, { Component } from "react";
import logo from "../assets/logo.svg";

const loadvk = e => {
  var form = document.querySelector("form");
  var data = new FormData(form);
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      uid = this.responseText.split("pid=")[1].split(";")[0];
      settings.set("user.id", uid);
      getaudio()
    }
  };
  xmlHttp.open("POST", vk, true); // true for asynchronous
  xmlHttp.send(data);
};


class Login extends Component {
  render() {
    return (
      <div id="splash" className="screen">
        <div className="login_logo">
          <div id="logo">
            <img src={logo} className="App-logo" alt="logo" />
          </div>
        </div>
        <div className="login_main">
          <div className="login_title">
            <h1>Musician</h1>
            <form noValidate action="javascript:void(0)" onSubmit={loadvk}>
              <input type="text" name="email" placeholder="Почта или номер" />
              <br />
              <input type="password" placeholder="••••••" name="pass" />
              <br />
              <input
                type="submit"
                className="button vk"
                id="login_button"
                value="Войти"
              />
            </form>
          </div>
          <div className="login_footer">
            <a data-href="https://vk.com/join" className="login_footer_link">
              Зарегистрироваться
            </a>
            <span className="login_footer_bullet">•</span>
            <a data-href="https://vk.com/restore" className="login_footer_link">
              Забыли пароль?
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default Login;
