const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navPanel = document.querySelector('.nav-panel');
const navLinks = document.querySelectorAll('.nav-panel a');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Atmospheric sakura overlay: depth, wind and slow fall without blocking the UI.
const sakuraCanvas = document.querySelector('#sakura-canvas');
const smallScreen = window.matchMedia('(max-width: 680px)').matches;
if (sakuraCanvas && !reducedMotion && !smallScreen) {
  const context = sakuraCanvas.getContext('2d');
  let width = 0; let height = 0; let petals = []; let frame = 0;
  const colors = ['#ffdbe2', '#f7a9bb', '#fff0f2', '#e77d98'];
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth; height = window.innerHeight;
    sakuraCanvas.width = width * ratio; sakuraCanvas.height = height * ratio;
    sakuraCanvas.style.width = `${width}px`; sakuraCanvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(115, Math.max(46, Math.round(width / 12)));
    petals = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width, y: Math.random() * height, z: .35 + Math.random() * .9,
      size: 3 + Math.random() * 6, speed: .25 + Math.random() * .65, sway: Math.random() * 6 + 2,
      phase: Math.random() * Math.PI * 2, spin: Math.random() * 6.28, color: colors[index % colors.length]
    }));
  };
  const drawPetal = (petal, time) => {
    const depth = petal.z; const x = petal.x + Math.sin(time * .00045 * petal.speed + petal.phase) * petal.sway;
    const y = petal.y + petal.speed * depth * 1.35; petal.y = y > height + 20 ? -20 : y;
    context.save(); context.translate(x, y); context.rotate(petal.spin + time * .0007 * petal.speed);
    context.scale(depth, depth * .72); context.fillStyle = petal.color; context.globalAlpha = .42 + depth * .4;
    context.beginPath(); context.moveTo(0, -petal.size); context.bezierCurveTo(petal.size, -petal.size * .4, petal.size, petal.size * .7, 0, petal.size); context.bezierCurveTo(-petal.size, petal.size * .7, -petal.size, -petal.size * .4, 0, -petal.size); context.fill(); context.restore();
  };
  const animate = (time) => { context.clearRect(0, 0, width, height); petals.forEach((petal) => drawPetal(petal, time)); frame = requestAnimationFrame(animate); };
  resize(); window.addEventListener('resize', resize, { passive: true }); frame = requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
}

let lastScrollY = Math.max(window.scrollY, 0);
let headerUpdateQueued = false;
let scrollDirection = 0;
let scrollDistance = 0;

const updateHeader = () => {
  if (!header) return;

  const currentScrollY = Math.max(window.scrollY, 0);
  const scrollDelta = currentScrollY - lastScrollY;
  const currentDirection = Math.sign(scrollDelta);
  const menuIsOpen = menuToggle?.getAttribute('aria-expanded') === 'true';

  if (currentDirection !== 0) {
    if (currentDirection !== scrollDirection) scrollDistance = 0;
    scrollDirection = currentDirection;
    scrollDistance += Math.abs(scrollDelta);
  }

  header.classList.toggle('is-scrolled', currentScrollY > 36);

  if (currentScrollY <= 36 || menuIsOpen) {
    header.classList.remove('is-hidden');
    scrollDistance = 0;
  } else if (scrollDirection > 0 && scrollDistance > 12 && currentScrollY > header.offsetHeight) {
    header.classList.add('is-hidden');
    scrollDistance = 0;
  } else if (scrollDirection < 0 && scrollDistance > 8) {
    header.classList.remove('is-hidden');
    scrollDistance = 0;
  }

  lastScrollY = currentScrollY;
  headerUpdateQueued = false;
};

const requestHeaderUpdate = () => {
  if (headerUpdateQueued) return;
  headerUpdateQueued = true;
  requestAnimationFrame(updateHeader);
};

const setMenu = (open) => {
  if (!menuToggle || !navPanel) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
  navPanel.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  if (open) header?.classList.remove('is-hidden');
};

menuToggle?.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});

navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
updateHeader();

