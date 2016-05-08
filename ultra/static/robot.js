function directionToAngle(d)
{
	// N 0- E +0 S 0+ W -0
	switch(d)
	{
		case 'N':
			return 90;
		case 'E':
			return 0;
		case 'S':
			return 270;
		case 'W':
			return 180;
	}
	return 90;
}

function Game(w, h, initialX, initialY, initialDir, baseColor, drawColor) {
	this.w = w;
	this.h = h;
	this.ix = initialX;
	this.iy = initialY;
	this.id = initialDir;
	this.ia = directionToAngle(this.id);
	this.baseColor = baseColor;
	this.drawColor = drawColor;
}

Game.prototype.init = function(pattern)
{
	this.panel = new Panel(this, this.w, this.h, this.baseColor);
	this.robot = new Robot(pattern, this.panel, this.ix, this.iy, this.ia);
	this.robot.attach(this);
	return {panel:this.panel, robot:this.robot};
}

Game.prototype.getInitialSetting = function()
{
	return {x:this.ix,y:this.iy,d:this.id,a:this.ia,w:this.w, h:this.h};
}

Game.prototype.notify = function(e)
{
	this.panel.putTile(e.x, e.y, this.drawColor);
}

Game.prototype.progress = function(p)
{
	return this.robot.progress(p);
}

function Panel(g, w, h, baseColor) {
	this.game = g;
	this.w = w;
	this.h = h;
	this.board = [];
	this.baseColor = baseColor;
	for(var i = 0; i < this.h; i ++)
	{
		var line = [];
		for(var j = 0; j < this.w; j++)
			line.push(null);
		this.board.push(line);
	}
}

Panel.prototype.getTile = function(x, y)
{
	return this.board[y][x] ? this.board[y][x] : this.baseColor;
}

Panel.prototype.putTile = function(x, y, c)
{
	this.board[y][x] = c;
}

Panel.prototype.isValidPosition = function(x, y) {
	return x >= 0 && y >= 0 && x < this.w && y < this.h;
}

function Robot(pattern, panel, x, y, a) {
	this.positions = []
	this.panel = panel;
	this.startX = x;
	this.startY = y;
	this.startAngle = a;
	this.pattern = pattern;
	this.build();

	this.observers = []
}

Robot.prototype.build = function()
{
	var panel = this.panel;

	var x = this.startX;
	var y = this.startY;
	var ang = this.startAngle;
	var dx = Math.round(Math.cos(ang*3.1415926535/180));
	var dy = -Math.round(Math.sin(ang*3.1415926535/180));

	this.currentProgress = -1;
	this.currentStep = -1;
	this.currentFrac = 0;

	this.positions.push({x:x, y:y, a:ang, stuck:false});

	var ll = this.pattern.length-1;
	for(var i = ll; i >=0;i--)
	{
		var stuck = false;
		switch(this.pattern.charAt(ll-i))
		{
			case 'M':
				var nx, ny;
				nx = x + dx;
				ny = y + dy;
				if (panel.isValidPosition(nx,ny))
				{
					x = nx;
					y = ny;
				}
				else
					stuck = true;
				break;
			case 'L':
				ang += 90;
				if (ang < 0)
					ang += 360;
				var t = dx;
				dx = dy;
				dy = -t;
				break;
			case 'R':
				ang -= 90;
				if (ang > 359)
					ang -= 360;
				var t = dx;
				dx = -dy;
				dy = t;
				break;
		}
		this.positions.push({x:x, y:y, a:ang, stuck:stuck});
	}
	this.progress(0);
}

Robot.prototype.attach = function(o) {
	this.observers.push(o);
	for(var i = 0; i <= this.currentStep; i ++)
		o.notify(this.positions[i]);
}

Robot.prototype.notify = function(e) {
	for(var i in this.observers)
	{
		this.observers[i].notify(e);
	}
}

Robot.prototype.progress = function(p) {
	if (p <= this.currentProgress)
		return  (this.currentStep < this.positions.length - 1);
	var lastStep = this.currentStep;
	this.currentProgress = p;
	this.currentStep = Math.floor(p);
	this.currentFrac = this.currentProgress - this.currentStep;

	for(var i = lastStep+1; i <= this.currentStep; i ++)
	{
		if (i >= 0 && i < this.positions.length)
		{
			this.notify(this.positions[i]);
		}
	}

	if (this.currentStep >= this.positions.length - 1)
		return false;
	return true;
}

Robot.prototype.getPosition = function() {
	var progress = this.currentProgress;
	var step = this.currentStep;
	var frac = this.currentFrac;
	if (step >= this.positions.length-1)
		return this.positions[this.positions.length-1];
	var a = this.positions[step];
	var b = this.positions[step+1];
	var aa = a.a;
	var ba = b.a;
	if (aa == 270 && ba == 0) ba = 360;
	if (aa == 0 && ba == 270) aa = 360;
	return {x:a.x*(1-frac)+b.x*frac, y:a.y*(1-frac)+b.y*frac, a:a.a*(1-frac)+b.a*frac, stuck:b.stuck};
}

