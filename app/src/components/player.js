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
const ipc = require("electron").ipcRenderer;
const { shell } = require("electron");
const SortableList = SortableContainer(List, { withRef: true });
const SortableRow = SortableElement(({ children }) => children);
const DragHandle = SortableHandle(() => <span className="draghandle">=</span>);
/*
<div id="playlists">
  <div className="playlist color-main">Основной</div>
</div>
*/

const sec2time = seconds => {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
};

class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scrubber: 0,
      playlists: [],
      timeOn: {
        time: sec2time(0),
        position: 0
      },
      pl: 0,
      scroll: 0,
      focused: false,
      loaded: 0,
      loop: false,
      loading: false,
      random: false,
      music: { 0: music },
      mLength: music.length,
      menu: false,
      dialog: {
        show: false,
        title: "",
        text: "",
        actions: []
      },
      screen: "main",
      autoScroll: settings.has("settings.autoscroll")
        ? settings.get("settings.autoscroll")
        : true,
      theme: settings.get("settings.theme") || "white",
      notify: settings.has("settings.notify")
        ? settings.get("settings.notify")
        : true
    };

    this.playpause = this.playpause.bind(this);
    this.loop = this.loop.bind(this);
    this.delete_audio = this.delete_audio.bind(this);
    this.notify = this.notify.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.addDocumentMouseEvents = this.addDocumentMouseEvents.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onEnd = this.onEnd.bind(this);
  }

  componentWillMount() {
    player = new Audio();
    player.src = this.state.music[this.state.pl][0].src;
    this.state.music[this.state.pl][0].selected = true;
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
          break;
        case "screen:settings":
          this.setState({
            screen: "settings"
          });
      }
    });
    this.setState({
      loading: true
    });
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://m.vk.com/audio?act=audio_playlists" + uid, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");
    xhr.onreadystatechange = function() {
      if (this.readyState != 4) return;
      var data = eval("(" + this.responseText + ")");
      if (!data[1]) {
        self.logout();
      }
      var pls = [];
      for (var i of data[3][1]) {
        pls.push(data[3][0][i]);
      }
      self.setState({
        playlists: pls,
        loading: false
      });
    };
    xhr.send("_ajax=1&offset=0");
  }

  componentDidMount() {
    this.refs.scrubber.addEventListener("mousemove", e => {
      this.setState({
        timeOn: {
          time: sec2time(
            ~~(
              (e.clientX - 178) /
              this.refs.scrubber.offsetWidth *
              player.duration
            )
          ),
          position:
            window.innerWidth - e.clientX > 32
              ? e.clientX - 178
              : window.innerWidth - 212,
          active: true
        }
      });
    });
    this.refs.scrubber.addEventListener("mouseout", () => {
      this.setState({
        timeOn: {
          time: this.state.timeOn.time,
          position: this.state.timeOn.position,
          active: false
        }
      });
    });
  }

  addDocumentMouseEvents() {
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onEnd);
  }

  removeDocumentEvents() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onEnd);
  }

  onMouseDown(e) {
    this.pause();
    this.dragOffset = e.target.getBoundingClientRect().left;
    this.elementWidth = e.target.getBoundingClientRect().width;
    this.removeDocumentEvents();
    let position = e.clientX;
    this.onChange(position);
    this.addDocumentMouseEvents();
    e.stopPropagation();
    e.preventDefault();
  }

  onMouseUp() {
    this.onEnd();
  }

  onEnd() {
    this.removeDocumentEvents();
    this.play();
    this.setState({
      focused: false
    });
  }

  onMouseMove(e) {
    const position = e.clientX;
    this.onChange(position);
  }

  onChange(value) {
    var result = (value - this.dragOffset + 2) / this.elementWidth;
    if (result >= 0 && result < 1) {
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
      this.state.music[this.state.pl][current].selected = false;
      player.pause();
      current = i;
      player.src = this.state.music[this.state.pl][i].src;
      this.state.music[this.state.pl][current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    }
    this.forceUpdate();
  }

  next() {
    if (current == this.state.music[this.state.pl].length - 1) {
      this.state.music[this.state.pl][current].selected = false;
      if (this.state.random) {
        current = Math.floor(
          this.state.music[this.state.pl].length * Math.random()
        );
      } else {
        current = 0;
      }
      player.src = this.state.music[this.state.pl][current].src;
      this.state.music[this.state.pl][current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    } else {
      this.state.music[this.state.pl][current].selected = false;
      if (this.state.random) {
        current = Math.floor(
          this.state.music[this.state.pl].length * Math.random()
        );
      } else {
        current++;
      }
      player.src = this.state.music[this.state.pl][current].src;
      this.state.music[this.state.pl][current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    }
    if (this.state.notify) {
      this.notify();
    }
    this.forceUpdate();
  }

  getPlaylist(id, index) {
    if (this.state.music[index]) {
      this.state.music[this.state.pl][current].selected = false;
      this.pause();
      current = 0;
      player.src = this.state.music[index][0].src;
      this.state.music[index][current].selected = true;
      this.setState({
        pl: index,
        screen: "main"
      });
      return;
    }
    this.setState({
      loading: true
    });
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      "https://m.vk.com/audio?act=audio_playlist" + uid + "_" + id,
      true
    );
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");
    xhr.onreadystatechange = function() {
      if (this.readyState != 4) return;
      var data = eval("(" + this.responseText + ")");
      var el = document.createElement("html");
      el.innerHTML = data[3][0];
      var audios = el.getElementsByClassName("audio_item");
      var result = [];
      for (var i = 0; i < audios.length; i++) {
        var audio = document.createElement("div");
        audio.innerHTML = audios[i].innerHTML;
        if (audio.innerHTML !== "undefined") {
          var track = {};
          track.artist = audio.getElementsByClassName("ai_title")[0].innerHTML;
          track.title = audio.getElementsByClassName("ai_artist")[0].innerHTML;
          track.cover_css = audio.getElementsByClassName(
            "ai_play"
          )[0].attributes.style.value;
          track.duration = audio.getElementsByClassName("ai_dur")[0].attributes[
            "data-dur"
          ].value;
          track.selected = false;
          track.src = geturl(audio.getElementsByTagName("input")[0].value);
          result.push(track);
        }
      }
      var music = self.state.music;
      music[index] = result;
      self.state.music[self.state.pl][current].selected = false;
      self.pause();
      current = 0;
      player.src = self.state.music[index][0].src;
      self.state.music[index][current].selected = true;
      self.setState({
        loading: false,
        pl: index,
        screen: "main",
        music: music
      });
    };
    xhr.send("_ajax=1&offset=0");
  }

  notify() {
    var cover
    if (this.state.music[this.state.pl][current].cover_css != ''){
        cover = this.state.music[this.state.pl][current].cover_css
        .split("url(")[1]
        .split(")")[0]
      }
    ipc.send("asynchronous-message", {
      title: this.state.music[this.state.pl][current].title,
      artist: this.state.music[this.state.pl][current].artist,
      image: cover
    });
  }

  loop() {
    player.loop = player.loop ? false : true;
    this.setState({
      loop: player.loop ? true : false
    });
  }

  random() {
    this.setState({
      random: this.state.random ? false : true
    });
  }

  prev() {
    if (current == 0) {
      player.currentTime = 0;
      player.play();
      this.refs.play.classList.add("pause");
    } else {
      this.state.music[this.state.pl][current].selected = false;
      if (this.state.random) {
        current = Math.floor(
          this.state.music[this.state.pl].length * Math.random()
        );
      } else {
        current = current - 1;
      }
      player.src = this.state.music[this.state.pl][current].src;
      this.state.music[this.state.pl][current].selected = true;
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
    remote.getCurrentWindow().webContents.session.clearStorageData(() => {
      settings.delete("music");
      settings.delete("user");
      remote.app.relaunch();
      remote.app.exit(0);
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
    var music = this.state.music;
    music[this.state.pl] = arrayMove(
      this.state.music[this.state.pl],
      oldIndex,
      newIndex
    );
    this.setState({
      music: music
    });
  }

  change_theme() {
    document.body.classList.toggle("white");
    document.body.classList.toggle("dark");
    settings.set(
      "settings.theme",
      this.state.theme === "dark" ? "white" : "dark"
    );
    this.setState({
      theme: this.state.theme === "dark" ? "white" : "dark"
    });
  }

  delete_audio(index) {
    var buff = this.state.music;
    if (index !== current) {
      if (index > current) {
        buff[this.state.pl].splice(index, 1);
      } else {
        current = current - 1;
        buff[this.state.pl].splice(index, 1);
      }
    } else {
      this.next();
      current = current - 1;
      buff[this.state.pl].splice(index, 1);
    }
    this.setState({
      music: buff
    });
  }

  hideDialog() {
    var dialog = this.state.dialog;
    dialog.show = false;
    this.setState({
      dialog: dialog
    });
  }

  render() {
    return (
      <div id="Music" className="screen">
        <div
          className={this.state.timeOn.active ? "float active" : "float"}
          style={{
            left: this.state.timeOn.position + "px"
          }}
        >
          {this.state.timeOn.time}
        </div>
        <div
          className={
            this.state.screen === "settings"
              ? "screen_add active"
              : "screen_add"
          }
        >
          <div className="header">
            <h1>Настройки</h1>
            <div
              onClick={() => {
                this.setState({
                  screen: "main",
                  menu: false
                });
                this.menu.bind(this);
              }}
              className="close"
            />
          </div>
          <div className="settings-list">
            <div
              onClick={this.change_theme.bind(this)}
              className="settings-item"
            >
              <h2 className="item-name">Тема</h2>
              <div className="item-set">{this.state.theme}</div>
            </div>
            <div
              onClick={() => {
                settings.set(
                  "settings.notify",
                  this.state.notify ? false : true
                );
                this.setState({
                  notify: this.state.notify ? false : true
                });
              }}
              className="settings-item"
            >
              <h2 className="item-name">Уведомления</h2>
              <div className="item-set">
                {this.state.notify ? "Вкл" : "Выкл"}
              </div>
            </div>
            <div
              onClick={() => {
                settings.set(
                  "settings.autoscroll",
                  this.state.autoScroll ? false : true
                );
                this.setState({
                  autoScroll: this.state.autoScroll ? false : true
                });
              }}
              className="settings-item"
            >
              <h2 className="item-name">Авто-скролл</h2>
              <div className="item-set">
                {this.state.autoScroll ? "Вкл" : "Выкл"}
              </div>
            </div>
            <div className="bottom">
              <a
                onClick={() => {
                  shell.openExternal("https://uenify.com/");
                }}
              >
                Автор
              </a>
              <span> • </span>
              <a
                onClick={() => {
                  shell.openExternal("https://github.com/uenify/musician");
                }}
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
        <div
          className={
            this.state.screen === "playlists"
              ? "screen_add active"
              : "screen_add"
          }
        >
          <div className="header">
            <h1>Плейлисты</h1>
            <div
              onClick={() => {
                this.setState({
                  screen: "main",
                  menu: false
                });
                this.menu.bind(this);
              }}
              className="close"
            />
          </div>
          <div className="settings-list pl">
            <div
              onClick={() => {
                this.state.music[this.state.pl][current].selected = false;
                this.pause();
                current = 0;
                player.src = this.state.music[0][0].src;
                this.state.music[0][current].selected = true;
                this.setState({
                  pl: 0,
                  screen: "main"
                });
              }}
              className={this.state.pl ? "track" : "track -selected"}
            >
              <div className="track-album noalbum" />
              <div className="track-content">
                <div>
                  <p className="track-name">{"Аудиозаписи"}</p>
                  <p className="track-artist">
                    {this.state.mLength + " аудиозаписей"}
                  </p>
                </div>
              </div>
            </div>
            {this.state.playlists.map((pl, index) => {
              var styles = {
                backgroundImage: pl[1].thumb
                  ? "url(" +
                    pl[1].thumb_style.split("url(")[1].split(")")[0] +
                    ")"
                  : ""
              };
              var selected =
                this.state.pl === index * 1 + 1 ? "track -selected" : "track";
              return (
                <div
                  onClick={() => {
                    if (this.state.pl === index * 1 + 1) {
                      this.setState({
                        screen: "main"
                      });
                    } else {
                      this.getPlaylist(pl[1].id, index * 1 + 1);
                    }
                  }}
                  className={selected}
                  key={pl[1].raw_id}
                >
                  <div
                    style={styles}
                    className={
                      pl[1].thumb ? "track-album" : "track-album noimage"
                    }
                  />
                  <div className="track-content">
                    <div>
                      <p className="track-name">{pl[0]}</p>
                      <p className="track-artist">
                        {pl[1].info_line_1.replace(/\&nbsp;/g, " ")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={this.state.menu ? "menu active" : "menu"}>
          <div
            className="menu-list"
            onMouseDown={() => {
              this.setState({
                screen: "settings"
              });
            }}
          >
            Настройки
          </div>
          <div
            className="menu-list"
            onMouseDown={() => {
              this.setState({
                screen: "playlists"
              });
            }}
          >
            Плейлисты
          </div>
          <div
            className="menu-list"
            onMouseDown={() => {
              this.menu.bind(this);
              this.logout();
            }}
          >
            Выйти
          </div>
        </div>
        <div className="header">
          <h1
            onClick={() => {
              this.setState({
                screen: "playlists"
              });
            }}
            id="title"
          >
            {this.state.pl
              ? this.state.playlists[this.state.pl - 1][0]
              : "Аудиозаписи "}
            <i className="chevron">
              <svg
                viewBox="0 0 32 32"
                width="18"
                height="18"
                fill="none"
                stroke="currentcolor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              >
                <path d="M30 12 L16 24 2 12" />
              </svg>
            </i>
          </h1>
          <div
            id="profile"
            tabIndex="0"
            ref="profile"
            className={this.state.menu ? "active" : ""}
            style={{
              backgroundImage: "url(" + settings.get("user.photo") + ")"
            }}
            onFocus={this.menu.bind(this)}
            onBlur={() => {
              setTimeout(() => {
                this.menu.bind(this)();
              }, 100);
            }}
          />
        </div>
        <div className={this.state.scroll ? "plate shadow" : "plate"}>
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
              className={this.state.random ? "toggle-btn active" : "toggle-btn"}
            >
              <svg
                height="30px"
                version="1.1"
                viewBox="-3 -3 30 30"
                width="30px"
              >
                <circle />
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
            </div>
          </div>
          <div
            ref="scrubber"
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
            className={
              this.state.focused ? "scrubber-cont focused" : "scrubber-cont"
            }
          >
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
                onScroll={({ scrollTop }) => {
                  this.setState({
                    scroll: scrollTop
                  });
                }}
                scrollToIndex={this.state.autoScroll ? current : undefined}
                onSortStart={() => {
                  document.body.classList.add("grabbing");
                }}
                overscanRowCount={5}
                rowHeight={107}
                useDragHandle={true}
                rowRenderer={({ index, key, style }) => {
                  var styles = {
                    backgroundImage: this.state.music[this.state.pl][index]
                      .cover_css
                      ? "url(" +
                        this.state.music[this.state.pl][index].cover_css
                          .split("url(")[1]
                          .split(")")[0] +
                        ")"
                      : ""
                  };
                  var selected = this.state.music[this.state.pl][index].selected
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
                            this.state.music[this.state.pl][index].cover_css
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
                              {this.state.music[this.state.pl][index].title}
                            </p>
                            <p className="track-artist">
                              {this.state.music[this.state.pl][index].artist}
                            </p>
                          </div>
                          <footer>
                            <ul>
                              <li>
                                <a
                                  download={
                                    this.state.music[this.state.pl][index]
                                      .artist +
                                    " - " +
                                    this.state.music[this.state.pl][index]
                                      .title +
                                    ".mp3"
                                  }
                                  type="audio/mpeg"
                                  href={
                                    this.state.music[this.state.pl][index].src
                                  }
                                >
                                  Скачать
                                </a>
                              </li>
                              {index === current || index === current + 1 ? (
                                ""
                              ) : (
                                <li
                                  onClick={() => {
                                    if (index > current) {
                                      this.reorder({
                                        oldIndex: index,
                                        newIndex: current + 1
                                      });
                                    } else {
                                      this.reorder({
                                        oldIndex: index,
                                        newIndex: current
                                      });
                                    }
                                  }}
                                >
                                  Восп. след.
                                </li>
                              )}
                              <li
                                onClick={() => {
                                  this.setState({
                                    dialog: {
                                      show: true,
                                      title: "Удалить аудиозапись",
                                      text: "Вы собираетесь удалить:",
                                      component: (
                                        <div className="track">
                                          <div
                                            style={styles}
                                            className={
                                              this.state.music[this.state.pl][
                                                index
                                              ].cover_css
                                                ? "track-album"
                                                : "track-album noimage"
                                            }
                                          />
                                          <div className="track-content">
                                            <p className="track-name">
                                              {
                                                this.state.music[this.state.pl][
                                                  index
                                                ].title
                                              }
                                            </p>
                                            <p className="track-artist">
                                              {
                                                this.state.music[this.state.pl][
                                                  index
                                                ].artist
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      ),
                                      actions: [
                                        {
                                          label: "Удалить",
                                          func: () => {
                                            this.delete_audio(index);
                                          }
                                        }
                                      ]
                                    }
                                  });
                                }}
                              >
                                Удалить
                              </li>
                            </ul>
                          </footer>
                        </div>
                        <DragHandle />
                      </div>
                    </SortableRow>
                  );
                }}
                onSortEnd={this.reorder.bind(this)}
                rowCount={this.state.music[this.state.pl].length}
              />
            );
          }}
        </AutoSizer>
        {this.state.loading ? <div className="loader" /> : ""}
        <div
          className={
            this.state.dialog.show ? "dialog-wrap active" : "dialog-wrap"
          }
        >
          <div onClick={this.hideDialog.bind(this)} className="dialog-back" />
          <div className="dialog-content">
            <h1 className="title">{this.state.dialog.title}</h1>
            <p>{this.state.dialog.text}</p>
            {this.state.dialog.component}
            <div className="buttons">
              {this.state.dialog.actions.map((action, index) => (
                <div
                  key={index}
                  onClick={() => {
                    action.func();
                    this.hideDialog.bind(this)();
                  }}
                  className="button primary"
                >
                  {action.label}
                </div>
              ))}
              <div onClick={this.hideDialog.bind(this)} className="button">
                Отмена
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Player;
