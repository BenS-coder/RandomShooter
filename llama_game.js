"use strict";

//To do:

//Add ui
//add enemy animations
//add gun class and move player things into player class
//organize a lot of things into classes
//add rolling/dashing
//add different hitboxes for bullet hits and wall collisions

//fix inconsistency in dashing from fps
//fix right click
//fix screen scale
//fix map-editor crash

const CW = 64;//Cell width
const WORLD_HEIGHT = 22; //In cells
const WORLD_WIDTH = 22;
const WORLD_CENTER_X = WORLD_WIDTH/2; //In cells
const WORLD_CENTER_Y = WORLD_HEIGHT/2;


const PLAYER_HITBOX_SIZE = 0.5;
const SPEED = 0.5;
const PLAYER_BULLET_SPEED = 12;
const DASH_SPEED = 7;
const DASH_COOLDOWN = 700;
const DASH_DURATION = 100;
let dash_amount = 0;
let is_dashing = false;

const ENEMY_HITBOX_SIZE = 0.5;
const ENEMY_SPEED = 0.1;
const ENEMY_INTERVAL = 1000;
const ENEMY_BULLET_SPEED = 1;
let enemy_bullet_interval = 100;
let number_of_enemies = 10;


const BULLET_HITBOX_SIZE = 0.1;
const NUMBER_OF_GUN_TILES = 4;
let bullet_interval = 100;
let bullets_per_shot = 1;

let world = undefined;
let player;
let bullets = [];
let enemy_bullets = [];
let enemies = [];
let bullet_particles = [];

let player_tiles;
let gun_tiles;
let bullet_tile;
let enemy_tiles;
let tiles;
let crosshairs;

let crosshair_frame = 0;
let player_tile_current = 2;
let gun_tile_current = 0;
let gun_behind = false;

let key_w = false;
let key_a = false;
let key_s = false;
let key_d = false;
let key_f = false;
let key_x = false;
let key_q = false;
let key_p = false;
let key_space = false;
let key_dash = false;
let key_equals = false;
let key_1 = false;
let key_2 = false;
let key_3 = false;
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
let last_dash_time = 0;

let view_center_x; //x coordinate of the center of the view in world (in cells)
let view_center_y;
let view_width; //In pixels
let view_height;
let view_cell_width; //In cells
let view_cell_height;
let screen_shake_x = 0;
let screen_shake_y = 0;
let damage_overlay = 0;

let show_hitboxes = false;
let show_tiles = true;
let show_debug = false;
let game_mode = 2;
let gun_current = 0;

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
        return border_tile;
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
    constructor(x, y, dx, dy, speed, size) {
        let l = (dx **2 + dy **2)**0.5
        this.dx = dx/l;
        this.dy = dy/l;
        this.x = x;
        this.y = y;
        this.last_bullet_x = x;
        this.last_bullet_y = y;
        if (gun_current == 1) {
            this.dx += Math.random()/2 - 0.25;
            this.dy += Math.random()/2 - 0.25;
        } else if (gun_current == 2) {
            this.dx += Math.random()/10 - 0.05;
            this.dy += Math.random()/10 - 0.05;
        }
        this.speed = speed;
        this.tracers = this.speed * (Math.round(interval*100)/100) * 32;
        this.size = size;
        this.alive = true;
        this.dead_next_update = false;
    }

    update(now, interval) {
        if (this.dead_next_update) {
            this.alive = false;
            
            //Creates particles
            for (let i = 0; i < this.speed * 2; i++) {
                bullet_particles.push(new Particle(this.x, this.y, this.dx + Math.random() * 2 - 1, this.dy + Math.random() * 2 - 1, Math.random() + 0.5, now, Math.random() * 300 + 200, 0.01));
            }
        }
        let dx = this.dx * this.speed * interval;
        let dy = this.dy * this.speed * interval;
        
        let move = true;
        let max_x = this.x + dx;
        let max_y = this.y + dy;

        let number_of_checks = this.speed * 4;
        for (let checks = number_of_checks; checks > 0; checks --) {
            let step = checks/number_of_checks;
            let check_x = this.x + dx * step;
            let check_y = this.y + dy * step;
            if (!world.is_passable(check_x, check_y, this.size)) {
                max_x = this.x + dx * (checks - 1) / number_of_checks;
                max_y = this.y + dy * (checks - 1) / number_of_checks;
                move = false;
            }
        }
        this.last_bullet_x = this.x;
        this.last_bullet_y = this.y;
        this.x = max_x;
        this.y = max_y;
        if (!move) {
            this.dead_next_update = true;
        }
    }
    hitEnemy(x, y, now) {
        this.x = x;
        this.y = y;
        this.alive = false;
        for (let i = 0; i < this.speed; i++) {
            bullet_particles.push(new Particle(this.x, this.y, -(this.dx + Math.random() * 2 - 1), -(this.dy + Math.random() * 2 - 1), (this.speed / 12) * Math.random() + this.speed / 24, now, Math.random() * 300 + 200, 0.01));
        }
    }
}

