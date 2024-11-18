class Game {
}

class Team {
}

let teams = {};
let games = [];

let winners = [];
let losers = [];

let player_scores = {};
let player_scores_max = {};

document.addEventListener('DOMContentLoaded', () => {    
    load();
});

async function load() {
    await display_games(winners, losers, games, teams);
    await loadData(winners, losers, games);
}

async function get_ESPN_teams_endpoints() {
    let response = await fetch('https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams?limit=32');
    let responsejson = await response.json();
    let str = JSON.stringify(responsejson);
    let jsonData = JSON.parse(str);

    return jsonData;
}

async function get_ESPN_team_data(url) {
    let response = await fetch(url);
    let responsejson = await response.json();
    let str = JSON.stringify(responsejson);
    let jsonData = JSON.parse(str);

    return jsonData;
}

async function get_ESPN_data() {
    let response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    let responsejson = await response.json();
    let str = JSON.stringify(responsejson);
    let jsonData = JSON.parse(str);

    return jsonData;
}

async function display_games(winners, losers, games, teams) {
    let team_json = await get_ESPN_teams_endpoints();

    let items = team_json["items"];

    items.forEach(async function (item, index) {
        let url = item["$ref"];
        let team_data = await get_ESPN_team_data(url);

        let team = new Team;

        team.id = team_data["id"];
        team.abbreviation = team_data["abbreviation"];
        team.logo_url = team_data["logos"][0]["href"];

        teams[team.id] = team;
    });

    let json = await get_ESPN_data();

    var game_wrapper = document.createElement("div");
    game_wrapper.setAttribute("class", "game_wrapper");

    let events = json["events"];

    for (let i = 0; i < events.length; i++) {
        let game = new Game();

        game.date = new Date(events[i]["date"])

        let status = events[i]["status"];
        let status_type = status["type"];
        game.completed = status_type["completed"];
        game.status = status_type["shortDetail"];

        let competition = events[i]["competitions"][0];
        let competitors = competition["competitors"];

        competitors.forEach(function (competitor, index) {

            let team = teams[competitor["id"]];

            team.id = competitor["id"];
            team.score = competitor["score"];
            team.home_away = competitor["homeAway"];
            team.display_name = competitor["team"]["shortDisplayName"];

            teams[team.id] = team;

            if (competitor["homeAway"] == "home") {
                game.home_team = team.id;
            } else {
                game.away_team = team.id;
            }

            if (competitor["winner"] != null) // winner object doesn't exist until game is over
            {
                if (competitor["winner"] == true)
                {
                    winners.push(team.abbreviation);
                }
                else
                {
                    losers.push(team.abbreviation);
                }
            }
        });

        games.push(game);
    }

    // priority
    //   1. games that are not finished
    //   2. game start time (earliest start time at top)
    games.sort(function(x, y) {
        let same_status = (x.completed == true && y.completed == true) || (x.completed == false && y.completed == false);

        if (x.completed == false && y.completed == true) {
            return -1;
        }

        if (same_status && (x.date < y.date)) {
            return -1;
        }
        
        return 1;
    });

    for (let i = 0; i < games.length; i++) {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        var game = document.createElement("div");
        game.setAttribute("class", "game");

        game.innerHTML += "<img " + "class=\"logo" + (games[i].completed ? " logo_game_completed" : "") + "\"" + " src=\"" + teams[games[i].away_team].logo_url + "\">" + teams[games[i].away_team].display_name + " <span class=\"score\">" + teams[games[i].away_team].score + "</span>";
        game.innerHTML += " <span class=\"game_status\">" + games[i].status + "</span> ";
        game.innerHTML += "<span class=\"score\">" + teams[games[i].home_team].score + "</span>" + "<img " + "class=\"logo" + (games[i].completed ? " logo_game_completed" : "") + "\"" + " src=\"" + teams[games[i].home_team].logo_url + "\">" + teams[games[i].home_team].display_name;

        game_wrapper.appendChild(game);
    }

    document.body.appendChild(game_wrapper);
}

async function get_picks_data() {
    let response = await fetch('./data.txt');
    let responsejson = await response.json();
    let str = JSON.stringify(responsejson);
    let jsonData = JSON.parse(str);

    return jsonData;
}

async function loadData(winners, losers, games) {
    var json = await get_picks_data();
    //console.log(json);

    var dataDiv = document.createElement("div");
    document.body.appendChild(dataDiv);

    var table = document.createElement("table");
    dataDiv.appendChild(table);

    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    let players_row = document.createElement("tr");
    tbody.appendChild(players_row);

    let pick_title = document.createElement("td")
    players_row.appendChild(pick_title);
    pick_title.innerHTML = "<font>Pick</font>";

    for (let player in json) {
        let player_name = document.createElement("td")
        players_row.appendChild(player_name);
        player_name.innerHTML = "<font>"+ player + "</font>";
    }

    for (let i = 0; i < games.length; i++) {
        let pick_row = document.createElement("tr");
        tbody.appendChild(pick_row);

        for (let player in json) {
            let pick_td = document.createElement("td")
            pick_row.appendChild(pick_td);

            let pick = Object.keys(player)[i];
            let score = player[pick];
            pick_td.innerHTML = "<font>"+ pick + " - " + score + "</font>";
        }
    }

    /*
    const abbrevs = json[player][0].keys;

    for (let i = 0; i < abbrevs.length; i++) {
        let picks_row = document.createElement("tr");

        for (let player in json)
        {
            let picks = json[player];
            let pick_value = picks[abbrevs[i]];

            let td = 
        }
    }     
        */

    /*
    for (let i = 0; i < games.length; i++) {
        var tr = document.createElement("tr");
        tbody.appendChild(tr);

        for (let player in json) {
            //dataDiv.innerHTML += "<b>" + player + "</b>";
            //dataDiv.innerHTML += "<br/>";

            var td = document.createElement("td");
            tr.appendChild(td);

            let scores = json[player];
            for (let pick in scores) {
                let font_color = "black";

                if (player_scores_max[player] == null)
                {
                    player_scores_max[player] = 0;
                }

                if (player_scores[player] == null)
                {
                    player_scores[player] = 0;
                }

                if (winners.includes(pick)) {
                    font_color = "green";

                    player_scores[player] = player_scores[player] + scores[pick];
                    player_scores_max[player] = player_scores_max[player] + scores[pick];     
                }
                else if (losers.includes(pick))
                {
                    font_color = "red";
                }
                else
                {
                    player_scores_max[player] = player_scores_max[player] + scores[pick];
                }

                td.innerHTML += "<font color=\"" + font_color + "\">" + pick + " - " + scores[pick] + "</font>";
                //dataDiv.innerHTML += "<br/>";
            }
        }

        dataDiv.innerHTML += "Total" + " = " + player_scores[player];
        dataDiv.innerHTML += "<br/>";
        dataDiv.innerHTML += "Total Possible" + " = " + player_scores_max[player];
        dataDiv.innerHTML += "<br/><br/>";
    }

    document.body.appendChild(dataDiv);
    */
}