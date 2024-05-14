// Initialize variables
let isDrawing = false;
let isDrawingCircle = false;
let isEyedropper = false;
let isFilling = false;
let isErasing = false; // Variable to determine eraser mode
let points = [[]];
let undoStack = [[]];
let redoStack = [];
let previousColor = '#000000';

// Initialize canvas and context
const canvasContainer = document.getElementById('canvasContainer');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvasContainer.appendChild(canvas);


// Set canvas color to #FFFFFF
canvas.style.backgroundColor = '#FFFFFF';

// Function to set canvas size
function setCanvasSize() {
    const containerWidth = canvasContainer.offsetWidth;
    const containerHeight = canvasContainer.offsetHeight;
    canvas.width = containerWidth;
    canvas.height = containerHeight;
}

// Function to update UI with brush color and size
function updateUI() {
    colorPicker.value = color;
    brushSizeInput.value = brushSize;
}

// Function to redraw drawing
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(path => {
        for (let i = 1; i < path.length; i++) {
            const startPoint = path[i - 1];
            const endPoint = path[i];
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.strokeStyle = endPoint.color;
            ctx.lineWidth = endPoint.brushSize;
            ctx.lineCap = 'round';
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.stroke();
        }
    });
}

// Function to convert RGB color to HEX
function rgbToHex(rgb) {
    const parts = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!parts) return rgb;
    const hex = (x) => ("0" + parseInt(x).toString(16)).slice(-2);
    return "#" + hex(parts[1]) + hex(parts[2]) + hex(parts[3]);
}

// Function to convert HEX color to RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
        a: 255
    };
}

// Event listener for window resize
window.addEventListener('resize', function() {
    setCanvasSize();
    redraw();
});

// Обработчик события для кнопки очистки холста
document.querySelector('.clear-canvas').addEventListener('click', function() {
    // Сохраняем текущее состояние перед очисткой
    undoStack.push(JSON.parse(JSON.stringify(points)));
    // Очищаем холст
    points = [[]];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Очищаем стек повтора
    redoStack = [];
    // Сохраняем пустое состояние в локальное хранилище
    localStorage.setItem('drawingPoints', JSON.stringify(points));
});

// Обработчик события для кнопки отмены
document.querySelector('.undo').addEventListener('click', function() {
    if (undoStack.length > 1) {
        redoStack.push(JSON.parse(JSON.stringify(points))); // Сохраняем текущее состояние перед отменой
        points = undoStack.pop(); // Получаем предыдущее состояние
        redraw(); // Обновляем холст
    }
});

// Обработчик события для кнопки повтора
document.querySelector('.redo').addEventListener('click', function() {
    if (redoStack.length > 0) {
        undoStack.push(JSON.parse(JSON.stringify(points))); // Сохраняем текущее состояние перед повтором
        points = redoStack.pop(); // Получаем следующее состояние
        redraw(); // Обновляем холст
    }
});




// Event listener for color picker
colorPicker.addEventListener('input', function() {
    color = this.value;
    previousColor = color; // Update previousColor when color is changed
});

// Event listener for brush size input
const brushSizeInput = document.getElementById('brushSize');
brushSizeInput.addEventListener('input', function() {
    brushSize = this.value;
});











// Check for saved points in local storage on page load
window.addEventListener('load', function() {
    const savedPoints = localStorage.getItem('drawingPoints');
    if (savedPoints) {
        points = JSON.parse(savedPoints);
        redraw();
    }
});

//КРУЖКИ ЦВЕТ КИСТЬ

// Получаем все кружки по классу
const colorCircles = document.querySelectorAll('.color-circle');

// Добавляем обработчик событий для каждого кружка
colorCircles.forEach(circle => {
    circle.addEventListener('click', function() {
        // Получаем цвет кружка
        const circleColor = circle.style.backgroundColor;
        // Устанавливаем выбранный цвет как текущий цвет кисти
        colorPicker.value = rgbToHex(circleColor);
        // Обновляем UI
        updateUI();
    });
});

//Сохранение

// Function to save canvas as an image
function saveCanvas(format) {
    const mimeType = (format === 'jpg') ? 'image/jpeg' : 'image/png';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw background color (white) on the temporary canvas
    tempCtx.fillStyle = '#ffffff'; // Здесь вы можете использовать любой цвет фона, который хотите сохранить
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the drawing on the temporary canvas
    points.forEach(path => {
        for (let i = 1; i < path.length; i++) {
            const startPoint = path[i - 1];
            const endPoint = path[i];
            tempCtx.beginPath();
            tempCtx.moveTo(startPoint.x, startPoint.y);
            tempCtx.strokeStyle = endPoint.color;
            tempCtx.lineWidth = endPoint.brushSize;
            tempCtx.lineCap = 'round';
            tempCtx.lineTo(endPoint.x, endPoint.y);
            tempCtx.stroke();
        }
    });

    // Convert the temporary canvas to blob
    tempCanvas.toBlob(function(blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'canvas_image.' + format;
        link.click();
    }, mimeType);
}


// Event listeners for saving canvas as an image in different formats
document.getElementById('saveAsPNG').addEventListener('click', function() {
    saveCanvas('png'); // Call saveCanvas function with 'png' format when "Save as PNG" link is clicked
});

document.getElementById('saveAsJPG').addEventListener('click', function() {
    saveCanvas('jpg'); // Call saveCanvas function with 'jpg' format when "Save as JPG" link is clicked
});

document.getElementById('newFile').addEventListener('click', function() {
    // Предупреждение о перезагрузке страницы
    if (confirm('Вы уверены, что хотите создать новый файл? Все несохраненные изменения будут потеряны.')) {
        // Очистка холста
        clearCanvas();
        // Очистка стеков undoStack и redoStack
        undoStack = [[]];
        redoStack = [];
        // Перезагрузка страницы
        location.reload();
    }
});

// Функция для очистки холста
function clearCanvas() {
    undoStack.push(JSON.parse(JSON.stringify(points)));
    points = [[]];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Save empty state to local storage
    localStorage.setItem('drawingPoints', JSON.stringify(points));
}

// Call setCanvasSize initially and on window resize
setCanvasSize();

// Call updateUI to set initial color and brush size values
updateUI();
