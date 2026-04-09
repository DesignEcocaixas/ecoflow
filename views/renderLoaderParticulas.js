// views/loaderParticulas.js

function renderLoaderParticulas(texto = "Carregando...") {
    return `
    <style>
        /* Estilos independentes do loader modular */
        .mesh-loader-bg {
            background-color: #020205;
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(10, 30, 80, 0.5), transparent 40%), 
                radial-gradient(circle at 85% 30%, rgba(15, 25, 60, 0.5), transparent 40%), 
                radial-gradient(circle at 50% 80%, rgba(5, 15, 40, 0.6), transparent 50%);
        }
        @keyframes pulseTextLoader { 
            0% { opacity: 0.6; transform: scale(0.98); } 
            50% { opacity: 1; transform: scale(1.02); } 
            100% { opacity: 0.6; transform: scale(0.98); } 
        }
    </style>

    <div id="globalLoader" class="mesh-loader-bg" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.6s ease; overflow: hidden;">
        <canvas id="loaderCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
        <div class="text-center position-relative" style="z-index: 10;">
            <h4 class="fw-bold text-white mb-0" style="letter-spacing: 3px; text-shadow: 0 0 10px rgba(255,255,255,0.5); animation: pulseTextLoader 2s infinite;">${texto}</h4>
        </div>
    </div>

    <script>
        (function() {
            const canvas = document.getElementById('loaderCanvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            let w, h;
            let particles = [];
            window.loaderIsDone = false;

            function resize() {
                w = canvas.width = window.innerWidth;
                h = canvas.height = window.innerHeight;
            }

            class Particle {
                constructor() {
                    this.reset();
                }
                reset() {
                    this.cx = w / 2;
                    this.cy = h / 2;
                    this.angle = Math.random() * Math.PI * 2;
                    this.targetRadius = Math.random() * (Math.max(w, h) / 1); 
                    this.radius = 0; 
                    this.speed = (Math.random() - 0.5) * 0.005;
                    
                    if (window.innerWidth < 768) {
                        this.size = Math.random() * 0.8 + 0.1;
                    } else {
                        this.size = Math.random() * 1.2 + 0.2;
                    }
                    
                    this.noiseX = Math.random() * 100;
                    this.noiseY = Math.random() * 100;
                    this.x = this.cx;
                    this.y = this.cy;
                    this.alpha = Math.random() * 0.6 + 0.1;
                }
                update() {
                    if (window.loaderIsDone) {
                        this.radius -= this.radius * 0.12; 
                        if (this.radius < 0) this.radius = 0;
                    } else {
                        this.radius += (this.targetRadius - this.radius) * 0.03;
                    }

                    this.angle += this.speed;
                    
                    let wobbleRadius = this.radius + Math.sin(Date.now() * 0.0005 + this.noiseX) * 20;
                    let wobbleAngle = this.angle + Math.cos(Date.now() * 0.0002 + this.noiseY) * 0.05;

                    this.x = w / 2 + Math.cos(wobbleAngle) * wobbleRadius;
                    this.y = h / 2 + Math.sin(wobbleAngle) * wobbleRadius;
                }
                draw() {
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + this.alpha + ')';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            window.initParticles = function() {
                resize();
                particles = [];
                const qty = window.innerWidth < 768 ? 250 : 500;
                for(let i=0; i < qty; i++) { 
                    particles.push(new Particle());
                }
                window.loaderIsDone = false;
            }

            function animate() {
                ctx.clearRect(0, 0, w, h);
                particles.forEach(p => {
                    p.update();
                    p.draw();
                });
                requestAnimationFrame(animate);
            }

            window.addEventListener('resize', resize);
            window.initParticles();
            animate();

            // Automatiza a abertura e fecho do loader entre as páginas
            window.addEventListener('pageshow', function(event) {
                const loader = document.getElementById('globalLoader');
                if (loader) {
                    if (event.persisted) {
                        loader.style.display = 'none';
                        loader.style.opacity = '0';
                    } else {
                        window.loaderIsDone = true;
                        setTimeout(() => {
                            loader.style.opacity = '0';
                            setTimeout(() => { loader.style.display = 'none'; }, 600);
                        }, 800); 
                    }
                }
            });

            window.addEventListener('beforeunload', function() {
                const loader = document.getElementById('globalLoader');
                if (loader) {
                    if(window.initParticles) window.initParticles();
                    loader.style.display = 'flex';
                    setTimeout(() => { loader.style.opacity = '1'; }, 10); 
                }
            });

        })();
    </script>
    `;
}

module.exports = renderLoaderParticulas;