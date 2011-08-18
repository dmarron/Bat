/**
* Bat - action game with echolocation.  Programmed by David Marron
 */
dojo.provide('myapp.Bat');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dijit.form.TextBox');
dojo.require('dijit.form.CheckBox');
dojo.require('dojox.timing._base');
dojo.require('dojo.i18n');
dojo.require('dojo.number');
//dojo.require('uow.audio.JSonic');
dojo.requireLocalization('myapp', 'Bat');

dojo.declare('myapp.Bat', [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
	templatePath: dojo.moduleUrl('myapp.templates', 'Bat.html'),

	postCreate: function() {
		this.connect(window,'onkeyup','_onKeyPress');
		this.connect(window,'onkeydown','_onKeyDown');
		this.connect(window,'onclick','_onClick');
		dojo.connect(dojo.doc, 'onkeypress', function(event) {
            if(event.target.size === undefined &&
               event.target.rows === undefined &&
               event.keyCode == dojo.keys.BACKSPACE) {
                // prevent backspace page nav
                //event.preventDefault();
            }
        } );
		this.introPage();
	},
    postMixInProperties: function() {
		//initialize jsonic from unc open web
		//uow.getAudio({defaultCaching: true}).then(dojo.hitch(this, function(js) { this.js = js; }));
		this.speed = 2;
		this.mode = "intro";
		this.row = 3;
		this.oldrow = 3;
		this.currentrow = 3;
		this.fakerow = 3;
		this.wingY = 0;
		this.wingDir = "down";
		this.fakeDir = "down";
		this.flying = "done";
		this.countTime = 0;
		this.seconds = 0;
		this.echo = 0;
		this.soundX = 0;
		this.bump = 0;
		this.previous = [1,2,3,4,5];
		this.secondTime = 167/this.speed*5;
		this.blocksVisible = true;
		this.sounds = [];
		this.soundCount = 1;
		this.buttons = [];
		this._ext = ".mp3";
		grid = [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
    },
	pressButton: function(e) {
		if (this.blocksVisible) {
			this.blocksVisible = false;
		} else {
			this.blocksVisible = true;
		}
		if (this.mode == "intro") {
			this.drawIntroPage();
		}
	},
	_onClick: function(e) {
		
	},
	_onKeyDown: function(e) {
		if (this.mode != "play") {
			if (this.mode == "pause") {
				if (e.keyCode == 80) {
					this.mode = "play";
					this.startTimer();
				}
			} else if (this.mode == "dead") {
				if (e.keyCode != 38 && e.keyCode != 40) {
					//restart to intro screen
					this.mode = "intro";
					this.drawIntroPage();
					grid = [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
					this.row = 3;
					this.oldrow = 3;
					this.currentrow = 3;
					this.fakerow = 3;
					this.wingY = 0;
					this.wingDir = "down";
					this.fakeDir = "down";
					this.flying = "done";
					this.previous = [];
				}
			} else if (this.mode == "intro") {
				if (e.keyCode == 38) {
					//up arrow
					if (this.speed < 20) {
						this.speed ++;
						this.drawIntroPage();
					}
				} else if (e.keyCode == 40) {
					//down arrow
					if (this.speed > 1) {
						this.speed --;
						this.drawIntroPage();
					}
				} else {
					this.mode = "play";
					this.secondTime = 167/this.speed*5;
					this.countTime = this.secondTime;
					this.row = 3;
					this.seconds = 0;
					this.startTimer();
				}
			}
		} else if (e.keyCode == 38) {
			//up arrow
			if (this.row > 1) {
				if (grid[this.row-1][1] == 1) {
					this.fakeDir = "up";
					this.fakerow = this.row-1;
					this.playBump();
				} else if (grid[this.row-1][2] == 1 && this.countTime >= this.secondTime/1.5 && grid[this.row][2] != 1) {
						this.fakeDir = "up";
						this.fakerow = this.row-1;
						this.playBump();
				} else {
					this.row --;
					this.fakerow = this.row;
					/*this.echoLocate();
					if (this.echo == 0) {
						this.echo = 1;
					} else {
						this.echo = 0;
					}*/
				}
			} else {
				this.fakerow = 0;
				this.fakeDir = "up";
				this.playBump();
			}
		} else if (e.keyCode == 40) {
			//down arrow
			if (this.row < 5) {
				if (grid[this.row+1][1] == 1) {
					this.fakeDir = "down";
					this.fakerow = this.row+1;
					this.playBump();
				} else if (grid[this.row+1][2] == 1 && this.countTime >= this.secondTime/1.5 && grid[this.row][2] != 1) {
					this.fakeDir = "down";
					this.fakerow = this.row+1;
					this.playBump();
				} else {
					this.row++;
					this.fakerow = this.row;
					/*this.echoLocate();
					if (this.echo == 0) {
						this.echo = 1;
					} else {
						this.echo = 0;
					}*/
				}
			} else {
				this.fakerow = 6;
				this.fakeDir = "down";
				this.playBump();
			}
		} else if (e.keyCode == 32) {
			//space pressed
			console.log(this.soundX);
			this.echoLocate();
		} else if (e.keyCode == 80) {
			//P pressed - pause game
			this.mode = "pause";
		}
	},
	_onKeyPress: function(e) {

	},
	startTimer: function(e) {
		var t = new dojox.timing.Timer();
		t.setInterval(1);
		t.onTick = dojo.hitch(this,function() {
			if (this.mode != "play") {
				t.stop();
				if (this.mode == "dead") {
					this.countTime = 0;
					this.seconds = 0;
				}
			} else {
				this.countTime++;
				//console.log(this.countTime);
				if (this.countTime >= this.secondTime/2 && this.echo == 0) {
					this.echo ++;
					this.echoLocate();
				}
				if (this.countTime >= this.secondTime) {
					this.countTime = 0;
					this.seconds ++;					
					this.createBlocks();
					if (this.echo == 1) {
						this.echo = 0;
						this.echoLocate();
					}
				}
				this.updateCanvas();
			}
		});
		t.start();
	},
	createBlocks: function(e) {
		var blockposition = Math.ceil(Math.random()*5);
		while (blockposition == this.previous[this.previous.length-1]) {
			//make sure you don't get two squares in a row, which would be unfair
			blockposition = Math.ceil(Math.random()*5);
		}
		for (var i = 0; i < this.previous.length-1; i++) {
			this.previous[i] = this.previous[i+1];
		}
		this.previous[this.previous.length-1] = blockposition;
		while(!this.checkBlocks() || blockposition == this.previous[this.previous.length-2]) {
			blockposition = Math.ceil(Math.random()*5);
			this.previous[this.previous.length-1] = blockposition;
		}
		grid[blockposition][5] = 1;
		if (this.seconds % 10 == 0) {
			this.seconds++;
			//this.createBlocks();
		}
	},
	checkBlocks: function(e) {
		//search for an unfair block trap
		var foundOne = false;
		var foundTwo = false;
		var foundThree = false;
		var foundFour = false;
		var foundFive = false;
		for (var i = 0; i < this.previous.length; i++) {
			if (this.previous[i] == 1) {
				foundOne = true;
			}
			if (this.previous[i] == 2) {
				foundTwo = true;
			}
			if (this.previous[i] == 3) {
				foundThree = true;
			}
			if (this.previous[i] == 4) {
				foundFour = true;
			}
			if (this.previous[i] == 5) {
				foundFive = true;
			}
		}
		if (foundOne && foundTwo && foundThree && foundFour && foundFive) {
			return false;
		} else {
			return true;
		}
	},
	echoLocate: function(e) {
		this.soundX = 1;
		this.sounds[0].play();
	},
	updateCanvas: function(e) {
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		var emptySpace = 30;
		var canHeight = canvas.height-emptySpace-1;
		var canWidth = canvas.width-emptySpace-1;
		var batRadius = canHeight/15;
		//draw game border
		if (!this.blocksVisible) {
			ctx.fillRect(emptySpace,emptySpace,canWidth,canHeight);
		} else {
			ctx.strokeRect(emptySpace,emptySpace,canWidth,canHeight);
		}
		//calculate wing position and bat Y value
		ctx.beginPath();
		if (this.row < this.oldrow) {
			this.flying = "up";
			this.currentrow += (this.row-this.oldrow)/30*this.speed/5;
			if (this.currentrow <= this.row) {
				this.flying = "done";
				this.currentrow = this.row;
				this.oldrow = this.row;
			}
			this.flapWings("fast");
		} else if (this.row > this.oldrow) {
			this.flying = "down";
			this.currentrow += (this.row-this.oldrow)/30*this.speed/5;
			if (this.currentrow >= this.row) {
				this.flying = "done";
				this.currentrow = this.row;
				this.oldrow = this.row;
			}
			this.flapWings("fast");
		} else if (this.row < this.fakerow) {
			//go down but bounce back up
			if (this.fakeDir == "down") {
				this.currentrow -= (this.row-this.fakerow)/50*this.speed/5
				if (this.currentrow >= this.fakerow + (this.row-this.fakerow)/1.3) {
					this.currentrow = this.fakerow + (this.row-this.fakerow)/1.3;
					this.fakeDir = "up";
				}
			} else {
				this.currentrow += (this.row-this.fakerow)/50*this.speed/5
				if (this.currentrow <= this.row) {
					this.currentrow = this.row;
					this.fakerow = this.row;
				}
			}
			this.flapWings("fast");
		} else if (this.row > this.fakerow) {
			//go up but bounce back down
			if (this.fakeDir == "up") {
				this.currentrow -= (this.row-this.fakerow)/50*this.speed/5
				if (this.currentrow <= this.fakerow + (this.row-this.fakerow)/1.3) {
					this.currentrow = this.fakerow + (this.row-this.fakerow)/1.3;
					this.fakeDir = "down";
				}
			} else {
				this.currentrow += (this.row-this.fakerow)/50*this.speed/5
				if (this.currentrow >= this.row) {
					this.currentrow = this.row;
					this.fakerow = this.row;
				}
			}
			this.flapWings("fast");
		} else if (this.flying == "up") {
			//go up but then back down in mid flight
			this.oldrow--;
		} else if (this.flying == "down") {
			this.oldrow++;
		} else {
			this.flapWings("slow");
		}
		//draw bat light circle
		ctx.beginPath();
		ctx.fillStyle = "#fff";
		ctx.arc(canWidth/6-batRadius/20,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace,batRadius*2.5,0,2*Math.PI,true);
		if (this.blocksVisible) {
			ctx.lineWidth = 2;
			ctx.stroke();
		} else {
			ctx.fill();
		}
		//draw bat
		ctx.beginPath();
		ctx.fillStyle = "#000";
		ctx.arc(canWidth/6,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace,batRadius,0,2*Math.PI,true);
		ctx.fill();
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#000";
		ctx.moveTo(canWidth/6,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace);
		ctx.lineTo(canWidth/6+batRadius/2-batRadius*1.5-emptySpace,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace+(this.wingY*batRadius/2));
		ctx.moveTo(canWidth/6,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace);
		ctx.lineTo(canWidth/6+batRadius*3.15-emptySpace,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace+(this.wingY*batRadius/2));
		ctx.stroke();
		ctx.beginPath();
		ctx.fillStyle = "red";
		ctx.arc(canWidth/6-batRadius/3,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace,batRadius/6,0,2*Math.PI,true);
		ctx.arc(canWidth/6+batRadius/3,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace,batRadius/6,0,2*Math.PI,true);
		ctx.fill();
		ctx.beginPath();
		ctx.fillStyle = "#fff";
		ctx.moveTo(canWidth/6-batRadius/2.5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/3+emptySpace);
		ctx.lineTo(canWidth/6-batRadius/5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/1.6+emptySpace);
		ctx.lineTo(canWidth/6,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/3+emptySpace);
		ctx.lineTo(canWidth/6+batRadius/5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/1.6+emptySpace);
		ctx.lineTo(canWidth/6+batRadius/2.5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/3+emptySpace);
		ctx.lineTo(canWidth/6-batRadius/2.5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/3+emptySpace);
		ctx.fill();
		//draw echolocation sound travelling
		
		//draw blocks and calculate block position
		var gridrow = this.row;
		for (var i = 0; i < grid.length; i++) {
			for (var j = 0; j < grid[i].length; j++) {
				if (grid[i][j] > 0) {
					if (i == gridrow && this.soundX > 0) {
						if (j == 5) {
							var vol = 0.1*(1 + this.countTime/this.secondTime);
							this.sounds[this.soundCount].volume = vol;
						} else if (j == 4) {
							var vol = 0.2*(1 + this.countTime/this.secondTime);
							this.sounds[this.soundCount].volume = vol;
						} else if (j == 3) {
							var vol = 0.4*(1 + this.countTime/this.secondTime);
							if (vol > 1) {
								vol = 1;
							}
							this.sounds[this.soundCount].volume = vol;
						} else if (j == 2) {
							var vol = 0.8*(1 + this.countTime/this.secondTime);
							if (vol > 1) {
								vol = 1;
							}
							this.sounds[this.soundCount].volume = vol;
						} else if (j == 1) {
							this.sounds[this.soundCount].volume = 1;
						}
						console.log(this.soundCount + " " + this.sounds[this.soundCount].volume);
						if (this.soundCount == 1) {
							this.sounds[this.soundCount].play();
							this.soundCount = 2;
						} else if (this.soundCount == 2) {
							this.sounds[this.soundCount].play();
							this.soundCount = 3;
						} else {
							this.sounds[this.soundCount].play();
							this.soundCount = 1;
						}
						this.soundX = 0;
						/*ctx.fillStyle = "#0f0";
						if (canWidth/12+canWidth/5*(j-(this.countTime/(this.secondTime-1))-0.5) > 0) {
							ctx.fillRect(emptySpace+canWidth/12+canWidth/5*(j-(this.countTime/(this.secondTime-1))-0.5),emptySpace+canHeight/100+canHeight*49/250*(i-1),canHeight*49/250,canHeight*49/250);
						}
						grid[i][j] = 20;*/
					} else {
						ctx.fillStyle = "#000";
						if (canWidth/12+canWidth/5*(j-(this.countTime/(this.secondTime-1))-0.5) > 0) {
							var draw = false;
							if (i <= this.row+1 && i >= this.row-1 && j <=2) {
								draw = true;
								if (j == 2) {
									if (i == this.row || i == this.oldrow) {
										if (this.countTime <= this.secondTime/1.25) {
											draw = false;
										}
									} else {
										if (this.countTime <= this.secondTime/1.05) {
											draw = false;
										}
									}
								}
							}
							if (draw || grid[i][j] > 1) {
								if (grid[i][j] > 1) {
									ctx.fillStyle = "#0f0";
									grid[i][j] --;
								}
								ctx.fillRect(emptySpace+canWidth/12+canWidth/5*(j-(this.countTime/(this.secondTime-1))-0.5),emptySpace+canHeight/100+canHeight*49/250*(i-1),canHeight*49/250,canHeight*49/250);
							} else {
								if (this.blocksVisible) {
									ctx.strokeRect(emptySpace+canWidth/12+canWidth/5*(j-(this.countTime/(this.secondTime-1))-0.5),emptySpace+canHeight/100+canHeight*49/250*(i-1),canHeight*49/250,canHeight*49/250);
								} else {
									if (j <= 2) {
										ctx.fillRect(emptySpace+canWidth/12+canWidth/5*(j-(this.countTime/(this.secondTime-1))-0.5),emptySpace+canHeight/100+canHeight*49/250*(i-1),canHeight*49/250,canHeight*49/250);
									}
								}
							}
						}
					}
					if (this.countTime >= this.secondTime-1) {
						grid[i][j] = 0;
						if (j != 0) {
							grid[i][j-1] = 1;
							if (j == 2 && i == this.row) {
								this.mode = "dead";
								this.sounds[6].play();
								//draw all remaining blocks once the bat has died
								ctx.fillStyle = "#fff";
								ctx.fillRect(0,0,canvas.width,canvas.height);
								ctx.strokeRect(emptySpace,emptySpace,canWidth,canHeight);
								//draw bat (again)
								ctx.beginPath();
								ctx.fillStyle = "#000";
								ctx.arc(canWidth/6,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace,batRadius,0,2*Math.PI,true);
								ctx.fill();
								ctx.lineWidth = 2;
								ctx.strokeStyle = "#000";
								ctx.moveTo(canWidth/6,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace);
								ctx.lineTo(canWidth/6+batRadius/2-batRadius*1.5-emptySpace,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace+(this.wingY*batRadius/2));
								ctx.moveTo(canWidth/6,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace);
								ctx.lineTo(canWidth/6+batRadius*3.15-emptySpace,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+emptySpace+(this.wingY*batRadius/2));
								ctx.stroke();
								ctx.beginPath();
								ctx.strokeStyle = "red";
								ctx.lineWidth = 3;
								ctx.moveTo(canWidth/6-batRadius/3-batRadius/8,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace-batRadius/8);
								ctx.lineTo(canWidth/6-batRadius/3+batRadius/8,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace+batRadius/8);
								ctx.moveTo(canWidth/6-batRadius/3-batRadius/8,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace+batRadius/8);
								ctx.lineTo(canWidth/6-batRadius/3+batRadius/8,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace-batRadius/8);								
								
								ctx.moveTo(canWidth/6+batRadius/3-batRadius/8,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace-batRadius/8);								
								ctx.lineTo(canWidth/6+batRadius/3+batRadius/8,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace+batRadius/8);								
								ctx.moveTo(canWidth/6+batRadius/3-batRadius/8,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace+batRadius/8);								
								ctx.lineTo(canWidth/6+batRadius/3+batRadius/8,canHeight/100+canHeight*49/250*(this.currentrow-1/2)-batRadius/3+emptySpace-batRadius/8);								
								
								ctx.stroke();
								ctx.strokeStyle = "#000";
								ctx.beginPath();
								ctx.fillStyle = "#fff";
								ctx.moveTo(canWidth/6-batRadius/2.5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/3+emptySpace);
								ctx.lineTo(canWidth/6-batRadius/5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/1.6+emptySpace);
								ctx.lineTo(canWidth/6,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/3+emptySpace);
								ctx.lineTo(canWidth/6+batRadius/5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/1.6+emptySpace);
								ctx.lineTo(canWidth/6+batRadius/2.5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/3+emptySpace);
								ctx.lineTo(canWidth/6-batRadius/2.5,canHeight/100+canHeight*49/250*(this.currentrow-1/2)+batRadius/3+emptySpace);
								ctx.fill();
								for (var k = 0; k < grid.length; k++) {
									for (var l = 0; l < grid[k].length; l++) {
										if (grid[k][l] == 1) {
											var m = k;
											var n = l;
											if (k < i) {
												n++;
											} else if (k == i) {
												if (n < j) {
													n++;
												}
											}
											ctx.fillStyle = "#000";
											if (canWidth/12+canWidth/5*(n-(this.countTime/(this.secondTime-1))-0.5) > 0) {
												ctx.fillRect(emptySpace+canWidth/12+canWidth/5*(n-(this.countTime/(this.secondTime-1))-0.5),emptySpace+canHeight/100+canHeight*49/250*(m-1),canHeight*49/250,canHeight*49/250);
											}
										}
									}
								}
								i = grid.length;
								break;
							}
						}
					}
				}
			}
		}
		this.soundX = 0;
	},
	flapWings: function(wingspeed) {
		if (wingspeed == "fast") {
			if (this.wingDir == "down") {
				this.wingY += 0.2*this.speed/5;
				if (this.wingY >= 1) {
					this.wingY = 1;
					this.wingDir = "up";
				}
			} else {
				this.wingY -= 0.2*this.speed/5;
				if (this.wingY <= -1) {
					this.wingY = -1;
					this.wingDir = "down";
				}
			}
		} else {
			if (this.wingDir == "down") {
				this.wingY += 0.03*this.speed/5;
				if (this.wingY >= 1) {
					this.wingY = 1;
					this.wingDir = "up";
				}
			} else {
				this.wingY -= 0.03*this.speed/5;
				if (this.wingY <= -1) {
					this.wingY = -1;
					this.wingDir = "down";
				}
			}
		}
	},
	playBump: function() {
		if (this.bump == 0) {
			this.bump = 1;
			this.sounds[4].play();
		} else {
			this.bump = 0;
			this.sounds[5].play();
		}
	},
	drawIntroPage: function(event) {
		this.mode = "intro";
		var ctx = canvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#000";
		ctx.strokeRect(30,30,canvas.width-31,canvas.height-31);
		ctx.save();
		ctx.font = "80pt Trebuchet MS";
		ctx.fillText("Bat",canvas.width/2-60,canvas.height/5+50);
		ctx.font = "20pt Trebuchet MS";
		ctx.fillText("Press any key",canvas.width/2-60,canvas.height/3+80);
		ctx.fillText("Speed: " + this.speed,canvas.width/2-60,canvas.height/3+120);
		ctx.fillText("Blocks Visible: " + this.blocksVisible,canvas.width/2-60,canvas.height/3+160);
		ctx.restore();
	},
	introPage: function(event) {
		dojo.empty(this.generateDiv);
		canvas = dojo.doc.createElement('canvas');
		canvas.setAttribute('width',750); 
		canvas.setAttribute('height',canvas.width*3/5); 
		dojo.place(canvas, this.generateDiv);
		var b = new dijit.form.Button({ label: "Toggle Visibility" });
		this.connect(b, 'onClick', dojo.hitch(this,"pressButton"));
		this.buttons.push(b);
		dojo.create('br', null, this.generateDiv);
		dojo.place(b.domNode, this.generateDiv);
		var node = dojo.create('audio');
        if (node.canPlayType('audio/ogg') && node.canPlayType('audio/ogg') != 'no') {
            this._ext = '.ogg';
        } else if (node.canPlayType('audio/mpeg') && node.canPlayType('audio/mpeg') != 'no') {
            this._ext = '.mp3';
        }
		var soundout = dojo.doc.createElement('audio');
		soundout.setAttribute('src', 'sounds/out' + this._ext);
		this.sounds.push(soundout);
		var soundback = dojo.doc.createElement('audio');
		soundback.setAttribute('src', 'sounds/back' + this._ext);
		this.sounds.push(soundback);
		var soundbacktwo = dojo.doc.createElement('audio');
		soundbacktwo.setAttribute('src', 'sounds/back2' + this._ext);
		this.sounds.push(soundbacktwo);
		var soundbackthree = dojo.doc.createElement('audio');
		soundbackthree.setAttribute('src', 'sounds/back3' + this._ext);
		this.sounds.push(soundbackthree);
		var bumpone = dojo.doc.createElement('audio');
		bumpone.setAttribute('src', 'sounds/bump' + this._ext);
		this.sounds.push(bumpone);
		var bumptwo = dojo.doc.createElement('audio');
		bumptwo.setAttribute('src', 'sounds/bump2' + this._ext);
		this.sounds.push(bumptwo);
		var crash = dojo.doc.createElement('audio');
		crash.setAttribute('src', 'sounds/crash' + this._ext);
		this.sounds.push(crash);
		this.drawIntroPage();
	},
});