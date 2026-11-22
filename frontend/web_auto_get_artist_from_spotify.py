import os
import requests
import pandas as pd
from openpyxl import load_workbook
import shutil
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials


spotify = spotipy.Spotify(
    auth_manager=SpotifyClientCredentials(
        client_id="56212c9c69a14c5a939afde4b66e05f7",
        client_secret="c8d0330fe61a4e72adea93bb9fb5bca1"
    )
)


def clean_filename(name):
    forbidden = '<>:"/\\|?*'
    for char in forbidden:
        name = name.replace(char, "")
    return name.strip()


def download_artist_photo(artistName, destination_folder):

    results = spotify.search(q='artist:' + artistName, type='artist')
    items = results['artists']['items']

    if len(items) > 0:
        try:
            artistData = items[0]
            artistURL = artistData['images'][0]['url']
            artist = artistData['name']

            print(artist, artistURL)

            # filename = clean_filename(f"{artist}.jpg")
            # filepath = os.path.join(destination_folder, filename)

            img_data = requests.get(artistURL).content

            with open(destination_folder, "wb") as f:
                f.write(img_data)

            print(f"Téléchargé : {destination_folder}")
            return True

        except:
            print(f"Aucune photo trouvée pour l'artiste : {artistName}")
            return False
    
    else:
        print(f"Aucune photo trouvée pour l'artiste : {artistName}")
        return False



# Paths
basepath_ = "Users/Elève/Desktop/developpment"
tablePath = f"C:/{basepath_}/frontend/artistsTable.xlsx"
tableTempPath = f"C:/{basepath_}/frontend/artistsTable_temp.xlsx"
artistDestinationPath = f"E:/10h/Image/Artists_from_spotify"

artistsTable = pd.read_excel(tablePath)

# Initilalisation
start_index = 0
i = 0
ligne = artistsTable.iloc[i]


while (((ligne["Photo downloaded ?"] == 'YES')) or (ligne["Photo downloaded ?"] == 'NOT FOUND')) and (i < len(artistsTable)):
    ligne = artistsTable.iloc[i]
    start_index = i
    i += 1

print(f"Dernière photo téléchargée : n° {start_index}")

for i in range(len(artistsTable)):
    # Récupération des données
    ligne = artistsTable.iloc[i]
    artistName = ligne["artist"]

    # Remplir uniquement une ligne non traitée
    if (((ligne["Photo downloaded ?"] != 'YES')) and ((ligne["Photo downloaded ?"] != 'NOT FOUND'))):
        print("")

        photoName = clean_filename(f"{artistName}.jpg")
        artistFullPath = os.path.join(artistDestinationPath, photoName)

        if not(os.path.exists(artistFullPath)):
            print("Requête effectuée sur Spotify :", artistName)
            result = download_artist_photo(artistName, artistFullPath)

            if result:
                artistsTable.loc[i, "Photo downloaded ?"] = 'YES'
            else:
                artistsTable.loc[i, "Photo downloaded ?"] = 'NOT FOUND'

        else:
            print("Pochette déjà téléchargée")
            artistsTable.loc[i, "Photo downloaded ?"] = 'YES'

        
        if (i % 10 == 0):
            # Charger le classeur existant avec openpyxl
            wb = load_workbook(tablePath)

            # Écrire avec pandas tout en réutilisant le workbook
            with pd.ExcelWriter(tableTempPath, engine='openpyxl', mode='a',
                                if_sheet_exists='overlay') as writer:
                artistsTable.to_excel(writer, sheet_name=wb.sheetnames[0], index=False)

            # Remplace uniquement si succès
            shutil.copy(tableTempPath, tablePath)

            # Avancée globale
            print(f"Avancée globale : {round((i/len(artistsTable))*100, 2)} %")
            print("Morceaux traités pendant cette exécution :", i + 1 - start_index)