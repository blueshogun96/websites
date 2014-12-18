/* 
 * Globals 
 */

var area_width = 1024;  /* 80% of 720p */
var area_height = 576;
var game_over = false;

/* User */
function user_t( x, y )
{
    this.x = x;
    this.y = y;
    this.rot = 0;
}
user = new user_t( 0, 0 );

/* Square */
function square_t( x, y, vx, vy, colour )
{
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.colour = colour;
    this.dust_timer = 30;
}

var squares = [];
var square_spawn_timer = 0;


/* Cloud */
function cloud_t( x, y, v )
{
    this.x = x;
    this.y = y;
    this.v = v;
}

var clouds = [];
var cloud_spawn_timer = 60;

/* Trails */
/*function trail_t( x1, y1, x2, y2 )
{
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.intersection = false;
    this.alpha = 255;
}

var trails = [];*/

/* Sprite images */
var small_asterisk_image = new Image();
var cloud_image = new Image();
small_asterisk_image.src = "img/asterisk_n.png";
cloud_image.src = "img/cloud.png";


/*
 * Utility functions
 */

function remove( arr, item )
{
    for( var i = arr.length; i--; )
    {
        if( arr[i] === item )
        {
            arr.splice(i, 1);
        }
    }
}

/*
 * Game functions
 */

function on_mouse_move( mouseEvent )
{
    /* Save the current and previous mouse position */
    user.lx = user.x;
    user.ly = user.y;
    user.x = mouseEvent.offsetX;
    user.y = mouseEvent.offsetY;
}

function draw_user()
{
    var game_canvas = document.getElementById("game_canvas");
    var context = game_canvas.getContext("2d");
    
    /* Draw the asterisk */
    context.translate( user.x, user.y );
    context.rotate( user.rot );
    context.drawImage( small_asterisk_image, -8, -8, 16, 16 );
    context.rotate( -user.rot );
    context.translate( -user.x, -user.y );
    
    user.rot += 5.0/(360.0/(Math.PI*2));
    
    /* Add trails */
    //add_trail();
}

function add_square()
{
    var start_side = Math.floor(Math.random()*4);
    var rx = Math.random()*area_width;
    var ry = Math.random()*area_height;
    var vx = (Math.random()*5)+1;
    var vy = (Math.random()*5)+1;
    var colour = 'red';
    
    if( start_side === 0 ) /* Left side */
    {
        var s = new square_t( 0, ry, vx, 0, colour );
        squares.push(s);
    }
    if( start_side === 1 ) /* Right side */
    {
        var s = new square_t( area_width, ry, -vx, 0, colour );
        squares.push(s);
    }
    if( start_side === 2 ) /* Top side */
    {
        var s = new square_t( rx, 0, 0, vy, colour );
        squares.push(s);
    }
    if( start_side === 3 ) /* Bottom side */
    {
        var s = new square_t( rx, area_height, 0, -vy, colour );
        squares.push(s);
    }
}

function draw_squares()
{
    var game_canvas = document.getElementById("game_canvas");
    var context = game_canvas.getContext("2d");
        
    /*context.beginPath();
    context.rect( Math.random()*area_width, Math.random()*area_height, 8, 8 );
    context.fillStyle = 'red';
    context.fill();
    context.lineWidth = '2';
    context.strokeStyle = 'black';
    context.stroke();*/
    
    /* Draw squares */
    for( var i = squares.length; i--; )
    {
        context.beginPath();
        context.rect( squares[i].x, squares[i].y, 8, 8 );
        context.fillStyle = squares[i].colour;
        context.fill();
        context.lineWidth = '2';
        context.strokeStyle = 'black';
        context.stroke();
    }
}

function update_squares()
{
    /* Update squares */
    for( var i = squares.length; i--; )
    {
        /* Move squares along the screen */
        squares[i].x += squares[i].vx;
        squares[i].y += squares[i].vy;
        
        /* Check for squares off the screen. If they are, delete them now. */
        if( squares[i].x > area_width+1 || squares[i].x < -1 || squares[i].y > area_height+1 || squares[i].y < -1 )
        {
            squares.splice( i, 1 );
        }
    }
    
    /* Spawn new square roughly every second */
    square_spawn_timer++;
    if( square_spawn_timer > 60 )
    {
        add_square();
        square_spawn_timer = 0;
    }
}

function add_cloud()
{
    /* Add a new cloud to the list/array */
    
    var c = new cloud_t( -160, Math.random()*area_height, (Math.random()*5)+1 );
    clouds.push(c);
}

function draw_clouds()
{
    var game_canvas = document.getElementById("game_canvas");
    
    /* Draw clouds */
    for( var i = clouds.length; i--; )
    {
        game_canvas.getContext("2d").drawImage( cloud_image, clouds[i].x, clouds[i].y );
    }
}

function update_clouds()
{
    /* Move clouds along the screen */
    /* Delete clounds as they move off screen */
    for( var i = clouds.length; i--; )
    {
        clouds[i].x += clouds[i].v;
        if( clouds[i].x > area_width )
        {
            clouds.splice( i, 1 );
        }
    }
    
    /* Spawn new clouds roughly every 2 seconds */
    cloud_spawn_timer++;
    if( cloud_spawn_timer > 120 )
    {
        add_cloud();
        cloud_spawn_timer = 0;
    }
}

function add_trail()
{
    /* Add a new line */
    var t = new trail_t( user.x, user.y, user.lx, user.ly );
    trails.push(t);
}

function draw_trails()
{
    var game_canvas = document.getElementById("game_canvas");
    var context = game_canvas.getContext("2d");
    
    /* Draw all trails */
    for( var i = trails.length; i-- )
    {
        context.beginPath();
        context.moveTo( trails[i].x, trails[i].y );
        context.lineTo( trails[i].lx, trails[i].ly );
        context.lineWidth = 2;
        context.stroke();
    }
}

function update_trails()
{
    /* Update all trails */
    for( var i = trails.length; i-- )
    {
        trails[i].alpha -= 5;
        if( trails[i] < 5 )
        {
            trails.splice( i, 1 );
        }
    }
}

function clear_canvas()
{
    var game_canvas = document.getElementById("game_canvas");
    
    /* Resetting the canvas dimensions clears it entirely */
    game_canvas.width = area_width;
    game_canvas.height = area_height;
    
    /* Draw a white rectangle to clear the screen with */
    var context = game_canvas.getContext("2d");
    context.beginPath();
    context.rect( 0, 0, area_width, area_height );
    context.fillStyle = 'white';
    context.fill();
    
    /* Simulate a thick border */
    context.lineWidth = 10;
    context.strokeStyle = 'black';
    context.stroke();
}

function change_canvas_size()
{
    /*var game_canvas = document.getElementById("game_canvas");
    
    game_canvas.addEventListener( "mousemove", on_mouse_move );*/
    
    /* Clear the canvas/screen */
    /*clear_canvas();
    
    draw_user();
    draw_squares();*/
}

/* The main loop function */
function main_loop()
{
    game_canvas.addEventListener( "mousemove", on_mouse_move );
    
    clear_canvas();
    draw_clouds();
    update_clouds();
    draw_user();
    //draw_trails();
    //update_trails();
    draw_squares();
    update_squares();
}


/*
 * Game entry point
 */

/* Animate main loop */
var main = function()
{
    main_loop();
    //window.requestAnimationFrame( main );
}

//window.requestAnimationFrame(main);
var vblank_time = 1000/60;
setInterval( main, vblank_time );

