const map_editor_menu_height = 0;
const map_editor_menu_width = 260;

let map_editor_speed = 1;
let map_editor_view_center_x = 10; //in cells
let map_editor_view_center_y = 10;
let map_editor_show_lines = true;
let map_editor_show_debug = true;
let map_editor_view_height;
let map_editor_view_width;

let selected_tile = 2;

let map1 = [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 4, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 7, 14, 8, 1, 1, 1, 1, 7, 14, 8, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 12, 2, 11, 1, 1, 1, 1, 12, 2, 11, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 9, 13, 10, 1, 1, 1, 1, 9, 13, 10, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 7, 14, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 12, 2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 9, 13, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 7, 14, 8, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2, 11, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9, 13, 10, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 2],
    [2, 5, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 6, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ];

let map2 = [
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
];

function createMap(world, w, h) {
    let tmh = map1.length;
    let tmw = map1[0].length;
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            let r = map1[y % tmh];
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

changeMap(map1, 6, 4);
changeMap(map1, 9, 7);
changeMap(map1, 13, 4);
changeMap(map1, 17, 15); 

function mapEditorWorldToScreenX(x) {
    return Math.floor((x - map_editor_view_center_x)*CW + view_width/2);
}

function mapEditorWorldToScreenY(y) {
    return Math.floor((y - map_editor_view_center_y)*CW + view_height/2);
}

function mapEditorScreenToWorldX(x) {
    return Math.floor((x - view_width/2) / CW + map_editor_view_center_x);
}

function mapEditorScreenToWorldy(y) {
    return Math.floor((y - view_height/2) / CW + map_editor_view_center_y);
}

function mapEditorDrawTileWithTransform(ctx, tile, x, y) {
    let x_pos_on_view = mapEditorWorldToScreenX(x); //Changes from cell coordinates in the world to pixel coordinates on view
    let y_pos_on_view = mapEditorWorldToScreenY(y);
    
    ctx.save();
    ctx.scale(tile.scale_x, tile.scale_y);
    ctx.drawImage(tile.image, 
        tile.src_x, tile.src_y, tile.size, tile.size, 
        x_pos_on_view + tile.x_off, y_pos_on_view + tile.y_off, tile.size, tile.size); //changes to pixels
    ctx.restore();
}

function mouseInMapEditor(x, y) {
    return (x < map_editor_view_width - map_editor_menu_width) && (y < map_editor_view_height - map_editor_menu_height);
}

function logMapData() {
    let map = "[";
    let first_line = true;
    for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (!first_line) {
                map = map.substring(0, map.length - 2)
                map = map + "]" + ",";
                map = map + "\n";
                map = map + "[";
            } else {
                first_line = false;
                map = map + "\n" + "[";

            }
        for (let x = 0; x < WORLD_WIDTH; x++) {
            map = map + world.get(x, y);
            map = map + ", ";
        }
    }
    map = map.substring(0, map.length - 2) + "]";
    map = map + "\n" + "]" + ";";
    console.log("Map:")
    console.log(map);
}



function updateMapEditor(now, interval) {
    if (key_f) {
        map_editor = false;
        key_f = false;
    }

    if (left_mousedown) {
        world.set(mapEditorScreenToWorldX(real_mouse_x), mapEditorScreenToWorldy(real_mouse_y), selected_tile);
    }
    if (key_p) {
        logMapData();
        key_p = false;
    }
    if (key_x) {
        if (selected_tile < 14) {
            selected_tile++
        } else {
            selected_tile = 0;
        }
        key_x = false;
    }
    if (key_1) {
        map_editor_show_lines = !map_editor_show_lines;
        key_1 = false;
    }
    if (key_3) {
        map_editor_show_debug = !map_editor_show_debug;
        key_3 = false;
    }
    if (key_dash) {
        if (map_editor_speed > 0.5) {
            map_editor_speed = map_editor_speed - 0.5;
            key_dash = false;
        }
    }
    if (key_equals) {
        if (map_editor_speed < 5) {
            map_editor_speed = map_editor_speed + 0.5;
            key_equals = false;
        }
    }
    if (key_w) {
        map_editor_view_center_y = map_editor_view_center_y - map_editor_speed / interval;
    }
    if (key_s) {
        map_editor_view_center_y = map_editor_view_center_y + map_editor_speed / interval;
    }
    if (key_a) {
        map_editor_view_center_x = map_editor_view_center_x - map_editor_speed / interval;
    }
    if (key_d) {
        map_editor_view_center_x = map_editor_view_center_x + map_editor_speed / interval;
    }
    drawMapEditor();
}