class EnemyBullet {
    constructor(x, y, dx, dy, speed, size) {
        let l = (dx **2 + dy **2)**0.5
        this.dx = dx/l;
        this.dy = dy/l;
        this.x = x;
        this.y = y;
        this.last_bullet_x = x;
        this.last_bullet_y = y;
        this.dx += Math.random()/5 - 0.1;
        this.dy += Math.random()/5 - 0.1;
        this.speed = speed;
        this.tracers = this.speed * (Math.round(interval*100)/100) * 32;
        this.size = size;
        this.alive = true;
        this.dead_next_update = false;
    }

    update(now, interval) {
        if (this.dead_next_update) {
            this.alive = false;
            
            //Creates particles
            for (let i = 0; i < this.speed * 2; i++) {
                bullet_particles.push(new Particle(this.x, this.y, this.dx + Math.random() * 2 - 1, this.dy + Math.random() * 2 - 1, (this.speed / 12) * Math.random() + this.speed / 24, now, Math.random() * 300 + 200, 0.01));
            }
        }
        let dx = this.dx * this.speed * interval;
        let dy = this.dy * this.speed * interval;
        
        let move = true;
        let max_x = this.x + dx;
        let max_y = this.y + dy;

        let number_of_checks = this.speed * 4;
        for (let checks = number_of_checks; checks > 0; checks --) {
            let step = checks/number_of_checks;
            let check_x = this.x + dx * step;
            let check_y = this.y + dy * step;
            if (!world.is_passable(check_x, check_y, this.size)) {
                max_x = this.x + dx * (checks - 1) / number_of_checks;
                max_y = this.y + dy * (checks - 1) / number_of_checks;
                move = false;
            }
        }

        this.last_bullet_x = this.x;
        this.last_bullet_y = this.y;
        this.x = max_x;
        this.y = max_y;
        if (!move) {
            this.dead_next_update = true;
        }
    }
    hitPlayer(x, y, now) {
        this.x = x;
        this.y = y;
        this.alive = false;
        for (let i = 0; i < this.speed; i++) {
            bullet_particles.push(new Particle(this.x, this.y, -(this.dx + Math.random() * 2 - 1), -(this.dy + Math.random() * 2 - 1), (this.speed / 12) * Math.random() + this.speed / 24, now, Math.random() * 300 + 200, 0.01));
        }
        damage_overlay = 1;
    }
}


/*
class gun {
    constructor(x, y, spread, bullets) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
    fire() {

    }
}
*/

class Player {
    constructor(x, y, size, health) { //size is in cell units
        this.x = x;
        this.y = y;
        this.size = size;
        this.health = health;
    }
    tryMove(dx, dy) {
        for (let i = 16; i > 0; i--) {
            let step = i/16;
            let new_x = this.x + step * dx;
            let new_y = this.y + step * dy;
            if (world.is_passable(new_x, new_y + 1/4, this.size)) {
                this.x = new_x;
                this.y = new_y;
                return true;
            }
        }
        return false;
    }
    touchBullet(now, interval) {
        let b = new Box(this.x, this.y, PLAYER_HITBOX_SIZE, PLAYER_HITBOX_SIZE * 2);
        let times_hit = 0;
        for (let i = 0; i < enemy_bullets.length; i ++) {
            for (let fraction = 1; fraction <= enemy_bullets[i].speed; fraction ++) {
                let step = fraction/enemy_bullets[i].speed;
                let check_x = enemy_bullets[i].last_bullet_x + step * (enemy_bullets[i].x - enemy_bullets[i].last_bullet_x);
                let check_y = enemy_bullets[i].last_bullet_y + step * (enemy_bullets[i].y - enemy_bullets[i].last_bullet_y);
                let b2 = new Box(check_x, check_y, enemy_bullets[i].size, enemy_bullets[i].size);
                if (b.intersects(b2) && !is_dashing) {
                    enemy_bullets[i].hitPlayer(check_x, check_y, now);
                    times_hit++;
                    screenShake(0.2, 100);
                    break;
                }
            }
        }
        return times_hit;
    }
}

