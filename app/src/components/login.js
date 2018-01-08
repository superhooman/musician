import React, { Component } from "react";
import logo from "../assets/logo.svg";
const {shell} = require('electron')

class Login extends Component {
  constructor(props){
    super(props)
  }
  login(){
    var form = document.querySelector("form");
    var data = new FormData(form);
    var done = this.props.ondone
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        if (this.responseText.search('/restore') == -1) {
          uid = this.responseText.split("pid=")[1].split(";")[0];
          var photo = this.responseText.split('data-photo="')[1].split('"')[0]
          var logout_url = 'https://login.vk.com/' + this.responseText.split('https://login.vk.com/')[1].split('"')[0]
          var time = new Date()
          settings.set("user.photo", photo);
          settings.set("user.date", time)
          settings.set("user.id", uid);
  
          settings.set("user.logout", logout_url);
         
          getaudio(-1, done)
          
        }else{
          alert('Wrong pass')
        }
  
      }
    };
    xmlHttp.open("POST", vk, true); // true for asynchronous
    xmlHttp.send(data);
  }
  render() {
    return (
      <div id="splash" className="screen">
        <div className="login-cont">
        <form noValidate action="javascript:void(0)" onSubmit={this.login.bind(this)}>
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
        <div className="bottom">
          <a onClick={()=>{
            shell.openExternal('https://github.com/uenify/musician')
          }}>GitHub</a>
        </div>
      </div>
    );
  }
}

export default Login;
