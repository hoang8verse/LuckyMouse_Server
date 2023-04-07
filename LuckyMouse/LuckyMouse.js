module.exports = class Player {
    constructor(){
        this.id = "";
        this.userAppId = "";
        this.avatar = "";
        this.gender = "";
        this.playerName = "";
        this.room = "";
        this.position = [];
        this.isHost = "";
        this.isStarted = "0";
        this.isSpectator = "0";
        this.playerStatus = "die";
        this.characterIndex = 0;
        this.round = 0;
    }
    
}