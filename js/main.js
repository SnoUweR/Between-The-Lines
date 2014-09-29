// "Дизайн" данного кода основан на коде игры Flappy Bird из этой статьи http://habrahabr.ru/post/214013/

(function() {
    var gameInitialize = function gameInitialize() {

        ///////////////////
        //GAME CONSTANTS //
        ///////////////////

        var CANVAS_WIDTH = window.innerWidth || document.documentElement.clientWidth ||
                document.getElementsByTagName('body')[0].clientWidth;
        var CANVAS_HEIGHT = window.innerHeight || document.documentElement.clientHeight ||
                document.getElementsByTagName('body')[0].clientHeight;

        if (CANVAS_WIDTH > 720) {
        //    CANVAS_WIDTH = 720;
        }

        if (CANVAS_HEIGHT > 640) {
        //    CANVAS_HEIGHT = 640;
        }

        document.getElementById('game').style.width = CANVAS_WIDTH + "px";
        document.getElementById('game').style.height = CANVAS_HEIGHT + "px";

        var STARTING_SPEED = 500,
            PADDLES_MAX_INTERVAL = 100,
            PADDLES_MIN_INTERVAL = 25,
            PADDLES_FROM_START_INTERVAL = 50,
            PADDLES_FROM_END_INTERVAL = CANVAS_WIDTH - 105,
            BALL_START_POSITION_X = 25,
            BALL_START_POSITION_Y = CANVAS_HEIGHT / 2;
            TITLE_TEXT = "BETWEEN THE LINES",
            INSTRUCTIONS_TEXT = "CLICK WHEN RED LINE IS BETWEEN THE GREEN LINES",
            HIGHSCORE_TITLE = "HIGHSCORES",
            HIGHSCORE_SUBMIT = "POST SCORE",
            DEVELOPER_COPYRIGHT_TEXT = "Developer\nVladislav Kovalev\nsnouwer@gmail.com",
            LOADING_TEXT = "LOADING...",
            GOOD_TEXT = ["AWESOME", "INCREDIBLE", "UNBELIEVABLE", "NICE", "COOL", "GREAT", "BEAUTIFUL"];

        var GameTypeEnum = {
            CLASSIC: 1,
            HARDCORE: 2,
            properties: {
                1: {name: 'Classic Mode', value: 0},
                2: {name: 'Hardcore Mode', value: 1}
            }
        }, gameType;

        var MusicList = ['music', 'musicKimono', 'musicNights'];

        /////////////////////////////////////////////
        //HELPER VARIABLES FOR SAVING GAME-OBJECTS //
        /////////////////////////////////////////////

        var redLine, paddleOne, paddleTwo, rectangleBetween;
        var gameScore = 0, comboCount = 0;
        var isStarted,  isScorePosted, isSoundEnabled = true;
        var background;
        var goodSnd, badSnd, gameMusic, introMusic, selectSnd;
        var Leaderboard;
        var emitter;
        var  TitleText, InstructionsText, DeveloperCopyrightText, ScoreText, HighScoreTitleText, HighScoreText,
            PostScoreText, LoadingText, PostScoreClickArea;
        var comboText, comboBounce;
        var goodText, goodBounce;
        var toogleSoundButton;
        var blackSquare;

        /////////////////////////////////////
        //VARIABLES FOR SAVING GAME-STATES //
        /////////////////////////////////////

        var gameState = new Phaser.State();
        var BootgameState = new Phaser.State();
        var PreloadergameState = new Phaser.State();
        var gameOverState = new Phaser.State();
        var MainMenuState = new Phaser.State();
        var ChooseSkinState = new Phaser.State();

        /////////////////////
        //HELPER FUNCTIONS //
        /////////////////////

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function loadAssets() {

            game.load.image('starfield', './img/starfield.jpg');
            game.load.image('enemy', './img/enemy.png');
            game.load.image('particle', './img/particle.png');
            game.load.image('blackSquare', './img/black.png');
            game.load.image('player', './img/player.png');
            game.load.audio('good', './sounds/good.wav');
            game.load.audio('bad', './sounds/bad.wav');

            // Don't forget to add new music to MusicList array
            game.load.audio('music', './sounds/musicTrimmed.ogg');
            game.load.audio('musicNights', './sounds/musicNights.ogg');
            game.load.audio('musicKimono', './sounds/musicKimono.ogg');

            game.load.audio('intro', './sounds/intro.ogg');
            game.load.audio('select', './sounds/select.wav');
            game.load.bitmapFont('carrier_command', './fonts/carrier_command.png',
                './fonts/carrier_command.xml');
            game.load.spritesheet('soundButton', './img/soundBtn.png', 32, 32);

        }

        function addScore() {
            comboCount++;
            if (comboCount > 1)
            {
                comboText.alpha = 100;
                comboText.x = redLine.position.x;
                comboText.y = redLine.position.y;
                comboText.setText("COMBO X" + comboCount);
                comboBounce.to({ y: CANVAS_HEIGHT, alpha: 0 }, 2000, Phaser.Easing.Linear.None);
                comboBounce.onComplete.add(function() {comboText.setText("");}, this);
                comboBounce.start();
                gameScore += (100 - (paddleTwo.position.x - paddleOne.position.x)) * comboCount;
            }

            gameScore += 100 - (paddleTwo.position.x - paddleOne.position.x)

            ScoreText.setText(gameScore);
        }

        function isLocalStorageAvailable() {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        }

        function showText() {
            goodText.alpha = 100;
            goodText.x = redLine.position.x;
            goodText.y = redLine.position.y;
            goodText.setText(GOOD_TEXT[getRandomInt(0, 6)]);
            goodBounce.to({ y: 0, alpha: 0 }, 2000, Phaser.Easing.Linear.None);
            goodBounce.onComplete.add(function() {goodText.setText("");}, this);
            goodBounce.start();
        }

        function postScore() {
            if (Leaderboard) {
                Leaderboard.post({
                    score: gameScore
                }, function () {
                    HighScoreText.setText(LOADING_TEXT);
                    getScore();
                });
            } else {
                HighScoreText.setText('Some error occured');
            }
        }

        function toogleSound() {
            console.log('sadasd');
            if (isSoundEnabled) {
                toogleSoundButton.setFrames(1, 1, 0);
                gameMusic.stop();
                introMusic.stop();
                isSoundEnabled = false;
            } else {

                toogleSoundButton.setFrames(0, 0, 1);
                isSoundEnabled = true;
                selectSnd.play();
                if (game.state.current == 'gameState') {
                    gameMusic.play();
                }
                else if (game.state.current == 'MainMenu') {
                    introMusic.play();
                }
            }
        }

        ////////////////////////////////////////////
        //State - Bootgame (Loading text appears) //
        ////////////////////////////////////////////
        BootgameState = function(game) {
            this.create = function () {
                LoadingText = game.add.text(game.world.width / 2, game.world.height / 2, "LOADING...", {
                    fill: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 3,
                    align: 'center'
                });
                LoadingText.anchor.setTo(0.5, 0.5);

                game.state.start('Preloader', false, false);
            };
        };

        //////////////////////////////////////
        //State - Preloader (Loading Assets)//
        //////////////////////////////////////
        PreloadergameState = function(game) {
            this.preload = function () {
                loadAssets();
            };

            this.create = function () {
                var tween = game.add.tween(LoadingText).to({
                    alpha: 0
                }, 1000, Phaser.Easing.Linear.None, true);

                tween.onComplete.add(function () {
                    game.state.start('MainMenu', false, false);
                }, this);
            };

            this.shutdown = function () {
                LoadingText.destroy();
            }
        };

        //////////////////////
        //State - Main Menu //
        //////////////////////

        var hardModeLabel, classicModeLabel, chooseSkinLabel;
        MainMenuState = function(game) {
            this.create = function () {
                createBackground();
                createTexts();
                createSounds();

                background.events.onInputDown.add(classicClicked);
                classicModeLabel = game.add.text(game.world.width / 2, game.world.height - game.world.height / 2, "Classic Mode", {
                    font: '12px "Press Start 2P"',
                    fill: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 2,
                    align: 'center'
                });
                hardModeLabel = game.add.text(game.world.width / 2, classicModeLabel.y + 32, "Hardcore Mode", {
                    font: '12px "Press Start 2P"',
                    fill: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 2,
                    align: 'center'
                });
                chooseSkinLabel = game.add.text(game.world.width / 2, hardModeLabel.y + 32, "Choose Skin", {
                    font: '12px "Press Start 2P"',
                    fill: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 2,
                    align: 'center'
                });

                classicModeLabel.anchor.set(0.5, 0.5);
                hardModeLabel.anchor.set(0.5, 0.5);
                chooseSkinLabel.anchor.set(0.5, 0.5);

                // and again, I think there is more right way to do this
                classicModeLabel.inputEnabled = true;
                classicModeLabel.events.onInputOver.add(over, this);
                classicModeLabel.events.onInputOut.add(out, this);
                classicModeLabel.events.onInputDown.add(classicClicked);

                hardModeLabel.inputEnabled = true;
                hardModeLabel.events.onInputOver.add(over, this);
                hardModeLabel.events.onInputOut.add(out, this);
                hardModeLabel.events.onInputDown.add(hardcoreClicked);

                chooseSkinLabel.inputEnabled = true;
                chooseSkinLabel.events.onInputOver.add(over, this);
                chooseSkinLabel.events.onInputOut.add(out, this);
                chooseSkinLabel.events.onInputDown.add(chooseSkinClicked);


                function over(object) {
                    object.alpha = 0.5;
                }

                function out(object) {
                    object.alpha = 1;
                }

                isScorePosted = false;
                gameScore = 0;
                comboCount = 0;
                TitleText.setText(TITLE_TEXT);
                DeveloperCopyrightText.setText(DEVELOPER_COPYRIGHT_TEXT);
                InstructionsText.setText(INSTRUCTIONS_TEXT);

                introMusic.stop();
                if (isSoundEnabled) introMusic.play();
            };

            this.shutdown = function () {
                background.events.onInputDown.remove(classicClicked);
                TitleText.setText("");
                DeveloperCopyrightText.setText("");
                InstructionsText.setText("");

                hardModeLabel.destroy();
                classicModeLabel.destroy();
                chooseSkinLabel.destroy();
            };

            function classicClicked() {
                gameType = GameTypeEnum.CLASSIC;
                click('gameState');
            }

            function hardcoreClicked() {
                gameType = GameTypeEnum.HARDCORE;
                click('gameState');
            }

            function click(stateName) {
                introMusic.stop();
                background.events.onInputDown.remove(click);
                game.state.start(stateName, false, false);
            }


            function chooseSkinClicked() {
                click('chooseSkin');
            }
        };
        /////////////////////////////////////
        //game state - Where game is going //
        /////////////////////////////////////
        gameState = function(game) {
            this.create = function () {
                game.physics.startSystem(Phaser.Physics.ARCADE);

                createPaddles();
                createRedLine();

                background.events.onInputDown.add(clicked, this);

                emitter = game.add.emitter(0, 0, 100);
                emitter.makeParticles('particle');
                emitter.gravity = 200;

                startGame();


                ScoreText.setText(gameScore);
                comboBounce = game.add.tween(comboText);
                goodBounce = game.add.tween(goodText);
                gameMusic.stop();
                if (isSoundEnabled) gameMusic.play();
            };


            this.update = function () {
                if (redLine.body.blocked.left || redLine.body.blocked.right)
                {
                    comboCount = 0;
                }
            };

            this.shutdown = function () {
                // I think there is more good way to do this
                background.events.onInputDown.remove(clicked);
                gameMusic.stop();
                introMusic.destroy();
                goodSnd.destroy();
                badSnd.destroy();
                selectSnd.destroy();

                introMusic = null;
                goodSnd    = null;
                badSnd     = null;
                selectSnd  = null;

                gameMusic.destroy();
                gameMusic  = null;
                redLine.destroy();
                redLine = null;
                paddleOne.kill();
                paddleTwo.kill();
                paddleOne.destroy();
                paddleTwo.destroy();
                paddleOne = null;
                paddleTwo = null;
                goodText.setText("");
                goodText = null;
                goodBounce.onComplete.removeAll();
                goodBounce.stop();
                goodBounce = null;
                comboText.setText("");
                comboText = null;
                comboBounce.onComplete.removeAll();
                comboBounce.stop();
                comboBounce = null;
            };

            function clicked() {
                if (isStarted) {
                    if (Phaser.Rectangle.intersects(rectangleBetween, redLine.body)) {
                        if (isSoundEnabled) goodSnd.play();
                        createPaddles();

                        switch (gameType) {
                            case GameTypeEnum.CLASSIC:
                                redLine.body.velocity.x = Math.abs(redLine.body.velocity.x) + 25;
                                if (paddleOne.position.x - redLine.position.x < 0)
                                {
                                    redLine.body.velocity.x = Math.abs(redLine.body.velocity.x) * -1;
                                }
                                break;
                            case GameTypeEnum.HARDCORE:
                                redLineMovingRepeat = game.time.events.repeat(25, 80, function() {
                                    redLine.body.velocity.y = Math.sin(game.time.now) * 1000;
                                }, this);
                                break;
                        }

                        addScore();
                        showText();
                        createBlackSqr();
                        emitter.x = redLine.position.x;
                        emitter.y = redLine.position.y;
                        emitter.start(true, 2000, null, 25);
                    }
                    else {
                        if (isSoundEnabled) badSnd.play();
                        redLine.body.velocity.setTo(0, 0);
                        background.events.onInputDown.remove(clicked);
                        //setTimeout(function () {
                            game.state.start('gameOver', false, false);
                        //}, 500);
                    }
                }
            }


            function startGame(){
                if (!isStarted) {
                    switch (gameType) {
                        case GameTypeEnum.CLASSIC:
                            redLine.position.x = 25;
                            redLine.position.y = game.world.centerY;
                            redLine.body.velocity.x = STARTING_SPEED;
                            break;
                        case GameTypeEnum.HARDCORE:
                            redLine.position.x = 25;
                            redLine.position.y = game.world.centerY;
                            redLine.body.velocity.x = STARTING_SPEED;
                            redLineMovingRepeat = game.time.events.repeat(25, 80, function () {
                                redLine.body.velocity.y = Math.sin(game.time.now) * 1000;
                            }, this);
                            break;
                    }
                    createPaddles();
                    isStarted = true;
                }
            }
        };

        //////////////////////////////////
        //State which show on game Over //
        //////////////////////////////////
        gameOverState = function(game) {
            this.create = function () {
                isStarted = false;
                getScore();

                //setTimeout(function () {
                background.events.onInputDown.add(HighScoreStateClick, this);
                // }, 1000);

                ScoreText.setText("YOUR SCORE: " + gameScore);

                if (isLocalStorageAvailable())
                {
                    if (!localStorage.getItem('maxScore') || gameScore > localStorage.getItem('maxScore'))
                    {
                        localStorage.setItem('maxScore', gameScore);
                    }
                }

                PostScoreText.setText(HIGHSCORE_SUBMIT);
                HighScoreTitleText.setText(HIGHSCORE_TITLE);
                HighScoreText.setText(LOADING_TEXT);
            };

            this.shutdown = function() {
                ScoreText.setText("");
                PostScoreText.setText("");
                HighScoreTitleText.setText("");
                HighScoreText.setText("");
                background.destroy();
                background = null;
            };
        };

        //////////////////////////////////
        //        State with skins      //
        //////////////////////////////////
        ChooseSkinState = function(game) {
            this.create = function () {
                TitleText.setText("Choose Skin For Your 'Palka'");

                if (isLocalStorageAvailable())
                {
                    if (localStorage.getItem('maxScore'))
                    {
                        ScoreText.setText("Max Score: " + localStorage.getItem('maxScore'));
                    }
                    else
                    {
                        ScoreText.setText("No Score Yet");
                    }
                }
                else
                {
                    ScoreText.setText("Your Browser Doesn't Support StorageAPI");
                }

                background.events.onInputDown.add(clicked);
            };

            this.shutdown = function() {
                ScoreText.setText("");
                TitleText.setText("");
                background.events.onInputDown.remove(clicked);
            };

            function clicked() {
                game.state.start('MainMenu', false, false);
            }
        };

        function getScore() {
            if (Leaderboard) {
                Leaderboard.fetch({
                    sort: 'desc',
                    best: true,
                    limit: 5
                }, function (results) {
                    if (game.state.current == 'gameOver') {
                        var text = "";
                        for (var i in results) {
                            if (results.hasOwnProperty(i)) {
                                text += results[i].rank + '. ' + results[i].name + ' ' + results[i].score + '\n\n';
                            }
                        }
                        HighScoreText.setText(text);
                    }
                });
            } else {
                HighScoreText.setText('Some error occured');
            }
        }

        function HighScoreStateClick() {
            if (game.state.current == 'gameOver'
                && Phaser.Rectangle.contains(PostScoreClickArea, game.input.x, game.input.y) && !isScorePosted) {
                postScore();
                isScorePosted = true;
                PostScoreText.setText("");
                comboText.setText("");
            } else {
                game.input.onDown.remove(HighScoreStateClick);
                game.state.start('MainMenu', false, false);
            }
        }

        function createTexts() {
            if (TitleText) TitleText.destroy();
            TitleText = game.add.text(game.world.width / 2, game.world.height / 3, TITLE_TEXT, {
                font: '28px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            TitleText.anchor.setTo(0.5, 0.5);

            if (DeveloperCopyrightText) DeveloperCopyrightText.destroy();
            DeveloperCopyrightText = game.add.text(game.world.width - 20, game.world.height - 20, DEVELOPER_COPYRIGHT_TEXT, {
                font: '9px "Press Start 2P"',
                fill: '#423B30',
                stroke: '#FFFFFF',
                strokeThickness: 1,
                align: 'center'
            });
            DeveloperCopyrightText.anchor.setTo(1, 1);


            if (InstructionsText) InstructionsText.destroy();
            InstructionsText = game.add.text(game.world.width / 2, game.world.height - game.world.height / 6, INSTRUCTIONS_TEXT, {
                font: '12px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            });
            InstructionsText.anchor.setTo(0.5, 0.5);

            if (ScoreText) ScoreText.destroy();
            ScoreText = game.add.text(game.world.width / 2, game.world.height / 6, "", {
                font: '20px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            ScoreText.anchor.setTo(0.5, 0.5);

            if (HighScoreTitleText) HighScoreTitleText.destroy();
            HighScoreTitleText = game.add.text(game.world.width / 2, game.world.height / 10, "", {
                font: '24px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            HighScoreTitleText.anchor.setTo(0.5, 0.5);

            if (HighScoreText) HighScoreText.destroy();
            HighScoreText = game.add.text(game.world.width / 2, game.world.height / 2, "", {
                font: '12px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            });
            HighScoreText.anchor.setTo(0.5, 0.5);

            if (PostScoreText) PostScoreText.destroy();
            PostScoreText = game.add.text(game.world.width / 2, game.world.height - game.world.height / 4, "", {
                font: '12px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            });
            PostScoreText.anchor.setTo(0.5, 0.5);
            if (!PostScoreClickArea) PostScoreClickArea = new Phaser.Rectangle(PostScoreText.x - PostScoreText.width * 5, PostScoreText.y - PostScoreText.height, PostScoreText.width + 200, PostScoreText.height * 4);


            if (!comboText) comboText = game.add.bitmapText(10, 100, 'carrier_command','',12);
            comboText.inputEnabled = true;

            if (!goodText) goodText = game.add.bitmapText(10, 100, 'carrier_command','',12);
            goodText.inputEnabled = true;
        }

        //////////////////////
        //Create background //
        //////////////////////
        function createBackground() {
            background = game.add.image(0, 0, 'starfield');
            background.inputEnabled = true;
            background.input.priorityID = 0;
            background.width = CANVAS_WIDTH;

        }

        function createBlackSqr() {
            blackSquare = game.add.sprite(game.world.centerX, game.world.centerY, 'blackSquare');
            blackSquare.anchor.set(0.5);
            blackSquare.scale.setTo(CANVAS_WIDTH, 128);
            blackSquare.alpha = 0;

            game.add.tween(blackSquare).to( { alpha: 0.6 }, 200, Phaser.Easing.Linear.None, true, 0, 0, true);

            blackSquare.onComplete.add(function() {blackSquare.destroy();}, this);
            blackSquare.start();
        }

        /////////////////
        //Create redLine //
        ////////////////
        function createRedLine() {
            if (redLine) {
                redLine.kill();
            }

            redLine = game.add.sprite(BALL_START_POSITION_X, BALL_START_POSITION_Y, 'player');
            redLine.anchor.set(0.5);
            redLine.checkWorldBounds = true;

            game.physics.enable(redLine, Phaser.Physics.ARCADE);

            redLine.body.collideWorldBounds = true;
            redLine.body.bounce.set(1);
            console.log("BALL: " + BALL_START_POSITION_Y);
        }

        ///////////////////
        //Create paddles //
        ///////////////////
        function createPaddles() {
            if (paddleOne && paddleTwo) {
                paddleOne.kill();
                paddleTwo.kill();
            }

            paddleOne = game.add.sprite(getRandomInt(PADDLES_FROM_START_INTERVAL, PADDLES_FROM_END_INTERVAL), BALL_START_POSITION_Y, 'enemy');
            paddleOne.anchor.set(0.5);
            paddleTwo = game.add.sprite(paddleOne.position.x + getRandomInt(PADDLES_MIN_INTERVAL, PADDLES_MAX_INTERVAL),
                BALL_START_POSITION_Y, 'enemy');
            paddleTwo.anchor.set(0.5);

            rectangleBetween = new Phaser.Rectangle(paddleOne.x, paddleOne.y - paddleOne.height / 2, paddleTwo.x - paddleOne.x, paddleOne.height);
            console.log("PADDLES: " + BALL_START_POSITION_Y);
        }

        //////////////////
        //Create Sounds //
        //////////////////
        function createSounds() {
            toogleSoundButton = game.add.button(10,10, 'soundButton', toogleSound, this, 0, 0, 1);

            if (isSoundEnabled)
            toogleSoundButton.setFrames(0, 0, 1);
            else toogleSoundButton.setFrames(1, 1, 0);

            introMusic = game.add.audio('intro');
            goodSnd    = game.add.audio('good');
            badSnd     = game.add.audio('bad');
            selectSnd  = game.add.audio('select');
            gameMusic  = game.add.audio(MusicList[getRandomInt(0, 2)], true, true);
        }

        var game = new Phaser.Game(CANVAS_WIDTH,  CANVAS_HEIGHT, Phaser.AUTO, 'game');
        game.state.add('Boot', BootgameState, false);
        game.state.add('Preloader', PreloadergameState, false);
        game.state.add('gameState', gameState, false);
        game.state.add('MainMenu', MainMenuState, false);
        game.state.add('gameOver', gameOverState, false);
        game.state.add('chooseSkin', ChooseSkinState, false);
        game.state.start('Boot');


    };
    WebFont.load({
        google: {
            families: ['Press+Start+2P']
        },
        active: function() {
            gameInitialize();
        }
    });
})();

