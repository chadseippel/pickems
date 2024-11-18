import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

install('pandas')
install('openpyxl')

import pandas as pd
import openpyxl as openpyxl
import math as math
import json
import os

def read_matchups_for_person(data, column, all_picks, player):
    person_picks = {}
    column_name = "Unnamed: {0}".format(column)
    for index, row in data.iterrows():
        #print(row["Unnamed: 0"], row[column_name])
        if (math.isnan(row[column_name]) == False):
            #print(row[column_name])
            person_picks[row["Unnamed: 0"]] = row[column_name]

    #print(person_picks)
    all_picks[player] = person_picks

def replace_team_name_shorthand(data):
    data.replace('Bills', 'BUF', inplace=True)
    data.replace('Commanders', 'WSH', inplace=True)
    data.replace('Eagles', 'PHI', inplace=True)
    data.replace('Packers', 'GB', inplace=True)
    data.replace('Jags', 'JAX', inplace=True)
    data.replace('Vikings', 'MIN', inplace=True)
    data.replace('Titans', 'TEN', inplace=True)
    data.replace('Raiders', 'LV', inplace=True)
    data.replace('Rams', 'LAR', inplace=True)
    data.replace('Pats', 'NE', inplace=True)
    data.replace('Browns', 'CLE', inplace=True)
    data.replace('Saints', 'NO', inplace=True)
    data.replace('Colts', 'IND', inplace=True)
    data.replace('Ravens', 'BAL', inplace=True)
    data.replace('Steelers', 'PIT', inplace=True)
    data.replace('Falcons', 'ATL', inplace=True)
    data.replace('Broncos', 'DEN', inplace=True)
    data.replace('Seahawks', 'SEA', inplace=True)
    data.replace('Niners', 'SF', inplace=True)
    data.replace('Chiefs', 'KC', inplace=True)
    data.replace('Bengals', 'CIN', inplace=True)
    data.replace('Chargers', 'LAC', inplace=True)
    data.replace('Texans', 'HOU', inplace=True)
    data.replace('Cowboys', 'DAL', inplace=True)
    data.replace('Giants', 'NYG', inplace=True)
    data.replace('Cards', 'ARI', inplace=True)
    data.replace('Bucs', 'TB', inplace=True)
    data.replace('Panthers', 'CAR', inplace=True)
    data.replace('Lions', 'DET', inplace=True)
    data.replace('Dolphins', 'MIA', inplace=True)
    data.replace('Jets', 'NYJ', inplace=True)


sheet = pd.read_excel('picks.xlsx')
#print(sheet)

column0 = sheet['Unnamed: 0']
#print(column0)

current_week = sheet[sheet['Unnamed: 0'] == 'WEEK 11']
current_week = current_week.index.values[0]
#print (current_week)

next_week = sheet[sheet['Unnamed: 0'] == 'WEEK 12']
next_week = next_week.index.values[0]
#print(next_week)

#week_data = sheet.iloc[[current_week.index.values.astype(int)[0], next_week.index.values.astype(int)[0]]]
#week_data = sheet.iloc[406, 403]
week_data = sheet[current_week: next_week]

#print(week_data)

teams = {"Bills", "Dolphins", "Pats", "Jets", "Ravens", "Bengals", "Browns", "Steelers" , "Texans", "Colts", "Jags",
         "Titans", "Broncos", "Raiders", "Chargers", "Cowboys", "Giants", "Eagles", "Commanders", "Bears", "Lions", "Packers",
         "Vikings", "Falcons", "Panthers", "Saints", "Bucs", "Cards", "Rams", "Niners", "Seahawks", "Chiefs"}

players = ["Ron","Danny","Tom","Team","Rick","Leslie","Heather & PJ","Tyler","Denny","Nick","Nick E","Ray","Sue","Kurt (Deuce)",
                  "Randy","Alex","Kurt","Chelsea","Chad","Sally","Emma","Sarah","Steve","Paul"]

#week_data = week_data.rename(columns={"Unnamed: 0 ": "Matchup", "Unnamed: 2": "Ron"})

week_data = week_data[week_data["Unnamed: 0"].isin(teams)]
replace_team_name_shorthand(week_data)
#print(week_data)

#print(week_data.columns[0])
#week_row = df.loc[df['Unnamed: 0'] == 'Week 11']
#print(week_row)

all_picks = {}

number_of_players = len(players)

for i in range(number_of_players):
    #print(players[i])
    read_matchups_for_person(week_data, i+2, all_picks, players[i])

print(all_picks)

json = json.dumps(all_picks)

os.remove('data.txt')

with open('data.txt', 'a') as f:
    print(json, file=f)