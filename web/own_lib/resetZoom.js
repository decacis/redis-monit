window.addEventListener('load', () => {

    // Basic
    document.getElementById('connectedClients').addEventListener('dblclick', () => {
        charts.basic.connected_clients.resetZoom();
    })
    document.getElementById('connectedSlaves').addEventListener('dblclick', () => {
        charts.basic.connected_slaves.resetZoom();
    })

    // Performance
    document.getElementById('latency').addEventListener('dblclick', () => {
        charts.performance.latency_ms.resetZoom();
    })
    document.getElementById('instantaneousOpsPerSec').addEventListener('dblclick', () => {
        charts.performance.instantaneous_ops_per_sec.resetZoom();
    })
    document.getElementById('hitRate').addEventListener('dblclick', () => {
        charts.performance.hit_rate.resetZoom();
    })

    // Memory
    document.getElementById('usedMemory').addEventListener('dblclick', () => {
        charts.memory.used_memory.resetZoom();
    })
    document.getElementById('memFragmentationRatio').addEventListener('dblclick', () => {
        charts.memory.mem_fragmentation_ratio.resetZoom();
    })
    document.getElementById('evictedKeys').addEventListener('dblclick', () => {
        charts.memory.evicted_keys.resetZoom();
    })
    document.getElementById('blockedClients').addEventListener('dblclick', () => {
        charts.memory.blocked_clients.resetZoom();
    })

    // Persistence
    document.getElementById('rdbChangesSinceLastSave').addEventListener('dblclick', () => {
        charts.persistence.rdb_changes_since_last_save.resetZoom();
    })

    // Error
    document.getElementById('rejectedConnections').addEventListener('dblclick', () => {
        charts.error.rejected_connections.resetZoom();
    })
    document.getElementById('keyspaceMisses').addEventListener('dblclick', () => {
        charts.error.keyspace_misses.resetZoom();
    })

})