const revealElements = document.querySelectorAll('.reveal');
const counters = document.querySelectorAll('[data-count]');

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach((element) => element.classList.add('is-visible'));
  counters.forEach((counter) => { counter.textContent = counter.dataset.count; });
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.13 });

  revealElements.forEach((element) => revealObserver.observe(element));

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      const target = Number(counter.dataset.count);
      const duration = 1100;
      const startedAt = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
      observer.unobserve(counter);
    });
  }, { threshold: 0.6 });

  counters.forEach((counter) => counterObserver.observe(counter));
}

const dialog = document.querySelector('#program-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogClose = document.querySelector('.dialog-close');

document.querySelectorAll('[data-program]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!dialog || !dialogTitle) return;
    dialogTitle.textContent = button.dataset.program;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  });
});

dialogClose?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) dialog.close();
});

const articleDialog = document.querySelector('#article-dialog');
const articleDialogTitle = document.querySelector('#article-dialog-title');
const articleDialogCategory = document.querySelector('#article-dialog-category');
const articleDialogContent = document.querySelector('#article-dialog-content');
const articleDialogClose = document.querySelector('.article-dialog-close');
const articles = {
  persiapan: {
    category: 'Persiapan Jepang',
    title: '7 hal yang perlu dipersiapkan sebelum berangkat ke Jepang',
    paragraphs: [
      'Keberangkatan ke Jepang membutuhkan persiapan yang lebih luas daripada dokumen dan tiket. Kemampuan bahasa dasar, pemahaman budaya, kondisi fisik, serta kesiapan mental akan sangat menentukan proses adaptasi.',
      'Susun target belajar yang realistis, latih percakapan sehari-hari, pahami aturan tempat tinggal dan transportasi, lalu siapkan dana darurat. Pastikan juga seluruh dokumen tersimpan dalam bentuk fisik dan digital.',
      'Persiapan yang dilakukan secara bertahap akan membuatmu lebih tenang saat menghadapi lingkungan baru dan mampu mengambil keputusan dengan lebih percaya diri.'
    ]
  },
  belajar: {
    category: 'Bahasa Jepang',
    title: 'Cara membangun kebiasaan belajar bahasa Jepang setiap hari',
    paragraphs: [
      'Konsistensi lebih penting daripada durasi belajar yang panjang. Mulailah dengan sesi 20 hingga 30 menit setiap hari dan tetapkan satu fokus, seperti kosakata, tata bahasa, membaca, atau percakapan.',
      'Gunakan materi yang dekat dengan aktivitas harian, catat kosakata baru dalam kalimat, dan lakukan pengulangan terjadwal. Berlatih berbicara dengan suara lantang juga membantu membangun kelancaran dan rasa percaya diri.',
      'Evaluasi kemajuan setiap minggu agar metode belajar dapat disesuaikan dengan target ujian, studi, atau bidang kerja yang akan dituju.'
    ]
  },
  etika: {
    category: 'Budaya Kerja',
    title: 'Mengenal etika dasar di lingkungan kerja Jepang',
    paragraphs: [
      'Lingkungan kerja Jepang menjunjung ketepatan waktu, komunikasi yang jelas, dan tanggung jawab terhadap tim. Datang lebih awal dan memberi kabar sesegera mungkin ketika ada kendala merupakan kebiasaan dasar yang penting.',
      'Biasakan melakukan aisatsu atau salam, mendengarkan arahan dengan saksama, dan mengonfirmasi kembali pekerjaan untuk mencegah kesalahpahaman. Sikap terbuka terhadap evaluasi juga sangat dihargai.',
      'Memahami kebiasaan ini sejak masa pelatihan membantu membangun etos kerja yang baik sekaligus mempercepat proses adaptasi di tempat kerja.'
    ]
  }
};

