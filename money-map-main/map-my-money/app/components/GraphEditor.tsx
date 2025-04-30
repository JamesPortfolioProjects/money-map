'use client';

import { useEffect, useRef, useState } from 'react';
import { DataSet, Network, Node, Edge } from 'vis-network/standalone/esm/vis-network';
import { supabase } from '@/lib/supabaseBrowser';
import { v4 as uuidv4 } from 'uuid';

export default function GraphEditor() {
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);
  const nodesRef = useRef<DataSet<Node>>(new DataSet());
  const edgesRef = useRef<DataSet<Edge>>(new DataSet());

  const [showForm, setShowForm] = useState(false);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeType, setNodeType] = useState('income');
  const [editNodeId, setEditNodeId] = useState<number | null>(null);

  const [mapList, setMapList] = useState<{ id: string; name: string }[]>([]);
  const [loadingMaps, setLoadingMaps] = useState(false);

  const colorMap: Record<string, string> = {
    income: '#28a745',
    expense: '#dc3545',
    investment: '#17a2b8',
    dead: '#6c757d'
  };

  useEffect(() => {
    if (!networkRef.current) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    nodes.clear();
    edges.clear();

    nodes.add([
      { id: 1, label: '💲 Money', color: '#007bff' },
      { id: 2, label: 'Income', color: '#28a745' },
      { id: 3, label: 'Expenses', color: '#dc3545' }
    ]);

    edges.add([
      { from: 1, to: 2 },
      { from: 1, to: 3 }
    ]);

    networkInstance.current = new Network(
      networkRef.current,
      { nodes, edges },
      {
        nodes: {
          shape: 'box',
          font: { color: 'white' }
        },
        edges: {
          arrows: 'to',
          color: 'gray'
        },
        physics: {
          stabilization: true
        }
      }
    );

    // Open edit modal on node click
    networkInstance.current.on('click', function (params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodesRef.current.get(nodeId);
        if (node) {
          setEditNodeId(nodeId as number);
          setNodeLabel(node.label || '');
          setNodeType(getNodeTypeByColor(node.color as string));
          setShowForm(true);
        }
      }
    });

    fetchMyMaps();
  }, []);

  const getNodeTypeByColor = (color: string) => {
    return (
      Object.entries(colorMap).find(([, val]) => val === color)?.[0] || 'dead'
    );
  };

  const addNode = () => {
    const id = nodesRef.current.length + 10 + Math.floor(Math.random() * 1000);

    nodesRef.current.add({
      id,
      label: nodeLabel || 'New Node',
      color: colorMap[nodeType]
    });

    edgesRef.current.add({
      from: 1,
      to: id
    });

    resetForm();
  };

  const updateNode = () => {
    if (editNodeId == null) return;

    nodesRef.current.update({
      id: editNodeId,
      label: nodeLabel,
      color: colorMap[nodeType]
    });

    resetForm();
  };

  const resetForm = () => {
    setEditNodeId(null);
    setNodeLabel('');
    setNodeType('income');
    setShowForm(false);
  };

  const saveMap = async () => {
    const nodes = nodesRef.current.get();
    const edges = edgesRef.current.get();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      alert('User not authenticated.');
      return;
    }

    const { error } = await supabase.from('maps').insert({
      user_id: user.id,
      name: 'Untitled Map ' + uuidv4().slice(0, 6),
      nodes,
      edges
    });

    if (error) {
      alert('❌ Error saving map: ' + error.message);
    } else {
      alert('✅ Map saved successfully!');
    }
  };

  const fetchMyMaps = async () => {
    setLoadingMaps(true);
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('maps')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setMapList(data);
    setLoadingMaps(false);
  };

  const loadMapById = async (mapId: string) => {
    if (!mapId) return;

    const { data, error } = await supabase
      .from('maps')
      .select('nodes, edges')
      .eq('id', mapId)
      .single();

    if (error || !data) {
      alert('Failed to load map');
      return;
    }

    nodesRef.current.clear();
    edgesRef.current.clear();

    nodesRef.current.add(data.nodes);
    edgesRef.current.add(data.edges);
  };

  return (
    <div>
      <h2>Money Map</h2>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => setShowForm(true)}>+ Add Node</button>
        <button onClick={saveMap} style={{ marginLeft: '10px' }}>💾 Save Map</button>

        <select
          onChange={(e) => loadMapById(e.target.value)}
          style={{ marginLeft: '20px' }}
          disabled={loadingMaps}
        >
          <option value="">📂 Load Saved Map</option>
          {mapList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Node Title"
            value={nodeLabel}
            onChange={(e) => setNodeLabel(e.target.value)}
            style={{ marginRight: '10px' }}
          />
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            style={{ marginRight: '10px' }}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="investment">Investment</option>
            <option value="dead">Dead/Other</option>
          </select>
          <button onClick={editNodeId ? updateNode : addNode}>
            {editNodeId ? 'Update Node' : 'Create Node'}
          </button>
          <button onClick={resetForm} style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </div>
      )}

      <div
        ref={networkRef}
        style={{
          height: '600px',
          border: '1px solid #ccc',
          background: '#f9f9f9'
        }}
      />
    </div>
  );
}
