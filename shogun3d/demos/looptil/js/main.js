/*
 * Looptil
 * 
 * (C) Shogun3D 2014
 */

/* 
 * Globals 
 */

var area_width = 1024;  /* 80% of 720p */
var area_height = 576;
var game_over = false;
var game_mode = 0;  /* 0=menu, 1=tutorial, 2=ingame */
var enable_overlay = true;
var mouse_click = false;
var big_asterisk_rot = 0;
var mouse_in_canvas = true;
var mouse_x = 0, mouse_y = 0;
var score = 0;
var stage = 1;
var stage_timer_id;
var document_loaded = false;
var game_canvas;
var context;
var game_speed = 1.0;


/* User */
function user_t( x, y )
{
    this.x = x;
    this.y = y;
    this.rot = 0;
    this.shield = false;
    this.invincible = false;
    this.invincibility_timer = 0;
    this.alpha = 192;
    this.flash_timer = 0;
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
var square_spawn_timer_max = 60;
var square_speed_max = 5;


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
function trail_t( x1, y1, x2, y2 )
{
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.intersection = false;
	this.was_used = false;
    this.alpha = 255;
}

var trails = [];

/* Particles */
function particle_t( x, y, vx, vy, decay )
{
	this.x = x;
	this.y = y;
	this.vx = vx;
	this.vy = vy;
	this.decay = decay;
	this.alpha = 255.0;
}

var particles = [];

/* Dust particle */
function dust_t( x, y )
{
    this.x = x;
    this.y = y;
    this.timer = 255.0;
}

var dust = [];

/* Bermuda triangle */
function bermuda_triangle_t( p1, p2, p3 )
{
	this.p1 = p1;
	this.p2 = p2;
	this.p3 = p3;
}

var bermuda_triangles = [];


/* Sprite images */
var small_asterisk_image = new Image();
var large_asterisk_image = new Image();
var cloud_image = new Image();
var cursor_image = new Image();
var overlay_image = new Image();
small_asterisk_image.src = "demos/looptil/img/asterisk_n.png";
large_asterisk_image.src = "demos/looptil/img/asterisk_l.png";
cloud_image.src = "demos/looptil/img/cloud.png";
cursor_image.src = "demos/looptil/img/cursor.png";
overlay_image.src = "demos/looptil/img/overlay_lg.png";

/* Sound effects */
var sndfx = [];

function init_soundfx()
{
    sndfx[0] = new buzz.sound( "demos/looptil/snd/snd1", { formats: [ "mp3", "wav" ] } );
    sndfx[1] = new buzz.sound( "demos/looptil/snd/snd2", { formats: [ "mp3", "wav" ] } );
    sndfx[2] = new buzz.sound( "demos/looptil/snd/snd3", { formats: [ "mp3", "wav" ] } );
    sndfx[3] = new buzz.sound( "demos/looptil/snd/snd4", { formats: [ "mp3", "wav" ] } );
    sndfx[4] = new buzz.sound( "demos/looptil/snd/snd5", { formats: [ "mp3", "wav" ] } );
    sndfx[5] = new buzz.sound( "demos/looptil/snd/snd6", { formats: [ "mp3", "wav" ] } );
    sndfx[6] = new buzz.sound( "demos/looptil/snd/snd7", { formats: [ "mp3", "wav" ] } );
}

/*{
	new Audio( "snd/snd1.wav" ),
	new Audio( "snd/snd2.wav" ),
	new Audio( "snd/snd3.wav" ),
	new Audio( "snd/snd4.wav" ),
	new Audio( "snd/snd5.wav" ),
	new Audio( "snd/snd6.wav" ),
	new Audio( "snd/snd7.wav" )
};*/


/*
 * Utility functions
 */

function on_document_loaded()
{
    document_loaded = true;
}

function block_until_document_loaded()
{
    while( document_loaded )
        ;
}

function remove( arr, item )
{
    /*for( var i = arr.length; i--; )
    {
        if( arr[i] === item )
        {
            arr.splice(i, 1);
        }
    }*/
    
    var i = arr.indexOf( item );
    if( i != -1 )
        arr.splice( i, 1 );
}

function draw_font( string, x, y, font, colour )
{
    /* Draw the text */
    context.font = font;
    context.fillStyle = colour;
    context.fillText( string, Math.floor(x), Math.floor(y) );
}

function check_for_intersection( p1, p2, p3, p4 )
{
	var intersection_data = { x:0, y:0, positive:false };
	var x = [], y = [];
	x[0] = p1.x;x[1] = p2.x;x[2] = p3.x;x[3] = p4.x;
	y[0] = p1.y;y[1] = p2.y;y[2] = p3.y;y[3] = p4.y;

	var d = (x[0] - x[1]) * (y[2] - y[3]) - (y[0] - y[1]) * (x[2] - x[3]);
	
	if( d == 0 ) return intersection_data;
    
	// Get the x and y
	var pre = (x[0]*y[1] - y[0]*x[1]), post = (x[2]*y[3] - y[2]*x[3]);
	var X = ( pre * (x[2] - x[3]) - (x[0] - x[1]) * post ) / d;
	var Y = ( pre * (y[2] - y[3]) - (y[0] - y[1]) * post ) / d;
    
	// Check if the x and y coordinates are within both lines
	if ( X < Math.min(x[0], x[1]) || X > Math.max(x[0], x[1]) ||
        X < Math.min(x[2], x[3]) || X > Math.max(x[2], x[3]) ) return intersection_data;
	if ( Y < Math.min(y[0], y[1]) || Y > Math.max(y[0], y[1]) ||
        Y < Math.min(y[2], y[3]) || Y > Math.max(y[2], y[3]) ) return intersection_data;
    
	intersection_data.x = X;
	intersection_data.y = Y;
	intersection_data.positive = true;
    
	return intersection_data;
}

function point_inside_triangle( s, a, b, c )
{
    /* Determine whether the given point (s) is within the triangle formed by points A, B and C */
    
    var as_x = s.x-a.x;
    var as_y = s.y-a.y;
     
    var s_ab = ((b.x-a.x)*as_y-(b.y-a.y)*as_x > 0) ? true : false;
     
    if((c.x-a.x)*as_y-(c.y-a.y)*as_x > 0 == s_ab) return false;
     
    if((c.x-b.x)*(s.y-b.y)-(c.y-b.y)*(s.x-b.x) > 0 != s_ab) return false;
     
    return true;
}

var last_loop = new Date;
var filter_strength = 10;
var frame_time = 0;

function calculate_fps() 
{ 
    /*var this_loop = new Date;
    var fps = 1000 / (this_loop - last_loop);
    last_loop = this_loop;
	
	draw_font( 'Frames Per Second: ' + (fps).toFixed(1), 50, 50, '10pt Helvetica', 'black' ); */
	
	var this_frame_time = (this_loop = new Date) - last_loop;
	frame_time+= (this_frame_time - frame_time) / filter_strength;
	last_loop = this_loop;
	
	draw_font( 'Frames Per Second: ' + (1000/frame_time).toFixed(0), area_width - 200, area_height - 30, '10pt Helvetica', 'black' );
}

function update_mouse_position()
{
	/* Save the current and previous mouse position */
    user.lx = user.x;
    user.ly = user.y;
	user.x = mouse_x;
	user.y = mouse_y;
}

function snd_play( id )
{
	sndfx[id].currentTime = 0;
	sndfx[id].play();
}


/*
 * Game functions
 */

function on_mouse_move( mouseEvent )
{
    mouseEvent = mouseEvent || window.event;
    
	var obj = document.getElementById("game_canvas");
	var obj_left = 0;
	var obj_top = 0;
	
	while( obj.offsetParent )
	{
		obj_left += obj.offsetLeft;
		obj_top += obj.offsetTop;
		obj = obj.offsetParent;
	}
	if( mouseEvent )
	{
		//FireFox
		mouse_x = mouseEvent.pageX;
		mouse_y = mouseEvent.pageY;
	}
	else
	{
		//IE
		mouse_x = window.event.x + document.body.scrollLeft - 2;
		mouse_y = window.event.y + document.body.scrollTop - 2;
	}
	
	mouse_x -= obj_left;
	mouse_y -= obj_top;
}

function on_mouse_out()
{
    mouse_in_canvas = false;
    //canvas.setCapture();
    //alert( "Hahahahaha, please stop!" );
}

function on_mouse_over()
{
    mouse_in_canvas = true;
    //canvas.releaseCapture();
}

function on_mouse_click()
{
    /* Save mouse click */
    mouse_click = true;
}

function draw_cursor()
{
    context.drawImage( cursor_image, Math.floor(user.x), Math.floor(user.y) );
}

function global_alpha( alpha, operation )
{
    /* Set alpha level and blending operation */
    context.globalAlpha = alpha;
    context.globalCompositeOperation = operation;
}

function draw_overlay()
{
    /* Draw the overlay image */
    global_alpha( 0.05, "none" );
    context.drawImage( overlay_image, 0, 0, area_width, Math.floor(768*(area_height/768)) );
    global_alpha( 1.0, "none" );
}

function reset_game()
{
	/* Reset all lists */
	squares = [];
	dust = [];
	bermuda_triangles = [];
	particles = [];
	trails = [];
	
	/* Reset the user stats */
	score = 0;
	stage = 1;
    user.shield = false;
    user.invincible = false;
    
    /* Reset other stuff */
    square_speed_max = 5;
    square_spawn_timer_max = 60;
}

function draw_user()
{
    /* Get invincibility status */
    user.invincible = ( user.invincibility_timer > 0 || user.alpha < 255 ) ? true : false;
    
    if( user.invincibility_timer > 0 )
        user.invincibility_timer -= game_speed;
    
    if( user.invincibility_timer < 1 )
    {
        if( user.alpha > 0 )
            user.alpha += game_speed; /* Slowly return to normal */
    }
    
    /* Make the user flash if invincibility is wearing off */
    if( user.invincibility_timer < 1 && user.alpha < 255 )
    {
        user.flash_timer += game_speed;
        if( user.flash_timer > 3 )
            user.flash_timer = 0;
    }
    else
    {
        user.flash_timer = 0;
    }
    
    if( user.flash_timer > 2 )
        return;
    
	if( !game_over )
	{
		/* Draw the asterisk */
        global_alpha( user.alpha/255.0, 'none' );
		context.translate( Math.floor(user.x), Math.floor(user.y) );
		context.rotate( user.rot );
		context.drawImage( small_asterisk_image, -8, -8, 16, 16 );
		context.rotate( -user.rot );
		context.translate( Math.floor(-user.x), Math.floor(-user.y) );
        global_alpha( 1.0, 'none' );
		
		user.rot += 5.0/(360.0/(Math.PI*2));
		
        /* Draw shield */
        if( user.shield )
        {
            context.beginPath();
            context.arc( user.x, user.y, 20, 0, 2 * Math.PI );
            context.lineWidth = 2;
            context.strokeStyle = '#00ff00';
            context.stroke();
        }
        
		/* Add trails */
        add_trail();
		
		/* Did the user fall outside of the canvas? */
		if( !mouse_in_canvas )
		{
            stop_game();
			
			var pt = { x:user.x, y:user.y };
			add_particles( pt );
			//game_mode = 0;
		}
	}
}

function handle_game_over()
{
	/* Show the game over message */
	if( game_over )
	{
		draw_font( 'Game Over', (area_width/2)-100, (area_height/2), '25pt Helvetica', 'black' ); 
		draw_font( '(Click to play again!)', (area_width/2)-100, (area_height/2)+30, '14pt Helvetica', 'black' ); 
		
		/* Return to the main menu */
		if( mouse_click )
		{
			game_mode = 0;
			reset_game();
		}
	}
}

function red_collision(i)
{
    if( user.invincible )
        return;
    
    /* Particle explosion */
    var pt = { x:squares[i].x, y:squares[i].y };
    add_particles(pt);
    
    if( user.shield )
    {
        /* Kill this square */
        squares.splice( i, 1 );
        score += 5;
        
        /* Remove the shield */
        user.shield = false;
        snd_play(3);
        user.alpha = 192;
    }
    else
        stop_game();
}

function green_collision(i)
{
    /* Particle explosion */
    var pt = { x:squares[i].x, y:squares[i].y };
    add_particles(pt);
    
    /* Kill this square */
    squares.splice( i, 1 );
    score += 20;
    
    /* Give shield */
    user.shield = true;
    snd_play(0);
}

function blue_collision()
{
    /* Destroy all squares, and give point values. */
    for( var i = squares.length; i--; )
    {
        var pt = { x:squares[i].x, y:squares[i].y };
        add_particles(pt);
        score += 30;
    }
    
    /* Clear list and play sound */
    squares = [];
    snd_play(1);
}

function yellow_collision(i)
{
    /* Particle explosion */
    var pt = { x:squares[i].x, y:squares[i].y };
    add_particles(pt);
    
    /* Kill this square */
    squares.splice( i, 1 );
    score += 20;
    
    /* Reduce game speed to 20% */
    game_speed = 0.2;
    snd_play(1);
}

function white_collision(i)
{
    /* Particle explosion */
    var pt = { x:squares[i].x, y:squares[i].y };
    add_particles(pt);
    
    /* Kill this square */
    squares.splice( i, 1 );
    score += 20;
    
    /* Give invincibility */
    user.invincible = true;
    user.invincibility_timer = 500;
    user.alpha = 128;
    snd_play(5);
}

function add_square()
{
    var start_side = Math.floor(Math.random()*4);
    var rx = Math.random()*area_width;
    var ry = Math.random()*area_height;
    var vx = (Math.random()*square_speed_max)+1;
    var vy = (Math.random()*square_speed_max)+1;
    var colour = ['green', 'blue', 'yellow', 'white', 'red'];
    var id = ((Math.random()*100) > 80) ? Math.floor(Math.random()*4) : 4;
    
    if( rx < 50 ) rx = 50;
    if( rx > area_width-50 ) rx = area_width-50;
    if( ry < 50 ) ry = 50;
    if( ry > area_height-50 ) ry = area_height-50;
    
    if( start_side === 0 ) /* Left side */
    {
        var s = new square_t( 0, ry, vx, 0, colour[id] );
        squares.push(s);
    }
    if( start_side === 1 ) /* Right side */
    {
        var s = new square_t( area_width, ry, -vx, 0, colour[id] );
        squares.push(s);
    }
    if( start_side === 2 ) /* Top side */
    {
        var s = new square_t( rx, 0, 0, vy, colour[id] );
        squares.push(s);
    }
    if( start_side === 3 ) /* Bottom side */
    {
        var s = new square_t( rx, area_height, 0, -vy, colour[id] );
        squares.push(s);
    }
}

function draw_squares()
{
    /* Draw squares */
    for( var i = squares.length; i--; )
    {
        context.beginPath();
        context.rect( squares[i].x-4, squares[i].y-4, 8, 8 );
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
        squares[i].x += squares[i].vx * game_speed;
        squares[i].y += squares[i].vy * game_speed;
        
        if( !game_over )
        {
            /* Check for collisions with the user */
            if( user.x >= squares[i].x-8 && user.x <= squares[i].x+8 &&
               user.y >= squares[i].y-8 && user.y <= squares[i].y+8 )
            {
                /* Determine the square type */
                switch( squares[i].colour )
                {
                    case 'green':   green_collision(i);   continue;
                    case 'blue':    blue_collision();     return;
                    case 'yellow':  yellow_collision(i);  continue;
                    case 'white':   white_collision(i);   continue;
                    default:        red_collision(i);     continue;
                }
            }
        }
			
		/* Add a dust particle */
		squares[i].dust_timer -= game_speed;
		if( squares[i].dust_timer < 0 )
		{
			dust.push( new dust_t( squares[i].x, squares[i].y ) );
			squares[i].dust_timer = 15;
		}
			
        /* Check for squares off the screen. If they are, delete them now. */
        if( squares[i].x > area_width+1 || squares[i].x < -1 || squares[i].y > area_height+1 || squares[i].y < -1 )
        {
            squares.splice( i, 1 );
			continue;
        }
		
		/* Is this square inside a bermuda triangle? */
		var pt = { x:squares[i].x, y:squares[i].y };
		if( point_in_bermuda_triangle( pt ) )
		{
			/* Delete this square, and give the user 20 points */
			squares.splice( i, 1 );
			score += 20;
			
			/* Add particle explosion */
			add_particles( pt );
			
			snd_play(1);
		}
    }
    
    /* Spawn new square roughly every second */
    square_spawn_timer += game_speed;
    if( square_spawn_timer > square_spawn_timer_max )
    {
        if( !game_over )
			add_square();
			
        square_spawn_timer = 0;
    }
}

function add_particles( pt )
{
	var particle_count = (Math.random()*20)+10; /* Minimum of 10 */
    var i = 0;
	
    while( i < particle_count )
    {
        var angle = (Math.random()*628)/100.0;
        var speed = (Math.random()*5)+1;
        
        var vx = Math.cos(angle) * speed;
        var vy = Math.sin(angle) * speed;
        
        var decay = ((Math.random()*50)+1)/100.0;

		particles.push( new particle_t( pt.x, pt.y, vx, vy, decay ) );
        
        i++;
    }
}

function draw_particles()
{
	if( particles.length == 0 )
		return;
	
	for( var i = particles.length; i--; )
	{
		global_alpha( particles[i].alpha/255.0, 'none' );
		context.beginPath();
        context.rect( Math.floor(particles[i].x-2), Math.floor(particles[i].y-2), 4, 4 );
        context.fillStyle = 'grey';
        context.fill();
        context.lineWidth = '2';
        context.strokeStyle = 'black';
        context.stroke();
	}
	
	global_alpha( 1.0, 'none' );
}

function update_particles()
{
	if( particles.length == 0 )
		return;
		
	for( var i = particles.length; i--; )
	{
		particles[i].x += particles[i].vx * game_speed;
		particles[i].y += particles[i].vy * game_speed;
		if( particles.vx > 1.0 ) 
			particles[i].vx -= particles[i].decay;
		if( particles.vy > 1.0 ) 
			particles[i].vy -= particles[i].decay;
		particles[i].alpha -= 5.0 * game_speed;
		
		if( particles[i].alpha < 0 )
			particles.splice( i, 1 );
	}
}

function draw_dust_particles()
{
	for( var i = dust.length; i--; )
	{
		global_alpha( dust[i].timer/255.0, 'none' );
		context.beginPath();
        context.rect( dust[i].x-2, dust[i].y-2, 4, 4 );
        context.fillStyle = "black";
        context.fill();
	}
	
	global_alpha( 1.0, 'none' );
}

function update_dust_particles()
{
	for( var i = dust.length; i--; )
	{
		dust[i].timer -= 5.0 * game_speed;
		if( dust[i].timer < 0 )
			dust.splice( i, 1 );
	}
}

function add_cloud()
{
    /* Add a new cloud to the list/array */
    
    var c = new cloud_t( -160, Math.random()*(area_height-120), (Math.random()*5)+1 );
    clouds.push(c);
}

function draw_clouds()
{
    /* Draw clouds */
    for( var i = clouds.length; i--; )
    {
        game_canvas.getContext("2d").drawImage( cloud_image, clouds[i].x, clouds[i].y );
    }
}

function update_clouds()
{
    /* Move clouds along the screen */
    /* Delete clouds as they move off screen */
    for( var i = clouds.length; i--; )
    {
        clouds[i].x += clouds[i].v * game_speed;
        if( clouds[i].x > area_width )
        {
            clouds.splice( i, 1 );
        }
    }
    
    /* Spawn new clouds roughly every 2 seconds */
    cloud_spawn_timer += game_speed;
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
    /* Draw all trails */
    /*context.beginPath();
	var i = trails.length;
	context.moveTo( trails[i].x1, trails[i].y1 );
	context.lineTo( trails[i].x2, trails[i].y2 );
    for( i = trails.length-1; i--; )
    {
        context.lineTo( trails[i].x1, trails[i].y1 );
        context.lineTo( trails[i].x2, trails[i].y2 );
    }
    context.lineWidth = 2;
    context.stroke();*/
}

function draw_trail_spline()
{
    var points = [];	/* Points for spline */
	var p = 0;
	
	if( trails.length === 0 )
		return;
		
    /* Draw all trails */
    global_alpha( user.alpha/255.0, 'none' );
    context.beginPath();
    for( var i = trails.length; i--; )
    {
        points[p] = Math.floor(trails[i].x1); p++;
		points[p] = Math.floor(trails[i].y1); p++;
    }
	context.moveTo( points[0], points[1] );
	context.curve( points );
    context.lineWidth = 2;
    context.strokeStyle = 'black';
    context.stroke();
    global_alpha( 1.0, 'none' );
}

function update_trails()
{
    /* Update all trails */
    for( var i = trails.length; i--; )
    {
        trails[i].alpha -= 5;
        if( trails[i].alpha < 5 )
        {
            trails.splice( i, 1 );
        }
    }
	
	/* Check for intersections */
	handle_trail_intersections();
}

function match( p1, p2 )
{
	if( p1.x == p2.x && p1.y == p2.y )
		return true;
	
	return false;
}
function identical_points( t1, t2 )
{
	var t1p1 = { x:t1.x1, y:t1.y1 };
	var t1p2 = { x:t1.x2, y:t1.y2 };
	var t2p1 = { x:t2.x1, y:t2.y1 };
	var t2p2 = { x:t2.x2, y:t2.y2 };
    
	if( match(t1p1, t2p1) ) return true;
    if( match(t1p1, t2p2) ) return true;
    if( match(t1p2, t2p2) ) return true;
    if( match(t1p2, t2p1) ) return true;
	
    return false;
}

function handle_trail_intersections()
{
    /* Clear the list of bermuda triangles */
    bermuda_triangles = [];
    
	for( var i = trails.length; i--; )
	{
		var t1 = trails[i];
		for( var j = trails.length; j--; )
		{
			var t2 = trails[j];
			
			/* Do both of these lines already intersect? */
			if( trails[i].intersection && trails[j].intersection )
				continue;   /* TODO: This is error prone! */
			
			/* Do the lines have matching points? */
			if( identical_points( trails[i], trails[j] ) )
				continue;
				
			var p1 = { x:trails[i].x1, y:trails[i].y1 };
			var p2 = { x:trails[i].x2, y:trails[i].y2 };
			var p3 = { x:trails[j].x1, y:trails[j].y1 };
			var p4 = { x:trails[j].x2, y:trails[j].y2 };
			
			/* Check for an intersection */
			var intersect_point = check_for_intersection( p1, p2, p3, p4 );
			
			if( intersect_point.positive == true )
			{
				trails[i].intersection = true;
				trails[j].intersection = true;
				
				generate_bermuda_triangles( intersect_point );
				//alert( "We have an intersection" );
			}
		}
	}
}

function generate_bermuda_triangles( point_of_intersection )
{ 
	var begin = false, end = false;
    
    /* Search the list of trails and gather the points to form bermuda triangles */
    for( var i = trails.length; i--; )
    {
        var t = trails[i];
        
        /* Is this the first line with an intersection that hasn't been used for a triangle yet? */
        if( t.intersection && !begin )
        {
            /* If so, save the second point of the first line, and get the first point of the next line. */
            begin = true;
            
			var p1 = { x: point_of_intersection.x, y: point_of_intersection.y };
			var p2 = { x: trails[i].x2, y: trails[i].y2 };
			var p3 = { x: trails[i-1].x1, y: trails[i-1].y1 };
			
            bermuda_triangles.push( new bermuda_triangle_t( p1, p2, p3 ) );
			
            continue;
        }
        
        /* Is this the last line with an intersection? Then stop saving points and use them to create the circle. */
        if( t.intersection && begin )
        {
			var p1 = { x: point_of_intersection.x, y: point_of_intersection.y };
			var p2 = { x: t.x1, y: t.y1 };
			var p3 = { x: t.x2, y: t.y2 };
			
            bermuda_triangles.push( new bermuda_triangle_t( p1, p2, p3 ) );
            
            end = true;
            break;
        }
        
        /* Have we begun collecting points? */
        if( begin )
        {
            var p1 = { x: point_of_intersection.x, y: point_of_intersection.y };
			var p2 = { x: t.x1, y: t.y1 };
			var p3 = { x: t.x2, y: t.y2 };
			
            bermuda_triangles.push( new bermuda_triangle_t( p1, p2, p3 ) );
        }
    }
}

function point_in_bermuda_triangle( pt )
{
	if( bermuda_triangles.length == 0 )
		return false;
		
	for( var i = bermuda_triangles.length; i--; )
	{
		if( point_inside_triangle( pt, 
			bermuda_triangles[i].p1,
			bermuda_triangles[i].p2,
			bermuda_triangles[i].p3 ) )
			return true;
	}
	
	return false;
}

function draw_bermuda_triangles()
{
    /* Draw all trails */
    for( var i = bermuda_triangles.length; i--; )
    {
        context.beginPath();
		context.moveTo( bermuda_triangles[i].p1.x, bermuda_triangles[i].p1.y );
		context.lineTo( bermuda_triangles[i].p2.x, bermuda_triangles[i].p2.y );
		context.lineTo( bermuda_triangles[i].p3.x, bermuda_triangles[i].p3.y );
		context.lineWidth = 2;
		context.stroke();
    }
}

function draw_hud()
{
	draw_font( 'Stage: ' + stage, area_width-100, 30, '14pt Helvetica', 'black' );
	draw_font( 'Score: ' + score, 30, 30, '14pt Helvetica', 'black' );
}

function clear_canvas()
{
    /* Resetting the canvas dimensions clears it entirely */
    //game_canvas.width = area_width;
    //game_canvas.height = area_height;
    
    /* Draw a white rectangle to clear the screen with */
    var context = game_canvas.getContext("2d");
    context.fillStyle = 'white';
    context.fillRect( 0, 0, area_width, area_height );
    //context.beginPath();
    //context.rect( 0, 0, area_width, area_height );
    //context.fillStyle = 'white';
    //context.fill();
}

function draw_border()
{
	global_alpha( 1.0, 'none' );
	
	/* Draw a white rectangle to clear the screen with */
    context.beginPath();
    context.rect( 0, 0, area_width, area_height );
	
    /* Simulate a thick border */
    context.lineWidth = 10;
    context.strokeStyle = 'black';
    context.stroke();
}

function draw_title_screen()
{
    /* Title text */
    draw_font( 'Looptil', (area_width/16), area_height/4, '40pt Helvetica', 'black' );
    
    /* Start button */
    /*context.beginPath();
    context.rect( 100, (area_height/2)-32, 128, 64 );
    context.fillStyle = 'white';
    context.fill();*/
    
    /* Simulate a thick border */
    /*context.lineWidth = 2;
    context.strokeStyle = 'black';
    context.stroke();*/
    
    /* Draw a legend with instructions */
    global_alpha( 0.3, "none" );
    context.beginPath();
    context.rect( /*area_width-*/(area_width/16), area_height/3, (area_width/3)-40, 200 );
    context.fillStyle = "black";
    context.fill();
    global_alpha( 1.0, "none" );
    context.lineWidth = 2;
    context.strokeStyle = 'black';
    context.stroke();
    
    /* Font margins */
    var mx = (/*area_width-*/(area_width/16))+10;
    var my = (area_height/3)+20;
    
    draw_font( 'Instructions:', mx, my, 'Bold 10pt Helvetica', 'black' );
    draw_font( '1. Loop around the red squares to destroy them.', mx, my+25, '10pt Helvetica', 'black' );
    draw_font( '2. Touch non-red squares for power ups.', mx, my+40, '10pt Helvetica', 'black' );
    draw_font( '3. Do not touch the red squares or sides!', mx, my+55, '10pt Helvetica', 'black' );

    context.beginPath();
    context.rect( mx, my+81, 8, 8 );
    context.fillStyle = "red";
    context.fill();
    context.lineWidth = '2';
    context.strokeStyle = 'black';
    context.stroke();
    draw_font( 'Concentrated evil; Don\'t touch me!', mx+15, my+89, '10pt Helvetica', 'black' );
    
    context.beginPath();
    context.rect( mx, my+101, 8, 8 );
    context.fillStyle = "blue";
    context.fill();
    context.lineWidth = '2';
    context.strokeStyle = 'black';
    context.stroke();
    draw_font( 'Bomb; destroys everything in sight', mx+15, my+109, '10pt Helvetica', 'black' );
    
    context.beginPath();
    context.rect( mx, my+121, 8, 8 );
    context.fillStyle = "green";
    context.fill();
    context.lineWidth = '2';
    context.strokeStyle = 'black';
    context.stroke();
    draw_font( 'Shield; protects user from ONE red square', mx+15, my+129, '10pt Helvetica', 'black' );
    
    context.beginPath();
    context.rect( mx, my+141, 8, 8 );
    context.fillStyle = "yellow";
    context.fill();
    context.lineWidth = '2';
    context.strokeStyle = 'black';
    context.stroke();
    draw_font( 'Temporarily slow down time', mx+15, my+149, '10pt Helvetica', 'black' );
    
    context.beginPath();
    context.rect( mx, my+161, 8, 8 );
    context.fillStyle = "white";
    context.fill();
    context.lineWidth = '2';
    context.strokeStyle = 'black';
    context.stroke();
    draw_font( 'Temporary invincibility', mx+15, my+169, '10pt Helvetica', 'black' );
    
    /* Start button */
    global_alpha( 0.3, "none" );
    context.beginPath();
    context.rect( /*area_width-*/(area_width/16), (area_height/3)+220, ((area_width/3)-50)/2, 40 );
    context.fillStyle = "black";
    context.fill();
    global_alpha( 1.0, "none" );
    context.lineWidth = 2;
    context.strokeStyle = 'black';
    context.stroke();
    draw_font( 'Start', (area_width/16)+35, (area_height/3)+252, '25pt Helvetica', 'black' );
    
    /* Draw the big asterisk */
    context.translate( area_width-300, area_height/3 );
    context.rotate( big_asterisk_rot );
    context.drawImage( large_asterisk_image, -128, -128, 256, 256 );
    context.rotate( -big_asterisk_rot );
    context.translate(-(area_width-300), -(area_height/3) );
    
    big_asterisk_rot += 1.0/(360.0/(Math.PI*2));
}

function stage_timer_func()
{
    if( stage < 9 )
    {
        stage++;
        square_spawn_timer_max -= 6;
        square_speed_max += 0.5;
        stage_timer_id = setTimeout( stage_timer_func, 15000 );
        snd_play(6);
    }
}

function update_game_speed()
{
    /* Gradually return game speed to normal */
    game_speed += 0.002;
    if( game_speed > 1.0 )
        game_speed = 1.0;
}

function reset_game_speed()
{
    game_speed = 1.0;
}

function start_game()
{
    game_mode = 2;
    game_over = false;
    
    stage_timer_id = setTimeout( stage_timer_func, 15000 );
}

function stop_game()
{
    game_over = true;
    clearTimeout( stage_timer_id );
    
    snd_play(2);
}

function update_title_screen()
{
    /* Was the start button clicked? */
    if( mouse_click )
    {
        if( user.x > (area_width/16) && user.x < (area_width/16)+(((area_width/3)-50)/2) &&
           user.y > (area_height/3)+220 && user.y < (area_height/3)+260)
        {
            start_game();
        }
    }
}

var is_mobile =
{
    android: function()
    {
        return navigator.userAgent.match(/Android/i);
    },
    black_berry: function()
    {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    ios: function()
    {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    opera_mini: function()
    {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    windows: function()
    {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function()
    {
        return (is_mobile.android() || is_mobile.black_berry() || is_mobile.ios() || is_mobile.opera_mini() || is_mobile.windows());
    }
};

/* The main loop function */
function main_loop()
{
    /* Update mouse position */
	update_mouse_position();
	
    /* Clear the screen */
    clear_canvas();
    
    /* Draw clouds */
    draw_clouds();
    update_clouds();
    
	calculate_fps();
    
    /* Title screen (menu) */
    if( game_mode == 0 )
    {
        reset_game_speed();
        draw_title_screen();
        update_title_screen();
        
        draw_cursor();
    }
    
    /* Ingame */
    if( game_mode == 2 )
    {
        draw_user();
        //draw_trails();
		draw_trail_spline();
        update_trails();
        draw_squares();
        update_squares();
		draw_particles();
		update_particles();
		draw_dust_particles();
		update_dust_particles();
		handle_game_over();
		draw_hud();
        update_game_speed();
		draw_bermuda_triangles(); /* Test */
    }
	
    draw_overlay();
	if( !mobile_version )
        draw_border();
    
    /* Reset mouse click flag */
    mouse_click = false;
}

function go_fullscreen()
{
    var canvas = document.getElementById("game_canvas");
    if(canvas.requestFullScreen)
        canvas.requestFullScreen();
    else if(canvas.webkitRequestFullScreen)
        canvas.webkitRequestFullScreen();
    else if(canvas.mozRequestFullScreen)
        canvas.mozRequestFullScreen();
}

/* Set mouse callback functions */
function setup_event_handlers()
{
    var canvas = document.getElementById( "game_canvas" );
    
    if( !mobile_version )
    {
        canvas.addEventListener( "mousemove", on_mouse_move );
        canvas.addEventListener( "mouseout", on_mouse_out );
        canvas.addEventListener( "mouseover", on_mouse_over );
    }
    else
    {
        if( is_mobile.windows() )
        {
            canvas.addEventListener( 'pointerdown', on_mouse_move );
            canvas.addEventListener( 'pointermove', on_mouse_move );
            canvas.addEventListener( 'pointerup', on_mouse_move );
        }
        
        canvas.addEventListener( 'touchstart', function(e)
                                {
                                mouse_x = e.changedTouches[0].pageX;
                                mouse_y = e.changedTouches[0].pageY;
                                //e.preventDefault();
                                mouse_click = true;
                                }, false );
        canvas.addEventListener( 'touchmove', function(e)
                                {
                                mouse_x = e.changedTouches[0].pageX;
                                mouse_y = e.changedTouches[0].pageY;
                                e.preventDefault();
                                }, false );
        canvas.addEventListener( 'touchend', function(e)
                                {
                                mouse_x = e.changedTouches[0].pageX;
                                mouse_y = e.changedTouches[0].pageY;
                                e.preventDefault();
                                }, false );
        
    }
}

/*
 * Game entry point
 */

var mobile_version = false;

function on_load_mobile()
{
    /* Set mobile flag */
    mobile_version = true;
    
    /* Resume on_load() */
    on_load();
    
    /* Resize canvas */
    game_canvas.width = window.innerWidth;
    game_canvas.height = window.innerHeight;
    area_width = window.innerWidth;
    area_height = window.innerHeight;
}

function on_load()
{
var anim_frame;
    
/* Redirect mobile users to the mobile version of this page */
/* The mobile webpage should have the appropriate icon stating that this
   game will be available on the app store for their device. */
if(is_mobile.any() && mobile_version == false)
{
    window.location.replace("http://m.looptil.shogun3d.net");
    return;
}

/* Get canvas and context */
game_canvas = document.getElementById( "game_canvas" );
context = game_canvas.getContext("2d");
    
    /* Initialize sound effects */
    init_soundfx();
    
/* Animate main loop */
var main = function()
{
    main_loop();
    anim_frame( main );
}
    
/* Verify support for buzz sound library */
if( !buzz.isSupported() )
	alert( "HTML5 audio does not appear to be supported on your browser!" );
/*if( !buzz.isWAVSupported() )
	alert( "This browser doesn't appear to support .wav format!" );*/
	
//go_fullscreen();
//block_until_document_loaded();
setup_event_handlers();
    
if( window.mozRequestAnimationFrame )
{
    anim_frame = window.mozRequestAnimationFrame;
    anim_frame(main);
}
else if( window.requestAnimationFrame )
{
	anim_frame = window.requestAnimationFrame;
    anim_frame(main);
}
else
{
	var vblank_time = 1000/60;
	setInterval( main_loop, vblank_time );
}

}
/* TODO: http://h3manth.com/content/html5-canvas-full-screen-and-full-page */