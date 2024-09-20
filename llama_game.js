"use strict";

//To do:
//Set up enemies
//optimize hitboxes
//add rolling/dashing
//set up map editor
//screen shake???

const CW = 64;//Cell width
const WORLD_HEIGHT = 22; //In cells
const WORLD_WIDTH = 22;
const WORLD_CENTER_X = WORLD_WIDTH/2; //In cells
const WORLD_CENTER_Y = WORLD_HEIGHT/2;
const PLAYER_HITBOX_SIZE = 0.75;
const BULLET_HITBOX_SIZE = 0.1;
const ENEMY_HITBOX_SIZE = 1;
const SPEED = 2;
const ENEMY_SPEED = 1;
const ENEMY_INTERVAL = 100;
const PLAYER_BULLET_SPEED = 6;

let bullet_interval = 100;
let bullets_per_shot = 1;

let world = undefined;
let player;
let bullets = [];
let enemies = [];

let wall_tile; 
let empty_tile;
let player_tile;
let gun_tile;
let bullet_tile;
let enemy_tile;
let tiles;
let crosshairs;

let crosshair_frame = 0;

let key_w = false;
let key_a = false;
let key_s = false;
let key_d = false;
let key_f = true;
let key_x = false;
let key_q = false;
let mouse_x = 0;
let mouse_y = 0;
let real_mouse_x = 0;
let real_mouse_y = 0;
let left_mousedown = false;
let right_mousedown = false;

let last_bullet_time = 0;
let last_enemy_time = 0;
let last_player_x = 0;
let last_player_y = 0;
let real_speed = 0;

let view_center_x; //x coordinate of the center of the view in world (in cells)
let view_center_y;
let view_width; //In pixels
let view_height;
let view_cell_width; //In cells
let view_cell_height;

let game_mode = 2;
let gun = 0;

//Map stuff
let test_map = [
    [3].concat(new Array(7).fill(13)).concat([4]).concat((2)),
    [11].concat(new Array(7).fill(1)).concat([12]).concat([2]),
    [11].concat(new Array(7).fill(1)).concat([12]).concat([2]),
    [11].concat(new Array(7).fill(1)).concat([12]).concat([2]),
    [11].concat(new Array(7).fill(1)).concat([12]).concat([2]),
    [11].concat(new Array(7).fill(1)).concat([12]).concat([2]),
    [11].concat(new Array(7).fill(1)).concat([12]).concat([2]),
    [11].concat(new Array(7).fill(1)).concat([12]).concat([2]),
    [5].concat(new Array(7).fill(14)).concat([6]).concat((2)),
    new Array(10).fill(2)
];

let test_map2 = [
    new Array(22).fill(2),
    [2].concat(3).concat(new Array(18).fill(13)).concat(4).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(11).concat(new Array(18).fill(1)).concat(12).concat(2),
    [2].concat(5).concat(new Array(18).fill(14)).concat(6).concat(2),
    new Array(22).fill(2)
]

function randMap(world, w, h) {
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            world.d[y][x] = Math.floor(Math.random()*14);
        }
    }
}

function createMap(world, w, h) {
    let tmh = test_map2.length;
    let tmw = test_map2[0].length;
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            let r = test_map2[y % tmh];
            r = r.concat(new Array(tmw).fill(0));
            world.d[y][x] = r[x % tmw];
        }
    }
}

function changeMap(map, x, y) {
    map[y][x] = 2;
    map[y][x+1] = 11;
    map[y+1][x] = 13;
    map[y][x-1] = 12;
    map[y-1][x] = 14;
    map[y-1][x-1] = 7;
    map[y-1][x+1] = 8;
    map[y+1][x-1] = 9;
    map[y+1][x+1] = 10;
}

changeMap(test_map2, 6, 4);
changeMap(test_map2, 9, 7);
changeMap(test_map2, 13, 4);
changeMap(test_map2, 17, 15); 

class Box {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.rx = width/2;
        this.ry = height/2;
    }
    intersects(box) {
        return (Math.abs(box.x - this.x) < box.rx + this.rx && 
                Math.abs(box.y - this.y) < box.ry + this.ry);
    }
}

