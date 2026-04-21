import os
from flask import Flask, jsonify, render_template, send_from_directory
from mutagen.mp3 import MP3


import functions as module

def durationToMinutes(seconds):
    if seconds is None:
        return "--:--"
    minutes = int(seconds // 60)
    sec = int(seconds % 60)
    return f"{minutes}:{sec:02d}"

def durationToHours(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    return f"{hours} h {minutes} min"


dfDataJSON = module.load_data("tracks.json")
basepath_ = "Users/Elève/Desktop/developpment"
app = Flask(__name__)


if os.path.exists("E:/Music"):
    AUDIO_FOLDER = "E:/Music"  # chemin disque externe
    IMAGES_FOLDER = "E:/Covers"
else:
    AUDIO_FOLDER = "C:/Users/Elève/Desktop/developpment/frontend/static/audio"  # chemin local
    IMAGES_FOLDER = "C:/Users/Elève/Desktop/developpment/frontend/static/images"


durations = []
totalDuration = 0
availableTracks = 0

for i in range(len(dfDataJSON)):
    row = dfDataJSON.iloc[i]

    path = f"{AUDIO_FOLDER}/{row['artist']} - {row['track']}.mp3"

    if os.path.exists(path):
        audio = MP3(path)
        durationSeconds = audio.info.length
        duration = durationToMinutes(durationSeconds)

        totalDuration += durationSeconds
        availableTracks += 1
    else:
        duration = durationToMinutes(None)

    durations.append(duration)

dfDataJSON["duration"] = durations


# Route pour la page HTML
@app.route("/")
def index():
    data = dfDataJSON.to_dict(orient="records")
    totalDurationInHours = durationToHours(totalDuration)
    return render_template("index.html")
                            # data=data,
                            #   totalDurationInHours=totalDurationInHours,
                            #     availableTracks=availableTracks)



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