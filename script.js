const toolsBtn = document.querySelectorAll(".tool"),
canvas = document.querySelector("canvas"),
colorFill = document.querySelector("#fill-color"),
sizeSlider = document.querySelector("#size-slider"),
colorBtns = document.querySelectorAll(".colors .option"),
colorPicker = document.querySelector("#color-picker"),
cleanCanvas = document.querySelector(".clear-board"),
saveCanvas = document.querySelector(".save-board"),
redoCanvas = document.querySelector(".redo-board"),
undoCanvas = document.querySelector(".undo-board"),
pipetteBtn = document.getElementById('pipette');

const ctx = canvas.getContext("2d");

let selectedTool = "brush",
brushWidth = 5,
selectedColor = "black",
isDrawing = false,
prevMouseX,
prevMouseY,
snapShot,
maxPressure = 0,
undoStack = [],
redoStack = [];

const setCanvasBackground = () => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = selectedColor;
}

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    canvas.style.cursor = "crosshair";
    setCanvasBackground();
});

const drawRect = (e) => {
    const offsetX = e.offsetX || e.touches[0].clientX - canvas.getBoundingClientRect().left;
    const offsetY = e.offsetY || e.touches[0].clientY - canvas.getBoundingClientRect().top;
    if (!colorFill.checked) {
        ctx.strokeRect(offsetX, offsetY, prevMouseX - offsetX, prevMouseY - offsetY);
    } else {
        ctx.fillRect(offsetX, offsetY, prevMouseX - offsetX, prevMouseY - offsetY);
    }
}

const drawCircle = (e) => {
    ctx.beginPath();
    const offsetX = e.offsetX || e.touches[0].clientX - canvas.getBoundingClientRect().left;
    const offsetY = e.offsetY || e.touches[0].clientY - canvas.getBoundingClientRect().top;
    const radius = Math.sqrt(Math.pow(prevMouseX - offsetX, 2) + Math.pow(prevMouseY - offsetY, 2));

    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);

    if (colorFill.checked) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}

const drawTriangle = (e) => {
    ctx.beginPath();
    const offsetX = e.offsetX || e.touches[0].clientX - canvas.getBoundingClientRect().left;
    const offsetY = e.offsetY || e.touches[0].clientY - canvas.getBoundingClientRect().top;
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(offsetX, offsetY);
    ctx.lineTo(prevMouseX * 2 - offsetX, offsetY);
    ctx.closePath();
    if (colorFill.checked) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}

toolsBtn.forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelector('.options .active').classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
    });
});

colorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelector('.options .selected').classList.remove("selected");
        btn.classList.add("selected");
        selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
    });
});

colorPicker.addEventListener("change", () => {
    colorPicker.parentElement.style.background = colorPicker.value;
    colorPicker.parentElement.click();
});

const startDraw = (e) => {
    e.preventDefault(); // предотвращение прокрутки
    isDrawing = true;
    const offsetX = e.offsetX || e.touches[0].clientX - canvas.getBoundingClientRect().left;
    const offsetY = e.offsetY || e.touches[0].clientY - canvas.getBoundingClientRect().top;
    prevMouseX = offsetX;
    prevMouseY = offsetY;
    maxPressure = e.pressure || 0.5; // Устанавливаем начальное максимальное давление
    ctx.beginPath();
    ctx.lineWidth = brushWidth * maxPressure;
    ctx.strokeStyle = selectedColor;
    ctx.fillStyle = selectedColor;
    snapShot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoStack = [];
};

let zoomLevel = 1;
const container = canvas.parentElement;

const drawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // предотвращение прокрутки
    ctx.putImageData(snapShot, 0, 0);
    const offsetX = e.offsetX || e.touches[0].clientX - canvas.getBoundingClientRect().left;
    const offsetY = e.offsetY || e.touches[0].clientY - canvas.getBoundingClientRect().top;
    
    const currentPressure = e.pressure || 0.5; // Текущее давление (по умолчанию 0.5)
    maxPressure = Math.max(maxPressure, currentPressure); // Обновляем максимальное давление
    
    if (selectedTool === "brush" || selectedTool === "eraser") {
        canvas.style.cursor = "crosshair";
        ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
        ctx.lineWidth = brushWidth * currentPressure; // Учитываем текущее давление при рисовании
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        prevMouseX = offsetX; // Обновляем предыдущие координаты
        prevMouseY = offsetY; // Обновляем предыдущие координаты
    } else if (selectedTool === "rectangle") {
        drawRect(e);
    } else if (selectedTool === "circle") {
        drawCircle(e);
    } else if (selectedTool === "zoomin") {
        canvas.style.cursor = "zoom-in";
        zoomLevel += 0.02;
        canvas.style.transform = `scale(${zoomLevel})`;
    } else if (selectedTool === "zoomout") {
        canvas.style.cursor = "zoom-out";
        zoomLevel -= 0.02;
        canvas.style.transform = `scale(${zoomLevel})`;
        if (zoomLevel <= 1) {
            canvas.style.transform = `scale(1)`;
            container.style.overflow = "hidden";
        }
    } else {
        drawTriangle(e);
    }
};

const stopDrawing = () => {
    isDrawing = false;
    if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.lineWidth = brushWidth * maxPressure; // Применяем максимальное давление
        ctx.lineTo(prevMouseX, prevMouseY);
        ctx.stroke();
        ctx.beginPath(); // Начинаем новый путь, чтобы сбросить текущий контур
    }
    saveSnapshot();
};

const saveSnapshot = () => {
    redoStack = [];
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
};

undoCanvas.onclick = () => {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        const prevImageData = undoStack[undoStack.length - 1];
        ctx.putImageData(prevImageData, 0, 0);
    }
};

redoCanvas.onclick = () => {
    if (redoStack.length > 0) {
        undoStack.push(redoStack.pop());
        const nextImageData = undoStack[undoStack.length - 1];
        ctx.putImageData(nextImageData, 0, 0);
    }
};

sizeSlider.addEventListener("change", () => { brushWidth = sizeSlider.value });

cleanCanvas.onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasBackground();
};

saveCanvas.onclick = () => {
    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = canvas.toDataURL();
    link.click();
};

let isCtrlPressed = false;
let isShiftPressed = false;

window.addEventListener("keydown", (event) => {
    if (event.keyCode === 17) {
        isCtrlPressed = true;
    }
    if (event.keyCode === 16) {
        isShiftPressed = true;
    }

    if (isCtrlPressed && event.keyCode === 90 && !isShiftPressed) {
        undoCanvas.click();
    }
    if (isCtrlPressed && event.keyCode === 90 && isShiftPressed) {
        redoCanvas.click();
    }
});

window.addEventListener("keyup", (event) => {
    if (event.keyCode === 17) {
        isCtrlPressed = false;
    }
    if (event.keyCode === 16) {
        isShiftPressed = false;
    }
});

// Обработчики для планшета и мыши
canvas.addEventListener("pointerdown", startDraw);
canvas.addEventListener("pointermove", drawing);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);

window.addEventListener("resize", () => {
    saveSnapshot();

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setCanvasBackground();

    setTimeout(() => {
        undoCanvas.onclick();
    }, 100);
});

window.addEventListener("beforeunload", () => {
    const canvasData = canvas.toDataURL();
    localStorage.setItem("canvasData", canvasData);
});

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    canvas.style.cursor = "crosshair";
    setCanvasBackground();

    const canvasData = localStorage.getItem("canvasData");
    if (canvasData) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
        img.src = canvasData;
    }
});

const getColorAtPixel = (x, y) => {
    const pixel = ctx.getImageData(x, y, 1, 1);
    const data = pixel.data;
    return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
};

pipetteBtn.addEventListener('click', () => {
    selectedTool = "pipette";
    canvas.style.cursor = "crosshair";
    pipette();
});

const pipette = () => {
    const pipetteClickHandler = (e) => {
        const x = e.offsetX || e.layerX;
        const y = e.offsetY || e.layerY;
        const color = getColorAtPixel(x, y);
        selectedColor = color;
        colorPicker.value = color;
        colorPicker.parentElement.style.background = color;
        
        // Удалить обработчик события клика после его выполнения
        canvas.removeEventListener('click', pipetteClickHandler);
    };
    
    canvas.addEventListener('click', pipetteClickHandler);
};


pipette();

const drawLine = (startX, startY, endX, endY) => {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
};


// Предотвращение прокрутки при касании
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('pointerdown', function(e) {
    e.preventDefault();
});
