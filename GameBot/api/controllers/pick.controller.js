const PickStrategyFactory = require('../services/pickStrategyFactory.service');
const appInsights = require("applicationinsights");

const pick = async (req, res) => {
    var matchId = req.body.MatchId;
    var player1Name = req.body.Player1Name;
    var turn = req.body.Turn;
    if (player1Name == undefined || matchId == undefined) {
        res.status(400);
        res.send("Player1NamerId or MatchId undefined");
        return;
    }

    var strategyOption = process.env.PICK_STRATEGY || "RANDOM";
    var result = pickFromStrategy(strategyOption);
    
    if (process.env.CUSTOM_STRATEGY) {

        console.log('Custom Stratetgy check :: against ' + player1Name + ',  turn: ' + turn);
        // TODO: implement custom arcade intelligence here, see also ./GameBot/README.md for sample requests    
        if (player1Name == "Brain"  ) {
            strategyOption = "CUSTOM";
            result.text = "paper";            
         
        }else if (player1Name == "Kye" && turn > 0) {
            strategyOption = "CUSTOM";
            var prevTurnKyeMove = req.body.TurnsPlayer1Values[0];
            console.log('Custom Stratetgy  :: against ' + player1Name + ',  prev turn: ' + prevTurnKyeMove);            
            result.text = "rock";            
        }
    }    

    console.log('Against ' + player1Name + ', strategy ' + strategyOption + '  played ' + result.text);

    const applicationInsightsIK = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    if (applicationInsightsIK) {
        if (appInsights && appInsights.defaultClient) {
            var client = appInsights.defaultClient;
            client.commonProperties = {
                strategy: strategyOption
            };
            client.trackEvent({
                name: "pick", properties:
                    { matchId: matchId, strategy: strategyOption, move: result.text, player: player1Name, bet: result.bet }
            });
        }
    }
    res.send({ "Move": result.text, "Bet": result.bet });
};

const pickFromStrategy = (strategyOption) => {
    const strategyFactory = new PickStrategyFactory();

    strategyFactory.setDefaultStrategy(strategyOption);
    const strategy = strategyFactory.getStrategy();
    return strategy.pick();
}

module.exports = {
    pick,
}
