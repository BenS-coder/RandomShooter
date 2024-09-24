"use strict";

//To do:
//add different pngs
//add rolling/dashing
//add recoil
//set up map editor

const CW = 64;//Cell width
const WORLD_HEIGHT = 22; //In cells
const WORLD_WIDTH = 22;
const WORLD_CENTER_X = WORLD_WIDTH/2; //In cells
const WORLD_CENTER_Y = WORLD_HEIGHT/2;
const PLAYER_HITBOX_SIZE = 1;
const BULLET_HITBOX_SIZE = 0.1;
const ENEMY_HITBOX_SIZE = 1.5;
const SPEED = 2;
const ENEMY_SPEED = 0.1;
const ENEMY_INTERVAL = 1000;
const PLAYER_BULLET_SPEED = 12;

let bullet_interval = 100;
let bullets_per_shot = 1;

let world = undefined;
let player;
let bullets = [];
let enemies = [];

let wall_tile; 
let empty_tile;
let player_tiles;
let gun_tile;
let bullet_tile;
let enemy_tile;
let tiles;
let crosshairs;

let crosshair_frame = 0;
let player_tile_current = 2;
let gun_behind = false;

let key_w = false;
let key_a = false;
let key_s = false;
let key_d = false;
let key_f = false;
let key_x = false;
let key_q = false;
let key_p = false;
let key_dash = false;
let key_equals = false;
let key_1 = false;
let key_2 = false;
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
let screen_shake_x = 0;
let screen_shake_y = 0;

let show_hitboxes = false;
let show_tiles = true;
let game_mode = 2;
let gun = 0;

let map_editor = false;

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
        return world.get(Math.floor(x + r/2), Math.floor(y + r/2)) != 2 &&
               world.get(Math.floor(x - r/2), Math.floor(y + r/2)) != 2 &&
               world.get(Math.floor(x + r/2), Math.floor(y - r/2)) != 2 &&
               world.get(Math.floor(x - r/2), Math.floor(y - r/2)) != 2 &&
               world.get(Math.floor(x + r/2), Math.floor(y)) != 2 &&
               world.get(Math.floor(x - r/2), Math.floor(y)) != 2 &&
               world.get(Math.floor(x), Math.floor(y + r/2)) != 2 &&
               world.get(Math.floor(x), Math.floor(y - r/2)) != 2;
    }
}

class Bullet {
    constructor(x, y, dx, dy, speed) {
        let l = (dx **2 + dy **2)**0.5
        if (gun == 0) {
            this.dx = dx/l;
            this.dy = dy/l;
        } else if (gun == 1) {
            this.dx = dx/l + Math.random()/2 - 0.25;
            this.dy = dy/l + Math.random()/2 - 0.25;
        } else if (gun == 2) {
            this.dx = dx/l + Math.random()/10 - 0.05;
            this.dy = dy/l + Math.random()/10 - 0.05;
        }
        this.speed = speed;
        this.x = x + this.dx / PLAYER_BULLET_SPEED;
        this.y = y + this.dy / PLAYER_BULLET_SPEED;
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

    player = new Player(WORLD_CENTER_X,WORLD_CENTER_Y,PLAYER_HITBOX_SIZE);

    document.body.addEventListener('keydown', keydownHandler);
    document.body.addEventListener('keyup', keyupHandler);
    document.body.addEventListener("mousemove", mousemoveHandler)
    document.body.addEventListener("mousedown", mousedownHandler);
    document.body.addEventListener("mouseup", mouseupHandler);
}

//this is called by engine.js
function updateWorld(now, interval) {
    if (!map_editor) {
        updateGameWorld(now,interval);
    } else {
        updateMapEditor(now, interval);
    }
}

function setUpTiles() {
    let m = getImage("combined_art.png");
    tiles = [];
    for (let i = 0; i < 15; i++) {
        tiles[i] = new Tile(m, i * 64, 0, 64, 0, 0);
    }
    crosshairs = [];
    for (let i = 0; i < 2; i++) {
        crosshairs[i] = new Tile(m, i * 64, 64 * 7, 64, -64/2, -64/2);
    }
    player_tiles = [];
    for (let i = 0; i < 4; i++) {
        player_tiles[i] = new Tile(m, i * 64, 64 * 2, 64, -64 / 2, -64 / 2);
    }
    gun_tile = new Tile(m, 0, 68, 32, 0, 0);
    bullet_tile = new Tile(m, 64 * 2, 64, 64, -7, -7);
    enemy_tile = new Tile(m, 0, 64 * 3, 2 * 64, -64/2, -64);
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
    } else if (e.key == "f") {
        key_f = true;
    } else if (e.key == "x") {
        key_x = true;
    } else if (e.key == "q") {
        key_q = true;
    } else if (e.key == "p") {
        key_p = true;
    } else if (e.key == "-") {
        key_dash = true;
    } else if (e.key == "=") {
        key_equals = true;
    } else if (e.key == "1") {
        key_1 = true;
    } else if (e.key == "2") {
        key_2 = true;
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
    } else if (e.key == "f") {
        key_f = false;
    } else if (e.key == "x") {
        key_x = false;
    } else if (e.key == "q") {
        key_q = false;
    } else if (e.key == "p") {
        key_p = false;
    } else if (e.key == "-") {
        key_dash = false;
    } else if (e.key == "=") {
        key_equals = false;
    } else if (e.key == "1") {
        key_1 = false;
    } else if (e.key == "2") {
        key_2 = false;
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
    }
    if (e.button == 2) {
        right_mousedown = true;
    }
}

