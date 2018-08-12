import React, { Component } from 'react'
import { render } from 'react-dom';
import './styles/global.css';
import { remote } from 'electron';
import settings from "electron-settings";
import Login from "./Components/Login.jsx";
import Player from "./Components/Player.jsx"

const ipc = require('electron').ipcRenderer;

export default class App extends Component {
    constructor() {
        super()
        this.receiveMusic = this.receiveMusic.bind(this)
        this.maximize = this.maximize.bind(this)
        this.state = {
            logged: false,
            maximized: false,
            screen: <Login onDone={this.receiveMusic} />
        }
    }
    componentDidMount() {
        remote.getCurrentWindow().addListener("maximize", () => {
            this.setState({ maximized: true });
            document.body.classList.add("maximized");
        });
        remote.getCurrentWindow().addListener("unmaximize", () => {
            this.setState({ maximized: false });
            document.body.classList.remove("maximized");
        });
        if (settings.has('user.music')) {
            let date = new Date()
            if(settings.get('date')*1 + 28800000 > date*1){
                this.showPlayer(settings.get('user.music'))
            }
        }
        ipc.on('app', (event, message) => {
			if(message === "theme:change"){
                this.changeTheme()
            }
		});
    }
    receiveMusic(m) {
        let date = new Date()*1
        settings.set('date', date)
        settings.set('user.music', m);
        this.showPlayer(m)
    }
    showPlayer(m) {
        this.setState({
            music: m,
            screen: <Player music={m} />
        })
    }
    changeTheme() {
		document.body.classList.toggle('white');
		document.body.classList.toggle('dark');
		settings.set('settings.theme', this.state.theme === 'dark' ? 'white' : 'dark');
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
                            onClick={this.maximize}
                        />
                        <div className="window_header_button -close" onClick={this.close} />
                    </div>
                </div>
                {this.state.screen}
            </div>
        )
    }
}
