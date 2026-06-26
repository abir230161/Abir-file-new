document.addEventListener('DOMContentLoaded', () => {

  const siteBg       = document.getElementById('siteBackground');
  const uploadBtn    = document.getElementById('uploadBtn');
  const bgInput      = document.getElementById('bgUploadInput');
  const vrInput      = document.getElementById('vrUploadInput');
  const vrWrapper    = document.getElementById('vrImageWrapper');
  const toast        = document.getElementById('toast');
  const joinBtn      = document.getElementById('joinBtn');
  const checkBtn     = document.getElementById('checkBtn');
  const menuToggle   = document.getElementById('menuToggle');
  const navLinks     = document.getElementById('navLinks');
  const resetBtn     = document.getElementById('resetBtn');
  const bgVideo      = document.getElementById('bgVideo');
  const bgFallback   = document.getElementById('bgFallback');
  const slideProgress= document.getElementById('slideProgress');
  const slideDots    = document.querySelectorAll('.slide-dot');

  /* ══════════════════════════════════════════════════════════
   *  DEFAULT IMAGE PATHS — আপনার images/ ফোল্ডারের নাম দিন
   * ══════════════════════════════════════════════════════════ */
  const DEFAULT_SLIDES = [
    'images/vr-1.jpg',   // ← ১ম slideshow ছবি
    'images/vr-2.jpg',   // ← ২য় slideshow ছবি
    'images/vr-3.jpg',   // ← ৩য় slideshow ছবি
  ];
  const DEFAULT_BG_VIDEO = 'images/bg-video.mp4'; // ← background video

  /* ══════════════════════════════════════════════════════════
   *  VIDEO BACKGROUND LOGIC
   * ══════════════════════════════════════════════════════════ */
  if (bgVideo) {
    bgVideo.addEventListener('loadeddata', () => {
      // Video loaded সফলভাবে → fallback hide করো
      bgVideo.style.opacity = '1';
      bgFallback.classList.remove('active');
    });

    bgVideo.addEventListener('error', () => {
      // Video নেই বা error → animated gradient দেখাবে
      bgVideo.style.display = 'none';
      bgFallback.classList.add('active');
    });

    // যদি video already cached হয়
    if (bgVideo.readyState >= 3) {
      bgFallback.classList.remove('active');
    }
  }

  /* ══════════════════════════════════════════════════════════
   *  SLIDESHOW LOGIC
   * ══════════════════════════════════════════════════════════ */
  const slides       = document.querySelectorAll('.vr-slide');
  let currentSlide   = 0;
  let slideshowTimer = null;
  let progressTimer  = null;
  const SLIDE_INTERVAL = 5000; // ৫ সেকেন্ড

  // localStorage থেকে custom slide images লোড করো
  const savedSlides = JSON.parse(localStorage.getItem('customSlides') || '[]');

  // Slide এ image src সেট করো (saved বা default)
  slides.forEach((slide, i) => {
    const img = slide.querySelector('img');
    if (savedSlides[i]) {
      img.src = savedSlides[i];
    }
    // Default path already in HTML — local file না থাকলে browser নিজেই handle করবে
  });

  function goToSlide(index) {
    // Current slide exit করো
    slides[currentSlide].classList.remove('active');
    slides[currentSlide].classList.add('exit');

    setTimeout(() => {
      slides[currentSlide].classList.remove('exit');
    }, 900);

    // Dots আপডেট করো
    slideDots.forEach(dot => dot.classList.remove('active'));
    if (slideDots[index]) slideDots[index].classList.add('active');

    currentSlide = index;

    // নতুন slide active করো
    slides[currentSlide].classList.add('active');

    // Progress bar রিসেট করো
    restartProgress();
  }

  function nextSlide() {
    const next = (currentSlide + 1) % slides.length;
    goToSlide(next);
  }

  function restartProgress() {
    // Progress bar animation রিসেট
    slideProgress.classList.remove('animating');
    slideProgress.style.transition = 'none';
    slideProgress.style.width = '0%';

    // Force reflow
    void slideProgress.offsetWidth;

    slideProgress.classList.add('animating');
  }

  function startSlideshow() {
    stopSlideshow();
    restartProgress();
    slideshowTimer = setInterval(nextSlide, SLIDE_INTERVAL);
  }

  function stopSlideshow() {
    clearInterval(slideshowTimer);
    clearTimeout(progressTimer);
    slideProgress.classList.remove('animating');
  }

  // Slideshow শুরু করো
  startSlideshow();

  // Dot click করলে সেই slide এ যাও
  slideDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation(); // vrWrapper click trigger হবে না
      const idx = parseInt(dot.dataset.dot);
      stopSlideshow();
      goToSlide(idx);
      startSlideshow();
    });
  });

  // Mouse hover এ pause করো (optional — smooth UX)
  vrWrapper.addEventListener('mouseenter', () => stopSlideshow());
  vrWrapper.addEventListener('mouseleave', () => startSlideshow());

  /* ══════════════════════════════════════════════════════════
   *  VR IMAGE UPLOAD (৩টা ছবি একসাথে বা আলাদা)
   * ══════════════════════════════════════════════════════════ */
  vrWrapper.addEventListener('click', () => vrInput.click());

  vrInput.setAttribute('multiple', 'true'); // multiple files select করা যাবে

  vrInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) {
      showToast('⚠️ Valid image file select করুন');
      return;
    }

    const newSaved = [...savedSlides];
    let loaded = 0;

    files.forEach((file, i) => {
      if (i >= slides.length) return; // max ৩টা
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        newSaved[i] = dataUrl;
        slides[i].querySelector('img').src = dataUrl;
        loaded++;
        if (loaded === Math.min(files.length, slides.length)) {
          localStorage.setItem('customSlides', JSON.stringify(newSaved));
          showToast(`📷 ${loaded}টা ছবি আপডেট হয়েছে!`);
          goToSlide(0);
          startSlideshow();
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  });

  /* ══════════════════════════════════════════════════════════
   *  BACKGROUND UPLOAD (navbar button)
   * ══════════════════════════════════════════════════════════ */
  uploadBtn.addEventListener('click', () => bgInput.click());

  bgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('⚠️ Valid image file select করুন');
      return;
    }

    // ইউজার image দিলে video হাইড করে image background দেখাও
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      // video বন্ধ করো, fallback দিয়ে image দেখাও
      if (bgVideo) bgVideo.style.display = 'none';
      bgFallback.style.backgroundImage = `url('${dataUrl}')`;
      bgFallback.style.backgroundSize = 'cover';
      bgFallback.style.backgroundPosition = 'center';
      bgFallback.classList.add('active');
      // orbs hide করো
      document.querySelectorAll('.bg-orb').forEach(o => o.style.display = 'none');
      localStorage.setItem('customBackground', dataUrl);
      showToast('🖼️ Background আপডেট হয়েছে!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  // Saved custom background restore করো
  const savedBg = localStorage.getItem('customBackground');
  if (savedBg) {
    if (bgVideo) bgVideo.style.display = 'none';
    bgFallback.style.backgroundImage = `url('${savedBg}')`;
    bgFallback.style.backgroundSize = 'cover';
    bgFallback.style.backgroundPosition = 'center';
    bgFallback.classList.add('active');
    document.querySelectorAll('.bg-orb').forEach(o => o.style.display = 'none');
  }

  /* ══════════════════════════════════════════════════════════
   *  RESET BUTTON
   * ══════════════════════════════════════════════════════════ */
  resetBtn.addEventListener('click', () => {
    localStorage.removeItem('customBackground');
    localStorage.removeItem('customSlides');

    // Background reset
    bgFallback.style.backgroundImage = '';
    bgFallback.style.backgroundSize  = '';
    document.querySelectorAll('.bg-orb').forEach(o => o.style.display = '');

    if (bgVideo) {
      bgVideo.style.display = '';
      bgVideo.load();
    }

    // Slides reset
    slides.forEach((slide, i) => {
      slide.querySelector('img').src = DEFAULT_SLIDES[i];
    });
    goToSlide(0);
    startSlideshow();

    showToast('🗑️ সব default এ ফিরে এসেছে');
  });

  /* ══════════════════════════════════════════════════════════
   *  TOAST HELPER
   * ══════════════════════════════════════════════════════════ */
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ══════════════════════════════════════════════════════════
   *  MOBILE MENU
   * ══════════════════════════════════════════════════════════ */
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  /* ══════════════════════════════════════════════════════════
   *  BUTTON FEEDBACK
   * ══════════════════════════════════════════════════════════ */
  joinBtn.addEventListener('click', () => {
    showToast('🚀 Welcome! Sign up এ redirect হচ্ছে...');
  });

  checkBtn.addEventListener('click', () => {
    checkBtn.querySelector('.check-icon').style.transform = 'rotate(360deg)';
    showToast('🔍 System check চলছে...');
    setTimeout(() => {
      checkBtn.querySelector('.check-icon').style.transform = '';
      showToast('✅ আপনার system VR-ready!');
    }, 1500);
  });

  /* ══════════════════════════════════════════════════════════
   *  SCROLL REVEAL
   * ══════════════════════════════════════════════════════════ */
  const revealEls = document.querySelectorAll('.feature, .stat-box');
  const observer  = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.2 });

  revealEls.forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(14px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  /* ══════════════════════════════════════════════════════════
   *  PILL BUTTONS PRESS FEEDBACK
   * ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.transform = 'scale(0.93)';
      setTimeout(() => (btn.style.transform = ''), 150);
    });
  });

});
