///<reference path="../engine/Scene.class.ts" />
///<reference path="../lib/pixi.d.ts" />
///<reference path="../lib/greensock.d.ts" />
///<reference path="../lib/Signal.js" />
///<reference path="../engine/ScenesManager.class.ts" />
///<reference path="../engine/Keyboard.class.ts" />
///<reference path="../engine/Background.class.ts" />
///<reference path="../model/Assets.class.ts" />
///<reference path="Bunny.Sprite.ts" />
///<reference path="Floor.class.ts" />
///<reference path="IntroScene.class.ts" />
module com.cc {

    // Class
    export class GameScene extends Scene {

        private bunny: PIXI.Sprite;
        private hero: Hero;
        private arr_enemies: Array;
        private keyboard:Keyboard;
        private bg:Background;
        private floor:FloorItem;
        private floorActive:FloorItem;
        private buildingActive:FloorItem;
        public gameSpeed:number;
        private alive:bool;


        constructor() {
            super();

            // add a background
            this.bg = new Background();
            this.addChild(this.bg);

            /**
             * Lets add a custom displayObject !!!!!!!
             *   the hero
             */

            this.hero = new Hero;
            var hero = this.hero;
            hero.position.x = 0;
            hero.position.y = 0;
            this.addChild(hero);
            hero.create();
            hero.heroSprite.setInteractive(true);
            hero.heroSprite.buttonMode = true;

            hero.heroSprite.mousedown = hero.heroSprite.touchstart = function(data)
            {
                console.log("click");
                this.data = data;
                this.alpha = 0.9;
                this.dragging = true;
            };
            hero.heroSprite.mouseup = hero.heroSprite.mouseupoutside = hero.heroSprite.touchend = hero.heroSprite.touchendoutside = function(data)
            {
                this.alpha = 1
                this.dragging = false;
                // set the interaction data to null
                this.data = null;
            };
            hero.heroSprite.mousemove = hero.heroSprite.touchmove = function(data)
            {
                if(this.dragging)
                {
                    // need to get parent coords..
                    var newPosition = this.data.getLocalPosition(this.parent);
                    this.position.x = newPosition.x;
                    this.position.y = newPosition.y;
                }
            }



            var _this = this;
            var button = new PIXI.Sprite(PIXI.Texture.fromImage("img/button.png"));
            button.position.x = 100;//ScenesManager.defaultWidth - 200;
            button.scale.x = 0.5;
            button.scale.y = 0.5;
            button.click = button.tap = function (data) {
                if (_this.isPaused()) return;
                //ScenesManager.goToScene('menu');
                //hero.switch();
                hero.uiJump();
            }
            button.setInteractive(true);
           // this.addChild(button);

            this.setInteractive(true);

            this.createEnemies();

            this.gameSpeed = 8;


            /**
             * Add keyboard
             */
            this.keyboard = new Keyboard;
            this.keyboard.keyboardSignal.add(this.onKeyboard, this);

            this.createFloor(100);
            this.createBuilding(100);
            this.alive = true;

            setInterval( () => this.setGradient(), 3000);

        }

        public grad:bool;
        private timerToken;
        private setGradient() {
             //console.log("grad "+this.grad);
             this.grad = Math.random() > 0.5 ? true : false;
        }

        public onKeyboard(keyCode) {

            switch (keyCode) {
                case 107:
                    this.gameSpeed++;
                    console.log("gamespeed: "+this.gameSpeed);
                    break;
                case 109:
                    this.gameSpeed--;
                    console.log("gamespeed: "+this.gameSpeed);
                    break;
            }
        }

        public resume() {
            // reset delta
            this.then =new Date();
            super.resume();
        }

        public update() {

            super.update();
            this.hero.update(this.gameSpeed, this.delta);

            if(this.alive){
                this.calcDelta();
                this.checkCollisions();
                this.moveEnemies();
                this.checkKeyboard();
                this.moveBackground();
                this.manageFloors();
                this.manageBuildings();
            }

        }

        private checkKeyboard() {

            if(this.keyboard.isDown(32)){
                this.hero.jump();
            }
        }

        private createEnemies() {
            this.arr_enemies = new Array;

            console.log("createEnemies");
            for (var n = 0; n < 5; n++)
            {
                var b = PIXI.Sprite.fromImage("img/bunny.png");
                b.anchor.x = 0.5;
                b.anchor.y = 0.5;
                b.position.x = Math.floor(Math.random() * (window.innerWidth));
                b.position.y = 200;//Math.floor(Math.random() * (window.innerHeight));

                this.addChild(b);
                this.arr_enemies.push(b);
            }
        }

        private arr_Floors:Array = new Array();
        private arr_Buildings:Array = new Array();
        private arr_Platforms:Array = new Array();
        private count = 0;
        private currentheight:number = 400;

        private createFloor(ypos:Number) {

            var randomWidth:Number = Math.floor(Math.random()*100);
            this.floor = new FloorItem(randomWidth);
            this.addChild(this.floor);
            if(this.arr_Floors.length>0){
                this.floor.position.x = this.arr_Floors[this.arr_Floors.length-1].position.x +  this.arr_Floors[this.arr_Floors.length-1].width;
            } else {
                this.floor.position.x = window.innerWidth;
            }

            if(this.grad) {
                this.currentheight++;
            }  else {
                this.currentheight--;
            }
            if( (this.currentheight > 470) || (this.currentheight < 350 )) this.grad = !this.grad;

            this.floor.position.y = this.currentheight;
            this.arr_Floors.push( this.floor );
            this.arr_Platforms.push( this.floor );

        }

