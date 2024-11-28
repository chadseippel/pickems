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
let player_scores_imaginary = {};

let all_picks = {};
let team_abbrev_to_id_map = {};

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

    for (let i = 0; i < items.length; i++) {
        let item = items[i];

        let url = item["$ref"];

        if (url.startsWith("http://"))
        {
            url = url.replace("http://", "https://");
        }

        let team_data = await get_ESPN_team_data(url);

        let team = new Team;

        team.id = team_data["id"];
        team.abbreviation = team_data["abbreviation"];
        team.logo_url = team_data["logos"][0]["href"];

        teams[team.id] = team;

        team_abbrev_to_id_map[team.abbreviation] = team.id;
    }

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
    let response = await fetch('/data/week13.txt');
    let responsejson = await response.json();
    let str = JSON.stringify(responsejson);
    let jsonData = JSON.parse(str);

    all_picks = jsonData;
}

async function loadData(winners, losers, games) {
    await get_picks_data();

    var dataDiv = document.createElement("div");
    document.body.appendChild(dataDiv);

    var table = document.createElement("table");
    dataDiv.appendChild(table);

    var tbody = document.createElement("tbody");
    table.appendChild(tbody);
    table.style.textAlign = "center"; 
    table.style.width = "100%";

    let players_row = document.createElement("tr");
    tbody.appendChild(players_row);

    let total = document.createElement("td")
    players_row.appendChild(total);

    for (let player in all_picks) {
        let player_name = document.createElement("td")
        players_row.appendChild(player_name);
        player_name.innerHTML = "<font class=\"player_title\">"+ player + "</font>";
    }

    for (let i = 0; i < games.length; i++) {
        let pick_row = document.createElement("tr");
        tbody.appendChild(pick_row);

        let matchup = find_game_for_pick(i);
        const teams = matchup.split('@');
        let home = teams[0];
        let away = teams[1];

        let matchup_cell = document.createElement("td");
        pick_row.appendChild(matchup_cell);

        let on_click_home = `onclick=\"calculate_imaginary_score(\'${home}\')\"`;
        let on_click_away = `onclick=\"calculate_imaginary_score(\'${away}\')\"`;

        matchup_cell.innerHTML = "<span " + on_click_away + ">" + away + "</span>" + " @ " + "<span " + on_click_home + ">" + home + "</span>";

        let count = 0;
        for (let player in all_picks) {

            let pick_td = document.createElement("td")
            pick_row.appendChild(pick_td);

            let player_picks = all_picks[player];
            let pick = Object.keys(player_picks)[i];
            let score = player_picks[pick];

            if (player_scores_max[player] == null) {
                player_scores_max[player] = 0;
            }

            if (player_scores[player] == null) {
                player_scores[player] = 0;
            }

            if (player_scores_imaginary[player] == null) {
                player_scores_imaginary[player] = 0;
            }

            let pick_class = "";
            let cell_class = "";

            if (count % 2 == 0) {
                cell_class += "even_cell";
            } else {
                cell_class += "odd_cell";
            }

            count = count + 1;

            if (winners.includes(pick)) {
                pick_class = " correct_pick"

                player_scores[player] = player_scores[player] + score;
                player_scores_max[player] = player_scores_max[player] + score;
                player_scores_imaginary[player] = player_scores_imaginary[player] + score;
            }
            else if (losers.includes(pick))
            {
                pick_class = " wrong_pick";
            }
            else
            {
                player_scores_max[player] = player_scores_max[player] + score;
            }

            pick_td.classList.add(cell_class);
            pick_td.innerHTML = "<font class=\"" + pick_class + "\">" + pick + " - " + score + "</font>";
        }
    }

    let total_row = document.createElement("tr");
    tbody.appendChild(total_row);

    let total_title = document.createElement("td");
    total_row.appendChild(total_title);
    total_title.innerHTML = "<font class=\"total_score_title\">"+ "Total" + "</font>";

    for (let player in all_picks) {
        let total = document.createElement("td");
        total_row.appendChild(total);

        total.innerHTML = "<font id=\"" + player + "\"" + "class=\"total_score\">"+ player_scores[player] + "</font>";
    }

    let total_possible_row = document.createElement("tr");
    tbody.appendChild(total_possible_row);

    let total_possible_title = document.createElement("td");
    total_possible_row.appendChild(total_possible_title);
    total_possible_title.innerHTML = "<font class=\"total_possible_title\">"+ "Total Possible" + "</font>";

    for (let player in all_picks) {
        let total = document.createElement("td");
        total_possible_row.appendChild(total);

        total.innerHTML = "<font class=\"total_possible\">"+ player_scores_max[player] + "</font>";
    }
}

function calculate_imaginary_score(abbrev) {

    for (let player in all_picks) {
        let player_picks = all_picks[player];
        let score = player_picks[abbrev];

        if (score) {
            player_scores_imaginary[player] += score;
        }
    }

    
    //reload total score
    const total_scores = document.getElementsByClassName("total_score");

    for (let i = 0; i < total_scores.length; i++) {
        total_scores[i].innerText = player_scores_imaginary[total_scores[i].id];
        total_scores[i].style.color = "blue";
    }

    // on clicking the matchup winner
    // find all picks with that winner
    // add their points to the players imaginary total
    // replace total with imaginary total
    // change color - blue??

}

function find_game_for_pick(index) {

    let pick = get_team_from_picks(index);

    for (let i = 0; i < games.length; i++) {
        if (teams[games[i].home_team].abbreviation == pick || teams[games[i].away_team].abbreviation == pick) {
            return teams[games[i].away_team].abbreviation + "@" + teams[games[i].home_team].abbreviation;
        }
    }
}

function get_team_from_picks(index) {

    let player = Object.keys(all_picks)[0];
    let player_picks = all_picks[player];
    let pick = Object.keys(player_picks)[index];

    return pick;
}