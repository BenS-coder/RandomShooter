let map_editor_speed = 1;
let map_editor_view_center_x = 10; //in cells
let map_editor_view_center_y = 10;

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
];

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

function mapEditorWorldToScreenX(x) {
    return Math.floor((x - map_editor_view_center_x)*CW + view_width/2);
}

function mapEditorWorldToScreenY(y) {
    return Math.floor((y-map_editor_view_center_y)*CW + view_height/2);
}

function mapEditorDrawTileWithTransform(ctx, tile, x, y) {
    let x_pos_on_view = mapEditorWorldToScreenX(x); //Changes from cell coordinates in the world to pixel coordinates on view
    let y_pos_on_view = mapEditorWorldToScreenY(y);
    
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

function updateMapEditor(now, interval) {
    if (key_f) {
        map_editor = false;
        key_f = false;
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
                ctx.fillStyle = "black";
                ctx.fillText(t, mapEditorWorldToScreenX(x + cell_x), mapEditorWorldToScreenY(y + cell_y + 0.1));  
        }
    }
    
    drawCrosshair(ctx, crosshairs[1], real_mouse_x, real_mouse_y);
}