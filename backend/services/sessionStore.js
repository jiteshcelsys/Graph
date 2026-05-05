// In-memory store for parsed dataset rows (keyed by datasetId)
// In production, swap this for Redis or a temp DB table.
const store = new Map();

function set(id, data) {
  store.set(id, data);
}

function get(id) {
  return store.get(id) || null;
}

function remove(id) {
  store.delete(id);
}

module.exports = { set, get, remove };
