import React from "react";

export class Map extends React.Component {
  render() {
    return (
      <div>
        <section id="cd-google-map">
          <div id="google-container" />
          <div id="cd-zoom-in" />
          <div id="cd-zoom-out" />
          <address>86-90 Paul Street, London, EC2A 4NE</address>
        </section>
      </div>
    );
  }

  componentDidMount() {
    console.log('componentDidMount');
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }
}
