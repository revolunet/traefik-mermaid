import React from "react";
import { render } from "react-dom";

import Mermaid from "./Mermaid";
import Fetch from "./Fetch";
import getDiagram from "./getDiagram";

const TRAEFIK_API_URL = "http://traefik.local.sh/api/providers";

const FetchRenderer = ({ data, status, error }) => {
  if (data) {
    const diagram = getDiagram(data);
    return <Mermaid title="Sample diagram">{diagram}</Mermaid>;
  } else if (error) {
    return <div>ERROR: {error}</div>;
  }
  return <div>chargement...</div>;
};

const App = () => (
  <div>
    <Fetch interval={1000} url={TRAEFIK_API_URL} renderer={FetchRenderer} />
  </div>
);

render(<App />, document.getElementById("root"));
