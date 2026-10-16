const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvasContainer = document.querySelector(".canvas-contenedor");
const scoreElement = document.getElementById("score");

// Carga de imágenes (asegúrate de incluir 'cueva.webp' y 'diamante.webp' en la misma carpeta)
const bgImage = new Image();
bgImage.src = "cueva.webp";

const diamondImage = new Image();
diamondImage.src = "diamante.webp";

let score = 0;
const TOTAL_DIAMONDS = 25; // Cantidad fija de objetos requerida

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

// Configuración de dificultad según la puntuación
function getSpeedMultiplier() {
    if (score > 20) {
        return 1.8; // Velocidad alta
    } else if (score > 10) {
        return 1.4; // Velocidad media
    }
    return 1.0; // Velocidad inicial
}

class Diamond {
    constructor(isInitial = false) {
        this.size = 70; // Tamaño del sprite del diamante
        this.reset(isInitial);
    }

    reset(isInitial = false) {
        const width = dimensions.width;
        
        // Ubicación X aleatoria en la parte superior
        this.x = Math.random() * (width - this.size);
        
        // Si es el inicio, distribuir en la pantalla; si reaparece, iniciar justo arriba del canvas
        if (isInitial) {
            this.y = Math.random() * (dimensions.height - this.size);
        } else {
            this.y = -this.size - Math.random() * 100;
        }

        const multiplier = getSpeedMultiplier();
        this.vy = (1 + Math.random() * 3) * multiplier; // Velocidad vertical inicial
        this.vx = (Math.random() - 0.5) * 2; // Ligero desplazamiento horizontal para formar parábolas
        this.gravity = 0.25 * multiplier; // Efecto de gravedad
        this.bounce = 0.65; // Factor de restitución (pérdida de fuerza en cada rebote)
        this.bouncesCount = 0;
        this.maxBounces = 3 + Math.floor(Math.random() * 2); // Límite de rebotes
    }

    update() {
        this.vy += this.gravity;
        this.y += this.vy;
        this.x += this.vx;

        const width = dimensions.width;
        const height = dimensions.height;

        // Rebotes en las paredes laterales
        if (this.x <= 0) {
            this.x = 0;
            this.vx *= -1;
        } else if (this.x + this.size >= width) {
            this.x = width - this.size;
            this.vx *= -1;
        }

        // Rebote en el piso (borde inferior)
        if (this.y + this.size >= height) {
            this.y = height - this.size;
            this.vy = -this.vy * this.bounce; // Rebote tipo pelota (parábola)
            this.vx *= 0.8; // Fricción con el suelo
            this.bouncesCount++;

            // Cuando pierde suficiente fuerza o supera el límite de rebotes, reaparece arriba
            if (Math.abs(this.vy) < 1.5 || this.bouncesCount >= this.maxBounces) {
                this.reset(false);
            }
        }
    }

    draw(context) {
        if (diamondImage.complete && diamondImage.naturalWidth !== 0) {
            context.drawImage(diamondImage, this.x, this.y, this.size, this.size);
        } else {
            // Dibujo alternativo si la imagen aún no ha cargado
            context.fillStyle = "#00ffff";
            context.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    // Comprobación para detectar si el clic del ratón ocurrió dentro del diamante
    isClicked(mouseX, mouseY) {
        return (
            mouseX >= this.x &&
            mouseX <= this.x + this.size &&
            mouseY >= this.y &&
            mouseY <= this.y + this.size
        );
    }
}

const diamonds = [];

function initDiamonds() {
    diamonds.length = 0;
    for (let i = 0; i < TOTAL_DIAMONDS; i++) {
        diamonds.push(new Diamond(true));
    }
}

// Detección de clics para eliminar objetos e incrementar el contador
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let i = diamonds.length - 1; i >= 0; i--) {
        if (diamonds[i].isClicked(mouseX, mouseY)) {
            score++;
            scoreElement.textContent = score;
            diamonds[i].reset(false); // Reaparece arriba para mantener siempre 25 objetos
            break; // Elimina solo un diamante por clic
        }
    }
});

// Ajuste dinámico de ventana
let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        dimensions = setCanvasSize();
    }, 100);
});

// Bucle principal de animación
function animate() {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Dibujar fondo wallpaper de la cueva
    if (bgImage.complete && bgImage.naturalWidth !== 0) {
        ctx.drawImage(bgImage, 0, 0, dimensions.width, dimensions.height);
    } else {
        ctx.fillStyle = "#172033";
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    // Actualizar y renderizar diamantes
    diamonds.forEach(diamond => {
        diamond.update();
        diamond.draw(ctx);
    });

    requestAnimationFrame(animate);
}

// Inicializar y ejecutar
initDiamonds();
animate();