        private manageFloors() {
            var lastFloor:FloorItem =  this.arr_Floors[this.arr_Floors.length-1];
            var firstFloor:FloorItem =  this.arr_Floors[0];
            //if( (lastFloor.position.x + lastFloor.width) < (window.innerWidth - Math.random()*250 ) ) {
            if( (lastFloor.position.x + lastFloor.width) < (window.innerWidth  ) ) {
                this.createFloor(100);
            }

            if( firstFloor.position.x + firstFloor.width < 0 ) {
                this.removeChild(firstFloor);
                this.arr_Floors.splice(0,1);
            }


        }

        /**
         * create some buildings
         */
        private createBuilding(ypos:Number) {

            var randomWidth:Number = Math.floor(Math.random()*1000);
            this.floor = new FloorItem(randomWidth,20);
            this.addChild(this.floor);

            if(this.arr_Buildings.length>0){
                this.floor.position.x = this.arr_Floors[this.arr_Floors.length-1].position.x +  this.arr_Floors[this.arr_Floors.length-1].width;
            } else {
                this.floor.position.x = window.innerWidth;
            }


            this.floor.position.y = this.currentheight- Math.floor(Math.random()*100) -100;
            this.arr_Buildings.push( this.floor );
            this.arr_Platforms.push( this.floor );

        }
        private manageBuildings() {
            var lastFloor:FloorItem =  this.arr_Buildings[this.arr_Buildings.length-1];
            var firstFloor:FloorItem =  this.arr_Buildings[0];

            if( (lastFloor.position.x + lastFloor.width) < (window.innerWidth - Math.random()*1000 )-100 ) {

                this.createBuilding(100);
            }

            if( firstFloor.position.x + firstFloor.width < 0 ) {
                this.removeChild(firstFloor);
                this.arr_Buildings.splice(0,1);
            }
        }




        private now;
        private delta;
        private then=Date.now();

        private calcDelta() {

            this.now = Date.now();
            this.delta = (this.now - this.then) / 1000; // seconds since last frame
            this.then = this.now;

        }

        private moveBackground() {
            this.bg.update(this.delta * this.gameSpeed/20);
        }

        private moveEnemies() {


            var arr = this.arr_enemies;
            var distance = (50 * this.delta) * this.gameSpeed;


            for (var n = 0; n < arr.length; n++)
            {

                arr[n].position.x =  (arr[n].position.x - distance);
                if( arr[n].position.x < 0 ) {
                    arr[n].position.x = (window.innerWidth);
                    arr[n].position.y = Math.floor(Math.random() * (window.innerHeight));
                }
            }
        }
        private onFloor:bool = true;
        private checkCollisions() {


            var hero = this.hero.heroSprite;
            var arr = this.arr_enemies;

            for (var n = 0; n < arr.length; n++)
            {
                var pickup = arr[n];

                var xdist = pickup.position.x - this.hero.heroSprite.position.x;

                if(xdist > - (pickup.width/2+(this.hero.heroSprite.width/2)) && xdist < pickup.width/2+(this.hero.heroSprite.width/2))
                {
                    var ydist = pickup.position.y - this.hero.heroSprite.position.y;

                    if(ydist > -(pickup.height/2+(this.hero.heroSprite.height/2)) && ydist < pickup.height/2+(this.hero.heroSprite.height/2))
                    {

                        pickup.position.x = (window.innerWidth) + Math.floor(Math.random() * (window.innerWidth));
                        pickup.position.y = Math.floor(Math.random() * (window.innerHeight));;


                    }
                }
            }
            /**
             *  this is moving the buildings and floor. move this to manage functions
             *
             */
            var distance = (100 * this.delta) * this.gameSpeed;

            for (var i = 0; i < this.arr_Floors.length; i++)
            {
                this.arr_Floors[i].position.x  -= distance;

            }
            for (var i = 0; i < this.arr_Buildings.length; i++)
            {

                this.arr_Buildings[i].position.x  -= distance;
            }
            // end


            /**
             * find active floor sections
             */
            for (var i = 0; i < this.arr_Floors.length; i++)
            {
                var leftFloor:Number = this.arr_Floors[i].position.x;
                var rightFloor:Number = this.arr_Floors[i].position.x + this.arr_Floors[i].width;

                if( (hero.position.x > leftFloor) && (hero.position.x<rightFloor) ) {

                    this.floorActive =  this.arr_Floors[i];
                }
            }

            /**
             * find active platform or floor
             */
            if(!(this.hero.yVel<0)){
            for (var i = 0; i < this.arr_Platforms.length; i++)
            {

                var leftFloor:Number = this.arr_Platforms[i].position.x;
                var rightFloor:Number = this.arr_Platforms[i].position.x + this.arr_Platforms[i].width;

                // get the currently active floor
                if( (hero.position.x > leftFloor) && (hero.position.x<rightFloor) ) {

                    this.buildingActive =  this.arr_Platforms[i];

                    if((hero.position.y) > this.buildingActive.position.y) {
                       // this.alive = false;
                       // this.hero.floorY = 800;
                       // this.hero.position.x -= 32;
                    } else {

                        this.hero.floorY = this.buildingActive.position.y;

                    }
                    return;
                } else {
                   //console.log( this.floorActive);
                    if(this.floorActive) this.hero.floorY = this.floorActive.position.y;
                }

            }
            }





            // this.floor.position.y +=  Math.random() > 0.5 ? 1 : -1;

            //console.log("hero: "+hero.position.y +" floor: "+this.floor.y);

            //  if(hero.position.y+(hero.height/2) > this.floor.position.y - (5)) {

            //      hero.position.y =  (this.floor.position.y) - hero.height/2;
            //  }


        }
    }

}