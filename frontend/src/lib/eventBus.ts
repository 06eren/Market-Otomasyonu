// Simple event bus for real-time cross-component communication
// Usage: eventBus.emit('sale') → all listeners for 'sale' fire

type Handler = () => void;
const listeners: Record<string, Set<Handler>> = {};

const eventBus = {
    on(event: string, handler: Handler) {
        if (!listeners[event]) listeners[event] = new Set();
        listeners[event].add(handler);
        return () => { listeners[event]?.delete(handler); };
    },
    emit(event: string) {
        listeners[event]?.forEach(fn => fn());
    }
};

export default eventBus;
