// API network endpoints state
let networkNodes = [
  {
    id: 'google-drive',
    name: 'Google Drive API',
    service: 'google',
    icon: '#4285f4',
    url: 'https://www.googleapis.com/drive/v3',
    x: 150,
    y: 150,
    status: 'active',
    connections: ['data-processor']
  },
  {
    id: 'facebook-graph',
    name: 'Facebook Graph API',
    service: 'facebook',
    icon: '#1877f2',
    url: 'https://graph.facebook.com/v12.0',
    x: 400,
    y: 120,
    status: 'active',
    connections: ['data-processor', 'analytics-engine']
  },
  {
    id: 'linkedin-api',
    name: 'LinkedIn Marketing API',
    service: 'linkedin',
    icon: '#0a66c2',
    url: 'https://api.linkedin.com/v2',
    x: 280,
    y: 300,
    status: 'inactive',
    connections: ['analytics-engine']
  },
  {
    id: 'data-processor',
    name: 'Data Processor',
    service: 'internal',
    icon: '#34a853',
    url: 'internal://data-processor',
    x: 250,
    y: 220,
    status: 'active',
    connections: ['security-gateway']
  },
  {
    id: 'security-gateway',
    name: 'Security Gateway',
    service: 'internal',
    icon: '#ea4335',
    url: 'internal://security',
    x: 500,
    y: 250,
    status: 'active',
    connections: []
  },
  {
    id: 'analytics-engine',
    name: 'Analytics Engine',
    service: 'internal',
    icon: '#fbbc04',
    url: 'internal://analytics',
    x: 650,
    y: 180,
    status: 'error',
    connections: ['security-gateway']
  }
];

let zoom = 1;

// Initialize network visualization
export function initNetworkMonitor() {
  const monitorEl = document.getElementById('network-monitor');
  
  if (!monitorEl) return;
  
  // Clear container
  monitorEl.innerHTML = '';
  
  // Add view switching functionality
  document.querySelectorAll('.network-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.network-btn[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (btn.dataset.view === 'topology') {
        renderTopologyView();
      } else {
        renderListView();
      }
    });
  });
  
  // Initialize filter functionality
  const endpointFilter = document.getElementById('endpoint-filter');
  const statusFilter = document.getElementById('status-filter');
  
  if (endpointFilter) {
    endpointFilter.addEventListener('input', filterNodes);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', filterNodes);
  }
  
  // Initialize modal buttons
  document.getElementById('test-connection')?.addEventListener('click', testNodeConnection);
  document.getElementById('save-endpoint')?.addEventListener('click', saveNodeConfiguration);
  
  // Initialize with topology view
  renderTopologyView();
  
  // Setup auto-refresh
  setInterval(updateNodeStatuses, 30000);
  
  // Add zoom controls
  document.getElementById('zoom-in')?.addEventListener('click', () => setZoom(zoom + 0.1));
  document.getElementById('zoom-out')?.addEventListener('click', () => setZoom(zoom - 0.1));
  document.getElementById('zoom-reset')?.addEventListener('click', () => setZoom(1));
  document.getElementById('open-help')?.addEventListener('click', () => showToast('Tip: Right-click a node for actions. Use Z/X keys to zoom, ? for help.'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'z' || e.key === 'Z') setZoom(zoom - 0.1);
    if (e.key === 'x' || e.key === 'X') setZoom(zoom + 0.1);
    if (e.key === '?') showToast('Right-click nodes for Configure/Toggle. Filters narrow results. Zoom with Z/X.');
  });
}

function renderTopologyView() {
  const monitorEl = document.getElementById('network-monitor');
  monitorEl.innerHTML = '';
  const canvas = document.createElement('div');
  canvas.id = 'network-canvas';
  monitorEl.appendChild(canvas);
  
  // Create connections first (so they appear behind nodes)
  networkNodes.forEach(node => {
    if (node.connections?.length) {
      node.connections.forEach(targetId => {
        const target = networkNodes.find(n => n.id === targetId);
        if (target) {
          createConnection(canvas, node, target);
        }
      });
    }
  });
  
  // Create nodes
  networkNodes.forEach(node => {
    createNode(canvas, node);
  });
  
  applyZoom();
}

