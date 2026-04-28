import json
import pandas as pd
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from PIL import Image
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, TIT2, TPE1, TALB, COMM
import re
import requests
import os
import unicodedata


def load_data(fileName):
    # Charger le JSON   --> data est une liste de dictionnaires
    f = open(fileName, "r", encoding="utf-8")
    data = json.load(f)

    # Convertir en DataFrame
    df = pd.DataFrame(data)

    # Transformer la colonne 'tracks' en colonnes
    df = pd.json_normalize(df["tracks"])

    return df


def normalize(text):
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8").lower()


def resize_image_to_square(coverDestination):

    # ouvrir l'image
    img = Image.open(coverDestination)

    width, height = img.size

    # dimension du carré (le plus petit côté)
    new_size = min(height, width)

    # calcul du crop centré
    left = (width - new_size) // 2
    top = (height - new_size) // 2
    right = left + new_size
    bottom = top + new_size

    # rogner
    img_cropped = img.crop((left, top, right, bottom))

    # sauvegarder
    img_cropped.save(coverDestination)





def clean_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name)


def saveAudio(filepath_mp3, track, artist, album, ytName):
    audio = MP3(filepath_mp3, ID3=ID3)

    # créer les tags si inexistants
    if audio.tags is None:
        audio.add_tags()

    # supprimer anciens tags pour éviter doublons
    audio.tags.delall("TIT2")  # titre
    audio.tags.delall("TPE1")  # artiste
    audio.tags.delall("TALB")  # album
    audio.tags.delall("COMM")  # commentaire

    # ajouter les nouveaux
    audio.tags.add(TIT2(encoding=3, text=track))
    audio.tags.add(TPE1(encoding=3, text=artist))
    audio.tags.add(TALB(encoding=3, text=album))

    audio.tags.add(
        COMM(
            encoding=3,
            lang='XXX',
            desc='',
            text=f"Texte d'origine :\n{ytName}"
        )
    )

    # print(audio.tags.pprint())
    audio.save(v2_version=3, v1=2)



def download_cover_from_link(link, artist, album, coverDestinationPath):
    video_id = link.split("v=")[1].split("&")[0]
    thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
    response = requests.get(thumbnail_url)

    rawFilename = f"{artist} - {album}.jpg"
    coverFileName = clean_filename(rawFilename)

    if (('[' in coverFileName) or ('\\' in coverFileName) or ('/' in coverFileName)
        or ('*' in coverFileName) or ('?' in coverFileName) or (':' in coverFileName)
            or ('"' in coverFileName) or ('<' in coverFileName) or ('>' in coverFileName)
                or ('|' in coverFileName) or (']' in coverFileName) or (len(coverFileName) == 0)):
        
        result = False

    else:
        coverDestination = f"{coverDestinationPath}/{coverFileName}"

        if not(os.path.exists(coverDestination)):
            print("Téléchargement de la pochette de l'album...")
            with open(coverDestination, "wb") as f:
                f.write(response.content)

            resize_image_to_square(coverDestination)
        
        else:
            print("Pochette de l'album déjà téléchargée.")

        result = True

    return result, coverFileName


# coverDestinationPath = f"E:/Covers"

# link = "https://www.youtube.com/watch?v=ORam68OtcmY"
# artist = "-M-"
# album = "Je Dis Aime"
# result, coverFileName = download_cover_from_link(link, artist, album, coverDestinationPath)

# print(result, coverFileName)