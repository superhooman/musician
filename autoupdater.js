'use strict';
const os = require('os');
const {app, autoUpdater, dialog} = require('electron');
const version = app.getVersion();
const platform = os.platform() + '_' + os.arch();  // usually returns darwin_64

const updaterFeedURL = 'http://musician-vk.herokuapp.com/update/' + platform + '/' + version;
// replace updaterFeedURL with http://yourappname.herokuapp.com

function appUpdater() {
	autoUpdater.setFeedURL(updaterFeedURL);
	/* Log whats happening
	TODO send autoUpdater events to renderer so that we could console log it in developer tools
	You could alsoe use nslog or other logging to see what's happening */
	autoUpdater.on('error', err => console.log(err));
	autoUpdater.on('checking-for-update', () => console.log('checking-for-update'));
	autoUpdater.on('update-available', () => console.log('update-available'));
	autoUpdater.on('update-not-available', () => console.log('update-not-available'));

	// Ask the user if update is available
	autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
		let message = app.getName() + ' ' + releaseName + ' досупен. Он будет загружен и обновлен при следующем запуске.';
		if (releaseNotes) {
			const splitNotes = releaseNotes.split(/[^\r]\n/);
			message += '\n\nЧто нового:\n';
			splitNotes.forEach(notes => {
				message += notes + '\n\n';
			});
		}
		// Ask user to update the app
		dialog.showMessageBox({
			type: 'question',
			buttons: ['Установить и перезапустить', 'Позже'],
			defaultId: 0,
			message: 'Новая версия ' + app.getName() + ' была загружена',
			detail: message
		}, response => {
			if (response === 0) {
				setTimeout(() => autoUpdater.quitAndInstall(), 1);
			}
		});
	});
	// init for updates
	autoUpdater.checkForUpdates();
}

exports = module.exports = {
	appUpdater
};