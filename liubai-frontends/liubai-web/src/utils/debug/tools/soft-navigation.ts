import { nextTick } from "vue";
import {
	START_LOCATION,
	type RouteLocationNormalized,
	type Router,
} from "vue-router";

const PREFIX = "liubai:soft-nav";
const MAX_TRACES = 50;
let sequence = 0;

interface Trace {
	start: string;
	resolved: string;
	paint: string;
	routerMeasure: string;
	paintMeasure: string;
}

// Unnamed routes never fall back to URL paths, which may contain business IDs.
function getRouteLabel(route: RouteLocationNormalized) {
	return typeof route.name === "string"
		? route.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "unknown"
		: "unknown";
}

/** User Timing annotations; these do not enable or replace Chrome's soft navigation metrics. */
export function installSoftNavigationPerformanceTracking(router: Router) {
	if (
		typeof performance === "undefined" ||
		typeof performance.mark !== "function" ||
		typeof performance.measure !== "function" ||
		typeof performance.clearMarks !== "function" ||
		typeof performance.clearMeasures !== "function"
	)
		return () => {};

	let disposed = false;
	let pending: { to: RouteLocationNormalized; trace: Trace } | undefined;
	let visualTrace: Trace | undefined;
	let frame: number | undefined;
	const retained: Trace[] = [];

	const clear = (trace: Trace) => {
		performance.clearMarks(trace.start);
		performance.clearMarks(trace.resolved);
		performance.clearMarks(trace.paint);
		performance.clearMeasures(trace.routerMeasure);
		performance.clearMeasures(trace.paintMeasure);
	};
	const cancelVisual = () => {
		if (frame !== undefined) cancelAnimationFrame(frame);
		frame = undefined;
		visualTrace = undefined;
	};
	const cancelPending = () => {
		if (pending) clear(pending.trace);
		pending = undefined;
	};

	const removeBeforeEach = router.beforeEach((to, from) => {
		cancelPending();
		cancelVisual();
		if (from === START_LOCATION) return;
		const base = `${PREFIX}:${getRouteLabel(to)}:${++sequence}`;
		const trace: Trace = {
			start: `${base}:start`,
			resolved: `${base}:resolved`,
			paint: `${base}:paint`,
			routerMeasure: `${base}:router`,
			paintMeasure: `${base}:paint-duration`,
		};
		performance.mark(trace.start);
		pending = { to, trace };
	});

	const removeAfterEach = router.afterEach((to, _from, failure) => {
		// A cancelled older navigation can finish after a newer one has started,
		// even with the same fullPath; Vue Router passes the same `to` object to both hooks.
		if (pending?.to !== to) return;
		const { trace } = pending;
		pending = undefined;
		if (failure) {
			clear(trace);
			return;
		}
		performance.mark(trace.resolved);
		performance.measure(trace.routerMeasure, trace.start, trace.resolved);
		retained.push(trace);
		if (retained.length > MAX_TRACES) {
			const oldest = retained.shift();
			if (oldest) clear(oldest);
		}

		// Double rAF is a paint opportunity estimate, not a confirmed paint timestamp.
		// Hidden documents and browsers without rAF only get router timing.
		if (
			typeof requestAnimationFrame !== "function" ||
			typeof cancelAnimationFrame !== "function" ||
			typeof document === "undefined" ||
			document.hidden
		)
			return;
		visualTrace = trace;
		void nextTick(() => {
			if (disposed || visualTrace !== trace) return;
			frame = requestAnimationFrame(() => {
				frame = requestAnimationFrame(() => {
					frame = undefined;
					if (disposed || visualTrace !== trace || document.hidden) return;
					performance.mark(trace.paint);
					performance.measure(trace.paintMeasure, trace.start, trace.paint);
					visualTrace = undefined;
				});
			});
		});
	});
	const removeError = router.onError(cancelPending);

	return () => {
		disposed = true;
		removeBeforeEach();
		removeAfterEach();
		removeError();
		cancelPending();
		cancelVisual();
		for (const trace of retained) clear(trace);
		retained.length = 0;
	};
}
