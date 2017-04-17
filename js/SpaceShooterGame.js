class Bullet extends Phaser.Sprite {
    constructor(newDamage, game, xPosition, yPosition, spriteName) {
        super(game, xPosition, yPosition, spriteName);
        this.damage = newDamage;
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        game.physics.arcade.enable(this);
        this.events.onOutOfBounds.add(GameHelpers.destroyObject);
        this.body.bounce.y = 0;
        this.body.bounce.x = 0;
        this.body.gravity.y = 0;
        this.checkWorldBounds = true;
        this.scale.setTo(0.5, 0.5);

        this.noTarget = false;
        this.updateFunctions = [];
    }

    update() {
        if (!this.noTarget && !SpaceShooterGame.PlayerSpaceship.alive) {
            this.noTarget = true;
        }
        this.updateFunctions.forEach(function(foundAction) {
            foundAction();
        });
    }
}

class NormalBullet extends Bullet {
    constructor(newDamage, newXVelocity, newYVelocity, game, xPosition, yPosition, spriteName) {
        super(newDamage, game, xPosition, yPosition, spriteName);
        this.body.velocity.x = newXVelocity;
        this.body.velocity.y = newYVelocity;
    }
}

class HomingMissile extends Bullet {
    constructor(newDamage, missileSpeed, lifeTime, game, xPosition, yPosition, spriteName) {
        super(newDamage, game, xPosition, yPosition, spriteName);
        this.speed = missileSpeed;

        this.game.time.events.add(lifeTime, GameHelpers.explodeObject, null, this, AssetNames.explosion, AnimationNames.explosion);

        this.updateFunctions.push(this._actionMoveToTarget.bind(this));

        let trail = game.add.emitter(0, ((this.height / this.scale.y) / 2), 400);
        trail.width = this.width / 2;
        trail.makeParticles(AssetNames.orangeParticle);
        trail.setXSpeed(30, -30);
        trail.setYSpeed(400, 350);
        trail.setAlpha(1, 0.01, 200);
        trail.setScale(0.4, 0.2, 0.4, 0.2, 200);
        trail.start(false, 300, 10);
        this.addChild(trail);
    }

    _actionMoveToTarget() {
        if (!this.noTarget) {
            this.game.physics.arcade.moveToObject(this, SpaceShooterGame.PlayerSpaceship, this.speed);
            this.rotation = (0.5 * Math.PI) + this.game.physics.arcade.angleBetweenCenters(this, SpaceShooterGame.PlayerSpaceship);
        }
    }
}

class HomingTurret extends Phaser.Sprite {
    constructor(newDamage, game, xPosition, yPosition, spriteName) {
        super(game, xPosition, yPosition, spriteName);
        this.damage = newDamage;
        this.anchor.setTo(0.5, 0.5);
        game.physics.arcade.enable(this);
        this.body.bounce.y = 0;
        this.body.bounce.x = 0;
        this.body.gravity.y = 0;
        this.scale.setTo(0.5, 0.5);

        this.pauseBetweenAttacks = 3000;
        this.nextAttackTime = game.time.now + this.pauseBetweenAttacks;

        SpaceShooterGame.Turrets.add(this);

        this.startBulletPosition = new Phaser.Point(this.x, this.y - (this.height / 2));
    }

    update() {
        if (SpaceShooterGame.PlayerSpaceship.alive) {
            this.rotation = (0.5 * Math.PI) + this.game.physics.arcade.angleBetweenCenters(this, SpaceShooterGame.PlayerSpaceship);
            if (this.game.time.now >= this.nextAttackTime) {
                this.startBulletPosition.x = this.x;
                this.startBulletPosition.y = this.y - (this.height / 2);
                this.startBulletPosition.rotate(this.x, this.y, this.rotation);
                /*console.log('Point x ' + this.startBulletPosition.x);
                console.log('Point y ' + this.startBulletPosition.y);*/
                let NewBullet = new NormalBullet(10, 0, 0, this.game, this.startBulletPosition.x, this.startBulletPosition.y,
                    AssetNames.orangeEnemyBullet);
                SpaceShooterGame.EnemyBullets.add(NewBullet);
                this.nextAttackTime = this.pauseBetweenAttacks + this.game.time.now;
                this.game.physics.arcade.moveToObject(NewBullet, SpaceShooterGame.PlayerSpaceship, 300);
            }
        }
    }
}

class Enemy extends Phaser.Sprite {
    constructor(hitPoints, game, xPosition, yPosition, spriteName, pathPoints, amountOfPathMovements) {
        super(game, xPosition, yPosition, spriteName);
        this.hp = hitPoints;
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.FirstXPosition = xPosition;

        game.physics.arcade.enable(this);
        this.body.bounce.y = 0;
        this.body.bounce.x = 0;
        this.body.gravity.y = 0;
        this.body.velocity.x = 150;

        //Sprite rotation
        this.angle = 180;
        this.scale.setTo(0.5, 0.5);

        //Path creation
        this.pathIndex = 0;
        this.path = [];
        let percentageSmallest = 1 / amountOfPathMovements;
        let xPoint;
        let yPoint;
        for (var percentage = 0; percentage <= 1; percentage += percentageSmallest) {
            xPoint = Phaser.Math.linearInterpolation(pathPoints.x, percentage);
            yPoint = Phaser.Math.linearInterpolation(pathPoints.y, percentage);

            this.path.push({
                x: xPoint,
                y: yPoint
            });
        }

        this.noTarget = false;
        this.updateFunctions = [];
        /*let CurrentTimeEvent = game.time.events.repeat(100, 500, function() {
            this.angle += 1;
        }, this);*/
        //removing of timeEvent
        /*this.events.onDestroy.add(() => {
            SpaceShooterGame.game.time.events.remove(CurrentTimeEvent);
            console.log('TimeEvent was removed');
        });*/
    }

