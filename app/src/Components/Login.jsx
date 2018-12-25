import React, { Component } from 'react';
import settings from 'electron-settings';
import axios from 'axios';
import logo from '../assets/logo.svg';

const { shell, remote } = require('electron');

const getURL = (e, uid) => {
	var n = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=',
		i = {
			v: function(e) {
				return e.split('').reverse().join('');
			},
			r: function(e, t) {
				e = e.split('');
				for (var i, a = n + n, o = e.length; o--; ) (i = a.indexOf(e[o])), ~i && (e[o] = a.substr(i - t, 1));
				return e.join('');
			},
			s: function(e, t) {
				var n = e.length;
				if (n) {
					var i = s(e, t),
						a = 0;
					for (e = e.split(''); ++a < n; ) e[a] = e.splice(i[n - 1 - a], 1, e[a])[0];
					e = e.join('');
				}
				return e;
			},
			i: function(e, t) {
				return i.s(e, t ^ uid);
			},
			x: function(e, t) {
				var n = [];
				return (
					(t = t.charCodeAt(0)),
					each(e.split(''), function(e, i) {
						n.push(String.fromCharCode(i.charCodeAt(0) ^ t));
					}),
					n.join('')
				);
			}
		};

	function a() {
		return window.wbopen && ~(window.open + '').indexOf('wbopen');
	}

	function o(e) {
		var t = e.split('?extra=')[1].split('#'),
			n = '' === t[1] ? '' : r(t[1]);
		if (((t = r(t[0])), 'string' != typeof n || !t)) return e;
		n = n ? n.split(String.fromCharCode(9)) : [];
		for (var o, s, l = n.length; l--; ) {
			if (((s = n[l].split(String.fromCharCode(11))), (o = s.splice(0, 1, t)[0]), !i[o])) return e;
			t = i[o].apply(null, s);
		}
		if (t && 'http' === t.substr(0, 4)) return t;
		{
			/*
        
        if (!a() && ~e.indexOf("audio_api_unavailable")) {
            var t = e.split("?extra=")[1].split("#"),
                n = "" === t[1] ? "" : r(t[1]);
            if (t = r(t[0]),
                "string" != typeof n || !t)
                return e;
            n = n ? n.split(String.fromCharCode(9)) : [];
            for (var o, s, l = n.length; l--;) {
                if (s = n[l].split(String.fromCharCode(11)),
                    o = s.splice(0, 1, t)[0], !i[o])
                    return e;
                t = i[o].apply(null, s)
            }
            if (t && "http" === t.substr(0, 4))
                return t
        }
        return e
        */
		}
	}

	function r(e) {
		if (!e || e.length % 4 == 1) return !1;
		for (var t, i, a = 0, o = 0, r = ''; (i = e.charAt(o++)); )
			(i = n.indexOf(i)),
				~i &&
					((t = a % 4 ? 64 * t + i : i), a++ % 4) &&
					(r += String.fromCharCode(255 & (t >> ((-2 * a) & 6))));
		return r;
	}

	function s(e, t) {
		var n = e.length,
			i = [];
		if (n) {
			var a = n;
			for (t = Math.abs(t); a--; ) (t = ((n * (a + 1)) ^ (t + a)) % n), (i[a] = t);
		}
		return i;
	}
	return o(e);
};

class Login extends Component {
	constructor(props) {
		super(props);
		this.state = {
			logged: false,
			loading: false,
			uid: null,
			token: null,
			music: [],
			error: {
				active: false,
				text: ''
			}
		};
		this.count = 0
		this.createLoginWindow = this.createLoginWindow.bind(this);
		this.getInitialInfo = this.getInitialInfo.bind(this);
		this.getAudio = this.getAudio.bind(this);
	}
	createLoginWindow() {
		let win = new remote.BrowserWindow({
			autoHideMenuBar: true,
			minWidth: 660,
			minHeight: 420,
			width: 660,
			height: 420
		});
		let contents = win.webContents;
		win.on('close', () => {
			win = null;
			this.setState({
				loading: false
			});
		});
		win.webContents.on('did-navigate', (event, url) => {
			let urlcheck = url.split('#');
			if (urlcheck[0] === 'https://oauth.vk.com/blank.html') {
				console.log(url);
				let i = url.indexOf('access_token=');
				let i2 = url.indexOf('&');
				let i3 = url.indexOf('user_id=');
				this.setState({
					token: url.substr(i + 13, i2 - i - 13),
					uid: url.substr(i3 + 8)
				});
				this.getInitialInfo();
				win.close();
			}
		});
		win.loadURL(
			'https://oauth.vk.com/authorize?client_id=4831307&scope=offline,audio&display=popup&redirect_uri=https://oauth.vk.com/blank.html&response_type=token'
		);
		this.setState({
			loading: true
		});
	}
	getInitialInfo() {
		console.log(this.state);
		axios({
			url: 'https://api.vk.com/method/users.get',
			method: 'POST',
			params: {
				user_ids: this.state.uid,
				fields: 'photo_50',
				access_token: this.state.token,
				v: '5.73'
			}
		}).then((res) => {
			settings.set('user.profile.photo', res.data.response[0].photo_50);
			settings.set('user.profile.uid', this.state.uid);
			settings.set('user.profile.token', this.state.token);
			this.getAudio(0, this.props.onDone);
		});
	}
	getAudio(e, callback) {
		axios({
			url: 'https://m.vk.com/audio',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'x-requested-with': 'XMLHttpRequest'
			},
			data: '_ajax=1&offset=' + e
		}).then((res) => {
			let music = this.state.music;
			let data = res.data;
			let textarea = document.createElement('textarea');

			if (!data[1]) {
				console.log('Error', data);
			}
			for (let i in data[3][0]) {
				this.count++
				if ((data[3][0][i][3] != '' && data[3][0][i][4] != '', data[3][0][i][2] != '')) {
					textarea.innerHTML = data[3][0][i][3];
					let artist = textarea.innerText;
					textarea.innerHTML = data[3][0][i][4];
					let title = textarea.innerText;
					let tr = {
						artist: artist,
						title: title,
						id: data[3][0][i][1],
						src: getURL(data[3][0][i][2], this.state.uid).split('?')[0],
						duration: data[3][0][i][5],
						cover_css: data[3][0][i][8]
					};
					music.push(tr);
				}
			}
			this.setState({
				music: music
			});
			if (Object.keys(data[3][0]).length > 30) {
				this.getAudio(this.count, callback);
			} else {
				callback(music);
			}
		});
	}
	render() {
		return (
			<div className="screen">
				{this.state.error.active ? <div className="error">{this.state.error.text}</div> : ''}
				<div className="login-container">
					<svg
						fill="currentColor"
						className="logo musician-logo"
						height={64}
						width={64}
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 1275 1275"
					>
						<rect className="musician-logo__first" x="230.6" y="386.9" width="150" height="550" />
						<rect
							className="musician-logo__second"
							x="401.8"
							y="378.3"
							transform="matrix(0.7071 -0.7071 0.7071 0.7071 -276.7517 509.663)"
							width="150"
							height="421.3"
						/>
						<rect className="musician-logo__third" x="871.3" y="386.9" width="150" height="550" />
					</svg>
					<h1>Musician</h1>
					<p>Плеер для ВК</p>
					<button onClick={this.createLoginWindow} className="button vk">
						Войти
					</button>
				</div>
				<div className="footer">
					<a onClick={() => shell.openExternal('https://vk.com/vkmusician')}>Группа</a>
				</div>
				{this.state.loading ? <div className="loader" /> : ''}
			</div>
		);
	}
}
export default Login;
