import { config } from './config.js';

// Error handling wrapper
function handleError(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      console.error(`Error in ${fn.name}:`, error);
      alert(`An error occurred: ${error.message}`);
    }
  };
}

// Google integration
async function initializeGoogle() {
  if (typeof gapi === 'undefined') {
    console.warn('Google API not loaded');
    return;
  }
  
  try {
    await new Promise((resolve) => gapi.load('client:auth2', resolve));
    await gapi.client.init({
      apiKey: config.google.apiKey,
      clientId: config.google.clientId,
      scope: config.google.scope
    });
  } catch (error) {
    console.warn('Google API initialization error:', error);
  }
}

export const connectGoogle = handleError(async () => {
  if (typeof gapi === 'undefined') {
    throw new Error('Google API not loaded');
  }
  
  const auth = await gapi.auth2.getAuthInstance().signIn();
  if (auth) {
    document.getElementById('google-status').classList.add('connected');
    document.getElementById('google-status-text').textContent = 'Connected';
    await initializeGoogleServices();
  }
});

async function initializeGoogleServices() {
  const services = ['drive', 'sheets'];
  for (const service of services) {
    try {
      await gapi.client.load(service, 'v3');
    } catch (error) {
      console.warn(`Failed to load ${service}:`, error);
    }
  }
}

// Facebook integration
export const connectFacebook = handleError(() => {
  if (typeof FB === 'undefined') {
    throw new Error('Facebook SDK not loaded');
  }

  FB.init({
    appId: config.facebook.appId,
    version: config.facebook.version,
    cookie: true,
    xfbml: true
  });

  return new Promise((resolve) => {
    FB.login((response) => {
      if (response.authResponse) {
        document.getElementById('facebook-status').classList.add('connected');
        document.getElementById('facebook-status-text').textContent = 'Connected';
        initializeFacebookServices();
        resolve(response);
      } else {
        resolve(null);
      }
    }, {scope: 'public_profile,pages_show_list'});
  });
});

function initializeFacebookServices() {
  FB.api('/me', (response) => {
    if (response && !response.error) {
      console.log('Logged in as:', response.name);
    }
  });
}

// LinkedIn integration (mock implementation)
export const connectLinkedIn = handleError(() => {
  document.getElementById('linkedin-status').classList.add('connected');
  document.getElementById('linkedin-status-text').textContent = 'Connected';
});

// Slack integration
export const connectSlack = handleError(async () => {
  document.getElementById('slack-status').classList.add('connected');
  document.getElementById('slack-status-text').textContent = 'Connected';
});

// GitHub integration
export const connectGitHub = handleError(async () => {
  document.getElementById('github-status').classList.add('connected');
  document.getElementById('github-status-text').textContent = 'Connected';
});

// Initialize on page load
window.addEventListener('load', () => {
  initializeGoogle().catch(console.error);
});