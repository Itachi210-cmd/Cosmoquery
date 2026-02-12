/**
 * Deep Space Particle System 🌌
 * Renders a subtle, moving starfield on a canvas element.
 */

const canvas = document.getElementById('starfield');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let stars = [];

    // Configuration
    const STAR_COUNT = 300;
    const SPEED = 0.05; // Base movement speed
    const MOUSE_SENSITIVITY = 0.05;

    // Mouse State
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    // Initialize Canvas Size
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    // Star Class
    class Star {
        constructor() {
            this.init();
        }

        init() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.z = Math.random() * 2 + 0.5; // Depth factor (0.5 to 2.5)
            this.size = Math.random() * 1.5;
            this.opacity = Math.random() * 0.5 + 0.3;
            // Velocity based on depth (closer stars move faster)
            this.vx = (Math.random() - 0.5) * SPEED * this.z;
            this.vy = (Math.random() - 0.5) * SPEED * this.z;
        }

        update() {
            // Automatic movement
            this.x += this.vx;
            this.y += this.vy;

            // Parallax movement based on mouse
            // Move opposite to mouse direction
            const parallaxX = (mouseX - width / 2) * MOUSE_SENSITIVITY * this.z * 0.1;
            const parallaxY = (mouseY - height / 2) * MOUSE_SENSITIVITY * this.z * 0.1;

            // Apply drift toward target (smooth damping)
            this.x += (targetX - mouseX) * 0.001 * this.z;

            // Wrap around screen
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            // Apply parallax offset only during draw to keep logical position stable
            const drawX = this.x + (mouseX - width / 2) * MOUSE_SENSITIVITY * this.z;
            const drawY = this.y + (mouseY - height / 2) * MOUSE_SENSITIVITY * this.z;

            ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Initialize System
    function init() {
        resize();
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star());
        }
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        });
        animate();
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Smooth mouse interpolation
        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;

        stars.forEach(star => {
            star.update();
            star.draw();
        });
        requestAnimationFrame(animate);
    }

    // Start
    init();
}
