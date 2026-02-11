import Head from "next/head";
import { useMemo, useState } from "react";
import styles from "../styles/Home.module.css";

const AGENTS = {
  conserje: {
    id: "conserje",
    title: "Conserje",
    role: "Router de intención",
    icon: "🧭",
    color: "#6fe0ff",
    description: "Clasifica la pregunta y decide a qué experto llamar.",
  },
  arquitecto: {
    id: "arquitecto",
    title: "Arquitecto",
    role: "Buscador de proyectos",
    icon: "🧱",
    color: "#8dff9c",
    description: "Busca proyectos, repos y demos relevantes.",
  },
  historiador: {
    id: "historiador",
    title: "Historiador",
    role: "Experto de CV",
    icon: "📜",
    color: "#ffcc7a",
    description: "Recupera experiencia, estudios y trayectoria.",
  },
  sintetizador: {
    id: "sintetizador",
    title: "Sintetizador",
    role: "Respuesta final",
    icon: "🎼",
    color: "#ca9cff",
    description: "Compila contexto y redacta la respuesta final.",
  },
};

const demoPrompts = [
  "¿Qué proyectos tienes usando Docker y Kubernetes?",
  "Cuéntame tu experiencia laboral y stack principal.",
  "¿Cómo explicaría tus decisiones técnicas a un CTO?",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeAgent, setActiveAgent] = useState(null);
  const [activeTool, setActiveTool] = useState(false);
  const [phaseText, setPhaseText] = useState("El Director espera una nueva consulta...");
  const [running, setRunning] = useState(false);
  const [flowEvents, setFlowEvents] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: "Bienvenido a la sala de control. Haz una pregunta para ver cómo se coordinan los agentes.",
    },
  ]);

  const activePath = useMemo(() => {
    if (!activeAgent) return "director";
    return `director-${activeAgent}`;
  }, [activeAgent]);

  const graphNodes = useMemo(
    () => [
      { id: "director", x: 43, y: 10, label: "🎩 Director", subtitle: "Coordinador principal" },
      { id: "conserje", x: 2, y: 45, label: "🧭 Conserje", subtitle: "Router de intención" },
      { id: "arquitecto", x: 30, y: 45, label: "🧱 Arquitecto", subtitle: "Buscador de proyectos" },
      { id: "historiador", x: 57, y: 45, label: "📜 Historiador", subtitle: "Experto de CV" },
      { id: "sintetizador", x: 84, y: 45, label: "🎼 Sintetizador", subtitle: "Respuesta final" },
      { id: "tooling", x: 43, y: 78, label: "🛢️ PostgreSQL / Tools", subtitle: "Context retrieval" },
    ],
    [],
  );

  const graphEdges = useMemo(
    () => [
      { from: "director", to: "conserje", key: "director-conserje", color: AGENTS.conserje.color },
      { from: "director", to: "arquitecto", key: "director-arquitecto", color: AGENTS.arquitecto.color },
      { from: "director", to: "historiador", key: "director-historiador", color: AGENTS.historiador.color },
      {
        from: "director",
        to: "sintetizador",
        key: "director-sintetizador",
        color: AGENTS.sintetizador.color,
      },
      { from: "arquitecto", to: "tooling", key: "arquitecto-tooling", color: "#63ffe6", tool: true },
      { from: "historiador", to: "tooling", key: "historiador-tooling", color: "#88a5e5", dashed: true },
    ],
    [],
  );

  const nodeMap = useMemo(
    () => graphNodes.reduce((acc, node) => ({ ...acc, [node.id]: node }), {}),
    [graphNodes],
  );

  const logEvent = (title, details) => {
    setFlowEvents((prev) => [{ id: `${Date.now()}-${Math.random()}`, title, details }, ...prev]);
  };

  const typeAssistantMessage = async (text) => {
    const messageId = `assistant-${Date.now()}`;
    setChatMessages((prev) => [...prev, { id: messageId, sender: "assistant", text: "" }]);

    for (const char of text) {
      await wait(18);
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                text: `${msg.text}${char}`,
              }
            : msg,
        ),
      );
    }
  };

  const classifyRoute = (text) => {
    const normalized = text.toLowerCase();
    if (["proyecto", "github", "demo", "docker", "kubernetes", "repo"].some((k) => normalized.includes(k))) {
      return "arquitecto";
    }
    return "historiador";
  };

  const runOrchestration = async (userQuestion) => {
    const route = classifyRoute(userQuestion);
    const routeAgent = AGENTS[route];

    setRunning(true);
    setFlowEvents([]);
    setActiveTool(false);

    setPhaseText("El Director recibe la consulta y activa al Conserje...");
    setActiveAgent("conserje");
    logEvent("Conserje", "Analizando intención del usuario...");
    await wait(1100);

    setPhaseText(`Conserje clasifica la consulta y la deriva a ${routeAgent.title}.`);
    logEvent("Conserje", `Ruta seleccionada: ${routeAgent.title} (${routeAgent.role}).`);
    setActiveAgent(route);
    await wait(900);

    if (route === "arquitecto") {
      setActiveTool(true);
      setPhaseText("Arquitecto consulta PostgreSQL y repositorios de proyectos...");
      logEvent("Herramienta", "search_projects(query) + PostgreSQL activado.");
      await wait(1000);
      setActiveTool(false);
    } else {
      setPhaseText("Historiador revisa el CV estructurado del candidato...");
      logEvent("Historiador", "Extrayendo resumen profesional y experiencia.");
      await wait(1000);
    }

    setActiveAgent("sintetizador");
    setPhaseText("Sintetizador redacta la respuesta final con el contexto recuperado...");
    logEvent("Sintetizador", "Compilando respuesta final para el chat.");
    await wait(900);

    const responseText =
      route === "arquitecto"
        ? "Claro. El candidato lideró iniciativas con Docker, orquestación en Kubernetes y despliegues automatizados en entornos cloud, además de proyectos full stack con foco en observabilidad y CI/CD."
        : "El candidato es Full Stack con enfoque en producto: combina backend en Python/Node, frontend moderno en React/Next.js y práctica sólida en arquitectura, colaboración y entrega continua.";

    await typeAssistantMessage(responseText);

    setActiveAgent(null);
    setPhaseText("Respuesta entregada. El Director espera la siguiente consulta...");
    setRunning(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || running) return;

    setChatMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: "user", text: trimmed }]);
    setQuery("");
    await runOrchestration(trimmed);
  };

  return (
    <>
      <Head>
        <title>Portfolio AI Orchestrator</title>
        <meta
          name="description"
          content="Chat interactivo con visualización en tiempo real de agentes LangGraph."
        />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Portfolio AI Experience</p>
            <h1>Director de Orquesta de Conocimiento</h1>
          </div>
          <span className={styles.status}>{running ? "Orquestando..." : "Idle"}</span>
        </header>

        <main className={styles.mainGrid}>
          <section className={styles.chatPanel}>
            <h2>Chat principal</h2>
            <div className={styles.messages}>
              {chatMessages.map((message) => (
                <article
                  key={message.id}
                  className={`${styles.message} ${
                    message.sender === "user" ? styles.userMessage : styles.assistantMessage
                  }`}
                >
                  <span>{message.sender === "user" ? "Tú" : "Asistente"}</span>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>

            <form className={styles.inputRow} onSubmit={handleSubmit}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Escribe tu consulta sobre proyectos, experiencia o stack técnico..."
                disabled={running}
              />
              <button type="submit" disabled={running || !query.trim()}>
                {running ? "Procesando" : "Enviar"}
              </button>
            </form>

            <div className={styles.quickPrompts}>
              {demoPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => setQuery(prompt)} disabled={running}>
                  {prompt}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.orchestratorPanel}>
            <h2>Panel de agentes</h2>
            <p className={styles.phaseText}>{phaseText}</p>

            <div className={styles.graphCard}>
              <svg viewBox="0 0 100 100" className={styles.graphLines} preserveAspectRatio="none">
                <defs>
                  <marker
                    id="arrow"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path d="M0,0 L6,3 L0,6 z" fill="#9ab2ec" />
                  </marker>
                </defs>
                {graphEdges.map((edge) => {
                  const from = nodeMap[edge.from];
                  const to = nodeMap[edge.to];
                  const isActive = edge.tool ? activeTool : activePath === edge.key;
                  return (
                    <line
                      key={edge.key}
                      x1={from.x + 7}
                      y1={from.y + 8}
                      x2={to.x + 7}
                      y2={to.y}
                      className={`${styles.edgeLine} ${isActive ? styles.edgeLineActive : ""}`}
                      style={{
                        stroke: isActive ? edge.color : "rgba(125, 153, 226, 0.42)",
                        strokeDasharray: edge.dashed ? "2 2" : "none",
                        markerEnd: "url(#arrow)",
                      }}
                    />
                  );
                })}
              </svg>

              {graphNodes.map((node) => {
                const isActiveAgent = activeAgent === node.id;
                const isTool = node.id === "tooling";
                return (
                  <article
                    key={node.id}
                    className={`${styles.graphNode} ${
                      isActiveAgent || (isTool && activeTool) ? styles.graphNodeActive : ""
                    }`}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    <strong>{node.label}</strong>
                    <small>{node.subtitle}</small>
                  </article>
                );
              })}
            </div>

            <div className={styles.eventsPanel}>
              <h3>Eventos de ejecución</h3>
              {flowEvents.length === 0 ? (
                <p>Aquí aparecerán los pasos emitidos por LangGraph/SSE.</p>
              ) : (
                <ul>
                  {flowEvents.map((eventItem) => (
                    <li key={eventItem.id}>
                      <strong>{eventItem.title}</strong>
                      <span>{eventItem.details}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
