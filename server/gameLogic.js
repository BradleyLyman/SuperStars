var
  path        = require( 'path' ),
  randomColor = require( 'randomcolor' ),

  stateMap = {
    userIndex   : 0,
    users       : [],
    timeLeft    : 0,
    io          : {},
    activeStars : [],
    gameState   : 'running' // running or intermission
  },

  configMap = {
    roundInterval        : 10,
    intermissionInterval : 5,
    tickInterval         : 100
  },

  initModule,
  addUser, onGameTick, addStar;

// Begin Public method /initModulel/
// Sets up the game.
//
initModule = function( io ) {
  stateMap.io = io;

  io.on( 'connection', function( socket ){
    var
      userId;

    userId = addUser( socket );

    socket.on( 'newStar', function( star ){
      socket.broadcast.emit( 'newStar', star );
    });

    socket.on( 'disconnect', function() {
      stateMap.users[ userId ] = null;
      console.log( 'user with id: ' + userId + ' disconnected.' );
    });
  });

  setInterval( onGameTick, configMap.tickInterval );
};
// End Public method /initModule/


// Begin Private method /addUser/
// Arguments:
//   socket - websocket used to communicate with the user.
//
addUser = function( socket ) {
  var
    id = stateMap.userIndex;

  stateMap.userIndex += 1;

  stateMap.users[ id ] = {
    color : randomColor({
      format     : 'rgbArray',
      luminosity : 'bright'
    })
  };

  socket.emit( 'setUserColor', stateMap.users[ id ].color );
  console.log(
    'user added, id: ' + id + ' and color ' + stateMap.users[ id ].color
  );

  return id;
};
// End Private method /addUser/


// Begin Private method /onGameTick/
//
onGameTick = function() {
  stateMap.timeLeft -= configMap.tickInterval / 1000.0;

  if ( stateMap.timeLeft <= 0 ) {
    switch ( stateMap.gameState ){
      case 'running':
        stateMap.gameState = 'intermission';
        stateMap.timeLeft  = configMap.intermissionInterval;
        stateMap.io.emit( 'intermission', {} );
        break;

      case 'intermission':
        stateMap.gameState = 'running';
        stateMap.timeLeft  = configMap.roundInterval;
        stateMap.io.emit( 'gameStart', {} );
        break;
    }
  }

  stateMap.io.emit( 'timerUpdate', stateMap.timeLeft );
};
// End Private method /onGameTick/


module.exports = {
  initModule : initModule
};

