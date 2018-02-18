import React, {Component} from 'react'
import {render} from 'react-dom'
import Login from './components/login.js';
import Player from './components/player.js';

import './styles/App.css';
const { remote } = require('electron')


export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {login: true, done: false, maximized: false, download: false};
    this.createplayer = this.createplayer.bind(this)
  }
  componentDidMount(){
    if (settings.has("user.id")) {
      uid = settings.get('user.id')
      if(settings.has('music')){
        var date = new Date()
        var compare = date - settings.get('user.date')
        if (compare < 1000 * 60 * 60 * 8){
          music = settings.get('music')
          this.createplayer()
        }else{
          settings.set('user.date', date*1)
          getaudio(-1, this.createplayer)
        }
      }else{
        getaudio(-1, this.createplayer)
      }
      var self = this
    }
    remote.BrowserWindow.getFocusedWindow().addListener('maximize', ()=>{
      this.setState({maximized: true})
      document.body.classList.add('maximized')
    })
    remote.BrowserWindow.getFocusedWindow().addListener('unmaximize', ()=>{
      this.setState({maximized: false})
      document.body.classList.remove('maximized')
    })
  }

  minimize(){
    remote.BrowserWindow.getFocusedWindow().minimize();
  }

  maximize(){
    this.state.maximized ? 
      remote.BrowserWindow.getFocusedWindow().unmaximize()
      :
      remote.BrowserWindow.getFocusedWindow().maximize()
    this.setState({
      maximized: this.state.maximized? false : true
    })
    document.body.classList.toggle('maximized')
  }

  close(){
    remote.BrowserWindow.getFocusedWindow().close()
  }


  createplayer(){
    this.setState({
      login: false,
      done: true
    })
  }
    render() {
        return (
            <div>
              <div id="titlebar" className="draggable">
                <div className="win-controls">
                  <div className="window_header_button -minimize" onClick={this.minimize}/>
                  <div className="window_header_button -maximize" onClick={this.maximize.bind(this)}/>
                  <div className="window_header_button -close" onClick={this.close}/>
                </div>
              </div>
              {this.state.login ? <Login ondone={this.createplayer}/> : ''}
              {this.state.done ? <Player/> : ''}
              {this.state.download ? <div className="loader"/> : ''}
            </div>
        )
    }
}