class World {
    constructor(wx, wy) {
        this.width = wx;
        this.height = wy;
        this.d = [];
        this.obstacles = [];
        for (var y = 0; y < wy; y++) {
            this.d[y] = new Array(wx);
            this.d[y].fill(0);
        }
    }
    calculateObstacles() {
        for (let y = 0; y < this.width; y++) {
            for (let x = 0; x < this.height; x++) {
                let thisTile = this.d[y][x];
                if (thisTile == 2) {
                    this.obstacles.push(new Box(x+0.5, y+0.5, 1, 1));
                }
            }
        }
    }
    get(x, y) {
        if (x >= 0 && x < this.width &&
            y >= 0 && y < this.height) {
                return(this.d[y][x]);

        }   
        return 0;
    }
    set(x, y, tile) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
          }
          this.d[y][x] = tile;
    }
    is_passable(x, y, r) {
        let b = new Box(x, y, r, r);
        return this.obstacles.find(x => x.intersects(b)) == undefined;
    }
}

class Bullet {
    constructor(x, y, dx, dy, speed) {
        let l = (dx **2 + dy **2)**0.5
        if (gun == 0) {
            this.dx = dx/l + Math.random()/10 - 0.05;
            this.dy = dy/l + Math.random()/10 - 0.05;
        } else if (gun == 1) {
            this.dx = dx/l + Math.random()/2 - 0.25;
            this.dy = dy/l + Math.random()/2 - 0.25;
        } else if (gun == 2) {
            this.dx = dx/l + Math.random()/5 - 0.1;
            this.dy = dy/l + Math.random()/5 - 0.1;
        }
        this.speed = speed;
        this.x = x + this.dx;
        this.y = y + this.dy;
        this.alive = true;
    }
    update(interval) {
        let dx = this.dx * this.speed / interval;
        let dy = this.dy * this.speed / interval;
        let new_x = this.x + dx;
        let new_y = this.y + dy;
        
        if (world.is_passable(new_x, new_y, BULLET_HITBOX_SIZE)) {
            this.x = new_x;
            this.y = new_y;
        } else {
            this.alive = false;
        }
    }
}

class Player {
    constructor(x, y, size) { //size is in cell units
        this.x = x;
        this.y = y;
        this.size = size;
    }
    tryMove(dx, dy) {
        for (let i = 16; i > 0; i--) {
            let step = i/16;
            let new_x = this.x + step * dx;
            let new_y = this.y + step * dy;
            if (world.is_passable(new_x, new_y, this.size)) {
                this.x = new_x;
                this.y = new_y;
                return true;
            }
        }
        return false;
    }
}

class Enemy {
    constructor(x, y, dx, dy, speed) {
        let l = (dx **2 + dy **2)**0.5;
        this.x = x;
        this.y = y;
        this.dx = dx/l;
        this.dy = dy/l;
        this.speed = speed;
        this.alive = true;
    }
    update(interval) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let l = (dx **2 + dy **2)**0.5;
        dx = dx / l;
        dy = dy / l;
        dx = dx * this.speed / interval;
        dy = dy * this.speed / interval;
        let new_x = this.x + dx;
        let new_y = this.y + dy;
        if (world.is_passable(new_x, this.y, ENEMY_HITBOX_SIZE)) {
            this.x = new_x;
        }
        if (world.is_passable(this.x, new_y, ENEMY_HITBOX_SIZE)) {
            this.y = new_y;
        }
        if (this.touchBullet()) {
            this.alive = false;
        }
    }
    touchBullet() {
        let b = new Box(this.x, this.y, ENEMY_HITBOX_SIZE, ENEMY_HITBOX_SIZE);
        for (let i = 0; i < bullets.length; i ++) {
            let b2 = new Box(bullets[i].x, bullets[i].y, BULLET_HITBOX_SIZE, BULLET_HITBOX_SIZE);
            if (b.intersects(b2)) {
                console.log("hit");
                return true;
            }
        }
        return false;
    }
}

class Tile {
    constructor(image, src_x, src_y, size, x_off, y_off) {
        this.image = image;
        this.src_x = src_x;
        this.src_y = src_y;
        this.size = size;
        this.x_off = x_off;
        this.y_off = y_off;
        this.rotation = 0;
        this.scale_x = 1;
        this.scale_y = 1;
    }
}

function gameSetUp() {
    setUpTiles(); //makes images
    world = new World(WORLD_WIDTH,WORLD_HEIGHT);
    createMap(world, world.width, world.height);

    world.calculateObstacles();

    player = new Player(WORLD_CENTER_X,WORLD_CENTER_Y,PLAYER_HITBOX_SIZE);

    document.body.addEventListener('keydown', keydownHandler);
    document.body.addEventListener('keyup', keyupHandler);
    document.body.addEventListener("mousemove", mousemoveHandler)
    document.body.addEventListener("mousedown", mousedownHandler);
    document.body.addEventListener("mouseup", mouseupHandler);

}

