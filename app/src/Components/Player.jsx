import React, { Component } from 'react';
import settings from 'electron-settings';
import axios from 'axios';
import { platform } from 'os';
import { SortableContainer, SortableElement, arrayMove, SortableHandle } from 'react-sortable-hoc';
import { List, AutoSizer } from 'react-virtualized';
import artboard from '../assets/artboard.jpg';
import Slider from './Slider.jsx';
const path = require('path');

const { remote } = require('electron');
const ipc = require('electron').ipcRenderer;
const SortableList = SortableContainer(List, { withRef: true });
const SortableRow = SortableElement(({ children }) => children);
const DragHandle = SortableHandle(() => (
	<span className="draghandle">
		<svg
			version="1.1"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			width="24px"
			height="24px"
			viewBox="0 0 24 24"
		>
			<path d="M11,18c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S11,16.9,11,18z M9,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S10.1,10,9,10z
     M9,4C7.9,4,7,4.9,7,6s0.9,2,2,2s2-0.9,2-2S10.1,4,9,4z M15,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S13.9,8,15,8z M15,10
    c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S16.1,10,15,10z M15,16c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S16.1,16,15,16z" />
		</svg>
	</span>
));

const titles = {
	current: 'Текущий плейлист',
	playlists: 'Плейлисты',
	search: 'Поиск'
};

const getHTMLRendered = (html) => {
	let el = document.createElement('div');
	el.innerHTML = html;
	return el.innerText;
};

