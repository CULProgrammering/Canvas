/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext('2d');


let drawing = false;
let startX, startY;
let currentRect = null;
let color;
let shapes = [];
let json;

const openSocket = () => {
    const socket = new WebSocket('ws://92.32.155.142:8080');
    socket.onopen = () => console.log('Connected');
    socket.onerror = (err) => console.log('Error:', err);

    socket.addEventListener('open', () => {
        console.log('Connected to WebSocket server');
    });

    socket.addEventListener('message', async (event) => {
        let text;
        if (event.data instanceof Blob) 
        {
            text = await event.data.text();
        }
        else 
        {
            text = event.data;
        }

        const data = JSON.parse(text);
        //console.log(data);
        //change
        shapes = data.map(shapeData => new Shape(
            shapeData.type, 
            shapeData.x, 
            shapeData.y, 
            shapeData.width, 
            shapeData.height, 
            shapeData.coords || [], // Default to empty array if missing
            shapeData.color
        ));        
        console.log(shapes);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        shapes.forEach(shape => {
            shape.draw(ctx);
        });
        
    });

    return socket;
}

const socket = openSocket();

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
    color = document.getElementById('colorPicker').value;
    const shape = document.querySelector('input[name="shape"]:checked').value;
    ctx.strokeStyle = color;
    ctx.fillStyle = color; 
    shapes.push(new Shape(shape, startX, startY, 0, 0, [], color)); // Initialize with defaults
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const currentX = e.offsetX;
    const currentY = e.offsetY;
    const shape = document.querySelector('input[name="shape"]:checked').value;
    if (shape === "line") {
        shapes[shapes.length - 1].coords.push({X: currentX, Y: currentY});

    } else if (shape === "rectangle") {
        shapes[shapes.length - 1].width = currentX - startX;
        shapes[shapes.length - 1].height = currentY - startY;
    } else if (shape === "circle") {
        shapes[shapes.length - 1].width = currentX - startX;
        shapes[shapes.length - 1].height = currentY - startY;
    }
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // shapes.forEach(shape => {
    //     shape.draw(ctx);
    // });
    json = JSON.stringify(shapes);
    socket.send(json);
    //console.log(json);
});

canvas.addEventListener('mouseup', (e) => {
    drawing = false;
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});



class Shape {
    constructor(type, x, y, width, height, coords, color) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width || 0; // Default to 0 if not provided
        this.height = height || 0;
        this.coords = coords || []; // Default to empty array
        this.color = color;
        this.radius = this.type === 'circle' ? Math.hypot(this.width, this.height) : 0;
    }

    draw(ctx) {
        if (this.type === 'circle') {
            this.radius = Math.hypot(this.width, this.height);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        else if (this.type === 'rectangle') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === 'line') {
            ctx.strokeStyle = this.color;
           if (this.coords.length > 1) {
                
                for (let i = 1; i < this.coords.length; i++) {
                    ctx.beginPath();
                    ctx.moveTo(this.coords[i-1].X, this.coords[i-1].Y);
                    ctx.lineTo(this.coords[i].X, this.coords[i].Y);
                    ctx.stroke();
                }
            }
        }
        ctx.closePath();
    }
}