function setUpTiles() {
    let m = getImage("combined_art.png");
    tiles = [];
    for (let i = 0; i < 15; i++) {
        tiles[i] = new Tile(m, i * 64, 0, CW, 0, 0);
    }
    crosshairs = [];
    for (let i = 0; i < 2; i++) {
        crosshairs[i] = new Tile(m, i * 64, 64 * 7, CW, -CW/2, -CW/2);
    }
    player_tile = new Tile(m, 0, 64 * 5, 2 * CW, -CW / 2, -CW - CW/8);
    gun_tile = new Tile(m, 0, CW, CW, 0, -3);
    bullet_tile = new Tile(m, CW * 2, CW, CW, -7, -7);
    enemy_tile = new Tile(m, 0, 64 * 3, 2 * CW, -CW/2, -CW);
}

function resize() {
    view_width = canvas.width;
    view_width = view_width & ~1;
    view_height = canvas.height & ~1;
    view_cell_width = view_width/CW; 
    view_cell_height = view_height/CW;
}

function keydownHandler(e) {
    if (e.key == "w") {
        key_w = true;
    } else if (e.key == "a") {
        key_a = true;
    } else if (e.key == "s") {
        key_s = true;
    } else if (e.key == "d") {
        key_d = true;
    } else if (e.key == "f" && !key_f) {
        key_f = true;
    } else if (e.key == "f" && key_f) {
        key_f = false;
    } else if (e.key == "x" && !key_x) {
        key_x = true;
        if (game_mode < 2) {
            game_mode = game_mode + 1;
        } else {
            game_mode = 0;
        }
    } else if (e.key == "q" && !key_q) {
        key_q = true;
        if (gun < 2) {
            gun++;
        } else {
            gun = 0;
        }
    } else {
        return true;
    }
}

function keyupHandler(e) {
    if (e.key == "w") {
        key_w = false;
    } else if (e.key == "a") {
        key_a = false;
    } else if (e.key == "s") {
        key_s = false;
    } else if (e.key == "d") {
        key_d = false;
    } else if (e.key == "x") {
        key_x = false;
    } else if (e.key == "q") {
        key_q = false;
    } else {
        return true;
    }
}

function mousemoveHandler(e) {
    real_mouse_x = e.offsetX;
    real_mouse_y = e.offsetY;
    mouse_x = e.offsetX - view_width/2;
    mouse_y = e.offsetY - view_height/2;
}

function mousedownHandler(e) {
    if (e.button == 0) {
        left_mousedown = true;
        crosshair_frame = 1;
    }
    if (e.button == 2) {
        right_mousedown = true;
    }
}

function mouseupHandler(e) {
    if (e.button == 0) {
        left_mousedown = false;
        crosshair_frame = 0;
    }
    if (e.button == 2) {
        right_mousedown = false;
    }
}

function worldToScreenX(x) {
    return Math.floor((x - view_center_x)*CW + view_width/2);
}

function worldToScreenY(y) {
    return Math.floor((y-view_center_y)*CW + view_height/2);
}

//Checks if something is in the view(all parameters are in cell units)
function inView(x, y, half_width, half_height) {
    if (x + half_width >= view_center_x - view_cell_width / 2 && x - half_width <= view_center_x + view_cell_width / 2) {
        if (y + half_height >= view_center_y - view_cell_height / 2 && y - half_height <= view_center_y + view_cell_height / 2) {
            return true;
        }
    }
    return false;
}

function drawTileWithTransform(ctx, tile, x, y) {
    let x_pos_on_view = worldToScreenX(x); //Changes from cell coordinates in the world to pixel coordinates on view
    let y_pos_on_view = worldToScreenY(y);
    
    ctx.save();
    ctx.translate(x_pos_on_view,y_pos_on_view); 
    console.log(tile.rotation);
    ctx.rotate(-tile.rotation);
    ctx.scale(tile.scale_x, tile.scale_y);
    ctx.translate(-x_pos_on_view,-y_pos_on_view)
    
    ctx.drawImage(tile.image, 
        tile.src_x, tile.src_y, tile.size, tile.size, 
        x_pos_on_view + tile.x_off, y_pos_on_view + tile.y_off, tile.size, tile.size); //changes to pixels
    ctx.restore();
}