    update() {
        if (!this.noTarget && !SpaceShooterGame.PlayerSpaceship.alive) {
            this.noTarget = true;
            this.noTargetAction();
        }
        //Move ship using path
        this.x = this.path[this.pathIndex].x;
        this.y = this.path[this.pathIndex].y;
        if (this.pathIndex == (this.path.length - 1)) {
            this.pathIndex = 0;
        } else {
            ++this.pathIndex;
        }

        if (!this.noTarget) {
            this._actionFire();
        }

        this.updateFunctions.forEach(function(foundAction) {
            foundAction();
        });

        /*if (this.x < this.FirstXPosition - 100) {
            this.body.velocity.x = 150;
        } else if (this.x > this.FirstXPosition + 100) {
            this.body.velocity.x = -150;
        }*/
    }
    //Method for ovveride only
    noTargetAction() {

    }
    //Method for ovveride only
    _actionFire() {

    }
}

class FirstLevelEnemy extends Enemy {
    constructor(hitPoints, game, xPosition, yPosition, spriteName, pathPoints, amountOfPathMovements) {
        super(hitPoints, game, xPosition, yPosition, spriteName, pathPoints, amountOfPathMovements);

        this.pauseBetweenAttacks = 1000;
        this.nextAttackTime = game.time.now + this.pauseBetweenAttacks;
    }

    _actionFire() {
        if (this.game.time.now >= this.nextAttackTime) {
            let bulletXPosition = this.x;
            let bulletYPosition = this.y + (this.height / 2);
            let NewBullet = new NormalBullet(10, 0, 150, this.game, bulletXPosition, bulletYPosition, AssetNames.blueEnemyBullet);
            //let NewBullet = new HomingMissile(10, 150, 2000, this.game, bulletXPosition, bulletYPosition, AssetNames.missile);
            SpaceShooterGame.EnemyBullets.add(NewBullet);
            this.nextAttackTime = this.pauseBetweenAttacks + this.game.time.now;
        }
    }
}

class SecondLevelEnemy extends Enemy {
    constructor(hitPoints, game, xPosition, yPosition, spriteName, pathPoints, amountOfPathMovements) {
        super(hitPoints, game, xPosition, yPosition, spriteName, pathPoints, amountOfPathMovements);

        this.pauseBetweenAttacks = 1000;
        this.nextAttackTime = game.time.now + this.pauseBetweenAttacks;

        this.updateFunctions.push(this._actionRotateTowardsTarget.bind(this));

        this.startBulletPosition = new Phaser.Point(this.x, this.y - (this.height / 2));
    }

    noTargetAction() {
        console.log('rotation: ' + this.rotation);
        if (this.rotation < 0) {
            this.game.add.tween(this).to({
                rotation: -Math.PI,
            }, 2000, "Linear", true);
        } else {
            this.game.add.tween(this).to({
                rotation: Math.PI,
            }, 2000, "Linear", true);
        }
    }

    _actionFire() {
        if (this.game.time.now >= this.nextAttackTime) {
            let NewBullet = new NormalBullet(10, 0, 0, this.game, this.startBulletPosition.x, this.startBulletPosition.y,
                AssetNames.orangeEnemyBullet);
            SpaceShooterGame.EnemyBullets.add(NewBullet);
            this.nextAttackTime = this.pauseBetweenAttacks + this.game.time.now;
            this.game.physics.arcade.moveToObject(NewBullet, SpaceShooterGame.PlayerSpaceship, 300);
        }
    }

    _actionRotateTowardsTarget() {
        if (!this.noTarget) {
            this.rotation = (0.5 * Math.PI) + this.game.physics.arcade.angleBetweenCenters(this, SpaceShooterGame.PlayerSpaceship);
            this.startBulletPosition.x = this.x;
            this.startBulletPosition.y = this.y - (this.height / 2);
            this.startBulletPosition.rotate(this.x, this.y, this.rotation);
        }
    }
}

class ThirdLevelEnemy extends Enemy {
    constructor(hitPoints, game, xPosition, yPosition, spriteName, pathPoints, amountOfPathMovements) {
        super(hitPoints, game, xPosition, yPosition, spriteName, pathPoints, amountOfPathMovements);

        this.pauseBetweenAttacks = 8000;
        this.nextAttackTime = game.time.now + 1000;
    }

    _actionFire() {
        if (this.game.time.now >= this.nextAttackTime) {
            let bulletXPosition = this.x;
            let bulletYPosition = this.y + (this.height / 2);
            let newMissile = new HomingMissile(20, 150, 5000, this.game, bulletXPosition, bulletYPosition, AssetNames.missile);
            SpaceShooterGame.EnemyBullets.add(newMissile);
            this.nextAttackTime = this.pauseBetweenAttacks + this.game.time.now;
            this.game.physics.arcade.moveToObject(newMissile, SpaceShooterGame.PlayerSpaceship, 300);
        }
    }
}

class SuperEnemy extends Enemy {
    constructor(hitPoints, game, xPosition, yPosition, spriteName, pathPoints, amountOfPathMovements) {
        super(hitPoints, game, xPosition, yPosition, spriteName, pathPoints, amountOfPathMovements);
        this.pauseBetweenUsualAttacks = 2000;
        this.nextUsualAttackTime = game.time.now + 1000;
        this.pauseBetweenMissiles = 8000;
        this.nextMissileTime = game.time.now + 2000;
        this.scale.setTo(0.6, 0.6);
        this.homingTurret = new HomingTurret(10, this.game, 0, 0, AssetNames.turret);

        this.events.onKilled.add(this._onKilledEventHandler, this);

        this.updateFunctions.push(this._actionChangeTurretPosition.bind(this));
    }

    _onKilledEventHandler() {
        this.homingTurret.kill();
    }

    _actionFire() {
        if (this.game.time.now >= this.nextUsualAttackTime) {
            let bulletsYPosition = this.y + (this.height / 4);
            let firstBulletXPosition = this.x - (this.width / 8.5);
            let secondBulletXPosition = this.x + (this.width / 7);
            let FirstNewBullet = new NormalBullet(10, 0, 300, this.game, firstBulletXPosition, bulletsYPosition,
                AssetNames.blueEnemyBullet);
            let SecondtNewBullet = new NormalBullet(10, 0, 300, this.game, secondBulletXPosition, bulletsYPosition,
                AssetNames.blueEnemyBullet);
            SpaceShooterGame.EnemyBullets.add(FirstNewBullet);
            SpaceShooterGame.EnemyBullets.add(SecondtNewBullet);
            this.nextUsualAttackTime = this.pauseBetweenUsualAttacks + this.game.time.now;
        }
        if (this.game.time.now >= this.nextMissileTime) {
            let missileXPosition = this.x;
            let missileYPosition = this.y + (this.height / 2);
            let newMissile = new HomingMissile(20, 150, 5000, this.game, missileXPosition, missileYPosition, AssetNames.missile);
            SpaceShooterGame.EnemyBullets.add(newMissile);
            this.nextMissileTime = this.pauseBetweenMissiles + this.game.time.now;
        }
    }

