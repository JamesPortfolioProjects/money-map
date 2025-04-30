const nodes = new vis.DataSet([
  { id: 1, label: '💲 Money', shape: 'ellipse', color: '#0077ff', font: { color: 'white' } },
  { id: 2, label: 'Income', group: 'income' },
  { id: 3, label: 'Expenses', group: 'expense' },
  { id: 4, label: 'Investments', group: 'investment' },
  { id: 5, label: 'Dead Spending', group: 'dead' }
]);

const edges = new vis.DataSet([
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 1, to: 5 }
]);

const container = document.getElementById('network');
const data = { nodes: nodes, edges: edges };
const options = {
  nodes: {
    shape: 'box',
    font: { face: 'Segoe UI' }
  },
  groups: {
    income: { color: { background: '#28a745', border: '#1e7e34' } },
    expense: { color: { background: '#dc3545', border: '#c82333' } },
    investment: { color: { background: '#17a2b8', border: '#117a8b' } },
    dead: { color: { background: '#6c757d', border: '#5a6268' } }
  },
  edges: {
    arrows: 'to',
    color: 'gray'
  },
  interaction: {
    navigationButtons: true,
    hover: true
  },
  physics: {
    stabilization: true
  }
};

const network = new vis.Network(container, data, options);

// Modal
const modal = document.getElementById('modal');
const openModal = document.getElementById('add-node-btn');
const closeModal = document.getElementById('close-modal');
const createNodeBtn = document.getElementById('create-node-btn');

openModal.onclick = () => { modal.style.display = "block"; };
closeModal.onclick = () => { modal.style.display = "none"; };
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

// Create Node
createNodeBtn.onclick = () => {
  const label = document.getElementById('node-label').value;
  const group = document.getElementById('node-group').value;
  const url = document.getElementById('node-url').value;
  if (!label) return alert('Please enter a node title.');
  const newId = nodes.length + Math.floor(Math.random() * 1000) + 10;
  nodes.add({ id: newId, label, group, url: url || undefined });
  edges.add({ from: 1, to: newId });
  modal.style.display = "none";
};

// Save Map
document.getElementById('save-map-btn').onclick = () => {
  const saveData = {
    nodes: nodes.get(),
    edges: edges.get()
  };
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: "application/json;charset=utf-8" });
  saveAs(blob, "money-map.json");
};

// Load Map
document.getElementById('load-map-btn').onclick = () => {
  document.getElementById('load-map-input').click();
};
document.getElementById('load-map-input').addEventListener('change', (event) => {
  const reader = new FileReader();
  reader.onload = function(e) {
    const content = JSON.parse(e.target.result);
    nodes.clear();
    edges.clear();
    nodes.add(content.nodes);
    edges.add(content.edges);
  };
  reader.readAsText(event.target.files[0]);
};

// Click node to open URL
network.on("click", function (params) {
  if (params.nodes.length) {
    const nodeId = params.nodes[0];
    const node = nodes.get(nodeId);
    if (node.url) {
      window.open(node.url, '_blank');
    }
  }
});
