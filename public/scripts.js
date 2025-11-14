// Simple starfield with occasional comet
(function(){
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0, stars = [], maxStars = 120, comet = null;

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    w = canvas.width = Math.max(300, window.innerWidth * dpr);
    h = canvas.height = Math.max(200, window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    // regenerate stars preserving count
    stars = [];
    const count = Math.min(maxStars, Math.floor((w*h)/60000));
    for(let i=0;i<count;i++) stars.push(randomStar());
  }

  function randomStar(){
    return {
      x: Math.random()*w,
      y: Math.random()*h,
      r: Math.random()*1.6 + 0.3,
      twinkle: Math.random()*0.02 + 0.005,
      a: Math.random()*0.8 + 0.2,
      dir: Math.random() > 0.5 ? 1 : -1
    };
  }

  function spawnComet(){
    // spawn from random edge near top-left to bottom-right
    const startX = Math.random() < 0.5 ? -100 : Math.random()*w;
    const startY = -50;
    const vx = (Math.random()*1.6 + 2.4);
    const vy = (Math.random()*0.6 + 0.8);
    comet = {x: startX, y: startY, vx, vy, life: 0, maxLife: Math.random()*120 + 100};
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    // subtle nebula glow
    const g = ctx.createRadialGradient(w*0.8, h*0.15, 10, w*0.5, h*0.5, Math.max(w,h));
    g.addColorStop(0, 'rgba(124,58,237,0.06)');
    g.addColorStop(1, 'rgba(2,6,23,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // draw stars
    for(let s of stars){
      s.a += s.twinkle * s.dir;
      if (s.a <= 0.2 || s.a >= 1) s.dir *= -1;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0,Math.min(1,s.a))})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    // comet
    if (comet){
      comet.x += comet.vx * (window.devicePixelRatio || 1);
      comet.y += comet.vy * (window.devicePixelRatio || 1);
      comet.life++;
      // tail
      const tailLen = 120;
      const grd = ctx.createLinearGradient(comet.x, comet.y, comet.x - comet.vx*tailLen, comet.y - comet.vy*tailLen);
      grd.addColorStop(0, 'rgba(255,255,255,0.95)');
      grd.addColorStop(1, 'rgba(124,58,237,0)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(comet.x - comet.vx*tailLen, comet.y - comet.vy*tailLen);
      ctx.stroke();
      // head
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.arc(comet.x, comet.y, 3.6, 0, Math.PI*2);
      ctx.fill();

      if (comet.life > comet.maxLife || comet.x - comet.vx*10 > w || comet.y - comet.vy*10 > h) comet = null;
    } else if (Math.random() < 0.006){
      spawnComet();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); });
  // initial
  resize();
  requestAnimationFrame(draw);

})();

// Email signup form handler
(function(){
  const form = document.getElementById('signup-form');
  const emailInput = document.getElementById('email-input');
  const status = document.getElementById('signup-status');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    
    if (!email) return;

    status.textContent = 'Submitting...';
    status.style.color = 'var(--accent)';

    try {
      // For now, just store in localStorage and show success
      // Backend integration coming soon
      const emails = JSON.parse(localStorage.getItem('llmresume_emails') || '[]');
      
      if (emails.includes(email)) {
        // Duplicate email
        status.textContent = '✨ You\'re already on the list! We\'ll notify you when we launch.';
        status.style.color = '#a78bfa';
        emailInput.value = '';
        return;
      }

      // New email
      emails.push(email);
      localStorage.setItem('llmresume_emails', JSON.stringify(emails));

      // Save to backend
      try {
        await fetch('/api/subscribe', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }) 
        });
      } catch (err) {
        console.warn('Backend save failed (local storage still works):', err);
      }

      status.textContent = '✅ Thanks! You\'ll be notified when we launch.';
      status.style.color = '#5eead4';
      emailInput.value = '';

    } catch (err) {
      status.textContent = '❌ Something went wrong. Please try again.';
      status.style.color = '#ff6b6b';
    }
  });
})();

// Unique user counter (first visit per browser)
(function(){
  const valueEl = document.getElementById('user-count-value');
  if (!valueEl) return;

  const COUNTED_FLAG = 'llmresume_counted_v1';
  const counted = localStorage.getItem(COUNTED_FLAG) === 'true';

  async function updateCount(){
    // Prefer server-side metrics endpoint (local) so we avoid third-party issues.
    // The server will set/record uid via the cookie middleware on any API request.
    try {
      valueEl.textContent = '...';

      const opts = { credentials: 'same-origin' };

      // Ensure we set counted flag locally so we don't spam remote counters
      if (!counted) {
        localStorage.setItem(COUNTED_FLAG, 'true');
      }

      // Try local server metrics first
      const res = await fetch('/api/metrics/unique', opts);
      if (res.ok) {
        const data = await res.json();
        valueEl.textContent = (data.unique || 0).toLocaleString();
        return;
      }
    } catch (err) {
      console.warn('Local metrics failed:', err);
    }

    // Fallback to third-party countapi if server not available
    try {
      let url;
      if (!counted) url = 'https://api.countapi.xyz/hit/llmresume.vercel.app/visitors';
      else url = 'https://api.countapi.xyz/get/llmresume.vercel.app/visitors';

      const res2 = await fetch(url);
      if (res2.ok) {
        const d2 = await res2.json();
        valueEl.textContent = (d2.value || 0).toLocaleString();
        return;
      }
    } catch (err) {
      console.error('Counter error:', err);
    }

    valueEl.textContent = '—';
  }

  updateCount();
})();
