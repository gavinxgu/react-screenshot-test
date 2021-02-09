import React, { Component } from "react";
import { render } from "react-dom";

export default class extends Component {
  render() {
    return (
      <div>
        <div>
          {typeof navigator !== "undefined"
            ? navigator.userAgent
            : "ssr has no navigator"}
        </div>
      </div>
    );
  }
}
