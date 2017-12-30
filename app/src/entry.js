import React from 'react'
import {render} from 'react-dom'
import App from './App.jsx'

render(
    <App/>,
    document.getElementById('app')
)

var url = new URL(window.location.href);
var c = url.searchParams.get("platform");
document.body.classList.add(c)
