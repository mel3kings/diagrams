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
        .joint-link {
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

const FE = element(100, 100, "NextJS Frontend");
console.log(FE.attributes.attrs?.label?.text);

const events = [
    element(100, 100, "NextJS Frontend"),
    element(200, 100, "NextJS Backend"),
    element(300, 100, "Route 53 (DNS)"),
    element(400, 100, "SquareSpace"),
    element(600, 100, "OpenAI API"),
    element(700, 100, "Auth0"),
    element(800, 100, "IDP"),
    element(900, 100, "Google"),
    element(1000, 100, "Email"),
    element(1100, 100, "DynamoDB"),
    element(1200, 100, "AWS EventBridge"),
    element(1300, 100, "Stripe"),
    element(1400, 100, "AWS Cloudwatch"),
    element(1500, 100, "AWS Lambda"),
    element(1600, 100, "AWS Amplify"),
    ExternalEvent.create("Send Email"),
    ExternalEvent.create("Bank"),
    BasicEvent.create("User"),
    ExternalEvent.create("Github"),
    element(500, 100, "Tailwind"),
];

// Store events by their unique identifier
const eventsByLabel = {};
events.forEach((event) => {
    eventsByLabel[event.attributes.attrs?.label?.text] = event;
});

console.log(eventsByLabel);
const links = [
    Link.create(eventsByLabel["User"], eventsByLabel["Route 53 (DNS)"]),
    Link.create(eventsByLabel["SquareSpace"], eventsByLabel["Route 53 (DNS)"]),
    Link.create(
        eventsByLabel["Route 53 (DNS)"],
        eventsByLabel["NextJS Frontend"]
    ),
    Link.create(
        eventsByLabel["NextJS Backend"],
        eventsByLabel["NextJS Frontend"]
    ),
    Link.create(eventsByLabel["NextJS Backend"], eventsByLabel["OpenAI API"]),
    Link.create(eventsByLabel["Auth0"], eventsByLabel["IDP"]),
    Link.create(eventsByLabel["IDP"], eventsByLabel["Google"]),
    Link.create(eventsByLabel["IDP"], eventsByLabel["Email"]),
    Link.create(eventsByLabel["DynamoDB"], eventsByLabel["AWS EventBridge"]),
    Link.create(eventsByLabel["AWS Amplify"], eventsByLabel["AWS Cloudwatch"]),

    Link.create(eventsByLabel["AWS EventBridge"], eventsByLabel["AWS Lambda"]),
    Link.create(eventsByLabel["AWS Lambda"], eventsByLabel["Send Email"]),
    Link.create(eventsByLabel["Stripe"], eventsByLabel["Bank"]),
    Link.create(eventsByLabel["NextJS Backend"], eventsByLabel["Auth0"]),
    Link.create(eventsByLabel["NextJS Backend"], eventsByLabel["DynamoDB"]),
    Link.create(eventsByLabel["NextJS Backend"], eventsByLabel["Stripe"]),
    Link.create(eventsByLabel["NextJS Backend"], eventsByLabel["AWS Amplify"]),
];

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

function element(x, y, label = "") {
    const el = new shapes.standard.Rectangle({
        position: { x, y },
        size: { width: 130, height: 60 },
        attrs: {
            label: {
                text: `${label}`,
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
