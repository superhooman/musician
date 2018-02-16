import React, { Component } from "react";
import {
  SortableContainer,
  SortableElement,
  arrayMove,
  SortableHandle
} from "react-sortable-hoc";
import { List, AutoSizer } from "react-virtualized";
import { platform } from "os";
import { join } from "path";


const { remote } = require("electron");
const ipc = require('electron').ipcRenderer
const {shell} = require('electron')
const SortableList = SortableContainer(List, { withRef: true });
const SortableRow = SortableElement(({ children }) => children);
const DragHandle = SortableHandle(() => <span className="draghandle">=</span>);
/*
<div id="playlists">
  <div className="playlist color-main">Основной</div>
</div>
*/

const sec2time = (seconds) => {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return ((m < 10)? '0' + m : m) + ":" + ((s < 10)? '0' + s : s)
}

class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scrubber: 0,
      timeOn:{
        time: sec2time(0),
        position: 0
      },
      focused: false,
      loaded: 0,
      loop: false,
      random: false,
      music: music,
      menu: false,
      settings: false,
      theme: settings.has('settings.theme') ? settings.get('settings.theme') : 'white',
      notify: settings.has('settings.notify') ? settings.get('settings.notify') : true
    };

    this.playpause = this.playpause.bind(this);
    this.loop = this.loop.bind(this);
    this.delete_audio = this.delete_audio.bind(this)
    this.notify = this.notify.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.addDocumentMouseEvents = this.addDocumentMouseEvents.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onEnd = this.onEnd.bind(this)
  }

  componentWillMount() {
    player = new Audio();
    player.src = this.state.music[0].src;
    this.state.music[0].selected = true;
    player.addEventListener("timeupdate", () => {
      var buffered = player.buffered;
      var loaded;
      var played;

      if (buffered.length) {
        loaded = 100 * buffered.end(0) / player.duration;
        played = 100 * player.currentTime / player.duration;

        this.setState({
          scrubber: parseFloat(played),
          loaded: loaded
        });
      }
    });
    player.onended = () => {
      if (!player.loop) {
        this.next();
      }
    };
    window.require("electron").ipcRenderer.on("ping", (event, message) => {
      switch (message) {
        case "control:playPause":
          this.playpause();
          break;
        case "control:nextTrack":
          this.next();
          break;
        case "control:prevTrack":
          this.prev();
      }
    });
  }

  componentDidMount(){
    this.refs.scrubber.addEventListener('mousemove', (e)=>{
      this.setState({
        timeOn: {
          time: sec2time(~~(((e.clientX - 178) / this.refs.scrubber.offsetWidth) * player.duration)),
          position: (e.clientX - 178),
          active: true
        }
      })
    })
    this.refs.scrubber.addEventListener('mouseout', ()=>{
      this.setState({
        timeOn: {
          time: this.state.timeOn.time,
          position: this.state.timeOn.position,
          active: false
        }
      })
    })
  }

  addDocumentMouseEvents() {
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onEnd);
  }

  removeDocumentEvents() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onEnd);
  }

  onMouseDown(e) {
    this.pause()
    this.dragOffset = e.target.getBoundingClientRect().left;
    this.elementWidth = e.target.getBoundingClientRect().width;
    this.removeDocumentEvents();
    let position = e.clientX;
    this.onChange(position)
    this.addDocumentMouseEvents();
    e.stopPropagation();
    e.preventDefault();
  }

  onMouseUp(){
    this.onEnd();
  }

  onEnd(){
    this.removeDocumentEvents();
    this.play()
    this.setState({
      focused: false
    })
  }

  onMouseMove(e){
    const position = e.clientX;
    this.onChange(position)
  }

  onChange(value) {
    var result = (value - this.dragOffset + 2) / this.elementWidth
    if (result >= 0){
      this.setState({
        scrubber: result * 100,
        focused: true
      });
      player.currentTime = result * player.duration;
    }
  }

  playpause() {
    this.refs.play.classList.toggle("pause");
    if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  }

  play() {
    player.play();
    this.refs.play.classList.add("pause");
  }

  pause() {
    player.pause();
    this.refs.play.classList.remove("pause");
  }

  change_audio(i) {
    if (i == current) {
      this.playpause();
    } else {
      this.state.music[current].selected = false;
      player.pause();
      current = i;
      player.src = this.state.music[i].src;
      this.state.music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    }
    this.forceUpdate();
  }

  next() {
    if (current == this.state.music.length - 1) {
      this.state.music[current].selected = false;
      if (this.state.random){
        current = Math.floor(this.state.music.length * Math.random())
      }else{
        current = 0;
      }
      player.src = this.state.music[current].src;
      this.state.music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    } else {
      this.state.music[current].selected = false;
      if (this.state.random){
        current = Math.floor(this.state.music.length * Math.random())
      }else{
        current++;
      }
      player.src = this.state.music[current].src;
      this.state.music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    }
    if (this.state.notify) {
      this.notify()
    }
    this.forceUpdate();
  }

  notify(){
    ipc.send('asynchronous-message', {
      title: this.state.music[current].title,
      artist: this.state.music[current].artist
    })
  }

  loop() {
    player.loop = player.loop ? false : true;
    this.setState({
      loop: player.loop ? true : false
    });
  }

  random(){
    this.setState({
      random: this.state.random ? false : true
    })
  }

  prev() {
    if (current == 0) {
      player.currentTime = 0;
      player.play();
      this.refs.play.classList.add("pause");
    } else {
      this.state.music[current].selected = false;
      if (this.state.random){
        current = Math.floor(this.state.music.length * Math.random())
      }else{
        current = current - 1;
      }
      player.src = this.state.music[current].src;
      this.state.music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    }
    this.forceUpdate();
  }

  menu() {
    this.setState({
      menu: this.state.menu ? false : true
    });
  }
  logout() {
    remote.BrowserWindow.fromId(1).webContents.session.clearStorageData(() => {
      settings.delete('music');
      settings.delete('user');
      remote.app.relaunch()
      remote.app.exit(0)
    });
  }

  reorder({ oldIndex, newIndex }) {
    document.body.classList.remove("grabbing");
    if (oldIndex > current && newIndex <= current) {
      current = current + 1;
    } else if (oldIndex < current && newIndex >= current) {
      current = current - 1;
    } else if (oldIndex === current) {
      current = newIndex;
    }
    this.setState({
      music: arrayMove(this.state.music, oldIndex, newIndex)
    });
  }

  change_theme() {
    document.body.classList.toggle('white')
    document.body.classList.toggle('dark')
    settings.set('settings', {
      theme: this.state.theme === "dark" ? 'white' : 'dark',
      notify: this.state.notify
    })
    this.setState({
      theme: this.state.theme === "dark" ? 'white' : 'dark'
    })
  }

  delete_audio(index) {
    var buff = this.state.music
    if (index !== current) {
      if (index > current) {
        buff.splice(index, 1)
      } else {
        current = current - 1
        buff.splice(index, 1)
      }
    } else {
      this.next()
      current = current - 1
      buff.splice(index, 1)
    }
    this.setState({
      music: buff
    })
  }

  render() {
    return (
      <div id="Music" className="screen">
        <div className={this.state.timeOn.active ? "float active" : "float"} style={{
          left: this.state.timeOn.position + 'px'
        }}>{this.state.timeOn.time}</div>
        {this.state.settings ? (
          <div className="settings-screen">
            <div className="header">
              <h1>Настройки</h1>
              <div onClick={() => {
                this.setState({
                  settings: false,
                  menu: false
                })
                this.menu.bind(this)
              }} className="close" />
            </div>
            <div className="settings-list">
              <div onClick={
                this.change_theme.bind(this)
              } className="settings-item">
                <h2 className="item-name">Тема</h2><div className="item-set">{this.state.theme}</div>
              </div>
              <div onClick={
                () => {
                  settings.set('settings', {
                    theme: this.state.theme,
                    notify: !this.state.notify
                  })
                  this.setState({
                    notify: this.state.notify? false : true
                  })
                }
              } className="settings-item">
                <h2 className="item-name">Уведомления</h2><div className="item-set">{this.state.notify ? 'Вкл' : 'Выкл'}</div>
              </div>
              <div className="bottom">
                <a onClick={()=>{
                  shell.openExternal('https://uenify.com/')
                }}>Автор</a>
                <span> • </span>
                <a onClick={()=>{
                  shell.openExternal('https://github.com/uenify/musician')
                }}>GitHub</a>
        </div>
            </div>
          </div>
        ) : ''}
        {this.state.menu ? (
          <div className="menu">
            <div className="menu-list" onClick={() => {
              this.setState({
                settings: true
              })
            }}>
              Настройки
            </div>
            <div
              className="menu-list"
              onClick={() => {
                this.menu.bind(this);
                this.logout();
              }}
            >
              Выйти
            </div>
          </div>
        ) : (
            ""
          )}
        <div className="header">
          <h1 id="title">Основной плейлист</h1>
          <div
            id="profile"
            className={this.state.menu ? "active" : ""}
            style={{
              backgroundImage: "url(" + settings.get("user.photo") + ")"
            }}
            onClick={this.menu.bind(this)}
          />
        </div>
        <div className="plate">
          <div className="controls">
            <div onClick={this.prev.bind(this)} className="prev">
              <svg height="30px" version="1.1" viewBox="0 0 36 36" width="30px">
                <path d="m 12,12 h 2 v 12 h -2 z m 3.5,6 8.5,6 V 12 z" />
              </svg>
            </div>
            <div ref="play" onClick={this.playpause} className="play">
              <svg height="30px" version="1.1" viewBox="0 0 36 36" width="30px">
                <path />
              </svg>
            </div>
            <div onClick={this.next.bind(this)} className="next">
              <svg height="30px" version="1.1" viewBox="0 0 36 36" width="30px">
                <path d="M 12,24 20.5,18 12,12 V 24 z M 22,12 v 12 h 2 V 12 h -2 z" />
              </svg>
            </div>
            <div
              onClick={this.loop}
              className={this.state.loop ? "toggle-btn active" : "toggle-btn"}
            >
              <svg
                height="30px"
                version="1.1"
                viewBox="-3 -3 30 30"
                width="30px"
              >
                <circle />
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            </div>
            <div
              onClick={this.random.bind(this)}
              className={this.state.random ?  "toggle-btn active" : "toggle-btn"}
            >
              <svg
                height="30px"
                version="1.1"
                viewBox="-3 -3 30 30"
                width="30px"
              >
                <circle />
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"></path>
              </svg>
            </div>
          </div>
          <div ref="scrubber" 
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp} 
            className={this.state.focused ? "scrubber-cont focused" : "scrubber-cont"}>
            <div className="scrubber-back line" />
            <div
              style={{ width: this.state.loaded + "%" }}
              className="loaded line"
            />
            <div
              ref="progress"
              style={{ width: this.state.scrubber + "%" }}
              className="progress line"
            >
              <div className="dot" />
            </div>
          </div>
        </div>

        <AutoSizer>
          {({ width }) => {
            return (
              <SortableList
                ref="list"
                className="list"
                lockAxis="y"
                lockToContainerEdges={true}
                height={window.innerHeight - 146}
                width={width}
                onSortStart={() => {
                  document.body.classList.add("grabbing");
                }}
                overscanRowCount={5}
                rowHeight={107}
                useDragHandle={true}
                rowRenderer={({ index, key, style }) => {
                  var styles = {
                    backgroundImage: this.state.music[index].cover_css
                      ? "url(" +
                      this.state.music[index].cover_css
                        .split("url(")[1]
                        .split(")")[0] +
                      ")"
                      : ""
                  };
                  var selected = this.state.music[index].selected
                    ? "track  -selected"
                    : "track";
                  return (
                    <SortableRow key={key} index={index}>
                      <div style={style} className={selected}>
                        <div
                          onClick={() => {
                            this.change_audio(index);
                          }}
                          style={styles}
                          className={
                            this.state.music[index].cover_css
                              ? "track-album"
                              : "track-album noimage"
                          }
                        />
                        <div className="track-content">
                          <div
                            onClick={() => {
                              this.change_audio(index);
                            }}
                          >
                            <p className="track-name">
                              {this.state.music[index].title}
                            </p>
                            <p className="track-artist">
                              {this.state.music[index].artist}
                            </p>
                          </div>
                          <footer>
                            <ul>
                              <li><a download={this.state.music[index].artist + ' - ' + this.state.music[index].title + '.mp3'} type='audio/mpeg' href={this.state.music[index].src}>Скачать</a></li>
                              {index === current || index === current + 1 ? '' :
                                (<li onClick={() => {
                                  if(index > current){
                                    this.reorder({ oldIndex: index, newIndex: current + 1 })
                                  }else{
                                    this.reorder({ oldIndex: index, newIndex: current })
                                  }
                                }}>Восп. след.</li>)}
                              <li onClick={() => {
                                this.delete_audio(index)
                              }}>Удалить</li>
                            </ul>
                          </footer>
                        </div>
                        <DragHandle />
                      </div>
                    </SortableRow>
                  );
                }}
                onSortEnd={this.reorder.bind(this)}
                rowCount={this.state.music.length}
              />
            );
          }}
        </AutoSizer>
      </div>
    );
  }
}

export default Player;
