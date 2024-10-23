let interval;
let frame = 0;
let fps = 0;
let fps_frame = 0;
let fps_reset_time = 0;
let fps_timer = 0;
let last_sim_time = 0;

let gameObject;
let canvas;

function startGame(object) {

    //CSS stuff
    let body = document.body;
    body.parentElement.style.height = "100%"; //Set <html> height to 100%

    body.style.width = "100%"; //Set body styles
    body.style.height = "100%";
    body.style.padding = 0;
    body.style.margin = 0;

    canvas = document.createElement("canvas"); //Creates a canvas object
    canvas.style.position = "absolute"; //Sets canvas styles
	canvas.style.top = "0px";
    canvas.style.left = "0px";
    canvas.style.background = "black";
    body.appendChild(canvas); //Adds canvas to the body

    canvas.tabIndex = 1; //Focuses the keyboard on the canvas
    canvas.focus();



    //Game set up stuff
    gameObject = object; //This is needed so that you can refer to the "object" parameter of this function when not inside this function.

    gameObject.setUp();

    window.addEventListener("resize", resizeGame);
    window.addEventListener("visibilitychange", visibilityChange);
    resizeGame();

    window.requestAnimationFrame(updateGame);
    
    //hide cursor
    document.body.style.cursor = 'none';
}

function resizeGame() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    gameObject.resize();
}


function visibilityChange() {
    gameObject.changeVisibility();
}


function getImage(name) {
    let image = new Image();
    //image.onload = function() { console.log(`Loaded ${name}`); }
    image.src = name;
    return image;
}

function updateGame(now) {
    interval = now - last_sim_time; // interval is in ms
    interval = interval / 64;
    if (last_sim_time == 0) {
        interval = 16;
    }
    if (interval > 100) {
        interval = 100;
    }
    last_sim_time = now;
    frame++;
    fps_frame++;
    
    if(now - fps_reset_time > 2000) {
        fps_reset_time = now;
        fps_frame = 0;
    }
    fps = fps_frame / (now - fps_reset_time) * 1000;

    gameObject.updateGame(now, interval)

    window.requestAnimationFrame(updateGame);
}