import os
from flask import Flask, jsonify, render_template, send_from_directory
from mutagen.mp3 import MP3


import functions as module
import counting_tracks as ct



dfDataJSON = module.load_data("tracks.json")
basepath_ = "Users/Elève/Desktop/developpment"
app = Flask(__name__)


if os.path.exists("E:/Music"):
    AUDIO_FOLDER = "E:/Music"  # chemin disque externe
    IMAGES_FOLDER = "E:/Covers"
    timingsPaths = f"C:/{basepath_}/frontend/timings.txt"
else:
    AUDIO_FOLDER = "C:/Users/Elève/Desktop/developpment/frontend/static/audio"  # chemin local
    IMAGES_FOLDER = "C:/Users/Elève/Desktop/developpment/frontend/static/images"
    timingsPaths = f"C:/{basepath_}/frontend/timings_local.txt"


if os.path.exists(timingsPaths):
    print("Utilisation du fichier timings trouvé\n")

    file = open(timingsPaths)

    availableTracks = file.readline().rstrip('\n')
    totalDurationInHours = file.readline().rstrip('\n')
    durations = file.readline().split(";")

    file.close()
else:
    print("Fichier timings non trouvé")
    durations = []


if len(durations) != len(dfDataJSON):   # couvre le cas de la MAJ du fichier JSON + fichier inexistant
    print("Création du fichier timings...")
    ct.countingTracks(timingsPaths, AUDIO_FOLDER, dfDataJSON)

    file = open(timingsPaths)

    availableTracks = file.readline().rstrip('\n')
    totalDurationInHours = file.readline().rstrip('\n')
    durations = file.readline().split(";")
    print("Done")

    file.close()

dfDataJSON['duration'] = durations



# Route pour la page HTML
@app.route("/")
def index():
    return render_template("index.html",
                           totalDurationInHours=totalDurationInHours,
                                availableTracks=availableTracks)


# Route qui renvoie la playlist des fichiers audio contenus dans static/audio
@app.route("/playlist")
def playlist():

    fichiers = []
    for i in range(len(dfDataJSON)):
        ligne = dfDataJSON.iloc[i]

        audioName = f"{ligne['artist']} - {ligne['track']}.mp3"
        fullPath = os.path.join(AUDIO_FOLDER, audioName)

        if os.path.exists(fullPath):
            fichiers.append(f"/audio/{audioName}")
        else:
            fichiers.append("")
    
    return jsonify(fichiers)



@app.route("/tracks")
def get_tracks():
    data = dfDataJSON.to_dict(orient="records")
    return data


@app.route("/audio/<path:filename>")
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)


@app.route('/images/<path:filename>')
def external_images(filename):
    return send_from_directory(IMAGES_FOLDER, filename)








if __name__ == "__main__":
    app.run(debug=True)