import React, {Component} from 'react'
import {render} from 'react-dom'
class Track extends Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    handleClick() {
        this.props.onClick()
      }
    render() {
        var styles = {
            backgroundImage: music[this.props.i].cover_css ? 'url('+ music[this.props.i].cover_css.split('url(')[1].split(')')[0] + ')' : ''
        }
        var selected = music[this.props.i].selected ? "track  -selected" : "track"
        var even = this.props.i % 2 ? "even" : ""
        var classNames =  selected + ' ' + even
        
        return (
            <div onClick={this.handleClick} className={classNames}>
                <div style={styles} className={music[this.props.i].cover_css ? 'track-album' : 'track-album noimage'}></div>
                <div className="track-content">
                    <p className="track-name">{music[this.props.i].title}</p>
                    <p className="track-artist">{music[this.props.i].artist}</p>
                </div>
            </div>)
    }
}
export default Track;