function drawCrosshair(ctx, tile, x, y) {
    ctx.save();
    ctx.translate(x,y); 
    console.log(tile.rotation);
    ctx.rotate(-tile.rotation);
    ctx.scale(tile.scale_x, tile.scale_y);
    ctx.translate(-x,-y)
    
    ctx.drawImage(tile.image, 
        tile.src_x, tile.src_y, tile.size, tile.size, 
        Math.round(x + tile.x_off), Math.round(y + tile.y_off), tile.size, tile.size); //changes to pixels
    ctx.restore();
}

function movePlayer(interval) {
    let MS = SPEED/interval;
    let DMS = MS/Math.sqrt(2);
    let doneMoving = false;

    if (key_a && !doneMoving) {
        if (key_w) {
            if (player.tryMove(-DMS, -DMS)) {
                doneMoving = true;
            }
            
        } else if (key_s) {
            if (player.tryMove(-DMS, DMS)) {
                doneMoving = true;
            }
        }
        if (!doneMoving){
            if (player.tryMove(-MS,0)) {
            doneMoving = true;
            }
        }
        player_tile.scale_x = -1;
    }
    if (key_d && !key_a && !doneMoving) {
        if (key_w && !doneMoving) {
            if (player.tryMove(DMS, -DMS)) {
            doneMoving = true;
            }
        } else if (key_s && !doneMoving) {
            if (player.tryMove(DMS, DMS)) {
            doneMoving = true;
            }
        } 
        if (!doneMoving) {
            if (player.tryMove(MS,0)) {
            doneMoving = true;
            }
        }
        player_tile.scale_x = 1;
    }
    if (key_w && !key_s && !doneMoving) {
        player.tryMove(0,-MS);
        doneMoving = true;
    }
    if (key_s && !key_w && !doneMoving) {
        player.tryMove(0,MS);
        doneMoving = true;
    }
    
}

function newBullet() {
    bullets.push(new Bullet(player.x, player.y, mouse_x, mouse_y, PLAYER_BULLET_SPEED));
}

function spawnEnemy() {
    
    let rand_x = Math.floor(Math.random() * WORLD_WIDTH);
    let rand_y = Math.floor(Math.random() * WORLD_HEIGHT);
    while (world.get(rand_x, rand_y) == 2) {
        rand_x = Math.floor(Math.random() * WORLD_WIDTH);
        rand_y = Math.floor(Math.random() * WORLD_HEIGHT);
    }

    enemies.push(new Enemy(rand_x + 1/2, rand_y + 1/2, player.x - rand_x, player.y - rand_y, ENEMY_SPEED));
}

