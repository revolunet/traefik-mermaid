import React from "react";

export default class Fetch extends React.Component {
  state = {
    status: null,
    data: null,
    error: null
  };
  fetch = () => {
    // call to native fetch
    return fetch(this.props.url)
      .then(r => r.json())
      .then(data => {
        this.setState({
          status: "success",
          data
        });
      })
      .catch(e => {
        this.setState(
          {
            status: "error",
            error: e.message
          },
          () => {
            // throw e;
            console.log(e);
          }
        );
      });
  };
  componentDidMount() {
    this.fetch();
    if (this.props.interval) {
      this.interval = setInterval(this.fetch, this.props.interval);
    }
  }
  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
  render() {
    return this.props.renderer(this.state);
  }
}
