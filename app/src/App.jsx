import React, { Component } from "react";
import { render } from "react-dom";
import Login from "./components/login.js";
import Player from "./components/player.js";

import "./styles/App.css";
const { remote } = require("electron");

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      login: true,
      done: false,
      maximized: false,
      download: false,
      update: true
    };
    this.createplayer = this.createplayer.bind(this);
  }
  componentDidMount() {
    if (settings.has("user.id")) {
      uid = settings.get("user.id");
      getaudio(-1, this.createplayer);
      this.setState({
        download: true
      });
      var self = this;
    }
    remote.getCurrentWindow().addListener("maximize", () => {
      this.setState({ maximized: true });
      document.body.classList.add("maximized");
    });
    remote.getCurrentWindow().addListener("unmaximize", () => {
      this.setState({ maximized: false });
      document.body.classList.remove("maximized");
    });
  }

  minimize() {
    remote.getCurrentWindow().minimize();
  }

  maximize() {
    this.state.maximized
      ? remote.getCurrentWindow().unmaximize()
      : remote.getCurrentWindow().maximize();
    this.setState({
      maximized: this.state.maximized ? false : true
    });
    document.body.classList.toggle("maximized");
  }

  close() {
    remote.getCurrentWindow().close();
  }

  createplayer() {
    this.setState({
      login: false,
      done: true,
      download: false
    });
  }
  render() {
    return (
      <div>
        <div id="titlebar" className="draggable">
          <div className="win-controls">
            <div
              className="window_header_button -minimize"
              onClick={this.minimize}
            />
            <div
              className="window_header_button -maximize"
              onClick={this.maximize.bind(this)}
            />
            <div className="window_header_button -close" onClick={this.close} />
          </div>
        </div>
        {this.state.login ? <Login ondone={this.createplayer} /> : ""}
        {this.state.done ? <Player /> : ""}
        {this.state.update ? (
          <div className="update">
            <p>Вышло обновление. Пожалуйста скачайте новую версию.</p>
            <button
              className="button"
              onClick={() => {
                shell.openExternal("https://musician.uenify.com/");
                this.setState({
                  update: false
                })
              }}
            >
              Скачать
            </button>
          </div>
        ) : (
          ""
        )}
        {this.state.download ? <div className="loader" /> : ""}
      </div>
    );
  }
}