function updateWorld(now, interval) {

    movePlayer(interval);
    if (key_f) {
        view_center_x = player.x + mouse_x/CW/2;
        view_center_y = player.y + mouse_y/CW/2;
    } else {
        view_center_x = player.x;
        view_center_y = player.y;
    }

    gun_tile.rotation = (Math.atan(-mouse_y/mouse_x)); //finds the angle of mouse from middle

    if (mouse_x >= 0) {
        gun_tile.scale_x = 1;
    } else {
        gun_tile.scale_x = -1;
    }
    
    if (gun == 0) {
        bullets_per_shot = 1;
        bullet_interval = 100;
    } else if (gun == 1) {
        bullets_per_shot = 15;
        bullet_interval = 500;
    } else if (gun == 2) {
        bullets_per_shot = 1;
        bullet_interval = 50;
    }

    if (left_mousedown) {
        for (let i = 0; i < crosshairs.length; i++) {
            if (crosshairs[i].rotation < 2 * Math.PI) {
                crosshairs[i].rotation += Math.PI / 12;
            } else {
                crosshairs[i].rotation = 0;
            }
        }
        
        if (now - last_bullet_time > bullet_interval) {
            for (let i = bullets_per_shot; i > 0; i--) {
                newBullet();
            }
            last_bullet_time = now;
        }
    }

    if (now - last_enemy_time > ENEMY_INTERVAL) {
        spawnEnemy();
        last_enemy_time = now;
    }

    bullets.map(b => b.update(interval));
    enemies.map(b => b.update(interval));
    
    drawWorld();
    
}
function drawWorld() {
    let cells_drawn = 0;
    let bullets_drawn = 0;
    let enemies_drawn = 0;
    let obstacle_hitboxes_drawn = 0;
    let bullet_hitboxes_drawn = 0;

    let cell_x = Math.floor(view_center_x - view_cell_width/2); //Finds out which cell should be drawn in top left corner of the view (in cells)
    let cell_y = Math.floor(view_center_y - view_cell_height/2);

    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0,0, view_width, view_height);
    
    //Draws the background 
    for (let y = 0; y < view_cell_height + 1; y++) {
        for (let x = 0; x < view_cell_width + 1; x++) {
            let t = world.get(x + cell_x, y + cell_y);
            if (game_mode == 0 || game_mode == 1) {
                drawTileWithTransform(ctx, tiles[t], x + cell_x, y + cell_y); 
                cells_drawn = cells_drawn + 1;
            }
            if (game_mode == 1) {
                ctx.fillStyle = "white";
                ctx.fillText(t, worldToScreenX(x + cell_x), worldToScreenY(y + cell_y + 0.1));  
            }
        }
    }

    //Draws the tiles
    if (game_mode == 0 || game_mode == 1) {
        drawTileWithTransform(ctx, player_tile, player.x, player.y);
        drawTileWithTransform(ctx, gun_tile, player.x, player.y);


        for (let i = 0; i < bullets.length; i++) {
            if (inView(bullets[i].x, bullets[i].y, bullet_tile.size/2/CW, bullet_tile.size/2/CW)) {
                drawTileWithTransform(ctx, bullet_tile, bullets[i].x, bullets[i].y);
                bullets_drawn = bullets_drawn + 1;
            }
        }

        for (let i = 0; i < enemies.length; i++) {
            if (inView(enemies[i].x, enemies[i].y, enemy_tile.size/2/CW, enemy_tile.size/2/CW)) {
                drawTileWithTransform(ctx, enemy_tile, enemies[i].x, enemies[i].y);
                enemies_drawn = enemies_drawn + 1;
            }
        }
    }
    
    //Draws the hitboxes
    if (game_mode == 1 || game_mode == 2) {

        //draws the aim line
        ctx.save();
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.moveTo(worldToScreenX(player.x), worldToScreenY(player.y));
        ctx.lineTo(real_mouse_x, real_mouse_y);
        ctx.stroke();
        ctx.restore();
    
        //draws hitboxes for obstacles
        for (let i = 0; i < world.obstacles.length; i++) {
            if (inView(world.obstacles[i].x, world.obstacles[i].y, world.obstacles[i].rx, world.obstacles[i].ry)) {
                ctx.save();
                ctx.strokeStyle = "blue";
                ctx.beginPath();
                ctx.moveTo(worldToScreenX(world.obstacles[i].x - world.obstacles[i].rx), worldToScreenY(world.obstacles[i].y - world.obstacles[i].ry));
                ctx.lineTo(worldToScreenX(world.obstacles[i].x + world.obstacles[i].rx), worldToScreenY(world.obstacles[i].y - world.obstacles[i].ry));
                ctx.lineTo(worldToScreenX(world.obstacles[i].x + world.obstacles[i].rx), worldToScreenY(world.obstacles[i].y + world.obstacles[i].ry));
                ctx.lineTo(worldToScreenX(world.obstacles[i].x - world.obstacles[i].rx), worldToScreenY(world.obstacles[i].y + world.obstacles[i].ry));
                ctx.lineTo(worldToScreenX(world.obstacles[i].x - world.obstacles[i].rx), worldToScreenY(world.obstacles[i].y - world.obstacles[i].ry));
                ctx.stroke();
                ctx.restore();
                obstacle_hitboxes_drawn = obstacle_hitboxes_drawn + 1
            }
        }

        
        //draws hitboxes for bullets
        for (let i = 0; i < bullets.length; i++) {
            if (inView(bullets[i].x, bullets[i].y, BULLET_HITBOX_SIZE/2, BULLET_HITBOX_SIZE/2)) {
                ctx.save();
                ctx.strokeStyle = "green";
                ctx.beginPath();
                ctx.moveTo(worldToScreenX(bullets[i].x - BULLET_HITBOX_SIZE / 2), worldToScreenY(bullets[i].y - BULLET_HITBOX_SIZE / 2));
                ctx.lineTo(worldToScreenX(bullets[i].x + BULLET_HITBOX_SIZE / 2), worldToScreenY(bullets[i].y - BULLET_HITBOX_SIZE / 2));
                ctx.lineTo(worldToScreenX(bullets[i].x + BULLET_HITBOX_SIZE / 2), worldToScreenY(bullets[i].y + BULLET_HITBOX_SIZE / 2));
                ctx.lineTo(worldToScreenX(bullets[i].x - BULLET_HITBOX_SIZE / 2), worldToScreenY(bullets[i].y + BULLET_HITBOX_SIZE / 2));
                ctx.lineTo(worldToScreenX(bullets[i].x - BULLET_HITBOX_SIZE / 2), worldToScreenY(bullets[i].y - BULLET_HITBOX_SIZE / 2));
                ctx.stroke();
                ctx.restore();
                bullet_hitboxes_drawn = bullet_hitboxes_drawn + 1;
            }
        }

        //draws the hitboxes for the enemies
        for (let i = 0; i < enemies.length; i++) {
            if (inView(enemies[i].x, enemies[i].y, ENEMY_HITBOX_SIZE/2, ENEMY_HITBOX_SIZE/2)) {
                ctx.save();
                ctx.strokeStyle = "red";
                ctx.beginPath();
                ctx.moveTo(worldToScreenX(enemies[i].x - ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y - ENEMY_HITBOX_SIZE / 2));
                ctx.lineTo(worldToScreenX(enemies[i].x + ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y - ENEMY_HITBOX_SIZE / 2));
                ctx.lineTo(worldToScreenX(enemies[i].x + ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y + ENEMY_HITBOX_SIZE / 2));
                ctx.lineTo(worldToScreenX(enemies[i].x - ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y + ENEMY_HITBOX_SIZE / 2));
                ctx.lineTo(worldToScreenX(enemies[i].x - ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y - ENEMY_HITBOX_SIZE / 2));
                ctx.stroke();
                ctx.restore();
            }
        }

        //Draws hitbox for player
        ctx.save();
        ctx.strokeStyle = "purple";
        ctx.beginPath();
        ctx.moveTo(worldToScreenX(player.x - PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y - PLAYER_HITBOX_SIZE / 2));
        ctx.lineTo(worldToScreenX(player.x + PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y - PLAYER_HITBOX_SIZE / 2));
        ctx.lineTo(worldToScreenX(player.x + PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y + PLAYER_HITBOX_SIZE / 2));
        ctx.lineTo(worldToScreenX(player.x - PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y + PLAYER_HITBOX_SIZE / 2));
        ctx.lineTo(worldToScreenX(player.x - PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y - PLAYER_HITBOX_SIZE / 2));
        ctx.stroke();
        ctx.restore();

        //Calculates player speed
        real_speed = Math.fround(Math.sqrt(Math.pow(last_player_x - player.x,2) + Math.pow(last_player_y - player.y,2)))*CW;
        last_player_x = player.x;
        last_player_y = player.y;

        ctx.fillStyle = "orange";
        ctx.fillText(`Frame: ${frame}`, 20, 20);
        ctx.fillText(`position x, y: ${player.x}, ${player.y}`, 20, 40);
        ctx.fillText(`View x, y: ${Math.round(view_center_x)}, ${Math.round(view_center_y)}`, 20, 60);
        ctx.fillText(`Mouse x, y: ${mouse_x}, ${mouse_y}`, 20, 80);
        ctx.fillText(`Speed: ${real_speed}`, 20,100);
        ctx.fillText(`Mode: ${game_mode}`, 20,120);
        ctx.fillText(`Gun: ${gun}`, 20,140);
        ctx.fillText(`Cells drawn: ${cells_drawn}`, 20, 200);
        ctx.fillText(`Bullets drawn: ${bullets_drawn}`, 20, 220); 
        ctx.fillText(`Obstacle hitboxes drawn: ${obstacle_hitboxes_drawn}`, 20, 240);     
        ctx.fillText(`Bullet hitboxes drawn: ${bullet_hitboxes_drawn}`, 20, 260);     
        ctx.fillText(`Total bullets: ${bullets.length}`, 20, 280);     
        ctx.fillText(`Enemies drawn: ${enemies_drawn}`, 20, 300);
    }

    drawCrosshair(ctx, crosshairs[crosshair_frame], real_mouse_x, real_mouse_y);


    updateWorldPost();
}

function updateWorldPost() {
    bullets = bullets.filter(x => x.alive == true);
    enemies = enemies.filter(x => x.alive == true);
}

startGame({setUp: gameSetUp, resize: resize, updateGame: updateWorld});

