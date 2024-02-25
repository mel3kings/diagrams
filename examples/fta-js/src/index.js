import { dia, shapes as defaultShapes, util, highlighters } from "@joint/core";
import { DirectedGraph } from "@joint/layout-directed-graph";
import { V } from "@joint/core";

import "../css/fta.css";

const Event = dia.Element.define(
    "fta.Event",
    {
        z: 3,
        attrs: {
            root: {
                pointerEvents: "bounding-box",
            },
            body: {
                strokeWidth: 2,
                stroke: "#ed2637",
                fill: {
                    type: "pattern",
                    attrs: {
                        width: 12,
                        height: 12,
                        "stroke-width": 2,
                        "stroke-opacity": 0.3,
                        stroke: "#ed2637",
                        fill: "none",
                    },
                    markup: util.svg`
                        <rect width="12" height="12" fill="#131e29" stroke="none" />
                        <path d="M 0 0 L 12 12 M 6 -6 L 18 6 M -6 6 L 6 18" />
                    `,
                },
            },
            label: {
                textWrap: {
                    height: -20,
                    width: -20,
                    ellipsis: true,
                },
                x: "calc(w / 2)",
                y: "calc(h / 2)",
                fontSize: 16,
                fontFamily: "sans-serif",
                fill: "#ffffff",
                textAnchor: "middle",
                textVerticalAnchor: "middle",
            },
        },
    },
    {
        // Prototype
    },
    {
        // Static
        create: function (text) {
            return new this({
                attrs: {
                    label: { text: text },
                },
            });
        },
    }
);

const ExternalEvent = Event.define(
    "fta.ExternalEvent",
    {
        size: {
            width: 80,
            height: 100,
        },
        attrs: {
            root: {
                title: "External Event",
            },
            body: {
                d: "M 0 20 calc(w / 2) 0 calc(w) 20 calc(w) calc(h) 0 calc(h) Z",
            },
        },
    },
    {
        markup: util.svg`
            <path @selector="body" />
            <text @selector="label" />
        `,
    }
);

const UndevelopedEvent = Event.define(
    "fta.UndevelopedEvent",
    {
        size: {
            width: 140,
            height: 80,
        },
        attrs: {
            root: {
                title: "Undeveloped Event",
            },
            body: {
                d: "M 0 calc(h / 2) calc(w / 2) calc(h) calc(w) calc(h / 2) calc(w / 2) 0 Z",
            },
        },
    },
    {
        markup: util.svg`
            <path @selector="body" />
            <text @selector="label" />
        `,
    }
);

const BasicEvent = Event.define(
    "fta.BasicEvent",
    {
        size: {
            width: 80,
            height: 80,
        },
        z: 3,
        attrs: {
            root: {
                title: "Basic Event",
            },
            body: {
                cx: "calc(w / 2)",
                cy: "calc(h / 2)",
                r: "calc(w / 2)",
            },
        },
    },
    {
        markup: util.svg`
            <circle @selector="body" />
            <text @selector="label" />
        `,
    }
);

const ConditioningEvent = Event.define(
    "fta.ConditioningEvent",
    {
        size: {
            width: 140,
            height: 80,
        },
        z: 2,
        attrs: {
            root: {
                title: "Conditioning Event",
            },
            body: {
                cx: "calc(w / 2)",
                cy: "calc(h / 2)",
                rx: "calc(w / 2)",
                ry: "calc(h / 2)",
            },
        },
    },
    {
        markup: util.svg`
            <ellipse @selector="body" />
            <text @selector="label" />
        `,
    }
);

const Link = dia.Link.define(
    "fta.Link",
    {
        attrs: {
            line: {
                connection: true,
                stroke: "#ed2637",
                strokeWidth: 2,
                strokeLinejoin: "round",
            },
        },
    },
    {
        markup: util.svg`
            <path @selector="line" fill="none" pointer-events="none" />
        `,
    },
    {
        create: function (event1, event2) {
            const source = {
                id: event1.id,
            };
            if (event1.get("type") === "fta.IntermediateEvent") {
                source.selector = "gate";
            } else {
                source.selector = "body";
            }
            if (event2.get("type") === "fta.ConditioningEvent") {
                source.anchor = { name: "perpendicular" };
            }
            return new this({
                z: 1,
                source,
                target: {
                    id: event2.id,
                    selector: "body",
                },
            });
        },
    }
);