class Enemy {
    constructor(x, y, speed, health, fire_speed, range, now) {
        this.x = x;
        this.y = y;
        this.knockback_x = 0;
        this.knockback_y = 0;
        this.speed = speed;
        this.health = health;
        this.fire_speed = fire_speed;
        this.range = range;
        this.last_update = now;
        this.direction = Math.atan(-player.y/player.x);
        this.gun_direction = 
        this.enemy_last_bullet_time = now;
        this.alive = true;
    }
    update(now, interval) {
        /*
        if (now - this.last_update < this.update_speed) {
            return;
        }
        */

        //let choice = Math.floor(Math.random() * 5);

        let try_x = 0;
        let try_y = 0;

        if (distance(player.x, this.x, player.y, this.y) < this.range) {
            if (now - this.enemy_last_bullet_time > this.fire_speed) {
                this.enemy_last_bullet_time = now;
                this.shoot();
            }
        } else {
            let dx = player.x - this.x;
            let dy = player.y - this.y;
            let l = (dx **2 + dy **2)**0.5;
            dx = dx / l;
            dy = dy / l;
            dx = dx * this.speed * interval;
            dy = dy * this.speed * interval;
            try_x = dx;
            try_y = dy;
        }

        let new_x = this.x + try_x + this.knockback_x;
        let new_y = this.y + try_y + this.knockback_y;
        if (world.is_passable(new_x, this.y + 1/4, ENEMY_HITBOX_SIZE)) {
            this.x = new_x;
        }
        if (world.is_passable(this.x, new_y + 1/4, ENEMY_HITBOX_SIZE)) {
            this.y = new_y;
        }
        this.knockback_x = this.knockback_x / (interval * 10);
        this.knockback_y = this.knockback_y / (interval * 10);

        let times_hit = this.touchBullet(now, interval);
        this.health = this.health - times_hit;
        if (this.health < 1 ) {
            this.alive = false;
        }
    }
    shoot() {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        enemy_bullets.push(new EnemyBullet(this.x, this.y, dx, dy, ENEMY_BULLET_SPEED, BULLET_HITBOX_SIZE));
    }
    touchBullet(now, interval) {
        let b = new Box(this.x, this.y, ENEMY_HITBOX_SIZE, ENEMY_HITBOX_SIZE * 2);
        let times_hit = 0;
        for (let i = 0; i < bullets.length; i ++) {
            console.log(bullets[i].speed);
            for (let fraction = 1; fraction <= bullets[i].speed; fraction ++) {
                let step = fraction/bullets[i].speed;
                let check_x = bullets[i].last_bullet_x + step * (bullets[i].x - bullets[i].last_bullet_x);
                let check_y = bullets[i].last_bullet_y + step * (bullets[i].y - bullets[i].last_bullet_y);
                let b3 = new Box(check_x, check_y, bullets[i].size, bullets[i].size);
                if (b.intersects(b3)) {
                    bullets[i].hitEnemy(check_x, check_y, now);
                    this.knockback(bullets[i].dx, bullets[i].dy, bullets[i].speed, interval);
                    times_hit++;
                    break;
                }
            }
        }
        return times_hit;
    }
    knockback(dx, dy, a, interval) {
        this.knockback_x += dx * a * interval / 10;
        this.knockback_y += dy * a * interval / 10;
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

class Particle {
    constructor(x, y, dx, dy, speed, time_created, timer, gravity) {
        let l = (dx **2 + dy **2)**0.5
        this.dx = dx/l;
        this.dy = dy/l;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.time_created = time_created;
        this.timer = timer;
        this.alive = true;
        this.gravity = gravity;
        this.gravity_amount = 0;
        this.transparency = 1;
        if (this.speed < this.gravity) {
            this.speed = this.gravity;
        }
    }
    update(now, interval) {
        if(now - this.time_created > this.timer) {
            this.alive = false;
        }

        let new_x = this.x + (this.dx * this.speed * interval);
        let new_y = this.y + (this.dy * this.speed * interval) + this.gravity_amount * interval;
        
        if (!world.is_passable(new_x, this.y, BULLET_HITBOX_SIZE)) {
            this.dx = -this.dx;
            new_x = this.x + (this.dx * this.speed * interval);
        }

        if (!world.is_passable(this.x, new_y, BULLET_HITBOX_SIZE)) {
            this.dy = -this.dy;
            new_y = this.y + (this.dy * this.speed * interval);
        }

        this.x = new_x;
        this.y = new_y;
        
        this.gravity_amount += this.gravity;
        this.gravity = this.gravity / (interval * 10);
        this.speed = this.speed / (interval * 10);
        this.transparency = 1 - (now - this.time_created) / this.timer;
        if(this.transparency < 0) {
            this.transparency = 0;
        }
    }
}

function gameSetUp() {
    setUpTiles(); //makes images
    world = new World(WORLD_WIDTH,WORLD_HEIGHT);
    createMap(world, world.width, world.height);

    player = new Player(WORLD_CENTER_X,WORLD_CENTER_Y,PLAYER_HITBOX_SIZE, 10);

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
    let background_images = getImage("background_tiles.png");
    let player_images = getImage("bear_tiles.png");
    let enemy_images = getImage("soldier_tiles.png");
    let bullet_images = getImage("bullet_tiles.png");
    let gun_images = getImage("gun_tiles.png");
    let crosshair_images = getImage("crosshair_tiles.png");

    tiles = [];
    for (let i = 0; i < number_of_tiles; i++) {
        tiles[i] = new Tile(background_images, i * 64, 0, 64, 0, 0);
    }
    crosshairs = [];
    for (let i = 0; i < 3; i++) {
        crosshairs[i] = new Tile(crosshair_images, i * 64, 0, 64, -64/2, -64/2);
    }
    player_tiles = [];
    for (let i = 0; i < 4; i++) {
        player_tiles[i] = new Tile(player_images, i * 64, 0, 64, -64 / 2, -64 / 2);
    }

    gun_tiles = [];
    for (let i = 0; i < NUMBER_OF_GUN_TILES; i++) {
        gun_tiles[i] = new Tile(gun_images, i * 64, 0, 64, 0, -6);
    }

    enemy_tiles = [];
    for (let i = 0; i < 2; i ++)
    enemy_tiles = new Tile(enemy_images, i * 64, 0, 64, -64 / 2, -64 / 2);

    bullet_tile = new Tile(bullet_images, 64 * 2, 0, 64, -1.5, -1.5);
}

function resize() {
    view_width = canvas.width & ~1;
    view_width = view_width;
    view_height = canvas.height & ~1;
    map_editor_view_width = view_width;
    map_editor_view_height = view_height;
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
    } else if (e.key == " ") {
        key_space = true;
    } else if (e.key == "-") {
        key_dash = true;
    } else if (e.key == "=") {
        key_equals = true;
    } else if (e.key == "1") {
        key_1 = true;
    } else if (e.key == "2") {
        key_2 = true;
    } else if (e.key == "3") {
        key_3 = true;
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
    } else if (e.key == " ") {
        key_space = false;
    } else if (e.key == "-") {
        key_dash = false;
    } else if (e.key == "=") {
        key_equals = false;
    } else if (e.key == "1") {
        key_1 = false;
    } else if (e.key == "2") {
        key_2 = false;
    } else if (e.key == "3") {
        key_3 = false;
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

function screenToWorldX(x) {

}

function screenToWorldY(y) {
    
}

function distance(x1, x2, y1, y2) {
    return Math.sqrt((x2 - x1)**2 + (y2-y1)**2);
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

function drawBullet(ctx, bullet) {
    ctx.save();
    for (let i = 0; i < bullet.tracers; i++) {
        ctx.globalAlpha = (bullet.tracers - i) / bullet.tracers;
        drawTileWithTransform(ctx, bullet_tile, bullet.x - i * (bullet.dx/30), bullet.y - i * (bullet.dy/30));
    }
    ctx.restore();
}

function screenShake(m, t) {
    setTimeout(resetShake, t);
    let fractions = Math.floor(t / 10);
    randShake(m);
    for (let i = 0; i < 10; i++) {
        setTimeout(randShake,i * fractions, m);
    }
    
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

function gunFireAnimation() {
    for (let i = 0; i < NUMBER_OF_GUN_TILES; i++) {
        setTimeout(changeGunAnimation, 50 * i);
    }
}

function changeGunAnimation() {
    if (gun_tile_current < NUMBER_OF_GUN_TILES - 1) {
        gun_tile_current++;
    } else {
        gun_tile_current = 0;
    }
}

function CrosshairTileReset() {
    crosshair_frame = 0;
}

function drawOverlay(ctx, interval) {
    if (damage_overlay > 0) {
        ctx.save()
        ctx.globalAlpha = (damage_overlay/2)/1;
        ctx.fillStyle = "#9e1b11";
        ctx.fillRect(0,0, view_width, view_height);
        damage_overlay -= interval;
        ctx.restore();
    } 
    if (damage_overlay < 0) {
        damage_overlay = 0;
    }    
}

function movePlayer(interval) {
    let MS = (SPEED + dash_amount)*interval;
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

function activateDash(speed) {
    dash_amount = speed;
}

function newBullet(now) {
    let l = (mouse_x **2 + mouse_y **2)**0.5
    let front_of_gun_x = player.x + mouse_x/l/2;
    let front_of_gun_y = player.y + mouse_y/l/2;
    for (let i = 0; i < 10; i++) {
        bullet_particles.push(new Particle(front_of_gun_x, front_of_gun_y, mouse_x + Math.random()*50 - 25, mouse_y + Math.random()*50 - 25, Math.random() + 0.5, now, Math.random() * 50, 0));
    }
    bullets.push(new Bullet(front_of_gun_x, front_of_gun_y, mouse_x, mouse_y, PLAYER_BULLET_SPEED, BULLET_HITBOX_SIZE));
}

function spawnEnemy(now) {
    
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

    enemies.push(new Enemy(rand_x, rand_y, ENEMY_SPEED, 3, enemy_bullet_interval, 10, now));
}

function updateGameWorld(now, interval) {

    //checks for map editor
    if (key_f) {
        map_editor = true;
        key_f = false;
    }

    if (key_space) {
        if (now - last_dash_time > DASH_COOLDOWN) {
            activateDash(DASH_SPEED);
            last_dash_time = now;
        }
    }
    dash_amount = dash_amount / (interval * 10);
    if (dash_amount < 0.1) {
        is_dashing = false;
        dash_amount = 0;
    } else {
        is_dashing = true;
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
    if (key_3) {
        show_debug = !show_debug;
        key_3 = false;
    }
    if (key_q) {
        if (gun_current < 2) {
            gun_current++;
        } else {
            gun_current = 0;
        }
        key_q = false;
    }

    //calculating how player and gun should be drawn
    let mouse_rotation = Math.atan(-mouse_y/mouse_x)
    for (let i = 0; i < NUMBER_OF_GUN_TILES; i++) {
        gun_tiles[i].rotation = mouse_rotation; //finds the angle of mouse from middle
    }

    if (mouse_x >= 0) {
        for (let i = 0; i < NUMBER_OF_GUN_TILES; i++) {
            gun_tiles[i].scale_x = 1;
        }    
    } else {
        for (let i = 0; i < NUMBER_OF_GUN_TILES; i++) {
            gun_tiles[i].scale_x = -1;
        }
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
    if (gun_current == 0) {
        bullets_per_shot = 1;
        bullet_interval = 100;
    } else if (gun_current == 1) {
        bullets_per_shot = 15;
        bullet_interval = 500;
    } else if (gun_current == 2) {
        bullets_per_shot = 1;
        bullet_interval = 30;
    }

    if (left_mousedown) {
        if (now - last_bullet_time > bullet_interval) {
            crosshair_frame = 1;
            gunFireAnimation();
            setTimeout(CrosshairTileReset, bullet_interval / 2);
            gunShake(mouse_x, mouse_y, 0.04);
            setTimeout(resetShake, 20);
            for (let i = bullets_per_shot; i > 0; i--) {
                newBullet(now);
            }
            last_bullet_time = now;
        }
    }

    if (now - last_enemy_time > ENEMY_INTERVAL && enemies.length < number_of_enemies) {
        spawnEnemy(now);
        last_enemy_time = now;
    }

    let times_hit = player.touchBullet(now, interval);
    player.health = player.health - times_hit;

    bullets.map(b => b.update(now, interval));
    enemy_bullets.map(b => b.update(now, interval));
    enemies.map(b => b.update(now, interval));
    bullet_particles.map(b => b.update(now, interval));
    
    drawGameWorld(now, interval);
    
}
function drawGameWorld(now, interval) {
    let cells_drawn = 0;
    let bullets_drawn = 0;
    let enemies_drawn = 0;
    let obstacle_hitboxes_drawn = 0;
    let bullet_hitboxes_drawn = 0;
    let bullet_particles_drawn = 0;

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
                    ctx.strokeStyle = "blue";
                    ctx.beginPath();
                    ctx.moveTo(worldToScreenX(x + cell_x), worldToScreenY(y + cell_y));
                    ctx.lineTo(worldToScreenX(x + cell_x + 1), worldToScreenY(y + cell_y));
                    ctx.lineTo(worldToScreenX(x + cell_x + 1), worldToScreenY(y + cell_y + 1));
                    ctx.lineTo(worldToScreenX(x + cell_x), worldToScreenY(y + cell_y + 1));
                    ctx.lineTo(worldToScreenX(x + cell_x), worldToScreenY(y + cell_y));
                    ctx.stroke();
                    obstacle_hitboxes_drawn++;
                }
            }
            if (show_hitboxes) {
                ctx.fillStyle = "white";
                //ctx.fillText(t, worldToScreenX(x + cell_x), worldToScreenY(y + cell_y + 0.1));  
            }
        }
    }

    //Draws the tiles
    if (show_tiles) {
        if (!gun_behind) {
            drawTileWithTransform(ctx, player_tiles[player_tile_current], player.x, player.y);
            drawTileWithTransform(ctx, gun_tiles[gun_tile_current], player.x, player.y);
        } else {
            drawTileWithTransform(ctx, gun_tiles[gun_tile_current], player.x, player.y);
            drawTileWithTransform(ctx, player_tiles[player_tile_current], player.x, player.y);
        }

        for (let i = 0; i < bullets.length; i++) {
            //if (inView(bullets[i].x, bullets[i].y, bullet_tile.size/2/CW, bullet_tile.size/2/CW)) {
            drawBullet(ctx, bullets[i]);
            bullets_drawn = bullets_drawn + 1;
            //}
        }

        for (let i = 0; i < enemies.length; i++) {
            if (inView(enemies[i].x, enemies[i].y, enemy_tiles.size/2/CW, enemy_tiles.size/2/CW)) {
                drawTileWithTransform(ctx, enemy_tiles, enemies[i].x, enemies[i].y);
                ctx.fillStyle = "white";
                ctx.fillText(enemies[i].health, worldToScreenX(enemies[i].x), worldToScreenY(enemies[i].y) - 20);
                enemies_drawn = enemies_drawn + 1;
            }
        }

        for (let i = 0; i < enemy_bullets.length; i++) {
            if (inView(enemy_bullets[i].x, enemy_bullets[i].y, bullet_tile.size/2/CW, bullet_tile.size/2/CW)) {
                drawBullet(ctx, enemy_bullets[i]);
                bullets_drawn = bullets_drawn + 1;
            }
        }


        //Draws bullet particles
        for (let i = 0; i < bullet_particles.length; i++) {
            if (inView(bullet_particles[i].x, bullet_particles[i].y, 0.1, 0.1)) {
                ctx.save();
                ctx.globalAlpha = bullet_particles[i].transparency;
                drawTileWithTransform(ctx, bullet_tile, bullet_particles[i].x, bullet_particles[i].y);
                ctx.restore();
                bullet_particles_drawn += 1;
            }
        }
    }
    
    //Draws the hitboxes
    if (show_hitboxes) {

        //draws the aim line
        if (show_debug) {
            ctx.strokeStyle = "blue";
            ctx.beginPath();
            ctx.moveTo(worldToScreenX(player.x), worldToScreenY(player.y));
            ctx.lineTo(real_mouse_x, real_mouse_y);
            ctx.stroke();
        }    
        //draws hitboxes for bullets
        for (let i = 0; i < bullets.length; i++) {
            if (inView(bullets[i].x, bullets[i].y, bullets[i].size/2, bullets[i].size/2)) {
                ctx.strokeStyle = "green";
                ctx.beginPath();
                ctx.moveTo(worldToScreenX(bullets[i].x - bullets[i].size / 2), worldToScreenY(bullets[i].y - bullets[i].size / 2));
                ctx.lineTo(worldToScreenX(bullets[i].x + bullets[i].size / 2), worldToScreenY(bullets[i].y - bullets[i].size / 2));
                ctx.lineTo(worldToScreenX(bullets[i].x + bullets[i].size / 2), worldToScreenY(bullets[i].y + bullets[i].size / 2));
                ctx.lineTo(worldToScreenX(bullets[i].x - bullets[i].size / 2), worldToScreenY(bullets[i].y + bullets[i].size / 2));
                ctx.lineTo(worldToScreenX(bullets[i].x - bullets[i].size / 2), worldToScreenY(bullets[i].y - bullets[i].size / 2));
                ctx.stroke();
                bullet_hitboxes_drawn = bullet_hitboxes_drawn + 1;
            }
        }

        //draws the hitboxes for the enemies
        for (let i = 0; i < enemies.length; i++) {
            if (inView(enemies[i].x, enemies[i].y, ENEMY_HITBOX_SIZE/2, ENEMY_HITBOX_SIZE/2)) {
                ctx.strokeStyle = "red";
                ctx.beginPath();
                ctx.moveTo(worldToScreenX(enemies[i].x - ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y - ENEMY_HITBOX_SIZE));
                ctx.lineTo(worldToScreenX(enemies[i].x + ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y - ENEMY_HITBOX_SIZE));
                ctx.lineTo(worldToScreenX(enemies[i].x + ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y + ENEMY_HITBOX_SIZE));
                ctx.lineTo(worldToScreenX(enemies[i].x - ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y + ENEMY_HITBOX_SIZE));
                ctx.lineTo(worldToScreenX(enemies[i].x - ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y - ENEMY_HITBOX_SIZE));
                ctx.stroke();

                ctx.strokeStyle = "red";
                ctx.beginPath();
                ctx.moveTo(worldToScreenX(enemies[i].x - ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y - ENEMY_HITBOX_SIZE));
                ctx.lineTo(worldToScreenX(enemies[i].x + ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y - ENEMY_HITBOX_SIZE));
                ctx.lineTo(worldToScreenX(enemies[i].x + ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y + ENEMY_HITBOX_SIZE));
                ctx.lineTo(worldToScreenX(enemies[i].x - ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y + ENEMY_HITBOX_SIZE));
                ctx.lineTo(worldToScreenX(enemies[i].x - ENEMY_HITBOX_SIZE / 2), worldToScreenY(enemies[i].y - ENEMY_HITBOX_SIZE));
                ctx.stroke();
            }
        }

        //enemy bullet hitboxes
        for (let i = 0; i < enemy_bullets.length; i++) {
            if (inView(enemy_bullets[i].x, enemy_bullets[i].y, enemy_bullets[i].size/2, enemy_bullets[i].size/2)) {
                ctx.strokeStyle = "green";
                ctx.beginPath();
                ctx.moveTo(worldToScreenX(enemy_bullets[i].x - enemy_bullets[i].size / 2), worldToScreenY(enemy_bullets[i].y - enemy_bullets[i].size / 2));
                ctx.lineTo(worldToScreenX(enemy_bullets[i].x + enemy_bullets[i].size / 2), worldToScreenY(enemy_bullets[i].y - enemy_bullets[i].size / 2));
                ctx.lineTo(worldToScreenX(enemy_bullets[i].x + enemy_bullets[i].size / 2), worldToScreenY(enemy_bullets[i].y + enemy_bullets[i].size / 2));
                ctx.lineTo(worldToScreenX(enemy_bullets[i].x - enemy_bullets[i].size / 2), worldToScreenY(enemy_bullets[i].y + enemy_bullets[i].size / 2));
                ctx.lineTo(worldToScreenX(enemy_bullets[i].x - enemy_bullets[i].size / 2), worldToScreenY(enemy_bullets[i].y - enemy_bullets[i].size / 2));
                ctx.stroke();
                bullet_hitboxes_drawn = bullet_hitboxes_drawn + 1;
            }
        }

        //Draws hitbox for player
        ctx.strokeStyle = "purple";
        ctx.beginPath();
        ctx.moveTo(worldToScreenX(player.x - PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y - PLAYER_HITBOX_SIZE));
        ctx.lineTo(worldToScreenX(player.x + PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y - PLAYER_HITBOX_SIZE));
        ctx.lineTo(worldToScreenX(player.x + PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y + PLAYER_HITBOX_SIZE));
        ctx.lineTo(worldToScreenX(player.x - PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y + PLAYER_HITBOX_SIZE));
        ctx.lineTo(worldToScreenX(player.x - PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y - PLAYER_HITBOX_SIZE));
        ctx.stroke();

        ctx.strokeStyle = "green";
        ctx.beginPath();
        ctx.moveTo(worldToScreenX(player.x - PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y - PLAYER_HITBOX_SIZE / 2 + 1/4));
        ctx.lineTo(worldToScreenX(player.x + PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y - PLAYER_HITBOX_SIZE / 2 + 1/4));
        ctx.lineTo(worldToScreenX(player.x + PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y + PLAYER_HITBOX_SIZE / 2 + 1/4));
        ctx.lineTo(worldToScreenX(player.x - PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y + PLAYER_HITBOX_SIZE / 2 + 1/4));
        ctx.lineTo(worldToScreenX(player.x - PLAYER_HITBOX_SIZE / 2), worldToScreenY(player.y - PLAYER_HITBOX_SIZE / 2 + 1/4));
        ctx.stroke();


        //Calculates player speed
        real_speed = Math.fround(Math.sqrt(Math.pow(last_player_x - player.x,2) + Math.pow(last_player_y - player.y,2)))*CW;
        last_player_x = player.x;
        last_player_y = player.y;
}
    
    if (show_debug) {
        //debug info
        ctx.fillStyle = "orange";
        ctx.fillText(`Fps: ${Math.round(fps)} ${interval}`, 20, 20);
        ctx.fillText(`position x, y: ${player.x}, ${player.y}`, 20, 40);
        ctx.fillText(`View x, y: ${Math.round(view_center_x)}, ${Math.round(view_center_y)}`, 20, 60);
        ctx.fillText(`Mouse x, y: ${mouse_x}, ${mouse_y}`, 20, 80);
        ctx.fillText(`Speed: ${real_speed}`, 20,100);
        ctx.fillText(`Gun: ${gun_current}`, 20,120);
        ctx.fillText(`Cells drawn: ${cells_drawn}`, 20, 200);
        ctx.fillText(`Bullets drawn: ${bullets_drawn}`, 20, 220); 
        ctx.fillText(`Obstacle hitboxes drawn: ${obstacle_hitboxes_drawn}`, 20, 240);     
        ctx.fillText(`Bullet hitboxes drawn: ${bullet_hitboxes_drawn}`, 20, 260);     
        ctx.fillText(`Total bullets: ${bullets.length}`, 20, 280);     
        ctx.fillText(`Enemies drawn: ${enemies_drawn}`, 20, 300);
        ctx.fillText(`Bullet particles drawn: ${bullet_particles_drawn}`, 20, 320);
        ctx.fillText(`Screen shake x, y: ${screen_shake_x}, ${screen_shake_y}`, 20, 400);
        ctx.fillText(`Current gun tile: ${gun_tile_current}`, 20, 420);
        ctx.fillText(`Player health: ${player.health}`, 20, view_width - 20);
        ctx.fillText(`dash_amount: ${dash_amount}`, 20, 520);
        ctx.fillText(`Dashing: ${is_dashing}`, 20, 540);
    }

    drawOverlay(ctx, interval);

    drawCrosshair(ctx, crosshairs[crosshair_frame], real_mouse_x, real_mouse_y);


    updateGameWorldPost();
    
}

function updateGameWorldPost() {
    bullets = bullets.filter(x => x.alive == true);
    enemy_bullets = enemy_bullets.filter(x => x.alive == true);
    enemies = enemies.filter(x => x.alive == true);
    bullet_particles = bullet_particles.filter(x => x.alive == true);
}

startGame({setUp: gameSetUp, resize: resize, updateGame: updateWorld});