    _actionChangeTurretPosition() {
        this.homingTurret.x = this.x;
        this.homingTurret.y = this.y - this.height / 4;
    }
}

// var bank, shipTrail;
// var MAXSPEED = 400;
class Player extends Phaser.Sprite {
    constructor(game, xPosition, yPosition, spriteName) {
        super(game, xPosition, yPosition, spriteName);
        this.bank = null;
        this.MAXSPEED = 400;
        this.shipTrail = null;
        this.score = 0;
        this.hitPoints = 100;
        this.maxHitPoints = 100;
        /*this.hitPoints = 300;
        this.maxHitPoints = 300;*/
        this.BulletSpeed = -150;
        this.BulletPauseTime = 500;
        this.maxBulletPauseTime = 500;
        this.NextBulletTime = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        game.physics.arcade.enable(this);
        this.body.bounce.y = 0;
        this.body.bounce.x = 0;
        this.body.gravity.y = 0;
        this.body.collideWorldBounds = true;
        this.scale.setTo(0.5, 0.5);

        this.shipTrail = game.add.emitter(0, ((this.height / this.scale.y) / 2), 400);
        this.shipTrail.width = 10;
        this.shipTrail.makeParticles(AssetNames.playerBullet);
        this.shipTrail.setXSpeed(30, -30);
        this.shipTrail.setYSpeed(200, 180);
        this.shipTrail.setRotation(50, -50);
        this.shipTrail.setAlpha(1, 0.01, 800);
        this.shipTrail.setScale(0.05, 0.4, 0.05, 0.4, 2000, Phaser.Easing.Quintic.Out);
        this.shipTrail.start(false, 5000, 10);
        this.addChild(this.shipTrail);
    }
    //Update will be be called automatically
    update() {
        //Movement
        this.body.velocity.y = 0;
        this.body.velocity.x = 0;
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT) &&
            this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
            this.body.velocity.x = -150;
            this.body.velocity.y = -150;
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT) &&
            this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
            this.body.velocity.x = -150;
            this.body.velocity.y = 152;
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT) &&
            this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
            this.body.velocity.x = 150;
            this.body.velocity.y = -150;
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT) &&
            this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
            this.body.velocity.x = 150;
            this.body.velocity.y = 152;
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
            this.body.velocity.x = -150;
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
            this.body.velocity.x = 150;
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
            this.body.velocity.y = -150;
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
            this.body.velocity.y = 152;
        }
        //Fire
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.CONTROL)) {
            if (this.game.time.now >= this.NextBulletTime) {
                let bulletXPosition = this.x;
                let bulletYPosition = this.y - (this.height / 2);
                let NewBullet = new NormalBullet(5, 0, this.BulletSpeed, this.game, bulletXPosition, bulletYPosition, AssetNames.playerBullet);
                SpaceShooterGame.PlayerBullets.add(NewBullet);
                SpaceShooterGame.blaster.play();
                this.NextBulletTime = this.BulletPauseTime + this.game.time.now;
            }
        }

        this.bank = this.body.velocity.x / this.MAXSPEED;
        this.scale.x = 1 - Math.abs(this.bank) / 2;
        this.angle = this.bank * 30;
    }
}

class Pseudo3DButton extends Phaser.Button {
    constructor(text, textStyleOut, textStyleOver, heightDifference, game, x, y, key, callback, callbackContext, overFrame, outFrame, downFrame) {
        super(game, x, y, key, callback, callbackContext, overFrame, outFrame, downFrame);
        this.textOutStyle = textStyleOut;
        this.textOverStyle = textStyleOver;
        this.pressedStateHeightDifference = heightDifference;
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.text = game.make.text(0, 0, text, textStyleOut);
        this.text.anchor.x = 0.5;
        this.text.anchor.y = 0.5;
        this.addChild(this.text);

        this.onInputOver.add(this._inputOverEventHandler, this);
        this.onInputOut.add(this._inputOutEventHandler, this);
        this.onInputDown.add(this._inputDownEventHandler, this);
        this.onInputUp.add(this._inputUpEventHandler, this);
    }

    _inputOverEventHandler() {
        this.text.setStyle(this.textOverStyle);
    }

    _inputOutEventHandler() {
        this.text.setStyle(this.textOutStyle);
    }

    _inputDownEventHandler() {
        this.text.y += this.pressedStateHeightDifference;
    }

    _inputUpEventHandler() {
        this.text.y -= this.pressedStateHeightDifference;
    }

}