function renderListView() {
  const monitorEl = document.getElementById('network-monitor');
  monitorEl.innerHTML = `
    <div class="endpoint-list">
      ${networkNodes.map(node => `
        <div class="endpoint-item" data-node-id="${node.id}" data-status="${node.status}">
          <div class="endpoint-info">
            <svg class="icon" viewBox="0 0 24 24" fill="${node.icon}">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <div>
              <div>${node.name}</div>
              <div class="text-light" style="font-size: 12px;">${node.url}</div>
            </div>
          </div>
          <div class="endpoint-actions">
            <span class="mini-badge ${node.status}">${node.status}</span>
            <button class="automation-btn" onclick="showNetworkNodeModal('${node.id}')">Configure</button>
            <button class="automation-btn" onclick="toggleNodeStatus('${node.id}')">
              ${node.status === 'active' ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function createNode(container, node) {
  const nodeEl = document.createElement('div');
  nodeEl.className = `api-node ${node.status}`;
  nodeEl.dataset.nodeId = node.id;
  nodeEl.style.left = `${node.x}px`;
  nodeEl.style.top = `${node.y}px`;
  
  nodeEl.innerHTML = `
    <svg class="icon" viewBox="0 0 24 24" fill="${node.icon}">
      <circle cx="12" cy="12" r="10" />
    </svg>
    <div>${node.name}</div>
    <div class="node-status ${node.status}"></div>
  `;
  
  // Make node draggable
  let isDragging = false;
  let offsetX, offsetY;
  
  nodeEl.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - node.x;
    offsetY = e.clientY - node.y;
    nodeEl.style.zIndex = 10;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const containerRect = container.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - offsetX;
    const newY = e.clientY - containerRect.top - offsetY;
    
    // Update node position
    nodeEl.style.left = `${newX}px`;
    nodeEl.style.top = `${newY}px`;
    
    // Update connections
    updateConnections(node.id, newX, newY);
    
    // Update state
    node.x = newX;
    node.y = newY;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      nodeEl.style.zIndex = '';
    }
  });
  
  // Show tooltip on hover
  nodeEl.addEventListener('mouseover', (e) => {
    const tooltip = document.createElement('div');
    tooltip.className = 'node-tooltip';
    tooltip.innerHTML = `
      <div><strong>${node.name}</strong></div>
      <div>Status: ${node.status}</div>
      <div>Endpoint: ${node.url}</div>
      <div>Connections: ${node.connections.length}</div>
    `;
    
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
    tooltip.style.opacity = '1';
    
    document.body.appendChild(tooltip);
    nodeEl.dataset.tooltip = true;
  });
  
  nodeEl.addEventListener('mousemove', (e) => {
    const tooltip = document.querySelector('.node-tooltip');
    if (tooltip) {
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY + 10}px`;
    }
  });
  
  nodeEl.addEventListener('mouseout', () => {
    const tooltip = document.querySelector('.node-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
    nodeEl.dataset.tooltip = false;
  });
  
  // Open configuration modal on double click
  nodeEl.addEventListener('dblclick', () => {
    window.showNetworkNodeModal(node.id);
  });
  
  nodeEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.pageX, e.pageY, node.id);
  });
  
  container.appendChild(nodeEl);
}

function createConnection(container, sourceNode, targetNode) {
  const connectionEl = document.createElement('div');
  connectionEl.className = `network-connection ${sourceNode.status}`;
  connectionEl.dataset.source = sourceNode.id;
  connectionEl.dataset.target = targetNode.id;
  
  // Calculate connection position and rotation
  updateConnectionPosition(connectionEl, sourceNode, targetNode);
  
  container.appendChild(connectionEl);
}

function updateConnectionPosition(connectionEl, sourceNode, targetNode) {
  const dx = (targetNode.x - sourceNode.x);
  const dy = (targetNode.y - sourceNode.y);
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  connectionEl.style.width = `${length}px`;
  connectionEl.style.left = `${sourceNode.x}px`;
  connectionEl.style.top = `${sourceNode.y}px`;
  connectionEl.style.transform = `rotate(${angle}deg) scaleY(${1/zoom})`;
}

function updateConnections(nodeId, newX, newY) {
  // Update connections where this node is the source
  document.querySelectorAll(`.network-connection[data-source="${nodeId}"]`).forEach(conn => {
    const targetId = conn.dataset.target;
    const targetNode = networkNodes.find(n => n.id === targetId);
    
    updateConnectionPosition(conn, { x: newX, y: newY }, targetNode);
  });
  
  // Update connections where this node is the target
  document.querySelectorAll(`.network-connection[data-target="${nodeId}"]`).forEach(conn => {
    const sourceId = conn.dataset.source;
    const sourceNode = networkNodes.find(n => n.id === sourceId);
    
    updateConnectionPosition(conn, sourceNode, { x: newX, y: newY });
  });
}

function filterNodes() {
  const searchTerm = document.getElementById('endpoint-filter').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  
  const currentView = document.querySelector('.network-btn[data-view].active')?.dataset.view;
  
  if (currentView === 'topology' || !currentView) {
    document.querySelectorAll('.api-node').forEach(node => {
      const nodeData = networkNodes.find(n => n.id === node.dataset.nodeId);
      const matchesSearch = nodeData.name.toLowerCase().includes(searchTerm) || 
                           nodeData.url.toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || nodeData.status === statusFilter;
      
      node.style.display = (matchesSearch && matchesStatus) ? 'flex' : 'none';
    });
    
    // Update connection visibility
    document.querySelectorAll('.network-connection').forEach(conn => {
      const sourceVisible = document.querySelector(`.api-node[data-node-id="${conn.dataset.source}"]`).style.display !== 'none';
      const targetVisible = document.querySelector(`.api-node[data-node-id="${conn.dataset.target}"]`).style.display !== 'none';
      
      conn.style.display = (sourceVisible && targetVisible) ? 'block' : 'none';
    });
  } else {
    document.querySelectorAll('.endpoint-item').forEach(item => {
      const nodeData = networkNodes.find(n => n.id === item.dataset.nodeId);
      const matchesSearch = nodeData.name.toLowerCase().includes(searchTerm) || 
                           nodeData.url.toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || nodeData.status === statusFilter;
      
      item.style.display = (matchesSearch && matchesStatus) ? 'flex' : 'none';
    });
  }
}

// Periodically update node statuses to simulate real-time monitoring
function updateNodeStatuses() {
  networkNodes.forEach(node => {
    // Simulate random status changes (in a real app, this would be API calls)
    if (Math.random() < 0.1) {
      const newStatus = ['active', 'error', 'inactive'][Math.floor(Math.random() * 3)];
      toggleNodeStatus(node.id, newStatus);
    }
  });
}

// Configure a node in the modal
export function configureNode(nodeId) {
  const node = networkNodes.find(n => n.id === nodeId);
  if (!node) return;
  
  // Populate form fields
  document.getElementById('node-name').value = node.name;
  document.getElementById('node-service').value = node.service;
  document.getElementById('node-url').value = node.url;
  document.getElementById('node-active').checked = node.status === 'active';
  
  // Store the current node ID for saving
  document.getElementById('save-endpoint').dataset.nodeId = nodeId;
}

// Toggle a node's status
export function toggleNodeStatus(nodeId, forcedStatus) {
  const node = networkNodes.find(n => n.id === nodeId);
  if (!node) return;
  
  // Cycle through statuses or use the forced status
  if (forcedStatus) {
    node.status = forcedStatus;
  } else {
    const statuses = ['active', 'inactive', 'error'];
    const currentIndex = statuses.indexOf(node.status);
    node.status = statuses[(currentIndex + 1) % statuses.length];
  }
  
  // Update UI based on current view
  const currentView = document.querySelector('.network-btn[data-view].active')?.dataset.view;
  
  if (currentView === 'topology' || !currentView) {
    // Update node in topology view
    const nodeEl = document.querySelector(`.api-node[data-node-id="${nodeId}"]`);
    if (nodeEl) {
      nodeEl.className = `api-node ${node.status}`;
      nodeEl.querySelector('.node-status').className = `node-status ${node.status}`;
      
      // Update connections from this node
      document.querySelectorAll(`.network-connection[data-source="${nodeId}"]`).forEach(conn => {
        conn.className = `network-connection ${node.status}`;
      });
    }
  } else {
    // Update in list view
    const itemEl = document.querySelector(`.endpoint-item[data-node-id="${nodeId}"]`);
    if (itemEl) {
      itemEl.dataset.status = node.status;
      itemEl.querySelector('.mini-badge').className = `mini-badge ${node.status}`;
      itemEl.querySelector('.mini-badge').textContent = node.status;
      
      const toggleBtn = itemEl.querySelector('.automation-btn:last-child');
      toggleBtn.textContent = node.status === 'active' ? 'Disable' : 'Enable';
    }
  }
}

// Test a connection to the node
function testNodeConnection() {
  const nodeId = document.getElementById('save-endpoint').dataset.nodeId;
  const node = networkNodes.find(n => n.id === nodeId);
  
  if (!node) return;
  
  // Simulate connection test with loading state
  const testBtn = document.getElementById('test-connection');
  testBtn.textContent = 'Testing...';
  testBtn.disabled = true;
  
  // Simulate API call
  setTimeout(() => {
    testBtn.textContent = 'Test Connection';
    testBtn.disabled = false;
    
    const success = Math.random() > 0.3; // 70% success rate for demo
    if (success) {
      alert(`Connection to ${node.name} successful. Response time: ${Math.floor(Math.random() * 500)}ms`);
    } else {
      alert(`Connection to ${node.name} failed. Error: Timeout or invalid credentials.`);
    }
  }, 1500);
}

// Save node configuration
function saveNodeConfiguration() {
  const nodeId = document.getElementById('save-endpoint').dataset.nodeId;
  const node = networkNodes.find(n => n.id === nodeId);
  
  if (!node) return;
  
  // Update node with form values
  node.name = document.getElementById('node-name').value;
  node.service = document.getElementById('node-service').value;
  node.url = document.getElementById('node-url').value;
  node.status = document.getElementById('node-active').checked ? 'active' : 'inactive';
  
  // Close modal and refresh view
  document.getElementById('network-node-modal').classList.remove('active');
  
  const currentView = document.querySelector('.network-btn[data-view].active')?.dataset.view;
  if (currentView === 'topology' || !currentView) {
    renderTopologyView();
  } else {
    renderListView();
  }
}

function setZoom(val) {
  zoom = Math.min(2, Math.max(0.5, val));
  applyZoom();
  const zl = document.getElementById('zoom-level');
  if (zl) zl.textContent = `${Math.round(zoom*100)}%`;
}

function applyZoom() {
  const canvas = document.getElementById('network-canvas');
  if (canvas) canvas.style.transform = `scale(${zoom})`;
}

function showContextMenu(x, y, nodeId) {
  let menu = document.getElementById('context-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.className = 'context-menu';
    menu.innerHTML = `
      <button data-action="configure">Configure…</button>
      <button data-action="toggle">Toggle Status</button>
      <button data-action="test">Test Connection</button>
    `;
    document.body.appendChild(menu);
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const id = menu.dataset.nodeId;
      if (action === 'configure') window.showNetworkNodeModal(id);
      if (action === 'toggle') toggleNodeStatus(id);
      if (action === 'test') { document.getElementById('save-endpoint').dataset.nodeId = id; testNodeConnection(); }
      menu.style.display = 'none';
    });
    document.addEventListener('click', () => menu.style.display = 'none');
    window.addEventListener('resize', () => menu.style.display = 'none');
  }
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.display = 'block';
  menu.dataset.nodeId = nodeId;
}

function showToast(msg) {
  let toast = document.getElementById('ui-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ui-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2500);
}