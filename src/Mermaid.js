import React from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false
});

export default class Mermaid extends React.Component {
  state = {
    diagram: null
  };

  updateDiagram() {
    const diagram = this.props.children.toString();
    mermaid.render("title", diagram, svg => {
      this.setState({
        diagram: svg
      });
    });
  }
  componentDidMount() {
    this.updateDiagram();
  }

  componentWillReceiveProps(nextProps) {
    this.updateDiagram();
  }

  render() {
    return <div className="mermaid" dangerouslySetInnerHTML={{ __html: this.state.diagram }} />;
  }
}
