import React from 'react'
import {render} from 'react-dom'
import App from './App.jsx'
import { platform } from 'os';
import { webFrame } from 'electron';
import settings from 'electron-settings'

render(
    <App/>,
    document.getElementById('app')
)
webFrame.setZoomLevelLimits(1, 1);
document.body.classList.add(platform())
document.body.classList.add(settings.has('settings.theme') ? settings.get('settings.theme') : 'white')