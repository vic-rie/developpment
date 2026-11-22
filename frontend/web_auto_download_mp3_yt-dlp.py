import yt_dlp
import os
import pandas as pd
from openpyxl import load_workbook
import shutil

import functions as module


def download_mp3(url, destination_folder, filename):
    output_template = os.path.join(destination_folder, filename + ".%(ext)s")
    # output_template = os.path.join(destination_folder, filename)

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'noplaylist': True,
        'quiet': True,
        'no_warnings': False,

        'js_runtimes': {
            'node': {}
        },

        'remote_components': ['ejs:github'],
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:

            info = ydl.extract_info(url, download=False)
            duration = info.get("duration")
            description = info.get("description")

            # filtrer
            if (duration >= 1800):
                raise ValueError("Durée supérieure à 30 minutes")
            
            elif (('[' in filename) or ('\\' in filename) or ('/' in filename)
                or ('*' in filename) or ('?' in filename) or (':' in filename)
                    or ('"' in filename) or ('<' in filename) or ('>' in filename)
                    or ('|' in filename) or (']' in filename) or (len(filename) == 0)):
                raise ValueError(f"Nom de fichier invalide : {filename}")

            else:
                print("Téléchargement...")
                ydl.download([url])
                
        return True , duration , description

    except Exception as e:
        print("Erreur téléchargement :", e)

        return False, 0, ""
    


# Charger JSON
dfData = module.load_data("tracks.json")

# Lire le fichier Excel
basepath_ = "Users/Elève/Desktop/developpment"
filepath = f"C:/{basepath_}/frontend/url_list.xlsx"
temp_path = f"C:/{basepath_}/frontend/tmp.xlsx"

dfList = pd.read_excel(filepath)
toIgnore = ['YES', 'ERROR']

# Chemin destination du mp3
# mp3DestinationPath = f"C:/{basepath_}/frontend/static/audio"
# mp3DestinationPath = f"E:/Music_provided_to_yt_by"
mp3DestinationPath = f"E:/10h/Music/Music_yt-dlp"




# Initilalisation
start_index = 0
counter = 0
i = 0
ligne = dfList.iloc[i]

errorsInRow = 0

while (ligne["Downloaded ?"] in toIgnore):
    i += 1
    start_index = i
    ligne = dfList.iloc[i]

print("")
print(f"Dernière chanson enregistrée : n° {start_index}")

# Boucle sur les lignes du doc excel 'url_list.xlsx'
for i in range(start_index, len(dfList)):
    # Récupération des infos de la ligne
    ligne = dfList.iloc[i]
    track = ligne["Track"]
    artist = ligne["Artist"]
    url = ligne["url"]

    item = dfData[(dfData["artist"] == artist) & (dfData["track"] == track)]
    album = item["album"].iloc[0]


    # Arrêt forcé en cas de 10 erreurs d'affilé
    if (i > 11):
        errorsInRow = 0
        dfErrors = dfList.iloc[i-10 : i]
        for j in range(i-10, i):
            if (dfErrors.loc[j, 'Downloaded ?'] == 'ERROR'):
                errorsInRow += 1

    if (errorsInRow >= 10):
        raise ValueError("10 erreurs d'affilée   --->   Arrêt du programme.")
    

    if (ligne["Downloaded ?"] not in toIgnore):

        rawFilename = f"{artist} - {track}"
        filename = module.clean_filename(rawFilename)
        
        print("")
        print(f"Titre : {filename}")
        print("Requête...")
        success, duration, description = download_mp3(url, mp3DestinationPath, filename)

        print(f"Durée de l'audio : {round(duration/60, 2)}min")

        if success:
            filepath_mp3 = os.path.join(mp3DestinationPath, filename + ".mp3")
            
            module.saveAudio(filepath_mp3, track, artist, album, description)

            print("MP3 téléchargé")
            dfList.loc[i, 'Downloaded ?'] = 'YES'
        
        else:
            print('ERROR')
            dfList.loc[i, 'Downloaded ?'] = 'ERROR'

        # Charger le classeur existant avec openpyxl
        wb = load_workbook(filepath)

        # Écrire avec pandas tout en réutilisant le workbook
        with pd.ExcelWriter(temp_path, engine='openpyxl', mode='a',
                            if_sheet_exists='overlay') as writer:
            dfList.to_excel(writer, sheet_name=wb.sheetnames[0], index=False)

        # Remplace uniquement si succès
        shutil.copy(temp_path, filepath)

        # Avancée globale
        counter += 1
        print(f"{i+1} morceaux traités / {len(dfList)} liens disponibles")
        print(f"Avancée globale : {round((i/len(dfData))*100, 2)} %")
        print("Morceaux traités pendant cette exécution :", counter)
        print(" ")