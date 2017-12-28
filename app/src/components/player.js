import React, { Component } from "react";
import ReactList from "react-list";
import Track from "./track.js";
import { setTimeout, setInterval } from "timers";

class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scrubber: 0
    };
    this.playpause = this.playpause.bind(this);
  }

  componentDidMount() {
    //document.getElementById("splash").classList.add("hidden");
    player = new Audio();
    player.src = music[0].src;
    music[0].selected = true;
    player.onended = () => {
      if (!player.loop) {
        this.next();
      }
    };
    setInterval(() => {
      var buffered = player.buffered;
      var loaded;
      var played;

      if (buffered.length) {
        loaded = 100 * buffered.end(0) / player.duration;
        played = 100 * player.currentTime / player.duration;
        
        this.state = {
          scrubber: parseFloat(played),
          loaded: loaded
        };
      }
      this.forceUpdate()
    }, 75);
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
    player.play()
    this.refs.play.classList.add("pause");
  }

  pause() {
    player.pause()
    this.refs.play.classList.remove("pause");
  }

  change_audio(i) {
    if (i == current) {
      this.playpause();
    } else {
      music[current].selected = false;
      player.pause();
      current = i;
      player.src = music[i].src;
      music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    }
  }

  next() {
    if (current == music.length - 1) {
      music[current].selected = false;
      current = 0;
      player.src = music[current].src;
      music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    } else {
      music[current].selected = false;
      current++;
      player.src = music[current].src;
      music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    }
    this.forceUpdate();
  }

  loop() {
    player.loop = player.loop? false : true;
  }

  scrubber() {
    this.state = {
      scrubber: parseFloat(this.refs.scrubber.value),
    };
    player.currentTime = this.refs.scrubber.value / 100 * player.duration;
    this.forceUpdate();
  }

  prev() {
    if (current == 0) {
      player.currentTime = 0;
      player.play();
      this.refs.play.classList.add("pause");
    } else {
      music[current].selected = false;
      current = current - 1;
      player.src = music[current].src;
      music[current].selected = true;
      player.play();
      this.refs.play.classList.add("pause");
    }
    this.forceUpdate();
  }

  renderItem(i, key) {
    return (
      <Track
        key={key}
        i={i}
        onClick={() => {
          this.change_audio(i);
          this.forceUpdate();
        }}
      />
    );
  }

  render() {
    return (
      <div id="Music" className="screen">
        <div className="header">
          <h1 id="title">Основной плейлист</h1>
          <div id="profile" />
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
            <div onClick={this.loop} className="loop">
              <svg height="30px" version="1.1" viewBox="-3 -3 30 30" width="30px">
              <circle/>
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            </div>
          </div>
          <div className="scrubber-cont">
            <div className="scrubber-back line"/>
            <div style={{width: this.state.loaded + '%'}} className="loaded line"/>
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
              style={{width: this.state.scrubber + '%'}}
              className="progress line"
            ><div className="dot"/></div>
          </div>
        </div>
        <div id="playlists">
          <div className="playlist color-main">Основной</div>
        </div>
        <div id="listwrap">
          <ReactList
            itemRenderer={this.renderItem.bind(this)}
            length={music.length}
            type="uniform"
          />
        </div>
      </div>
    );
  }
}

export default Player;