const SpaceShooterGame = function() {

    const _spaceShooterPreload = function() {
        GamePublicParts.game.load.image(AssetNames.playerShip, 'assets/img/SmallStarShip.png');
        GamePublicParts.game.load.image(AssetNames.playerHealthBar, 'assets/img/HealthBar.png');
        GamePublicParts.game.load.image(AssetNames.playerBullet, 'assets/img/PlayerBullet.png');
        GamePublicParts.game.load.image(AssetNames.blueEnemyBullet, 'assets/img/EnemyBullet.png');
        GamePublicParts.game.load.image(AssetNames.orangeEnemyBullet, 'assets/img/SecondEnemyBullet.png');
        GamePublicParts.game.load.image(AssetNames.gameBackground, 'assets/img/SmallBackground2.jpg');
        GamePublicParts.game.load.image(AssetNames.missile, 'assets/img/Rocket.png');
        GamePublicParts.game.load.image(AssetNames.turret, 'assets/img/Turret.png');
        //Loading enemy ships
        GamePublicParts.game.load.image(AssetNames.enemy, 'assets/img/SmallEnemyShip.png');
        GamePublicParts.game.load.image(AssetNames.enemySecondLevel, 'assets/img/SmallSecondEnemy.png');
        GamePublicParts.game.load.image(AssetNames.enemyThirdLevel, 'assets/img/ThirdEnemyShip.png');
        GamePublicParts.game.load.image(AssetNames.boss, 'assets/img/Boss.png');
        //Loading Bonus images
        GamePublicParts.game.load.image(AssetNames.rapid, 'assets/img/Rapid.png');
        GamePublicParts.game.load.image(AssetNames.healthUp, 'assets/img/health.png');
        GamePublicParts.game.load.image(AssetNames.blaster, 'assets/img/Blaster.png');
        GamePublicParts.game.load.image(AssetNames.bomb, 'assets/img/bomb.png');
        //Loading sprite animation
        GamePublicParts.game.load.spritesheet(AssetNames.explosion, 'assets/img/explosionAnimation.png', 256, 256);
        GamePublicParts.game.load.spritesheet(AssetNames.smallExplosion, 'assets/img/hitAnimation.png', 50, 50, 74);
        //GamePublicParts.game.load.spritesheet(AssetNames.gameStartButton, 'assets/img/GreenButtonSpriteSheet.png', 190, 49);
        GamePublicParts.game.load.spritesheet(AssetNames.gameButton, 'assets/img/BigGreenButtonSpriteSheet.png', 302, 78);
        //Audio
        GamePublicParts.game.load.audio(AssetNames.audioBlaster, 'assets/audio/blaster.mp3');
        GamePublicParts.game.load.audio(AssetNames.audioExplosion, 'assets/audio/explosion.mp3');
        GamePublicParts.game.load.audio(AssetNames.audioPlayerDeath, 'assets/audio/player_death.wav');
        GamePublicParts.game.load.audio(AssetNames.audioPickUp, 'assets/audio/key.wav');
        GamePublicParts.game.load.audio(AssetNames.audioIntro, 'assets/audio/Terminator.mp3');
    };

    const _spaceShooterCreate = function() {

        _createGroups();
        _createLevels();
        _createInterface();

        _background = GamePublicParts.game.add.tileSprite(0, 0, 900, 700, AssetNames.gameBackground, null, GamePublicParts.BackgroundLayer);

        //Object for drawing simple graphics (lines, rectangles, circles)
        GamePublicParts.graphics = GamePublicParts.game.add.graphics(0, 0);

        GamePublicParts.game.physics.startSystem(Phaser.Physics.ARCADE);

        GamePublicParts.PlayerSpaceship = new Player(GamePublicParts.game, 0, 0, AssetNames.playerShip);
        GamePublicParts.GameObjectsLayer.add(GamePublicParts.PlayerSpaceship);
        GamePublicParts.PlayerSpaceship.kill();

        GamePublicParts.game.paused = true;

        GamePublicParts.blaster = GamePublicParts.game.add.audio(AssetNames.audioBlaster);
        GamePublicParts.explosion = GamePublicParts.game.add.audio(AssetNames.audioExplosion);
        GamePublicParts.playerDeath = GamePublicParts.game.add.audio(AssetNames.audioPlayerDeath);
        GamePublicParts.pickUp = GamePublicParts.game.add.audio(AssetNames.audioPickUp);
        GamePublicParts.Terminator = GamePublicParts.game.add.audio(AssetNames.audioIntro);

    };

    const _createGroups = function() {
        //i created groups  instead of z index (First added group has lowest z-index)
        GamePublicParts.BackgroundLayer = GamePublicParts.game.add.group();
        GamePublicParts.PlayerBullets = GamePublicParts.game.add.group();
        GamePublicParts.GameObjectsLayer = GamePublicParts.game.add.group();
        GamePublicParts.Enemies = GamePublicParts.game.add.group();
        GamePublicParts.Turrets = GamePublicParts.game.add.group();
        GamePublicParts.EnemyBullets = GamePublicParts.game.add.group();
        GamePublicParts.Effects = GamePublicParts.game.add.group();
        GamePublicParts.aliens = GamePublicParts.game.add.group();
        GamePublicParts.InterfaceLayer = GamePublicParts.game.add.group();

        GamePublicParts.game.physics.arcade.enable(GamePublicParts.PlayerBullets);
    };

    const _createInterface = function() {
        _createInfoPanels();
        //Button test (with text)
        let gameStartButton = new Pseudo3DButton('Play', GameTextStyles.buttonsOut, GameTextStyles.buttonsOver,
            6, GamePublicParts.game, 0, 0, AssetNames.gameButton,
            function() {
                gameStartButton.inputEnabled = false;
                _startNewGame();
                console.log('Start button was pressed!'); //onComplete
                let buttonFadeTween = GamePublicParts.game.add.tween(gameStartButton).to({
                    alpha: 0
                }, 2000, "Linear", true);
                buttonFadeTween.onComplete.add(function() {
                    gameStartButton.kill();
                    console.log('Start button was killed!');
                });
            }, this, 2, 1, 0);
        gameStartButton.anchor.x = 0.5;
        gameStartButton.anchor.y = 0.5;
        gameStartButton.x = GamePublicParts.game.width / 2;
        gameStartButton.y = GamePublicParts.game.height / 2;
        GamePublicParts.InterfaceLayer.add(gameStartButton);
    };

    const _createInfoPanels = function() {
        GamePublicParts.LevelsIndicator = GamePublicParts.game.add.text(0, 5, GameTexts.levelInfo + '\n' + 1 +
            '/' + _levels.length, GameTextStyles.infoPanels, GamePublicParts.InterfaceLayer);
        GamePublicParts.LevelsIndicator.x = GamePublicParts.game.width - GamePublicParts.LevelsIndicator.width - 5;


        let HPtext = GamePublicParts.game.add.text(5, GamePublicParts.game.height - 50, 'ARMOR',
            GameTextStyles.infoPanels, GamePublicParts.InterfaceLayer);
        HPtext.alpha = 0.9;

        GamePublicParts.PlayerScoreIndicator = GamePublicParts.game.add.text(5, 5, GameTexts.playerScore + '\n' + GamePublicParts.PlayerScore,
            GameTextStyles.infoPanels, GamePublicParts.InterfaceLayer);
        GamePublicParts.PlayerScoreIndicator.alpha = 0.9;

        let HealthMaxLine = GamePublicParts.InterfaceLayer.create(5, GamePublicParts.game.height - 25, AssetNames.playerHealthBar);
        HealthMaxLine.tint = GameColors.gray;
        //Opacity
        HealthMaxLine.alpha = 0.9;

        GamePublicParts.PlayerHealthIndicator = GamePublicParts.InterfaceLayer.create(5, GamePublicParts.game.height - 25, AssetNames.playerHealthBar);
        GamePublicParts.PlayerHealthIndicator.alpha = 0.9;
        GamePublicParts.PlayerHealthIndicator.tint = GameColors.green;
    };

    const _killAllGameObjects = function() {
        GamePublicParts.Enemies.forEach(function(foundObject) {
            foundObject.kill();
        });
        GamePublicParts.EnemyBullets.forEach(function(foundObject) {
            foundObject.kill();
        });
        GamePublicParts.PlayerBullets.forEach(function(foundObject) {
            foundObject.kill();
        });
        GamePublicParts.aliens.forEach(function(foundObject) {
            foundObject.kill();
        });
    };

    const _startNewGame = function() {
        _killAllGameObjects();
        _destroyDeadGameObjects();
        GamePublicParts.Terminator.play();

        //_showWinInterface();

        //turret test
        /*let TurretTest = new Phaser.Sprite(GamePublicParts.game, 200, 200, AssetNames.turret);
        TurretTest.anchor.setTo(0.5, 0.5);
        TurretTest.update = function() {
            TurretTest.angle += 0.5;
        }
        GamePublicParts.InterfaceLayer.add(TurretTest);*/

        GamePublicParts.PlayerHealthIndicator.tint = GameColors.green;
        GamePublicParts.PlayerHealthIndicator.scale.setTo(1, 1);
        GamePublicParts.PlayerScore = 0;
        GamePublicParts.PlayerScoreIndicator.setText(GameTexts.playerScore + '\n' + 0);
        GamePublicParts.LevelsIndicator.setText(GameTexts.levelInfo + '\n' + 1 + '/' + _levels.length);

        let ShipStartXPosition = (GamePublicParts.game.width / 2);
        let ShipStartYPosition = GamePublicParts.game.height - (GamePublicParts.game.cache.getImage(AssetNames.playerShip).height / 2);
        GamePublicParts.PlayerSpaceship.reset(ShipStartXPosition, ShipStartYPosition);
        GamePublicParts.PlayerSpaceship.hitPoints = GamePublicParts.PlayerSpaceship.maxHitPoints;
        GamePublicParts.PlayerSpaceship.BulletPauseTime = GamePublicParts.PlayerSpaceship.maxBulletPauseTime;

        _enemiesLeft = _levels[0].amountOfEnemies;
        _levels[0].action();
        _nextLevelIndex = 1;

        _createBonuses();

        GamePublicParts.game.paused = false;
    };

    const _createBonuses = function() {
        // creating Bonus
        var kindOfBonus = {
            Blaster: () => {
                console.log('1');
                return 'Blaster';
            },
            HealthUp: () => {
                console.log('2');
                return 'HealthUp';
            },
            Rapid: () => {
                console.log('3');
                return 'Rapid';
            },
            Bomb: () => {
                console.log('4');
                return 'Bomb';
            },
        };

        var arrBonus = [kindOfBonus.Blaster, kindOfBonus.HealthUp, kindOfBonus.Rapid, kindOfBonus.Bomb];

        var createBonus = function() {
            let randomBonus = Math.ceil(Math.random() * ((arrBonus.length - 1) + 1));
            GamePublicParts.PicName = (arrBonus[randomBonus - 1])();
        };

        var createNewBonus = function() {
            createBonus();
            //GamePublicParts.aliens = GamePublicParts.game.add.group();
            //GamePublicParts.aliens.enableBody = true;
            var temp = Math.random() * 600;
            GamePublicParts.alien = GamePublicParts.aliens.create(temp + 100, 0, GamePublicParts.PicName);
            GamePublicParts.game.physics.arcade.enable(GamePublicParts.alien);
            GamePublicParts.alien.body.collideWorldBounds = false;
            GamePublicParts.alien.body.gravity.x = GamePublicParts.game.rnd.integerInRange(-70, 70);
            GamePublicParts.alien.checkWorldBounds = true;
            GamePublicParts.alien.body.velocity.y = 250;
        };
        GamePublicParts.game.time.events.repeat(Phaser.Timer.SECOND * 2.7, 100, createNewBonus, this);
    };

    const _createLevels = function() {
        _levels.push({
            amountOfEnemies: 3,
            action: function() {
                //GamePublicParts.game.time.events.add(4000, GameHelpers.createSuperEnemyShip, null);
                GamePublicParts.game.time.events.add(4000, GameHelpers.createEnemyShip, null, 50, 100);
                GamePublicParts.game.time.events.add(5000, GameHelpers.createEnemyShip, null, 350, 100);
                GamePublicParts.game.time.events.add(6000, GameHelpers.createEnemyShip, null, 650, 100);
            }
        });
        _levels.push({
            amountOfEnemies: 3,
            action: function() {
                GamePublicParts.game.time.events.add(4000, GameHelpers.createSecondLevelEnemyShip, null);
                GamePublicParts.game.time.events.add(5000, GameHelpers.createSecondLevelEnemyShip, null);
                GamePublicParts.game.time.events.add(6000, GameHelpers.createSecondLevelEnemyShip, null);
            }
        });
        _levels.push({
            amountOfEnemies: 3,
            action: function() {
                GamePublicParts.game.time.events.add(4000, GameHelpers.createThirdLevelEnemyShip, null);
                GamePublicParts.game.time.events.add(5000, GameHelpers.createThirdLevelEnemyShip, null);
                GamePublicParts.game.time.events.add(6000, GameHelpers.createThirdLevelEnemyShip, null);
            }
        });
        _levels.push({
            amountOfEnemies: 1,
            action: function() {
                GamePublicParts.game.time.events.add(4000, GameHelpers.createSuperEnemyShip, null);
            }
        });
    };

    const _destroyDeadGameObjects = function() {
        //We need kill object first, because only then we can safely destroy object (without errors)
        GamePublicParts.Enemies.forEachDead((FoundDeadObject) => {
            FoundDeadObject.destroy();
        });

        GamePublicParts.PlayerBullets.forEachDead((FoundDeadObject) => {
            FoundDeadObject.destroy();
        });

        GamePublicParts.EnemyBullets.forEachDead((FoundDeadObject) => {
            FoundDeadObject.destroy();
        });

        GamePublicParts.InterfaceLayer.forEachDead((FoundDeadObject) => {
            FoundDeadObject.destroy();
        });

        GamePublicParts.aliens.forEachDead((FoundDeadObject) => {
            FoundDeadObject.destroy();
        });

        GamePublicParts.Turrets.forEachDead((FoundDeadObject) => {
            FoundDeadObject.destroy();
        });
    };

    const _showEndGameMessage = function(messageText, messageTextStyle, buttonText) {
        GameHelpers.neutralizeAllBullets();
        let gameEndText = GamePublicParts.game.make.text(GamePublicParts.game.width / 2,
            GamePublicParts.game.height / 2, messageText, messageTextStyle);
        gameEndText.anchor.setTo(0.5, 0.5);
        gameEndText.alpha = 0;
        GamePublicParts.InterfaceLayer.add(gameEndText);
        let textAppearanceTween = GamePublicParts.game.add.tween(gameEndText).to({
            alpha: 1
        }, 5000, "Linear", true);
        textAppearanceTween.onComplete.add(function() {
            let gameRestartButton = new Pseudo3DButton(buttonText, GameTextStyles.buttonsOut, GameTextStyles.buttonsOver,
                6, GamePublicParts.game, GamePublicParts.game.width / 2, 0, AssetNames.gameButton,
                function() {
                    gameRestartButton.inputEnabled = false;
                    _startNewGame();
                    console.log('Restart button was pressed!'); //onComplete
                    let buttonFadeTween = GamePublicParts.game.add.tween(gameRestartButton).to({
                        alpha: 0
                    }, 2000, "Linear", true);
                    buttonFadeTween.onComplete.add(function() {
                        gameRestartButton.kill();
                        console.log('Restart button was killed!');
                    });
                    let textFadeTween = GamePublicParts.game.add.tween(gameEndText).to({
                        alpha: 0
                    }, 2000, "Linear", true);
                    textFadeTween.onComplete.add(function() {
                        gameEndText.kill();
                        console.log('gameEndText was killed!');
                    });
                }, this, 2, 1, 0);
            gameRestartButton.anchor.setTo(0.5, 0.5);
            gameRestartButton.y = gameEndText.y + (gameEndText.height / 2) + (gameRestartButton.height / 2);
            GamePublicParts.InterfaceLayer.add(gameRestartButton);
        });
    };

    const _spaceShooterUpdate = function() {
        _actionIfPlayerHitEnemy();
        _actionIfEnemiesHitPlayer();
        // dynamic background
        _background.tilePosition.y += 1;
        //Bonus
        _actionIfPlayerCanTakeBonus();

        _destroyDeadGameObjects();

        if (!GamePublicParts.Terminator.isPlaying) {
            GamePublicParts.Terminator.play();
        };
    };

    const _actionIfPlayerHitEnemy = function() {
        //SpaceShooterGame.Player.update();
        //Overlap check
        GamePublicParts.game.physics.arcade.overlap(GamePublicParts.Enemies, GamePublicParts.PlayerBullets, (Enemy, PlayerBulet) => {
            console.log(PlayerBulet.damage);
            Enemy.hp -= PlayerBulet.damage;
            if (Enemy.hp > 0) {
                GamePublicParts.explosion.play();
            }
            if (Enemy.hp <= 0 && -Enemy.hp < PlayerBulet.damage) {
                GamePublicParts.playerDeath.play();
                //destroy animation
                if (Enemy instanceof SuperEnemy) {
                    GameHelpers.explodeObject(Enemy, AssetNames.explosion, AnimationNames.explosion, 1, 1);
                } else {
                    GameHelpers.explodeObject(Enemy, AssetNames.explosion, AnimationNames.explosion);
                }
                GamePublicParts.PlayerScore += 10;
                GamePublicParts.PlayerScoreIndicator.setText(GameTexts.playerScore + '\n' + GamePublicParts.PlayerScore);
                if (GamePublicParts.PlayerSpaceship.alive) {
                    _enemiesLeft -= 1;
                    if (_enemiesLeft == 0) {
                        if (_nextLevelIndex < _levels.length) {
                            _enemiesLeft = _levels[_nextLevelIndex].amountOfEnemies;
                            _levels[_nextLevelIndex].action();
                            ++_nextLevelIndex;
                            GamePublicParts.LevelsIndicator.setText(GameTexts.levelInfo + '\n' + _nextLevelIndex +
                                '/' + _levels.length);
                            console.log('NEXT LEVEL');
                        } else {
                            GamePublicParts.game.time.events.removeAll();
                            _showEndGameMessage(GameTexts.playerWin, GameTextStyles.goodMessage, GameTexts.playAgain);
                        }
                    }
                }
            } else {
                GameHelpers.explodeObject(PlayerBulet, AssetNames.smallExplosion, AnimationNames.smallExplosion);
            }
            if (PlayerBulet.alive) {
                PlayerBulet.kill();
            }
        });
    };

    const _actionIfEnemiesHitPlayer = function() {
        GamePublicParts.game.physics.arcade.overlap(GamePublicParts.PlayerSpaceship, GamePublicParts.EnemyBullets, (Player, EnemyBullet) => {
            Player.hitPoints -= EnemyBullet.damage;
            //Changing color of health line
            let remainingPlayerHP = Player.hitPoints / Player.maxHitPoints;
            if (remainingPlayerHP < 0.7 && remainingPlayerHP >= 0.3) {
                GamePublicParts.PlayerHealthIndicator.tint = GameColors.yellow;
                GamePublicParts.explosion.play();
            } else if (remainingPlayerHP < 0.3) {
                GamePublicParts.PlayerHealthIndicator.tint = GameColors.red;
                GamePublicParts.explosion.play();
            } else if (remainingPlayerHP >= 0.7) {
                GamePublicParts.PlayerHealthIndicator.tint = GameColors.green;
                GamePublicParts.explosion.play();
            }

            if (Player.hitPoints <= 0 && -Player.hitPoints < EnemyBullet.damage) {
                //destroy animation
                GameHelpers.explodeObject(Player, AssetNames.explosion, AnimationNames.explosion);
                GamePublicParts.PlayerHealthIndicator.scale.setTo(0, 1);
                GamePublicParts.game.time.events.removeAll();
                GamePublicParts.playerDeath.play();
                //Show 'Game over' for player
                _showEndGameMessage(GameTexts.playerLost, GameTextStyles.badMessage, GameTexts.tryAgain);
            } else {
                GamePublicParts.PlayerHealthIndicator.scale.setTo(remainingPlayerHP, 1);
                GameHelpers.explodeObject(EnemyBullet, AssetNames.smallExplosion, AnimationNames.smallExplosion);
            }
            if (EnemyBullet.alive) {
                EnemyBullet.kill();
            }
        });
    };

    const _actionIfPlayerCanTakeBonus = function() {
        GamePublicParts.game.physics.arcade.overlap(GamePublicParts.PlayerSpaceship, GamePublicParts.aliens, (Player, alien) => {
            if (GamePublicParts.PicName === AssetNames.healthUp) {
                GamePublicParts.pickUp.play();
                if (Player.hitPoints === 100) {

                    console.log('MaxHP');
                } else {
                    Player.hitPoints += 10;
                    console.log('+HP');
                    console.log(Player.hitPoints);
                };
                let remainingPlayerHP = Player.hitPoints / Player.maxHitPoints;
                if (remainingPlayerHP < 0.7 && remainingPlayerHP >= 0.3) {
                    GamePublicParts.PlayerHealthIndicator.tint = GameColors.yellow;
                } else if (remainingPlayerHP < 0.3) {
                    GamePublicParts.PlayerHealthIndicator.tint = GameColors.red;
                } else if (remainingPlayerHP >= 0.7) {
                    GamePublicParts.PlayerHealthIndicator.tint = GameColors.green;

                }
                GamePublicParts.PlayerHealthIndicator.scale.setTo(remainingPlayerHP, 1);
            };
            //HealthDOWN
            if (GamePublicParts.PicName === AssetNames.bomb && Player.alive) {
                if (Player.hitPoints <= 20) {
                    Player.hitPoints = 0;
                    GamePublicParts.PlayerHealthIndicator.scale.setTo(0, 1);
                    GamePublicParts.game.time.events.removeAll();
                    GameHelpers.explodeObject(Player, AssetNames.explosion, AnimationNames.explosion);
                    console.log('dead');
                    _showEndGameMessage(GameTexts.playerLost, GameTextStyles.badMessage, GameTexts.tryAgain);
                } else {
                    Player.hitPoints -= 20;
                    GameHelpers.explodeObject(alien, AssetNames.smallExplosion, AnimationNames.smallExplosion);
                    console.log('----HP');
                    console.log(Player.hitPoints);
                };
                let remainingPlayerHP = Player.hitPoints / Player.maxHitPoints;
                if (remainingPlayerHP < 0.7 && remainingPlayerHP >= 0.3) {
                    GamePublicParts.PlayerHealthIndicator.tint = GameColors.yellow;
                    GamePublicParts.explosion.play();
                } else if (remainingPlayerHP < 0.3) {
                    GamePublicParts.PlayerHealthIndicator.tint = GameColors.red;
                    GamePublicParts.explosion.play();
                } else if (remainingPlayerHP >= 0.7) {
                    GamePublicParts.PlayerHealthIndicator.tint = GameColors.green;
                    GamePublicParts.explosion.play();
                }
                GamePublicParts.PlayerHealthIndicator.scale.setTo(remainingPlayerHP, 1);
            };
            // Blaster Mode
            if (GamePublicParts.PicName === AssetNames.blaster) {
                GamePublicParts.pickUp.play();
                if (Player.BulletPauseTime > 150) {
                    Player.BulletPauseTime -= 50;
                }
                console.log(Player.BulletPauseTime);
            };
            if (GamePublicParts.PicName === AssetNames.rapid) {
                if (Player.BulletSpeed > -200) {
                    Player.BulletSpeed -= 5;
                    console.log(Player.BulletSpeed);
                } else {
                    console.log('Max BulletSpeed');
                };
                GamePublicParts.pickUp.play();

            };
            if (GamePublicParts.alien.alive) {
                GamePublicParts.alien.kill();
            }
        });
    };

    const _levels = [];
    let _background = null;
    let _gameStarted = false;
    let _enemiesLeft = -1;
    let _nextLevelIndex = 1;
    let _gameEnded = false;

    const GamePublicParts = {
        BackgroundLayer: null,
        GameObjectsLayer: null,
        InterfaceLayer: null,
        Enemies: null,
        Turrets: null,
        PlayerBullets: null,
        EnemyBullets: null,
        Effects: null,

        aliens: null,
        alien: null,
        PicName: null,

        PlayerSpaceship: null,
        PlayerHealthIndicator: null,
        PlayerScoreIndicator: null,
        LevelsIndicator: null,
        PlayerScore: 0,

        blaster: null,
        explosion: null,
        playerDeath: null,
        pickUp: null,
        Terminator: null,

        Initialize: function() {
            this.game = new Phaser.Game(900, 700, Phaser.CANVAS, 'article_for_game', {
                preload: _spaceShooterPreload,
                create: _spaceShooterCreate,
                update: _spaceShooterUpdate
            });
            //this.graphics = new Phaser.Graphics(this.game, 0, 0);
            //console.log(this.graphics);
        },
    };
    return GamePublicParts;
}();