class Player extends Component {
	constructor(props) {
		super(props);
		this.state = {
			current: 0,
			play: false,
			screen: 'current',
			user: settings.get('user.profile'),
			music: {
				main: this.props.music
			},
			pl: 'main',
			autoScroll: settings.has('settings.autoscroll') ? settings.get('settings.autoscroll') : true,
			random: false,
			loop: false,
			scroll: 0,
			dialog: {
				show: false,
				title: '',
				text: '',
				actions: []
			},
			playLists: [],
			scrubber: 0,
			loaded: 0,
			notify: true,
			search: ''
		};
		this.menuWillHide = false;
		this.reorder = this.reorder.bind(this);
		this.play = this.play.bind(this);
		this.playPause = this.playPause.bind(this);
		this.pause = this.pause.bind(this);
		this.onChange = this.onChange.bind(this);
		this.next = this.next.bind(this);
		this.prev = this.prev.bind(this);
		this.random = this.random.bind(this);
		this.loop = this.loop.bind(this);
		this.search = this.search.bind(this);
		this._addFromSearch = this._addFromSearch.bind(this)
	}
	componentWillMount() {
		this.player = new Audio();
		window.player = this.player;
		this.player.src = this.state.music[this.state.pl][0].src;
		ipc.on('ping', (event, message) => {
			switch (message) {
				case 'control:playPause':
					this.playPause();
					break;
				case 'control:nextTrack':
					this.next();
					break;
				case 'control:prevTrack':
					this.prev();
					break;
				case 'screen:settings':
					this.setState({
						screen: 'settings'
					});
			}
		});
		axios
			.post('https://m.vk.com/audio?act=audio_playlists' + this.state.user.uid, '_ajax=1&offset=0', {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'x-requested-with': 'XMLHttpRequest'
				}
			})
			.then((res) => {
				if (res.data && res.data[1]) {
					let playLists = [];
					for (let i of res.data[3][1]) {
						playLists.push(res.data[3][0][i]);
					}
					this.setState({
						playLists
					});
				}
			});
		this.player.addEventListener('timeupdate', () => {
			let buffered = this.player.buffered;
			let loaded;
			let played;

			if (buffered.length) {
				loaded = 100 * buffered.end(0) / this.player.duration;
				played = 100 * this.player.currentTime / this.player.duration;

				this.setState({
					scrubber: parseFloat(played),
					loaded: loaded
				});
			}
		});
		this.player.onended = () => {
			if (!this.player.loop) {
				this.next();
			}
		};
	}
	onChange(value) {
		this.player.currentTime = value * this.player.duration;
	}
	playPause() {
		this.player.paused ? this.play() : this.pause();
	}
	play() {
		this.player.play().catch((err) => console.log(err));

		this.setState({
			play: true
		});
	}
	pause() {
		this.player.pause();
		this.setState({
			play: false
		});
	}
	next() {
		let current = this.state.current;
		let pl = this.state.pl;
		if (current == this.state.music[pl].length - 1) {
			if (this.state.random) {
				current = Math.floor(this.state.music[pl].length * Math.random());
			} else {
				current = 0;
			}
			this.player.src = this.state.music[pl][current].src;
			this.setState({
				current: current
			});
			this.play();
		} else {
			if (this.state.random) {
				current = Math.floor(this.state.music[this.state.pl].length * Math.random());
			} else {
				current++;
			}
			this.player.src = this.state.music[pl][current].src;
			this.setState({
				current: current
			});
			this.play();
		}
		if (this.state.notify) this.notify(current);
	}
	prev() {
		let current = this.state.current;
		let pl = this.state.pl;
		if (current == 0) {
			this.player.currentTime = 0;
			this.play();
		} else {
			if (this.state.random) {
				current = Math.floor(this.state.music[pl].length * Math.random());
			} else {
				current = current - 1;
			}
			this.player.src = this.state.music[pl][current].src;
			this.play();
			this.setState({
				current: current
			});
		}
	}
	changeAudio(i) {
		let current = this.state.current;
		let pl = this.state.pl;
		if (i == current) {
			this.playPause();
		} else {
			this.pause();
			this.player.src = this.state.music[pl][i].src;
			this.setState({
				current: i
			});
			this.play();
		}
	}
	loop() {
		this.setState({
			loop: !this.state.loop
		});
		this.player.loop = !this.player.loop;
	}
	changeTheme() {
		document.body.classList.toggle('white');
		document.body.classList.toggle('dark');
		settings.set('settings.theme', this.state.theme === 'dark' ? 'white' : 'dark');
	}
	random() {
		this.setState({
			random: !this.state.random
		});
	}
	reorder({ oldIndex, newIndex }) {
		let current = this.state.current;
		let pl = this.state.pl;
		if (oldIndex > current && newIndex <= current) {
			current = current + 1;
		} else if (oldIndex < current && newIndex >= current) {
			current = current - 1;
		} else if (oldIndex === current) {
			current = newIndex;
		}
		let music = this.state.music;
		music[pl] = arrayMove(this.state.music[pl], oldIndex, newIndex);
		this.setState({
			music: music,
			current: current
		});
	}
	deleteWarning(i, styles, id) {
		this.setState({
			dialog: {
				show: true,
				title: 'Удалить аудиозапись',
				text: 'Вы собираетесь удалить:',
				component: (
					<div className="track">
						<div
							style={styles}
							className={
								this.state.music[this.state.pl][i].cover_css ? 'track-album' : 'track-album noimage'
							}
						/>
						<div className="track-content">
							<p className="track-name">{this.state.music[this.state.pl][i].title}</p>
							<p className="track-artist">{this.state.music[this.state.pl][i].artist}</p>
						</div>
					</div>
				),
				actions: [
					{
						label: 'Удалить',
						func: () => {
							this.deleteAudio(id, i);
						}
					}
				]
			}
		});
	}
	logoutDialog() {
		this.setState({
			dialog: {
				show: true,
				title: 'Выйти',
				text: 'Вы дейстительно хотите выйти из аккаунта?',
				component: null,
				actions: [
					{
						label: 'Выйти',
						func: () => {
							this.logout();
						}
					}
				]
			}
		});
	}
	deleteAudio(id, i) {
		let music = this.state.music;
		let current = this.state.current;
		let pl = this.state.pl;
		if (i !== current) {
			if (i > current) {
				music[pl].splice(i, 1);
			} else {
				current = current - 1;
				music[pl].splice(i, 1);
			}
		} else {
			this.next();
			music[pl].splice(i, 1);
		}
		axios({
			url: 'https://api.vk.com/method/audio.delete',
			params: {
				v: '5.73',
				audio_id: id.split('_')[1],
				owner_id: id.split('_')[0],
				access_token: this.state.user.token
			}
		}).then((res) => {
			settings.set('user.music', music)
			this.setState({
				music: music,
				current: current
			});
		});
	}
	notify(current) {
		let cover = path.resolve('app/src/assets/artboard.jpg');
		let pl = this.state.pl;
		if (this.state.music[pl][current].cover_css != '') {
			cover = this.state.music[pl][current].cover_css.split('url(')[1].split(')')[0];
		}
		ipc.send('notify', {
			title: this.state.music[pl][current].title,
			artist: this.state.music[pl][current].artist,
			image: cover
		});
	}
	download(i) {
		let name =
			this.state.music[this.state.pl][i].artist + ' - ' + this.state.music[this.state.pl][i].title + '.mp3';
		let url = this.state.music[this.state.pl][i].src;
		ipc.send('download', {
			url: url,
			filename: name
		});
	}
	hideDialog() {
		let dialog = this.state.dialog;
		dialog.show = false;
		this.setState({
			dialog: dialog
		});
	}
	logout() {
		remote.getCurrentWindow().webContents.session.clearStorageData(() => {
			settings.delete('music');
			settings.delete('user');
			remote.app.relaunch();
			remote.app.exit(0);
		});
	}
	search(q, sid, key) {
		let data = '_ajax=1&q=' + q;
		if (sid && key) {
			data = data + '&captcha_sid=' + sid + '&captcha_key=' + key;
		}
		axios
			.post('https://m.vk.com/audio', data, {
				headers: {
					'x-requested-with': 'XMLHttpRequest'
				}
			})
			.then((res) => {
				if (res.data) {
					if (res.data[4] && res.data[4].split('.php')[0] === '/captcha') {
						return this.setState({
							dialog: {
								show: true,
								title: 'Введите код с картинки',
								component: (
									<div>
										<img className="captcha-image" src={'https://m.vk.com' + res.data[4]} />
										<input
											onKeyPress={(e) => {
												let key = e.which || e.keyCode;
												if (key === 13) {
													this.search(q, res.data[5].captcha_sid, this.state.captcha);
												}
											}}
											placeholder="Код"
											className="captcha-input"
											type="text"
											value={this.state.captcha}
											onChange={(e) => this.setState({ captcha: e.target.value })}
										/>
									</div>
								),
								actions: [
									{
										label: 'Ввод',
										func: () => {
											this.search(q, res.data[5].captcha_sid, this.state.captcha);
										}
									}
								]
							}
						});
					}
					if (res.data[3][0]) {
						let el = document.createElement('html');
						el.innerHTML = res.data[3][0];
						let cont = el.getElementsByClassName('AudioSerp__foundGlobal')[0];
						let audios = cont.getElementsByClassName('audio_item');
						let albums = cont.getElementsByClassName('audioPlaylists__item');
						let result = [];
						let resAlbums = [];
						for (let i = 0; i < audios.length; i++) {
							let audio = document.createElement('div');
							audio.innerHTML = audios[i].innerHTML;
							if (audio.innerHTML !== 'undefined') {
								let track = {};
								track.id = audios[i].id;
								track.artist = audio.getElementsByClassName('ai_title')[0].innerText;
								track.title = audio.getElementsByClassName('ai_artist')[0].innerText;
								track.cover_css = audio.getElementsByClassName('ai_play')[0].attributes.style.value;
								track.duration = audio.getElementsByClassName('ai_dur')[0].attributes['data-dur'].value;
								track.src = boop(audio.getElementsByTagName('input')[0].value, this.state.user.uid);
								result.push(track);
							}
						}
						for (let j = 0; j < albums.length; j++) {
							let pl = document.createElement('div');
							pl.innerHTML = albums[j].innerHTML;
							if (pl.innerHTML !== 'undefined') {
								let album = {};
								album.src = pl.getElementsByClassName(
									'audioPlaylists__itemLink'
								)[0].attributes.href.value;
								album.artist = pl.getElementsByClassName('audioPlaylists__itemSubtitle')[0].innerText;
								album.title = pl.getElementsByClassName('audioPlaylists__itemTitle')[0].innerText;
								album.cover_css = pl.getElementsByClassName(
									'audioPlaylists__itemCover'
								)[0].attributes.style.value;
								resAlbums.push(album);
							}
						}
						this.setState({
							resultServer: result,
							resultServerAlbums: resAlbums
						});
					} else {
						this.setState({
							resultServer: [],
							resultServerAlbums: []
						});
					}
				}
			});
	}
	getPlaylist(pl, index) {
		if (this.state.music[index]) {
			this.pause();
			this.player.src = this.state.music[index][0].src;
			this.setState({
				pl: index,
				screen: 'current',
				current: 0
			});
			return;
		}
		this.setState({
			loading: true
		});
		const mountData = (res) => {
			if (res.data) {
				let el = document.createElement('html');
				el.innerHTML = res.data[3][0];
				let audios = el.getElementsByClassName('audio_item');
				let result = [];
				for (let i = 0; i < audios.length; i++) {
					let audio = document.createElement('div');
					audio.innerHTML = audios[i].innerHTML;
					if (audio.innerHTML !== 'undefined') {
						let track = {};
						track.artist = audio.getElementsByClassName('ai_title')[0].innerText;
						track.title = audio.getElementsByClassName('ai_artist')[0].innerText;
						track.cover_css = audio.getElementsByClassName('ai_play')[0].attributes.style.value;
						track.duration = audio.getElementsByClassName('ai_dur')[0].attributes['data-dur'].value;
						track.src = boop(audio.getElementsByTagName('input')[0].value, this.state.user.uid);
						result.push(track);
					}
				}
				let music = this.state.music;
				music[index] = result;
				this.pause();
				this.player.src = this.state.music[index][0].src;
				this.setState({
					loading: false,
					pl: index,
					screen: 'current',
					music: music,
					current: 0
				});
			}
		};
		axios
			.post(
				'https://m.vk.com/audio?act=audio_playlist' + pl.owner_id + '_' + pl.id,
				'&from=audios' + this.state.user.uid + '&access_hash=' + pl.access_hash + '&_ajax=1&offset=0',
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'x-requested-with': 'XMLHttpRequest'
					}
				}
			)
			.then(mountData);
	}
	_addFromSearch(el, i){
		let music = this.state.music
		let main = this.state.music.main
		let resultServer = this.state.resultServer
		let current = this.state.current
		let id = el.id
		axios({
			url: 'https://api.vk.com/method/audio.add',
			params: {
				v: '5.73',
				audio_id: id.split('_')[1],
				owner_id: id.split('audio')[1].split('_')[0],
				access_token: this.state.user.token
			}
		}).then((res) => {
			let track = [el]
			track[0].id = this.state.user.uid + '_' + res.data.response + '_audios' + this.state.user.uid
			track = track.concat(main)
			music.main = track
			settings.set('user.music', track)
			resultServer[i].added = true
			current++ 
			this.setState({
				music,
				current,
				resultServer,
				screen: 'current'
			})
		});
	}
	getAlbum(link) {
		this.setState({
			loading: true
		});
		axios
			.post('https://m.vk.com' + link, '', {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'x-requested-with': 'XMLHttpRequest'
				}
			})
			.then((res) => {
				if (res.data) {
					let el = document.createElement('html');
					el.innerHTML = res.data[4];
					let audios = el.getElementsByClassName('audio_item');
					let result = [];
					for (let i = 0; i < audios.length; i++) {
						let audio = document.createElement('div');
						audio.innerHTML = audios[i].innerHTML;
						if (audio.innerHTML !== 'undefined') {
							let track = {};
							track.artist = audio.getElementsByClassName('ai_title')[0].innerText;
							track.title = audio.getElementsByClassName('ai_artist')[0].innerText;
							track.cover_css = audio.getElementsByClassName('ai_play')[0].attributes.style.value;
							track.duration = audio.getElementsByClassName('ai_dur')[0].attributes['data-dur'].value;
							track.src = boop(audio.getElementsByTagName('input')[0].value, this.state.user.uid);
							result.push(track);
						}
					}
					let music = this.state.music;
					music.album = result;
					this.pause();
					this.player.src = this.state.music.album[0].src;
					this.setState({
						loading: false,
						pl: 'album',
						screen: 'current',
						music: music,
						current: 0
					});
				}
			});
	}
	render() {
		return (
			<div className="screen">
				<div className="header">
					<h1 id="title">{titles[this.state.screen]}</h1>
					<div
						id="profile"
						tabIndex="0"
						ref="profile"
						className={this.state.menu ? 'active' : ''}
						style={{
							backgroundImage: 'url(' + settings.get('user.profile.photo') + ')'
						}}
						onClick={() => {
							this.setState({
								menu: !this.state.menu
							});
							this.menuWillHide = false;
						}}
					>
						<div
							onMouseLeave={() => {
								this.menuWillHide = true;
								setTimeout(() => {
									if (this.menuWillHide && this.state.menu) {
										this.setState({
											menu: false
										});
										this.menuWillHide = false;
									}
								}, 500);
							}}
							onMouseOver={() => {
								if (this.menuWillHide) {
									this.menuWillHide = false;
								}
							}}
							className="menu"
						>
							<div
								onClick={() => {
									this.changeTheme();
								}}
								className="menu-item"
							>
								Тема
							</div>
							<div onClick={this.logoutDialog.bind(this)} className="menu-item">
								Выйти
							</div>
						</div>
					</div>
				</div>
				<AutoSizer className={'tab current' + (this.state.screen === 'current' ? ' active-tab' : '')}>
					{({ width }) => {
						let offset = platform() === 'win32' ? 30 : 36;
						return (
							<SortableList
								ref="list"
								className="list"
								lockAxis="y"
								lockToContainerEdges={true}
								height={window.innerHeight - 196 - offset}
								width={width}
								onScroll={({ scrollTop }) => {
									this.setState({
										scroll: scrollTop
									});
								}}
								scrollToIndex={this.state.autoScroll ? this.state.current : undefined}
								onSortStart={() => document.body.classList.add('grabbing')}
								onSortEnd={(e) => {
									document.body.classList.remove('grabbing');
									this.reorder(e);
								}}
								overscanRowCount={5}
								rowHeight={107}
								rowCount={this.state.music[this.state.pl].length}
								useDragHandle={true}
								rowRenderer={({ index, key, style }) => {
									let styles = {
										backgroundImage: this.state.music[this.state.pl][index].cover_css
											? 'url(' +
												this.state.music[this.state.pl][index].cover_css
													.split('url(')[1]
													.split(')')[0] +
												')'
											: ''
									};
									let selected = index === this.state.current ? 'track  -selected' : 'track';
									return (
										<SortableRow key={key} index={index}>
											<div
												style={style}
												onClick={() => {
													this.changeAudio(index);
												}}
												className={selected}
											>
												<div
													style={styles}
													className={
														this.state.music[this.state.pl][index].cover_css ? (
															'track-album'
														) : (
															'track-album noimage'
														)
													}
												/>
												<div className="track-content">
													<p className="track-name">
														{this.state.music[this.state.pl][index].title}
													</p>
													<p className="track-artist">
														{this.state.music[this.state.pl][index].artist}
													</p>
													<footer>
														<ul>
															<li>
																<a
																	onClick={(e) => {
																		e.stopPropagation();
																		this.download(index);
																	}}
																>
																	Скачать
																</a>
															</li>
															{index === this.state.current ||
															index === this.state.current + 1 ? (
																''
															) : (
																<li
																	onClick={(e) => {
																		e.stopPropagation();
																		if (index > this.state.current) {
																			this.reorder({
																				oldIndex: index,
																				newIndex: this.state.current + 1
																			});
																		} else {
																			this.reorder({
																				oldIndex: index,
																				newIndex: this.state.current
																			});
																		}
																	}}
																>
																	Восп. след.
																</li>
															)}
															<li
																onClick={(e) => {
																	e.stopPropagation();
																	this.deleteWarning(
																		index,
																		styles,
																		this.state.music[this.state.pl][index].id
																	);
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
							/>
						);
					}}
				</AutoSizer>
				<div
					style={{
						height: platform() === 'win32' ? 'calc(100vh - 226px)' : 'calc(100vh - 232px)'
					}}
					className={'tab playlists' + (this.state.screen === 'playlists' ? ' active-tab' : '')}
				>
					<div
						onClick={() => {
							this.pause();
							this.player.src = this.state.music['main'][0].src;
							this.setState({
								screen: 'current',
								pl: 'main',
								current: 0
							});
						}}
						className={this.state.pl === 'main' ? 'track -selected' : 'track'}
					>
						<div className="track-album noalbum" />
						<div className="track-content">
							<div>
								<p className="track-name">{'Аудиозаписи'}</p>
								<p className="track-artist">{this.state.music['main'].length + ' аудиозаписей'}</p>
							</div>
						</div>
					</div>
					{this.state.playLists.map((pl, index) => {
						let styles = {
							backgroundImage: pl[1].thumb
								? 'url(' + pl[1].thumb_style.split('url(')[1].split(')')[0] + ')'
								: ''
						};
						var selected = this.state.pl === index * 1 + 1 ? 'track -selected' : 'track';
						return (
							<div
								onClick={() => {
									if (this.state.pl === index * 1 + 1) {
										this.setState({
											screen: 'current'
										});
									} else {
										this.getPlaylist(pl[1], index * 1 + 1);
									}
								}}
								className={selected}
								key={pl[1].raw_id}
							>
								<div style={styles} className={pl[1].thumb ? 'track-album' : 'track-album noalbum'} />
								<div className="track-content">
									<div>
										<p className="track-name">{pl[0]}</p>
										<p className="track-artist">
											{this.state.music[index + 1] ? (
												this.state.music[index + 1].length + ' аудиозаписей'
											) : (
												getHTMLRendered(pl[1].footer).split('·')[0]
											)}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
				<div className={'tab search' + (this.state.screen === 'search' ? ' active-tab' : '')}>
					<div className="search-input">
						<input
							type="text"
							placeholder="Запрос"
							onChange={(e) => {
								let resultLocal = e.target.value
									? this.state.music['main'].filter(
											(i) =>
												(i.title.toLowerCase() + ' ' + i.artist.toLowerCase()).indexOf(
													e.target.value.toLowerCase()
												) > -1
										)
									: [];
								this.setState({
									search: e.target.value,
									resultLocal: resultLocal
								});
								if (e.target.value.length > 2) {
									let q = e.target.value;
									setTimeout(() => {
										if (q === this.state.search) {
											this.search(q);
										}
									}, 500);
								}
							}}
							value={this.state.search}
						/>
						<div
							onClick={() => {
								this.setState({
									search: '',
									resultLocal: [],
									resultServer: []
								});
							}}
							style={{ display: this.state.search ? 'flex' : 'none' }}
							className="clear"
						>
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="16px"
								height="16px"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path d="M18.3,5.71L18.3,5.71c-0.39-0.39-1.02-0.39-1.41,0L12,10.59L7.11,5.7c-0.39-0.39-1.02-0.39-1.41,0l0,0
		c-0.39,0.39-0.39,1.02,0,1.41L10.59,12L5.7,16.89c-0.39,0.39-0.39,1.02,0,1.41h0c0.39,0.39,1.02,0.39,1.41,0L12,13.41l4.89,4.89
		c0.39,0.39,1.02,0.39,1.41,0l0,0c0.39-0.39,0.39-1.02,0-1.41L13.41,12l4.89-4.89C18.68,6.73,18.68,6.09,18.3,5.71z" />
							</svg>
						</div>
					</div>
					<div
						style={{
							height: platform() === 'win32' ? 'calc(100vh - 276px)' : 'calc(100vh - 282px)'
						}}
						className="results"
					>
						<div className="results-local">
							{this.state.search.length > 2 ? this.state.resultLocal.length ? (
								<div>
									<div className="results-header">
										{this.state.resultLocal.length +
											(this.state.resultLocal.length === 1 ? ' аудиозапись' : ' аудиозапиcей')}
									</div>
									{this.state.resultLocal.map((el, i) => {
										let styles = {
											backgroundImage: el.cover_css
												? 'url(' + el.cover_css.split('url(')[1].split(')')[0] + ')'
												: ''
										};
										return (
											<div
												onClick={() => {
													let m = this.state.music;
													m.resultLocal = this.state.resultLocal;
													this.setState({
														screen: 'current',
														music: m,
														pl: 'resultLocal',
														current: i
													});
													this.pause();
													this.player.src = this.state.resultLocal[i].src;
													this.play();
												}}
												key={i}
												className={'track'}
											>
												<div
													style={styles}
													className={el.cover_css ? 'track-album' : 'track-album noimage'}
												/>
												<div className="track-content">
													<p className="track-name">{el.title}</p>
													<p className="track-artist">{el.artist}</p>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div>
									<div className="results-header">Ваши аудиозаписи</div>
									<div className="empty">
										По запросу <b>«{this.state.search}»</b> ничего не найдено
									</div>
								</div>
							) : null}
						</div>
						<div className="results-server">
							{this.state.search.length > 2 && this.state.resultServerAlbums ? this.state
								.resultServerAlbums.length ? (
								<div>
									<div className="results-header">Альбомы</div>
									<div className="albums">
										{this.state.resultServerAlbums.map((el, i) => {
											let styles = {
												backgroundImage: el.cover_css
													? 'url(' + el.cover_css.split('url(')[1].split(')')[0] + ')'
													: ''
											};
											return (
												<div
													onClick={() => {
														this.getAlbum(el.src);
													}}
													key={i}
													className={'track'}
												>
													<div
														style={styles}
														className={el.cover_css ? 'track-album' : 'track-album noimage'}
													/>
													<div className="track-content">
														<p className="track-name">{el.title}</p>
														<p className="track-artist">{el.artist}</p>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							) : null : null}
						</div>
						<div className="results-server">
							{this.state.search.length > 2 && this.state.resultServer ? this.state.resultServer
								.length ? (
								<div>
									<div className="results-header">Все Аудиозаписи</div>
									{this.state.resultServer.map((el, i) => {
										let styles = {
											backgroundImage: el.cover_css
												? 'url(' + el.cover_css.split('url(')[1].split(')')[0] + ')'
												: ''
										};
										return (
											<div
												onClick={() => {
													let m = this.state.music;
													m.resultServer = this.state.resultServer;
													this.setState({
														screen: 'current',
														music: m,
														pl: 'resultServer',
														current: i
													});
													this.pause();
													this.player.src = this.state.resultServer[i].src;
													this.play();
												}}
												key={i}
												className={'track'}
											>
												<div
													style={styles}
													className={el.cover_css ? 'track-album' : 'track-album noimage'}
												/>
												<div className="track-content">
													<p className="track-name">{el.title}</p>
													<p className="track-artist">{el.artist}</p>
													{
															!el.added ? <footer>
															<ul>
																<li>
																	<a onClick={e => {
																		e.stopPropagation()
																		this._addFromSearch(el, i)
																	}}>
																		Добавить
																	</a>
																</li>
															</ul>
														</footer> : null
														}
												</div>
											</div>
										);
									})}
								</div>
							) : null : null}
						</div>
						<div
							style={{
								display: this.state.search ? 'none' : 'flex'
							}}
							className="results-empty"
						>
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="64px"
								height="64px"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path d="M15.5,14h-0.79l-0.28-0.27c1.2-1.4,1.82-3.31,1.48-5.34c-0.47-2.78-2.79-5-5.59-5.34c-4.23-0.52-7.79,3.04-7.27,7.27c0.34,2.8,2.56,5.12,5.34,5.59c2.03,0.34,3.94-0.28,5.34-1.48L14,14.71v0.79l4.25,4.25c0.41,0.41,1.08,0.41,1.49,0l0,0c0.41-0.41,0.41-1.08,0-1.49L15.5,14z M9.5,14C7.01,14,5,11.99,5,9.5S7.01,5,9.5,5S14,7.01,14,9.5S11.99,14,9.5,14z" />
							</svg>
							<div>Начните вводить запрос</div>
						</div>
					</div>
				</div>
				<div className={this.state.scroll ? 'plate shadow' : 'plate'}>
					<div className="controls">
						<div onClick={this.random} className={this.state.random ? 'toggle-btn active' : 'toggle-btn'}>
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="24px"
								height="24px"
								viewBox="-4 -4 32 32"
							>
								<circle />
								<path d="M10.59,9.17L6.12,4.7c-0.39-0.39-1.02-0.39-1.41,0l0,0c-0.39,0.39-0.39,1.02,0,1.41l4.46,4.46L10.59,9.17z M15.35,4.85l1.19,1.19L4.7,17.88c-0.39,0.39-0.39,1.02,0,1.41h0c0.39,0.39,1.02,0.39,1.41,0L17.96,7.46l1.19,1.19C19.46,8.96,20,8.74,20,8.29V4.5C20,4.22,19.78,4,19.5,4h-3.79C15.26,4,15.04,4.54,15.35,4.85z M14.83,13.41l-1.41,1.41l3.13,3.13l-1.2,1.2C15.04,19.46,15.26,20,15.71,20h3.79c0.28,0,0.5-0.22,0.5-0.5v-3.79c0-0.45-0.54-0.67-0.85-0.35l-1.19,1.19L14.83,13.41z" />
							</svg>
						</div>
						<div onClick={this.prev} className="prev">
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="24px"
								height="24px"
								viewBox="0 0 24 24"
							>
								<path d="M7,6L7,6c0.55,0,1,0.45,1,1v10c0,0.55-0.45,1-1,1h0c-0.55,0-1-0.45-1-1V7C6,6.45,6.45,6,7,6z M10.66,12.82l5.77,4.07c0.66,0.47,1.58-0.01,1.58-0.82V7.93c0-0.81-0.91-1.28-1.58-0.82l-5.77,4.07C10.09,11.58,10.09,12.42,10.66,12.82z" />
							</svg>
						</div>
						<div ref="play" onClick={this.playPause} className={this.state.play ? 'play' : 'play pause'}>
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="48px"
								height="48px"
								viewBox="0 0 24 24"
							>
								<path />
							</svg>
						</div>
						<div onClick={this.next} className="next">
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="24px"
								height="24px"
								viewBox="0 0 24 24"
							>
								<path d="M7.58,16.89l5.77-4.07c0.56-0.4,0.56-1.24,0-1.63L7.58,7.11C6.91,6.65,6,7.12,6,7.93v8.14C6,16.88,6.91,17.35,7.58,16.89zM16,7v10c0,0.55,0.45,1,1,1h0c0.55,0,1-0.45,1-1V7c0-0.55-0.45-1-1-1h0C16.45,6,16,6.45,16,7z" />
							</svg>
						</div>
						<div onClick={this.loop} className={this.state.loop ? 'toggle-btn active' : 'toggle-btn'}>
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="24px"
								height="24px"
								viewBox="-4 -4 32 32"
							>
								<circle />
								<path d="M12,4V2.21c0-0.45-0.54-0.67-0.85-0.35L8.35,4.65c-0.2,0.2-0.2,0.51,0,0.71l2.79,2.79C11.46,8.46,12,8.24,12,7.79V6c3.31,0,6,2.69,6,6c0,0.79-0.15,1.56-0.44,2.25c-0.15,0.36-0.04,0.77,0.23,1.04v0c0.51,0.51,1.37,0.33,1.64-0.34C19.8,14.04,20,13.04,20,12C20,7.58,16.42,4,12,4z M12,18c-3.31,0-6-2.69-6-6c0-0.79,0.15-1.56,0.44-2.25c0.15-0.36,0.04-0.77-0.23-1.04l0,0C5.7,8.2,4.84,8.38,4.57,9.05C4.2,9.96,4,10.96,4,12c0,4.42,3.58,8,8,8v1.79c0,0.45,0.54,0.67,0.85,0.35l2.79-2.79c0.2-0.2,0.2-0.51,0-0.71l-2.79-2.79C12.54,15.54,12,15.76,12,16.21V18z" />
							</svg>
						</div>
					</div>
					<Slider
						scrubber={this.state.scrubber}
						loaded={this.state.loaded}
						play={this.play}
						pause={this.pause}
						onDone={this.onChange}
					/>
					<div className="navigation">
						<div
							onClick={() =>
								this.setState({
									screen: 'current'
								})}
							className={this.state.screen === 'current' ? 'navbutton selected' : 'navbutton'}
						>
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="24px"
								height="24px"
								viewBox="0 0 24 24"
							>
								<path d="M14,6H4C3.45,6,3,6.45,3,7v0c0,0.55,0.45,1,1,1h10c0.55,0,1-0.45,1-1v0C15,6.45,14.55,6,14,6z M14,10H4c-0.55,0-1,0.45-1,1v0c0,0.55,0.45,1,1,1h10c0.55,0,1-0.45,1-1v0C15,10.45,14.55,10,14,10z M4,16h6c0.55,0,1-0.45,1-1v0c0-0.55-0.45-1-1-1H4c-0.55,0-1,0.45-1,1v0C3,15.55,3.45,16,4,16z M19,6c-1.1,0-2,0.9-2,2v6.18C16.69,14.07,16.35,14,16,14c-1.84,0-3.28,1.64-2.95,3.54c0.21,1.21,1.2,2.2,2.41,2.41C17.36,20.28,19,18.84,19,17V8h2c0.55,0,1-0.45,1-1v0c0-0.55-0.45-1-1-1H19z" />
							</svg>
						</div>
						<div
							onClick={() =>
								this.setState({
									screen: 'playlists'
								})}
							className={this.state.screen === 'playlists' ? 'navbutton selected' : 'navbutton'}
						>
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="24px"
								height="24px"
								viewBox="0 0 24 24"
							>
								<path d="M12.6,18.06c-0.36,0.28-0.87,0.28-1.23,0l-6.15-4.78c-0.36-0.28-0.86-0.28-1.22,0l0,0c-0.51,0.4-0.51,1.17,0,1.57l6.76,5.26c0.72,0.56,1.73,0.56,2.46,0l6.76-5.26c0.51-0.4,0.51-1.17,0-1.57l-0.01-0.01c-0.36-0.28-0.86-0.28-1.22,0L12.6,18.06zM13.23,15.04l6.76-5.26c0.51-0.4,0.51-1.18,0-1.58l-6.76-5.26c-0.72-0.56-1.73-0.56-2.46,0L4.01,8.21c-0.51,0.4-0.51,1.18,0,1.58l6.76,5.26C11.49,15.61,12.51,15.61,13.23,15.04z" />
							</svg>
						</div>
						<div
							onClick={() =>
								this.setState({
									screen: 'search'
								})}
							className={this.state.screen === 'search' ? 'navbutton selected' : 'navbutton'}
						>
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								width="24px"
								height="24px"
								viewBox="0 0 24 24"
							>
								<path d="M15.5,14h-0.79l-0.28-0.27c1.2-1.4,1.82-3.31,1.48-5.34c-0.47-2.78-2.79-5-5.59-5.34c-4.23-0.52-7.79,3.04-7.27,7.27c0.34,2.8,2.56,5.12,5.34,5.59c2.03,0.34,3.94-0.28,5.34-1.48L14,14.71v0.79l4.25,4.25c0.41,0.41,1.08,0.41,1.49,0l0,0c0.41-0.41,0.41-1.08,0-1.49L15.5,14z M9.5,14C7.01,14,5,11.99,5,9.5S7.01,5,9.5,5S14,7.01,14,9.5S11.99,14,9.5,14z" />
							</svg>
						</div>
					</div>
				</div>
				<div className={this.state.dialog.show ? 'dialog-wrap active' : 'dialog-wrap'}>
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
