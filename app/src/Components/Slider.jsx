import React, { Component } from 'react';

class Slider extends Component {
    constructor(props) {
        super(props)
        this.state = {
            focused: false
        }
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onChange = this.onChange.bind(this)
        this.onMouseDown = this.onMouseDown.bind(this)
        this.onEnd = this.onEnd.bind(this)
        this.addDocumentMouseEvents = this.addDocumentMouseEvents.bind(this)
        this.removeDocumentEvents = this.removeDocumentEvents.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)
    }
    onChange(value) {
        let result = (value - this.dragOffset + 2) / this.elementWidth;
        if (result >= 0 && result < 1) {
            this.setState({
                focused: true
            });
            this.props.onDone(result)
        }
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
        this.props.pause();
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
        this.props.play();
        this.setState({
            focused: false
        });
    }

    onMouseMove(e) {
        const position = e.clientX;
        this.onChange(position);
    }
    render() {
        return (
            <div
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                className={
                    this.state.focused ? "scrubber-cont focused" : "scrubber-cont"
                }>
                <div className="scrubber-back line" />
                <div
                    style={{ width: this.props.loaded + "%" }}
                    className="loaded line"
                />
                <div
                    ref="progress"
                    style={{ width: this.props.scrubber + "%" }}
                    className="progress line"
                >
                    <div className="dot" />
                </div>
            </div>
        )
    }
}

export default Slider