const GameHelpers = {
    createEnemyShip: function(xPosition, yPosition) {
        let newPathPoints = {
            x: [xPosition, xPosition + 100, xPosition + 200, xPosition, xPosition + 200, xPosition],
            y: [yPosition, yPosition + 100, yPosition, yPosition + 100, yPosition + 100, yPosition]
        };
        let NewEnemy = new FirstLevelEnemy(15, SpaceShooterGame.game, xPosition, yPosition, AssetNames.enemy, newPathPoints, 400);
        SpaceShooterGame.Enemies.add(NewEnemy);
        console.log(NewEnemy);
    },

    createSecondLevelEnemyShip: function() {
        let xPosition = 25;
        let yPosition = 200;
        let newPathPoints = {
            x: [xPosition, xPosition + 150, xPosition + 300, xPosition + 450, xPosition + 600, xPosition + 750, xPosition + 850,
                xPosition + 750, xPosition + 600, xPosition + 450, xPosition + 300, xPosition + 150, xPosition
            ],
            y: [yPosition, yPosition - 150, yPosition, yPosition - 150, yPosition, yPosition - 150, yPosition,
                yPosition + 150, yPosition, yPosition + 150, yPosition, yPosition + 150, yPosition
            ]
        };
        let NewEnemy = new SecondLevelEnemy(15, SpaceShooterGame.game, xPosition, yPosition, AssetNames.enemySecondLevel, newPathPoints, 800);
        SpaceShooterGame.Enemies.add(NewEnemy);
        console.log(NewEnemy);
    },

    createThirdLevelEnemyShip: function() {
        let xPosition = 450;
        let yPosition = 25;
        let newPathPoints = {
            x: [xPosition, xPosition + 425, xPosition, xPosition + 200, xPosition - 200, xPosition,
                xPosition - 425, xPosition, xPosition - 200, xPosition + 200, xPosition
            ],
            y: [yPosition, yPosition + 150, yPosition + 300, yPosition + 150, yPosition + 150, yPosition + 300,
                yPosition + 150, yPosition, yPosition + 150, yPosition + 150, yPosition
            ]
        };
        let NewEnemy = new ThirdLevelEnemy(30, SpaceShooterGame.game, xPosition, yPosition, AssetNames.enemyThirdLevel, newPathPoints, 1200);
        SpaceShooterGame.Enemies.add(NewEnemy);
        console.log(NewEnemy);
    },

    createSuperEnemyShip: function() {
        let xPosition = 450;
        let yPosition = 120;
        let newPathPoints = {
            x: [xPosition, xPosition + 200, xPosition - 200, xPosition, xPosition + 300, xPosition,
                xPosition - 300, xPosition, xPosition + 300, xPosition, xPosition - 300, xPosition
            ],
            y: [yPosition, yPosition + 200, yPosition + 200, yPosition, yPosition, yPosition + 200,
                yPosition, yPosition, yPosition + 100, yPosition + 200, yPosition + 100, yPosition
            ]
        };
        let NewEnemy = new SuperEnemy(200, SpaceShooterGame.game, xPosition, yPosition, AssetNames.boss, newPathPoints, 1200);
        SpaceShooterGame.Enemies.add(NewEnemy);
        console.log(NewEnemy);
    },

    neutralizeAllBullets: function() {
        SpaceShooterGame.PlayerBullets.forEach(function(foundBullet) {
            foundBullet.damage = 0;
        });

        SpaceShooterGame.EnemyBullets.forEach(function(foundBullet) {
            foundBullet.damage = 0;
        });
    },

    explodeObject: function(objectToExplode, spritesheetName, animationName, scaleX = 0.5, scaleY = 0.5) {
        if (objectToExplode.alive) {
            let explosion = SpaceShooterGame.Effects.create(0, 0, spritesheetName);
            explosion.anchor.x = 0.5;
            explosion.anchor.y = 0.5;
            explosion.x = objectToExplode.x;
            explosion.y = objectToExplode.y;
            let explosionAnimation = explosion.animations.add(animationName);
            explosion.scale.setTo(scaleX, scaleY);
            console.log(explosionAnimation);
            explosionAnimation.onComplete.add(() => {
                explosion.destroy();
                console.log('Animation finished');
            });
            explosion.animations.play(animationName, 24, false);
            objectToExplode.kill();
        }
    },

    destroyObject: function(gameObject) {
        gameObject.destroy();
        console.log('Object was destroyed');
    },
}

