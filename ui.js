// UI-related functions
export function initUI() {
  // Add tab switching functionality
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all links and tabs
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Show corresponding tab
      const tabName = link.dataset.tab; // use data-tab for reliability
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // Add event listeners for edit flow buttons
  document.querySelectorAll('.automation-btn').forEach(btn => {
    if (btn.textContent === 'Edit Flow') {
      btn.addEventListener('click', () => window.showAutomationModal());
    }
  });

  // Close modal event handlers
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
      });
    });
  });

  // Close modal when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        modal.classList.remove('active');
      }
    });
  });

  // Theme toggle logic
  const themeSwitch = document.getElementById('theme-switch');
  if (themeSwitch) {
    // Load theme preference from local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      themeSwitch.checked = true;
    }

    // Add event listener for toggle change
    themeSwitch.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // Keyboard nav for tabs
  const linksWrap = document.querySelector('.nav-links');
  linksWrap?.addEventListener('keydown', (e) => {
    if (!['ArrowLeft','ArrowRight'].includes(e.key)) return;
    const links = [...linksWrap.querySelectorAll('.nav-link')];
    const i = links.findIndex(l => l.classList.contains('active'));
    const ni = e.key === 'ArrowRight' ? (i+1)%links.length : (i-1+links.length)%links.length;
    links[ni].focus(); links[ni].click();
  });
  // Mobile menu toggle
  const toggle = document.querySelector('.nav-toggle');
  toggle?.addEventListener('click', () => {
    const nav = document.querySelector('.nav'); const exp = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!exp)); nav.classList.toggle('open');
  });
  // Avatar + dropdown
  const avatarBtn = document.getElementById('avatar-btn');
  const menu = document.getElementById('avatar-menu');
  if (avatarBtn && menu) {
    avatarBtn.style.backgroundImage = `url(https://images.websim.com/avatar/${(window.websim?.getCurrentUser && '') || ''})`;
    avatarBtn.addEventListener('click', () => {
      const open = menu.getAttribute('aria-hidden') === 'false';
      menu.setAttribute('aria-hidden', String(open)); avatarBtn.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('show', !open);
    });
    document.addEventListener('click', (e)=>{ if(!menu.contains(e.target) && e.target!==avatarBtn){ menu.setAttribute('aria-hidden','true'); menu.classList.remove('show'); avatarBtn.setAttribute('aria-expanded','false'); }});
    menu.addEventListener('click', (e)=>{ const a=e.target.dataset.action; if(a==='theme'){ document.getElementById('theme-switch')?.click(); }});
  }
}