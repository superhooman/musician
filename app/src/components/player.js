import React, { Component } from "react";
import {
  SortableContainer,
  SortableElement,
  arrayMove,
  SortableHandle
} from "react-sortable-hoc";
import { List, AutoSizer } from "react-virtualized";

const { remote } = require("electron");
const SortableList = SortableContainer(List, { withRef: true });
const SortableRow = SortableElement(({ children }) => children);
const DragHandle = SortableHandle(() => <span className="draghandle">=</span>);

/*
<div id="playlists">
  <div className="playlist color-main">Основной</div>
</div>
*/

class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scrubber: 0,
      loaded: 0,
      loop: false,
      music: music,
      menu: false
    };

    this.playpause = this.playpause.bind(this);
    this.loop = this.loop.bind(this);
  }

  componentWillMount() {
    player = new Audio();
    player.src = music[0].src;
    music[0].selected = true;
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
      current = 0;
      player.src = this.state.music[current].src;
      this.state.music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    } else {
      this.state.music[current].selected = false;
      current++;
      player.src = this.state.music[current].src;
      this.state.music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    }
    this.forceUpdate();
  }

  loop() {
    player.loop = player.loop ? false : true;
    this.setState({
      loop: player.loop ? true : false
    });
  }

  scrubber() {
    this.setState({
      scrubber: parseFloat(this.refs.scrubber.value)
    });
    player.currentTime = this.refs.scrubber.value / 100 * player.duration;
  }

  prev() {
    if (current == 0) {
      player.currentTime = 0;
      player.play();
      this.refs.play.classList.add("pause");
    } else {
      this.state.music[current].selected = false;
      current = current - 1;
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
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        settings.deleteAll();
        remote.app.relaunch();
        remote.app.exit(0);
      }
    };
    xmlHttp.open("GET", settings.get("user.logout"), true); // true for asynchronous
    xmlHttp.send(null);
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

  render() {
    return (
      <div id="Music" className="screen">
        {this.state.menu ? (
          <div className="menu">
            <div className="menu-list disabled" onClick={this.menu.bind(this)}>
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
              className={this.state.loop ? "loop looped" : "loop"}
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
          </div>
          <div className="scrubber-cont">
            <div className="scrubber-back line" />
            <div
              style={{ width: this.state.loaded + "%" }}
              className="loaded line"
            />
            <input
              ref="scrubber"
              type="range"
              min="0"
              max="100"
              value={this.state.scrubber}
              onMouseDown={this.pause.bind(this)}
              onMouseUp={this.play.bind(this)}
              onChange={this.scrubber.bind(this)}
              step="any"
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
                height={window.innerHeight - 133}
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
                              <li>Скачать</li>
                              <li>Восп. след.</li>
                              <li>Удалить</li>
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