const shapes = {
    ...defaultShapes,
    fta: {
        Event,
        ExternalEvent,
        UndevelopedEvent,
        BasicEvent,
        ConditioningEvent,
        Link,
    },
};

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({
    width: "100%",
    height: "100%",
    model: graph,
    defaultConnectionPoint: { name: "boundary", args: { offset: 5 } },
    defaultConnector: {
        name: "straight",
        args: { cornerType: "line", cornerRadius: 10 },
    },
    defaultRouter: { name: "orthogonal" },
    async: true,
    interactive: false,
    frozen: true,
    cellViewNamespace: shapes,
    background: { color: "#131e29" },
    viewport: function (view) {
        const { model } = view;
        if (!view) return true;
        return !model.get("hidden");
    },
});

const color = "#ff4468";

paper.svg.prepend(
    V.createSVGStyle(`
        .joint-element .selection {
            stroke: ${color};
        }
        .joint-link .selection {
            stroke: ${color};
            stroke-dasharray: 5;
            stroke-dashoffset: 10;
            animation: dash 0.5s infinite linear;
        }
        @keyframes dash {
            to {
                stroke-dashoffset: 0;
            }
        }
    `)
);

document.getElementById("paper-container").appendChild(paper.el);

paper.on({
    "element:pointerclick": (elementView) => {
        selectElement(elementView.model);
    },
    "blank:pointerclick": (elementView) => selectElement(null),
});

function getElementPredecessorLinks(el) {
    return graph
        .getSubgraph([el, ...graph.getPredecessors(el)])
        .filter((cell) => cell.isLink());
}

function highlightCell(cell) {
    highlighters.addClass.add(
        cell.findView(paper),
        cell.isElement() ? "body" : "line",
        "selection",
        { className: "selection" }
    );
}

function unhighlightCell(cell) {
    highlighters.addClass.remove(cell.findView(paper), "selection");
}

let selection = null;

function selectElement(el) {
    console.log("selecting", el);
    if (selection === el) return;
    if (selection) {
        unhighlightCell(selection);
        graph.getLinks().forEach((link) => unhighlightCell(link));
    }
    if (el) {
        highlightCell(el);
        getElementPredecessorLinks(el).forEach((link) => highlightCell(link));
        selection = el;
    } else {
        selection = null;
    }
}

const events = [
    BasicEvent.create("Safety Belt Broken"),
    element(300, 50),
    element(100, 200),
    element(300, 200),
    element(500, 200),
    element(300, 350),
    element(40, 350),
    element(160, 350),
    element(160, 500),
    element(160, 500),
    UndevelopedEvent.create("Upholder Broken"),
    ExternalEvent.create("Take off When Walking"),
];

const links = [
    Link.create(events[0], events[3]),
    Link.create(events[1], events[3]),
    Link.create(events[1], events[2]),
    Link.create(events[1], events[4]),
    Link.create(events[2], events[6]),
    Link.create(events[2], events[7]),
    Link.create(events[3], events[5]),
    Link.create(events[7], events[8]),
    Link.create(events[9], events[0]),
];

const el1 = element(300, 50);
const el3 = element(300, 50);
link(el1, el3);

graph.resetCells(events.concat(links));

runLayout(graph);

paper.transformToFitContent({
    padding: 20,
    contentArea: graph.getBBox(),
    verticalAlign: "middle",
    horizontalAlign: "middle",
});

paper.unfreeze();

// Functions

function runLayout(graph) {
    const autoLayoutElements = [];
    const manualLayoutElements = [];
    graph.getElements().forEach((el) => {
        if (el.get("hidden")) return;
        if (el.get("type") === "fta.ConditioningEvent") {
            manualLayoutElements.push(el);
        } else {
            autoLayoutElements.push(el);
        }
    });
    // Automatic Layout
    DirectedGraph.layout(graph.getSubgraph(autoLayoutElements), {
        rankDir: "TB",
        setVertices: true,
    });
    // Manual Layout
    manualLayoutElements.forEach((el) => {
        const [neighbor] = graph.getNeighbors(el, { inbound: true });
        if (!neighbor) return;
        const neighborPosition = neighbor.getBBox().bottomRight();
        el.position(
            neighborPosition.x + 20,
            neighborPosition.y - el.size().height / 2 - 15
        );
    });
    // Make sure the root element of the graph is always at the same position after the layout.
    const rootCenter = { x: 500, y: 100 };
    const [source] = graph.getSources();
    const { width, height } = source.size();
    const diff = source.position().difference({
        x: rootCenter.x - width / 2,
        y: rootCenter.y - height / 2,
    });
    graph.translate(-diff.x, -diff.y);
}

function element(x, y) {
    const el = new shapes.standard.Rectangle({
        position: { x, y },
        size: { width: 100, height: 60 },
        attrs: {
            label: {
                text: `Node ${graph.getElements().length + 1}`,
                fontFamily: "sans-serif",
            },
        },
        z: 2,
    });
    graph.addCell(el);
    return el;
}

function link(target, source) {
    const l = new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
        z: 1,
    });
    graph.addCell(l);
    return l;
}
