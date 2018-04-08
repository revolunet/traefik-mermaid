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

const getDiagram = data => {
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

  // build the mermaid definition
  return `

graph LR

traefik

traefik-->Docker
traefik-->File

${data2.docker.frontends
    .map(frontend => {
      return (
        `Docker-->${frontend.id}` +
        "\n" +
        getBackend(frontend.backend)
          .getServers()
          .map(
            server => `${frontend.getBox()}-->${server.getBox()}
`
          )
          .join("\n")
      );
    })
    .join("\n")}

${data2.file.frontends
    .map(frontend => {
      return (
        `File-->${frontend.id}` +
        "\n" +
        getBackend(frontend.backend)
          .getServers()
          .map(
            server => `${frontend.getBox()}-->${server.getBox()}
`
          )
          .join("\n")
      );
    })
    .join("\n")}
`;
};

export default getDiagram;
