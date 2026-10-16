
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvasContainer = document.querySelector(".canvas-contenedor");

const NORMAL_COLOR = "#808080";
const COLLISION_COLOR = "#0000FF";
const COLLISION_GLOW = "#00BFFF";
const COLLISION_FLASH_FRAMES = 12;

function setCanvasSize() {
    const rect = canvasContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return {
        width: rect.width,
        height: rect.height
    };
}

let dimensions = setCanvasSize();

// Clase Circle basada en el código original del PDF.
class Circle {
    constructor(x, y, radius, color, text, speed) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.color = NORMAL_COLOR;
        this.originalColor = NORMAL_COLOR;
        this.text = text;
        this.speed = speed;

        const angle = Math.random() * Math.PI * 2;

        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;

        this.colliding = false;
        this.flashFrames = 0;
    }

    draw(context) {
        // Azul durante el contacto y brevemente después.
        const flashing =
            this.colliding || this.flashFrames > 0;

        const currentColor = flashing
            ? COLLISION_COLOR
            : NORMAL_COLOR;

        context.save();
        context.beginPath();

        if (flashing) {
            context.shadowColor = COLLISION_GLOW;
            context.shadowBlur = 30;
            context.strokeStyle = COLLISION_COLOR;
            context.lineWidth = 6;
        } else {
            context.shadowBlur = 0;
            context.strokeStyle = NORMAL_COLOR;
            context.lineWidth = 3;
        }

        context.arc(
            this.posX,
            this.posY,
            this.radius,
            0,
            Math.PI * 2
        );

        context.stroke();

        // La etiqueta también destaca durante el choque.
        context.shadowBlur = 0;
        context.fillStyle = flashing
            ? "#FFFFFF"
            : NORMAL_COLOR;

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 13px Arial";

        context.fillText(
            this.text,
            this.posX,
            this.posY
        );

        context.closePath();
        context.restore();
    }

    update() {
        this.posX += this.dx;
        this.posY += this.dy;

        const width = dimensions.width;
        const height = dimensions.height;

        // Rebote en los bordes horizontales.
        if (this.posX + this.radius > width) {
            this.posX = width - this.radius;
            this.dx = -Math.abs(this.dx);
        } else if (this.posX - this.radius < 0) {
            this.posX = this.radius;
            this.dx = Math.abs(this.dx);
        }

        // Rebote en los bordes verticales.
        if (this.posY + this.radius > height) {
            this.posY = height - this.radius;
            this.dy = -Math.abs(this.dy);
        } else if (this.posY - this.radius < 0) {
            this.posY = this.radius;
            this.dy = Math.abs(this.dy);
        }

        // Reduce el tiempo restante del destello.
        if (this.flashFrames > 0) {
            this.flashFrames--;
        }
    }
}

const circles = [];

function randomColor() {
    return NORMAL_COLOR;
}

// Evita, en lo posible, que nazcan superpuestos.
function positionIsFree(x, y, radius) {
    return circles.every(circle => {
        const dx = circle.posX - x;
        const dy = circle.posY - y;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        return distance >= circle.radius + radius + 3;
    });
}

// Genera 20 círculos con velocidades entre 1 y 5.
function generateCircles(n) {
    const width = dimensions.width;
    const height = dimensions.height;

    const maxRadius = Math.max(
        8,
        Math.min(22, width / 25, height / 20)
    );

    const minRadius = Math.min(13, maxRadius);

    for (let i = 0; i < n; i++) {
        const radius = minRadius +
            Math.random() * (maxRadius - minRadius);

        let x = radius + Math.random() *
            Math.max(1, width - radius * 2);

        let y = radius + Math.random() *
            Math.max(1, height - radius * 2);

        let attempts = 0;

        while (
            !positionIsFree(x, y, radius) &&
            attempts < 250
        ) {
            x = radius + Math.random() *
                Math.max(1, width - radius * 2);

            y = radius + Math.random() *
                Math.max(1, height - radius * 2);

            attempts++;
        }

        const speed = 1 + Math.random() * 4;
        const text = `C${i + 1}`;

        circles.push(
            new Circle(
                x,
                y,
                radius,
                randomColor(),
                text,
                speed
            )
        );
    }
}

// Detecta colisiones entre todos los pares de círculos.
function detectCollisions() {
    circles.forEach(circle => {
        circle.colliding = false;
    });

    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            const c1 = circles[i];
            const c2 = circles[j];

            const dx = c2.posX - c1.posX;
            const dy = c2.posY - c1.posY;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            const minDistance =
                c1.radius + c2.radius;

            if (distance <= minDistance) {
                // Ambos círculos se ponen azules.
                c1.colliding = true;
                c2.colliding = true;

                // Reinicia el destello para que sea visible.
                c1.flashFrames = COLLISION_FLASH_FRAMES;
                c2.flashFrames = COLLISION_FLASH_FRAMES;

                const safeDistance =
                    Math.max(distance, 0.0001);

                const nx = dx / safeDistance;
                const ny = dy / safeDistance;

                // Velocidad relativa sobre la normal.
                const relativeVelocity =
                    (c2.dx - c1.dx) * nx +
                    (c2.dy - c1.dy) * ny;

                // Rebote cuando los círculos se aproximan.
                if (relativeVelocity < 0) {
                    const impulse = relativeVelocity;

                    c1.dx += impulse * nx;
                    c1.dy += impulse * ny;

                    c2.dx -= impulse * nx;
                    c2.dy -= impulse * ny;
                }

                // Separa los círculos para evitar que se atasquen.
                const overlap = minDistance - distance;
                const correction = overlap / 2 + 0.1;

                c1.posX -= nx * correction;
                c1.posY -= ny * correction;

                c2.posX += nx * correction;
                c2.posY += ny * correction;
            }
        }
    }
}

// Adapta el canvas al tamaño de la ventana.
let resizeTimer;

window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
        const oldWidth = dimensions.width;
        const oldHeight = dimensions.height;

        dimensions = setCanvasSize();

        circles.forEach(circle => {
            circle.posX = Math.max(
                circle.radius,
                Math.min(
                    dimensions.width - circle.radius,
                    circle.posX * dimensions.width /
                        Math.max(oldWidth, 1)
                )
            );

            circle.posY = Math.max(
                circle.radius,
                Math.min(
                    dimensions.height - circle.radius,
                    circle.posY * dimensions.height /
                        Math.max(oldHeight, 1)
                )
            );
        });
    }, 100);
});

// Animación principal.
function animate() {
    ctx.clearRect(
        0,
        0,
        dimensions.width,
        dimensions.height
    );

    circles.forEach(circle => circle.update());

    detectCollisions();

    circles.forEach(circle => circle.draw(ctx));

    requestAnimationFrame(animate);
}

generateCircles(21);
animate();
