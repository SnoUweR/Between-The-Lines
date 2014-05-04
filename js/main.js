// "Дизайн" данного кода основан на коде игры Flappy Bird из этой статьи http://habrahabr.ru/post/214013/

(function() {
    var gameInitialize = function gameInitialize() {

        ///////////////////
        //GAME CONSTANTS //
        ///////////////////

        var CANVAS_WIDTH = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth,
        CANVAS_HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;

        if (CANVAS_WIDTH > 720) {
            CANVAS_WIDTH = 720;
        }

        if (CANVAS_HEIGHT > 640) {
            CANVAS_HEIGHT = 640;
        }

        var STARTING_SPEED = 500,
            PADDLES_MAX_INTERVAL = 100,
            PADDLES_MIN_INTERVAL = 25,
            PADDLES_FROM_START_INTERVAL = 50,
            PADDLES_FROM_END_INTERVAL = CANVAS_WIDTH - 105,
            TITLE_TEXT = "BETWEEN THE LINES",
            INSTRUCTIONS_TEXT = "CLICK WHEN RED LINE IS BETWEEN THE GREEN LINES",
            HIGHSCORE_TITLE = "HIGHSCORES",
            HIGHSCORE_SUBMIT = "POST SCORE",
            DEVELOPER_COPYRIGHT_TEXT = "Developer\nVladislav Kovalev\nsnouwer@gmail.com",
            LOADING_TEXT = "LOADING...",
            GOOD_TEXT = ["AWESOME", "INCREDIBLE", "UNBELIEVABLE", "NICE", "COOL", "GREAT", "BEAUTIFUL"];



        /////////////////////////////////////////////
        //HELPER VARIABLES FOR SAVING GAME-OBJECTS //
        /////////////////////////////////////////////

        var ball, paddleOne, paddleTwo;
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

        /////////////////////////////////////
        //VARIABLES FOR SAVING GAME-STATES //
        /////////////////////////////////////

        var gameState = new Phaser.State();
        var BootgameState = new Phaser.State();
        var PreloadergameState = new Phaser.State();
        var gameOverState = new Phaser.State();
        var MainMenuState = new Phaser.State();

        /////////////////////
        //HELPER FUNCTIONS //
        /////////////////////

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function createPaddles() {
            if (paddleOne && paddleTwo) {
                paddleOne.kill();
                paddleTwo.kill();
            }

            paddleOne = game.add.sprite(getRandomInt(PADDLES_FROM_START_INTERVAL, PADDLES_FROM_END_INTERVAL), game.world.centerY, 'enemy');
            paddleOne.anchor.set(0.5);
            paddleTwo = game.add.sprite(paddleOne.position.x + getRandomInt(PADDLES_MIN_INTERVAL, PADDLES_MAX_INTERVAL),
                game.world.centerY, 'enemy');
            paddleTwo.anchor.set(0.5);
        }

        function loadAssets() {

            game.load.image('starfield', './img/starfield.jpg');
            game.load.image('enemy', './img/enemy.png');
            game.load.image('particle', './img/particle.png');
            game.load.image('player', './img/player.png');
            game.load.audio('good', './sounds/good.wav');
            game.load.audio('bad', './sounds/bad.wav');
            game.load.audio('music', './sounds/musicTrimmed.ogg');
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
                comboText.x = ball.position.x;
                comboText.y = ball.position.y;
                comboText.setText("COMBO X" + comboCount);
                comboBounce.to({ y: CANVAS_HEIGHT, alpha: 0 }, 2000, Phaser.Easing.Linear.None);
                comboBounce.onComplete.add(function() {comboText.setText("");}, this);
                comboBounce.start();
                gameScore += (100 - (paddleTwo.position.x - paddleOne.position.x)) * comboCount;
            }

            gameScore += 100 - (paddleTwo.position.x - paddleOne.position.x)

            ScoreText.setText(gameScore);
        }


        function showText() {
            goodText.alpha = 100;
            goodText.x = ball.position.x;
            goodText.y = ball.position.y;
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


        function startGame(){
            if (!isStarted) {
                ball.position.x = 25;
                ball.position.y = game.world.centerY;
                createPaddles();
                ball.body.velocity.x = STARTING_SPEED;
                isStarted = true;
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

        /////////////////////
        //EVENTS CALLBACKS //
        /////////////////////

        function clicked() {
            if (isStarted) {
                if (ball.position.x < paddleTwo.position.x && ball.position.x > paddleOne.position.x) {
                    if (isSoundEnabled) goodSnd.play();
                    createPaddles();
                    ball.body.velocity.x = Math.abs(ball.body.velocity.x) + 25;
                    if (paddleOne.position.x - ball.position.x < 0)
                    {
                        ball.body.velocity.x = Math.abs(ball.body.velocity.x) * -1;
                    }

                    addScore();
                    showText();
                    emitter.x = ball.position.x;
                    emitter.y = ball.position.y;
                    emitter.start(true, 2000, null, 25);

                }
                else {
                    if (isSoundEnabled) badSnd.play();
                    game.state.start('gameOver', false, false);
                }
            }
        }

        ////////////////////////////////////////////
        //State - Bootgame (Loading text appears) //
        ////////////////////////////////////////////
        BootgameState.create = function () {
            LoadingText = game.add.text(game.world.width / 2, game.world.height / 2, "LOADING...", {
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            LoadingText.anchor.setTo(0.5, 0.5);

            game.state.start('Preloader', false, false);
        };

        //////////////////////////////////////
        //State - Preloader (Loading Assets)//
        //////////////////////////////////////
        PreloadergameState.preload = function () {
            loadAssets();
        };

        PreloadergameState.create = function () {
            var tween = game.add.tween(LoadingText).to({
                alpha: 0
            }, 1000, Phaser.Easing.Linear.None, true);

            tween.onComplete.add(function () {
                game.state.start('MainMenu', false, false);
            }, this);
        };

        //////////////////////
        //State - Main Menu //
        //////////////////////
        MainMenuState.create = function() {

            createBackground();
            createTexts();
            createSounds();
            background.events.onInputDown.add(click);
            function click() {
                    introMusic.stop();
                    background.events.onInputDown.remove(click);
                    game.state.start('gameState', false, false);
            }

            isScorePosted = false;
            gameScore = 0;
            comboCount = 0;
            TitleText.setText(TITLE_TEXT);
            DeveloperCopyrightText.setText(DEVELOPER_COPYRIGHT_TEXT);
            InstructionsText.setText(INSTRUCTIONS_TEXT);
            ScoreText.setText("");
            comboText.setText("");
            HighScoreTitleText.setText("");
            HighScoreText.setText("");
            PostScoreText.setText("");

            introMusic.stop();
            if (isSoundEnabled) introMusic.play();

        };

        /////////////////////////////////////
        //game state - Where game is going //
        /////////////////////////////////////
        gameState.create = function () {
            game.physics.startSystem(Phaser.Physics.ARCADE);

            createPaddles();
            createBall();

            background.events.onInputDown.add(clicked, this);

            emitter = game.add.emitter(0, 0, 100);
            emitter.makeParticles('particle');
            emitter.gravity = 200;
            startGame();

            TitleText.setText("");
            DeveloperCopyrightText.setText("");

            InstructionsText.setText("");
            HighScoreTitleText.setText("");
            HighScoreText.setText("");
            PostScoreText.setText("");
            ScoreText.setText(gameScore);
            comboBounce=game.add.tween(comboText);
            goodBounce=game.add.tween(goodText);
            gameMusic.stop();
            if (isSoundEnabled) gameMusic.play();

        };

        gameState.update = function () {
          if (ball.body.blocked.left || ball.body.blocked.right)
          {
              comboCount = 0;
          }
        };

        //////////////////////////////////
        //State which show on game Over //
        //////////////////////////////////
        gameOverState.create = function () {

            ball.body.velocity.setTo(0, 0);
            isStarted = false;
            background.events.onInputDown.remove(clicked);
            getScore();

            //setTimeout(function () {
            background.events.onInputDown.add(HighScoreStateClick, this);
           // }, 1000);

            TitleText.setText("");
            DeveloperCopyrightText.setText("");
            InstructionsText.setText("");
            ScoreText.setText("YOUR SCORE: " + gameScore);
            PostScoreText.setText(HIGHSCORE_SUBMIT);
            HighScoreTitleText.setText(HIGHSCORE_TITLE);
            HighScoreText.setText(LOADING_TEXT);
            gameMusic.stop();
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
                PostScoreText.setText("");
                comboText.setText("");
                isScorePosted = true;
            } else {
                game.input.onDown.remove(HighScoreStateClick);
                game.state.start('MainMenu', false, false);
            }
        }

        function createTexts() {
            TitleText = game.add.text(game.world.width / 2, game.world.height / 3, TITLE_TEXT, {
                font: '28px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            TitleText.anchor.setTo(0.5, 0.5);

            DeveloperCopyrightText = game.add.text(game.world.width - 20, game.world.height - 20, DEVELOPER_COPYRIGHT_TEXT, {
                font: '9px "Press Start 2P"',
                fill: '#423B30',
                stroke: '#FFFFFF',
                strokeThickness: 1,
                align: 'center'
            });
            DeveloperCopyrightText.anchor.setTo(1, 1);


            InstructionsText = game.add.text(game.world.width / 2, game.world.height - game.world.height / 6, INSTRUCTIONS_TEXT, {
                font: '12px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            });
            InstructionsText.anchor.setTo(0.5, 0.5);

            ScoreText = game.add.text(game.world.width / 2, game.world.height / 6, "", {
                font: '20px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            ScoreText.anchor.setTo(0.5, 0.5);

            HighScoreTitleText = game.add.text(game.world.width / 2, game.world.height / 10, "", {
                font: '24px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            HighScoreTitleText.anchor.setTo(0.5, 0.5);

            HighScoreText = game.add.text(game.world.width / 2, game.world.height / 2, "", {
                font: '12px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            });
            HighScoreText.anchor.setTo(0.5, 0.5);

            PostScoreText = game.add.text(game.world.width / 2, game.world.height - game.world.height / 4, "", {
                font: '12px "Press Start 2P"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            });
            PostScoreText.anchor.setTo(0.5, 0.5);
            PostScoreClickArea = new Phaser.Rectangle(PostScoreText.x - PostScoreText.width * 5, PostScoreText.y - PostScoreText.height, PostScoreText.width + 200, PostScoreText.height * 4);


            comboText = game.add.bitmapText(10, 100, 'carrier_command','',12);
            comboText.inputEnabled = true;

            goodText = game.add.bitmapText(10, 100, 'carrier_command','',12);
            goodText.inputEnabled = true;
        }



        //////////////////////
        //Create background //
        //////////////////////
        function createBackground() {
            background = game.add.sprite(0, 0, 'starfield');
            background.inputEnabled = true;
            background.input.priorityID = 0;
        }

        /////////////////
        //Create ball //
        ////////////////
        function createBall() {
            ball = game.add.sprite(25, game.world.centerY, 'player');
            ball.anchor.set(0.5);
            ball.checkWorldBounds = true;

            game.physics.enable(ball, Phaser.Physics.ARCADE);

            ball.body.collideWorldBounds = true;
            ball.body.bounce.set(1);
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
            goodSnd = game.add.audio('good');
            badSnd = game.add.audio('bad');
            selectSnd = game.add.audio('select');
            gameMusic = game.add.audio('music', true, true);
        }

        var game = new Phaser.Game(CANVAS_WIDTH,  CANVAS_HEIGHT, Phaser.AUTO, 'game');
        game.state.add('Boot', BootgameState, false);
        game.state.add('Preloader', PreloadergameState, false);
        game.state.add('gameState', gameState, false);
        game.state.add('MainMenu', MainMenuState, false);
        game.state.add('gameOver', gameOverState, false);
        game.state.start('Boot');

        Clay.ready(function () {
            Leaderboard = new Clay.Leaderboard({
                id: 3820
            });
        });
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

