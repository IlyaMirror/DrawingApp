// JavaScript code for drawing functionality

// Initialize canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function setCanvasSize() {
    const containerWidth = canvas.parentNode.offsetWidth;
    const containerHeight = canvas.parentNode.offsetHeight;
    canvas.width = containerWidth * 0.9; // Например, 90% ширины контейнера
    canvas.height = containerHeight * 0.9; // Например, 90% высоты контейнера
}


// Initialize variables
let isDrawing = false;
let color = '#000000';
let brushSize = 10;
let isErasing = false; // Переменная для определения режима ластика
let lastColor = '#000000'; // Предыдущий цвет
let points = []; // Массив для хранения точек рисунка
let undoStack = [[]]; // Массив для хранения состояний рисунка для отмены изменений
let redoStack = []; // Массив для хранения состояний рисунка для возврата изменений


// Function to start drawing
function startDrawing(e) {
    isDrawing = true;
    points.push([]);
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    points[points.length - 1].push({ x, y, brushSize, color });
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Function to draw or erase based on the current mode
function draw(e) {
    if (isDrawing) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const lastPoint = points[points.length - 1][points[points.length - 1].length - 1];
        ctx.strokeStyle = color; // Устанавливаем цвет кисти в соответствии с текущим режимом
        ctx.lineWidth = lastPoint.brushSize;
        ctx.lineCap = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();
        points[points.length - 1].push({ x, y, brushSize, color });
    }
}


// Function to stop drawing
function stopDrawing() {
    isDrawing = false;
    if (points.length > 0) {
        undoStack.push(JSON.parse(JSON.stringify(points))); // Копируем состояние для сохранения
        redoStack = []; // Очищаем стек возврата
    }
}

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('mousemove', draw);

// Event listener for color picker
const colorPicker = document.getElementById('colorPicker');
colorPicker.addEventListener('input', function() {
    color = this.value;
});

// Event listener for brush size
const brushSizeInput = document.getElementById('brushSize');
brushSizeInput.addEventListener('input', function() {
    brushSize = parseInt(this.value);
});

// Функция для обновления значений цвета и размера кисти
function updateUI() {
    colorPicker.value = color;
    brushSizeInput.value = brushSize;
}

// Вызываем функцию updateUI, чтобы установить начальные значения
updateUI();


// Event listener for brush tool buttons
document.querySelectorAll('.brush-tool').forEach(button => {
    button.addEventListener('click', function() {
        if (this.classList.contains('erase-tool')) {
            isErasing = true;
            lastColor = color; // Сохраняем текущий цвет кисти перед использованием ластика
            color = '#FFFFFF'; // Устанавливаем цвет для ластика
        } else {
            isErasing = false;
            color = lastColor; // Устанавливаем цвет обратно на цвет последней кисти перед использованием ластика
        }
    });
});



// Call setCanvasSize initially and on window resize
setCanvasSize();
window.addEventListener('resize', function() {
    setCanvasSize();
    redraw();
});

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

// Event listener for undo button
document.getElementById('undoButton').addEventListener('click', function() {
    if (undoStack.length > 1) {
        redoStack.push(JSON.parse(JSON.stringify(points))); // Копируем состояние для возврата
        points = undoStack.pop(); // Восстанавливаем состояние
        redraw(); // Перерисовываем canvas
    }
});

// Event listener for redo button
document.getElementById('redoButton').addEventListener('click', function() {
    if (redoStack.length > 0) {
        undoStack.push(JSON.parse(JSON.stringify(points))); // Копируем состояние для отмены
        points = redoStack.pop(); // Восстанавливаем состояние
        redraw(); // Перерисовываем canvas
    }
});

// Save drawing state before window is unloaded
window.addEventListener('beforeunload', function() {
    localStorage.setItem('drawing', JSON.stringify(points));
    localStorage.setItem('undoStack', JSON.stringify(undoStack));
    localStorage.setItem('redoStack', JSON.stringify(redoStack));
});

// Restore drawing state from localStorage if it exists
window.addEventListener('load', function() {
    const savedDrawing = localStorage.getItem('drawing');
    if (savedDrawing) {
        points = JSON.parse(savedDrawing);
        redraw();
    }
    const savedUndoStack = localStorage.getItem('undoStack');
    if (savedUndoStack) {
        undoStack = JSON.parse(savedUndoStack);
    }
    const savedRedoStack = localStorage.getItem('redoStack');
    if (savedRedoStack) {
        redoStack = JSON.parse(savedRedoStack);
    }
});

// Event listener for clear canvas button
document.querySelector('.clear-canvas').addEventListener('click', function() {
    // Очищаем массив redoStack при очистке холста
    redoStack = [];
    // Добавляем текущее состояние холста в стек undoStack
    undoStack.push(JSON.parse(JSON.stringify(points)));
    // Очищаем массив точек рисунка
    points = [[]];
    // Очищаем холст
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});


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
    // Очищаем массив redoStack при очистке холста
    redoStack = [];
    // Добавляем текущее состояние холста в стек undoStack
    undoStack.push(JSON.parse(JSON.stringify(points)));
    // Очищаем массив точек рисунка
    points = [[]];
    // Очищаем холст
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// JavaScript code for drawing functionality

// Получаем все кружки
const colorCircles = document.querySelectorAll('.color-circle');

// Добавляем обработчик клика на каждый кружок
colorCircles.forEach(circle => {
    circle.addEventListener('click', function() {
        // Получаем цвет кружка при клике
        const selectedColor = this.style.backgroundColor;
        // Устанавливаем выбранный цвет для кисти
        color = selectedColor;
        // Обновляем значение цвета в <input type="color">
        colorPicker.value = rgbToHex(selectedColor);
    });
});

// Функция для преобразования RGB цвета в HEX
function rgbToHex(rgb) {
    // Разбиваем RGB строку на массив значений
    const parts = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!parts) return rgb;
    // Преобразуем каждое значение из десятичной в шестнадцатеричную систему
    const hex = (x) => ("0" + parseInt(x).toString(16)).slice(-2);
    // Формируем строку HEX цвета
    return "#" + hex(parts[1]) + hex(parts[2]) + hex(parts[3]);
}

/////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////
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
