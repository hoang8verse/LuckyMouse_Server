module.exports = class Player {
    constructor(){
        this.id = "";
        this.userAppId = "";
        this.avatar = "";
        this.gender = "";
        this.playerName = "";
        this.room = "";
        this.isHost = "";
        this.isStarted = "0";
        this.isSpectator = "0";
        this.playerStatus = "";
        this.currentPlayerRunId = "";
        this.currentIndex = -1;
        this.maxRound = 0;
    }
    
}