function drawMapEditor() {
    let cell_x = Math.floor(map_editor_view_center_x - view_cell_width/2); 
    let cell_y = Math.floor(map_editor_view_center_y - view_cell_height/2);

    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0,0, view_width, view_height);
    
    //Draws the background 
    for (let y = 0; y < view_cell_height + 1; y++) {
        for (let x = 0; x < view_cell_width + 1; x++) {
            let t = world.get(x + cell_x, y + cell_y);
            mapEditorDrawTileWithTransform(ctx, tiles[t], x + cell_x, y + cell_y); 
        }
    }

    //white lines for grid
    if (map_editor_show_lines) {
        ctx.beginPath();
        ctx.strokeStyle = "white"; 
        for (let y = 0; y < view_cell_height + 1; y++) {
            ctx.moveTo(0, mapEditorWorldToScreenY(y + cell_y));
            ctx.lineTo(view_width, mapEditorWorldToScreenY(y + cell_y));
            for (let x = 0; x < view_cell_width + 1; x++) {
                ctx.moveTo(mapEditorWorldToScreenX(x + cell_x), 0);
                ctx.lineTo(mapEditorWorldToScreenX(x + cell_x), view_height);
                let t = world.get(x + cell_x, y + cell_y);
                ctx.fillStyle = "white";
                ctx.fillText(t, mapEditorWorldToScreenX(x + cell_x), mapEditorWorldToScreenY(y + cell_y + 0.15)); 
            }
            
        }
        ctx.stroke();
    }

    //red boxes for obstacles
    if (map_editor_show_lines) {
        ctx.beginPath();
        ctx.strokeStyle = "red";
        for (let y = 0; y < view_cell_height + 1; y++) {
            for (let x = 0; x < view_cell_width + 1; x++) {
                let t = world.get(x + cell_x, y + cell_y);
                if (t == 2) {
                    ctx.moveTo(mapEditorWorldToScreenX(x + cell_x), mapEditorWorldToScreenY(y + cell_y));
                    ctx.lineTo(mapEditorWorldToScreenX(x + cell_x + 1), mapEditorWorldToScreenY(y + cell_y));
                    ctx.lineTo(mapEditorWorldToScreenX(x + cell_x + 1), mapEditorWorldToScreenY(y + cell_y + 1));
                    ctx.lineTo(mapEditorWorldToScreenX(x + cell_x), mapEditorWorldToScreenY(y + cell_y + 1));
                    ctx.lineTo(mapEditorWorldToScreenX(x + cell_x), mapEditorWorldToScreenY(y + cell_y));
                }
            }
        }
        ctx.stroke();
    }

    let tile_in_world_x = mapEditorScreenToWorldX(real_mouse_x);
    let tile_in_world_y = mapEditorScreenToWorldy(real_mouse_y);

    //blue square around crosshair
    if (mouseInMapEditor(real_mouse_x, real_mouse_y)) {
        ctx.save();
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.moveTo(mapEditorWorldToScreenX(tile_in_world_x), mapEditorWorldToScreenY(tile_in_world_y));
        ctx.lineTo(mapEditorWorldToScreenX(tile_in_world_x + 1), mapEditorWorldToScreenY(tile_in_world_y));
        ctx.lineTo(mapEditorWorldToScreenX(tile_in_world_x + 1), mapEditorWorldToScreenY(tile_in_world_y + 1));
        ctx.lineTo(mapEditorWorldToScreenX(tile_in_world_x), mapEditorWorldToScreenY(tile_in_world_y + 1));
        ctx.lineTo(mapEditorWorldToScreenX(tile_in_world_x), mapEditorWorldToScreenY(tile_in_world_y));
        ctx.stroke();

        ctx.globalAlpha = 0.5;
        mapEditorDrawTileWithTransform(ctx, tiles[selected_tile], tile_in_world_x, tile_in_world_y);
        ctx.restore();
    }

    //debug info
    if (map_editor_show_debug) {
        ctx.fillStyle = "white";
        ctx.fillText(`Tile at mouse: ${world.get(tile_in_world_x,tile_in_world_y)}`, 20, 20);
        ctx.fillText(`Selected tile: ${selected_tile}`, 20, 40);
        ctx.fillText(`Speed: ${map_editor_speed}`, 20, 60);
        ctx.fillText(`View x, y: ${Math.round(map_editor_view_center_x)}, ${Math.round(map_editor_view_center_y)}`, 20, 80);
        ctx.fillText(`Mouse in map editor: ${mouseInMapEditor(real_mouse_x, real_mouse_y)}`, 20, 100);
    }

    //menu
    ctx.fillStyle = "white";
    ctx.fillRect(map_editor_view_width - map_editor_menu_width, 0, map_editor_menu_width, map_editor_view_height);
    ctx.fillRect(0, map_editor_view_height - map_editor_menu_height, map_editor_view_width, map_editor_menu_height);
    ctx.fillStyle = "gray";
    ctx.fillRect(map_editor_view_width - map_editor_menu_width, 0, 4, map_editor_view_height);

    //crosshair
    if (mouseInMapEditor(real_mouse_x, real_mouse_y)) {
        drawCrosshair(ctx, crosshairs[0], real_mouse_x, real_mouse_y);
    } else {
        drawCrosshair(ctx, crosshairs[2], real_mouse_x, real_mouse_y);
    }
}