function mouseupHandler(e) {
    if (e.button == 0) {
        left_mousedown = false;
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
    ctx.rotate(-tile.rotation);
    ctx.scale(tile.scale_x, tile.scale_y);
    ctx.translate(-x_pos_on_view,-y_pos_on_view)
    
    ctx.drawImage(tile.image, 
        tile.src_x, tile.src_y, tile.size, tile.size, 
        x_pos_on_view + tile.x_off, y_pos_on_view + tile.y_off, tile.size, tile.size); //changes to pixels
    ctx.restore();
}

function drawCrosshair(ctx, tile, x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    ctx.drawImage(tile.image, 
        tile.src_x, tile.src_y, tile.size, tile.size, 
        (x + tile.x_off), (y + tile.y_off), tile.size, tile.size); //changes to pixels
}

function screenShake(m, t) {
    t = Math.floor(t / 10);
    randShake(m);
    for (let i = 0; i < t - 1; i++) {
        setTimeout(randShake, 10, m / i);
    }
    setTimeout(resetShake, t * 10)
}

function randShake(m) {
    screen_shake_x = Math.random() * m - m / 2;
    screen_shake_y = Math.random() * m - m / 2;
}

function resetShake() {
    screen_shake_x = 0;
    screen_shake_y = 0;
}

function gunShake(dx, dy, m) {
    let l = (dx **2 + dy **2)**0.5;
    screen_shake_x = dx / l * m + Math.random() / 20 - 0.05;
    screen_shake_y = dy / l * m + Math.random() / 20 - 0.05;

}

function CrosshairTileReset() {
    crosshair_frame = 0;
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
    
    let rand_x = Math.random() * WORLD_WIDTH;
    let rand_y = Math.random() * WORLD_HEIGHT;
    while (!world.is_passable(rand_x, rand_y, ENEMY_HITBOX_SIZE) ||
           (rand_x < player.x + 3 &&
           rand_x > player.x - 3) &&
           (rand_y < player.y + 3 &&
           rand_y > player.y - 3)) {
            rand_x = Math.random() * WORLD_WIDTH;
            rand_y = Math.random() * WORLD_HEIGHT;
    }

    enemies.push(new Enemy(rand_x, rand_y, player.x - rand_x, player.y - rand_y, ENEMY_SPEED));
}

function updateGameWorld(now, interval) {

    //checks for map editor
    if (key_f) {
        map_editor = true;
        key_f = false;
    }

    movePlayer(interval);

    view_center_x = player.x + mouse_x/CW/2 + screen_shake_x;
    view_center_y = player.y + mouse_y/CW/2 + screen_shake_y;

    if (key_1) {
        show_hitboxes = !show_hitboxes;
        key_1 = false;
    }
    if (key_2) {
        show_tiles = !show_tiles;
        key_2 = false;
    }

    if (key_q) {
        if (gun < 2) {
            gun++;
        } else {
            gun = 0;
        }
        key_q = false;
    }

    //calculating how player and gun should be drawn
    let mouse_rotation = Math.atan(-mouse_y/mouse_x)
    gun_tile.rotation = mouse_rotation; //finds the angle of mouse from middle

    if (mouse_x >= 0) {
        gun_tile.scale_x = 1;
    } else {
        gun_tile.scale_x = -1;
    }

    if (mouse_rotation > Math.PI / 4) {
        if (mouse_x >= 0) {
            player_tile_current = 3;
            gun_behind = true;
        } else {
            player_tile_current = 2;
            gun_behind = false;
        }
    } else if (mouse_rotation >= -Math.PI / 4 && mouse_rotation <= Math.PI / 4) {
        if (mouse_x >= 0) {
            player_tile_current = 1;
            gun_behind = false;
        } else {
            player_tile_current = 0;
            gun_behind = false;
        }
    } else {
        if (mouse_x >= 0) {
            player_tile_current = 2;
            gun_behind = false;
        } else {
            player_tile_current = 3;
            gun_behind = true;
        }
    }
    
    //gun stuff
    if (gun == 0) {
        bullets_per_shot = 1;
        bullet_interval = 100;
    } else if (gun == 1) {
        bullets_per_shot = 15;
        bullet_interval = 500;
    } else if (gun == 2) {
        bullets_per_shot = 1;
        bullet_interval = 30;
    }

    if (left_mousedown) {
        if (now - last_bullet_time > bullet_interval) {
            crosshair_frame = 1;
            setTimeout(CrosshairTileReset, bullet_interval / 2);
            gunShake(mouse_x, mouse_y, 0.05);
            setTimeout(resetShake, 20);
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
    
    drawGameWorld();
    
}
function drawGameWorld() {
    let cells_drawn = 0;
    let bullets_drawn = 0;
    let enemies_drawn = 0;
    let obstacle_hitboxes_drawn = 0;
    let bullet_hitboxes_drawn = 0;

    let cell_x = Math.floor(view_center_x - view_cell_width/2); 
    let cell_y = Math.floor(view_center_y - view_cell_height/2);

    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0,0, view_width, view_height);
    
    //Draws the background 
    for (let y = 0; y < view_cell_height + 1; y++) {
        for (let x = 0; x < view_cell_width + 1; x++) {
            let t = world.get(x + cell_x, y + cell_y);
            if (show_tiles) {
                drawTileWithTransform(ctx, tiles[t], x + cell_x, y + cell_y); 
                cells_drawn = cells_drawn + 1;
            }
            //Draws hitboxes for obstacles
            if (show_hitboxes) {
                if (t == 2) {
                    ctx.save();
                    ctx.strokeStyle = "blue";
                    ctx.beginPath();
                    ctx.moveTo(worldToScreenX(x + cell_x), worldToScreenY(y + cell_y));
                    ctx.lineTo(worldToScreenX(x + cell_x + 1), worldToScreenY(y + cell_y));
                    ctx.lineTo(worldToScreenX(x + cell_x + 1), worldToScreenY(y + cell_y + 1));
                    ctx.lineTo(worldToScreenX(x + cell_x), worldToScreenY(y + cell_y + 1));
                    ctx.lineTo(worldToScreenX(x + cell_x), worldToScreenY(y + cell_y));
                    ctx.stroke();
                    ctx.restore();
                    obstacle_hitboxes_drawn++;
                }
            }
            if (show_hitboxes) {
                ctx.fillStyle = "white";
                ctx.fillText(t, worldToScreenX(x + cell_x), worldToScreenY(y + cell_y + 0.1));  
            }
        }
    }

    //Draws the tiles
    if (show_tiles) {
        if (!gun_behind) {
            drawTileWithTransform(ctx, player_tiles[player_tile_current], player.x, player.y);
            drawTileWithTransform(ctx, gun_tile, player.x, player.y);
        } else {
            drawTileWithTransform(ctx, gun_tile, player.x, player.y);
            drawTileWithTransform(ctx, player_tiles[player_tile_current], player.x, player.y);
        }

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
    if (show_hitboxes) {

        //draws the aim line
        ctx.save();
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.moveTo(worldToScreenX(player.x), worldToScreenY(player.y));
        ctx.lineTo(real_mouse_x, real_mouse_y);
        ctx.stroke();
        ctx.restore();
        
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

        //debug info
        ctx.fillStyle = "orange";
        ctx.fillText(`Frame: ${frame}`, 20, 20);
        ctx.fillText(`position x, y: ${player.x}, ${player.y}`, 20, 40);
        ctx.fillText(`View x, y: ${Math.round(view_center_x)}, ${Math.round(view_center_y)}`, 20, 60);
        ctx.fillText(`Mouse x, y: ${mouse_x}, ${mouse_y}`, 20, 80);
        ctx.fillText(`Speed: ${real_speed}`, 20,100);
        ctx.fillText(`Gun: ${gun}`, 20,120);
        ctx.fillText(`Cells drawn: ${cells_drawn}`, 20, 200);
        ctx.fillText(`Bullets drawn: ${bullets_drawn}`, 20, 220); 
        ctx.fillText(`Obstacle hitboxes drawn: ${obstacle_hitboxes_drawn}`, 20, 240);     
        ctx.fillText(`Bullet hitboxes drawn: ${bullet_hitboxes_drawn}`, 20, 260);     
        ctx.fillText(`Total bullets: ${bullets.length}`, 20, 280);     
        ctx.fillText(`Enemies drawn: ${enemies_drawn}`, 20, 300);
        ctx.fillText(`Screen shake x, y: ${screen_shake_x}, ${screen_shake_y}`, 20, 400);
    }

    drawCrosshair(ctx, crosshairs[crosshair_frame], real_mouse_x, real_mouse_y);


    updateGameWorldPost();
}

function updateGameWorldPost() {
    bullets = bullets.filter(x => x.alive == true);
    enemies = enemies.filter(x => x.alive == true);
}

startGame({setUp: gameSetUp, resize: resize, updateGame: updateWorld});

