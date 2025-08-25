// State variables
let draggedNode = null;
let nodeCounter = 4; // Start after existing nodes

// Node event handling
export const handleNodeEvents = {
  initializeDraggableNodes() {
    document.querySelectorAll('.node-item').forEach(node => {
      node.addEventListener('dragstart', this.handleDragStart);
      node.addEventListener('dragend', this.handleDragEnd);
    });

    const canvas = document.querySelector('.flow-canvas');
    canvas.addEventListener('dragover', this.handleDragOver);
    canvas.addEventListener('drop', this.handleDrop);
  },

  handleDragStart(e) {
    draggedNode = e.target;
    e.dataTransfer.setData('text/plain', e.target.dataset.nodeType);
    e.target.classList.add('dragging');
  },

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedNode = null;
  },

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  },

  handleDrop(e) {
    e.preventDefault();
    if (!draggedNode) return;

    const nodeType = e.dataTransfer.getData('text/plain');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createNewNode(nodeType, x, y);
  }
};

// Node operations
export function createNewNode(type, x, y) {
  const nodeId = `node${nodeCounter++}`;
  const node = document.createElement('div');
  node.className = `flow-node ${type}-node`;
  node.dataset.nodeId = nodeId;
  node.style.position = 'absolute';
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;

  // Get node configuration based on type
  const config = getNodeConfig(type);
  
  node.innerHTML = `
    <div class="node-header">${config.title}</div>
    <div class="node-config">
      <select class="node-select" onchange="updateNodeParams('${nodeId}', this.value)">
        ${config.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
      </select>
      <div class="node-params" id="params-${nodeId}">
        ${generateNodeParams(config.defaultParams)}
      </div>
    </div>
    <div class="node-actions">
      <button class="automation-btn" onclick="deleteNode('${nodeId}')">Delete</button>
      <button class="automation-btn" onclick="testNode('${nodeId}')">Test</button>
    </div>
  `;

  document.querySelector('.flow-canvas').appendChild(node);
  makeNodeDraggable(node);
}

export function getNodeConfig(type) {
  const configs = {
    source: {
      title: 'Source',
      options: [
        { value: 'google-drive', label: 'Google Drive' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'linkedin', label: 'LinkedIn' }
      ],
      defaultParams: {
        path: { type: 'text', label: 'Path', default: '/data/exports' },
        filter: { type: 'text', label: 'Filter', default: '*.json' }
      }
    },
    transform: {
      title: 'Transform',
      options: [
        { value: 'data-cleanse', label: 'Data Cleanse' },
        { value: 'format-convert', label: 'Format Convert' },
        { value: 'field-map', label: 'Field Map' }
      ],
      defaultParams: {
        schema: { type: 'select', label: 'Schema', options: ['Standard', 'Custom'] },
        sanitize: { type: 'checkbox', label: 'Sanitize', default: true }
      }
    },
    security: {
      title: 'Security',
      options: [
        { value: 'encryption', label: 'Encryption' },
        { value: 'access-control', label: 'Access Control' },
        { value: 'audit-log', label: 'Audit Log' }
      ],
      defaultParams: {
        level: { type: 'select', label: 'Level', options: ['High', 'Medium', 'Low'] },
        retainLogs: { type: 'checkbox', label: 'Retain Logs', default: true }
      }
    }
  };
  return configs[type];
}

function generateNodeParams(params) {
  return Object.entries(params).map(([key, config]) => {
    let input = '';
    switch(config.type) {
      case 'select':
        input = `<select>
          ${config.options.map(opt => `<option>${opt}</option>`).join('')}
        </select>`;
        break;
      case 'checkbox':
        input = `<input type="checkbox" ${config.default ? 'checked' : ''}>`;
        break;
      default:
        input = `<input type="${config.type}" placeholder="${config.default}">`;
    }
    return `<label>${config.label} ${input}</label>`;
  }).join('');
}

function makeNodeDraggable(node) {
  let pos = { x: 0, y: 0 };
  
  node.addEventListener('mousedown', initDrag);

  function initDrag(e) {
    if (e.target.closest('.node-select, .node-params, .automation-btn')) return;
    
    pos = {
      x: e.clientX - node.offsetLeft,
      y: e.clientY - node.offsetTop
    };

    document.addEventListener('mousemove', dragNode);
    document.addEventListener('mouseup', stopDrag);
  }

  function dragNode(e) {
    node.style.left = `${e.clientX - pos.x}px`;
    node.style.top = `${e.clientY - pos.y}px`;
  }

  function stopDrag() {
    document.removeEventListener('mousemove', dragNode);
    document.removeEventListener('mouseup', stopDrag);
  }
}

export function updateNodeParams(nodeId, value) {
  const node = document.querySelector(`[data-node-id="${nodeId}"]`);
  const type = node.className.split(' ')[1].replace('-node', '');
  const config = getNodeConfig(type);
  
  // Find the selected option configuration
  const selectedOption = config.options.find(opt => opt.value === value);
  if (!selectedOption) return;

  // Update parameters based on selected option
  const paramsContainer = document.getElementById(`params-${nodeId}`);
  paramsContainer.innerHTML = generateNodeParams(config.defaultParams);
}

export function deleteNode(nodeId) {
  const node = document.querySelector(`[data-node-id="${nodeId}"]`);
  if (node) node.remove();
}

export function testNode(nodeId) {
  const node = document.querySelector(`[data-node-id="${nodeId}"]`);
  const type = node.className.split(' ')[1].replace('-node', '');
  const params = {};
  
  // Collect all parameter values
  node.querySelectorAll('.node-params input, .node-params select').forEach(input => {
    params[input.closest('label').textContent.trim()] = input.type === 'checkbox' ? input.checked : input.value;
  });

  // Simulate node testing
  console.log(`Testing ${type} node (${nodeId}):`, params);
  alert(`Testing ${type} node. Check console for details.`);
}