document.querySelectorAll('[data-article]').forEach((button) => {
  button.addEventListener('click', () => {
    const article = articles[button.dataset.article];
    if (!articleDialog || !articleDialogTitle || !articleDialogCategory || !articleDialogContent || !article) return;
    articleDialogTitle.textContent = article.title;
    articleDialogCategory.textContent = article.category;
    articleDialogContent.replaceChildren(...article.paragraphs.map((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    articleDialog.showModal();
  });
});

articleDialogClose?.addEventListener('click', () => articleDialog?.close());
articleDialog?.querySelector('a[href="#kontak"]')?.addEventListener('click', () => articleDialog.close());
articleDialog?.addEventListener('click', (event) => {
  const bounds = articleDialog.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) articleDialog.close();
});

// Vanilla glass testimonial columns: no React, Tailwind, or animation framework required.
const testimonialData = [
  ['Pembelajaran di SAGADA membuat saya lebih percaya diri menggunakan bahasa Jepang dalam situasi kerja sehari-hari.', 'Rizky Pratama', 'Alumni Tokutei Ginou, Aichi', 'photo-1500648767791-00dcc994a43e'],
  ['Sensei menjelaskan materi dengan runtut dan selalu memberi evaluasi yang jelas untuk setiap perkembangan kami.', 'Anisa Rahma', 'Alumni Program Bahasa Jepang', 'photo-1494790108377-be9c29b29330'],
  ['Simulasi wawancara dan pembiasaan budaya kerja membantu saya beradaptasi lebih cepat setelah tiba di Jepang.', 'Dimas Saputra', 'Alumni Tokutei Ginou, Osaka', 'photo-1507003211169-0a1dd7228f2d'],
  ['Saya tidak hanya belajar untuk lulus ujian, tetapi juga belajar disiplin, komunikasi, dan tanggung jawab.', 'Nadia Lestari', 'Alumni N3, Hiroshima', 'photo-1534528741775-53994a69daeb'],
  ['Pendampingan dokumen dilakukan dengan teliti. Setiap tahapan dijelaskan sehingga keluarga juga merasa lebih tenang.', 'Fajar Nugroho', 'Alumni Program Studi Jepang', 'photo-1506794778202-cad84cf45f1d'],
  ['Kelasnya intensif tetapi suportif. Saya bisa melihat perkembangan kemampuan berbicara dari minggu ke minggu.', 'Siti Aulia', 'Peserta Bahasa Jepang Intensif', 'photo-1544005313-94ddf0286df2'],
  ['Materi bidang kerja dan latihan percakapan sangat relevan dengan pekerjaan yang saya jalani sekarang.', 'Bayu Kurniawan', 'Alumni Tokutei Ginou, Shizuoka', 'photo-1519345182560-3f2917c472ef'],
  ['Lingkungan belajarnya membangun kebiasaan baik. Saya menjadi lebih konsisten dan berani berbicara bahasa Jepang.', 'Putri Maharani', 'Alumni Program Bahasa Jepang', 'photo-1531123897727-8f129e1688ce'],
  ['Dari asesmen awal sampai persiapan keberangkatan, saya merasa memiliki arah belajar yang jelas dan terukur.', 'Arif Setiawan', 'Alumni Tokutei Ginou, Tokyo', 'photo-1507591064344-4c6ce005b128'],
];

const testimonialColumns = document.querySelectorAll('[data-testimonial-column]');
const testimonialGroups = [testimonialData.slice(0, 3), testimonialData.slice(3, 6), testimonialData.slice(6, 9)];
const testimonialCard = ([text, name, role, image]) => `
  <article class="testimonial-card">
    <span class="testimonial-quote" aria-hidden="true">“</span>
    <blockquote>${text}</blockquote>
    <div class="testimonial-person">
      <img src="https://images.unsplash.com/${image}?auto=format&fit=crop&w=160&q=80" alt="Foto ${name}" loading="lazy">
      <div><strong>${name}</strong><span>${role}</span></div>
    </div>
  </article>`;

if (testimonialColumns.length) {
  const animateColumn = (column, cards, duration) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const copy = cards.map(testimonialCard).join('');
    column.innerHTML = `<div class="testimonial-track"><div class="testimonial-copy">${copy}</div><div class="testimonial-copy" aria-hidden="true">${copy}</div></div>`;
    if (reduce) return;
    const track = column.querySelector('.testimonial-track');
    let offset = 0;
    let lastTime = performance.now();
    const loop = (time) => {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;
      offset += (delta / (duration * 1000)) * track.scrollHeight / 2;
      if (offset >= track.scrollHeight / 2) offset = 0;
      track.style.transform = `translate3d(0, -${offset}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  testimonialColumns.forEach((column, index) => animateColumn(column, testimonialGroups[index], Number(column.dataset.duration) || 20));
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
