import client from "prom-client";


export const register = new client.Registry();
client.collectDefaultMetrics({ register });


export const httpRequestDuration = new client.Histogram({
name: "http_request_duration_seconds",
help: "HTTP latency by route",
labelNames: ["method", "route", "status_code"],
buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);


export const activePlacements = new client.Gauge({
name: "active_placements",
help: "Currently active placements"
});
register.registerMetric(activePlacements);


export const metricsHandler = async (_req, res) => {
res.set("Content-Type", register.contentType);
res.end(await register.metrics());
};