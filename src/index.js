import React from "react";
import { render } from "react-dom";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false
});

const TRAEFIK_API_URL = "http://traefik.local.sh/api/providers";

class Mermaid extends React.Component {
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

class Fetch extends React.Component {
  state = {
    status: null,
    data: null,
    error: null
  };
  fetch() {
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
            throw e;
          }
        );
      });
  }
  componentDidMount() {
    this.fetch();
    if (this.props.interval) {
      this.interval = setInterval(this.fetch.bind(this), this.props.interval);
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

const frontend = (source, id, params) => {
  const getHostname = () => {
    if (!params.routes) {
      return null;
    }
    return Object.keys(params.routes)
      .map(k => params.routes[k].rule)
      .filter(Boolean)
      .filter(rule => rule.match(/^Host:/i))[0]
      .replace(/^(Host:)/i, "");
  };
  return {
    type: "frontend",
    source,
    id,
    ...params,
    getHostname,
    getBox: () => `${id}[${getHostname()}]`
  };
};

const backend = (source, id, params) => {
  return {
    type: "backend",
    source,
    id,
    ...params,
    getServers: () =>
      Object.keys(params.servers).map(k => ({
        id: k,
        ...params.servers[k],
        getBox: () => `${k}[${params.servers[k].url}]`
      }))
  };
};

const getDiagramFromTraefik = data => {
  // data massage
  const data2 = {
    docker: {
      backends: Object.keys(data.docker.backends).map(key =>
        backend("docker", key, data.docker.backends[key])
      ),
      frontends: Object.keys(data.docker.frontends)
        .map(key => frontend("docker", key, data.docker.frontends[key]))
        .reduce((a, c) => {
          if (!a.find(x => x.getHostname() === c.getHostname())) a.push(c);
          return a;
        }, [])
    },
    file: {
      backends: Object.keys(data.file.backends).map(key =>
        backend("file", key, data.file.backends[key])
      ),
      frontends: Object.keys(data.file.frontends).map(key =>
        frontend("file", key, data.file.frontends[key])
      )
    }
  };

  const getBackend = backendId => {
    let backend = data2.docker.backends.find(b => b.id === backendId);
    if (!backend) {
      backend = data2.file.backends.find(b => b.id === backendId);
    }
    return backend;
  };

  return `

graph LR

traefik

traefik-->Docker
traefik-->File

${data2.docker.frontends
    .map(f => {
      return (
        `Docker-->${f.id}` +
        "\n" +
        getBackend(f.backend)
          .getServers()
          .map(
            s => `
${f.getBox()}-->${s.getBox()}`
          )
          .join("\n")
      );
    })
    .join("\n")}

${data2.file.frontends
    .map(f => {
      return (
        `File-->${f.id}` +
        "\n" +
        getBackend(f.backend)
          .getServers()
          .map(
            s => `
${f.getBox()}-->${s.getBox()}`
          )
          .join("\n")
      );
    })
    .join("\n")}
`;
};

const Providers = ({ data, status, error }) => {
  if (data) {
    const diagram = getDiagramFromTraefik(data);
    return <Mermaid title="hello">{diagram}</Mermaid>;
  } else if (error) {
    return <div>ERROR: {error}</div>;
  }
  return <div>chargement...</div>;
};

const App = () => (
  <div>
    <Fetch interval={1000} url={TRAEFIK_API_URL} renderer={Providers} />
  </div>
);

render(<App />, document.getElementById("root"));