const AssetNames = {
    enemy: 'Enemy',
    enemySecondLevel: 'EnemySecondLevel',
    enemyThirdLevel: 'EnemyThirdLevel',
    boss: "Boss",

    explosion: 'Explosion',
    smallExplosion: 'SmallExplosion',
    playerShip: 'PlayerSpaceship',
    playerHealthBar: 'PlayerHealthBar',
    playerBullet: 'PlayerBullet',
    blueEnemyBullet: 'BlueEnemyBullet',
    orangeEnemyBullet: 'OrangeEnemyBullet',
    gameBackground: 'Background',
    gameButton: 'gameButton',
    missile: 'Missile',
    orangeParticle: 'OrangeEnemyBullet',
    turret: "Turret",

    rapid: 'Rapid',
    blaster: 'Blaster',
    healthUp: 'HealthUp',
    bomb: 'Bomb',

    audioBlaster: 'playerBlaster',
    audioExplosion: 'audioExplosion',
    audioPlayerDeath: 'playerDeath',
    audioPickUp: 'pickUp',
    audioIntro: 'Terminator',
}

const AnimationNames = {
    explosion: 'explosion',
    smallExplosion: 'smallExplosion',
}

const GameColors = {
    green: 0x40FF00,
    gray: 0xD8D8D8,
    yellow: 0xFFFF00,
    red: 0xFF0000
}

const GameTexts = {
    playerScore: 'SCORE',
    levelInfo: 'LEVEL',
    playerLost: 'Game over',
    playerWin: 'You win!',
    playAgain: 'Play again',
    tryAgain: 'Retry',
}

const GameTextStyles = {
    infoPanels: {
        font: '20px',
        fill: '#40FF00',
        align: 'center',
        fontWeight: 'bold',
        backgroundColor: 'transparent',
    },
    buttonsOut: {
        font: '40px Arial',
        fill: '#F4FA58',
        align: 'center',
        fontWeight: 'bold',
        backgroundColor: 'transparent'
    },
    buttonsOver: {
        font: '50px Arial',
        fill: '#EF2A47',
        align: 'center',
        fontWeight: 'bold',
        backgroundColor: 'transparent'
    },
    badMessage: {
        font: '100px Arial',
        fill: '#FF0000',
        align: 'center',
        fontWeight: 'bold',
        backgroundColor: 'transparent'
    },
    goodMessage: {
        font: '100px Arial',
        fill: '#00FF00',
        align: 'center',
        fontWeight: 'bold',
        backgroundColor: 'transparent'
    }
}

window.onload = function() {
    SpaceShooterGame.Initialize();
};
