import React, {Component} from 'react'
import {render} from 'react-dom'
import Login from './components/login.js';
import Player from './components/player.js';
import './styles/App.css';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {login: true, done: false};
  }
  componentDidMount(){
    if (settings.has("user.id")) {
      uid = settings.get('user.id')
      if(settings.has('music')){
        music = settings.get('music')
        this.createplayer()
      }else{
        getaudio(-1, this.createplayer)
      }
    } else {
      ajax(
        "https://m.vk.com/login",
        e => {
          vk = e.split('action="')[1].split('"')[0];
        },
        "text"
      );
    }
  }

  createplayer(){
    this.state = {
      login: false,
      done: true
    }
    this.forceUpdate()
  }
    render() {
        return (
            <div>
              <div id="titlebar" className="draggable"><h1>Musician</h1></div>
              {this.state.login ? <Login/> : ''}
              {this.state.done ? <Player/> : ''}
            </div>
        )
    }
}

const ajax = (url, callback, type) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        switch (type) {
          case "json":
            var data = eval("(" + xmlHttp.responseText + ")");
            callback(data);
            break;
          case "text":
            callback(xmlHttp.responseText);
            break;
          default:
            callback(xmlHttp.responseText);
        }
      }
    };
    xmlHttp.open("POST", url, true); // true for asynchronous
    xmlHttp.send(null);
  };

